"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationOrchestrator = void 0;
// Main orchestrator
const browser_manager_1 = require("./browser_manager");
const authenticator_1 = require("./authenticator");
const project_selector_1 = require("./project_selector");
const workbench_launcher_1 = require("./workbench_launcher");
const prompt_creator_1 = require("./prompt_creator");
const response_evaluator_1 = require("./response_evaluator");
const form_handler_1 = require("./form_handler");
const config_1 = require("./config");
class AutomationOrchestrator {
    constructor(config) {
        this.config = config || (0, config_1.getConfig)();
        this.browser = new browser_manager_1.BrowserManager(this.config.screenshotDir);
        this.authenticator = new authenticator_1.Authenticator(this.browser);
        this.projectSelector = new project_selector_1.ProjectSelector(this.browser);
        this.workbenchLauncher = new workbench_launcher_1.WorkbenchLauncher(this.browser);
        this.promptCreator = new prompt_creator_1.PromptCreator(this.browser);
        this.responseEvaluator = new response_evaluator_1.ResponseEvaluator(this.browser);
        this.formHandler = new form_handler_1.FormHandler(this.browser);
    }
    async run() {
        console.log('\n⏱️  Starting LLM Toolkit Automation...\n');
        const totalStart = Date.now();
        try {
            // Launch browser
            await this.browser.launch(this.config.headless);
            // Step 1: Login
            await this.authenticator.login(this.config.credentials, this.config.project.baseUrl);
            // Step 2: Validate session
            const sessionValid = await this.projectSelector.validateSession(this.config.project.baseUrl);
            if (!sessionValid) {
                throw new Error('Session invalid after login');
            }
            // Step 3: Navigate to project (only if necessary)
            await this.projectSelector.navigateToProject(this.config.project.projectName, this.config.project.baseUrl, this.config.project.projectUrl);
            // Step 4: Launch workbench
            await this.workbenchLauncher.launch();
            // Step 5: Create prompt
            await this.promptCreator.createPrompt(this.config.prompt);
            // Step 6: Run prompt
            await this.promptCreator.runPrompt();
            // Step 7: Evaluate responses
            await this.responseEvaluator.markAllResponsesRandom();
            await this.browser.takeScreenshot('06_responses_marked');
            // Step 8: Fill metadata form
            const metadata = {
                finalAnswer: 'The answer is provided',
                solutionProcess: 'Step by step process',
                thinkingProcess: 'Logical reasoning applied',
                noUnitRequired: false
            };
            await this.formHandler.fillMetadata(metadata);
            await this.browser.takeScreenshot('07_metadata_filled');
            // Step 9: Submit form
            await this.formHandler.submitForm();
            await this.browser.takeScreenshot('08_form_submitted');
            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`);
            // Keep browser open briefly for observation
            await this.browser.waitForTimeout(2000);
        }
        catch (error) {
            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
            console.error(`\n❌ Automation failed after ${totalDuration}s\n`);
            throw error;
        }
        finally {
            await this.browser.close();
        }
    }
}
exports.AutomationOrchestrator = AutomationOrchestrator;
// Run if executed directly
if (require.main === module) {
    const orchestrator = new AutomationOrchestrator();
    orchestrator.run().catch(console.error);
}
//# sourceMappingURL=main.js.map