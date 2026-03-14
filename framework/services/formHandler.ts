// Form Handler - Fills and submits forms
import { BrowserManager } from '../browser/browserManager';

export interface MetadataConfig {
    finalAnswer: string;
    solutionProcess: string;
    thinkingProcess: string;
    keyPoints?: string;
    answerUnit?: string;
    noUnitRequired?: boolean;
    /** Custom Knowledge Point for "Enter key point" -> ADD flow */
    customKnowledgePoint?: string;
}

export class FormHandler {
    constructor(private browser: BrowserManager) { }


    /**
     * Fill the Review and Submit metadata form (Final Answer, Solution Process, Thinking Process, Answer Unit).
     */
    async fillMetadata(metadata: MetadataConfig): Promise<void> {
        const page = this.browser.getPage();
        try {
            console.log('📋 Filling Review and Submit metadata form...');
            const startTime = Date.now();

            // ---------- Final Answer ----------
            if (metadata.finalAnswer) {
                const success = await this.addFinalAnswer(metadata.finalAnswer);

                if (!success) {
                    throw new Error('❌ Mandatory field "Final Answer" not filled');
                }

                await this.browser.takeScreenshot('11_final_answer_added');
                await this.browser.waitForTimeout(800);
            }

            // ---------- Solution Process ----------
            if (metadata.solutionProcess) {
                const success = await this.addSolutionProcess(metadata.solutionProcess);

                if (!success) {
                    throw new Error('❌ Mandatory field "Solution Process" not filled');
                }

                await this.browser.takeScreenshot('12_solution_process_added');
                await this.browser.waitForTimeout(800);
            }

            // ---------- Thinking Process ----------
            if (metadata.thinkingProcess) {
                const success = await this.addThinkingProcess(metadata.thinkingProcess);

                if (!success) {
                    throw new Error('❌ Mandatory field "Thinking Process" not filled');
                }

                await this.browser.takeScreenshot('13_thinking_process_added');
                await this.browser.waitForTimeout(800);
            }

            // ---------- Answer Unit ----------
            if (metadata.answerUnit) {

                const checked = await this.checkNoUnitRequired();

                // Scroll element into view before screenshot
                await this.browser.getPage()
                    .locator('text=Answer Unit')
                    .scrollIntoViewIfNeeded();

                await this.browser.takeScreenshot('14_answer_unit_checked');

                if (!checked) {
                    throw new Error('❌ "No unit required" checkbox is not checked but it is mandatory');
                }

                await this.browser.waitForTimeout(800);
            }


            // ---------- Custom Knowledge Point ----------
            if (metadata.customKnowledgePoint) {
                const success = await this.addKnowledgePoint(metadata.customKnowledgePoint);

                if (!success) {
                    console.log('⚠ Knowledge point not added, continuing...');
                }

                await this.browser.takeScreenshot('15_custom_knowledge_point_added');
                await this.browser.waitForTimeout(1000);
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Metadata form filled successfully (${duration}ms)`);

        } catch (error) {
            console.error(`❌ Failed to fill metadata: ${error}`);
            throw error;
        }
    }

    /**
     * Fill a field by label text. Uses Playwright getByLabel for correct label-input association.
     * Searches within dialog first, then full page.
     */
    async fillField(fieldName: string, value: string): Promise<boolean> {
        try {
            const page = this.browser.getPage();

            const container = page.locator(`div.textAreaContainer:has(label:has-text("${fieldName}"))`).first();

            if (!(await container.count())) {
                console.log(`⚠ Field container not found: ${fieldName}`);
                return false;
            }

            const textarea = container.locator('textarea').first();

            if (!(await textarea.count())) {
                console.log(`⚠ Textarea not found for: ${fieldName}`);
                return false;
            }

            await textarea.scrollIntoViewIfNeeded();
            await textarea.fill(value);

            console.log(`✓ Filled field: ${fieldName}`);
            return true;

        } catch (error) {
            console.error(`✗ Error filling ${fieldName}:`, error);
            return false;
        }
    }


    /**
     * Add Final Answer: Enter Final Answer
     */
    async addFinalAnswer(finalAnswer: string): Promise<boolean> {
        console.log('📌 Adding Final Answer...');
        const filled = await this.fillField('Final Answer', finalAnswer);

        if (filled) {
            console.log('✓ Final Answer added');
        }

        return filled;
    }

    /**
     * Add Solution Process: Enter Solution Process
     */
    async addSolutionProcess(solutionProcess: string): Promise<boolean> {
        try {
            console.log('📌 Adding Solution Process...');
            const filled = await this.fillField('Solution Process', solutionProcess);
            if (filled) {
                console.log('  ✓ Solution Process added');
            }
            return filled;
        } catch (error) {
            console.error(`  ✗ Error adding Solution Process: ${error}`);
            return false;
        }
    }

    /**
     * Add Thinking Process: Enter Thinking Process
     */
    async addThinkingProcess(thinkingProcess: string): Promise<boolean> {
        try {
            console.log('📌 Adding Thinking Process...');
            const filled = await this.fillField('Thinking Process', thinkingProcess);
            if (filled) {
                console.log('  ✓ Thinking Process added');
            }
            return filled;
        } catch (error) {
            console.error(`  ✗ Error adding Thinking Process: ${error}`);
            return false;
        }
    }

    /**
     * Add custom Knowledge Point: Enter key point -> ADD -> enter text -> Save
     */
    /**
 * Add custom Knowledge Point: Enter key point -> ADD -> enter text -> Save
 */
    async addKnowledgePoint(customText: string): Promise<boolean> {
        try {
            console.log('📌 Adding custom Knowledge Point...');

            // Open "Enter key point"
            const enterKeyPointClicked = await this.browser.click(
                'span:has-text("Enter key point")',
                2000
            );

            if (!enterKeyPointClicked) {
                console.log('⚠ "Enter key point" control not found');
                return false;
            }

            // Old
            await this.browser.waitForTimeout(800);

            // Better
            //await page.locator('selector-of-element-after-wait').waitFor({ state: 'visible', timeout: 5000 });

            // Click ADD
            const addClicked = await this.browser.click(
                'button:has-text("Add")',
                2000
            );

            if (!addClicked) {
                console.log('⚠ ADD option not found in dropdown');
                return false;
            }

            await this.browser.waitForTimeout(600);

            // Fill knowledge point
            // let filled = await this.browser.fill(
            //     'input[placeholder*="Knowledge" i]',
            //     customText,
            //     2000
            // );

            // if (!filled) {
            //     filled =
            //         await this.browser.fillByLabel('Knowledge Point', customText, 2000) ||
            //         await this.browser.fillByLabel('Custom', customText, 2000);
            // }

            const filled =
                await this.browser.fillByLabel('Knowledge Point', customText, 2000) ||
                await this.browser.fillByLabel('Custom', customText, 2000);
            if (!filled) {
                console.log('⚠ Could not fill Knowledge Point input');
                return false;
            }

            await this.browser.waitForTimeout(500);

            // Try clicking Save
            let saveClicked = await this.browser.click(
                '[role="dialog"] button:has-text("Save")||button:has-text("Save")',
                1500
            );

            // If Save button not present, confirm using Enter
            if (!saveClicked) {
                await this.browser.pressKey('Enter');
                console.log('✓ Confirmed knowledge point with Enter');
            }

            await this.browser.waitForTimeout(800);

            // Close dropdown by clicking outside
            const page = this.browser.getPage();
            await page.mouse.click(10, 10);   // click top-left outside dropdown

            await this.browser.waitForTimeout(500);

            console.log('✓ Knowledge point added and dropdown closed');

            return true;

        } catch (error) {
            console.error(`✗ Error adding Knowledge Point: ${error}`);
            return false;
        }
    }

    /**
     * Check Answer Unit: check "does not require a unit" if applicable, to ensure submission can proceed without unit.
     */
    async checkNoUnitRequired(): Promise<boolean> {
        try {
            console.log('📌 Checking "No unit required"...');

            const page = this.browser.getPage();

            const option = page.locator('span:has-text("This answer does not require a unit")');

            const exists = await option.count();

            if (!exists) {
                console.log('⚠ "No unit required" option not found');
                return false;
            }

            await option.scrollIntoViewIfNeeded();

            await option.click();

            console.log('✓ Selected "This answer does not require a unit"');

            return true;

        } catch (error) {
            console.error(`✗ Error selecting "No unit required": ${error}`);
            return false;
        }
    }

    /**
     * Click the workbench Submit button to open the "Review and Submit models" form.
     */
    async clickSubmitToOpenReviewForm(): Promise<boolean> {
        try {
            console.log('📤 Clicking Submit to open Review and Submit form...');
            const clicked = await this.browser.click(
                'button:has-text("Submit")||button[type="submit"]:has-text("Submit")',
                3000
            );
            if (clicked) {
                await this.browser.waitForTimeout(2000);
                console.log('  ✓ Submit clicked, waiting for Review and Submit form...');
            }
            return clicked;
        } catch (error) {
            console.error(`  ✗ Failed to click Submit: ${error}`);
            return false;
        }
    }

    /**
    * Click the final Submit button on the Review and Submit form to complete submission.
    */
    async submitForm(): Promise<void> {
        try {
            console.log('📤 Submitting Review and Submit form...');

            const page = this.browser.getPage();

            const submitButton = page.locator(
                '#promptCreationReviewSubmitModal button:has-text("Submit")'
            );

            await submitButton.waitFor({ state: 'visible', timeout: 10000 });

            // click using DOM (avoids overlay intercept)
            await submitButton.evaluate((btn: HTMLElement) => btn.click());

            console.log('✓ Submit button clicked');

            // Wait for modal to close
            await page.waitForSelector('#promptCreationReviewSubmitModal', {
                state: 'detached',
                timeout: 15000
            });

            console.log('✓ Review form submitted successfully');

        } catch (error) {
            console.error(`❌ Form submission failed: ${error}`);
            throw error;
        }
    }

    /* checkif confirmation message appears after submission */
    async waitForSubmissionConfirmation(): Promise<void> {
        const page = this.browser.getPage();

        console.log('🔁 Waiting for submission confirmation message...');

        try {
            await page.waitForSelector('text=Prompt submitted successfully', { timeout: 15000 });
            console.log('  ✓ Confirmation message appeared');
        } catch {
            throw new Error('❌ Submission confirmation message did not appear within 15s');
        }
    }

    /* wait for redirect back to prompt creation page after submission */
    async waitForRedirectToCreationPage(): Promise<void> {
        const page = this.browser.getPage();

        console.log('🔁 Waiting for redirect to prompt creation workbench...');

        try {
            await page.waitForURL(/promptCreationWorkbench/, { timeout: 60000 });

            console.log('  ✓ Redirected to prompt creation workbench');
        } catch {
            const currentUrl = page.url();

            throw new Error(
                `❌ Page did not redirect to prompt creation workbench within 60s. Current URL: ${currentUrl}`
            );
        }
    }
}
