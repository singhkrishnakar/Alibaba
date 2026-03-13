// Main orchestrator
import { BrowserManager } from '../browser/browserManager';
import { Authenticator } from '../auth/authenticator';
import { ProjectSelector } from '../services/projectSelector';
import { WorkbenchMenu } from '../pages/workbenchMenu';
import { PromptCreator } from '../services/promptCreator';
import { ResponseEvaluator } from '../services/responseEvaluator';
import { WorkbenchOrchestrator } from './workbenchOrchestrator';
import { FormHandler, MetadataConfig } from '../services/formHandler';
import { getConfig, AutomationConfig } from '../../config/config';
import { PromptTestData, promptData } from "../../data/promptData";
import { PromptConfig } from '../../types/prompt.types';
import test from 'node:test';
import { Logger } from '../utils/logger';
import { SessionValidator } from '../auth/sessionManager';
import { NavigationService } from '../services/navigationService';
import { PromptOrchestrator } from './promptOrchestrator';
import { ReviewOrchestrator } from './reviewOrchestrator';
import { TestContext } from '../core/TestContext';

export class AutomationOrchestrator {
    
    private context: TestContext
    
        constructor(context: TestContext) {
            this.context = context
        }

    async run(testData: PromptTestData): Promise<void> {
        console.log('\n⏱️  Starting LLM Toolkit Automation...\n');
        const totalStart = Date.now();

        try {


            // Launch browser with saved session
            Logger.info("Opening browser and validating session...");
            await this.context.browser.start(this.context.config.headless, true);

            const valid = await this.context.sessionValidator.validateSession(
                this.context.config.project.baseUrl
            );
            if (!valid) {
                throw new Error("Session expired. Run auth.setup.ts again");
            }

            await this.context.workbenchOrchestrator.initialize();
            // Validate session
            // Step 1: Open dashboard to ensure we're logged in and session is valid
            Logger.info("Opening dashboard...");
            await this.context.navigationService.openDashboard(this.context.config.project.baseUrl);

            // STEP 2: Navigate to project

            await this.context.projectSelector.navigateToProject(
                this.context.config.project.projectName,
                this.context.config.project.baseUrl,
                this.context.config.project.projectUrl
            );

            await this.context.workbenchMenu.waitForLoader();

            // STEP 3: Launch workbench

            await this.context.workbenchMenu.launch();

            //Step 5: Create prompt (abort if failure)
           await this.context.promptOrchestrator.createPrompt(testData.prompt);
            await this.context.browser.takeScreenshot('07_responses_marked_specific');

            // Step 7.5: Wait for frontier button to be enabled
            await this.context.promptOrchestrator.handleResponses(testData);

            // Step 8: Click Submit to open "Review and Submit models" form

            // // Step 9: Fill metadata (Final Answer, Solution Process, Thinking Process, Answer Unit)

            await this.context.reviewOrchestrator.submitReview(testData.metadata);

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`);
            console.log('🔍 Browser window remains open for analysis... (not closed automatically)');
        } catch (error) {
            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
            console.error(`\n❌ Automation failed after ${totalDuration}s\n`);
            try {
                await this.context.browser.close();
            } catch (closeErr) {
                console.error(`  ⚠ Failed to close browser: ${closeErr}`);
            }
            throw error;
        } finally {
            // on success: browser left open for inspection; on failure: closed in catch
        }
    }


}
