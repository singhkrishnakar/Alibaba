// Workbench Orchestrator - Handles response waiting and workbench operations
import { BrowserManager } from './browser_manager';
import { WorkbenchPage } from './workbench_page';

export class WorkbenchOrchestrator {
    private workbenchPage: WorkbenchPage;

    constructor(private browser: BrowserManager) {
        this.workbenchPage = new WorkbenchPage(this.browser.getPage());
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
        console.log(`\n⏳ Waiting (up to ${maxWaitTime/1000}s) for all ${expectedCount} responses on workbench...`);
        const startTime = Date.now();
        
        // help by waiting for any visible loader to go away before polling
        await this.waitForLoaderToDisappear(maxWaitTime / 2);

        try {
            const page = this.browser.getPage();
            let lastLoggedCount = 0;
            const pollInterval = 10000; // Check every 10 seconds
            const startPoll = Date.now();

            // helper to read both generated and total from summary
            const readSummary = async (): Promise<{generated: number, total: number}> => {
                const page = this.browser.getPage();
                return page.evaluate(() => {
                    const divs = Array.from(document.querySelectorAll('div'));
                    const summary = divs.find(d => d.textContent?.includes('response(s) out of'));
                    if (summary) {
                        const m = summary.textContent?.match(/(\d+)\s*response\(s\) out of\s*(\d+)/i);
                        if (m && m[1] && m[2]) return { generated: parseInt(m[1],10), total: parseInt(m[2],10) };
                    }
                    return { generated: 0, total: 0 };
                });
            };
            
            // Check immediately once loader is gone
            let currentCount = await this.workbenchPage.getResponseCount();
            const summary = await readSummary();
            if (summary.total > expectedCount) {
                console.log(`  ℹ Summary total increased to ${summary.total}, adjusting target`);
                expectedCount = summary.total;
            }
            console.log(`  … current responses: ${currentCount}/${expectedCount}`);
            if (currentCount >= expectedCount) {
                const duration = Date.now() - startTime;
                console.log(`✓ All ${expectedCount} responses ready (${duration}ms)\n`);
                await this.browser.takeScreenshot('06_all_responses_loaded');
                return true;
            }

            while (Date.now() - startPoll < maxWaitTime) {
                // also keep an eye on loader while waiting for responses
                const loaderStill = await page.evaluate(() => {
                    const body = document.querySelector('body');
                    if (!body) return false;
                    const text = (body.textContent || '').toLowerCase();
                    if (/generating response|generating responses|generating|loading/.test(text)) return true;
                    const spinner = document.querySelector('.spinner, .loader, [data-loading], [aria-busy="true"]') as HTMLElement | null;
                    if (spinner && (spinner as any).offsetParent !== null) return true;
                    return false;
                });
                if (loaderStill) {
                    console.log(`  … loader still present during response poll, waiting ${pollInterval/1000}s`);
                }

                currentCount = await this.workbenchPage.getResponseCount();
                const s = await readSummary();
                if (s.total > expectedCount) {
                    console.log(`  ℹ Summary total increased to ${s.total}, adjusting target`);
                    expectedCount = s.total;
                }

                console.log(`  … current responses: ${currentCount}/${expectedCount}`);

                // Log when response count increases
                if (currentCount > lastLoggedCount) {
                    console.log(`  ✓ Response ${currentCount} of ${expectedCount} generated`);
                    lastLoggedCount = currentCount;
                }

                if (currentCount >= expectedCount) {
                    const duration = Date.now() - startTime;
                    console.log(`✓ All ${expectedCount} responses ready (${duration}ms)\n`);
                    await this.browser.takeScreenshot('06_all_responses_loaded');
                    return true;
                }

                await this.browser.waitForTimeout(pollInterval);
            }
            
            // Timeout reached
            const finalCount = await this.workbenchPage.getResponseCount();
            const duration = Date.now() - startTime;
            console.log(`⚠ Timeout waiting for responses. Got ${finalCount}/${expectedCount} after ${duration}ms\n`);
            
            return finalCount >= expectedCount;
        } catch (error) {
            console.error(`✗ Error waiting for responses: ${error}`);
            return false;
        }
    }

    /**
     * Retrieve all response texts from the workbench
     */
    async getAllResponses(): Promise<string[]> {
        try {
            console.log('📖 Retrieving all response texts...');
            const responses = await this.workbenchPage.getAllResponseTexts();
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
            return await this.workbenchPage.getResponseText(index);
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
            const question = await this.workbenchPage.getQuestionText();
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
            return await this.workbenchPage.getResponseCount();
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
            await this.workbenchPage.debugLogResponses();
        } else {
            console.log('⚠ Not all responses loaded, logging what we have:');
            await this.workbenchPage.debugLogResponses();
        }
    }

    /**
     * Check if all responses are marked (for evaluation)
     */
    async areAllResponsesMarked(): Promise<boolean> {
        try {
            return await this.workbenchPage.allResponsesMarked();
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
    async testOnFrontierModels(expectedFrontierResponses: number = 5, maxWaitTime: number = 600000): Promise<boolean> {
        console.log('\n✊ Testing prompt on frontier models...');
        const startTime = Date.now();

        try {
            // record how many responses were present before the click
            const beforeCount = await this.workbenchPage.getResponseCount();

            const page = this.browser.getPage();
            
            // Try multiple selectors to find and click the frontier button
            const selectors = [
                'button:has-text("Test on Frontier Models")',
                'button:contains("Test on Frontier")',
                'button:contains("Frontier")',
                'button[aria-label*="Frontier" i]'
            ];
            
            let buttonClicked = false;
            for (const selector of selectors) {
                try {
                    const button = page.locator(selector);
                    const count = await button.count().catch(() => 0);
                    if (count > 0) {
                        await button.first().click({ timeout: 5000 }).catch(async () => {
                            // If click fails, try alternative approach
                            await page.evaluate((sel) => {
                                const el = document.querySelector(sel) as HTMLElement;
                                if (el) el.click();
                            }, selector);
                        });
                        buttonClicked = true;
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            
            if (!buttonClicked) {
                console.log('  ⚠ Could not find or click "Test on Frontier Models" button');
                return false;
            }

            console.log('  ✓ Clicked "Test on Frontier Models" button');
            await this.browser.waitForTimeout(2000);

            // wait for loader to disappear; frontier generation may take a long time
            console.log('  … waiting for loader to clear (checking every 5s)');
            // use at least 10 minutes or provided maxWaitTime, whichever is larger
            const loaderTimeout = Math.max(maxWaitTime, 600000);
            // Increase poll interval to 5s for Frontier to avoid aggressive 1s polling
            const loaderGone = await this.waitForLoaderToDisappear(loaderTimeout, 5000);
            if (!loaderGone) {
                console.log('  ⚠ Loader still present after timeout, will still attempt to read responses');
            }

            // once loader is gone (or timeout reached) wait for response count
            // `waitForAllResponses` expects a total count, so add the
            // number of expected frontier results to the existing responses.
            const totalTarget = beforeCount + expectedFrontierResponses;
            console.log(`  ℹ Waiting for ${expectedFrontierResponses} new responses (total ≥ ${totalTarget})`);
            const ready = await this.waitForAllResponses(totalTarget, maxWaitTime);
            if (ready) {
                // after responses are ready ensure loader actually cleared (use 5s polling)
                const loaderGone2 = await this.waitForLoaderToDisappear(loaderTimeout, 5000);
                if (!loaderGone2) {
                    console.log('  ⚠ Loader still present even though responses ready (consider increasing timeout)');
                }
                await this.browser.takeScreenshot('07_frontier_responses_loaded');
                return true;
            }
            return false;
        } catch (error) {
            console.error(`✗ Error testing on frontier models: ${error}`);
            return false;
        }
    }

    /**
     * Get all frontier model responses
     */
    async getAllFrontierResponses(): Promise<string[]> {
        try {
            console.log('📖 Retrieving all frontier model responses...');
            const responses = await this.workbenchPage.getAllResponseTexts();
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
