import { expect } from '@playwright/test';
import { BrowserManager } from '../browser/browserManager';
import { ReviewAndSubmitForm } from '../pages/reviewAndSubmitForm';
import { PromptTestData } from '../../types/promptTestData.type';
import { BaseFormService } from './baseFormService';
import { FormFields } from '../pages/FormFields';
import { Logger } from '../utils/Logger';

export class ReviewFormService extends BaseFormService {

    constructor(
        browser: BrowserManager,
        private reviewForm: ReviewAndSubmitForm
    ) {
        super(browser);
    }

    // Required by BaseFormService — returns page with .fields scoped to modal
    protected getFormPage(): { fields: FormFields } {
        return this.reviewForm;
    }

    // ─────────────────────────────────────────
    // CORE ORCHESTRATION
    // ─────────────────────────────────────────

    async reviewAndSubmit(testData: PromptTestData, abortOnFailure = true): Promise<void> {
        Logger.info('📋 Starting Review and Submit...');
        const startTime = Date.now();

        try {
            await this.reviewForm.openModal();

            // All shared fields via BaseFormService — scoped to modal automatically
            await this.fillSharedFields(testData, abortOnFailure);
            await this.fillFinalAnswer(testData, abortOnFailure);

            await this.reviewForm.submit();
            await this.reviewForm.waitForCompletion();

            Logger.info(`✅ Review completed (${Date.now() - startTime}ms)`);
        } catch (error) {
            Logger.error(`⚠ Review and submit error: ${error}`);
            throw error;
        }
    }

    // ─────────────────────────────────────────
    // VERIFICATIONS — review form specific
    // Verifies data is PRE-FILLED correctly from prompt creation step
    // ─────────────────────────────────────────

    async verifyAllFieldsPrefilled(testData: PromptTestData): Promise<void> {
        Logger.info('  → Verifying review form pre-filled data...');

        // Final Answer — essay only
        if (testData.metadata.questionType === 'essay') {
            await this.verifyFinalAnswer(testData.metadata.finalAnswer);
        }

        // These are shared across both question types
        await this.verifySolutionProcess(testData.metadata.solutionProcess);
        await this.verifyThinkingProcess(testData.metadata.thinkingProcess);

        Logger.info('  ✓ All fields verified as pre-filled');
    }
    async verifyModalTitle(): Promise<void> {
        await expect(this.reviewForm.modalTitle).toHaveText('Review and Submit');
    }
}