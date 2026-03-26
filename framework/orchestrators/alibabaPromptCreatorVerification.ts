import { AutomationConfig } from "../../config/config"
import { PromptTestData } from "../../types/promptTestData.type";
import { Logger } from "../utils/Logger"
import { TestContext } from "../core/TestContext"
import { expectedResponse } from "../../data/prompts/expectedResponse";
import { ExpectedPromptResponse } from "../../types/expectedPromptResponse.type";
import { prompts } from "../../data/prompts/prompts"; // ← ADD THIS IMPORT

export class PromptCreatorVerification {
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

            // ← ADD THIS — resolve prompt text from the prompts data file using testData.id
            // Same pattern as your working ExportPromptOrchestrator
            const promptConfig = prompts[testData.id];
            if (!promptConfig) {
                throw new Error(`No prompt config found for id: "${testData.id}"`)
            }

            Logger.info("Opening browser and validating session...")
            const valid = await ctx.sessionValidator.validateSession(
                this.config.project.baseUrl
            )
            if (!valid) {
                throw new Error("Session expired. Run auth.setup.ts again")
            }

            Logger.info("Opening dashboard...")
            await ctx.navigationService.openDashboard(this.config.project.baseUrl)
            await ctx.projectSelector.navigateToProject(
                this.config.project.projectName,
                this.config.project.baseUrl,
                this.config.project.projectUrl
            )

            await ctx.dashboardKebabMenu.waitForLoader()
            await ctx.dashboardKebabMenu.launch()
            await ctx.promptCreatorService.createPrompt(testData)

            //await ctx.promptCreator.runPrompt()

            // ← NOW this works because promptConfig is declared above in the same scope
            await ctx.promptCreatorService.verifyPromptFilled(promptConfig.promptText)

            await ctx.promptCreatorService.verifyKeyPointChips(testData.metadata.knowledgePoints)

            // DEBUG: hardcoded wait — remove before merging to main
            await ctx.browser.waitForTimeout(20000);

            //await ctx.workbenchService.verifyNavigation(testData)

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)
            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`)

        } catch (error) {
            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)
            console.error(`\n❌ Automation failed after ${totalDuration}s\n`)
            throw error
        }
    }
}