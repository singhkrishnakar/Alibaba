// Workbench Page Object - Centralized locators and element interactions
import { Page, Locator } from 'playwright';
import * as fs from 'fs';

export class WorkbenchPage {
    private page: Page;
    constructor(page: Page) { 
        this.page = page; // explicitly assign
    }

    // ==================== RESPONSE SECTION ====================
    // Response container - Using standard data-testid selector which is valid CSS
    get responses(): Locator {
        return this.page.locator('[data-testid="response"]');
    }

    getResponseByIndex(index: number): Locator {
        return this.page.locator('[data-testid="response"]').nth(index);
    }

    // Response text/content - Extract from the response container
    get responseText(): Locator {
        return this.page.locator('[data-testid="response"] div, [data-testid="response"] p, [data-testid="response"] span');
    }

    getResponseTextByIndex(index: number): Locator {
        return this.page.locator('[data-testid="response"]').nth(index).locator('div, p, span');
    }

    // Radio buttons for marking responses
    get responseRadioButtons(): Locator {
        return this.page.locator('input[type="radio"]');
    }

    getResponseRadioButton(index: number): Locator {
        return this.page.locator('input[type="radio"]').nth(index);
    }

    // Correct/Incorrect status buttons
    get correctRadio(): Locator {
        return this.page.locator('input[type="radio"]:near(label:has-text("Correct"))');
    }

    get incorrectRadio(): Locator {
        return this.page.locator('input[type="radio"]:near(label:has-text("Incorrect"))');
    }

    getRadioByStatus(status: 'Correct' | 'Incorrect'): Locator {
        return this.page.locator(`input[type="radio"]:near(label:has-text("${status}"))`);
    }

    // Radio button labels
    get radioLabels(): Locator {
        return this.page.locator('label[for], span:near(input[type="radio"])');
    }

    // ==================== QUESTION/PROMPT DISPLAY ====================

    // Question/Prompt display area
    get questionDisplay(): Locator {
        return this.page.locator('[data-testid="question"], [data-testid="prompt"], h2, h3');
    }

    get questionText(): Locator {
        return this.page.locator('[data-testid="question"] p, [data-testid="prompt"] p, [data-testid="question"], [data-testid="prompt"]');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get count of rendered responses
     * First checks summary display "X response(s) out of Y", then counts DOM elements
     */
    async getResponseCount(): Promise<number> {

        // Try to read from summary text: "5 response(s) out of 5"
        try {
            const summaryCount = await this.page.evaluate(() => {
                const divs = Array.from(document.querySelectorAll('div'));
                const summary = divs.find(d => d.textContent?.includes('response(s) out of'));

                if (summary) {
                    const match = summary.textContent?.match(/(\d+)\s*response/);
                    if (match && match[1]) {
                        return parseInt(match[1], 10);
                    }
                }
                return null;
            });

            if (summaryCount !== null) {
                console.log(`    📊 Summary shows: ${summaryCount} response(s) generated`);
                return summaryCount;
            }

        } catch (e) {
            console.warn('    ⚠ Failed to read summary text');
        }

        // Fallback only if summary completely missing
        const radioCount = await this.page.locator('input[type="radio"]').count();

        if (radioCount > 0) {
            const responses = Math.floor(radioCount / 2);
            console.log(`    ✓ Estimated ${responses} responses from radio buttons`);
            return responses;
        }

        return 0;
    }

    /**
     * Get all response texts - Extracts text from response containers
     * The response text is the content BEFORE the "Is the above response correct or incorrect?" section
     */
    async getAllResponseTexts(): Promise<string[]> {
        // Use page.evaluate to extract all response texts in one DOM pass (avoids locator timeouts)
        try {
            const texts = await this.page.evaluate(() => {
                const responses = Array.from(document.querySelectorAll('[data-testid="response"]'));
                return responses.map((el) => {
                    // Stop before the marking section that contains both Correct and Incorrect
                    const children = Array.from(el.children);
                    let responseText = '';
                    for (const child of children) {
                        const childText = (child.textContent || '').trim();
                        if (childText.toLowerCase().includes('correct') && childText.toLowerCase().includes('incorrect')) {
                            break;
                        }
                        responseText += (' ' + childText);
                    }
                    const cleaned = responseText.replace(/\s+/g, ' ').trim();
                    return cleaned;
                });
            });
            // If nothing found, dump page HTML for debugging
            if (!texts || (Array.isArray(texts) && texts.length === 0)) {
                try {
                    const html = this.page.content();
                    const filename = `./screenshots/debug_responses_${Date.now()}.html`;
                    Promise.resolve(html).then(h => fs.writeFileSync(filename, h));
                    console.log(`    📄 Dumped workbench HTML to ${filename}`);
                } catch (e) {
                    console.log('    ⚠ Failed to dump HTML for debugging:', e);
                }
            }
            return texts as string[];
        } catch (e) {
            console.log('  ⚠ Bulk extraction failed, falling back to per-locator reads:', e);
        }

        // Fallback: per-locator extraction (best-effort)
        const count = await this.getResponseCount();
        const texts: string[] = [];
        for (let i = 0; i < count; i++) {
            try {
                const text = await this.getResponseByIndex(i).textContent();
                texts.push(text?.trim() || '');
            } catch {
                texts.push('');
            }
        }
        return texts;
    }

    /**
     * Get response text by index
     */
    async getResponseText(index: number): Promise<string> {
        const text = await this.getResponseTextByIndex(index).textContent();
        return text?.trim() || '';
    }



    /**
     * Check if all responses are marked
     */
    async allResponsesMarked(): Promise<boolean> {
        const radioButtons = await this.responseRadioButtons.count();
        const checkedRadios = await this.page.locator('input[type="radio"]:checked').count();
        return radioButtons > 0 && checkedRadios === radioButtons;
    }

    /**
     * Wait for responses to appear
     */
    async waitForResponses(timeout: number = 15000): Promise<void> {
        await this.page.waitForSelector('[data-testid="response"]', { timeout });
    }

    /**
     * Wait for response count to reach expected number
     */
    async waitForResponseCount(expectedCount: number, timeout: number = 20000): Promise<boolean> {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const count = await this.getResponseCount();
            if (count >= expectedCount) {
                return true;
            }
            await this.page.waitForTimeout(500);
        }
        return false;
    }

    /**
     * Get current question/prompt text
     */
    async getQuestionText(): Promise<string> {
        const text = await this.questionText.textContent();
        return text?.trim() || '';
    }

    /**
     * Take page screenshot
     */
    async takeScreenshot(filename: string): Promise<void> {
        await this.page.screenshot({ path: `./screenshots/${filename}.png` });
    }

    /**
     * Dump page HTML for debugging
     */
    async dumpPageHTML(filename: string): Promise<void> {
        const html = await this.page.content();
        const fs = require('fs');
        fs.writeFileSync(`./screenshots/${filename}.html`, html);
    }

    /**
     * Log all visible responses for debugging
     */
    async debugLogResponses(): Promise<void> {
        const count = await this.getResponseCount();
        console.log(`📊 Found ${count} responses:`);
        for (let i = 0; i < count; i++) {
            const text = await this.getResponseText(i);
            console.log(`  [${i}]: ${text.substring(0, 100)}...`);
        }
    }



}
