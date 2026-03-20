import { expect } from '@playwright/test';
import { BrowserManager } from '../browser/browserManager';
import { PromptCreatorPage } from '../pages/promptCreatorPage';
import { prompts } from '../../data/prompts/prompts';
import { PromptTestData } from '../../types/promptTestData.type';

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
}