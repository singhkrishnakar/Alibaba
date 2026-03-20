import * as fs from 'fs';
import { Locator } from '@playwright/test';
import { BasePage } from './basePage';
import { TestContext } from '../core/TestContext';

export class WorkbenchPage extends BasePage {
    private context: TestContext;

    constructor(context: TestContext) {
        super(context.browser);
        this.context = context;
    }

    // ─────────────────────────────────────────
    // PAGE HEADER LOCATORS
    // ─────────────────────────────────────────

    /**
     * Back arrow button — top left of workbench.
     * DevTools: document.querySelector('button:has(svg[data-testid="ArrowBackIcon"])')
     */
    get backButton() {
        return this.page().locator('button:has(svg[data-testid="ArrowBackIcon"])');
    }

    /**
     * Save as Draft button.
     * DevTools: document.querySelector('button:has(svg[data-testid="DraftsIcon"])')
     */
    get saveAsDraftButton() {
        return this.page().locator('button:has(svg[data-testid="DraftsIcon"])');
    }

    /**
     * Rewrite Prompt button.
     * DevTools: document.querySelector('button:has(svg[data-testid="EditIcon"])')
     */
    get rewritePromptButton() {
        return this.page().locator('button:has(svg[data-testid="EditIcon"])');
    }

    /**
     * Response counter text — e.g. "15 response(s) out of 15".
     * DevTools: [...document.querySelectorAll('div')].find(d => d.textContent?.includes('response(s) out of'))
     */
    get responseCounterText() {
        return this.page().locator('div', { hasText: /\d+ response\(s\) out of \d+/ }).last();
    }

    /**
     * Frontier button — enabled only after all base responses are marked.
     * DevTools: document.querySelector('button:has-text("Test on Frontier Models")')
     */
    get frontierButton() {
        return this.page().locator('button:has-text("Test on Frontier Models")');
    }

    /**
     * Submit button — enabled only after all frontier responses are marked.
     * DevTools: document.querySelector('button:has-text("Submit")')
     */
    get submitButton() {
        return this.page().getByRole('button', { name: 'Submit Task', exact: true });
    }

    // ─────────────────────────────────────────
    // PROMPT DISPLAY
    // ─────────────────────────────────────────

    /**
     * The prompt text shown at top of workbench.
     * DevTools: document.querySelector('div.sc-6e40ec64-9 p')
     */
    get promptDisplay() {
        return this.page().locator('div.sc-6e40ec64-9 p');
    }


    baseRadioGroup(nameIndex: number) {
        return this.page().locator(
            `div.sc-6e40ec64-19:has(input[name="response-original-${nameIndex}"])`
        );
    }

    frontierRadioGroup(nameIndex: number) {
        return this.page().locator(
            `div.sc-6e40ec64-19:has(input[name="response-frontier-${nameIndex}"])`
        );
    }
    // ─────────────────────────────────────────
    // BASE MODEL RESPONSES
    // Radio names follow pattern: response-original-N
    // DevTools: document.querySelectorAll('input[name^="response-original-"]')
    // ─────────────────────────────────────────

    /**
     * All base model response wrapper divs.
     * Each wrapper contains: response text + Correct/Incorrect radio pair.
     */
    get baseResponseWrappers() {
        return this.page().locator('div.sc-dd6c7092-1.modelResponseAccordionItem div.sc-6e40ec64-18');
    }

    /**
     * All base model Correct radio buttons.
     * DevTools: document.querySelectorAll('input[name^="response-original-"]')
     *           then filter for Correct label
     */
    get baseCorrectRadios() {
        return this.page().locator(
            'input[name^="response-original-"] + label span:has-text("Correct")'
        ).locator('..');
    }

    /**
     * All base model Incorrect radio buttons.
     */
    get baseIncorrectRadios() {
        return this.page().locator(
            'input[name^="response-original-"]'
        ).filter({
            has: this.page().locator('~ label span:has-text("Incorrect")')
        });
    }

    /**
     * Get Correct radio for a specific base response by its name index.
     * name="response-original-N" — N comes from the DOM.
     * DevTools: document.querySelector('input[name="response-original-2"]')
     */
    baseResponseCorrectRadio(nameIndex: number) {
        return this.page().locator(
            `div:has(input[name="response-original-${nameIndex}"]) span:has-text("Correct")`
        ).locator('xpath=ancestor::div[contains(@class,"sc-cf44095c-1")]//input');
    }

    baseResponseIncorrectRadio(nameIndex: number) {
        return this.page().locator(
            `div:has(input[name="response-original-${nameIndex}"]) span:has-text("Incorrect")`
        ).locator('xpath=ancestor::div[contains(@class,"sc-cf44095c-1")]//input');
    }

    /**
     * Correct label for a base response — click label not hidden input.
     * This is the safe pattern for styled radio buttons.
     */
    baseResponseCorrectLabel(nameIndex: number) {
        return this.page().locator(`input[name="response-original-${nameIndex}"]`)
            .filter({ has: this.page().locator('~ label span:has-text("Correct")') })
            .locator('~ label');
    }

    baseResponseIncorrectLabel(nameIndex: number) {
        return this.page().locator(`input[name="response-original-${nameIndex}"]`)
            .locator('xpath=following-sibling::label[.//span[text()="Incorrect"]]');
    }

    // ─────────────────────────────────────────
    // FRONTIER MODEL RESPONSES
    // Radio names follow pattern: response-frontier-N
    // DevTools: document.querySelectorAll('input[name^="response-frontier-"]')
    // ─────────────────────────────────────────

    /**
     * All frontier model accordion items — one per model (e.g. gemini-2.5-pro, o4-mini).
     * DevTools: document.querySelectorAll('div.frontierModelResponseAccordionItem')
     */
    get frontierAccordions() {
        return this.page().locator('div.frontierModelResponseAccordionItem');
    }

    /**
     * Frontier accordion by model name.
     * DevTools: document.querySelector('div.frontierModelResponseAccordionItem.gemini-2\\.5-pro')
     */
    frontierAccordionByModel(modelName: string) {
        return this.page().locator(`div.frontierModelResponseAccordionItem.${CSS.escape(modelName)}`);
    }

    /**
     * All frontier response wrappers across all models.
     * DevTools: document.querySelectorAll('div.frontierModelResponseAccordionItem div.sc-6e40ec64-18')
     */
    get frontierResponseWrappers() {
        return this.page().locator(
            'div.frontierModelResponseAccordionItem div.sc-6e40ec64-18'
        );
    }

    /**
     * Frontier Correct label by radio name index.
     */
    frontierCorrectLabel(nameIndex: number) {
        return this.page()
            .locator(`input[name="response-frontier-${nameIndex}"]`)
            .locator('xpath=following-sibling::label[.//span[text()="Correct"]]');
    }

    frontierIncorrectLabel(nameIndex: number) {
        return this.page()
            .locator(`input[name="response-frontier-${nameIndex}"]`)
            .locator('xpath=following-sibling::label[.//span[text()="Incorrect"]]');
    }

    // ─────────────────────────────────────────
    // SHARED RESPONSE LOCATORS
    // ─────────────────────────────────────────

    /**
     * All response text spans — both base and frontier.
     * DevTools: document.querySelectorAll('div.sc-6e40ec64-22 span')
     */
    get allResponseTextSpans() {
        return this.page().locator('div.sc-6e40ec64-22.bkcbqC span');
    }

    /**
     * View Complete Response button on a specific response wrapper.
     */
    viewCompleteResponseButton(wrapperLocator: Locator) {
        return wrapperLocator.locator('button.view-complete-response-button');
    }

    // ─────────────────────────────────────────
    // ACTIONS — Page level
    // ─────────────────────────────────────────

    async clickBack(): Promise<void> {
        await this.backButton.click();
    }

    async clickSaveAsDraft(): Promise<void> {
        await this.saveAsDraftButton.click();
    }

    async clickRewritePrompt(): Promise<void> {
        await this.rewritePromptButton.click();
    }

    async clickFrontierButton(): Promise<void> {
        await this.frontierButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.frontierButton.click();
    }

    async clickSubmit(): Promise<void> {
        await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.submitButton.click();
    }

    // ─────────────────────────────────────────
    // ACTIONS — Base response marking
    // The radio buttons use styled labels — always click the LABEL not the input
    // This is same as Selenium clicking the visible element, not the hidden input
    // ─────────────────────────────────────────

    /**
     * Mark a base response by its name index (from DOM: name="response-original-N").
     * status: 'Correct' | 'Incorrect'
     */
    async markBaseResponse(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<void> {
        console.log(`  → Marking base response ${nameIndex} as ${status}`);
        await this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-original-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) {
                        (parent?.querySelector('label span') as HTMLElement)?.click();
                        return;
                    }
                }
            },
            { nameIndex, status }
        );
        console.log(`  ✓ Base response ${nameIndex} marked as ${status}`);
    }

    /**
     * Mark a frontier response by its name index (from DOM: name="response-frontier-N").
     */
    async markFrontierResponse(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<void> {
        console.log(`  → Marking frontier response ${nameIndex} as ${status}`);
        await this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-frontier-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) {
                        (parent?.querySelector('label span') as HTMLElement)?.click();
                        return;
                    }
                }
            },
            { nameIndex, status }
        );
        console.log(`  ✓ Frontier response ${nameIndex} marked as ${status}`);
    }


    // Use these for verification — check which radio is checked in the group
    async isBaseResponseMarkedAs(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<boolean> {
        return this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-original-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) return input.checked;
                }
                return false;
            },
            { nameIndex, status }
        );
    }

    async isFrontierResponseMarkedAs(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<boolean> {
        return this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-frontier-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) return input.checked;
                }
                return false;
            },
            { nameIndex, status }
        );
    }

    // ─────────────────────────────────────────
    // DATA READING
    // ─────────────────────────────────────────

    async getPromptText(): Promise<string> {
        const text = await this.promptDisplay.textContent();
        return text?.trim() ?? '';
    }

    async getResponseCountFromUI(expectedCount: number): Promise<{ actual: number; expected: number }> {
        try {
            // Read the counter text directly from the DOM — e.g. "5 response(s) out of 5"
            // Using evaluate with Array.from to avoid NodeListOf iterator issues
            const result = await this.page().evaluate(() => {
                const divs = Array.from(document.querySelectorAll('div'));
                const counterDiv = divs.find(d =>
                    d.textContent?.match(/\d+\s*response\(s\)\s*out of\s*\d+/) !== null
                    && (d.children.length === 0 || d.textContent === d.children[0]?.textContent)
                );
                if (!counterDiv) return null;
                const match = counterDiv.textContent?.match(/(\d+)\s*response\(s\)\s*out of\s*(\d+)/);
                if (match) {
                    return {
                        actual: parseInt(match[1], 10),
                        expected: parseInt(match[2], 10)
                    };
                }
                return null;
            });

            if (result) {
                console.log(`📊 Responses: ${result.actual}/${result.expected}`);
                return result;
            }
        } catch {
            console.warn('  ⚠ Could not read response counter from DOM');
        }

        // Fallback — count radio groups dynamically
        // Each response has exactly 2 radios (Correct + Incorrect) sharing one name
        // So unique name count = response count
        try {
            const uniqueNames = await this.page().evaluate(() => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    'input[type="radio"][name^="response-original-"]'
                ));
                return new Set(inputs.map(i => i.name)).size;
            });

            if (uniqueNames > 0) {
                console.log(`  ✓ Fallback count: ${uniqueNames} base responses`);
                return { actual: uniqueNames, expected: uniqueNames };
            }
        } catch {
            console.warn('  ⚠ Fallback count also failed');
        }

        return { actual: 0, expected: 0 };
    }

    async getBaseResponseNameIndexes(): Promise<number[]> {
        const inputs = await this.page()
            .locator('input[name^="response-original-"]')
            .all();
        const indexes = new Set<number>();
        for (const input of inputs) {
            const name = await input.getAttribute('name');
            const match = name?.match(/response-original-(\d+)/);
            if (match) indexes.add(parseInt(match[1], 10));
        }
        return Array.from(indexes).sort((a, b) => a - b);
    }

    async getFrontierResponseNameIndexes(): Promise<number[]> {
        const inputs = await this.page()
            .locator('input[name^="response-frontier-"]')
            .all();
        const indexes = new Set<number>();
        for (const input of inputs) {
            const name = await input.getAttribute('name');
            const match = name?.match(/response-frontier-(\d+)/);
            if (match) indexes.add(parseInt(match[1], 10));
        }
        return Array.from(indexes).sort((a, b) => a - b);
    }

    async getResponseText(wrapperLocator: Locator): Promise<string> {
        const text = await wrapperLocator
            .locator('div.sc-6e40ec64-22.bkcbqC span')
            .textContent();
        return text?.trim() ?? '';
    }

    async getAllBaseResponseTexts(): Promise<string[]> {
        const wrappers = await this.baseResponseWrappers.all();
        return Promise.all(wrappers.map(w => this.getResponseText(w)));
    }

    async getAllFrontierResponseTexts(): Promise<string[]> {
        const wrappers = await this.frontierResponseWrappers.all();
        return Promise.all(wrappers.map(w => this.getResponseText(w)));
    }

    async isFrontierButtonEnabled(): Promise<boolean> {
        const count = await this.frontierButton.count();
        if (count === 0) return false;
        return !(await this.frontierButton.isDisabled());
    }

    async isSubmitButtonEnabled(): Promise<boolean> {
        const count = await this.submitButton.count();
        if (count === 0) return false;
        return !(await this.submitButton.isDisabled());
    }

    async areAllBaseResponsesMarked(): Promise<boolean> {
        const indexes = await this.getBaseResponseNameIndexes();
        for (const i of indexes) {
            const checkedCount = await this.page()
                .locator(`input[name="response-original-${i}"]:checked`)
                .count();
            if (checkedCount === 0) return false;
        }
        return indexes.length > 0;
    }

    async areAllFrontierResponsesMarked(): Promise<boolean> {
        const indexes = await this.getFrontierResponseNameIndexes();
        for (const i of indexes) {
            const checkedCount = await this.page()
                .locator(`input[name="response-frontier-${i}"]:checked`)
                .count();
            if (checkedCount === 0) return false;
        }
        return indexes.length > 0;
    }

    // ─────────────────────────────────────────
    // DEBUG HELPERS
    // ─────────────────────────────────────────

    async dumpPageHTML(name: string): Promise<void> {
        const html = await this.page().content();
        fs.writeFileSync(`./screenshots/${name}.html`, html);
    }

    async logResponseSummary(expectedCount: number): Promise<void> {
        const { actual, expected } = await this.getResponseCountFromUI(expectedCount);
        console.log(`📊 Responses: ${actual}/${expected}`);
        const baseIndexes = await this.getBaseResponseNameIndexes();
        console.log(`  Base responses: ${baseIndexes.length} (indexes: ${baseIndexes.join(', ')})`);
        const frontierIndexes = await this.getFrontierResponseNameIndexes();
        console.log(`  Frontier responses: ${frontierIndexes.length} (indexes: ${frontierIndexes.join(', ')})`);
    }
}