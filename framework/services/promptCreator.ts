// Prompt Creator - Creates and runs prompts
import { BrowserManager } from '../browser/browserManager';
import { PromptTestData } from '../../data/promptData';

export class PromptCreator {
    constructor(private browser: BrowserManager) { }

    async createPrompt(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {

        console.log("📝 Creating prompt...");
        const startTime = Date.now();


        try {

            // Ensure prompt type is selected (e.g., "essay")
            console.log(`  → Selecting prompt type: ${testData.metadata.questionType}`);
            const typeSelected = await this.browser.click(
                `button:has-text("${testData.metadata.questionType}")||label:has-text("${testData.metadata.questionType}")||input[value="${testData.metadata.questionType}"]||input[type="radio"][value="${testData.metadata.questionType}"]`,
                1000
            );
            if (!typeSelected) {
                const msg = `Prompt type selector for "${testData.metadata.questionType}" not found`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            } else {
                await this.browser.waitForTimeout(300);
            }

            // Fill prompt text (try several common selectors)
            console.log('  → Filling prompt text');

            const filled = await this.fillPrompt(testData, abortOnFailure);

            if (!filled) {
                const msg = 'Could not fill prompt text';
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            const page = this.browser.getPage();

            // Set education level - try native select first, then react-select typing, then dropdown click
            console.log(`  → Setting education level: ${testData.metadata.level}`);

            const selectEducationLevel = await this.setEducationLevel(testData, abortOnFailure);

            if (!selectEducationLevel) {
                const msg = `Could not set education level to "${testData.metadata.level}"`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            // Fill/Select subject/discipline (use same multi-strategy approach as education level)
            console.log(`  → Filling subject/discipline: ${testData.metadata.discipline}`);

            const selectSubject = await this.setSubject(testData, abortOnFailure);

            if (!selectSubject) {
                const msg = `Could not set subject to "${testData.metadata.discipline}"`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            // Run the prompt form if possible (may not be needed in latest UI)
            console.log('  → Running prompt form if run button exists');

            const runForm = await this.runPrompt(false);
            if (!runForm) {
                const msg = 'Run button not found or failed to execute';
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            await this.browser.takeScreenshot('05_prompt_created');
            const duration = Date.now() - startTime;
            console.log(`✓ Prompt created (${duration}ms)`);
            return true;
        } catch (error) {
            console.error(`⚠ Prompt creation error: ${error}`);
            // Re-throw so caller stops execution when a critical step fails
            throw error;
        }
    }

    async fillPrompt(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log('📝 Filling prompt...');
        const startTime = Date.now();
        const page = this.browser.getPage();

        try {
            const promptBox = page.locator(
                'textarea[placeholder*="A school is planning"]'
            );
            await promptBox.waitFor({ state: 'visible', timeout: 15000 });
            await promptBox.click();
            await promptBox.fill(testData.prompt.promptText);
            const duration = Date.now() - startTime;
            console.log(`✓ Prompt filled (${duration}ms)`);
            return true;
        } catch (error) {
            console.error(`⚠ Prompt filling error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async setEducationLevel(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        console.log(`  → Setting education level: ${testData.metadata.level}`);

        const page = this.browser.getPage();

        try {
            const dropdownInput = page.locator('#react-select-dropdown-level-dropdown-input');

            await dropdownInput.waitFor({ state: 'visible', timeout: 10000 });

            await dropdownInput.click();

            await dropdownInput.fill(testData.metadata.level);

            await page.locator('div[role="option"]', { hasText: testData.metadata.level }).click();

            console.log(`✓ Education level selected: ${testData.metadata.level}`);
            return true;

        } catch (error) {
            console.error(`⚠ Education level selection error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

    async setSubject(testData: PromptTestData, abortOnFailure = true): Promise<boolean> {
        const page = this.browser.getPage();
        try {
            console.log(`  → Setting subject: ${testData.metadata.discipline}`);

            // Click into the dropdown input
            const disciplineInput = page.locator('#react-select-dropdown-disciplines-dropdown-input');
            await disciplineInput.click();
            await disciplineInput.fill(testData.metadata.discipline);

            // Wait a short moment for React Select options to render
            await page.waitForTimeout(300);

            // Click the exact matching option
            const option = page.getByRole('option', { name: testData.metadata.discipline, exact: true });
            await option.waitFor({ state: 'visible', timeout: 5000 });
            await option.click();

            console.log(`✓ Subject selected: ${testData.metadata.discipline}`);
            return true;
        } catch (error) {
            console.error(`⚠ Subject selection error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }


    async runPrompt(abortOnFailure = true): Promise<boolean> {
        console.log('▶️  Running prompt...');
        const startTime = Date.now();

        try {
            // Click "Run" or "Execute" button
            const runClicked = await this.browser.click(
                'button:has-text("Run")',
                2000
            );

            if (runClicked) {

                const page = this.browser.getPage();
                await page.waitForLoadState("domcontentloaded");
                await page.waitForTimeout(500);
                // Wait for results to load
                //await this.browser.waitForNavigation(10000);
                await this.browser.waitForTimeout(500);
                const duration = Date.now() - startTime;
                console.log(`✓ Prompt executed (${duration}ms)`);
                return true;
            } else {
                const msg = 'Run button not found';
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
                const duration = Date.now() - startTime;
                console.log(`⚠ Prompt execution skipped (${duration}ms)`);
                return false;
            }

            await this.browser.takeScreenshot('05_prompt_ran');
        } catch (error) {
            console.error(`⚠ Prompt execution error: ${error}`);
            if (abortOnFailure) throw error;
            return false;
        }
    }

}
