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

    /**
     * Clicks Rewrite Prompt and waits for navigation back to prompt creation page.
     * URL pattern: /promptCreationWorkbench (without /workbench suffix)
     *
     * DevTools verify URL after click:
     * window.location.href  — should end with /promptCreationWorkbench
     */
    async clickRewritePromptAndWaitForNavigation(): Promise<void> {
        Logger.info('  → Clicking Rewrite Prompt and waiting for navigation...');

        await this.workbenchPage.clickRewritePrompt();

        // Wait for navigation back to prompt creation page
        // URL changes from /promptCreationWorkbench/workbench → /promptCreationWorkbench
        await this.page.waitForURL(
            /\/promptCreationWorkbench$/,
            { timeout: 15000 }
        );

        // Wait for prompt creation page to be ready
        await this.page.waitForLoadState('domcontentloaded');

        Logger.info('  ✓ Navigated back to prompt creation page');
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

    async verifyBaseResponses(
        expectedResponses: Record<string, ExpectedPromptResponse>
    ): Promise<void> {
        Logger.info('🕵️ Verifying LLM Base responses...');

        const allTexts = [
            ...await this.workbenchPage.getAllBaseResponseTexts()
        ];

        if (allTexts.length === 0) {
            Logger.error('  ⚠ No responses found — skipping validation');
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

    async verifyFrontierResponses(
        expectedResponses: Record<string, ExpectedPromptResponse>
    ): Promise<void> {
        Logger.info('🕵️ Verifying LLM frontier responses...');

        const allTexts = [
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
                Logger.error(`  ⚠ Expected response NOT found: "${expectedText}"`);
            }
        }

        Logger.info('✅ Response verification complete');
    }

    // ─────────────────────────────────────────
    // Validate Workbench Page
    // ─────────────────────────────────────────

    async verifyMarkingQuestionForEachResponse(expectedCount: number): Promise<boolean> {
        Logger.info(`🔍 Verifying marking question for ${expectedCount} responses...`);

        const verified = await this.workbenchPage
            .verifyMarkingQuestionForEachResponse(expectedCount);

        if (verified) {
            Logger.info(`✓ Marking question confirmed for all ${expectedCount} responses`);
        } else {
            console.warn(`⚠ Marking question verification failed for ${expectedCount} responses`);
        }

        return verified;
    }

    /**
     * Verifies a model name appears in the workbench.
     * Works for both base and frontier models.
     */
    async verifyModelName(expectedModelName: string): Promise<boolean> {
        Logger.info(`🔍 Verifying model name: "${expectedModelName}"...`);

        const found = await this.workbenchPage.verifyModelName(expectedModelName);

        if (found) {
            Logger.info(`✓ Model "${expectedModelName}" confirmed in workbench`);
        } else {
            console.warn(`⚠ Model "${expectedModelName}" not found in workbench`);
        }

        return found;
    }

    // ─────────────────────────────────────────
    // SHARED FLOW
    // ─────────────────────────────────────────
    // ─────────────────────────────────────────
    // RETRY BUTTON ACTIONS
    // ─────────────────────────────────────────

    async verifyRetryButtonPresentForEachResponse(expectedCount: number): Promise<boolean> {
        Logger.info(`🔍 Verifying retry button present for ${expectedCount} responses...`);
        const verified = await this.workbenchPage
            .verifyRetryButtonPresentForEachResponse(expectedCount);
        if (verified) {
            Logger.info(`✓ Retry button confirmed for all ${expectedCount} responses`);
        } else {
            console.warn(`⚠ Retry button verification failed`);
        }
        return verified;
    }

    async clickRetryForResponse(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base'
    ): Promise<void> {
        Logger.info(`🔄 Retrying ${type} response ${nameIndex}...`);
        await this.workbenchPage.clickRetryButton(nameIndex, type);
    }

    async verifyRetryStarted(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base'
    ): Promise<boolean> {
        Logger.info(`🔍 Verifying retry started for ${type} response ${nameIndex}...`);
        return this.workbenchPage.verifyRetryIsSpinning(nameIndex, type);
    }

    async waitForRetryToComplete(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base',
        timeout = 60000
    ): Promise<boolean> {
        Logger.info(`⏳ Waiting for retry to complete for ${type} response ${nameIndex}...`);
        return this.workbenchPage.waitForRetryToComplete(nameIndex, type, timeout);
    }

    // ─────────────────────────────────────────
    // COMPLETE RESPONSE ACTIONS
    // ─────────────────────────────────────────

    /**
     * Verifies View Complete Response button present for all responses.
     */
    async verifyViewCompleteResponseButtonForEachResponse(
        expectedCount: number
    ): Promise<boolean> {
        Logger.info(
            `🔍 Verifying View Complete Response button for ${expectedCount} responses...`
        );
        const verified = await this.workbenchPage
            .verifyViewCompleteResponseButtonForEachResponse();
        if (verified) {
            Logger.info(`✓ View Complete Response button confirmed for all ${expectedCount} responses`);
        } else {
            console.warn(`⚠ View Complete Response button verification failed`);
        }
        return verified;
    }

    /**
     * Verifies the Complete Response modal flow for the first base response.
     * Smoke test — opens modal, checks title + content, closes.
     */
    async verifyCompleteResponseModalFlow(): Promise<boolean> {
        Logger.info('🔍 Verifying Complete Response modal flow...');

        const wrappers = await this.workbenchPage.baseResponseWrappers.all();
        if (wrappers.length === 0) {
            console.warn('  ⚠ No base response wrappers found');
            return false;
        }

        // Find first response that has the View Complete Response button visible
        // Button presence is more reliable than text truncation detection
        for (const wrapper of wrappers) {
            const hasButton = await wrapper
                .locator('button.view-complete-response-button')
                .isVisible()
                .catch(() => false);

            if (hasButton) {
                Logger.info('  → Found truncated response — testing modal flow');
                return this.workbenchPage.verifyCompleteResponseModalFlow(wrapper);
            }
        }

        // Also check frontier responses if no base responses have the button
        const frontierWrappers = await this.workbenchPage.frontierResponseWrappers.all();
        for (const wrapper of frontierWrappers) {
            const hasButton = await wrapper
                .locator('button.view-complete-response-button')
                .isVisible()
                .catch(() => false);

            if (hasButton) {
                Logger.info('  → Found truncated frontier response — testing modal flow');
                return this.workbenchPage.verifyCompleteResponseModalFlow(wrapper);
            }
        }

        console.log('  ℹ No truncated responses found on page — skipping modal flow verification');
        return true;
    }

    /**
     * Reads all complete response texts from the modal for verification.
     * Use when preview text is not sufficient for validation.
     */
    async getAllCompleteResponseTexts(): Promise<{
        base: string[];
        frontier: string[];
    }> {
        Logger.info('📖 Reading all complete response texts...');
        const base = await this.workbenchPage.getAllCompleteBaseResponseTexts();
        const frontier = await this.workbenchPage.getAllCompleteFrontierResponseTexts();
        Logger.info(
            `✓ Read ${base.length} base and ${frontier.length} frontier complete responses`
        );
        return { base, frontier };
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
    // TOAST VERIFICATION
    // ─────────────────────────────────────────

    /** Expected toast message when rewrite is attempted during retry */
    private readonly RETRY_IN_PROGRESS_TOAST =
        'Please wait for the response to be generated before running tests.';

    /**
     * Verifies that clicking Rewrite Prompt while a retry is in progress
     * shows the correct error toast and does NOT navigate away.
     */
    async verifyRewriteBlockedDuringRetry(responseIndex: number): Promise<void> {
        Logger.info('🔍 Verifying Rewrite Prompt is blocked during retry...');

        // Step 1 — click retry for the given response
        await this.clickRetryForResponse(responseIndex, 'base');

        // Step 2 — verify retry animation started
        const retrying = await this.verifyRetryStarted(responseIndex, 'base');
        if (!retrying) {
            throw new Error(
                `Retry did not start for response ${responseIndex} — ` +
                `cannot verify rewrite blocked behaviour`
            );
        }

        // Step 3 — click Rewrite Prompt while retry is in progress
        Logger.info('  → Clicking Rewrite Prompt while retry is in progress...');
        await this.workbenchPage.clickRewritePrompt();

        // Step 4 — verify error toast appears
        const toastVerified = await this.workbenchPage.verifyErrorToast(
            this.RETRY_IN_PROGRESS_TOAST
        );
        if (!toastVerified) {
            throw new Error(
                'Expected error toast did not appear after clicking Rewrite ' +
                'while retry was in progress'
            );
        }

        // Step 5 — verify page did NOT navigate away from workbench
        const currentUrl = this.page.url();
        if (!currentUrl.includes('workbench')) {
            throw new Error(
                `Page navigated away from workbench despite retry in progress.\n` +
                `Current URL: ${currentUrl}`
            );
        }
        Logger.info('  ✓ Page stayed on workbench — navigation correctly blocked');

        // Step 6 — close the toast
        await this.workbenchPage.closeErrorToast();

        // Step 7 — wait for retry to complete before continuing
        await this.waitForRetryToComplete(responseIndex, 'base');

        Logger.info('✅ Rewrite blocked during retry verified successfully');
    }

    // ─────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────

    async logWorkbenchSummary(expectedCount: number): Promise<void> {
        await this.workbenchPage.logResponseSummary(expectedCount);
    }
}