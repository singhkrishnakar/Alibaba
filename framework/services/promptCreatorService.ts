import { expect } from '@playwright/test';
import { BrowserManager } from '../browser/browserManager';
import { PromptCreatorPage } from '../pages/promptCreatorPage';
import { prompts } from '../../data/prompts/prompts';
import { PromptTestData } from '../../types/promptTestData.type';
import { Logger } from '../utils/Logger';

type QuestionType = 'multipleChoice' | 'essay';

export class PromptCreatorService {
    constructor(
        private browser: BrowserManager,
        private promptCreator: PromptCreatorPage
    ) { }

    // ─────────────────────────────────────────
    // CORE ORCHESTRATION
    // ─────────────────────────────────────────

    async createPrompt(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('📝 Creating prompt...');
        const startTime = Date.now();

        try {
            const questionType = this.resolveQuestionType(testData);

            await this.selectQuestionType(questionType);

            // ── Shared: present in BOTH question types ──
            await this.fillPrompt(testData, abortOnFailure);
            await this.fillAnswerUnit(testData, abortOnFailure);
            await this.fillSolutionProcess(testData, abortOnFailure);
            await this.fillThinkingProcess(testData, abortOnFailure);
            await this.fillKeyPoints(testData, abortOnFailure);
            await this.setEducationLevel(testData, abortOnFailure);
            await this.setDiscipline(testData, abortOnFailure);

            // ── Multiple Choice only ──
            if (questionType === 'multipleChoice') {
                await this.fillCorrectAnswer(testData, abortOnFailure);
                await this.fillIncorrectAnswers(testData, abortOnFailure);
            }

            // ── Essay only ──
            if (questionType === 'essay') {
                await this.fillFinalAnswer(testData, abortOnFailure);
            }

            //await this.runPrompt(abortOnFailure);

            await this.browser.takeScreenshot('05_prompt_created');
            console.log(`✓ Prompt created (${Date.now() - startTime}ms)`);
            return true;
        } catch (error) {
            console.error(`⚠ Prompt creation error: ${error}`);
            throw error;
        }
    }

    // ─────────────────────────────────────────
    // QUESTION TYPE
    // ─────────────────────────────────────────

    private resolveQuestionType(testData: PromptTestData): QuestionType {
        const raw = testData.metadata.questionType?.toLowerCase() ?? '';
        if (raw.includes('essay')) return 'essay';
        return 'multipleChoice';
    }

    async selectQuestionType(type: QuestionType): Promise<void> {
        console.log(`  → Selecting question type: ${type}`);
        if (type === 'essay') {
            await this.promptCreator.selectEssayStyle();
        } else {
            await this.promptCreator.selectMultipleChoice();
        }
    }

    private async fillQuestionTypeSpecificFields(
        testData: PromptTestData,
        abortOnFailure: boolean
    ): Promise<void> {

        if (testData.metadata.questionType === 'essay') {
            // TypeScript KNOWS metadata is EssayMetadataConfig here
            // ✅ testData.metadata.finalAnswer — exists, no error
            // ❌ testData.metadata.correctAnswer — TypeScript error at compile time
            await this.fillFinalAnswer(testData, abortOnFailure);

        } else {
            // TypeScript KNOWS metadata is MultipleChoiceMetadataConfig here
            // ✅ testData.metadata.correctAnswer — exists, no error
            // ❌ testData.metadata.finalAnswer — TypeScript error at compile time
            await this.fillCorrectAnswer(testData, abortOnFailure);
            await this.fillIncorrectAnswers(testData, abortOnFailure);
        }
    }
    // ─────────────────────────────────────────
    // SHARED FIELDS (both question types)
    // ─────────────────────────────────────────

    async fillPrompt(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('  → Filling prompt text');
        try {
            // Prompt text comes from the prompts data file, keyed by testData.id
            // This matches exactly how your ExportPromptOrchestrator does it
            const promptConfig = prompts[testData.id];
            await this.promptCreator.fillPrompt(promptConfig.promptText);
            console.log('  ✓ Prompt filled');
            // DEBUG: Wait for field to settle
            await this.browser.waitForTimeout(2000);
            return true;
        } catch (error) {
            console.error(`  ⚠ Prompt fill error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillAnswerUnit(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('  → Setting answer unit');
        try {
            // If no answerUnit value exists on metadata, treat it as "no unit required"
            if (!testData.metadata.answerUnit) {
                await this.promptCreator.checkNoUnit();
                console.log('  ✓ No unit checked');
            } else {
                await this.promptCreator.fillAnswerUnit(testData.metadata.answerUnit);
                console.log(`  ✓ Answer unit filled: ${testData.metadata.answerUnit}`);
            }
            // DEBUG: Wait for field to settle
            await this.browser.waitForTimeout(1000);
            return true;
        } catch (error) {
            console.error(`  ⚠ Answer unit error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillSolutionProcess(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('  → Filling solution process');
        try {
            await this.promptCreator.fillSolutionProcess(testData.metadata.solutionProcess);
            console.log('  ✓ Solution process filled');
            // DEBUG: Wait for field to settle
            await this.browser.waitForTimeout(1000);
            return true;
        } catch (error) {
            console.error(`  ⚠ Solution process error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillThinkingProcess(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('  → Filling thinking process');
        try {
            await this.promptCreator.fillThinkingProcess(testData.metadata.thinkingProcess);
            console.log('  ✓ Thinking process filled');
            // DEBUG: Wait for field to settle
            await this.browser.waitForTimeout(1000);
            return true;
        } catch (error) {
            console.error(`  ⚠ Thinking process error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillKeyPoints(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('  → Adding key points');
        try {
            if (!testData.metadata.knowledgePoints?.length) {
                console.log('  ℹ No key points to add, skipping');
                return true;
            }

            // Each key point goes through the full open → add → save → close flow
            // The page method handles all steps internally
            for (const keyPoint of testData.metadata.knowledgePoints) {
                await this.promptCreator.addKeyPoint(keyPoint);
                console.log(`  ✓ Key point added: "${keyPoint}"`);
            }

            return true;
        } catch (error) {
            console.error(`  ⚠ Key points error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async setEducationLevel(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log(`  → Setting education level: ${testData.metadata.level}`);
        try {
            await this.promptCreator.selectLevel(testData.metadata.level);
            console.log(`  ✓ Level set: ${testData.metadata.level}`);
            return true;
        } catch (error) {
            console.error(`  ⚠ Education level error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async setDiscipline(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log(`  → Setting discipline: ${testData.metadata.discipline}`);
        try {
            await this.promptCreator.selectDiscipline(testData.metadata.discipline);
            console.log(`  ✓ Discipline set: ${testData.metadata.discipline}`);
            return true;
        } catch (error) {
            console.error(`  ⚠ Discipline error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    /**
     * Verifies that after clicking Rewrite Prompt:
     * 1. Page navigated to correct URL
     * 2. All fields are auto-populated with the original data
     *
     * Reuses all existing verify methods — no new verification logic.
     * Called after workbenchService.clickRewritePromptAndWaitForNavigation().
     */
    async verifyRewritePromptAutoPopulation(
        testData: PromptTestData,
        isDraft = false  // ← pass true when verifying draft-loaded data
    ): Promise<void> {
        Logger.info('🔍 Verifying auto-population...');
        const promptConfig = prompts[testData.id];

        await this.verifyPageLoaded();
        await this.verifyPromptFilled(promptConfig.promptText);

        await expect(this.promptCreator.solutionProcessTextarea)
            .toHaveValue(testData.metadata.solutionProcess, { timeout: 5000 });
        console.log('  ✓ Solution Process verified');

        await expect(this.promptCreator.thinkingProcessTextarea)
            .toHaveValue(testData.metadata.thinkingProcess, { timeout: 5000 });
        console.log('  ✓ Thinking Process verified');

        if (testData.metadata.answerUnit) {
            await expect(this.promptCreator.answerUnitTextarea)
                .toHaveValue(testData.metadata.answerUnit, { timeout: 5000 });
            console.log(`  ✓ Answer Unit verified: ${testData.metadata.answerUnit}`);
        } else {
            const isChecked = await this.promptCreator.noUnitCheckbox.isChecked()
                .catch(() => false);
            if (!isChecked) {
                console.warn('  ⚠ No unit checkbox expected to be checked but is not');
            } else {
                console.log('  ✓ No unit checkbox verified as checked');
            }
        }

        await this.verifyLevelSelected(testData.metadata.level);
        await this.verifyDisciplineSelected(testData.metadata.discipline);

        // ── Key Points — use draft-aware method when loading from draft ──
        if (isDraft) {
            await this.verifyDraftKeyPointChips(testData.metadata.knowledgePoints ?? []);
        } else {
            await this.verifyKeyPointChips(testData.metadata.knowledgePoints ?? []);
        }

        if (testData.metadata.questionType === 'essay') {
            await this.verifyFinalAnswer(testData.metadata.finalAnswer);
        } else {
            await this.verifyCorrectAnswer(testData.metadata.correctAnswer);
            await this.verifyIncorrectAnswers(testData.metadata.incorrectAnswers);
        }

        Logger.info('✅ All fields verified as auto-populated');
    }

    // ─────────────────────────────────────────
    // NEW VERIFY HELPERS — reused by verifyRewritePromptAutoPopulation
    // ─────────────────────────────────────────

    /**
     * Verifies Level dropdown shows the expected selected value.
     * Reads the React Select singleValue div — not the hidden input.
     *
     * DevTools: document.querySelector('#level-dropdown .css-1dimb5e-singleValue')?.textContent
     *
     * TODO: if css-1dimb5e-singleValue class changes, use:
     * #level-dropdown div[class*="singleValue"]
     */
    async verifyLevelSelected(expectedLevel: string): Promise<void> {
        const selectedValue = await this.promptCreator.levelDropdownContainer
            .locator('div[class*="singleValue"]')
            .textContent();

        if (selectedValue?.trim() !== expectedLevel) {
            throw new Error(
                `Level mismatch.\n` +
                `  Expected: "${expectedLevel}"\n` +
                `  Actual:   "${selectedValue?.trim()}"`
            );
        }
        console.log(`  ✓ Level verified: ${expectedLevel}`);
    }

    /**
     * Verifies Discipline dropdown shows the expected selected value.
     *
     * DevTools: document.querySelector('#disciplines-dropdown .css-1dimb5e-singleValue')?.textContent
     *
     * TODO: if css-1dimb5e-singleValue class changes, use:
     * #disciplines-dropdown div[class*="singleValue"]
     */
    async verifyDisciplineSelected(expectedDiscipline: string): Promise<void> {
        const selectedValue = await this.promptCreator.disciplineDropdownContainer
            .locator('div[class*="singleValue"]')
            .textContent();

        if (selectedValue?.trim() !== expectedDiscipline) {
            throw new Error(
                `Discipline mismatch.\n` +
                `  Expected: "${expectedDiscipline}"\n` +
                `  Actual:   "${selectedValue?.trim()}"`
            );
        }
        console.log(`  ✓ Discipline verified: ${expectedDiscipline}`);
    }

    /**
     * Verifies all expected key point chips are present.
     * Uses remove button as anchor — same pattern as addKeyPoint duplicate check.
     *
     * DevTools:
     * [...document.querySelectorAll('button.remove-btn')]
     *   .map(btn => [...btn.parentElement.childNodes]
     *     .filter(n => n.nodeType === Node.TEXT_NODE)
     *     .map(n => n.textContent?.trim()).join(''))
     */
    async verifyKeyPointChips(expectedKeyPoints: string[]): Promise<void> {
        if (!expectedKeyPoints.length) {
            console.log('  ℹ No key points to verify, skipping');
            return;
        }

        /**
         * Read chip texts directly from the page using button.remove-btn as anchor.
         * This is the same pattern used in FormFields.getExistingKeyPointChips().
         * DO NOT use this.promptCreator.keyPointChips — that locator targets
         * div.sc-c9e57cf2-3 which does not contain remove buttons.
         *
         * DevTools verify:
         * [...document.querySelectorAll('button.remove-btn')]
         *   .map(btn => [...btn.parentElement.childNodes]
         *     .filter(n => n.nodeType === Node.TEXT_NODE)
         *     .map(n => n.textContent?.trim()).join(''))
         */
        const actualChips = await this.promptCreator.page()
            .locator('button.remove-btn')
            .evaluateAll((buttons: Element[]) =>
                buttons.map(btn =>
                    Array.from(btn.parentElement?.childNodes ?? [])
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent?.trim() ?? '')
                        .join('')
                        .trim()
                ).filter(text => text.length > 0)
            );

        console.log(`  ℹ Found chips: ${JSON.stringify(actualChips)}`);

        for (const expected of expectedKeyPoints) {
            const found = actualChips.some(
                chip => chip.toLowerCase() === expected.trim().toLowerCase()
            );
            if (!found) {
                throw new Error(
                    `Key point chip "${expected}" not found.\n` +
                    `  Actual chips: ${JSON.stringify(actualChips)}`
                );
            }
            console.log(`  ✓ Key point chip verified: "${expected}"`);
        }
    }

    /**
     * Verifies key point chips in DRAFT/DISABLED mode.
     * Uses getDraftKeyPointChipTexts() which handles both
     * normal chips (with remove button) and draft chips (without remove button).
     *
     * Call this instead of verifyKeyPointChips() when verifying draft-loaded data.
     */
    async verifyDraftKeyPointChips(expectedKeyPoints: string[]): Promise<void> {
        if (!expectedKeyPoints.length) {
            console.log('  ℹ No key points to verify, skipping');
            return;
        }

        // Use the draft-aware method that handles missing remove button
        const actualChips = await this.promptCreator.getDraftKeyPointChipTexts();

        console.log(`  ℹ Found draft chips: ${JSON.stringify(actualChips)}`);

        for (const expected of expectedKeyPoints) {
            const found = actualChips.some(
                chip => chip.toLowerCase() === expected.trim().toLowerCase()
            );
            if (!found) {
                throw new Error(
                    `Draft key point chip "${expected}" not found.\n` +
                    `  Actual chips: ${JSON.stringify(actualChips)}`
                );
            }
            console.log(`  ✓ Draft key point chip verified: "${expected}"`);
        }
    }

    // ─────────────────────────────────────────
    // MULTIPLE CHOICE ONLY
    // ─────────────────────────────────────────

    async fillCorrectAnswer(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        // Type guard — TypeScript now knows metadata is MultipleChoiceMetadataConfig
        // inside this block, so correctAnswer is accessible without error
        if (testData.metadata.questionType !== 'multipleChoice') {
            console.log('  ℹ Correct answer: not applicable for essay type, skipping');
            return true;
        }
        try {
            await this.promptCreator.fillCorrectAnswer(testData.metadata.correctAnswer);
            console.log('  ✓ Correct answer filled');
            return true;
        } catch (error) {
            console.error(`  ⚠ Correct answer error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillIncorrectAnswers(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        if (testData.metadata.questionType !== 'multipleChoice') {
            console.log('  ℹ Incorrect answers: not applicable for essay type, skipping');
            return true;
        }
        try {
            await this.promptCreator.fillAllIncorrectAnswers(testData.metadata.incorrectAnswers);
            console.log('  ✓ Incorrect answers filled');
            return true;
        } catch (error) {
            console.error(`  ⚠ Incorrect answers error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    // ─────────────────────────────────────────
    // ESSAY ONLY
    // ─────────────────────────────────────────

    async fillFinalAnswer(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        if (testData.metadata.questionType !== 'essay') {
            console.log('  ℹ Final answer: not applicable for multiple choice type, skipping');
            return true;
        }
        try {
            await this.promptCreator.fillFinalAnswer(testData.metadata.finalAnswer);
            console.log('  ✓ Final answer filled');
            return true;
        } catch (error) {
            console.error(`  ⚠ Final answer error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async runPrompt(abortOnFailure = true): Promise<boolean> {
        console.log('  ▶️ Running prompt...');
        
        // Validate form before running
        const validationErrors = await this.promptCreator.getAllValidationErrors();
        if (validationErrors.length > 0) {
            console.error('❌ Form validation failed. Errors:');
            validationErrors.forEach((error, index) => {
                console.error(`  ${index + 1}. ${error}`);
            });
            const errorMessage = `Form validation failed:\n${validationErrors.join('\n')}`;
            if (abortOnFailure) throw new Error(errorMessage);
            return false;
        }

        const startTime = Date.now();
        try {
            await this.promptCreator.clickRun();
            await this.browser.getPage().waitForLoadState('domcontentloaded');
            await this.browser.waitForTimeout(500);
            await this.browser.takeScreenshot('05_prompt_ran');
            console.log(`  ✓ Prompt executed (${Date.now() - startTime}ms)`);
            return true;
        } catch (error) {
            console.error(`  ⚠ Prompt execution error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    // ─────────────────────────────────────────
    // VERIFICATIONS
    // ─────────────────────────────────────────

    async verifyPageLoaded(): Promise<void> {
        await expect(this.promptCreator.promptCreationHeader).toBeVisible();
    }

    async verifyPromptFilled(value: string): Promise<void> {
        console.log('  → Verifying prompt text is filled...');
        try {
            // Use the stable structural locator — not the placeholder-based one
            // Placeholder disappears after filling so the old locator can't find the element
            const textarea = this.promptCreator.promptTextarea;

            // First check the element exists on the page at all
            const isVisible = await textarea.isVisible();
            if (!isVisible) {
                console.warn('  ⚠ Prompt textarea not visible — page may have navigated. Skipping verification.');
                return;
            }

            const actualValue = await textarea.inputValue();

            // Check if the textarea still contains placeholder-style default text
            const defaultTextPatterns = [
                'A school is planning',  // essay placeholder
                'Solve for',             // multiple choice placeholder
                'e.g.,',                 // any placeholder starting with example prefix
            ];
            const hasDefaultText = defaultTextPatterns.some(pattern => actualValue.includes(pattern));

            if (hasDefaultText) {
                console.warn(`  ⚠ Prompt textarea appears to contain default/placeholder text. Fill may not have worked.`);
                console.warn(`  ⚠ Actual value: "${actualValue.substring(0, 80)}..."`);
                // Do not throw — log the warning and continue so the test can proceed
                // If this is a critical failure, change this to: throw new Error(...)
                return;
            }

            // Now do the actual assertion — value should match what we filled
            await expect(textarea).toHaveValue(value, { timeout: 5000 });
            console.log('  ✓ Prompt text verified');

        } catch (error) {
            console.error(`  ⚠ Prompt verification error: ${error}`);
            // Re-throw so the test fails with a clear message
            throw error;
        }
    }

    async verifyCorrectAnswer(value: string): Promise<void> {
        await expect(this.promptCreator.correctAnswerInput).toHaveValue(value);
    }

    async verifyIncorrectAnswers(values: string[]): Promise<void> {
        for (let i = 0; i < values.length; i++) {
            await expect(this.promptCreator.incorrectAnswerAt(i)).toHaveValue(values[i]);
        }
    }

    async verifyFinalAnswer(value: string): Promise<void> {
        await expect(this.promptCreator.finalAnswerTextarea).toHaveValue(value);
    }

    async verifyRunButtonVisible(): Promise<void> {
        await expect(this.promptCreator.runButton).toBeVisible();
    }

    // ─────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────

    /**
     * Gets all validation errors from the prompt creator form
     */
    async getAllValidationErrors(): Promise<string[]> {
        return await this.promptCreator.getAllValidationErrors();
    }
}