// Main orchestrator
import { BrowserManager } from '../browser/browserManager';
import { Authenticator } from '../auth/authenticator';
import { ProjectSelector } from '../services/projectSelector';
import { WorkbenchMenu } from '../pages/workbenchMenu';
import { PromptCreator } from '../services/promptCreator';
import { ResponseEvaluator } from '../services/responseEvaluator';
import { WorkbenchOrchestrator } from '../orchestrators/workbenchOrchestrator';
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

export class AutomationOrchestrator {
    private config: AutomationConfig;
    private browser: BrowserManager;
    private authenticator: Authenticator;
    private projectSelector: ProjectSelector;
    private workbenchMenu: WorkbenchMenu;
    private promptCreator: PromptCreator;
    private responseEvaluator: ResponseEvaluator;
    private workbenchOrchestrator: WorkbenchOrchestrator;
    private formHandler: FormHandler;
    private sessionValidator: SessionValidator;
    private navigationService: NavigationService;
    private promptOrchestrator: PromptOrchestrator;
    private reviewOrchestrator: ReviewOrchestrator;

    constructor(config?: AutomationConfig) {
        this.config = config || getConfig();
        this.browser = new BrowserManager(this.config.screenshotDir);
        this.authenticator = new Authenticator(this.browser);
        this.projectSelector = new ProjectSelector(this.browser);
        this.workbenchMenu = new WorkbenchMenu(this.browser);
        this.promptCreator = new PromptCreator(this.browser);
        this.responseEvaluator = new ResponseEvaluator(this.browser);
        this.formHandler = new FormHandler(this.browser);
        this.workbenchOrchestrator = new WorkbenchOrchestrator(this.browser, this.config);
        this.sessionValidator = new SessionValidator(this.browser);
        this.navigationService = new NavigationService(this.browser, this.projectSelector, this.workbenchMenu);
        this.promptOrchestrator = new PromptOrchestrator(
            this.promptCreator,
            this.workbenchOrchestrator,
            this.responseEvaluator,
            this.config
        );
        this.reviewOrchestrator = new ReviewOrchestrator(
            this.browser,
            this.formHandler
        );

    }

    async run(testData: PromptTestData): Promise<void> {
        console.log('\n⏱️  Starting LLM Toolkit Automation...\n');
        const totalStart = Date.now();

        try {


            // Launch browser with saved session
            Logger.info("Opening browser and validating session...");
            await this.browser.start(this.config.headless, true);

            const valid = await this.sessionValidator.validateSession(
                this.config.project.baseUrl
            );
            if (!valid) {
                throw new Error("Session expired. Run auth.setup.ts again");
            }

            await this.workbenchOrchestrator.initialize();
            // Validate session
            // Step 1: Open dashboard to ensure we're logged in and session is valid
            Logger.info("Opening dashboard...");
            await this.navigationService.openDashboard(this.config.project.baseUrl);

            // STEP 2: Navigate to project

            await this.projectSelector.navigateToProject(
                this.config.project.projectName,
                this.config.project.baseUrl,
                this.config.project.projectUrl
            );

            await this.workbenchMenu.waitForLoader();

            // STEP 3: Launch workbench

            await this.workbenchMenu.launch();

            //Step 5: Create prompt (abort if failure)
           await this.promptOrchestrator.createPrompt(testData.prompt);
            await this.browser.takeScreenshot('07_responses_marked_specific');

            // Step 7.5: Wait for frontier button to be enabled
            await this.promptOrchestrator.handleResponses(testData);

            // Step 8: Click Submit to open "Review and Submit models" form

            // // Step 9: Fill metadata (Final Answer, Solution Process, Thinking Process, Answer Unit)

            await this.reviewOrchestrator.submitReview(testData.metadata);

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
