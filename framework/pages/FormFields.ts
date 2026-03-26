import { Locator, Page } from '@playwright/test';

/**
 * FormFields — reusable scoped form component.
 * 
 * Pass a root Locator to scope all field interactions to a specific container.
 * PromptCreatorPage passes body, ReviewAndSubmitForm passes the modal div.
 * 
 * Selenium/Java equivalent: a PageComponent class with @FindBy elements
 * that gets injected into multiple page objects.
 */
export class FormFields {
    constructor(private root: Locator, private page: Page) { }

    // ─────────────────────────────────────────
    // LOCATORS
    // ─────────────────────────────────────────

    get promptTextarea() {
        return this.root.locator('div.question-textarea textarea');
    }

    get finalAnswerTextarea() {
        return this.root.locator('textarea[placeholder*="Let\'s say the length"]');
    }

    /** Solution Process textarea */
    get solutionProcessTextarea() {
        // 1. Find the label container
        // 2. Use XPath to find the following textarea sibling
        return this.root
            .locator('div')
            .filter({ hasText: /^Solution Process$/ })
            .locator('xpath=./following-sibling::textarea');
    }

    /** Thinking Process/Analysis textarea */
    get thinkingProcessTextarea() {
        return this.root.locator('div.solution-process-textarea textarea'); //.nth(0);
    }

    get answerUnitTextarea() {
        return this.root.locator('div.unitsForAnswerTextareaWrapper textarea');
    }

    get noUnitLabel() {
        return this.root.locator('span.sc-c89fac35-5')
            .filter({ hasText: 'This answer does not require a unit' });
    }

    get levelDropdownInput() {
        return this.root.locator('#react-select-dropdown-level-dropdown-input');
    }

    get disciplineDropdownInput() {
        return this.root.locator('#react-select-dropdown-disciplines-dropdown-input');
    }

    get keyPointsClickArea() {
        return this.root.locator('div.sc-c9e57cf2-1');
    }

    get keyPointsSearchInput() {
        return this.root.locator('div.sc-c9e57cf2-5 input[placeholder="Search"]');
    }

    get keyPointsAddButton() {
        return this.root.locator(
            'button:has(svg[data-testid="AddOutlinedIcon"]) span:has-text("Add")'
        );
    }

    get keyPointsCustomInput() {
        return this.root.locator('input[placeholder="Enter custom knowledge point"]');
    }

    get keyPointsSaveButton() {
        return this.root.locator('button.btn-primary:has-text("Save")');
    }

    get correctAnswerInput() {
        return this.root.locator('input[aria-label="Correct Response"]');
    }

    get incorrectAnswerInputs() {
        return this.root.locator('input[aria-label^="Incorrect Responses"]');
    }

    incorrectAnswerAt(index: number) {
        return this.incorrectAnswerInputs.nth(index);
    }

    reactSelectOption(text: string) {
        return this.page.getByRole('option', { name: text, exact: true });
    }

    // ─────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────

    async fillFinalAnswer(value: string): Promise<void> {
        await this.finalAnswerTextarea.waitFor({ state: 'visible', timeout: 5000 });
        await this.finalAnswerTextarea.fill(value);
    }

    async fillSolutionProcess(value: string): Promise<void> {
        await this.solutionProcessTextarea.waitFor({ state: 'visible', timeout: 5000 });
        await this.solutionProcessTextarea.fill(value);
    }

    async fillThinkingProcess(value: string): Promise<void> {
        await this.thinkingProcessTextarea.waitFor({ state: 'visible', timeout: 5000 });
        await this.thinkingProcessTextarea.fill(value);
    }

    async fillAnswerUnit(value: string): Promise<void> {
        await this.answerUnitTextarea.fill(value);
    }

    async checkNoUnit(): Promise<void> {
        await this.noUnitLabel.click();
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

    // async addKeyPoint(keyPoint: string): Promise<void> {
    //     await this.keyPointsClickArea.click();
    //     await this.keyPointsSearchInput.waitFor({ state: 'visible', timeout: 5000 });
    //     await this.keyPointsSearchInput.fill(keyPoint);
    //     await this.keyPointsAddButton.waitFor({ state: 'visible', timeout: 3000 });
    //     await this.keyPointsAddButton.click();
    //     await this.keyPointsCustomInput.waitFor({ state: 'visible', timeout: 3000 });
    //     await this.keyPointsCustomInput.fill(keyPoint);
    //     await this.keyPointsSaveButton.waitFor({ state: 'visible', timeout: 3000 });
    //     await this.keyPointsSaveButton.click();
    //     await this.root.locator('label').filter({ hasText: 'Final Answer' }).click();
    //     await this.page.waitForTimeout(300);
    // }

    async fillCorrectAnswer(value: string): Promise<void> {
        await this.correctAnswerInput.fill(value);
    }

    async fillAllIncorrectAnswers(values: string[]): Promise<void> {
        for (let i = 0; i < values.length; i++) {
            await this.incorrectAnswerAt(i).fill(values[i]);
        }
    }

    /**
     * Gets a specific chip locator by its text value.
     * Scopes to the div that contains BOTH the key point text AND a remove button.
     * This dual anchor makes the locator unique and stable.
     *
     * DevTools verify (replace 'Physics' with your key point):
     * [...document.querySelectorAll('button.remove-btn')]
     *   .find(btn => btn.parentElement?.textContent?.trim().startsWith('Physics'))
     *   ?.parentElement
     */
    chipByText(keyPointText: string) {
        return this.root
            .locator('button.remove-btn')
            .filter({
                has: this.page.locator(
                    `xpath=..//self::button[contains(@class,"remove-btn")]`
                )
            })
            .locator('..')  // go up to parent chip div
            .filter({
                hasText: keyPointText  // parent div contains the key point text
            });
    }

    /**
     * Checks if a specific key point chip exists in the UI.
     * Uses both text content and remove button presence as dual anchors.
     */
    async isChipPresent(keyPointText: string): Promise<boolean> {
        // Find all remove buttons whose parent div starts with this text
        const found = await this.root
            .locator('button.remove-btn')
            .evaluateAll((buttons: Element[], text: string) =>
                buttons.some(btn => {
                    const parent = btn.parentElement;
                    // Get direct text node only — exclude button child text
                    const chipText = Array.from(parent?.childNodes ?? [])
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent?.trim() ?? '')
                        .join('')
                        .trim();
                    return chipText.toLowerCase() === text.toLowerCase();
                }),
                keyPointText
            );
        return found;
    }

    /**
     * Reads all existing chip texts.
     * Anchors on button.remove-btn — every chip has exactly one.
     * Text is the direct text node before the remove button.
     */
    async getExistingKeyPointChips(): Promise<string[]> {
        return this.root
            .locator('button.remove-btn')
            .evaluateAll((buttons: Element[]) =>
                buttons.map(btn => {
                    const parent = btn.parentElement;
                    return Array.from(parent?.childNodes ?? [])
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent?.trim() ?? '')
                        .join('')
                        .trim();
                }).filter(text => text.length > 0)
            );
    }

    async addKeyPoint(keyPoint: string): Promise<void> {
        // Check using BOTH text + remove-btn — dual anchor
        const alreadyExists = await this.isChipPresent(keyPoint);

        if (alreadyExists) {
            console.log(`    ✓ Chip "${keyPoint}" already present (text + remove-btn confirmed), skipping`);
            return;
        }

        // Open the dropdown
        await this.keyPointsClickArea.click();
        await this.keyPointsSearchInput.waitFor({ state: 'visible', timeout: 5000 });
        await this.keyPointsSearchInput.fill(keyPoint);

        // Click + Add to open custom input
        await this.keyPointsAddButton.waitFor({ state: 'visible', timeout: 3000 });
        await this.keyPointsAddButton.click();

        // Fill custom input and save
        await this.keyPointsCustomInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.keyPointsCustomInput.fill(keyPoint);
        await this.keyPointsSaveButton.waitFor({ state: 'visible', timeout: 3000 });
        await this.keyPointsSaveButton.click();

        // Close dropdown by clicking away
        await this.root.locator('label').filter({ hasText: 'Final Answer' }).click();
        await this.page.waitForTimeout(300);

        // Verify using BOTH anchors — text AND remove button must be present
        const confirmed = await this.isChipPresent(keyPoint);
        if (!confirmed) {
            throw new Error(
                `Key point "${keyPoint}" chip not found after save. ` +
                `Expected chip with text "${keyPoint}" and remove button. ` +
                `Current chips: ${JSON.stringify(await this.getExistingKeyPointChips())}`
            );
        }

        console.log(`    ✓ Chip "${keyPoint}" confirmed — text + remove-btn both present`);
    }

}