// Workbench Orchestrator - Handles response waiting and workbench operations
import { BrowserManager } from '../browser/browserManager';
import { WorkbenchPage } from '../pages/workbenchPage';
import { PromptTestData, promptData } from "../../data/promptData";
import { Page } from 'playwright';
import { AutomationConfig } from '../../config/config';

export class WorkbenchOrchestrator {
    private workbenchPage: WorkbenchPage | null = null;

    constructor(private browser: BrowserManager,
        private config: AutomationConfig
    ) { }

    // async initWorkbenchPage() {
    //     const page = this.browser.getPage(); // throws if browser not launched
    //     this.workbenchPage = new WorkbenchPage(page);
    // }

    async initialize() {

        this.workbenchPage = new WorkbenchPage(this.browser);

        //await this.workbenchPage.waitForResponses();

    }

    get workbench(): WorkbenchPage {
        if (!this.workbenchPage) throw new Error('WorkbenchPage not initialized. Call initWorkbenchPage() first.');
        return this.workbenchPage;
    }



    async handleResponses(testData: PromptTestData) {

        await this.verifyUserNavigatedToWorkbench(
            this.config.project.baseUrl,
            testData
        );

        await this.waitForAllResponses(
            testData.expectedBaseResponsesCount,
            600000
        );

    }

    /*Confirm navigation to workbench page by checking for a common workbench element (e.g., response container)*/
    async verifyUserNavigatedToWorkbench(baseUrl: string, config: PromptTestData): Promise<void> {
        console.log('🚀 Verifying navigation to workbench...');

        // Get current page from browser
        let page = this.browser.getPage();
        if (!page) throw new Error('No active page available');

        try {
            // Wait for URL pattern to match workbench (use a regex to handle dynamic IDs)
            await page.waitForURL(
                /\/project\/prompt\/\d+\/promptCreationWorkbench\/workbench/,
                { timeout: 20000 } // 20s to allow page load
            );

            console.log('⏳ Waiting for Workbench to be ready...');

            await Promise.all([
                page.getByText('Workbench').first().waitFor({ timeout: 20000 }),
                page.locator('#elapseTime').waitFor({ timeout: 20000 }),
                page.locator(`text=/\\d+ response\\(s\\) out of ${config.expectedBaseResponsesCount}/`)
                    .first()
                    .waitFor({ timeout: 20000 })
            ]);

            console.log('✓ Workbench page ready');
            console.log(`✓ Workbench loaded and prompt "${config.prompt.promptText}" is visible`);
        } catch (error) {
            console.error('⚠ Workbench page not reached after prompt creation', error);

            // Check if page is closed, then throw meaningful error
            if (page.isClosed()) {
                throw new Error('Browser page was closed before Workbench could load');
            }

            throw error;
        }
    }

    /**
     * Wait for all responses to generate on the workbench
     * Polls for responses and logs progress as they appear
     */
    /**
     * Wait for a loading indicator to disappear before counting responses.
     * Looks for common keywords and spinner classes. (enhanced polling version below)
     */
    async waitForLoaderToDisappear(timeout: number = 600000, pollInterval: number = 10000): Promise<boolean> {
        const page = this.browser.getPage();
        const start = Date.now();
        try {
            while (Date.now() - start < timeout) {
                const stillLoading = await page.evaluate(() => {
                    const body = document.querySelector('body');
                    if (!body) return false;
                    const text = (body.textContent || '').toLowerCase();
                    if (/generating response|generating responses|generating|loading/.test(text)) return true;
                    const spinner = document.querySelector('.spinner, .loader, [data-loading], [aria-busy="true"]') as HTMLElement | null;
                    if (spinner && (spinner as any).offsetParent !== null) return true;
                    return false;
                });

                if (!stillLoading) {
                    console.log('  ✓ Loader/disclaimer gone or no loader detected');
                    return true;
                }

                console.log(`  … loader still present, waiting ${pollInterval / 1000}s`);
                await this.browser.waitForTimeout(pollInterval);
            }

            console.log('  ⚠ Loader did not disappear within timeout');
            return false;
        } catch (e) {
            console.error(`✗ Error while waiting for loader to disappear: ${e}`);
            return false;
        }
    }

    async waitForAllResponses(expectedCount: number = 5, maxWaitTime: number = 600000): Promise<boolean> {
        console.log(`⏳ Waiting (up to ${maxWaitTime / 1000}s) for ${expectedCount} responses...`);
        const startTime = Date.now();
        const pollInterval = 3000; // 3s polling to balance responsiveness with load

        let lastLoggedCount = 0;

        while (Date.now() - startTime < maxWaitTime) {
            const page = this.browser.getPage();
            if (!page || page.isClosed()) throw new Error('Page closed while waiting for responses');

            // Wait for loader to disappear safely
            await this.waitForLoaderToDisappear(pollInterval / 2).catch(e => {
                console.warn('Loader check failed (ignored):', e);
            });

            // Count responses
            const currentCount = await this.workbenchPage!.getResponseCount().catch(e => {
                console.warn('getResponseCount failed (ignored):', e);
                return 0;
            });

            if (currentCount > lastLoggedCount) {
                console.log(`  ✓ Response ${currentCount} of ${expectedCount} ready`);
                lastLoggedCount = currentCount;
            }

            if (currentCount >= expectedCount) {
                console.log(`✓ All ${expectedCount} responses ready`);
                return true;
            }

            await this.browser.waitForTimeout(pollInterval);
        }

        console.warn(`⚠ Timeout reached; got ${lastLoggedCount}/${expectedCount} responses`);
        return lastLoggedCount >= expectedCount;
    }

    /**
     * Retrieve all response texts from the workbench
     */
    async getAllResponses(): Promise<string[]> {
        try {
            console.log('📖 Retrieving all response texts...');
            const responses = await this.workbenchPage!.getAllResponseTexts();
            console.log(`✓ Retrieved ${responses.length} responses:`);
            responses.forEach((text, index) => {
                console.log(`  [${index + 1}] ${text.substring(0, 80)}...`);
            });
            return responses;
        } catch (error) {
            console.error(`✗ Error retrieving responses: ${error}`);
            return [];
        }
    }

    /**
     * Get specific response text by index
     */
    async getResponse(index: number): Promise<string> {
        try {
            return await this.workbenchPage!.getResponseText(index);
        } catch (error) {
            console.error(`✗ Error getting response ${index}: ${error}`);
            return '';
        }
    }

    /**
     * Get current question/prompt text displayed on workbench
     */
    async getQuestionText(): Promise<string> {
        try {
            const question = await this.workbenchPage!.getQuestionText();
            console.log(`📋 Question: ${question.substring(0, 100)}...`);
            return question;
        } catch (error) {
            console.error(`✗ Error getting question text: ${error}`);
            return '';
        }
    }

    /**
     * Convenience wrapper to expose the underlying page object's
     * response count method. Used by callers that need the current
     * total (e.g. main automation to detect new frontier responses).
     */
    async getResponseCount(): Promise<number> {
        try {
            return await this.workbenchPage!.getResponseCount();
        } catch (error) {
            console.error(`✗ Could not get response count from orchestrator: ${error}`);
            return 0;
        }
    }

    /**
     * Wait for responses and debug log them
     */
    async waitAndDebugResponses(expectedCount: number = 5): Promise<void> {
        const ready = await this.waitForAllResponses(expectedCount);
        if (ready) {
            await this.workbenchPage!.debugLogResponses();
        } else {
            console.log('⚠ Not all responses loaded, logging what we have:');
            await this.workbenchPage!.debugLogResponses();
        }
    }

    /**
     * Check if all responses are marked (for evaluation)
     */
    async areAllResponsesMarked(): Promise<boolean> {
        try {
            return await this.workbenchPage!.allResponsesMarked();
        } catch (error) {
            console.error(`✗ Error checking response marks: ${error}`);
            return false;
        }
    }

    /**
     * Take screenshot of current workbench state
     */
    async takeWorkbenchScreenshot(name: string): Promise<void> {
        try {
            await this.browser.takeScreenshot(name);
        } catch (error) {
            console.error(`✗ Failed to take screenshot: ${error}`);
        }
    }

    /**
     * Dump workbench page HTML for debugging
     */
    async dumpWorkbenchHTML(filename: string): Promise<void> {
        try {
            const page = this.browser.getPage();
            const html = await page.content();
            const fs = require('fs');
            fs.writeFileSync(`./screenshots/${filename}.html`, html);
            console.log(`📄 Workbench HTML dumped to ${filename}.html`);
        } catch (error) {
            console.error(`✗ Error dumping HTML: ${error}`);
        }
    }

    /**
     * Test prompt on frontier models
     * Clicks "Test on Frontier Models" button and waits for frontier responses
     */
    async testOnFrontierModels(
        expectedFrontierResponses: number = 10,
        maxWaitTime: number = 600000
    ): Promise<boolean> {

        console.log('\n✊ Testing prompt on frontier models...');

        try {
            const page = this.browser.getPage();

            const selectors = [
                'button:has-text("Test on Frontier Models")'
            ];

            let buttonClicked = false;

            for (const selector of selectors) {
                try {

                    const button = page.locator(selector);

                    if (await button.count() > 0) {

                        await button.first().click({ timeout: 5000 }).catch(async () => {

                            await page.evaluate((sel) => {
                                const el = document.querySelector(sel) as HTMLElement;
                                if (el) el.click();
                            }, selector);

                        });

                        buttonClicked = true;
                        break;
                    }

                } catch (e) { }
            }

            if (!buttonClicked) {
                console.log('⚠ Could not find or click "Test on Frontier Models" button');
                return false;
            }

            console.log('✓ Clicked "Test on Frontier Models" button');

            await this.browser.waitForTimeout(2000);

            // ✅ IMPORTANT FIX
            const responsesLoaded = await this.waitForFrontierResponses(
                expectedFrontierResponses,
                maxWaitTime
            );

            return responsesLoaded;

        } catch (error) {

            console.error(`✗ Error testing on frontier models: ${error}`);

            return false;
        }
    }

    /**
 * Waits for Frontier responses to generate and validates their availability.
 */
    async waitForFrontierResponses(
        expectedFrontierResponses: number = 10,
        maxWaitTime: number = 600000
    ): Promise<boolean> {

        console.log(`🚀 Waiting for Frontier responses (expected: ${expectedFrontierResponses})`);

        // Step 1: Get existing response count
        const beforeCount = await this.workbenchPage!.getResponseCount();
        console.log(`📊 Existing responses before generation: ${beforeCount}`);

        // Step 2: Wait for loader to disappear
        const loaderTimeout = Math.max(maxWaitTime, 600000);

        console.log(`⏳ Waiting for loader to clear (polling every 5s, timeout: ${loaderTimeout / 1000}s)`);

        const loaderGone = await this.waitForLoaderToDisappear(loaderTimeout, 5000);

        if (!loaderGone) {
            console.warn("⚠ Loader still present after timeout — continuing to check responses.");
        }

        // Step 3: Calculate total expected responses
        const totalTarget = beforeCount + expectedFrontierResponses;

        console.log(`📥 Waiting for ${expectedFrontierResponses} new responses (target total ≥ ${totalTarget})`);

        const responsesReady = await this.waitForAllResponses(totalTarget, maxWaitTime);

        if (responsesReady) {

            console.log("✅ Expected frontier responses received.");

            // Step 4: Ensure loader actually cleared
            const loaderCleared = await this.waitForLoaderToDisappear(loaderTimeout, 10000);

            if (!loaderCleared) {
                console.warn("⚠ Loader still visible even though responses are ready.");
            }

            // Step 5: Capture screenshot
            await this.browser.takeScreenshot("07_frontier_responses_loaded");

            return true;
        }

        // Step 6: Failure case
        console.warn("⚠ Frontier responses did not fully load within expected time.");

        console.log("📋 Logging available responses for debugging...");
        await this.getAllFrontierResponses();

        await this.browser.takeScreenshot("07_frontier_responses_timeout");

        return false;
    }


    /**
     * Get all frontier model responses
     */
    async getAllFrontierResponses(): Promise<string[]> {
        try {
            console.log('📖 Retrieving all frontier model responses...');
            const responses = await this.workbenchPage!.getAllResponseTexts();
            const response = this.getAllResponses(); // reuse existing method which already logs responses
            console.log(`✓ Retrieved ${responses.length} frontier responses:`);
            responses.forEach((text, index) => {
                console.log(`  [Frontier ${index + 1}] ${text.substring(0, 80)}...`);
            });
            return responses;
        } catch (error) {
            console.error(`✗ Error retrieving frontier responses: ${error}`);
            return [];
        }
    }

    /**
     * Check if "Test on Frontier Models" button is enabled
     */
    async isFrontierButtonEnabled(): Promise<boolean> {
        try {
            const page = this.browser.getPage();

            // Try multiple selectors with timeout
            const selectors = [
                'button:has-text("Test on Frontier Models")',
                'button:contains("Test on Frontier")',
                'button:contains("Frontier")',
                'button[aria-label*="Frontier" i]',
                'button[aria-label*="frontier" i]'
            ];

            for (const selector of selectors) {
                try {
                    const button = page.locator(selector);
                    const count = await button.count().catch(() => 0);
                    if (count > 0) {
                        const isDisabled = await button.first().evaluate(el => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true', { timeout: 1000 }).catch(() => true);
                        return !isDisabled;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            return false;
        } catch (error) {
            console.error(`✗ Error checking frontier button status: ${error}`);
            return false;
        }
    }

    /**
     * Wait for frontier button to be enabled (after minimum incorrect responses are marked)
     */
    async waitForFrontierButtonEnabled(maxWaitTime: number = 10000): Promise<boolean> {
        console.log('\n⏳ Waiting for "Test on Frontier Models" button to be enabled...');
        const startTime = Date.now();

        try {
            const pollInterval = 1000;

            while (Date.now() - startTime < maxWaitTime) {
                if (await this.isFrontierButtonEnabled()) {
                    const duration = Date.now() - startTime;
                    console.log(`✓ Frontier button is now enabled (${duration}ms)\n`);
                    return true;
                }
                await this.browser.waitForTimeout(pollInterval);
            }

            console.log(`⚠ Frontier button not enabled after ${maxWaitTime}ms`);
            return false;
        } catch (error) {
            console.error(`✗ Error waiting for frontier button: ${error}`);
            return false;
        }
    }
}
