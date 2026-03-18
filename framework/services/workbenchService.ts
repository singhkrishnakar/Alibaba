// Workbench Orchestrator - Handles response waiting and workbench operations

import { Page } from 'playwright';
import { AutomationConfig } from '../../config/config';
import { TestContext } from '../core/TestContext';
import { PromptTestData } from '../../types/testData.type';
import { Logger } from '../utils/Logger';
import { ProjectDetailPage } from '../pages/projectDetailPage';
import { ExportPromptOrchestrator } from '../orchestrators/exportPromptOrchestrator';
import { ExpectedPromptFields } from '../../data/expectedPromptFields';


export class WorkbenchService {
    verifyResponses(testData: PromptTestData) {
        //throw new Error("Method not implemented.");
    }
    constructor(private context: TestContext) {}

    // ✅ Short accessors (cleaner)
    private get page() {
        return this.context.browser.getPage();
    }

    private get workbenchPage() {
        return this.context.workbenchPage!;
    }

    // ==================== NAVIGATION ====================

    async verifyNavigation(testData: PromptTestData): Promise<void> {
        console.log('🚀 Verifying navigation to workbench...');

        const page = this.page;
        if (!page) throw new Error('No active page');

        await page.waitForURL(
            /\/project\/prompt\/\d+\/promptCreationWorkbench\/workbench/,
            { timeout: 20000 }
        );

        await Promise.all([
            page.getByText('Workbench').first().waitFor(),
            page.locator('#elapseTime').waitFor(),
            page.locator(`text=/\\d+ response\\(s\\) out of ${testData.expectedBaseResponsesCount}/`)
                .first()
                .waitFor()
        ]);

        console.log('✓ Workbench ready');
    }

    // ==================== LOADER ====================

    async waitForLoaderToDisappear(
        timeout = 600000,
        pollInterval = 5000
    ): Promise<boolean> {

        const start = Date.now();

        while (Date.now() - start < timeout) {

            const stillLoading = await this.page.evaluate(() => {
                const text = document.body?.textContent?.toLowerCase() || "";

                if (/generating|loading/.test(text)) return true;

                const spinner = document.querySelector(
                    '.spinner, .loader, [data-loading], [aria-busy="true"]'
                ) as HTMLElement | null;

                return !!(spinner && spinner.offsetParent !== null);
            });

            if (!stillLoading) {
                console.log('✓ Loader gone');
                return true;
            }

            await this.context.browser.waitForTimeout(pollInterval);
        }

        console.warn('⚠ Loader timeout');
        return false;
    }

    // ==================== RESPONSES ====================

    async waitForResponses(
        expectedCount: number,
        timeout = 600000
    ): Promise<boolean> {

        console.log(`⏳ Waiting for ${expectedCount} responses...`);

        const start = Date.now();
        let lastCount = 0;

        while (Date.now() - start < timeout) {

            await this.waitForLoaderToDisappear(5000);

            const count = await this.workbenchPage.getResponseCount().catch(() => 0);

            if (count > lastCount) {
                console.log(`  ✓ ${count}/${expectedCount}`);
                lastCount = count;
            }

            if (count >= expectedCount) {
                console.log('✓ All responses ready');
                return true;
            }

            await this.context.browser.waitForTimeout(3000);
        }

        console.warn(`⚠ Timeout: ${lastCount}/${expectedCount}`);
        return false;
    }

    async getAllResponses(): Promise<string[]> {
        const responses = await this.workbenchPage.getAllResponseTexts();

        console.log(`📖 ${responses.length} responses fetched`);

        return responses;
    }

    async getResponseCount(): Promise<number> {
        return this.workbenchPage.getResponseCount();
    }

    // ==================== FRONTIER ====================

    async clickFrontierButton(): Promise<boolean> {
        const btn = this.page.locator('button:has-text("Test on Frontier Models")');

        if (await btn.count() === 0) return false;

        await btn.first().click().catch(async () => {
            await this.page.evaluate(() => {
                const el = document.querySelector('button:has-text("Test on Frontier Models")') as HTMLElement;
                el?.click();
            });
        });

        console.log('✓ Frontier button clicked');
        return true;
    }

    async waitForFrontierResponses(
        expectedNew: number,
        timeout = 600000
    ): Promise<boolean> {

        const before = await this.getResponseCount();
        const target = before + expectedNew;

        console.log(`🚀 Waiting for frontier responses → target ${target}`);

        return this.waitForResponses(target, timeout);
    }

    async isFrontierEnabled(): Promise<boolean> {
        const btn = this.page.locator('button:has-text("Test on Frontier Models")');

        if (await btn.count() === 0) return false;

        return !(await btn.first().isDisabled());
    }

    async waitForFrontierEnabled(timeout = 10000): Promise<boolean> {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            if (await this.isFrontierEnabled()) {
                console.log('✓ Frontier enabled');
                return true;
            }
            await this.context.browser.waitForTimeout(1000);
        }

        console.warn('⚠ Frontier not enabled');
        return false;
    }

    //need confirmation on thi
    /*
        async runPrompt(testData: PromptTestData) {

        const created = await this.context.promptCreator.createPrompt(testData, true);
        if (!created) throw new Error("Prompt creation failed");

        await this.context.workbenchOrchestrator.verifyUserNavigatedToWorkbench(
            this.context.config.project.baseUrl,
            testData
        );

        await this.context.workbenchOrchestrator.waitForAllResponses(
            testData.expectedBaseResponsesCount,
            600000
        );

        await this.context.workbenchOrchestrator.getAllResponses();
        await this.context.responseEvaluator.mark2Incorrect3Correct();
    }
        */
}
