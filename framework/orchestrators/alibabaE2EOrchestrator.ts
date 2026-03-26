import { AutomationConfig } from "../../config/config"
import { PromptTestData } from "../../types/promptTestData.type";
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

            await ctx.dashboardKebabMenu.waitForLoader()

            await ctx.dashboardKebabMenu.launch()

            await ctx.promptCreatorService.createPrompt(testData)

            await ctx.promptCreatorService.runPrompt()

            await ctx.workbenchService.verifyNavigation(testData)

            // Wait for base responses
            const allBaseResponses = await ctx.workbenchService.waitForBaseResponses
                (
                    testData.expectedBaseResponsesCount
                )

            if (!allBaseResponses) {
                Logger.error("Not all base responses loaded in time")
                throw new Error("Not all base responses loaded in time")
            }

            await ctx.workbenchService.verifyBaseResponses(expectedResponse)

            // Mark all base responses
            await ctx.workbenchService.markAllBaseResponses(testData)

            // Read response count after base model responses load
            const { actual: baseResponseCount } = await ctx.workbenchService.getResponseCount(
                testData.expectedBaseResponsesCount
            );

            const responseCountAfterBaseModelResponse =
                baseResponseCount + testData.expectedFrontierResponsesCount;

            console.log("---->" + baseResponseCount + responseCountAfterBaseModelResponse)

            const frontierEnabled = await ctx.workbenchService.waitForFrontierButtonEnabled()

            if (frontierEnabled) {
                await ctx.workbenchService.clickFrontierButton()

                // Wait for frontier responses to load
                await ctx.workbenchService.waitForFrontierResponses
                (
                    testData.expectedBaseResponsesCount
                    +
                    testData.expectedFrontierResponsesCount
                );

                // Mark all frontier responses
                await ctx.workbenchService.markAllFrontierResponses(testData);

                // DEBUG: hardcoded wait — remove before merging to main
                //await ctx.browser.waitForTimeout(20000);

            } else {
                Logger.error("Frontier failed to enabled")
                throw new Error("Frontier not gets enabled")
            }

            // Wait for submit button to enable
            await ctx.workbenchService.waitForSubmitButtonEnabled();

            // Click submit — this opens the ReviewAndSubmitForm modal
            await ctx.workbenchPage.clickSubmit();

            await ctx.reviewFormService.reviewAndSubmit(testData)

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