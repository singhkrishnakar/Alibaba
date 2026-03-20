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
    get keyPointChips() {
        return this.page().locator('div.sc-c9e57cf2-3 span, div.sc-c9e57cf2-3 div');
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
        // promptTextarea works for both MC and Essay — no branching needed
        await this.promptTextarea.waitFor({ state: 'visible', timeout: 15000 });
        await this.promptTextarea.click();
        await this.promptTextarea.fill(text);
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
}
