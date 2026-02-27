"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormHandler = void 0;
class FormHandler {
    constructor(browser) {
        this.browser = browser;
    }
    async fillField(fieldName, value) {
        try {
            const page = this.browser.getPage();
            const result = await page.evaluate(({ name, val }) => {
                const labels = Array.from(document.querySelectorAll('label, [role="label"], span'));
                const field = labels.find(l => l.textContent?.includes(name));
                if (field) {
                    let input = field.parentElement?.querySelector('input, textarea, [contenteditable]');
                    if (!input) {
                        input = field.querySelector('input, textarea, [contenteditable]');
                    }
                    if (input) {
                        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                            input.value = val;
                        }
                        else {
                            input.textContent = val;
                        }
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
                return false;
            }, { name: fieldName, val: value });
            if (result) {
                console.log(`  ✓ Filled field: ${fieldName}`);
                await this.browser.waitForTimeout(1000);
            }
            else {
                console.log(`  ⚠ Could not find field: ${fieldName}`);
            }
            return result;
        }
        catch (error) {
            console.error(`  ✗ Error filling field ${fieldName}: ${error}`);
            return false;
        }
    }
    async fillMetadata(metadata) {
        try {
            console.log('📋 Filling metadata form...');
            const startTime = Date.now();
            // Fill all required fields
            await this.fillField('Final Answer', metadata.finalAnswer);
            await this.fillField('Solution Process', metadata.solutionProcess);
            await this.fillField('Thinking Process', metadata.thinkingProcess);
            // Fill optional fields
            if (metadata.keyPoints) {
                await this.fillField('Key Points', metadata.keyPoints);
            }
            // Handle unit checkbox
            if (metadata.noUnitRequired) {
                await this.checkNoUnitRequired();
            }
            else if (metadata.answerUnit) {
                await this.fillField('Answer Unit', metadata.answerUnit);
            }
            const duration = Date.now() - startTime;
            console.log(`✓ Metadata form filled (${duration}ms)`);
        }
        catch (error) {
            console.error(`✗ Failed to fill metadata: ${error}`);
            throw error;
        }
    }
    async checkNoUnitRequired() {
        try {
            const page = this.browser.getPage();
            const result = await page.evaluate(() => {
                const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
                const unitCheckbox = checkboxes.find((cb) => cb.parentElement?.textContent?.includes('does not require a unit'));
                if (unitCheckbox && !unitCheckbox.checked) {
                    unitCheckbox.click();
                    return true;
                }
                return unitCheckbox?.checked ?? false;
            });
            if (result) {
                console.log(`  ✓ Checked "no unit required"`);
            }
            return result;
        }
        catch (error) {
            console.error(`  ✗ Error checking unit checkbox: ${error}`);
            return false;
        }
    }
    async submitForm() {
        try {
            console.log('📤 Submitting form...');
            const startTime = Date.now();
            // Try to find and click submit button
            const submitted = await this.browser.click('button[type="submit"]||button:has-text("Submit")||button:has-text("Complete")||button:has-text("Finish")', 2000);
            if (submitted) {
                // Wait for form submission
                await this.browser.waitForNavigation(8000);
                await this.browser.waitForTimeout(500);
                const duration = Date.now() - startTime;
                console.log(`✓ Form submitted (${duration}ms)`);
            }
            else {
                console.log('  ⚠ Submit button not found, form may already be submitted');
                const duration = Date.now() - startTime;
                console.log(`⚠ Form submission skipped (${duration}ms)`);
            }
        }
        catch (error) {
            console.error(`⚠ Form submission error: ${error}`);
            // Don't throw - continue anyway
        }
    }
}
exports.FormHandler = FormHandler;
//# sourceMappingURL=form_handler.js.map