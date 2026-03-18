import { AutomationConfig } from "../../config/config"
import { PromptTestData } from "../../types/testData.type";
import { Logger } from "../utils/Logger"
import { TestContext } from "../core/TestContext"
import { expectedResponse } from "../../data/prompts/expectedResponse";
import { ExpectedPromptResponse } from "../../types/expectedPromptResponse.type";

export class ResponseValidationOrchestrator {

    private context: TestContext
    private config: AutomationConfig

    constructor(context: TestContext) {
        this.context = context
        this.config = context.config
    }

    async run(testData: PromptTestData): Promise<void> {

        console.log('\n⏱️  Starting LLM Toolkit Automation...\n')

        const totalStart = Date.now()

        try {

            const ctx = this.context

            Logger.info("Opening browser and validating session...")

            //await ctx.browser.start(this.config.headless, true)

            const valid = await ctx.sessionValidator.validateSession(
                this.config.project.baseUrl
            )

            if (!valid) {
                throw new Error("Session expired. Run auth.setup.ts again")
            }

            Logger.info("Opening dashboard...")

            await ctx.navigationService.openDashboard(
                this.config.project.baseUrl
            )

            await ctx.projectSelector.navigateToProject(
                this.config.project.projectName,
                this.config.project.baseUrl,
                this.config.project.projectUrl
            )

            await ctx.workbenchMenu.waitForLoader()

            await ctx.workbenchMenu.launch()

            await ctx.promptCreationPage.createPrompt(testData)

            await ctx.workbenchService.verifyNavigation(testData)

            const testSubset = {
                [testData.id]: testData.expectedResponse
            };

            const allBaseResponses = await ctx.workbenchService.waitForResponsesWithVerification(
                testData.expectedBaseResponsesCount,
                testSubset
            )



            if (!allBaseResponses) {
                Logger.error("Not all base responses loaded in time")
                throw new Error("Not all base responses loaded in time")
            }

            await ctx.workbenchService.verifyResponses(testSubset);

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`)

        } catch (error) {

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.error(`\n❌ Automation failed after ${totalDuration}s\n`)

            throw error

        }

    }

}