// Form Handler - Fills and submits forms
import { BrowserManager } from './browser_manager';

export interface MetadataConfig {
    finalAnswer: string;
    solutionProcess: string;
    thinkingProcess: string;
    keyPoints?: string;
    answerUnit?: string;
    noUnitRequired?: boolean;
    /** Custom Knowledge Point for "Enter key point" -> ADD flow */
    customKnowledgePoint?: string;
}

export class FormHandler {
    constructor(private browser: BrowserManager) {}

    /**
     * Fill a field by label text. Uses Playwright getByLabel for correct label-input association.
     * Searches within dialog first, then full page.
     */
    async fillField(fieldName: string, value: string): Promise<boolean> {
        try {
            const page = this.browser.getPage();
            const labelVariants = [fieldName, fieldName.split('/')[0]?.trim()].filter(Boolean);

            const tryFill = async (locator: any): Promise<boolean> => {
                if (await locator.count() > 0) {
                    await locator.first().click({ timeout: 1500 });
                    await this.browser.waitForTimeout(200);
                    await locator.first().fill(value, { timeout: 2000 });
                    return true;
                }
                return false;
            };

            // Try within dialog first, then full page
            const dialog = page.locator('[role="dialog"]').first();
            for (const labelText of labelVariants) {
                try {
                    if (await tryFill(dialog.getByLabel(labelText, { exact: false }))) {
                        console.log(`  ✓ Filled field: ${fieldName}`);
                        await this.browser.waitForTimeout(300);
                        return true;
                    }
                } catch { /* try next */ }
            }
            for (const labelText of labelVariants) {
                try {
                    if (await tryFill(page.getByLabel(labelText, { exact: false }))) {
                        console.log(`  ✓ Filled field: ${fieldName}`);
                        await this.browser.waitForTimeout(300);
                        return true;
                    }
                } catch { /* try next */ }
            }

            // Try label + parent input (for structures like <div><span>Final Answer</span><input/></div>)
            for (const labelText of labelVariants) {
                try {
                    const labelEl = page.locator('[role="dialog"] span:has-text("' + labelText + '"), [role="dialog"] label:has-text("' + labelText + '")').first();
                    const row = labelEl.locator('xpath=..');
                    const input = row.locator('input, textarea').first();
                    if (await input.count() > 0) {
                        await input.click({ timeout: 1500 });
                        await this.browser.waitForTimeout(200);
                        await input.fill(value, { timeout: 2000 });
                        console.log(`  ✓ Filled field: ${fieldName} (via row)`);
                        await this.browser.waitForTimeout(300);
                        return true;
                    }
                } catch { /* try next */ }
            }

            // Fallback: find label within dialog, then the input that follows it in DOM
            const result = await page.evaluate(({ name, val }) => {
                const root = document.querySelector('[role="dialog"]') || document.body;
                const labels = Array.from(root.querySelectorAll('label, [role="label"], span'));
                const partial = (name.split('/')[0] || name).trim();
                const label = labels.find((l: Element) => {
                    const t = (l.textContent || '').trim();
                    if (t.length > 80) return false;
                    return t === name || t.includes(name) || (partial && t.includes(partial));
                });
                if (!label) return false;

                // Get input that is: next sibling, or in same parent (only input in that row)
                let input: Element | null = label.nextElementSibling;
                if (input && !/input|textarea/i.test(input.tagName) && !(input as any).querySelector?.('[contenteditable="true"]')) {
                    input = input.querySelector('input, textarea, [contenteditable="true"]');
                }
                if (!input) input = label.parentElement?.querySelector('input, textarea, [contenteditable="true"]') ?? null;
                if (!input) {
                    let el: Element | null = label.nextElementSibling;
                    while (el) {
                        const inp = el.querySelector?.('input, textarea') || (/input|textarea/i.test(el.tagName) ? el : null);
                        if (inp) { input = inp as Element; break; }
                        el = el.nextElementSibling;
                    }
                }
                if (input) {
                    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                        (input as HTMLInputElement | HTMLTextAreaElement).value = val;
                    } else {
                        (input as HTMLElement).textContent = val;
                    }
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                    return true;
                }
                return false;
            }, { name: fieldName, val: value });

            if (result) {
                console.log(`  ✓ Filled field: ${fieldName}`);
                await this.browser.waitForTimeout(300);
            } else {
                console.log(`  ⚠ Could not find field: ${fieldName}`);
            }
            return result as boolean;
        } catch (error) {
            console.error(`  ✗ Error filling field ${fieldName}: ${error}`);
            return false;
        }
    }

    /**
     * Click the workbench Submit button to open the "Review and Submit models" form.
     */
    async clickSubmitToOpenReviewForm(): Promise<boolean> {
        try {
            console.log('📤 Clicking Submit to open Review and Submit form...');
            const clicked = await this.browser.click(
                'button:has-text("Submit")||button[type="submit"]:has-text("Submit")',
                3000
            );
            if (clicked) {
                await this.browser.waitForTimeout(2000);
                console.log('  ✓ Submit clicked, waiting for Review and Submit form...');
            }
            return clicked;
        } catch (error) {
            console.error(`  ✗ Failed to click Submit: ${error}`);
            return false;
        }
    }

    /**
     * Fill the Review and Submit metadata form (Final Answer, Solution Process, Thinking Process, Answer Unit).
     */
    async fillMetadata(metadata: MetadataConfig): Promise<void> {
        try {
            console.log('📋 Filling Review and Submit metadata form...');
            const startTime = Date.now();

            await this.fillField('Final Answer', metadata.finalAnswer);
            await this.fillField('Solution Process', metadata.solutionProcess);
            await this.fillField('Thinking Process/Analysis', metadata.thinkingProcess);

            if (metadata.keyPoints) {
                await this.fillField('Key Points', metadata.keyPoints);
            }

            if (metadata.noUnitRequired) {
                await this.checkNoUnitRequired();
            }
            if (metadata.answerUnit) {
                await this.fillField('Answer Unit', metadata.answerUnit);
            }

            const duration = Date.now() - startTime;
            console.log(`✓ Metadata form filled (${duration}ms)`);
        } catch (error) {
            console.error(`✗ Failed to fill metadata: ${error}`);
            throw error;
        }
    }

    /**
     * Add custom Knowledge Point: Enter key point -> ADD -> enter text -> Save
     */
    async addKnowledgePoint(customText: string): Promise<boolean> {
        try {
            console.log('📌 Adding custom Knowledge Point...');

            const enterKeyPointClicked = await this.browser.click(
                'button:has-text("Enter key point")||span:has-text("Enter key point")||div:has-text("Enter key point")||a:has-text("Enter key point")||[aria-label*="key point" i]||text=Enter key point',
                2000
            );
            if (!enterKeyPointClicked) {
                console.log('  ⚠ "Enter key point" control not found');
                return false;
            }
            await this.browser.waitForTimeout(1000);

            const addClicked = await this.browser.click(
                'button:has-text("ADD")||button:has-text("Add")||span:has-text("ADD")||span:has-text("Add")',
                2000
            );
            if (!addClicked) {
                console.log('  ⚠ ADD option not found in dropdown');
                return false;
            }
            await this.browser.waitForTimeout(800);

            let filled = await this.browser.fill(
                'input[placeholder*="Knowledge" i]||input[placeholder*="key point" i]||input[placeholder*="custom" i]||textarea[placeholder*="Knowledge" i]||textarea[placeholder*="key point" i]',
                customText,
                2000
            );
            if (!filled) {
                filled = await this.browser.fillByLabel('Knowledge Point', customText, 2000)
                    || await this.browser.fillByLabel('Custom', customText, 2000);
            }
            if (!filled) {
                console.log('  ⚠ Could not fill Knowledge Point input');
                return false;
            }
            await this.browser.waitForTimeout(500);

            let saveClicked = await this.browser.click(
                '[role="dialog"] button:has-text("Save")||[role="dialog"] button:has-text("Add")||[role="dialog"] button[type="submit"]||button:has-text("Save")||button:has-text("Confirm")||button:has-text("OK")||button[type="submit"]',
                2000
            );
            if (!saveClicked) {
                await this.browser.pressKey('Enter');
                await this.browser.waitForTimeout(800);
                console.log('  ✓ Pressed Enter to confirm (Save button not found)');
                saveClicked = true;
            }
            if (!saveClicked) {
                await this.browser.pressKey('Escape');
                await this.browser.waitForTimeout(500);
                console.log('  ⚠ Closed modal with Escape');
            }
            await this.browser.waitForTimeout(500);

            // Click on Review and Submit form to close dropdown
            const closedDropdown = await this.browser.click(
                'text=Review and Submit||text=Final Answer||h1:has-text("Review")||h2:has-text("Review")',
                1500
            );
            if (closedDropdown) {
                console.log('  ✓ Clicked Review form to close dropdown');
            }
            await this.browser.waitForTimeout(500);
            return saveClicked;
        } catch (error) {
            console.error(`  ✗ Error adding Knowledge Point: ${error}`);
            return false;
        }
    }

    async checkNoUnitRequired(): Promise<boolean> {
        try {
            const page = this.browser.getPage();
            const result = await page.evaluate(() => {
                const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
                const unitCheckbox = checkboxes.find((cb: any) =>
                    cb.parentElement?.textContent?.includes('does not require a unit')
                );
                
                if (unitCheckbox && !(unitCheckbox as HTMLInputElement).checked) {
                    (unitCheckbox as HTMLInputElement).click();
                    return true;
                }
                return (unitCheckbox as HTMLInputElement)?.checked ?? false;
            });

            if (result) {
                console.log(`  ✓ Checked "no unit required"`);
            }
            return result as boolean;
        } catch (error) {
            console.error(`  ✗ Error checking unit checkbox: ${error}`);
            return false;
        }
    }

    /**
     * Click the final Submit button on the Review and Submit form to complete submission.
     */
    async submitForm(): Promise<void> {
        try {
            console.log('📤 Submitting Review and Submit form...');
            const startTime = Date.now();
            const page = this.browser.getPage();

            const submitSelectors = [
                '[role="dialog"] button:has-text("Submit")',
                '[role="dialog"] button:has-text("Review and Submit")',
                '[role="dialog"] button[type="submit"]',
                '.modal button:has-text("Submit")',
                '[role="dialog"] button:has-text("Complete")',
                'button:has-text("Review and Submit")',
                'button:has-text("Submit")',
                'button:has-text("Submit Review")',
                'button[type="submit"]',
                'button:has-text("Complete")',
                'button:has-text("Finish")'
            ];

            let submitted = false;
            for (const sel of submitSelectors) {
                try {
                    const btn = page.locator(sel).first();
                    if (await btn.count() > 0) {
                        await btn.click({ timeout: 2500 });
                        submitted = true;
                        console.log(`  ✓ Clicked: ${sel}`);
                        break;
                    }
                } catch { /* try next */ }
            }

            if (!submitted) {
                submitted = await this.browser.click(
                    'button:has-text("Submit")||button[type="submit"]||button:has-text("Complete")||button:has-text("Finish")',
                    3000
                );
            }

            if (submitted) {
                await this.browser.waitForNavigation(8000);
                await this.browser.waitForTimeout(500);
                const duration = Date.now() - startTime;
                console.log(`✓ Review form submitted (${duration}ms)`);
            } else {
                console.log('  ⚠ Submit button not found on Review form');
                const duration = Date.now() - startTime;
                console.log(`⚠ Form submission skipped (${duration}ms)`);
            }
        } catch (error) {
            console.error(`⚠ Form submission error: ${error}`);
        }
    }
}
