import { expect } from '@playwright/test';
import { TestContext } from '../core/TestContext';
import { BasePage } from './basePage';
import { FormFields } from './FormFields';  // ← same import, different root scope
import { Logger } from '../utils/Logger';

export class ReviewAndSubmitForm extends BasePage {
    private context: TestContext;

    /**
     * Shared form fields scoped to the modal container only.
     * Same FormFields class, different root — locators won't leak to page behind.
     */
    readonly fields: FormFields;

    constructor(context: TestContext) {
        super(context.browser);
        this.context = context;
        this.fields = new FormFields(
            this.page().locator('div.sc-2e6de984-4'),  // modal body only
            this.page()
        );
    }

    // ─────────────────────────────────────────
    // LOCATORS — unique to this modal only
    // ─────────────────────────────────────────

    get modal() {
        return this.page().locator('div.sc-2e6de984-1');
    }

    get modalTitle() {
        return this.page().locator('h5.sc-2e6de984-3');
    }

    get cancelButton() {
        return this.page().locator('div.sc-2e6de984-6 button.btn-tertiary');
    }

    get submitButton() {
        return this.page().locator('div.sc-2e6de984-6 button.btn-primary');
    }

    // ─────────────────────────────────────────
    // ACTIONS — unique to this modal only
    // ─────────────────────────────────────────

    async openModal(): Promise<void> {
        await this.modal.waitFor({ state: 'visible', timeout: 8000 });
        await this.context.browser.takeScreenshot('09_review_form_opened');
    }

    async submit(): Promise<void> {
        await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.submitButton.click();
        await this.context.browser.takeScreenshot('11_submitted');
    }

    async cancel(): Promise<void> {
        await this.cancelButton.click();
    }

    // ─────────────────────────────────────────
    // POST SUBMISSION WAITS
    // ─────────────────────────────────────────

    /**
     * Waits for the submission confirmation message to appear.
     * This message appears briefly after clicking Submit in the modal.
     * DevTools: document.querySelector('text=Prompt submitted successfully')
     */
    async waitForSubmissionConfirmation(): Promise<void> {
        Logger.info('  → Waiting for submission confirmation...');
        try {
            await this.page().waitForSelector(
                'text=Prompt submitted successfully',
                { timeout: 15000 }
            );
            Logger.info('  ✓ Submission confirmation appeared');
        } catch {
            throw new Error(
                '❌ Submission confirmation message did not appear within 15s'
            );
        }
    }

    /**
     * Waits for redirect back to prompt creation workbench after submission.
     * URL pattern: /promptCreationWorkbench/
     */
    async waitForRedirectToCreationPage(): Promise<void> {
        Logger.info('  → Waiting for redirect to prompt creation workbench...');
        try {
            await this.page().waitForURL(
                /promptCreationWorkbench/,
                { timeout: 60000 }
            );
            Logger.info('  ✓ Redirected to prompt creation workbench');
        } catch {
            const currentUrl = this.page().url();
            throw new Error(
                `❌ Page did not redirect to prompt creation workbench within 60s.\n` +
                `   Current URL: ${currentUrl}`
            );
        }
    }

    async waitForCompletion(): Promise<void> {
        // Step 1 — confirmation message appears briefly
        await this.waitForSubmissionConfirmation();

        // Step 2 — modal closes
        await this.modal.waitFor({ state: 'hidden', timeout: 15000 });

        // Step 3 — page redirects back to workbench
        await this.waitForRedirectToCreationPage();
    }
}