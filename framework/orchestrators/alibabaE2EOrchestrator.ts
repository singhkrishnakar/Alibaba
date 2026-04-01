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

            // ── Validate form after creation ──
            Logger.info("Validating form fields...")
            const validationErrors = await ctx.promptCreatorService.getAllValidationErrors()
            if (validationErrors.length > 0) {
                console.error('❌ Form validation failed. Errors:')
                validationErrors.forEach((error: string, index: number) => {
                    console.error(`  ${index + 1}. ${error}`)
                })
                throw new Error(`Form validation failed:\n${validationErrors.join('\n')}`)
            }
            Logger.info("✓ Form validation passed")

            // DEBUG: hardcoded wait — remove before merging to main
            await ctx.browser.waitForTimeout(20000);

            await ctx.promptCreatorService.runPrompt()

            await ctx.workbenchService.verifyNavigation(testData)

            // Wait for base responses
            const allBaseResponses = await ctx.workbenchService.waitForBaseResponses(
                testData.expectedBaseResponsesCount,
                testData.responseTimeouts?.baseResponseTimeout ?? 600000
            );

            if (!allBaseResponses) {
                Logger.error("Not all base responses loaded in time")
                throw new Error("Not all base responses loaded in time")
            }

            await ctx.workbenchService.verifyBaseResponses(expectedResponse)

            // Mark all base responses
            await ctx.workbenchService.markAllBaseResponses(testData)

            // ── Check for missing base response marking ──
            // Toast appears if any responses are not marked
            const missingBaseMarking = await ctx.workbenchService.handleMissingBaseResponseMarking();
            if (missingBaseMarking.length > 0) {
                console.log(`  💡 Please mark the missing responses: [${missingBaseMarking.join(', ')}]`)
                console.log('     Toast has been dismissed. Mark them and click Frontier to continue.')
            }

            // ── handles model error modal automatically ──
            // After marking base responses, check for errors before frontier
            await ctx.workbenchService.verifyNoBaseModelErrors();

            // Read response count after base model responses load
            const { actual: baseResponseCount } = await ctx.workbenchService.getResponseCount(
                testData.expectedBaseResponsesCount
            );

            const responseCountAfterBaseModelResponse =
                baseResponseCount + testData.expectedFrontierResponsesCount;

            Logger.info("Base responses: " + baseResponseCount + ", Total after frontier: " + responseCountAfterBaseModelResponse)

            const frontierEnabled = await ctx.workbenchService.waitForFrontierButtonEnabled()

            if (frontierEnabled) {
                // Click frontier button and handle any model error modal that appears
                // (modal only appears if modelErrorBlockingEnabled is true AND there are errors)
                await ctx.workbenchService.clickFrontierButtonWithErrorHandling(testData);

                // Wait for frontier responses to load
                await ctx.workbenchService.waitForFrontierResponses(
                    testData.expectedBaseResponsesCount + testData.expectedFrontierResponsesCount,
                    testData.responseTimeouts?.frontierResponseTimeout ?? 600000
                );

                // Mark all frontier responses
                await ctx.workbenchService.markAllFrontierResponses(testData);

                // ── Check for missing frontier response marking ──
                // Modal appears if any responses are not marked, blocking submission
                const missingFrontierMarking = await ctx.workbenchService.handleMissingFrontierResponseMarking();
                if (missingFrontierMarking.length > 0) {
                    console.log(`  💡 Please mark the missing frontier responses: [${missingFrontierMarking.join(', ')}]`)
                    console.log('     Modal has been dismissed. Mark them and click Submit to continue.')
                }

                // After marking frontier responses, check for errors before submit
                await ctx.workbenchService.verifyNoFrontierModelErrors();
                
                // This handles: wait for submit button → click it → handle model errors modal if present
                await ctx.workbenchService.clickSubmitWithErrorHandling(testData);

            } else {
                Logger.error("Frontier failed to enabled")
                throw new Error("Frontier not gets enabled")
            }

            // ✅ clickSubmitWithErrorHandling() already clicked submit — no need to click again

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