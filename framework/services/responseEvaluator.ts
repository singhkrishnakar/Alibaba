// Response Evaluator - Marks responses as Correct/Incorrect
import { BrowserManager } from './framework/browser/browserManager';

export class ResponseEvaluator {
    constructor(private browser: BrowserManager) {}

    async getResponseCount(): Promise<number> {
        try {
            const page = this.browser.getPage();
            
            // First try to read from summary text: "5 response(s) out of 5"
            const summaryCount = await page.evaluate(() => {
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
            
            if (summaryCount !== null && summaryCount > 0) {
                console.log(`  ℹ Found ${summaryCount} responses (from summary)`);
                return summaryCount;
            }
            
            // Fallback to counting DOM elements
            const count = await page.evaluate(() => {
                const responses = document.querySelectorAll('[data-testid="response"]');
                return responses.length;
            });
            console.log(`  ℹ Found ${count} responses (from DOM)`);
            return count as number;
        } catch (error) {
            console.error(`  ✗ Could not get response count: ${error}`);
            return 0;
        }
    }

    async evaluateResponse(responseIndex: number, status: 'Correct' | 'Incorrect'): Promise<boolean> {
        try {
            const page = this.browser.getPage();
            const result = await page.evaluate(({ index, statusValue }) => {
                const lowerStatus = statusValue.toLowerCase();

                // helper that clicks radio with matching label text inside a given element
                const clickWithin = (el: Element): boolean => {
                    // search for label elements first
                    const labels = Array.from(el.querySelectorAll('label')) as HTMLElement[];
                    for (const l of labels) {
                        if ((l.textContent || '').toLowerCase().includes(lowerStatus)) {
                            const r = l.querySelector('input[type="radio"]') as HTMLInputElement | null;
                            if (r) { r.click(); return true; }
                        }
                    }
                    // fallback: any element containing text and has a radio descendant
                    const candidates = Array.from(el.querySelectorAll('span, div, button'));
                    for (const c of candidates) {
                        if ((c.textContent || '').toLowerCase().includes(lowerStatus)) {
                            const r = c.querySelector('input[type="radio"]') as HTMLInputElement | null;
                            if (r) { r.click(); return true; }
                            const pl = c.closest('label');
                            if (pl) {
                                const r2 = pl.querySelector('input[type="radio"]') as HTMLInputElement | null;
                                if (r2) { r2.click(); return true; }
                            }
                        }
                    }
                    return false;
                };

                // first attempt: containers marked with data-testid
                let containers = Array.from(document.querySelectorAll('[data-testid="response"]'));

                // if no containers, fall back to finding groups by radio names
                if (containers.length === 0) {
                    const radios = Array.from(document.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
                    const groups: { [name: string]: HTMLInputElement[] } = {};
                    radios.forEach(r => {
                        const n = r.name || '_';
                        if (!groups[n]) groups[n] = [];
                        groups[n].push(r);
                    });
                    const groupNames = Object.keys(groups);
                    if (index >= groupNames.length) return false;
                    const groupRadios = groups[groupNames[index]];
                    for (const r of groupRadios) {
                        const lab = r.closest('label') as HTMLElement | null;
                        if (lab && lab.textContent?.toLowerCase().includes(lowerStatus)) {
                            r.click(); return true;
                        }
                        const next = r.nextElementSibling as HTMLElement | null;
                        if (next && next.textContent?.toLowerCase().includes(lowerStatus)) {
                            r.click(); return true;
                        }
                    }
                    return false;
                }

                if (index >= containers.length) {
                    return false;
                }
                const container = containers[index];
                // attempt to click within container
                return clickWithin(container);
            }, { index: responseIndex, statusValue: status });

            if (result) {
                console.log(`  ✓ Response ${responseIndex} marked as ${status}`);
                await this.browser.waitForTimeout(500);
            } else {
                console.log(`  ✗ Could not mark response ${responseIndex} as ${status}`);
            }
            return result as boolean;
        } catch (error) {
            console.error(`  ✗ Failed to mark response ${responseIndex}: ${error}`);
            return false;
        }
    }

    async markAllResponsesRandom(): Promise<void> {
        try {
            console.log('📊 Evaluating responses...');
            const startTime = Date.now();

            const count = await this.getResponseCount();
            if (count === 0) {
                console.log('  ℹ No responses to evaluate');
                return;
            }

            // Mark each response randomly as Correct or Incorrect
            for (let i = 0; i < count; i++) {
                const status = Math.random() > 0.5 ? 'Correct' : 'Incorrect';
                await this.evaluateResponse(i, status);
                await this.browser.waitForTimeout(200);
            }

            const duration = Date.now() - startTime;
            console.log(`✓ All ${count} responses evaluated (${duration}ms)`);
        } catch (error) {
            console.error(`✗ Response evaluation failed: ${error}`);
            throw error;
        }
    }

    async markAllResponsesCorrect(): Promise<void> {
        try {
            console.log('📊 Marking all responses as Correct...');
            const startTime = Date.now();

            const count = await this.getResponseCount();
            for (let i = 0; i < count; i++) {
                await this.evaluateResponse(i, 'Correct');
                await this.browser.waitForTimeout(200);
            }

            const duration = Date.now() - startTime;
            console.log(`✓ All ${count} responses marked as Correct (${duration}ms)`);
        } catch (error) {
            console.error(`✗ Failed to mark responses: ${error}`);
            throw error;
        }
    }

    async markSpecificResponses(correctIndices: number[], incorrectIndices: number[]): Promise<void> {
        try {
            console.log('📊 Marking specific responses...');
            const startTime = Date.now();

            const count = await this.getResponseCount();
            console.log(`  ℹ Total responses: ${count}`);
            console.log(`  ℹ Marking as Correct: [${correctIndices.join(', ')}]`);
            console.log(`  ℹ Marking as Incorrect: [${incorrectIndices.join(', ')}]`);

            // Mark incorrect responses first and count successes
            let incorrectSuccess = 0;
            for (const index of incorrectIndices) {
                if (index < count) {
                    const ok = await this.evaluateResponse(index, 'Incorrect');
                    if (ok) incorrectSuccess++;
                    await this.browser.waitForTimeout(200);
                } else {
                    console.log(`  ⚠ Response index ${index} out of range (max: ${count - 1})`);
                }
            }

            // Mark correct responses and count successes
            let correctSuccess = 0;
            for (const index of correctIndices) {
                if (index < count) {
                    const ok = await this.evaluateResponse(index, 'Correct');
                    if (ok) correctSuccess++;
                    await this.browser.waitForTimeout(200);
                } else {
                    console.log(`  ⚠ Response index ${index} out of range (max: ${count - 1})`);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`✓ Response evaluation completed (${duration}ms)`);
            console.log(`  ✓ ${correctSuccess} responses marked as Correct`);
            console.log(`  ✓ ${incorrectSuccess} responses marked as Incorrect`);
        } catch (error) {
            console.error(`✗ Response evaluation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Mark responses using the 2‑incorrect, 3‑correct pattern.
     *
     * If a `startIndex` is provided the routine will begin at that offset and
     * continue in blocks of five until it reaches the total count. This allows
     * the caller to mark only the "new" responses that appeared after an
     * earlier action (e.g. frontier generation) without re‑touching already
     * evaluated items.
     *
     * @param startIndex index at which to begin marking (default 0)
     */
    async mark2Incorrect3Correct(startIndex: number = 0): Promise<void> {
        try {
            console.log('📊 Evaluating responses with pattern: 2 Incorrect, 3 Correct...');
            const startTime = Date.now();

            const count = await this.getResponseCount();
            if (count === 0) {
                console.log('  ℹ No responses found to evaluate');
                return;
            }

            if (startIndex >= count) {
                console.log(`  ⚠ startIndex ${startIndex} is beyond total responses (${count}), nothing to mark`);
                return;
            }

            // iterate through responses in groups of five, starting at startIndex
            for (let base = startIndex; base < count; base += 5) {
                const incorrectIndices = [base, base + 1].filter(i => i < count) as number[];
                const correctIndices = [base + 2, base + 3, base + 4].filter(i => i < count) as number[];

                if (incorrectIndices.length === 0 && correctIndices.length === 0) break;

                console.log(`  🔁 Processing responses ${base}–${Math.min(base+4, count-1)}`);
                await this.markSpecificResponses(correctIndices, incorrectIndices);
            }
        } catch (error) {
            console.error(`✗ Response evaluation failed: ${error}`);
            throw error;
        }
    }
}
