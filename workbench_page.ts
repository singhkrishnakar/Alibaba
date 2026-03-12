// Workbench Page Object - Centralized locators and element interactions
import { Page, Locator } from 'playwright';
import * as fs from 'fs';

export class WorkbenchPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ==================== CREATE PROMPT SECTION ====================

    // Create/New button locators
    get createButton(): Locator {
        return this.page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add"), button.css-sit19b');
    }

    // Prompt Type selector
    get promptTypeSelector(): Locator {
        return this.page.locator('button[role="button"], label, input[type="radio"]');
    }

    getPromptTypeButton(type: string): Locator {
        return this.page.locator(`button:has-text("${type}"), label:has-text("${type}"), input[value="${type}"], input[type="radio"][value="${type}"]`);
    }

    // Prompt Text field
    get promptTextField(): Locator {
        return this.page.locator('textarea[name="prompt"], textarea, input[name="promptText"], input[placeholder*="prompt"]');
    }

    // Education Level dropdown
    get educationLevelSelect(): Locator {
        return this.page.locator('select');
    }

    get educationLevelOption(): Locator {
        return this.page.locator('option');
    }

    getEducationLevelOption(level: string): Locator {
        return this.page.locator(`option:has-text("${level}")`);
    }

    // React-select for education level
    get reactSelectInput(): Locator {
        return this.page.locator('#react-select-dropdown-undefined-input, input[id^="react-select-"], .css-1wy0on6 input, .css-1dimb5e-singleValue');
    }

    get dropdownOption(): Locator {
        return this.page.locator('div[role="option"], div, li');
    }

    getDropdownOption(text: string): Locator {
        return this.page.locator(`div[role="option"]:has-text("${text}"), div:has-text("${text}"), li:has-text("${text}")`);
    }

    // Subject/Discipline field
    get subjectField(): Locator {
        return this.page.locator('input[placeholder*="subject" i], input[placeholder*="topic"], input[name="subject"], input[aria-label*="Subject"]');
    }

    get dropdownControl(): Locator {
        return this.page.locator('.dropdownControl, .css-1dimb5e-singleValue, .css-hlgwow');
    }

    // Submit button for prompt form
    get submitPromptButton(): Locator {
        return this.page.locator('button:has-text("Submit"), button:has-text("Create"), button:has-text("Save"), button[aria-haspopup="dialog"]');
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

    // ==================== METADATA FORM SECTION ====================

    // Final answer field
    get finalAnswerField(): Locator {
        return this.page.locator('textarea[placeholder*="answer" i], input[placeholder*="answer" i], textarea[aria-label*="answer" i]');
    }

    // Solution process field
    get solutionProcessField(): Locator {
        return this.page.locator('textarea[placeholder*="solution" i], textarea[placeholder*="process" i], input[placeholder*="solution" i]');
    }

    // Thinking process field
    get thinkingProcessField(): Locator {
        return this.page.locator('textarea[placeholder*="thinking" i], input[placeholder*="thinking" i], textarea[aria-label*="thinking" i]');
    }

    // No Unit Required checkbox
    get noUnitRequiredCheckbox(): Locator {
        return this.page.locator('input[type="checkbox"][aria-label*="unit" i], input[type="checkbox"]:near(label:has-text("Unit"))');
    }

    // Key points field
    get keyPointsField(): Locator {
        return this.page.locator('textarea[placeholder*="key" i], input[placeholder*="key" i], [contenteditable="true"]');
    }

    // ==================== FORM SUBMISSION ====================

    // Main submit button
    get submitFormButton(): Locator {
        return this.page.locator('button:has-text("Submit"), button:has-text("Save"), button[type="submit"]');
    }

    // Cancel button
    get cancelButton(): Locator {
        return this.page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label="Close"]');
    }

    // ==================== NAVIGATION ====================

    // Back button
    get backButton(): Locator {
        return this.page.locator('button:has(svg[data-testid="ArrowBackIcon"]), button[aria-label*="back" i]');
    }

    // Menu button
    get menuButton(): Locator {
        return this.page.locator('button:has(svg[data-testid="MoreVertIcon"]), button[aria-haspopup="menu"]');
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
     * Check if form is complete (all fields filled)
     */
    async isFormComplete(): Promise<boolean> {
        const finalAnswer = await this.finalAnswerField.inputValue();
        const solutionProcess = await this.solutionProcessField.inputValue();
        const thinkingProcess = await this.thinkingProcessField.inputValue();

        return !!(finalAnswer?.trim() && solutionProcess?.trim() && thinkingProcess?.trim());
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
