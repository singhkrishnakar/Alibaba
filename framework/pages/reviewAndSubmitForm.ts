import { expect } from '@playwright/test';
import { TestContext } from '../core/TestContext';
import { BasePage } from './basePage';
import { FormFields } from './FormFields';  // ← same import, different root scope

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
        await this.context.browser.getPage()
            .locator('button:has-text("Submit")')
            .click();
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

    async waitForCompletion(): Promise<void> {
        await this.modal.waitFor({ state: 'hidden', timeout: 15000 });
    }
}