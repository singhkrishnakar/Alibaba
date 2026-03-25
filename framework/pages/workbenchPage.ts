import * as fs from 'fs';
import { Locator } from '@playwright/test';
import { BasePage } from './basePage';
import { TestContext } from '../core/TestContext';

export class WorkbenchPage extends BasePage {
    private context: TestContext;

    constructor(context: TestContext) {
        super(context.browser);
        this.context = context;
    }

    // ─────────────────────────────────────────
    // PAGE HEADER LOCATORS
    // ─────────────────────────────────────────

    /**
     * Back arrow button — top left of workbench.
     * DevTools: document.querySelector('button:has(svg[data-testid="ArrowBackIcon"])')
     */
    get backButton() {
        return this.page().locator('button:has(svg[data-testid="ArrowBackIcon"])');
    }

    /**
     * Save as Draft button.
     * DevTools: document.querySelector('button:has(svg[data-testid="DraftsIcon"])')
     */
    get saveAsDraftButton() {
        return this.page().locator('button:has(svg[data-testid="DraftsIcon"])');
    }

    /**
     * Rewrite Prompt button.
     * DevTools: document.querySelector('button:has(svg[data-testid="EditIcon"])')
     */
    /**
     * Rewrite Prompt button — navigates back to prompt creation page with data prepopulated.
     * Stable: anchored on EditIcon data-testid + button role.
     * DevTools: document.querySelector('button:has(svg[data-testid="EditIcon"])')
     */
    get rewritePromptButton() {
        return this.page().locator('button:has(svg[data-testid="EditIcon"])');
    }

    /**
     * Response counter text — e.g. "15 response(s) out of 15".
     * DevTools: [...document.querySelectorAll('div')].find(d => d.textContent?.includes('response(s) out of'))
     */
    get responseCounterText() {
        return this.page().locator('div', { hasText: /\d+ response\(s\) out of \d+/ }).last();
    }

    /**
     * Frontier button — enabled only after all base responses are marked.
     * DevTools: document.querySelector('button:has-text("Test on Frontier Models")')
     */
    get frontierButton() {
        return this.page().locator('button:has-text("Test on Frontier Models")');
    }

    /**
     * Submit button — enabled only after all frontier responses are marked.
     * DevTools: document.querySelector('button:has-text("Submit")')
     */
    get submitButton() {
        return this.page().getByRole('button', { name: 'Submit Task', exact: true });
    }

    // ─────────────────────────────────────────
    // PROMPT DISPLAY
    // ─────────────────────────────────────────

    /**
     * The prompt text shown at top of workbench.
     * DevTools: document.querySelector('div.sc-6e40ec64-9 p')
     */
    get promptDisplay() {
        return this.page().locator('div.sc-6e40ec64-9 p');
    }


    baseRadioGroup(nameIndex: number) {
        return this.page().locator(
            `div.sc-6e40ec64-19:has(input[name="response-original-${nameIndex}"])`
        );
    }

    frontierRadioGroup(nameIndex: number) {
        return this.page().locator(
            `div.sc-6e40ec64-19:has(input[name="response-frontier-${nameIndex}"])`
        );
    }

    // ─────────────────────────────────────────
    // RESPONSE CONTENT LOCATORS
    // ─────────────────────────────────────────

    /**
     * Preview text span for a specific response wrapper.
     * Shows truncated text — full text needs View Complete Response.
     * DevTools: document.querySelector('div.sc-6e40ec64-22.bkcbqC span')
     *
     * TODO: if sc-6e40ec64-22 class changes, use structural fallback:
     * div.sc-6e40ec64-18 div span (response text span inside wrapper)
     */
    responsePreviewText(wrapperLocator: Locator) {
        return wrapperLocator.locator('div.sc-6e40ec64-22.bkcbqC span');
    }

    /**
     * View Complete Response button inside a specific response wrapper.
     * Stable: uses semantic class view-complete-response-button.
     * DevTools: document.querySelector('button.view-complete-response-button')
     */
    viewCompleteResponseBtn(wrapperLocator: Locator) {
        return wrapperLocator.locator('button.view-complete-response-button');
    }

    /**
     * All View Complete Response buttons on the page.
     * DevTools: document.querySelectorAll('button.view-complete-response-button').length
     */
    get allViewCompleteResponseButtons() {
        return this.page().locator('button.view-complete-response-button');
    }

    // ─────────────────────────────────────────
    // COMPLETE RESPONSE MODAL LOCATORS
    // ─────────────────────────────────────────

    /**
     * Complete Response modal container.
     * Stable: uses id="complete-response-modal".
     * DevTools: document.querySelector('#complete-response-modal')
     */
    get completeResponseModal() {
        return this.page().locator('#complete-response-modal');
    }

    /**
     * Full response content inside the modal.
     * Stable: uses semantic class complete-response-modal-content.
     * DevTools: document.querySelector('div.complete-response-modal-content')
     */
    get completeResponseModalContent() {
        return this.page().locator('div.complete-response-modal-content');
    }

    /**
     * Modal title — always "Complete Response".
     * DevTools: document.querySelector('#complete-response-modal h5')
     */
    get completeResponseModalTitle() {
        return this.completeResponseModal.locator('h5');
    }

    /**
     * Close button inside the Complete Response modal.
     * Scoped to modal to avoid conflict with other btn-primary buttons on page.
     * DevTools: document.querySelector('#complete-response-modal button.btn-primary')
     */
    get completeResponseModalCloseButton() {
        return this.completeResponseModal.locator('button.btn-primary');
    }
    // ─────────────────────────────────────────
    // BASE MODEL RESPONSES
    // Radio names follow pattern: response-original-N
    // DevTools: document.querySelectorAll('input[name^="response-original-"]')
    // ─────────────────────────────────────────

    /**
     * All base model response wrapper divs.
     * Each wrapper contains: response text + Correct/Incorrect radio pair.
     */
    get baseResponseWrappers() {
        return this.page().locator('div.sc-dd6c7092-1.modelResponseAccordionItem div.sc-6e40ec64-18');
    }

    /**
     * All base model Correct radio buttons.
     * DevTools: document.querySelectorAll('input[name^="response-original-"]')
     *           then filter for Correct label
     */
    get baseCorrectRadios() {
        return this.page().locator(
            'input[name^="response-original-"] + label span:has-text("Correct")'
        ).locator('..');
    }

    /**
     * All base model Incorrect radio buttons.
     */
    get baseIncorrectRadios() {
        return this.page().locator(
            'input[name^="response-original-"]'
        ).filter({
            has: this.page().locator('~ label span:has-text("Incorrect")')
        });
    }

    /**
     * Get Correct radio for a specific base response by its name index.
     * name="response-original-N" — N comes from the DOM.
     * DevTools: document.querySelector('input[name="response-original-2"]')
     */
    baseResponseCorrectRadio(nameIndex: number) {
        return this.page().locator(
            `div:has(input[name="response-original-${nameIndex}"]) span:has-text("Correct")`
        ).locator('xpath=ancestor::div[contains(@class,"sc-cf44095c-1")]//input');
    }

    baseResponseIncorrectRadio(nameIndex: number) {
        return this.page().locator(
            `div:has(input[name="response-original-${nameIndex}"]) span:has-text("Incorrect")`
        ).locator('xpath=ancestor::div[contains(@class,"sc-cf44095c-1")]//input');
    }

    /**
     * Correct label for a base response — click label not hidden input.
     * This is the safe pattern for styled radio buttons.
     */
    baseResponseCorrectLabel(nameIndex: number) {
        return this.page().locator(`input[name="response-original-${nameIndex}"]`)
            .filter({ has: this.page().locator('~ label span:has-text("Correct")') })
            .locator('~ label');
    }

    baseResponseIncorrectLabel(nameIndex: number) {
        return this.page().locator(`input[name="response-original-${nameIndex}"]`)
            .locator('xpath=following-sibling::label[.//span[text()="Incorrect"]]');
    }

    /**
     * Base model accordion header — contains model name in first span.
     * DevTools: document.querySelector('div.modelResponseAccordionHeader span:first-child')
     *
     * TODO: if generated class sc-dd6c7092-2 changes, use semantic class only:
     * div.modelResponseAccordionHeader span:first-child
     */
    get baseModelAccordionHeaders() {
        return this.page().locator(
            'div.modelResponseAccordionHeader:not(.frontierModelResponseAccordionHeader) span:first-child'
        );
    }

    // ─────────────────────────────────────────
    // FRONTIER MODEL RESPONSES
    // Radio names follow pattern: response-frontier-N
    // DevTools: document.querySelectorAll('input[name^="response-frontier-"]')
    // ─────────────────────────────────────────

    /**
     * All frontier model accordion items — one per model (e.g. gemini-2.5-pro, o4-mini).
     * DevTools: document.querySelectorAll('div.frontierModelResponseAccordionItem')
     */
    get frontierAccordions() {
        return this.page().locator('div.frontierModelResponseAccordionItem');
    }

    /**
     * Frontier accordion by model name.
     * DevTools: document.querySelector('div.frontierModelResponseAccordionItem.gemini-2\\.5-pro')
     */
    frontierAccordionByModel(modelName: string) {
        return this.page().locator(`div.frontierModelResponseAccordionItem.${CSS.escape(modelName)}`);
    }

    /**
     * Frontier model accordion header — contains model name in first span.
     * DevTools: document.querySelector('div.frontierModelResponseAccordionHeader span:first-child')
     *
     * TODO: verify class name frontierModelResponseAccordionHeader is stable
     */
    get frontierModelAccordionHeaders() {
        return this.page().locator(
            'div.frontierModelResponseAccordionHeader span:first-child'
        );
    }

    /**
     * All frontier response wrappers across all models.
     * DevTools: document.querySelectorAll('div.frontierModelResponseAccordionItem div.sc-6e40ec64-18')
     */
    get frontierResponseWrappers() {
        return this.page().locator(
            'div.frontierModelResponseAccordionItem div.sc-6e40ec64-18'
        );
    }

    /**
     * Frontier Correct label by radio name index.
     */
    frontierCorrectLabel(nameIndex: number) {
        return this.page()
            .locator(`input[name="response-frontier-${nameIndex}"]`)
            .locator('xpath=following-sibling::label[.//span[text()="Correct"]]');
    }

    frontierIncorrectLabel(nameIndex: number) {
        return this.page()
            .locator(`input[name="response-frontier-${nameIndex}"]`)
            .locator('xpath=following-sibling::label[.//span[text()="Incorrect"]]');
    }

    // ─────────────────────────────────────────
    // SHARED RESPONSE LOCATORS
    // ─────────────────────────────────────────

    /**
     * All response text spans — both base and frontier.
     * DevTools: document.querySelectorAll('div.sc-6e40ec64-22 span')
     */
    get allResponseTextSpans() {
        return this.page().locator('div.sc-6e40ec64-22.bkcbqC span');
    }

    /**
     * View Complete Response button on a specific response wrapper.
     */
    viewCompleteResponseButton(wrapperLocator: Locator) {
        return wrapperLocator.locator('button.view-complete-response-button');
    }

    // ─────────────────────────────────────────
    // RETRY BUTTON LOCATORS
    // Anchor: svg[data-testid="ModelTrainingIcon"]
    // States distinguished by style attributes:
    //   Idle:     cursor:pointer, opacity:1, pointer-events:auto
    //   Retrying: cursor:not-allowed, opacity:0.6, animation contains rotateIcon
    //
    // TODO: if data-testid="ModelTrainingIcon" is removed, fall back to:
    // div.sc-6e40ec64-15 div.css-1tx6twl svg (retry icon inside marking question row)
    // ─────────────────────────────────────────

    /**
     * All retry button SVGs on the page — both base and frontier responses.
     * DevTools: document.querySelectorAll('svg[data-testid="ModelTrainingIcon"]').length
     */
    get allRetryButtons() {
        return this.page().locator('svg[data-testid="ModelTrainingIcon"]');
    }

    /**
     * All retry buttons that are in idle/clickable state.
     * Identified by cursor:pointer and pointer-events:auto in inline style.
     * DevTools:
     * [...document.querySelectorAll('svg[data-testid="ModelTrainingIcon"]')]
     *   .filter(el => el.style.cursor === 'pointer').length
     */
    get idleRetryButtons() {
        return this.page().locator(
            'svg[data-testid="ModelTrainingIcon"][style*="cursor: pointer"]'
        );
    }

    /**
     * All retry buttons currently in retrying/spinning state.
     * Identified by animation containing rotateIcon in inline style.
     * DevTools:
     * [...document.querySelectorAll('svg[data-testid="ModelTrainingIcon"]')]
     *   .filter(el => el.style.animation?.includes('rotateIcon')).length
     */
    get spinningRetryButtons() {
        return this.page().locator(
            'svg[data-testid="ModelTrainingIcon"][style*="rotateIcon"]'
        );
    }

    /**
     * Retry button for a specific base response by name index.
     * Scoped to the marking question container of that specific response.
     * DevTools:
     * document.querySelector(
     *   'div.sc-6e40ec64-15:has(input[name="response-original-1"]) svg[data-testid="ModelTrainingIcon"]'
     * )
     *
     * TODO: if sc-6e40ec64-15 class changes, use:
     * div:has(input[name="response-original-N"]) svg[data-testid="ModelTrainingIcon"]
     */
    retryButtonForBaseResponse(nameIndex: number) {
        return this.page().locator(
            `div.sc-6e40ec64-15:has(input[name="response-original-${nameIndex}"]) ` +
            `svg[data-testid="ModelTrainingIcon"]`
        );
    }

    /**
     * Retry button for a specific frontier response by name index.
     * DevTools:
     * document.querySelector(
     *   'div.sc-6e40ec64-15:has(input[name="response-frontier-6"]) svg[data-testid="ModelTrainingIcon"]'
     * )
     */
    retryButtonForFrontierResponse(nameIndex: number) {
        return this.page().locator(
            `div.sc-6e40ec64-15:has(input[name="response-frontier-${nameIndex}"]) ` +
            `svg[data-testid="ModelTrainingIcon"]`
        );
    }


    // ─────────────────────────────────────────
    // TOAST / NOTIFICATION LOCATORS
    // ─────────────────────────────────────────

    /**
     * Toast notification container.
     * DevTools: document.querySelector('div.css-gil301')
     *
     * TODO: if css-gil301 class changes, use:
     * div:has(svg[data-testid="ErrorOutlineOutlinedIcon"]):has(div[class*="1ebqas8"])
     */
    get errorToast() {
        return this.page().locator('div.css-gil301');
    }

    /**
     * Toast error message text.
     * DevTools: document.querySelector('div.css-1ebqas8')?.textContent
     *
     * TODO: if class changes, use:
     * div.css-gil301 div[class*="ebqas"]
     */
    get errorToastMessage() {
        return this.page().locator('div.css-1ebqas8');
    }

    /**
     * Toast close button.
     * Stable: anchored on CloseOutlinedIcon data-testid.
     * DevTools: document.querySelector('div.css-gil301 svg[data-testid="CloseOutlinedIcon"]')
     */
    get errorToastCloseButton() {
        return this.errorToast.locator('svg[data-testid="CloseOutlinedIcon"]');
    }

    // ─────────────────────────────────────────
    // ACTIONS — Page level
    // ─────────────────────────────────────────

    async clickBack(): Promise<void> {
        await this.backButton.click();
    }

    async clickSaveAsDraft(): Promise<void> {
        await this.saveAsDraftButton.click();
    }

    async clickRewritePrompt(): Promise<void> {
        console.log('  → Clicking Rewrite Prompt...');
        await this.rewritePromptButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.rewritePromptButton.click();
        console.log('  ✓ Rewrite Prompt clicked');
    }

    async clickFrontierButton(): Promise<void> {
        await this.frontierButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.frontierButton.click();
    }

    async clickSubmit(): Promise<void> {
        await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.submitButton.click();
    }

    /**
     * Get model name span by exact text — works for both base and frontier.
     * DevTools: document.querySelector('div.modelResponseAccordionHeader span:first-child')
     *
     * TODO: if accordion header classes change, fall back to:
     * [...document.querySelectorAll('div[class*="AccordionHeader"] span')]
     *   .find(s => s.textContent?.trim() === modelName)
     */
    modelNameSpan(modelName: string) {
        return this.page().locator(
            'div[class*="AccordionHeader"] span:first-child'
        ).filter({ hasText: modelName });
    }

    /**
     * Verifies a model name is visible in any accordion header.
     * Works for both base and frontier models.
     *
     * @param expectedModelName - exact model name string e.g. "qwen3-235b-a22b-thinking-2507"
     *
     * DevTools verify:
     * [...document.querySelectorAll('div[class*="AccordionHeader"] span:first-child')]
     *   .find(s => s.textContent?.trim() === 'qwen3-235b-a22b-thinking-2507')
     */
    async verifyModelName(expectedModelName: string): Promise<boolean> {
        console.log(`  → Verifying model name: "${expectedModelName}"...`);

        const found = await this.page().evaluate((modelName: string) => {
            /**
             * Target: first span inside any div with AccordionHeader in class name.
             * Both base and frontier headers follow this pattern.
             *
             * TODO: if this selector is too broad, narrow to:
             * Base only:     div.modelResponseAccordionHeader span:first-child
             * Frontier only: div.frontierModelResponseAccordionHeader span:first-child
             */
            const spans = Array.from(
                document.querySelectorAll('div[class*="AccordionHeader"] span:first-child')
            );
            return spans.some(span => span.textContent?.trim() === modelName);
        }, expectedModelName);

        if (found) {
            console.log(`  ✓ Model name found: "${expectedModelName}"`);
        } else {
            console.warn(`  ⚠ Model name NOT found: "${expectedModelName}"`);
        }

        return found;
    }

    // ─────────────────────────────────────────
    // ACTIONS — Base response marking
    // The radio buttons use styled labels — always click the LABEL not the input
    // This is same as Selenium clicking the visible element, not the hidden input
    // ─────────────────────────────────────────

    /**
     * Mark a base response by its name index (from DOM: name="response-original-N").
     * status: 'Correct' | 'Incorrect'
     */
    async markBaseResponse(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<void> {
        console.log(`  → Marking base response ${nameIndex} as ${status}`);
        await this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-original-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) {
                        (parent?.querySelector('label span') as HTMLElement)?.click();
                        return;
                    }
                }
            },
            { nameIndex, status }
        );
        console.log(`  ✓ Base response ${nameIndex} marked as ${status}`);
    }

    /**
     * Mark a frontier response by its name index (from DOM: name="response-frontier-N").
     */
    async markFrontierResponse(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<void> {
        console.log(`  → Marking frontier response ${nameIndex} as ${status}`);
        await this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-frontier-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) {
                        (parent?.querySelector('label span') as HTMLElement)?.click();
                        return;
                    }
                }
            },
            { nameIndex, status }
        );
        console.log(`  ✓ Frontier response ${nameIndex} marked as ${status}`);
    }


    // Use these for verification — check which radio is checked in the group
    async isBaseResponseMarkedAs(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<boolean> {
        return this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-original-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) return input.checked;
                }
                return false;
            },
            { nameIndex, status }
        );
    }

    async isFrontierResponseMarkedAs(nameIndex: number, status: 'Correct' | 'Incorrect'): Promise<boolean> {
        return this.page().evaluate(
            ({ nameIndex, status }) => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    `input[name="response-frontier-${nameIndex}"]`
                ));
                for (const input of inputs) {
                    const parent = input.parentElement;
                    const labelText = parent?.querySelector('label span')?.textContent?.trim();
                    if (labelText === status) return input.checked;
                }
                return false;
            },
            { nameIndex, status }
        );
    }

    //ACTION- Shared Actions

    // ─────────────────────────────────────────
    // RETRY BUTTON ACTIONS
    // ─────────────────────────────────────────

    /**
     * Verifies retry button is present for every response.
     * Count of retry buttons must match expectedCount.
     *
     * @param expectedCount - total responses expected on page
     *
     * DevTools verify:
     * document.querySelectorAll('svg[data-testid="ModelTrainingIcon"]').length
     */
    async verifyRetryButtonPresentForEachResponse(expectedCount: number): Promise<boolean> {
        console.log(`  → Verifying retry button present for ${expectedCount} responses...`);

        const actualCount = await this.allRetryButtons.count();

        if (actualCount !== expectedCount) {
            console.warn(
                `  ⚠ Retry button count mismatch.\n` +
                `    Expected: ${expectedCount}\n` +
                `    Found:    ${actualCount}`
            );
            return false;
        }

        console.log(`  ✓ Retry button present for all ${expectedCount} responses`);
        return true;
    }

    /**
     * Verifies retry button for a specific response is in idle/clickable state.
     * Idle = cursor:pointer, opacity:1, pointer-events:auto, no rotation animation.
     *
     * @param nameIndex - radio name index e.g. 1 for response-original-1
     * @param type      - 'base' or 'frontier'
     */
    async verifyRetryButtonIdle(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base'
    ): Promise<boolean> {
        const btn = type === 'base'
            ? this.retryButtonForBaseResponse(nameIndex)
            : this.retryButtonForFrontierResponse(nameIndex);

        const isIdle = await btn.evaluate((el: SVGElement) => {
            const style = el.getAttribute('style') ?? '';
            return (
                style.includes('cursor: pointer') &&
                style.includes('opacity: 1') &&
                style.includes('pointer-events: auto') &&
                !style.includes('rotateIcon')
            );
        });

        if (isIdle) {
            console.log(`  ✓ Retry button for ${type} response ${nameIndex} is idle/clickable`);
        } else {
            console.warn(`  ⚠ Retry button for ${type} response ${nameIndex} is NOT idle`);
        }

        return isIdle;
    }

    /**
     * Clicks the retry button for a specific response.
     * Only clicks if button is in idle state — throws if already spinning.
     *
     * @param nameIndex - radio name index
     * @param type      - 'base' or 'frontier'
     */
    async clickRetryButton(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base'
    ): Promise<void> {
        console.log(`  → Clicking retry for ${type} response ${nameIndex}...`);

        const btn = type === 'base'
            ? this.retryButtonForBaseResponse(nameIndex)
            : this.retryButtonForFrontierResponse(nameIndex);

        await btn.waitFor({ state: 'visible', timeout: 5000 });

        // Verify button is clickable before attempting click
        const isIdle = await this.verifyRetryButtonIdle(nameIndex, type);
        if (!isIdle) {
            throw new Error(
                `Cannot click retry for ${type} response ${nameIndex} — button is currently spinning`
            );
        }

        await btn.click();
        console.log(`  ✓ Retry clicked for ${type} response ${nameIndex}`);
    }

    /**
     * Verifies retry is in progress for a specific response.
     * Spinning state = animation contains rotateIcon, cursor:not-allowed, pointer-events:none.
     *
     * @param nameIndex - radio name index
     * @param type      - 'base' or 'frontier'
     */
    async verifyRetryIsSpinning(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base'
    ): Promise<boolean> {
        console.log(`  → Verifying retry is spinning for ${type} response ${nameIndex}...`);

        const btn = type === 'base'
            ? this.retryButtonForBaseResponse(nameIndex)
            : this.retryButtonForFrontierResponse(nameIndex);

        const isSpinning = await btn.evaluate((el: SVGElement) => {
            const style = el.getAttribute('style') ?? '';
            return (
                style.includes('rotateIcon') &&
                style.includes('cursor: not-allowed') &&
                style.includes('pointer-events: none')
            );
        });

        if (isSpinning) {
            console.log(`  ✓ Retry is spinning for ${type} response ${nameIndex}`);
        } else {
            console.warn(`  ⚠ Retry is NOT spinning for ${type} response ${nameIndex}`);
        }

        return isSpinning;
    }

    /**
     * Waits for retry to complete — button returns to idle state after spinning.
     *
     * @param nameIndex - radio name index
     * @param type      - 'base' or 'frontier'
     * @param timeout   - max wait in ms
     */
    async waitForRetryToComplete(
        nameIndex: number,
        type: 'base' | 'frontier' = 'base',
        timeout = 60000
    ): Promise<boolean> {
        console.log(`  → Waiting for retry to complete for ${type} response ${nameIndex}...`);

        const start = Date.now();

        while (Date.now() - start < timeout) {
            const isIdle = await this.verifyRetryButtonIdle(nameIndex, type);
            if (isIdle) {
                console.log(`  ✓ Retry completed for ${type} response ${nameIndex}`);
                return true;
            }
            await this.page().waitForTimeout(2000);
        }

        console.warn(`  ⚠ Retry did not complete within ${timeout}ms`);
        return false;
    }

    // ─────────────────────────────────────────
    // COMPLETE RESPONSE MODAL ACTIONS
    // ─────────────────────────────────────────

    /**
     * Opens the Complete Response modal for a specific response wrapper.
     * Clicks View Complete Response button and waits for modal to appear.
     *
     * @param wrapperLocator - the sc-6e40ec64-18 div for that response
     */
    async openCompleteResponseModal(wrapperLocator: Locator): Promise<void> {
        console.log('  → Opening Complete Response modal...');
        await this.viewCompleteResponseBtn(wrapperLocator).click();
        await this.completeResponseModal.waitFor({ state: 'visible', timeout: 5000 });
        console.log('  ✓ Complete Response modal opened');
    }

    /**
     * Reads the full response text from the Complete Response modal.
     * Must be called after openCompleteResponseModal().
     */
    async getCompleteResponseText(): Promise<string> {
        await this.completeResponseModalContent.waitFor({ state: 'visible', timeout: 5000 });
        const text = await this.completeResponseModalContent.textContent();
        return text?.trim() ?? '';
    }

    /**
     * Closes the Complete Response modal.
     * Waits for modal to be hidden after clicking Close.
     */
    async closeCompleteResponseModal(): Promise<void> {
        console.log('  → Closing Complete Response modal...');
        await this.completeResponseModalCloseButton.click();
        await this.completeResponseModal.waitFor({ state: 'hidden', timeout: 5000 });
        console.log('  ✓ Complete Response modal closed');
    }

    /**
     * Verifies View Complete Response button is present for every response
    * whose preview text is truncated (ends with "...").
    * Short responses show full text — no button needed or expected.
    *
    * DevTools verify truncated responses:
    * [...document.querySelectorAll('div.sc-6e40ec64-22.bkcbqC span')]
    *   .filter(s => s.textContent?.trim().endsWith('...')).length
    */
    async verifyViewCompleteResponseButtonForEachResponse(): Promise<boolean> {
        console.log('  → Verifying View Complete Response button for truncated responses...');

        const wrappers = await this.page().locator('div.sc-6e40ec64-18').all();
        let allPassed = true;
        let truncatedCount = 0;

        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const isTruncated = await this.isResponseTruncated(wrapper);

            if (isTruncated) {
                truncatedCount++;
                const btnVisible = await wrapper
                    .locator('button.view-complete-response-button')
                    .isVisible()
                    .catch(() => false);

                if (!btnVisible) {
                    console.warn(
                        `  ⚠ Response ${i + 1}: truncated but View Complete Response button missing`
                    );
                    allPassed = false;
                } else {
                    console.log(`  ✓ Response ${i + 1}: truncated — button present`);
                }
            } else {
                console.log(`  ✓ Response ${i + 1}: short response — no button needed`);
            }
        }

        console.log(`  ℹ ${truncatedCount}/${wrappers.length} responses are truncated`);
        return allPassed;
    }

    /**
     * Opens Complete Response modal for a response, reads full text, then closes.
     * Use this when you need to verify or capture the complete response text.
     *
     * @param wrapperLocator - the response wrapper div
     * @returns full response text from modal
     */
    async readCompleteResponse(wrapperLocator: Locator): Promise<string> {
        await this.openCompleteResponseModal(wrapperLocator);
        const fullText = await this.getCompleteResponseText();
        await this.closeCompleteResponseModal();
        return fullText;
    }

    /**
     * Reads complete response text for all base responses.
     * Opens modal for each, reads text, closes — returns array of full texts.
     */
    async getAllCompleteBaseResponseTexts(): Promise<string[]> {
        const wrappers = await this.baseResponseWrappers.all();
        const texts: string[] = [];
        for (const wrapper of wrappers) {
            const text = await this.readCompleteResponse(wrapper);
            texts.push(text);
        }
        return texts;
    }

    /**
     * Reads complete response text for all frontier responses.
     */
    async getAllCompleteFrontierResponseTexts(): Promise<string[]> {
        const wrappers = await this.frontierResponseWrappers.all();
        const texts: string[] = [];
        for (const wrapper of wrappers) {
            const text = await this.readCompleteResponse(wrapper);
            texts.push(text);
        }
        return texts;
    }

    /**
     * Verifies Complete Response modal opens, shows content, and closes correctly.
     * Smoke test for the modal flow on a specific response.
     *
     * @param wrapperLocator - the response wrapper div to test
     */
    async verifyCompleteResponseModalFlow(wrapperLocator: Locator): Promise<boolean> {
        try {
            console.log('  → Verifying Complete Response modal flow...');

            await this.openCompleteResponseModal(wrapperLocator);

            // Verify title
            const title = await this.completeResponseModalTitle.textContent();
            if (title?.trim() !== 'Complete Response') {
                console.warn(`  ⚠ Modal title mismatch. Expected "Complete Response", got "${title}"`);
                return false;
            }

            // Verify content is not empty
            const content = await this.getCompleteResponseText();
            if (!content) {
                console.warn('  ⚠ Complete Response modal content is empty');
                return false;
            }

            console.log(`  ✓ Modal content length: ${content.length} characters`);

            await this.closeCompleteResponseModal();

            // Verify modal is closed
            const isHidden = await this.completeResponseModal.isHidden();
            if (!isHidden) {
                console.warn('  ⚠ Modal did not close after clicking Close button');
                return false;
            }

            console.log('  ✓ Complete Response modal flow verified');
            return true;

        } catch (error) {
            console.error(`  ⚠ Complete Response modal flow error: ${error}`);
            return false;
        }
    }

    /**
     * Checks if a response preview is truncated.
     * Handles three cases:
     * 1. Literal "..." at end of text content
     * 2. Unicode ellipsis "…" at end
     * 3. View Complete Response button is present (most reliable signal)
     *
     * The button presence is the MOST reliable check because it is added
     * by the app specifically when the response is truncated — regardless
     * of how the CSS handles the visual truncation.
     *
     * DevTools verify:
     * document.querySelector('button.view-complete-response-button') !== null
     */
    private async isResponseTruncated(wrapperLocator: Locator): Promise<boolean> {
        // Primary check — button presence is the most reliable signal
        const hasButton = await wrapperLocator
            .locator('button.view-complete-response-button')
            .isVisible()
            .catch(() => false);

        if (hasButton) return true;

        // Fallback — check text content for ellipsis patterns
        const text = await wrapperLocator
            .locator('div.sc-6e40ec64-22.bkcbqC span')
            .textContent()
            .catch(() => '');

        const trimmed = text?.trim() ?? '';
        return (
            trimmed.endsWith('...') ||
            trimmed.endsWith('…') ||       // unicode ellipsis
            trimmed.endsWith('....') ||    // sometimes 4 dots
            trimmed.includes('...')        // ... anywhere near end
        );
    }


    // ─────────────────────────────────────────
    // TOAST ACTIONS
    // ─────────────────────────────────────────

    /**
     * Verifies error toast is visible with expected message text.
     * @param expectedMessage - exact message expected in toast
     */
    async verifyErrorToast(expectedMessage: string): Promise<boolean> {
        console.log(`  → Verifying error toast: "${expectedMessage}"...`);
        try {
            await this.errorToast.waitFor({ state: 'visible', timeout: 5000 });
            const actualMessage = await this.errorToastMessage.textContent();
            if (actualMessage?.trim() !== expectedMessage) {
                console.warn(
                    `  ⚠ Toast message mismatch.\n` +
                    `    Expected: "${expectedMessage}"\n` +
                    `    Actual:   "${actualMessage?.trim()}"`
                );
                return false;
            }
            console.log('  ✓ Error toast verified');
            return true;
        } catch {
            console.warn('  ⚠ Error toast did not appear');
            return false;
        }
    }

    /**
     * Closes the error toast by clicking the close button.
     */
    async closeErrorToast(): Promise<void> {
        console.log('  → Closing error toast...');
        await this.errorToastCloseButton.click();
        await this.errorToast.waitFor({ state: 'hidden', timeout: 3000 });
        console.log('  ✓ Error toast closed');
    }

    // ─────────────────────────────────────────
    // DATA READING
    // ─────────────────────────────────────────

    async getPromptText(): Promise<string> {
        const text = await this.promptDisplay.textContent();
        return text?.trim() ?? '';
    }

    async getResponseCountFromUI(expectedCount: number): Promise<{ actual: number; expected: number }> {
        try {
            // Read the counter text directly from the DOM — e.g. "5 response(s) out of 5"
            // Using evaluate with Array.from to avoid NodeListOf iterator issues
            const result = await this.page().evaluate(() => {
                const divs = Array.from(document.querySelectorAll('div'));
                const counterDiv = divs.find(d =>
                    d.textContent?.match(/\d+\s*response\(s\)\s*out of\s*\d+/) !== null
                    && (d.children.length === 0 || d.textContent === d.children[0]?.textContent)
                );
                if (!counterDiv) return null;
                const match = counterDiv.textContent?.match(/(\d+)\s*response\(s\)\s*out of\s*(\d+)/);
                if (match) {
                    return {
                        actual: parseInt(match[1], 10),
                        expected: parseInt(match[2], 10)
                    };
                }
                return null;
            });

            if (result) {
                console.log(`📊 Responses: ${result.actual}/${result.expected}`);
                return result;
            }
        } catch {
            console.warn('  ⚠ Could not read response counter from DOM');
        }

        // Fallback — count radio groups dynamically
        // Each response has exactly 2 radios (Correct + Incorrect) sharing one name
        // So unique name count = response count
        try {
            const uniqueNames = await this.page().evaluate(() => {
                const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                    'input[type="radio"][name^="response-original-"]'
                ));
                return new Set(inputs.map(i => i.name)).size;
            });

            if (uniqueNames > 0) {
                console.log(`  ✓ Fallback count: ${uniqueNames} base responses`);
                return { actual: uniqueNames, expected: uniqueNames };
            }
        } catch {
            console.warn('  ⚠ Fallback count also failed');
        }

        return { actual: 0, expected: 0 };
    }

    async getBaseResponseNameIndexes(): Promise<number[]> {
        const inputs = await this.page()
            .locator('input[name^="response-original-"]')
            .all();
        const indexes = new Set<number>();
        for (const input of inputs) {
            const name = await input.getAttribute('name');
            const match = name?.match(/response-original-(\d+)/);
            if (match) indexes.add(parseInt(match[1], 10));
        }
        return Array.from(indexes).sort((a, b) => a - b);
    }

    async getFrontierResponseNameIndexes(): Promise<number[]> {
        const inputs = await this.page()
            .locator('input[name^="response-frontier-"]')
            .all();
        const indexes = new Set<number>();
        for (const input of inputs) {
            const name = await input.getAttribute('name');
            const match = name?.match(/response-frontier-(\d+)/);
            if (match) indexes.add(parseInt(match[1], 10));
        }
        return Array.from(indexes).sort((a, b) => a - b);
    }

    /**
     * Gets the full response text for a given response wrapper.
     * Handles two cases:
     *   - Short response: text is fully visible in span — read directly
     *   - Long response: text is truncated, View Complete Response button present
     *                    — open modal, read full text, close modal
     *
     * DevTools verify button presence:
     * document.querySelector('button.view-complete-response-button') !== null
     */
    async getResponseText(wrapperLocator: Locator): Promise<string> {
        const hasViewButton = await wrapperLocator
            .locator('button.view-complete-response-button')
            .isVisible()
            .catch(() => false);

        if (hasViewButton) {
            // Long response — open modal, read full text, close modal
            console.log('  ℹ Long response detected — reading via Complete Response modal');
            const fullText = await this.readCompleteResponse(wrapperLocator);
            return fullText;
        }

        // Short response — read preview span directly
        const text = await wrapperLocator
            .locator('div.sc-6e40ec64-22.bkcbqC span')
            .textContent();
        return text?.trim() ?? '';
    }

    async getAllBaseResponseTexts(): Promise<string[]> {
        const wrappers = await this.baseResponseWrappers.all();
        return Promise.all(wrappers.map(w => this.getResponseText(w)));
    }

    async getAllFrontierResponseTexts(): Promise<string[]> {
        const wrappers = await this.frontierResponseWrappers.all();
        return Promise.all(wrappers.map(w => this.getResponseText(w)));
    }

    async isFrontierButtonEnabled(): Promise<boolean> {
        const count = await this.frontierButton.count();
        if (count === 0) return false;
        return !(await this.frontierButton.isDisabled());
    }

    async isSubmitButtonEnabled(): Promise<boolean> {
        const count = await this.submitButton.count();
        if (count === 0) return false;
        return !(await this.submitButton.isDisabled());
    }

    async areAllBaseResponsesMarked(): Promise<boolean> {
        const indexes = await this.getBaseResponseNameIndexes();
        for (const i of indexes) {
            const checkedCount = await this.page()
                .locator(`input[name="response-original-${i}"]:checked`)
                .count();
            if (checkedCount === 0) return false;
        }
        return indexes.length > 0;
    }

    async areAllFrontierResponsesMarked(): Promise<boolean> {
        const indexes = await this.getFrontierResponseNameIndexes();
        for (const i of indexes) {
            const checkedCount = await this.page()
                .locator(`input[name="response-frontier-${i}"]:checked`)
                .count();
            if (checkedCount === 0) return false;
        }
        return indexes.length > 0;
    }

    /**
     * Verifies the marking question "Is the above response correct or incorrect?"
     * is visible for each response.
     *
     * DevTools verify count:
     * [...document.querySelectorAll('div.sc-6e40ec64-15')]
     *   .filter(d => d.textContent?.includes('Is the above response correct or incorrect?'))
     *   .length
     */
    async verifyMarkingQuestionForEachResponse(expectedCount: number): Promise<boolean> {
        console.log(`  → Verifying marking question visible for ${expectedCount} responses...`);

        const actualCount = await this.page().evaluate(() => {
            /**
             * Target: div.sc-6e40ec64-15
             * This is the direct container for each marking question row.
             * Each response has exactly ONE of these divs.
             *
             * TODO: if this class changes between builds, use this alternative:
             * Find divs whose DIRECT child div contains exactly the question text
             * [...document.querySelectorAll('div')]
             *   .filter(d => {
             *     const directChild = d.querySelector(':scope > div > div');
             *     return directChild?.textContent?.trim() === 'Is the above response correct or incorrect?'
             *   })
             *
             * DevTools verify expected count:
             * document.querySelectorAll('div.sc-6e40ec64-15').length
             */
            return document.querySelectorAll('div.sc-6e40ec64-15').length;
        });

        if (actualCount !== expectedCount) {
            console.warn(
                `  ⚠ Marking question count mismatch.\n` +
                `    Expected: ${expectedCount}\n` +
                `    Found:    ${actualCount}`
            );
            return false;
        }

        console.log(`  ✓ Marking question visible for all ${expectedCount} responses`);
        return true;
    }

    // ─────────────────────────────────────────
    // DEBUG HELPERS
    // ─────────────────────────────────────────

    async dumpPageHTML(name: string): Promise<void> {
        const html = await this.page().content();
        fs.writeFileSync(`./screenshots/${name}.html`, html);
    }

    async logResponseSummary(expectedCount: number): Promise<void> {
        const { actual, expected } = await this.getResponseCountFromUI(expectedCount);
        console.log(`📊 Responses: ${actual}/${expected}`);
        const baseIndexes = await this.getBaseResponseNameIndexes();
        console.log(`  Base responses: ${baseIndexes.length} (indexes: ${baseIndexes.join(', ')})`);
        const frontierIndexes = await this.getFrontierResponseNameIndexes();
        console.log(`  Frontier responses: ${frontierIndexes.length} (indexes: ${frontierIndexes.join(', ')})`);
    }
}