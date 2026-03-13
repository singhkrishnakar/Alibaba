// // Main orchestrator
// import { BrowserManager } from './framework/browser/browserManager';
// import { Authenticator } from './framework/auth/authenticator';
// import { ProjectSelector } from './framework/services/projectSelector';
// import { WorkbenchLauncher } from './workbench_launcher';
// import { PromptCreator } from './framework/services/promptCreator';
// import { ResponseEvaluator } from './framework/services/responseEvaluator';
// import { WorkbenchOrchestrator } from './framework/orchestrators/workbenchOrchestrator';
// import { FormHandler, MetadataConfig } from './framework/services/formHandler';
// import { getConfig, AutomationConfig } from './config/config';
// import { PromptTestData, promptData } from "./data/promptData";
// import { PromptConfig } from './types/prompt.types';
// import test from 'node:test';

// export class AutomationOrchestrator {
//     private config: AutomationConfig;
//     private browser: BrowserManager;
//     private authenticator: Authenticator;
//     private projectSelector: ProjectSelector;
//     private workbenchLauncher: WorkbenchLauncher;
//     private promptCreator: PromptCreator;
//     private responseEvaluator: ResponseEvaluator;
//     private workbenchOrchestrator: WorkbenchOrchestrator | null = null;
//     private formHandler: FormHandler;

//     constructor(config?: AutomationConfig) {
//         this.config = config || getConfig();
//         this.browser = new BrowserManager(this.config.screenshotDir);
//         this.authenticator = new Authenticator(this.browser);
//         this.projectSelector = new ProjectSelector(this.browser);
//         this.workbenchLauncher = new WorkbenchLauncher(this.browser);
//         this.promptCreator = new PromptCreator(this.browser);
//         this.responseEvaluator = new ResponseEvaluator(this.browser);
//         this.formHandler = new FormHandler(this.browser);

//     }

//     async run(testData: PromptTestData): Promise<void> {
//         console.log('\n⏱️  Starting LLM Toolkit Automation...\n');
//         const totalStart = Date.now();

//         try {


//             // Launch browser with saved session
//             await this.launchBrowser();

//             // Validate session
//             await this.validateSession();

//             // Step 1: Open dashboard to ensure we're logged in and session is valid
//             await this.openDashboard();

//             // STEP 2: Navigate to project

//             await this.navigateToProject();

//             // STEP 3: Launch workbench

//             await this.launchWorkbench();

//             //Step 5: Create prompt (abort if failure)

//             await this.createPrompt(testData);

//             await this.browser.takeScreenshot('07_responses_marked_specific');

//             // Step 7.5: Wait for frontier button to be enabled
//             await this.handleResponses(testData);


//             // Step 8: Click Submit to open "Review and Submit models" form

//             // // Step 9: Fill metadata (Final Answer, Solution Process, Thinking Process, Answer Unit)


//             await this.reviewAndSubmit(testData);


//             const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
//             console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`);
//             console.log('🔍 Browser window remains open for analysis... (not closed automatically)');
//         } catch (error) {
//             const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
//             console.error(`\n❌ Automation failed after ${totalDuration}s\n`);
//             try {
//                 await this.browser.close();
//             } catch (closeErr) {
//                 console.error(`  ⚠ Failed to close browser: ${closeErr}`);
//             }
//             throw error;
//         } finally {
//             // on success: browser left open for inspection; on failure: closed in catch
//         }
//     }


//     private async launchBrowser() {
//         // Step 1: Launch browser
//         await this.browser.launch(this.config.headless, true);
//         console.log('✓ Browser launched with saved session');

//         // Step 2: Initialize WorkbenchOrchestrator after browser has a page
//         this.workbenchOrchestrator = new WorkbenchOrchestrator(this.browser);

//         // Step 3: Initialize WorkbenchPage inside orchestrator
//         await this.workbenchOrchestrator.initWorkbenchPage();
//     }

//     private async validateSession() {
//         const sessionValid = await this.projectSelector.validateSession(this.config.project.baseUrl);
//         if (!sessionValid) throw new Error('Session expired. Run auth.setup.ts again');
//     }

//     private async navigateToProject() {
//         await this.openDashboard();
//         await this.projectSelector.navigateToProject(
//             this.config.project.projectName,
//             this.config.project.baseUrl,
//             this.config.project.projectUrl
//         );
//         await this.workbenchLauncher.waitForLoader();
//     }

//     private async launchWorkbench() {
//         await this.workbenchLauncher.launch();
//     }

//     private async createPrompt(testData: PromptTestData) {
//         const created = await this.promptCreator.createPrompt(testData.prompt, true);
//         if (!created) throw new Error('Prompt creation failed, aborting automation');
//     }




//     private async handleResponses(testData: PromptTestData) {
//         await this.workbenchOrchestrator!.verifyUserNavigatedToWorkbench(this.config.project.baseUrl, testData);

//         const allResponsesReady = await this.workbenchOrchestrator!.waitForAllResponses(
//             testData.expectedBaseResponsesCount, 600000
//         );

//         if (!allResponsesReady) console.warn('⚠ Not all responses generated');

//         await this.workbenchOrchestrator!.getAllResponses();
//         await this.responseEvaluator.mark2Incorrect3Correct();

//         const beforeFrontierCount = await this.workbenchOrchestrator!.getResponseCount();
//         const frontierEnabled = await this.workbenchOrchestrator!.waitForFrontierButtonEnabled(15000);

//         if (frontierEnabled) {
//             const frontierReady = await this.workbenchOrchestrator!.testOnFrontierModels(
//                 testData.frontierResponsesCount, 30000
//             );
//             if (frontierReady) {
//                 await this.workbenchOrchestrator!.getAllFrontierResponses();
//                 const afterFrontierCount = await this.workbenchOrchestrator!.getResponseCount();
//                 const newResponses = afterFrontierCount - beforeFrontierCount;
//                 if (newResponses > 0) await this.responseEvaluator.mark2Incorrect3Correct(beforeFrontierCount);
//             }
//         }
//     }



//     private async handleError(error: any, startTime: number) {
//         const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
//         console.error(`\n❌ Automation failed after ${totalDuration}s\n`, error);
//         try { await this.browser.close(); } catch { console.warn('⚠ Failed to close browser'); }
//     }




//     private async openDashboard() {

//         const page = this.browser.getPage();

//         console.log('📊 Opening dashboard...');

//         await page.goto(`${this.config.project.baseUrl}/dashboard`);

//         await this.browser.waitForLoader();

//         await page.waitForLoadState('networkidle');

//         console.log('✓ Dashboard ready');
//     }

//     private async executePromptFlow(testData: PromptTestData) {

//         const created = await this.promptCreator.createPrompt(testData.prompt, true);

//         if (!created) {
//             throw new Error('Prompt creation failed');
//         }

//         await this.workbenchOrchestrator!.verifyUserNavigatedToWorkbench(
//             this.config.project.baseUrl,
//             testData
//         );

//         await this.workbenchOrchestrator!.waitForAllResponses(
//             testData.expectedBaseResponsesCount,
//             600000
//         );

//         await this.workbenchOrchestrator!.getAllResponses();

//         await this.responseEvaluator.mark2Incorrect3Correct();
//     }


//     private async reviewAndSubmit(testData: PromptTestData) {
//         console.log('📝 Submitting Review and Metadata...');

//         // Step 8: Click Submit to open "Review and Submit models" form
//         const opened = await this.formHandler.clickSubmitToOpenReviewForm();
//         if (!opened) {
//             console.warn('⚠ Could not open Review form, trying to fill anyway...');
//         }

//         // Give UI time to render
//         await this.browser.waitForTimeout(2000);
//         await this.browser.takeScreenshot('09_review_form_opened');

//         // Wait for "Final Answer" field to appear
//         try {
//             const page = this.browser.getPage();
//             await page.waitForSelector('text=Final Answer', { timeout: 8000 }).catch(() => { });
//         } catch {
//             console.warn('⚠ Final Answer field not visible, proceeding anyway');
//         }

//         // Step 9: Fill metadata
//         await this.formHandler.fillMetadata(testData.metadata);
//         await this.browser.takeScreenshot('10_metadata_filled');

//         // Step 11: Submit the form
//         await this.formHandler.submitForm();
//         await this.browser.takeScreenshot('12_form_submitted');

//         // Wait for confirmation & redirect
//         await this.formHandler.waitForSubmissionConfirmation();
//         await this.formHandler.waitForRedirectToCreationPage();

//         console.log('✅ Review and Submit completed');
//     }
// }



// // Run if executed directly
// // if (require.main === module) {

// //     (async () => {

// //         const orchestrator = new AutomationOrchestrator();

// //         for (const testData of promptData) {

// //             console.log(`\n🚀 Running automation for: ${testData.prompt}\n`);

// //             await orchestrator.run(testData);

// //         }

// //     })().catch(console.error);

// // }