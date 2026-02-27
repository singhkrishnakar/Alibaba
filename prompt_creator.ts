// Prompt Creator - Creates and runs prompts
import { BrowserManager } from './browser_manager';
import { PromptConfig } from './config';

export class PromptCreator {
    constructor(private browser: BrowserManager) {}

    async createPrompt(config: PromptConfig, abortOnFailure = true): Promise<boolean> {
        console.log('📝 Creating prompt...');
        const startTime = Date.now();

        try {
            // Click create/new button if present (form may already be open)
            console.log('  → Clicking Create/New button (if visible)');
            const clicked = await this.browser.click(
                'button:has-text("Create")||button:has-text("New")||button:has-text("Add")||button.css-sit19b',
                1500
            );
            if (!clicked) {
                const msg = 'Create/New button not found; assuming prompt form already open';
                console.log(`  ⚠ ${msg}`);
                // Capture diagnostics to help adjust selectors later
                await this.browser.takeScreenshot('04_create_button_missing');
                try {
                    const html = await this.browser.getPage().content();
                    console.log('  📝 Dumping page HTML for diagnostics');
                    console.log(html.substring(0, 2000) + '...');
                } catch (e) {
                    console.error(`  ⚠ Could not dump HTML: ${e}`);
                }
                // do NOT abort; continue with form filling
            } else {
                await this.browser.waitForTimeout(500);
            }

            // Ensure prompt type is selected (e.g., "essay")
            console.log(`  → Selecting prompt type: ${config.promptType}`);
            const typeSelected = await this.browser.click(
                `button:has-text("${config.promptType}")||label:has-text("${config.promptType}")||input[value="${config.promptType}"]||input[type="radio"][value="${config.promptType}"]`,
                1000
            );
            if (!typeSelected) {
                const msg = `Prompt type selector for "${config.promptType}" not found`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            } else {
                await this.browser.waitForTimeout(300);
            }

            // Fill prompt text (try several common selectors)
            console.log('  → Filling prompt text');
            const filled = await this.browser.fill(
                'textarea[name="prompt"]||textarea||input[name="promptText"]||input[placeholder*="prompt"]',
                config.promptText,
                1500
            );
            if (!filled) {
                const msg = 'Could not fill prompt text with primary selectors';
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            // Set education level - try native select first, then react-select typing, then dropdown click
            console.log(`  → Setting education level: ${config.educationLevel}`);
            let levelSet = false;
            try {
                // Try native select/option
                levelSet = await this.browser.click('select', 800);
                if (levelSet) {
                    await this.browser.waitForTimeout(200);
                    levelSet = await this.browser.click(`option:has-text("${config.educationLevel}")`, 1200);
                }
            } catch (e) {
                levelSet = false;
            }

            if (!levelSet) {
                // Try react-select style by targeting first dropdown input
                console.log('  → Trying react-select typing fallback');
                const typed = await this.typeReactSelectByIndex(0, config.educationLevel);
                if (typed) {
                    await this.browser.waitForTimeout(300);
                    levelSet = await this.browser.click(`div[role="option"]:has-text("${config.educationLevel}")||div:has-text("${config.educationLevel}")||li:has-text("${config.educationLevel}")`, 1200);
                }
            }

            if (!levelSet) {
                // As a final fallback, open the dropdown control and click the visible option
                console.log('  → Trying dropdownControl open + click fallback');
                const opened = await this.browser.click('.dropdownControl||.css-1dimb5e-singleValue||.css-hlgwow', 800);
                if (opened) {
                    await this.browser.waitForTimeout(300);
                    levelSet = await this.browser.click(`div[role="option"]:has-text("${config.educationLevel}")||div:has-text("${config.educationLevel}")||li:has-text("${config.educationLevel}")`, 1200);
                }
            }

            if (!levelSet) {
                const msg = `Education level \"${config.educationLevel}\" not set (selector mismatch)`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            // Fill/Select subject/discipline (use same multi-strategy approach as education level)
            console.log(`  → Filling subject/discipline: ${config.subject}`);
            let subjectSet = false;

            // first try a simple text fill, then click a matching option if one appears
            const subjectFilled = await this.browser.fill(
                'input[placeholder*="subject" i]||input[placeholder*="topic"]||input[name="subject"]||input[aria-label*="Subject"]',
                config.subject,
                1000
            );
            if (subjectFilled) {
                await this.browser.click(`option:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 800);
                subjectSet = true;
            } else {
                console.log('  ⚠ Subject field not found with primary selectors, will try select/dropdown strategies');
            }

            // if the simple fill didn't set anything, fall back to the same pattern used for educationLevel
            if (!subjectSet) {
                try {
                    // native select + option
                    subjectSet = await this.browser.click('select', 800);
                    if (subjectSet) {
                        await this.browser.waitForTimeout(200);
                        subjectSet = await this.browser.click(`option:has-text("${config.subject}")`, 1200);
                    }
                } catch (e) {
                    subjectSet = false;
                }
            }

            if (!subjectSet) {
                console.log('  → Trying react-select typing fallback for subject');
                const typed = await this.typeReactSelectByIndex(1, config.subject);
                if (typed) {
                    await this.browser.waitForTimeout(300);
                    subjectSet = await this.browser.click(`div[role="option"]:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 1200);
                }
            }

            if (!subjectSet) {
                console.log('  → Trying dropdownControl open + click fallback for subject');
                const opened = await this.browser.click('.dropdownControl||.css-1dimb5e-singleValue||.css-hlgwow', 800);
                if (opened) {
                    await this.browser.waitForTimeout(300);
                    subjectSet = await this.browser.click(`div[role="option"]:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 1200);
                }
            }

            if (!subjectSet) {
                const msg = `Subject/Discipline \"${config.subject}\" not set (selector mismatch)`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }

            // Submit the prompt form if possible (may not be needed in latest UI)
            console.log('  → Submitting prompt form if submit button exists');
            const submitted = await this.browser.click(
                'button:has-text("Submit")||button:has-text("Create")||button:has-text("Save")||button[aria-haspopup="dialog"]',
                1500
            );
            if (submitted) {
                try {
                    await this.browser.waitForNavigation(5000);
                } catch (e) {
                    // navigation may not happen
                }
                await this.browser.waitForTimeout(200);
            } else {
                console.log('  ⚠ Submit/Create/Save button not found; continuing');
                // add diagnostics: list all button texts
                try {
                    const texts = await this.browser.getPage().evaluate(() =>
                        Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim())
                    );
                    console.log('  📝 Available buttons:', texts);
                } catch (e) {
                    console.error(`  ⚠ Could not list buttons: ${e}`);
                }
                await this.browser.takeScreenshot('04_submit_missing');
                // do not abort; assume runPrompt will handle execution
            }

            // final verification: check that the react-select controls show our values
            const page = this.browser.getPage();
            try {
                const selectedTexts: string[] = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('.css-1dimb5e-singleValue')).map(el => el.textContent?.trim() || '')
                );
                console.log('  📝 React-select selected texts:', selectedTexts);
                if (!selectedTexts.includes(config.educationLevel)) {
                    const msg = `Education level \"${config.educationLevel}\" not selected (got ${selectedTexts.join(',')})`;
                    console.log(`  ⚠ ${msg}`);
                    if (abortOnFailure) throw new Error(msg);
                }
                if (!selectedTexts.includes(config.subject)) {
                    const msg = `Subject \"${config.subject}\" not selected (got ${selectedTexts.join(',')})`;
                    console.log(`  ⚠ ${msg}`);
                    if (abortOnFailure) throw new Error(msg);
                }
            } catch (e) {
                console.error('  ⚠ Could not verify react-select values:', e);
            }
            // also keep generic presence check as fallback
            const hasLevel = await page.locator(`text=${config.educationLevel}`).count();
            const hasSubject = await page.locator(`text=${config.subject}`).count();
            if (!hasLevel) {
                const msg = `Education level \"${config.educationLevel}\" not visible after creation`;
                console.log(`  ⚠ ${msg}`);
                if (abortOnFailure) throw new Error(msg);
            }
            if (!hasSubject) {
                const msg = `Subject \"${config.subject}\" not visible after creation`;
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

    async runPrompt(abortOnFailure = true): Promise<boolean> {
        console.log('▶️  Running prompt...');
        const startTime = Date.now();

        try {
            // Click "Run" or "Execute" button
            const runClicked = await this.browser.click(
                'button:has-text("Run")||button:has-text("Execute")||button:has-text("Generate")||button:has-text("Start")',
                2000
            );

            if (runClicked) {
                // Wait for results to load
                await this.browser.waitForNavigation(10000);
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

    /**
     * Click into the nth react-select input and type text, then press Enter.
     * Returns true if the sequence succeeded.
     */
    private async typeReactSelectByIndex(index: number, text: string): Promise<boolean> {
        try {
            const page = this.browser.getPage();
            const handles = await page.$$(`input[id^=\"react-select-\"]`);
            if (handles.length <= index) {
                console.log(`  ⚠ react-select input #${index} not found (${handles.length} available)`);
                return false;
            }
            const handle = handles[index];
            await handle.click({ timeout: 1000 });
            await handle.type(text, { delay: 50 });
            await page.keyboard.press('Enter');
            console.log(`  ✓ Typed and entered into react-select #${index}`);
            return true;
        } catch (e) {
            console.log(`  ⚠ react-select index ${index} fallback failed: ${e}`);
            return false;
        }
    }
}
