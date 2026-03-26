import { TestContext } from '../core/TestContext';
import { PromptTestData } from '../../types/promptTestData.type';
import { Logger } from '../utils/Logger';
import { prompts } from '../../data/prompts/prompts';

export class SaveDraftOrchestrator {
    constructor(private context: TestContext) { }

    async run(testData: PromptTestData): Promise<void> {
        const ctx = this.context;
        const config = ctx.config;
        const promptConfig = prompts[testData.id];

        if (!promptConfig) {
            throw new Error(`No prompt config found for id: "${testData.id}"`);
        }

        Logger.info('⏱️ Starting Save Draft validation...');
        const start = Date.now();

        try {
            // ── Session & Navigation ──
            const valid = await ctx.sessionValidator.validateSession(
                config.project.baseUrl
            );
            if (!valid) throw new Error('Session expired. Run auth.setup.ts again');

            await ctx.navigationService.openDashboard(config.project.baseUrl);
            await ctx.projectSelector.navigateToProject(
                config.project.projectName,
                config.project.baseUrl,
                config.project.projectUrl
            );
            await ctx.projectDetailPage.waitForPageLoad();

            // ── Launch Workbench ──
            await ctx.dashboardKebabMenu.waitForLoader();
            await ctx.dashboardKebabMenu.launch();

            // ── Step 1: Create and run prompt ──
            Logger.info('📝 Step 1: Creating and running prompt...');
            await ctx.promptCreatorService.createPrompt(testData);
            await ctx.promptCreatorService.runPrompt();

            // ── Step 2: Wait for workbench and base responses ──
            Logger.info('⏳ Step 2: Waiting for workbench and responses...');
            await ctx.workbenchService.verifyNavigation(testData);
            await ctx.workbenchService.waitForBaseResponses(
                testData.expectedBaseResponsesCount
            );

            // ── Step 3: Verify Save Draft enabled after responses load ──
            Logger.info('🔍 Step 3: Verifying Save Draft button is enabled...');
            await ctx.workbenchService.verifySaveAsDraftEnabled();

            // ── Step 4: Mark all base responses ──
            Logger.info('📝 Step 4: Marking base responses...');
            await ctx.workbenchService.markAllBaseResponses(testData);

            // ── Step 5: Save draft ──
            Logger.info('💾 Step 5: Saving draft...');
            await ctx.workbenchService.clickSaveAsDraft();

            // ── Step 6: Click Back → navigate to prompt creation page ──
            Logger.info('🔙 Step 6: Clicking Back button...');
            await ctx.workbenchService.clickBackAndWaitForNavigation();

            // ── Step 7: Load Draft modal appears — confirm loading ──
            Logger.info('📂 Step 7: Handling Load Draft modal...');
            await ctx.promptCreatorPage.waitForLoadDraftModal();
            await ctx.promptCreatorPage.confirmLoadDraft();

            // ── Step 8: Verify fields loaded in disabled/read-only mode ──
            Logger.info('🔍 Step 8: Verifying draft fields are disabled...');
            await ctx.promptCreatorPage.verifyDraftFieldsDisabled();

            // ── Step 9: Verify Run Draft button is visible ──
            Logger.info('🔍 Step 9: Verifying Run Draft button visible...');
            await ctx.promptCreatorPage.verifyRunDraftButtonVisible();

            // ── Step 10: Verify draft data matches original prompt ──
            Logger.info('🔍 Step 10: Verifying draft data matches original prompt...');

            // Pass isDraft=true — chips in draft mode have no remove button
            await ctx.promptCreatorService.verifyRewritePromptAutoPopulation(testData, true);

            // ── Step 11: Click Run Draft → navigate to workbench ──
            Logger.info('▶️ Step 11: Clicking Run Draft...');
            await ctx.promptCreatorPage.clickRunDraft();

            // DEBUG: hardcoded wait — remove before merging to main
            await ctx.browser.waitForTimeout(20000);

            // ── Step 12: Wait for workbench with saved state ──
            Logger.info('⏳ Step 12: Waiting for workbench with saved draft state...');
            await ctx.workbenchService.verifyNavigation(testData);
            await ctx.workbenchService.waitForBaseResponses(
                testData.expectedBaseResponsesCount
            );

            // ── Step 13: Verify previously marked responses are restored ──
            Logger.info('🔍 Step 13: Verifying saved markings are restored...');
            const allMarked = await ctx.workbenchPage.areAllBaseResponsesMarked();
            if (!allMarked) {
                throw new Error(
                    'Draft markings not restored — ' +
                    'base responses should be pre-marked from saved draft'
                );
            }
            Logger.info('  ✓ All base response markings restored from draft');

            const duration = ((Date.now() - start) / 1000).toFixed(1);
            Logger.info(`✅ Save Draft flow validated in ${duration}s`);

        } catch (error) {
            Logger.error('❌ Save Draft validation failed');
            throw error;
        }
    }
}