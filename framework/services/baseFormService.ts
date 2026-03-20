import { expect, Locator } from '@playwright/test';
import { BrowserManager } from '../browser/browserManager';
import { PromptTestData } from '../../types/promptTestData.type';
import { Logger } from '../utils/Logger';

export abstract class BaseFormService {

    constructor(protected browser: BrowserManager) { }

    protected abstract getFormPage(): { fields: import('../pages/FormFields').FormFields };

    // ─────────────────────────────────────────
    // GENERIC SMART FILL HELPER
    // Checks if field already has a value before filling.
    // If prefilled with correct value → skip (review form scenario).
    // If empty or different → fill.
    // ─────────────────────────────────────────

    /**
     * Fills a textarea only if it is empty or contains a different value.
     * This handles both:
     *   - Prompt creation page: field is empty → always fills
     *   - Review & Submit modal: field is prefilled → skips if value matches,
     *     fills if value differs (user edited data scenario)
     *
     * @param locator   - The textarea locator to check and fill
     * @param value     - The expected value to fill
     * @param fieldName - Human readable name for logging
     */
    protected async smartFill(
        locator: Locator,
        value: string,
        fieldName: string
    ): Promise<void> {
        // Guard — if no value provided in test data, skip entirely
        if (!value) {
            console.log(`  ℹ ${fieldName}: no value in test data, skipping`);
            return;
        }

        await locator.waitFor({ state: 'visible', timeout: 10000 });

        const currentValue = await locator.inputValue();

        if (currentValue === value) {
            // Field is already prefilled with exact correct value — skip
            console.log(`  ✓ ${fieldName}: already prefilled correctly, skipping`);
            return;
        }

        if (currentValue && currentValue !== value) {
            // Field has a different value — log it and overwrite
            console.log(`  ↻ ${fieldName}: prefilled with different value, overwriting`);
            console.log(`    Was: "${currentValue.substring(0, 60)}..."`);
            console.log(`    Now: "${value.substring(0, 60)}..."`);
        } else {
            // Field is empty — normal fill
            console.log(`  → ${fieldName}: filling...`);
        }

        await locator.clear();
        await locator.fill(value);
        console.log(`  ✓ ${fieldName}: filled`);
    }

    // ─────────────────────────────────────────
    // SHARED FILL METHODS — all use smartFill
    // ─────────────────────────────────────────

    // async fillFinalAnswer(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
    //     try {
    //         await this.smartFill(
    //             this.getFormPage().fields.finalAnswerTextarea,
    //             testData.metadata.finalAnswer,
    //             'Final Answer'
    //         );
    //         return true;
    //     } catch (error) {
    //         console.error(`  ⚠ Final answer error: ${error}`);
    //         if (abortOnFailure) throw error;
    //         return false;
    //     }
    // }

    async fillSolutionProcess(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        try {
            await this.smartFill(
                this.getFormPage().fields.solutionProcessTextarea,
                testData.metadata.solutionProcess,
                'Solution Process'
            );
            return true;
        } catch (error) {
            console.error(`  ⚠ Solution process error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillThinkingProcess(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        try {
            await this.smartFill(
                this.getFormPage().fields.thinkingProcessTextarea,
                testData.metadata.thinkingProcess,
                'Thinking Process'
            );
            return true;
        } catch (error) {
            console.error(`  ⚠ Thinking process error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillAnswerUnit(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        try {
            if (!testData.metadata.answerUnit) {
                // Check if no-unit checkbox is already checked before clicking
                const label = this.getFormPage().fields.noUnitLabel;
                const isChecked = await label.evaluate(
                    el => el.closest('label')
                        ?.previousElementSibling instanceof HTMLInputElement
                        && (el.closest('label')?.previousElementSibling as HTMLInputElement).checked
                );
                if (isChecked) {
                    console.log('  ✓ No unit: already checked, skipping');
                } else {
                    await label.click();
                    console.log('  ✓ No unit: checked');
                }
            } else {
                await this.smartFill(
                    this.getFormPage().fields.answerUnitTextarea,
                    testData.metadata.answerUnit,
                    'Answer Unit'
                );
            }
            return true;
        } catch (error) {
            console.error(`  ⚠ Answer unit error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async setEducationLevel(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        try {
            const fields = this.getFormPage().fields;

            // Check current selected value before interacting with dropdown
            const currentValue = await fields.levelDropdownInput.inputValue();
            const container = fields.levelDropdownInput
                .locator('xpath=ancestor::div[contains(@class,"css-b62m3t-container")]')
                .locator('div.css-1dimb5e-singleValue');

            // React Select shows selected value in singleValue div, not in the input itself
            const selectedText = await container.isVisible()
                ? await container.textContent()
                : '';

            if (selectedText?.trim() === testData.metadata.level) {
                console.log(`  ✓ Level: already set to "${testData.metadata.level}", skipping`);
                return true;
            }

            console.log(`  → Level: selecting "${testData.metadata.level}"...`);
            await fields.selectLevel(testData.metadata.level);
            console.log(`  ✓ Level: set to "${testData.metadata.level}"`);
            return true;
        } catch (error) {
            console.error(`  ⚠ Education level error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async setDiscipline(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        try {
            const fields = this.getFormPage().fields;

            // Same pattern as level — check singleValue div for current selection
            const container = fields.disciplineDropdownInput
                .locator('xpath=ancestor::div[contains(@class,"css-b62m3t-container")]')
                .locator('div.css-1dimb5e-singleValue');

            const selectedText = await container.isVisible()
                ? await container.textContent()
                : '';

            if (selectedText?.trim() === testData.metadata.discipline) {
                console.log(`  ✓ Discipline: already set to "${testData.metadata.discipline}", skipping`);
                return true;
            }

            console.log(`  → Discipline: selecting "${testData.metadata.discipline}"...`);
            await fields.selectDiscipline(testData.metadata.discipline);
            console.log(`  ✓ Discipline: set to "${testData.metadata.discipline}"`);
            return true;
        } catch (error) {
            console.error(`  ⚠ Discipline error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillKeyPoints(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        try {
            if (!testData.metadata.knowledgePoints?.length) {
                console.log('  ℹ Key points: none in test data, skipping');
                return true;
            }

            // Check existing chips — don't re-add what is already there
            const fields = this.getFormPage().fields;
            const existingChips = await fields.keyPointsClickArea
                .locator('div.sc-c9e57cf2-3 span')
                .allTextContents();
            const existingTrimmed = existingChips.map(c => c.trim());

            for (const keyPoint of testData.metadata.knowledgePoints) {
                if (existingTrimmed.includes(keyPoint.trim())) {
                    console.log(`  ✓ Key point: "${keyPoint}" already added, skipping`);
                    continue;
                }
                await fields.addKeyPoint(keyPoint);
                console.log(`  ✓ Key point: "${keyPoint}" added`);
            }
            return true;
        } catch (error) {
            console.error(`  ⚠ Key points error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    // ─────────────────────────────────────────
    // FILL ALL SHARED — single call for orchestrators
    // ─────────────────────────────────────────

    async fillSharedFields(testData: PromptTestData, abortOnFailure = true): Promise<void> {
        await this.fillAnswerUnit(testData, abortOnFailure);
        await this.fillSolutionProcess(testData, abortOnFailure);
        await this.fillThinkingProcess(testData, abortOnFailure);
        await this.fillKeyPoints(testData, abortOnFailure);
        await this.setEducationLevel(testData, abortOnFailure);
        await this.setDiscipline(testData, abortOnFailure);
    }

    // ─────────────────────────────────────────
    // SHARED VERIFICATIONS
    // ─────────────────────────────────────────

    async verifyFinalAnswer(value: string): Promise<void> {
        await expect(this.getFormPage().fields.finalAnswerTextarea).toHaveValue(value);
    }

    async verifySolutionProcess(value: string): Promise<void> {
        await expect(this.getFormPage().fields.solutionProcessTextarea).toHaveValue(value);
    }

    async verifyThinkingProcess(value: string): Promise<void> {
        await expect(this.getFormPage().fields.thinkingProcessTextarea).toHaveValue(value);
    }


    async fillFinalAnswer(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        // Type guard — only call this for essay type
        if (testData.metadata.questionType !== 'essay') {
            console.log('  ℹ Final answer: not applicable for this question type, skipping');
            return true;
        }
        try {
            // TypeScript now knows finalAnswer exists — no type error
            await this.smartFill(
                this.getFormPage().fields.finalAnswerTextarea,
                testData.metadata.finalAnswer,
                'Final Answer'
            );
            return true;
        } catch (error) {
            console.error(`  ⚠ Final answer error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async fillCorrectAnswer(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        // Type guard — only call this for multiple choice
        if (testData.metadata.questionType !== 'multipleChoice') {
            console.log('  ℹ Correct answer: not applicable for this question type, skipping');
            return true;
        }
        try {
            // TypeScript now knows correctAnswer exists — no type error
            await this.getFormPage().fields.fillCorrectAnswer(testData.metadata.correctAnswer);
            return true;
        } catch (error) {
            console.error(`  ⚠ Correct answer error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }
}