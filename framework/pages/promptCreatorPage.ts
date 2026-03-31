import { Locator, Page, expect } from '@playwright/test';
import { TestContext } from '../core/TestContext';
import { BasePage } from './basePage';

export class PromptCreatorPage extends BasePage {
    private context: TestContext;

    constructor(context: TestContext) {
        super(context.browser);
        this.context = context;
    }

    // ─────────────────────────────────────────
    // QUESTION TYPE SELECTION
    // ─────────────────────────────────────────

    /** Radio input for Multiple Choice — `input[type="radio"][name="questionType"]` nth(0) */
    get multipleChoiceRadio() {
        return this.page().locator('input[type="radio"][name="questionType"]').nth(0);
    }

    /** Radio input for Essay Style — `input[type="radio"][name="questionType"]` nth(1) */
    get essayStyleRadio() {
        return this.page().locator('input[type="radio"][name="questionType"]').nth(1);
    }

    /** Label for Multiple Choice — clicks the visible label, not the hidden radio */
    get multipleChoiceLabel() {
        return this.page().locator('span.sc-cf44095c-4').filter({ hasText: 'Multiple Choice' });
    }

    /** Label for Essay Style */
    get essayStyleLabel() {
        return this.page().locator('span.sc-cf44095c-4').filter({ hasText: 'Essay Style' });
    }

    // ─────────────────────────────────────────
    // SHARED FIELDS (both question types)
    // ─────────────────────────────────────────

    /** Main prompt textarea — identified by placeholder from HTML */
    // ─────────────────────────────────────────
    // PROMPT TEXTAREA
    // ─────────────────────────────────────────

    /**
     * Works for BOTH Multiple Choice and Essay question types.
     * Uses structural class 'question-textarea' from the wrapping div.
     * DO NOT use placeholder-based selectors here — placeholder differs
     * per question type and disappears after filling.
     *
     * DevTools verify: document.querySelector('div.question-textarea textarea')
     */
    get promptTextarea() {
        return this.page().locator('div.question-textarea textarea');
    }

    /**
     * Essay-only textarea — only use if you need to target essay specifically.
     * DevTools verify: document.querySelector('textarea[placeholder*="A school is planning"]')
     */
    get essayPromptTextarea() {
        return this.page().locator('textarea[placeholder*="A school is planning"]');
    }

    /**
     * Multiple Choice only textarea — only use if you need to target MC specifically.
     * DevTools verify: document.querySelector('textarea[placeholder*="Solve"]')
     */
    get multipleChoicePromptTextarea() {
        return this.page().locator('textarea[placeholder*="Solve"]');
    }

    /** Answer Unit textarea — `placeholder*="mol"` */
    get answerUnitTextarea() {
        return this.page().locator('textarea[placeholder*="mol"]');
    }

    /** "This answer does not require a unit" checkbox label */
    get noUnitCheckbox() {
        return this.page().locator('input[type="checkbox"]').filter({
            has: this.page().locator('~ label span', { hasText: 'This answer does not require a unit' })
        });
    }

    /** No unit label — safer to click the label than the hidden checkbox */
    get noUnitLabel() {
        return this.page().locator('span.sc-c89fac35-5').filter({ hasText: 'This answer does not require a unit' });
    }

    // ─────────────────────────────────────────
    // MULTIPLE CHOICE FIELDS
    // ─────────────────────────────────────────

    /** Correct answer input — `aria-label="Correct Response"` */
    get correctAnswerInput() {
        return this.page().locator('input[aria-label="Correct Response"]');
    }

    /** Incorrect answer inputs — `aria-label^="Incorrect Responses"` */
    get incorrectAnswerInputs() {
        return this.page().locator('input[aria-label^="Incorrect Responses"]');
    }

    incorrectAnswerAt = (index: number) =>
        this.incorrectAnswerInputs.nth(index);

    // ─────────────────────────────────────────
    // ESSAY STYLE FIELDS
    // ─────────────────────────────────────────

    /** Final Answer textarea — identified by its label in the DOM */
    get finalAnswerTextarea() {
        return this.page().locator('textarea[placeholder*="Let\'s say the length"]');
    }

    /** Solution Process textarea */
    get solutionProcessTextarea() {
        return this.page().locator('div.solution-process-textarea textarea').nth(0);
    }

    /** Thinking Process/Analysis textarea */
    get thinkingProcessTextarea() {
        return this.page().locator('div.solution-process-textarea textarea').nth(1);
    }

    // ─────────────────────────────────────────
    // KEY POINTS LOCATORS
    // ─────────────────────────────────────────

    /** The clickable Key Points area that opens the dropdown */
    get keyPointsClickArea() {
        return this.page().locator('div.sc-c9e57cf2-1');
    }

    /** Search input inside the dropdown — appears after clicking the area */
    get keyPointsSearchInput() {
        return this.page().locator('div.sc-c9e57cf2-5 input[placeholder="Search"]');
    }

    /** The "+ Add" button that opens the custom input form */
    get keyPointsAddButton() {
        return this.page().locator('button:has(svg[data-testid="AddOutlinedIcon"]) span:has-text("Add")');
    }

    /** Custom knowledge point input — appears after clicking "+ Add" */
    get keyPointsCustomInput() {
        return this.page().locator('input[placeholder="Enter custom knowledge point"]');
    }

    /** Save button inside the custom knowledge point form */
    get keyPointsSaveButton() {
        return this.page().locator('button.btn-primary:has-text("Save")');
    }

    /** All key point chips shown after selection */
    /**
     * All key point chip containers — each contains chip text + remove button.
     * Stable anchor: button.remove-btn is present in every chip.
     *
     * DevTools: document.querySelectorAll('button.remove-btn').length
     *
     * TODO: if remove-btn class changes, use:
     * div[class*="sc-c9e57cf2"]:has(button[type="button"])
     */
    get keyPointChips() {
        return this.page().locator('button.remove-btn').locator('..');
    }

    // ─────────────────────────────────────────
    // META DATA (essay — Level & Discipline dropdowns)
    // ─────────────────────────────────────────

    /** React Select input for Level — stable id from HTML */
    get levelDropdownInput() {
        return this.page().locator('#react-select-dropdown-level-dropdown-input');
    }

    /** React Select container for Level — used to verify selection */
    get levelDropdownContainer() {
        return this.page().locator('#level-dropdown');
    }

    /** React Select input for Discipline */
    get disciplineDropdownInput() {
        return this.page().locator('#react-select-dropdown-disciplines-dropdown-input');
    }

    /** React Select container for Discipline */
    get disciplineDropdownContainer() {
        return this.page().locator('#disciplines-dropdown');
    }

    /** Dropdown option by visible text — works for both Level and Discipline */
    reactSelectOption = (text: string) =>
        this.page().getByRole('option', { name: text, exact: true });

    // ─────────────────────────────────────────
    // RUN / SUBMIT
    // ─────────────────────────────────────────

    get runButton() {
        return this.page().locator('button:has-text("Run")');
    }

    get submitButton() {
        return this.page().locator('button:has-text("Submit")');
    }

    get promptCreatedConfirmation() {
        return this.page().locator('text=Prompt created');
    }

    get promptCreationHeader() {
        return this.page().locator('h3:has-text("Prompt Creation")');
    }

    // ─────────────────────────────────────────
    // LOAD DRAFT MODAL
    // ─────────────────────────────────────────

    /**
     * Load Draft modal container.
     * DevTools: document.querySelector('h5:has-text("Load draft")')
     *           ?.closest('div.sc-2e6de984-1')
     *
     * TODO: if sc-2e6de984-1 class changes, use:
     * div:has(h5:has-text("Load draft"))
     */
    get loadDraftModal() {
        return this.page().locator('div.sc-2e6de984-1:has(h5:has-text("Load draft"))');
    }

    get loadDraftModalTitle() {
        return this.loadDraftModal.locator('h5');
    }

    /**
     * "Yes, load draft" button — primary action.
     * DevTools: document.querySelector('button.btn-primary:has-text("Yes, load draft")')
     */
    get loadDraftConfirmButton() {
        return this.loadDraftModal.locator('button.btn-primary');
    }

    /**
     * "Discard, keep empty" button — secondary action.
     * DevTools: document.querySelector('button.btn-tertiary:has-text("Discard")')
     */
    get loadDraftDiscardButton() {
        return this.loadDraftModal.locator('button.btn-tertiary');
    }

    /**
     * Run Draft button — appears instead of Run when draft is loaded.
     * DevTools: document.querySelector('button.btn-primary:has-text("Run draft")')
     */
    get runDraftButton() {
        return this.page().locator('button.btn-primary:has-text("Run draft")');
    }

    // ─────────────────────────────────────────
    // ACTIONS — Question Type
    // ─────────────────────────────────────────

    async selectMultipleChoice(): Promise<void> {
        await this.multipleChoiceLabel.click();
    }

    async selectEssayStyle(): Promise<void> {
        await this.essayStyleLabel.click();
    }

    // ─────────────────────────────────────────
    // ACTIONS — Shared
    // ─────────────────────────────────────────

    async fillPrompt(text: string): Promise<void> {
        console.log('    [DEBUG] Starting fillPrompt...');
        console.log(`    [DEBUG] Input text length: ${text.length} chars`);
        console.log(`    [DEBUG] Input text ends with: "${text.substring(text.length - 50)}"`);
        
        // promptTextarea works for both MC and Essay — no branching needed
        await this.promptTextarea.waitFor({ state: 'visible', timeout: 15000 });
        console.log('    [DEBUG] Textarea is visible');
        
        // Check if textarea has maxlength attribute
        const maxLength = await this.page().evaluate(() => {
            const textarea = document.querySelector('div.question-textarea textarea') as HTMLTextAreaElement;
            return textarea?.maxLength ?? -1;
        });
        console.log(`    [DEBUG] Textarea maxLength: ${maxLength}`);
        
        await this.promptTextarea.click();
        await this.promptTextarea.focus();
        console.log('    [DEBUG] Clicked and focused on textarea');
        
        // Method: Direct DOM value setting with React hook access
        const success = await this.page().evaluate((value: string) => {
            const textarea = document.querySelector('div.question-textarea textarea') as HTMLTextAreaElement;
            if (!textarea) {
                console.log('[EVAL] Textarea not found');
                return false;
            }
            
            console.log(`[EVAL] Setting value of length: ${value.length}`);
            
            // Set the value directly
            textarea.value = value;
            console.log(`[EVAL] Set textarea.value, actual length now: ${textarea.value.length}`);
            console.log(`[EVAL] Value ends with: "${textarea.value.substring(textarea.value.length - 50)}"`);
            
            // Dispatch comprehensive suite of events
            const events = ['input', 'change', 'blur', 'keydown', 'keyup'];
            events.forEach(eventName => {
                const event = new Event(eventName, { bubbles: true });
                Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
                textarea.dispatchEvent(event);
            });
            console.log('[EVAL] Dispatched events');
            
            return textarea.value.length > 0;
        }, text);
        
        console.log(`    [DEBUG] Direct DOM method success: ${success}`);
        await this.page().waitForTimeout(1000);
        
        // Verify the result
        const finalValue = await this.promptTextarea.inputValue().catch(() => '');
        console.log(`    [DEBUG] Final textarea value length: ${finalValue.length} chars`);
        console.log(`    [DEBUG] Final value ends with: "${finalValue.substring(finalValue.length - 50)}"`);
        
        if (finalValue.length === 0) {
            console.warn('    [WARNING] Textarea is empty, trying fallback method...');
            try {
                await this.promptTextarea.fill(text);
                await this.page().waitForTimeout(1000);
                const fallbackValue = await this.promptTextarea.inputValue().catch(() => '');
                console.log(`    [DEBUG] Fallback fill result: ${fallbackValue.length} chars`);
            } catch (e) {
                console.error(`    [ERROR] Fallback fill failed: ${e}`);
            }
        }
    }

    async fillAnswerUnit(unit: string): Promise<void> {
        await this.answerUnitTextarea.fill(unit);
    }

    async checkNoUnit(): Promise<void> {
        await this.noUnitLabel.click();
    }

    // ─────────────────────────────────────────
    // ACTIONS — Multiple Choice
    // ─────────────────────────────────────────

    async fillCorrectAnswer(answer: string): Promise<void> {
        await this.correctAnswerInput.fill(answer);
    }

    async fillIncorrectAnswer(index: number, value: string): Promise<void> {
        await this.incorrectAnswerAt(index).fill(value);
    }

    async fillAllIncorrectAnswers(values: string[]): Promise<void> {
        for (let i = 0; i < values.length; i++) {
            await this.fillIncorrectAnswer(i, values[i]);
        }
    }

    // ─────────────────────────────────────────
    // ACTIONS — Essay Style
    // ─────────────────────────────────────────

    async fillFinalAnswer(answer: string): Promise<void> {
        await this.finalAnswerTextarea.fill(answer);
    }

    async fillSolutionProcess(text: string): Promise<void> {
        await this.solutionProcessTextarea.fill(text);
    }

    async fillThinkingProcess(text: string): Promise<void> {
        await this.thinkingProcessTextarea.fill(text);
    }

    async addKeyPoint(keyPoint: string): Promise<void> {
        console.log(`    → Adding key point: "${keyPoint}"`);

        // Step 1: Click the Key Points area to open the dropdown
        await this.keyPointsClickArea.click();

        // Step 2: Wait for the search input to be visible, confirming dropdown is open
        await this.keyPointsSearchInput.waitFor({ state: 'visible', timeout: 5000 });

        // Step 3: Type in search to check if this key point already exists
        //         (if it exists as an option, user can select it directly)
        //         For now we always use "+ Add" to create a custom key point
        await this.keyPointsSearchInput.fill(keyPoint);

        // Step 4: Click the "+ Add" button to open the custom input form
        await this.keyPointsAddButton.waitFor({ state: 'visible', timeout: 3000 });
        await this.keyPointsAddButton.click();

        // Step 5: Wait for the custom input form to appear and type the key point
        await this.keyPointsCustomInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.keyPointsCustomInput.fill(keyPoint);

        // Step 6: Click Save to confirm
        await this.keyPointsSaveButton.waitFor({ state: 'visible', timeout: 3000 });
        await this.keyPointsSaveButton.click();

        // Step 7: Click somewhere neutral on the page to close the dropdown
        //         Using the prompt label area — always present and safe to click
        await this.page().locator('label').filter({ hasText: 'Prompt' }).click();

        // Step 8: Small wait to let the chip render in the Key Points area
        await this.page().waitForTimeout(300);

        console.log(`    ✓ Key point saved: "${keyPoint}"`);
    }

    /**
     * Reads key point chip texts in DRAFT/DISABLED mode.
     * In draft mode chips have NO remove button — text is the full content
     * of div.sc-c9e57cf2-2 directly.
     *
     * DevTools verify:
     * [...document.querySelectorAll('div.sc-c9e57cf2-2')]
     *   .map(d => d.textContent?.trim())
     *
     * TODO: if sc-c9e57cf2-2 class changes, use:
     * div.sc-c9e57cf2-1 > div:not(:has(button)) — chip divs without remove button
     */
    async getDraftKeyPointChipTexts(): Promise<string[]> {
        return this.page()
            .locator('div.sc-c9e57cf2-2')
            .evaluateAll((chips: Element[]) =>
                chips
                    .map(chip => {
                        // In draft mode — no remove button, textContent IS the chip text
                        // In normal mode — textContent includes button text, use text node only
                        const hasRemoveBtn = chip.querySelector('button.remove-btn') !== null;

                        if (hasRemoveBtn) {
                            // Normal mode — read direct text node to exclude button text
                            return Array.from(chip.childNodes)
                                .filter(node => node.nodeType === Node.TEXT_NODE)
                                .map(node => node.textContent?.trim() ?? '')
                                .join('')
                                .trim();
                        } else {
                            // Draft mode — full textContent is the chip text
                            return chip.textContent?.trim() ?? '';
                        }
                    })
                    .filter(text => text.length > 0)
            );
    }

    async selectLevel(level: string): Promise<void> {
        await this.levelDropdownInput.waitFor({ state: 'visible', timeout: 10000 });
        await this.levelDropdownInput.click();
        await this.levelDropdownInput.fill(level);
        await this.reactSelectOption(level).waitFor({ state: 'visible', timeout: 5000 });
        await this.reactSelectOption(level).click();
    }

    async selectDiscipline(discipline: string): Promise<void> {
        await this.disciplineDropdownInput.click();
        await this.disciplineDropdownInput.fill(discipline);
        await this.reactSelectOption(discipline).waitFor({ state: 'visible', timeout: 5000 });
        await this.reactSelectOption(discipline).click();
    }

    // ─────────────────────────────────────────
    // ACTIONS — Run / Submit
    // ─────────────────────────────────────────

    async clickRun(): Promise<void> {
        await this.runButton.click();
    }

    async clickSubmit(): Promise<void> {
        await this.submitButton.click();
    }

    async isPromptCreated(): Promise<boolean> {
        return await this.promptCreatedConfirmation.isVisible();
    }


    // ─────────────────────────────────────────
    // LOAD DRAFT MODAL ACTIONS
    // ─────────────────────────────────────────

    /**
     * Waits for Load Draft modal to appear after navigating back.
     */
    async waitForLoadDraftModal(): Promise<void> {
        console.log('  → Waiting for Load Draft modal...');
        await this.loadDraftModal.waitFor({ state: 'visible', timeout: 10000 });
        console.log('  ✓ Load Draft modal appeared');
    }

    /**
     * Clicks "Yes, load draft" and waits for modal to close.
     */
    async confirmLoadDraft(): Promise<void> {
        console.log('  → Confirming load draft...');
        await this.loadDraftConfirmButton.click();
        await this.loadDraftModal.waitFor({ state: 'hidden', timeout: 5000 });
        console.log('  ✓ Draft loaded');
    }

    /**
     * Clicks "Discard, keep empty" and waits for modal to close.
     */
    async discardDraft(): Promise<void> {
        console.log('  → Discarding draft...');
        await this.loadDraftDiscardButton.click();
        await this.loadDraftModal.waitFor({ state: 'hidden', timeout: 5000 });
        console.log('  ✓ Draft discarded');
    }

    /**
     * Verifies Run Draft button is visible — confirms draft was loaded.
     * DevTools: document.querySelector('button.btn-primary:has-text("Run draft")')
     */
    async verifyRunDraftButtonVisible(): Promise<void> {
        console.log('  → Verifying Run Draft button visible...');
        await this.runDraftButton.waitFor({ state: 'visible', timeout: 5000 });
        console.log('  ✓ Run Draft button visible');
    }

    /**
     * Verifies prompt fields are loaded in disabled/read-only mode.
     * Draft data is pre-filled but not editable.
     * DevTools: document.querySelector('div.question-textarea textarea').disabled
     */
    async verifyDraftFieldsDisabled(): Promise<void> {
        console.log('  → Verifying draft fields are in disabled/read-only mode...');

        const isDisabled = await this.promptTextarea.evaluate(
            (el: HTMLTextAreaElement) => el.disabled || el.readOnly
        );

        if (!isDisabled) {
            console.warn(
                '  ⚠ Prompt textarea is not disabled — ' +
                'draft may not have loaded in read-only mode'
            );
        } else {
            console.log('  ✓ Prompt textarea is disabled/read-only');
        }
    }

    /**
     * Clicks Run Draft button and waits for navigation to workbench.
     */
    async clickRunDraft(): Promise<void> {
        console.log('  → Clicking Run Draft...');
        await this.runDraftButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.runDraftButton.click();
        console.log('  ✓ Run Draft clicked');
    }

    // ─────────────────────────────────────────
    // VALIDATION — Check for errors
    // ─────────────────────────────────────────

    /**
     * Checks if prompt field has validation error
     */
    async hasPromptError(): Promise<boolean> {
        const errorElement = this.page().locator('.isPromptError');
        return await errorElement.isVisible().catch(() => false);
    }

    /**
     * Gets prompt error message
     */
    async getPromptErrorMessage(): Promise<string> {
        const errorElement = this.page().locator('.isPromptError');
        return (await errorElement.textContent().catch(() => null)) ?? '';
    }

    /**
     * Checks if level dropdown has validation error
     */
    async hasLevelError(): Promise<boolean> {
        const levelContainer = this.page().locator('#level-dropdown').locator('..').first();
        return await levelContainer.evaluate(el => el.classList.contains('error')).catch(() => false);
    }

    /**
     * Gets level error message
     */
    async getLevelErrorMessage(): Promise<string> {
        const errorMsg = this.page().locator('div.sc-9d92f43a-0.error >> div.sc-9d92f43a-2').first();
        return (await errorMsg.textContent().catch(() => null)) ?? '';
    }

    /**
     * Checks if discipline dropdown has validation error
     */
    async hasDisciplineError(): Promise<boolean> {
        const disciplineContainer = this.page().locator('#disciplines-dropdown').locator('..').first();
        return await disciplineContainer.evaluate(el => el.classList.contains('error')).catch(() => false);
    }

    /**
     * Gets discipline error message
     */
    async getDisciplineErrorMessage(): Promise<string> {
        const errorElements = this.page().locator('div.sc-9d92f43a-0.error >> div.sc-9d92f43a-2');
        const count = await errorElements.count();
        if (count >= 2) {
            return (await errorElements.nth(1).textContent().catch(() => null)) ?? '';
        }
        return '';
    }

    /**
     * Gets all validation errors on the form
     */
    async getAllValidationErrors(): Promise<string[]> {
        const errors: string[] = [];

        // Check if prompt textarea is actually filled
        const promptValue = await this.promptTextarea.inputValue().catch(() => '');
        if (!promptValue || promptValue.trim() === '') {
            errors.push('Prompt: Question is required');
        }

        // Check prompt error (after form submission)
        if (await this.hasPromptError()) {
            const msg = await this.getPromptErrorMessage();
            errors.push(`Prompt: ${msg}`);
        }

        // Check level error
        if (await this.hasLevelError()) {
            const msg = await this.getLevelErrorMessage();
            errors.push(`Level: ${msg}`);
        }

        // Check discipline error
        if (await this.hasDisciplineError()) {
            const msg = await this.getDisciplineErrorMessage();
            errors.push(`Discipline: ${msg}`);
        }

        // Additional checks based on question type
        const isEssay = await this.essayStyleRadio.isChecked().catch(() => false);
        const isMultipleChoice = await this.multipleChoiceRadio.isChecked().catch(() => false);

        if (isMultipleChoice) {
            // Check for incorrect answer error
            const incorrectAnswerError = this.page().locator('.isIncorrectResponsesError');
            if (await incorrectAnswerError.isVisible().catch(() => false)) {
                const errorMsg = await incorrectAnswerError.textContent().catch(() => '');
                errors.push(`Incorrect Responses: ${errorMsg ?? ''}`);
            }
        }

        return errors;
    }

}

