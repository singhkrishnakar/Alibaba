// Main orchestrator
import { BrowserManager } from './browser_manager';
import { Authenticator } from './authenticator';
import { ProjectSelector } from './project_selector';
import { WorkbenchLauncher } from './workbench_launcher';
import { PromptCreator } from './prompt_creator';
import { ResponseEvaluator } from './response_evaluator';
import { WorkbenchOrchestrator } from './workbench_orchestrator';
import { FormHandler, MetadataConfig } from './form_handler';
import { getConfig, AutomationConfig } from './config';

export class AutomationOrchestrator {
    private config: AutomationConfig;
    private browser: BrowserManager;
    private authenticator: Authenticator;
    private projectSelector: ProjectSelector;
    private workbenchLauncher: WorkbenchLauncher;
    private promptCreator: PromptCreator;
    private responseEvaluator: ResponseEvaluator;
    private workbenchOrchestrator: WorkbenchOrchestrator | null = null;
    private formHandler: FormHandler;

    constructor(config?: AutomationConfig) {
        this.config = config || getConfig();
        this.browser = new BrowserManager(this.config.screenshotDir);
        this.authenticator = new Authenticator(this.browser);
        this.projectSelector = new ProjectSelector(this.browser);
        this.workbenchLauncher = new WorkbenchLauncher(this.browser);
        this.promptCreator = new PromptCreator(this.browser);
        this.responseEvaluator = new ResponseEvaluator(this.browser);
        this.formHandler = new FormHandler(this.browser);
    }

    async run(): Promise<void> {
        console.log('\n⏱️  Starting LLM Toolkit Automation...\n');
        const totalStart = Date.now();

        try {
            // Launch browser
            await this.browser.launch(this.config.headless);

            // Initialize WorkbenchOrchestrator after browser is launched
            this.workbenchOrchestrator = new WorkbenchOrchestrator(this.browser);

            // Step 1: Login
            await this.authenticator.login(this.config.credentials, this.config.project.baseUrl);

            // Step 2: Validate session
            const sessionValid = await this.projectSelector.validateSession(this.config.project.baseUrl);
            if (!sessionValid) {
                throw new Error('Session invalid after login');
            }

            // Step 3: Navigate to project (only if necessary)
            await this.projectSelector.navigateToProject(
                this.config.project.projectName,
                this.config.project.baseUrl,
                this.config.project.projectUrl
            );

            // Step 4: Launch workbench
            await this.workbenchLauncher.launch();

            // Step 5: Create prompt (abort if failure)
            const created = await this.promptCreator.createPrompt(this.config.prompt);
            if (!created) {
                throw new Error('Prompt creation failed, aborting automation');
            }

            // Step 6.1: Confirm navigation to workbench page
            await this.workbenchOrchestrator!.verifyUserNavigatedToWorkbench(this.config.project.baseUrl, this.config.prompt);

            // Step 6.5: Wait for all responses to appear on workbench (wait up to 10 minutes)
            const allResponsesReady = await this.workbenchOrchestrator!.waitForAllResponses(10, 600000);
            if (!allResponsesReady) {
                console.log('⚠ Not all responses generated, but continuing with available responses...');
            }

            // Step 6.6: Retrieve and display response data
            await this.workbenchOrchestrator!.getAllResponses();

            // Step 7: Evaluate main-model responses
            await this.responseEvaluator.mark2Incorrect3Correct();
            await this.browser.takeScreenshot('07_responses_marked_specific');

            // record how many responses exist before invoking Frontier
            const beforeFrontierCount = await this.workbenchOrchestrator!.getResponseCount();

            // Step 7.5: Wait for frontier button to be enabled
            const frontierEnabled = await this.workbenchOrchestrator!.waitForFrontierButtonEnabled(15000);
            
            if (frontierEnabled) {
                // Step 7.6: Test on frontier models
                // allow up to 5 minutes for frontier generation
                const frontierReady = await this.workbenchOrchestrator!.testOnFrontierModels(10, 30000);
                if (frontierReady) {
                    // Step 7.7: Retrieve frontier model responses
                    await this.workbenchOrchestrator!.getAllFrontierResponses();
                    await this.browser.takeScreenshot('08_frontier_evaluation_ready');

                    // count new responses added by Frontier
                    const afterFrontierCount = await this.workbenchOrchestrator!.getResponseCount();
                    const newResponses = afterFrontierCount - beforeFrontierCount;
                    if (newResponses > 0) {
                        console.log(`🔁 Marking ${newResponses} new frontier response(s) (indices ${beforeFrontierCount}‑${afterFrontierCount - 1})`);
                        // use offset so we don't re‑touch earlier responses
                        await this.responseEvaluator.mark2Incorrect3Correct(beforeFrontierCount);
                        await this.browser.takeScreenshot('09_frontier_responses_marked');
                    } else {
                        console.log('⚠ No additional responses appeared after frontier run');
                    }
                } else {
                    console.log('⚠ Frontier models did not generate expected responses, continuing with available data...');
                }
            } else {
                console.log('⚠ Frontier button not enabled (may need more incorrect responses), skipping frontier testing...');
            }

            // Step 8: Click Submit to open "Review and Submit models" form
            const opened = await this.formHandler.clickSubmitToOpenReviewForm();
            if (!opened) {
                console.log('  ⚠ Could not open Review form, trying fill anyway...');
            }
            await this.browser.waitForTimeout(2000);
            await this.browser.takeScreenshot('09_review_form_opened');

            // Wait for Review and Submit form to be visible (Final Answer field)
            try {
                const page = this.browser.getPage();
                await page.waitForSelector('text=Final Answer', { timeout: 8000 }).catch(() => { });
            } catch { /* ignore */ }

            // Step 9: Fill metadata (Final Answer, Solution Process, Thinking Process, Answer Unit)
            const metadata: MetadataConfig = {
                finalAnswer: 'The answer is provided',
                solutionProcess: 'Step by step process',
                thinkingProcess: 'Logical reasoning applied',
                answerUnit: 'N/A',
                noUnitRequired: false,
                customKnowledgePoint: 'Custom knowledge point for evaluation'
            };
            await this.formHandler.fillMetadata(metadata);
            await this.browser.takeScreenshot('10_metadata_filled');

            // Step 10: Add custom Knowledge Point (Enter key point -> ADD -> enter text -> Save)
            if (metadata.customKnowledgePoint) {
                await this.formHandler.addKnowledgePoint(metadata.customKnowledgePoint);
                await this.browser.takeScreenshot('11_knowledge_point_added');
                await this.browser.waitForTimeout(1000);
            }

            // Step 11: Submit Review form
            await this.formHandler.submitForm();
            await this.browser.takeScreenshot('12_form_submitted');

            // wait for confirmation notice and eventual redirect back to prompt creation
            const page = this.browser.getPage();
            console.log('🔁 Waiting for submission confirmation message...');
            try {
                await page.waitForSelector('text=Prompt submitted successfully', { timeout: 15000 });
                console.log('  ✓ Confirmation message appeared');
            } catch {
                console.log('  ⚠ Confirmation message not detected within 15s');
            }

            console.log('🔁 Waiting for redirect to prompt creation page...');
            try {
                await page.waitForURL(/prompt\/create/, { timeout: 30000 });
                console.log('  ✓ Redirected to creation page');
            } catch {
                console.log('  ⚠ Did not redirect to creation page within 30s');
            }

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`);
            console.log('🔍 Browser window remains open for analysis... (not closed automatically)');
        } catch (error) {
            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
            console.error(`\n❌ Automation failed after ${totalDuration}s\n`);
            try {
                await this.browser.close();
            } catch (closeErr) {
                console.error(`  ⚠ Failed to close browser: ${closeErr}`);
            }
            throw error;
        } finally {
            // on success: browser left open for inspection; on failure: closed in catch
        }
    }
}

// Run if executed directly
if (require.main === module) {
    const orchestrator = new AutomationOrchestrator();
    orchestrator.run().catch(console.error);
}
