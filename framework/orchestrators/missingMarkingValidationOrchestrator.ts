import { PromptTestData } from "../../types/promptTestData.type";
import { Logger } from "../utils/Logger"
import { TestContext } from "../core/TestContext"
import { expectedResponse } from "../../data/prompts/expectedResponse";

export class MissingMarkingValidationOrchestrator {

    private context: TestContext
    private config: any

    constructor(context: TestContext) {
        this.context = context
        this.config = context.config
    }

    async run(testData: PromptTestData): Promise<void> {

        console.log('\n⏱️  Starting Missing Marking Validation Test...\n')

        const totalStart = Date.now()

        try {

            const ctx = this.context

            Logger.info("Opening browser and validating session...")

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

            // ─────────────────────────────────────────
            // SCENARIO 1: Test Missing Base Response Marking Toast
            // Trigger: click Frontier button with some responses unmarked
            // Expected: error toast "Please mark all responses..."
            // ─────────────────────────────────────────
            Logger.info("🧪 SCENARIO 1: Testing Missing Base Response Marking Toast\n")

            // Mark only the responses defined in workbenchMarking (intentionally partial)
            Logger.info("📝 Marking only SOME base responses (leaving some unmarked)...")
            for (const [indexStr, status] of Object.entries(testData.workbenchMarking?.baseResponses || {})) {
                const index = parseInt(indexStr);
                await ctx.workbenchPage.markBaseResponse(index, status as 'Correct' | 'Incorrect');
            }

            // Click Frontier button — this is what triggers the toast
            const missingBaseMarkings = await ctx.workbenchService.clickFrontierAndVerifyMissingMarkingToast();

            if (missingBaseMarkings.length > 0) {
                console.log(`\n✅ PASS: Missing base marking detected for responses: [${missingBaseMarkings.join(', ')}]`)
                console.log(`   Toast was triggered and handled correctly`)
            } else {
                throw new Error("❌ FAIL: Expected to find missing base response marking, but none were detected")
            }

            // ─────────────────────────────────────────
            // Now mark all remaining base responses to proceed with frontier
            // ─────────────────────────────────────────
            Logger.info("\n📝 Now marking all remaining base responses to proceed with frontier...\n")
            const allBaseIndexes = await ctx.workbenchPage.getBaseResponseNameIndexes();
            for (const index of allBaseIndexes) {
                const isMarked = await ctx.workbenchPage.isBaseResponseMarked(index);
                if (!isMarked) {
                    await ctx.workbenchPage.markBaseResponse(index, 'Correct');
                }
            }

            // Wait for React state to settle after marking
            await ctx.browser.waitForTimeout(2000);

            // Verify all base responses are now marked
            const stillMissingBase = await ctx.workbenchPage.getBaseResponsesWithMissingMarking();
            if (stillMissingBase.length > 0) {
                for (const index of allBaseIndexes) {
                    const marked = await ctx.workbenchPage.isBaseResponseMarked(index);
                    console.log(`  Debug: Base response ${index} isMarked=${marked}`);
                }
                throw new Error(`❌ Failed to mark all base responses. Still missing: [${stillMissingBase.join(', ')}]`)
            }
            Logger.info("✓ All base responses now marked")

            // Check for base model errors
            await ctx.workbenchService.verifyNoBaseModelErrors();

            // Read response count
            const { actual: baseResponseCount } = await ctx.workbenchService.getResponseCount(
                testData.expectedBaseResponsesCount
            );

            // Wait for Frontier button to re-enable (it was already enabled before Scenario 1 click)
            const frontierEnabled = await ctx.workbenchService.waitForFrontierButtonEnabled()

            if (!frontierEnabled) {
                throw new Error("Frontier button failed to enable")
            }

            // Click Frontier button successfully this time (all base responses are marked)
            await ctx.workbenchService.clickFrontierButtonWithErrorHandling(testData);

            // Wait for frontier responses
            await ctx.workbenchService.waitForFrontierResponses(
                testData.expectedBaseResponsesCount + testData.expectedFrontierResponsesCount,
                testData.responseTimeouts?.frontierResponseTimeout ?? 600000
            );

            // ─────────────────────────────────────────
            // SCENARIO 2: Test Missing Frontier Response Marking Modal
            // Trigger: click Submit button with some frontier responses unmarked
            // Expected: "Incorrect Responses Required" modal appears
            // ─────────────────────────────────────────
            // ─────────────────────────────────────────
            // SCENARIO 2: Test Missing Frontier Response Marking Modal
            // ─────────────────────────────────────────
            Logger.info("\n🧪 SCENARIO 2: Testing Missing Frontier Response Marking Modal\n")

            // Fetch frontier DOM indexes ONCE — reused for both partial marking and fill-remaining steps
            const allFrontierIndexes = await ctx.workbenchPage.getFrontierResponseNameIndexes();
            console.log(`  ℹ️  Config: base=${testData.expectedBaseResponsesCount}, frontier=${testData.expectedFrontierResponsesCount}`);
            console.log(`  ℹ️  Frontier DOM indexes: [${allFrontierIndexes.join(', ')}]`);
            console.log(`  ℹ️  Marking map keys (logical): [${Object.keys(testData.workbenchMarking?.frontierResponses || {}).join(', ')}]`);

            // Mark only the frontier responses defined in workbenchMarking (intentionally partial)
            Logger.info("📝 Marking only SOME frontier responses (leaving some unmarked)...")
            for (const [indexStr, status] of Object.entries(testData.workbenchMarking?.frontierResponses || {})) {
                const logicalIndex = parseInt(indexStr);
                const domIndex = allFrontierIndexes[logicalIndex - 1];

                if (domIndex === undefined) {
                    console.warn(`  ⚠️  Logical index ${logicalIndex} out of range — only ${allFrontierIndexes.length} frontier responses available`);
                    continue;
                }

                console.log(`  🗂️  Marking: logical[${logicalIndex}] → DOM[response-frontier-${domIndex}] as ${status}`);
                await ctx.workbenchPage.markFrontierResponse(domIndex, status as 'Correct' | 'Incorrect');
            }

            // Click Submit button — this triggers the missing marking modal
            const missingFrontierMarkings = await ctx.workbenchService.clickSubmitAndVerifyMissingMarkingModal();

            if (missingFrontierMarkings.length > 0) {
                console.log(`\n✅ PASS: Missing frontier marking detected for responses: [${missingFrontierMarkings.join(', ')}]`)
                console.log(`   Modal was triggered and handled correctly`)
            } else {
                throw new Error("❌ FAIL: Expected to find missing frontier response marking, but none were detected")
            }

            // Mark all remaining frontier responses (reuse allFrontierIndexes declared above)
            Logger.info("\n📝 Now marking all remaining frontier responses to proceed with submission...\n")
            for (const index of allFrontierIndexes) {
                const isMarked = await ctx.workbenchPage.isFrontierResponseMarked(index);
                if (!isMarked) {
                    await ctx.workbenchPage.markFrontierResponse(index, 'Correct');
                }
            }

            // Wait for React state to settle after marking
            await ctx.browser.waitForTimeout(2000);

            // Verify all frontier responses are now marked
            const stillMissingFrontier = await ctx.workbenchPage.getFrontierResponsesWithMissingMarking();
            if (stillMissingFrontier.length > 0) {
                for (const index of allFrontierIndexes) {
                    const marked = await ctx.workbenchPage.isFrontierResponseMarked(index);
                    console.log(`  Debug: Frontier response ${index} isMarked=${marked}`);
                }
                throw new Error(`❌ Failed to mark all frontier responses. Still missing: [${stillMissingFrontier.join(', ')}]`)
            }
            Logger.info("✓ All frontier responses now marked")

            // Check for frontier model errors
            await ctx.workbenchService.verifyNoFrontierModelErrors();

            // Click Submit successfully this time (all frontier responses are marked)
            await ctx.workbenchService.clickSubmitWithErrorHandling(testData);

            // Complete the review form
            await ctx.reviewFormService.reviewAndSubmit(testData)

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.log(`\n✅ Missing Marking Validation Test completed successfully in ${totalDuration}s\n`)

        } catch (error) {

            const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1)

            console.error(`\n❌ Missing Marking Validation Test failed after ${totalDuration}s\n`)

            throw error

        }

    }

}