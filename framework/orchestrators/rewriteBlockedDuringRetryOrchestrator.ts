import { TestContext } from '../core/TestContext';
import { PromptTestData } from '../../types/promptTestData.type';
import { Logger } from '../utils/Logger';
import { prompts } from '../../data/prompts/prompts';

export class RewriteBlockedDuringRetryOrchestrator {
    constructor(private context: TestContext) {}

    async run(testData: PromptTestData): Promise<void> {
        const ctx = this.context;
        const config = ctx.config;
        const promptConfig = prompts[testData.id];

        if (!promptConfig) {
            throw new Error(`No prompt config found for id: "${testData.id}"`);
        }

        Logger.info('⏱️ Starting Rewrite Blocked During Retry validation...');
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

            // ── Create Prompt ──
            await ctx.promptCreatorService.createPrompt(testData);
            await ctx.promptCreatorService.runPrompt();

            // ── Navigate to Workbench ──
            await ctx.workbenchService.verifyNavigation(testData);

            // ── Wait for base responses ──
            await ctx.workbenchService.waitForBaseResponses(
                testData.expectedBaseResponsesCount
            );

            // ── Core test: verify rewrite is blocked during retry ──
            // Uses response index 1 — first base response
            await ctx.workbenchService.verifyRewriteBlockedDuringRetry(1);

            const duration = ((Date.now() - start) / 1000).toFixed(1);
            Logger.info(`✅ Rewrite blocked during retry validated in ${duration}s`);

        } catch (error) {
            Logger.error('❌ Rewrite blocked during retry validation failed');
            throw error;
        }
    }
}