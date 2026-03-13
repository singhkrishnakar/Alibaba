// Browser Manager - Handles all browser operations
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private screenshotDir: string;
    private screenshotCount: number = 1;

    constructor(screenshotDir: string = './screenshots') {
        this.screenshotDir = screenshotDir;
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
    }

    async launch(headless: boolean = false, useSession: boolean = false): Promise<void> {
        try {

            this.browser = await chromium.launch({ headless });

            if (useSession) {
                this.context = await this.browser.newContext({
                    storageState: 'playwright/.auth/user.json'
                });
                console.log('✓ Browser launched with saved session');
            } else {
                this.context = await this.browser.newContext();
                console.log('✓ Browser launched');
            }

            this.page = await this.context.newPage();

            this.page.setDefaultTimeout(5000);
            this.page.setDefaultNavigationTimeout(15000);

        } catch (error) {
            console.error(`✗ Failed to launch browser: ${error}`);
            throw error;
        }
    }
    async close(): Promise<void> {
        try {
            if (this.context) await this.context.close();
            if (this.browser) await this.browser.close();
            console.log('✓ Browser closed');
        } catch (error) {
            console.error(`✗ Error closing browser: ${error}`);
        }
    }

    getPage(): Page {
        if (!this.page) throw new Error('Browser not launched');
        return this.page;
    }

    getContext(): BrowserContext {
        if (!this.context) throw new Error('Browser context not initialized');
        return this.context;
    }

    async navigate(url: string, waitUntil: 'domcontentloaded' | 'networkidle' = 'domcontentloaded', retries = 3): Promise<void> {
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.page!.goto(url, { waitUntil, timeout: 15000 });
                console.log(`✓ Navigated to ${url}`);
                return;
            } catch (error: any) {
                lastError = error;
                const msg = String(error?.message || error);
                if (msg.includes('ERR_INSUFFICIENT_RESOURCES') && attempt < retries) {
                    console.log(`  ⚠ Navigation failed (resources), retrying in 3s (attempt ${attempt}/${retries})...`);
                    await this.page!.waitForTimeout(3000);
                } else {
                    break;
                }
            }
        }
        console.error(`✗ Failed to navigate to ${url}: ${lastError}`);
        throw lastError;
    }

    async takeScreenshot(name: string): Promise<void> {
        try {
            const filename = path.join(
                this.screenshotDir,
                `${this.screenshotCount.toString().padStart(2, '0')}_${name}.png`
            );
            await this.page!.screenshot({ path: filename });
            console.log(`  📸 ${filename}`);
            this.screenshotCount++;
        } catch (error) {
            console.error(`✗ Screenshot failed: ${error}`);
        }
    }

    /**
     * Click element with multiple selector fallbacks
     * @param selector - Single selector or multiple selectors separated by ||
     * @param timeout - Timeout in ms
     */
    async click(selector: string, timeout: number = 1500): Promise<boolean> {
        const selectors = selector.split('||').map(s => s.trim());

        for (const sel of selectors) {
            try {
                // Try to click using page.click which waits for element
                await this.page!.click(sel, { timeout });
                console.log(`  ✓ Clicked: ${sel}`);
                await this.page!.waitForTimeout(1000);
                return true;
            } catch (e) {
                // Try next selector
            }
        }

        console.error(`✗ Failed to click any of: ${selector}`);
        return false;
    }

    /**
     * Fill text input with multiple selector fallbacks
     * @param selector - Single selector or multiple selectors separated by ||
     * @param text - Text to fill
     * @param timeout - Timeout in ms
     */
    async fill(selector: string, text: string, timeout: number = 2000): Promise<boolean> {
        const selectors = selector.split('||').map(s => s.trim());

        for (const sel of selectors) {
            try {
                await this.page!.fill(sel, text, { timeout });
                console.log(`  ✓ Filled: ${sel}`);
                await this.page!.waitForTimeout(1000);
                return true;
            } catch (e) {
                // Try next selector
            }
        }

        console.error(`✗ Failed to fill any of: ${selector}`);
        return false;
    }

    /**
     * Fill input/textarea by finding a nearby label text.
     * Attempts label -> parent -> input/textarea, or uses label@for attribute.
     */
    async fillByLabel(labelText: string, text: string, timeout: number = 2000): Promise<boolean> {
        try {
            const label = this.page!.locator(`label:has-text("${labelText}")`);
            const count = await label.count();
            if (count === 0) {
                // Try other label-like spans
                const alt = this.page!.locator(`span:has-text("${labelText}")`);
                if (await alt.count() === 0) {
                    console.error(`✗ No label/span found for: ${labelText}`);
                    return false;
                }
                // use alt as label
                const parent = alt.first().locator('..');
                const input = parent.locator('input, textarea, [role="combobox"], [contenteditable="true"]');
                if (await input.count() > 0) {
                    await input.first().fill(text, { timeout });
                    console.log(`  ✓ Filled by label (span): ${labelText}`);
                    await this.page!.waitForTimeout(1000);
                    return true;
                }
                console.error(`✗ Could not find input near span: ${labelText}`);
                return false;
            }

            const firstLabel = label.first();
            // Try parent input/textarea
            const parent = firstLabel.locator('..');
            const input = parent.locator('input, textarea, [role="combobox"], [contenteditable="true"]');
            if (await input.count() > 0) {
                await input.first().fill(text, { timeout });
                console.log(`  ✓ Filled by label: ${labelText}`);
                await this.page!.waitForTimeout(1000);
                return true;
            }

            // Try using for attribute
            const forAttr = await firstLabel.getAttribute('for');
            if (forAttr) {
                const sel = `#${forAttr}`;
                await this.page!.fill(sel, text, { timeout });
                console.log(`  ✓ Filled by label@for: ${labelText} -> ${sel}`);
                await this.page!.waitForTimeout(1000);
                return true;
            }

            console.error(`✗ Could not fill by label: ${labelText}`);
            return false;
        } catch (e) {
            console.error(`✗ fillByLabel error for ${labelText}: ${e}`);
            return false;
        }
    }

    /**
     * Click a control, type text into it, then press Enter.
     * Useful for react-select style controls.
     */
    async typeAndEnter(selector: string, text: string, timeout: number = 1500): Promise<boolean> {
        const selectors = selector.split('||').map(s => s.trim());
        for (const sel of selectors) {
            try {
                await this.page!.click(sel, { timeout });
                await this.page!.waitForTimeout(200);
                await this.page!.type(sel, text, { delay: 50 });
                await this.page!.keyboard.press('Enter');
                console.log(`  ✓ Typed and entered into: ${sel}`);
                await this.page!.waitForTimeout(800);
                return true;
            } catch (e) {
                // try next selector
            }
        }

        console.error(`✗ typeAndEnter failed for any of: ${selector}`);
        return false;
    }

    async waitForTimeout(ms: number): Promise<void> {
        await this.page!.waitForTimeout(ms);
    }

    async pressKey(key: string): Promise<void> {
        await this.page!.keyboard.press(key);
    }

    async waitForNavigation(timeout: number = 5000): Promise<void> {
        try {
            await Promise.race([
                this.page!.waitForNavigation({ timeout }).catch(() => { }),
                this.page!.waitForLoadState('domcontentloaded', { timeout }).catch(() => { })
            ]);
        } catch (e) {
            // Silent fail
        }
    }

    // Wait for loader to disappear
    async waitForLoader() {

        const page = this.getPage();

        console.log('⏳ Waiting for loader to disappear...');

        await page.waitForSelector('.loader-container', {
            state: 'hidden',
            timeout: 15000
        }).catch(() => { });

        console.log('✓ Page ready');
    }

    async validateSession(baseUrl: string): Promise<boolean> {

        const page = this.getPage();

        await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });

        if (page.url().includes('login')) {
            return false;
        }

        return true;
    }
}
