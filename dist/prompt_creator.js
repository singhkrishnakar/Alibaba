"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptCreator = void 0;
class PromptCreator {
    constructor(browser) {
        this.browser = browser;
    }
    async createPrompt(config) {
        console.log('📝 Creating prompt...');
        const startTime = Date.now();
        try {
            // Click create/new button
            console.log('  → Clicking Create/New button');
            await this.browser.click('button:has-text("Create")||button:has-text("New")||button:has-text("Add")||button.css-sit19b', 1500);
            await this.browser.waitForTimeout(500);
            // Ensure prompt type is selected (e.g., "essay")
            console.log(`  → Selecting prompt type: ${config.promptType}`);
            const typeSelected = await this.browser.click(`button:has-text("${config.promptType}")||label:has-text("${config.promptType}")||input[value="${config.promptType}"]||input[type="radio"][value="${config.promptType}"]`, 1000);
            if (!typeSelected) {
                console.log('  ⚠ Prompt type selector not found, continuing');
            }
            else {
                await this.browser.waitForTimeout(300);
            }
            // Fill prompt text (try several common selectors)
            console.log('  → Filling prompt text');
            const filled = await this.browser.fill('textarea[name="prompt"]||textarea||input[name="promptText"]||input[placeholder*="prompt"]', config.promptText, 1500);
            if (!filled)
                console.log('  ⚠ Could not fill prompt text with primary selectors');
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
            }
            catch (e) {
                levelSet = false;
            }
            if (!levelSet) {
                // Try react-select style: type into the hidden input then press Enter
                console.log('  → Trying react-select typing fallback');
                const reactInputSelectors = '#react-select-dropdown-undefined-input||input[id^="react-select-"]||.css-1wy0on6 input||.css-1dimb5e-singleValue';
                const typed = await this.browser.typeAndEnter(reactInputSelectors, config.educationLevel);
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
            if (!levelSet)
                console.log('  ⚠ Education level not set (selector mismatch)');
            // Fill subject/discipline
            console.log(`  → Filling subject/discipline: ${config.subject}`);
            const subjectFilled = await this.browser.fill('input[placeholder*="subject" i]||input[placeholder*="topic"]||input[name="subject"]||input[aria-label*="Subject"]', config.subject, 1000);
            if (!subjectFilled) {
                console.log('  ⚠ Subject field not found with primary selectors, trying label-based fill');
                const byLabel = await this.browser.click(`div[role="option"]:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 1200);
                //await this.browser.fillByLabel('Subject', config.subject);
                if (!byLabel) {
                    // try Discipline label as alternative
                    const byLabel2 = await this.browser.fillByLabel('Discipline', config.subject);
                    if (byLabel2) {
                        // ensure an option is selected/clicked for discipline
                        await this.browser.click(`option:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 800);
                    }
                    else {
                        console.log('  ⚠ Label-based fill failed, trying react-select style typing');
                        const typed = await this.browser.typeAndEnter('.dropdownControl||.css-1dimb5e-singleValue||div[role="combobox"]', config.subject);
                        if (!typed)
                            console.log('  ⚠ Subject/Discipline could not be set (all strategies failed)');
                    }
                }
                else {
                    // if filled by Subject label, attempt to click matching option if present
                    await this.browser.click(`option:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 800);
                }
            }
            else {
                // If subjectFilled succeeded via primary selector, still try to click an option to ensure selection
                await this.browser.click(`option:has-text("${config.subject}")||div:has-text("${config.subject}")||li:has-text("${config.subject}")`, 800);
            }
            // Submit the prompt form if possible
            console.log('  → Submitting prompt form if submit button exists');
            const submitted = await this.browser.click('button:has-text("Submit")||button:has-text("Create")||button:has-text("Save")||button[aria-haspopup="dialog"]', 1500);
            if (submitted) {
                try {
                    await this.browser.waitForNavigation(5000);
                }
                catch (e) {
                    // navigation may not happen
                }
                await this.browser.waitForTimeout(200);
            }
            await this.browser.takeScreenshot('05_prompt_created');
            const duration = Date.now() - startTime;
            console.log(`✓ Prompt created (${duration}ms)`);
        }
        catch (error) {
            console.error(`⚠ Prompt creation error: ${error}`);
            // Continue anyway - form might not be visible
        }
    }
    async runPrompt() {
        console.log('▶️  Running prompt...');
        const startTime = Date.now();
        try {
            // Click "Run" or "Execute" button
            const runClicked = await this.browser.click('button:has-text("Run")||button:has-text("Execute")||button:has-text("Generate")||button:has-text("Start")', 2000);
            if (runClicked) {
                // Wait for results to load
                await this.browser.waitForNavigation(10000);
                await this.browser.waitForTimeout(500);
                const duration = Date.now() - startTime;
                console.log(`✓ Prompt executed (${duration}ms)`);
            }
            else {
                console.log('  ⚠ Run button not found, skipping execution');
                const duration = Date.now() - startTime;
                console.log(`⚠ Prompt execution skipped (${duration}ms)`);
            }
            await this.browser.takeScreenshot('05_prompt_ran');
        }
        catch (error) {
            console.error(`⚠ Prompt execution error: ${error}`);
            // Don't throw - continue anyway
        }
    }
}
exports.PromptCreator = PromptCreator;
//# sourceMappingURL=prompt_creator.js.map