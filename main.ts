// Main orchestrator
import { BrowserManager } from './browser_manager';
import { Authenticator } from './authenticator';
import { ProjectSelector } from './project_selector';
import { WorkbenchLauncher } from './workbench_launcher';
import { PromptCreator } from './prompt_creator';
import { ResponseEvaluator } from './response_evaluator';
import { WorkbenchOrchestrator } from './workbench_orchestrator';
import { FormHandler, MetadataConfig } from './form_handler';
import { getConfig, AutomationConfig } from './config/config';
import { PromptTestData, promptData } from "./data/promptData";
import { PromptConfig } from './types/prompt.types';
import test from 'node:test';

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

    async run(testData: PromptTestData): Promise<void> {
        console.log('\n⏱️  Starting LLM Toolkit Automation...\n');
        const totalStart = Date.now();

        try {


            // Launch browser with saved session
            await this.browser.launch(this.config.headless, true);

            const page = this.browser.getPage();

            await page.goto(`${this.config.project.baseUrl}/dashboard`);

            console.log("Cookies:", await page.context().cookies());
            //console.log("LocalStorage:", await page.evaluate(() => localStorage));
            //console.log("SessionStorage:", await page.evaluate(() => sessionStorage));

            this.workbenchOrchestrator = new WorkbenchOrchestrator(this.browser);

            // Validate session
            const sessionValid = await this.projectSelector.validateSession(
                this.config.project.baseUrl
            );

            if (!sessionValid) {
                throw new Error('Session expired. Run auth.setup.ts again');
            }


            // STEP 1: Navigate to dashboard first
            console.log('📊 Opening dashboard...');

            await page.goto(`${this.config.project.baseUrl}/dashboard`);

            await this.browser.waitForLoader();

            await page.waitForLoadState('networkidle');

            // Wait for loader
            await this.workbenchLauncher.waitForLoader();

            console.log('✓ Dashboard ready');

            // STEP 2: Navigate to project
            await this.projectSelector.navigateToProject(
                this.config.project.projectName,
                this.config.project.baseUrl,
                this.config.project.projectUrl
            );

            // Wait again for loader
            await this.workbenchLauncher.waitForLoader();

            // STEP 3: Launch workbench
            await this.workbenchLauncher.launch();

            // Step 5: Create prompt (abort if failure)
            const created = await this.promptCreator.createPrompt(testData.prompt, true);
            if (!created) {
                throw new Error('Prompt creation failed, aborting automation');
            }

            // Step 6.1: Confirm navigation to workbench page
            await this.workbenchOrchestrator!.verifyUserNavigatedToWorkbench(this.config.project.baseUrl, testData);

            // Step 6.5: Wait for all 5 responses to appear on workbench (wait up to 10 minutes)
            const allResponsesReady = await this.workbenchOrchestrator!.waitForAllResponses(
                testData.expectedBaseResponsesCount,
                600000
            );
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
                const frontierReady = await this.workbenchOrchestrator!.testOnFrontierModels(testData.frontierResponsesCount, 30000)
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

            await this.formHandler.fillMetadata(testData.metadata);
            await this.browser.takeScreenshot('10_metadata_filled');

            // Step 11: Submit Review form
            await this.formHandler.submitForm();
            await this.browser.takeScreenshot('12_form_submitted');

            await this.formHandler.waitForSubmissionConfirmation();
            await this.formHandler.waitForRedirectToCreationPage();

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

    (async () => {

        const orchestrator = new AutomationOrchestrator();

        for (const testData of promptData) {

            console.log(`\n🚀 Running automation for: ${testData.prompt}\n`);

            await orchestrator.run(testData);

        }

    })().catch(console.error);

}