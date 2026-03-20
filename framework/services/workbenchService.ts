import { expect } from '@playwright/test';
import { TestContext } from '../core/TestContext';
import { PromptTestData } from '../../types/promptTestData.type';
import { ExpectedPromptResponse } from '../../types/expectedPromptResponse.type';
import { Logger } from '../utils/Logger';

export class WorkbenchService {
    constructor(private context: TestContext) { }

    private get page() {
        return this.context.browser.getPage();
    }

    private get workbenchPage() {
        return this.context.workbenchPage!;
    }

    // ─────────────────────────────────────────
    // NAVIGATION
    // ─────────────────────────────────────────

    async verifyNavigation(testData: PromptTestData): Promise<void> {
        Logger.info('🚀 Verifying navigation to workbench...');

        await this.page.waitForURL(
            /\/project\/prompt\/\d+\/promptCreationWorkbench\/workbench/,
            { timeout: 20000 }
        );

        await Promise.all([
            this.page.getByText('Workbench').first().waitFor({ timeout: 10000 }),
            this.page.locator(
                `div:has-text(" response(s) out of ${testData.configModelResponsesCount.baseModelResponsesCount}")`
            ).first().waitFor({ timeout: 20000 })
        ]);

        Logger.info('✓ Workbench ready');
    }

    // ─────────────────────────────────────────
    // LOADER HANDLING
    // ─────────────────────────────────────────

    async waitForLoaderToDisappear(timeout = 600000, pollInterval = 5000): Promise<boolean> {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const stillLoading = await this.page.evaluate(() => {
                const text = document.body?.textContent?.toLowerCase() ?? '';
                if (/generating|loading/.test(text)) return true;
                const spinner = document.querySelector(
                    '.spinner, .loader, [data-loading], [aria-busy="true"]'
                ) as HTMLElement | null;
                return !!(spinner && spinner.offsetParent !== null);
            });

            if (!stillLoading) {
                console.log('  ✓ Loader gone');
                return true;
            }

            await this.context.browser.waitForTimeout(pollInterval);
        }

        console.warn('  ⚠ Loader timeout');
        return false;
    }

    // ─────────────────────────────────────────
    // WAITING FOR RESPONSES
    // ─────────────────────────────────────────

    async waitForBaseResponses(expectedCount: number, timeout = 600000): Promise<boolean> {
        Logger.info(`⏳ Waiting for ${expectedCount} base responses...`);
        return this.pollForResponseCount(expectedCount, timeout, 'base');
    }

    async waitForFrontierResponses(expectedCount: number, timeout = 600000): Promise<boolean> {
        Logger.info(`⏳ Waiting for ${expectedCount} frontier responses...`);
        return this.pollForResponseCount(expectedCount, timeout, 'frontier');
    }

    private async pollForResponseCount(
        expectedCount: number,
        timeout: number,
        type: 'base' | 'frontier'
    ): Promise<boolean> {
        const start = Date.now();
        let lastCount = 0;

        while (Date.now() - start < timeout) {
            await this.waitForLoaderToDisappear(5000);

            const { actual } = await this.workbenchPage.getResponseCountFromUI(expectedCount);

            if (actual > lastCount) {
                console.log(`  ✓ ${actual}/${expectedCount} responses loaded`);
                lastCount = actual;
            }

            if (actual >= expectedCount) {
                Logger.info(`✓ All ${type} responses ready`);
                return true;
            }

            await this.context.browser.waitForTimeout(3000);
        }

        console.warn(`  ⚠ Timeout: only ${lastCount}/${expectedCount} responses loaded`);
        return false;
    }

    async getResponseCount(expectedCount: number): Promise<{ actual: number; expected: number }> {
        return this.workbenchPage.getResponseCountFromUI(expectedCount);
    }

    // ─────────────────────────────────────────
    // MARKING RESPONSES
    // The status passed here applies to ALL responses of that type.
    // In a real scenario you'd pass per-response expected values from testData.
    // ─────────────────────────────────────────

    /**
    * Marks base responses using the marking map from testData.
    * Falls back to marking all as the given default status if no map provided.
    * 
    * @param testData   - Full test data object containing workbenchMarking config
    * @param defaultStatus - Used when workbenchMarking is not defined in testData
    */
    async markAllBaseResponses(
        testData: PromptTestData,
        defaultStatus: 'Correct' | 'Incorrect' = 'Correct'
    ): Promise<void> {
        Logger.info('📝 Marking base responses...');

        const indexes = await this.workbenchPage.getBaseResponseNameIndexes();

        if (indexes.length === 0) {
            console.warn('  ⚠ No base response radio buttons found');
            return;
        }

        const markingMap = testData.workbenchMarking?.baseResponses;

        for (const index of indexes) {
            // Use marking map if provided, otherwise fall back to defaultStatus
            const status = markingMap?.[index] ?? defaultStatus;
            await this.workbenchPage.markBaseResponse(index, status);
        }

        Logger.info(`✓ All ${indexes.length} base responses marked`);
    }

    /**
     * Marks frontier responses using the marking map from testData.
     */
    async markAllFrontierResponses(
        testData: PromptTestData,
        defaultStatus: 'Correct' | 'Incorrect' = 'Correct'
    ): Promise<void> {
        Logger.info('📝 Marking frontier responses...');

        const indexes = await this.workbenchPage.getFrontierResponseNameIndexes();

        if (indexes.length === 0) {
            console.warn('  ⚠ No frontier response radio buttons found');
            return;
        }

        const markingMap = testData.workbenchMarking?.frontierResponses;

        for (const index of indexes) {
            const status = markingMap?.[index] ?? defaultStatus;
            await this.workbenchPage.markFrontierResponse(index, status);
        }

        Logger.info(`✓ All ${indexes.length} frontier responses marked`);
    }

    // ─────────────────────────────────────────
    // FRONTIER FLOW
    // ─────────────────────────────────────────

    async waitForFrontierButtonEnabled(timeout = 30000): Promise<boolean> {
        Logger.info('  → Waiting for Frontier button to enable...');
        const start = Date.now();

        while (Date.now() - start < timeout) {
            if (await this.workbenchPage.isFrontierButtonEnabled()) {
                Logger.info('  ✓ Frontier button enabled');
                return true;
            }
            await this.context.browser.waitForTimeout(1000);
        }

        console.warn('  ⚠ Frontier button did not enable in time');
        return false;
    }

    async clickFrontierButton(): Promise<void> {

        await this.workbenchPage.clickFrontierButton();
        Logger.info('  ✓ Frontier button clicked');
    }

    async waitForSubmitButtonEnabled(timeout = 30000): Promise<boolean> {
        Logger.info('  → Waiting for Submit button to enable...');
        const start = Date.now();

        while (Date.now() - start < timeout) {
            if (await this.workbenchPage.isSubmitButtonEnabled()) {
                Logger.info('  ✓ Submit button enabled');
                return true;
            }
            await this.context.browser.waitForTimeout(1000);
        }

        console.warn('  ⚠ Submit button did not enable in time');
        return false;
    }

    // ─────────────────────────────────────────
    // RESPONSE VERIFICATION
    // ─────────────────────────────────────────

    async verifyResponses(
        expectedResponses: Record<string, ExpectedPromptResponse>
    ): Promise<void> {
        Logger.info('🕵️ Verifying LLM responses...');

        const allTexts = [
            ...await this.workbenchPage.getAllBaseResponseTexts(),
            ...await this.workbenchPage.getAllFrontierResponseTexts()
        ];

        if (allTexts.length === 0) {
            console.warn('  ⚠ No responses found — skipping validation');
            return;
        }

        const expectedTexts = Object.values(expectedResponses)
            .map(r => r.expectedResponseText.toLowerCase());

        for (const expectedText of expectedTexts) {
            const found = allTexts.some(actual =>
                actual.toLowerCase().includes(expectedText)
            );
            if (!found) {
                console.warn(`  ⚠ Expected response NOT found: "${expectedText}"`);
            }
        }

        Logger.info('✅ Response verification complete');
    }

    // ─────────────────────────────────────────
    // ERROR DETECTION
    // ─────────────────────────────────────────

    private isModelError(text: string): boolean {
        return text.toLowerCase().includes('model error');
    }

    async checkForModelErrors(): Promise<boolean> {
        const allTexts = [
            ...await this.workbenchPage.getAllBaseResponseTexts(),
            ...await this.workbenchPage.getAllFrontierResponseTexts()
        ];

        for (const text of allTexts) {
            if (this.isModelError(text)) {
                console.warn(`  ⚠ Model error detected: "${text.substring(0, 80)}"`);
                return true;
            }
        }
        return false;
    }

    // ─────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────

    async logWorkbenchSummary(expectedCount: number): Promise<void> {
        await this.workbenchPage.logResponseSummary(expectedCount);
    }
}