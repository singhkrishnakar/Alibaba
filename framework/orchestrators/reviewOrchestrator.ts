import { FormHandler, MetadataConfig } from "../services/formHandler";
import { BrowserManager } from "../browser/browserManager";
import { PromptTestData } from "../../data/promptData";
import { TestContext } from "../core/TestContext";

export class ReviewOrchestrator {

    private context: TestContext
    
        constructor(context: TestContext) {
            this.context = context
        }

    async submitReview(metadata: MetadataConfig) {

        const opened = await this.context.formHandler.clickSubmitToOpenReviewForm();

        if (!opened) {
            console.warn("Review form not opened");
        }

        await this.context.formHandler.fillMetadata(metadata);

        await this.context.formHandler.submitForm();

        await this.context.formHandler.waitForSubmissionConfirmation();

        await this.context.formHandler.waitForRedirectToCreationPage();
    }

    async reviewAndSubmit(testData: PromptTestData) {
        console.log('📝 Submitting Review and Metadata...');

        // Step 8: Click Submit to open "Review and Submit models" form
        const opened = await this.context.formHandler.clickSubmitToOpenReviewForm();
        if (!opened) {
            console.warn('⚠ Could not open Review form, trying to fill anyway...');
        }

        // Give UI time to render
        await this.context.browser.waitForTimeout(2000);
        await this.context.browser.takeScreenshot('09_review_form_opened');

        // Wait for "Final Answer" field to appear
        try {
            const page = this.context.browser.getPage();
            await page.waitForSelector('text=Final Answer', { timeout: 8000 }).catch(() => { });
        } catch {
            console.warn('⚠ Final Answer field not visible, proceeding anyway');
        }

        // Step 9: Fill metadata
        await this.context.formHandler.fillMetadata(testData.metadata);
        await this.context.browser.takeScreenshot('10_metadata_filled');

        // Step 11: Submit the form
        await this.context.formHandler.submitForm();
        await this.context.browser.takeScreenshot('12_form_submitted');

        // Wait for confirmation & redirect
        await this.context.formHandler.waitForSubmissionConfirmation();
        await this.context.formHandler.waitForRedirectToCreationPage();

        console.log('✅ Review and Submit completed');
    }
}