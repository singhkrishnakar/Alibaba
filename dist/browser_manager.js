"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserManager = void 0;
// Browser Manager - Handles all browser operations
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class BrowserManager {
    constructor(screenshotDir = './screenshots') {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.screenshotCount = 1;
        this.screenshotDir = screenshotDir;
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
    }
    async launch(headless = false) {
        try {
            this.browser = await playwright_1.chromium.launch({ headless });
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();
            // Set timeouts globally
            this.page.setDefaultTimeout(2000);
            this.page.setDefaultNavigationTimeout(8000);
            console.log('✓ Browser launched');
        }
        catch (error) {
            console.error(`✗ Failed to launch browser: ${error}`);
            throw error;
        }
    }
    async close() {
        try {
            if (this.context)
                await this.context.close();
            if (this.browser)
                await this.browser.close();
            console.log('✓ Browser closed');
        }
        catch (error) {
            console.error(`✗ Error closing browser: ${error}`);
        }
    }
    getPage() {
        if (!this.page)
            throw new Error('Browser not launched');
        return this.page;
    }
    async navigate(url, waitUntil = 'domcontentloaded') {
        try {
            await this.page.goto(url, { waitUntil, timeout: 8000 });
            console.log(`✓ Navigated to ${url}`);
        }
        catch (error) {
            console.error(`✗ Failed to navigate to ${url}: ${error}`);
            throw error;
        }
    }
    async takeScreenshot(name) {
        try {
            const filename = path.join(this.screenshotDir, `${this.screenshotCount.toString().padStart(2, '0')}_${name}.png`);
            await this.page.screenshot({ path: filename });
            console.log(`  📸 ${filename}`);
            this.screenshotCount++;
        }
        catch (error) {
            console.error(`✗ Screenshot failed: ${error}`);
        }
    }
    /**
     * Click element with multiple selector fallbacks
     * @param selector - Single selector or multiple selectors separated by ||
     * @param timeout - Timeout in ms
     */
    async click(selector, timeout = 1500) {
        const selectors = selector.split('||').map(s => s.trim());
        for (const sel of selectors) {
            try {
                // Try to click using page.click which waits for element
                await this.page.click(sel, { timeout });
                console.log(`  ✓ Clicked: ${sel}`);
                await this.page.waitForTimeout(1000);
                return true;
            }
            catch (e) {
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
    async fill(selector, text, timeout = 2000) {
        const selectors = selector.split('||').map(s => s.trim());
        for (const sel of selectors) {
            try {
                await this.page.fill(sel, text, { timeout });
                console.log(`  ✓ Filled: ${sel}`);
                await this.page.waitForTimeout(1000);
                return true;
            }
            catch (e) {
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
    async fillByLabel(labelText, text, timeout = 2000) {
        try {
            const label = this.page.locator(`label:has-text("${labelText}")`);
            const count = await label.count();
            if (count === 0) {
                // Try other label-like spans
                const alt = this.page.locator(`span:has-text("${labelText}")`);
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
                    await this.page.waitForTimeout(1000);
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
                await this.page.waitForTimeout(1000);
                return true;
            }
            // Try using for attribute
            const forAttr = await firstLabel.getAttribute('for');
            if (forAttr) {
                const sel = `#${forAttr}`;
                await this.page.fill(sel, text, { timeout });
                console.log(`  ✓ Filled by label@for: ${labelText} -> ${sel}`);
                await this.page.waitForTimeout(1000);
                return true;
            }
            console.error(`✗ Could not fill by label: ${labelText}`);
            return false;
        }
        catch (e) {
            console.error(`✗ fillByLabel error for ${labelText}: ${e}`);
            return false;
        }
    }
    /**
     * Click a control, type text into it, then press Enter.
     * Useful for react-select style controls.
     */
    async typeAndEnter(selector, text, timeout = 1500) {
        try {
            await this.page.click(selector, { timeout });
            await this.page.waitForTimeout(200);
            await this.page.type(selector, text, { delay: 50 });
            await this.page.keyboard.press('Enter');
            console.log(`  ✓ Typed and entered into: ${selector}`);
            await this.page.waitForTimeout(800);
            return true;
        }
        catch (e) {
            console.error(`✗ typeAndEnter failed for ${selector}: ${e}`);
            return false;
        }
    }
    async waitForTimeout(ms) {
        await this.page.waitForTimeout(ms);
    }
    async waitForNavigation(timeout = 5000) {
        try {
            await Promise.race([
                this.page.waitForNavigation({ timeout }).catch(() => { }),
                this.page.waitForLoadState('domcontentloaded', { timeout }).catch(() => { })
            ]);
        }
        catch (e) {
            // Silent fail
        }
    }
}
exports.BrowserManager = BrowserManager;
//# sourceMappingURL=browser_manager.js.map