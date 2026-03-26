import { AutomationConfig } from "../../config/config"
import { PromptTestData } from "../../types/promptTestData.type";
import { Logger } from "../utils/Logger"
import { TestContext } from "../core/TestContext"
import { expectedResponse } from "../../data/prompts/expectedResponse";
import { ExpectedPromptResponse } from "../../types/expectedPromptResponse.type";

export class ValidatedWorkbechPageOrchestrator {

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

            await ctx.workbenchService.waitForBaseResponses(testData.expectedBaseResponsesCount)

            // Verify base model name
            await ctx.workbenchService.verifyModelName('qwen3-235b-a22b-thinking-2507');


            const testSubset = {
                [testData.id]: testData.expectedResponse
            };

            // Verify after base responses load
            const baseVerified = await ctx.workbenchService
                .verifyMarkingQuestionForEachResponse(testData.expectedBaseResponsesCount);

            if (!baseVerified) {
                throw new Error(
                    `Marking question not visible for all 
                    ${testData.expectedBaseResponsesCount} base responses`
                );
            }

            // Verify View Complete Response button present for all base responses
            await ctx.workbenchService
                .verifyViewCompleteResponseButtonForEachResponse(
                    testData.expectedBaseResponsesCount
                );

            // Smoke test the modal flow on first response
            await ctx.workbenchService.verifyCompleteResponseModalFlow();

            // const allBaseResponses = await ctx.workbenchService.verifyBaseResponses(
            //     testSubset
            // )

            // Verify retry button present for all base responses
            await ctx.workbenchService.verifyRetryButtonPresentForEachResponse(
                testData.expectedBaseResponsesCount
            );

            // Retry a specific response
            await ctx.workbenchService.clickRetryForResponse(1, 'base');

            // Verify retry animation started
            const retrying = await ctx.workbenchService.verifyRetryStarted(1, 'base');
            if (!retrying) throw new Error('Retry did not start for response 1');

            // Wait for retry to finish
            await ctx.workbenchService.waitForRetryToComplete(1, 'base');

            // Read all complete texts for deep verification
            //const { base, frontier } = await ctx.workbenchService.getAllCompleteResponseTexts();


            // Frontier retry
            // await ctx.workbenchService.clickRetryForResponse(6, 'frontier');
            // await ctx.workbenchService.verifyRetryStarted(6, 'frontier');
            // await ctx.workbenchService.waitForRetryToComplete(6, 'frontier');


            // Verify frontier model names
            // await ctx.workbenchService.verifyModelName('gemini-2.5-pro');
            // await ctx.workbenchService.verifyModelName('o4-mini');

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.log(`\n✅ Automation completed successfully in ${totalDuration}s\n`)

        } catch (error) {

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.error(`\n❌ Automation failed after ${totalDuration}s\n`)

            throw error

        }

    }

}