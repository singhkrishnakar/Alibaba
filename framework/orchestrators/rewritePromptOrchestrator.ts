import { TestContext } from '../core/TestContext';
import { PromptTestData } from '../../types/promptTestData.type';
import { Logger } from '../utils/Logger';
import { prompts } from '../../data/prompts/prompts';

export class RewritePromptOrchestrator {
    constructor(private context: TestContext) {}

    /**
     * @param originalTestData  — the prompt created initially
     * @param rewrittenTestData — the new prompt data to fill after clicking Rewrite
     */
    async run(
        originalTestData: PromptTestData,
        rewrittenTestData: PromptTestData
    ): Promise<void> {
        const ctx = this.context;
        const config = ctx.config;

        // Validate both prompt configs exist in prompts data file
        const originalPromptConfig = prompts[originalTestData.id];
        if (!originalPromptConfig) {
            throw new Error(`No prompt config found for id: "${originalTestData.id}"`);
        }
        const rewrittenPromptConfig = prompts[rewrittenTestData.id];
        if (!rewrittenPromptConfig) {
            throw new Error(`No prompt config found for id: "${rewrittenTestData.id}"`);
        }

        Logger.info('⏱️ Starting Rewrite Prompt validation...');
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

            // ── Step 1: Create and run ORIGINAL prompt ──
            Logger.info('📝 Step 1: Creating original prompt...');
            await ctx.promptCreatorService.createPrompt(originalTestData);
            await ctx.promptCreatorService.runPrompt();

            // ── Step 2: Wait for workbench and base responses ──
            Logger.info('⏳ Step 2: Waiting for workbench and responses...');
            await ctx.workbenchService.verifyNavigation(originalTestData);
            await ctx.workbenchService.waitForBaseResponses(
                originalTestData.expectedBaseResponsesCount
            );

            // ── Step 3: Click Rewrite Prompt ──
            Logger.info('✏️ Step 3: Clicking Rewrite Prompt...');
            await ctx.workbenchService.clickRewritePromptAndWaitForNavigation();

            // ── Step 4: Verify navigation back to prompt creation page ──
            Logger.info('🔍 Step 4: Verifying navigation to prompt creation page...');
            await ctx.promptCreatorService.verifyPageLoaded();
            Logger.info('  ✓ Navigated back to prompt creation page');

            // ── Step 5: Verify original fields are auto-populated ──
            Logger.info('🔍 Step 5: Verifying original fields auto-populated...');
            await ctx.promptCreatorService.verifyRewritePromptAutoPopulation(originalTestData);

            // ── Step 6: Fill rewritten prompt data ──
            // createPrompt uses smartFill — skips fields already correct,
            // overwrites fields that differ from originalTestData
            Logger.info('✏️ Step 6: Filling rewritten prompt data...');
            await ctx.promptCreatorService.createPrompt(rewrittenTestData);

            // ── Step 7: Run the rewritten prompt ──
            Logger.info('▶️ Step 7: Running rewritten prompt...');
            await ctx.promptCreatorService.runPrompt();

            // ── Step 8: Wait for workbench with rewritten prompt responses ──
            Logger.info('⏳ Step 8: Waiting for workbench with rewritten prompt...');
            await ctx.workbenchService.verifyNavigation(rewrittenTestData);
            await ctx.workbenchService.waitForBaseResponses(
                rewrittenTestData.expectedBaseResponsesCount
            );

            // ── Step 9: Verify responses match rewritten prompt ──
            Logger.info('🔍 Step 9: Verifying responses for rewritten prompt...');
            await ctx.workbenchService.verifyBaseResponses({
                [rewrittenTestData.id]: rewrittenTestData.expectedResponse
            });

            const duration = ((Date.now() - start) / 1000).toFixed(1);
            Logger.info(`✅ Rewrite Prompt flow validated in ${duration}s`);

        } catch (error) {
            Logger.error('❌ Rewrite Prompt validation failed');
            throw error;
        }
    }
}