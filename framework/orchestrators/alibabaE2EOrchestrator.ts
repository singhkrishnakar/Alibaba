import { AutomationConfig } from "../../config/config"
import { PromptTestData } from "../../types/testData.type";
import { Logger } from "../utils/Logger"
import { TestContext } from "../core/TestContext"
import { error } from "console";
import { expectedResponse } from "../../data/prompts/expectedResponse";

export class AlibabaE2EValidation {

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

            const allBaseResponses = await ctx.workbenchService.waitForResponses(testData.expectedBaseResponsesCount)

            if(!allBaseResponses) {
                Logger.error("Not all base responses loaded in time")
                throw new Error("Not all base responses loaded in time")
            }

            await ctx.workbenchService.verifyResponses(expectedResponse)

            await ctx.workbenchService.getAllResponses()

            await ctx.responseEvaluator.mark2Incorrect3Correct()

            const baseResponseCount = await ctx.workbenchService.getResponseCount()

            const frontierEnabled = await ctx.workbenchService.waitForFrontierEnabled()

            if(frontierEnabled){
                            await ctx.workbenchService.isFrontierEnabled()

            await ctx.workbenchService.clickFrontierButton()

            await ctx.workbenchService.waitForFrontierResponses(testData.expectedFrontierResponsesCount)

            await ctx.responseEvaluator.mark2Incorrect3Correct(baseResponseCount)

            }else{
                Logger.error("Frontier failed to enabled")
                throw new Error("Frontier not gets enabled")
            }

            await ctx.reviewAndSubmitForm.submitReview(testData.metadata)

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`)

        } catch (error) {

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.error(`\n❌ Automation failed after ${totalDuration}s\n`)

            //await this.context.browser.close()

            throw error

        }

    }

}