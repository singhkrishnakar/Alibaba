import { Page } from "@playwright/test"
import * as fs from "fs"
import * as path from "path"

export class BrowserManager {

    private page: Page
    private screenshotDir: string
    private screenshotCount = 1

    constructor(page: Page, screenshotDir = "./screenshots") {
        this.page = page
        this.screenshotDir = screenshotDir

        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true })
        }
    }

    getPage(): Page {
        return this.page
    }

    async navigate(
        url: string,
        waitUntil: "domcontentloaded" | "load" | "networkidle" = "domcontentloaded",
        retries = 2
    ) {

        for (let i = 0; i <= retries; i++) {

            try {
                await this.page.goto(url, { waitUntil, timeout: 15000 });

                console.log(`✓ Navigated to ${url}`);
                return;

            } catch (err) {

                if (i === retries) throw err;

                console.log(`⚠ Navigation retry ${i + 1}...`);
                await this.page.waitForTimeout(2000);
            }
        }
    }

    async click(selector: string, timeout = 2000): Promise<boolean> {

        const selectors = selector.split("||").map(s => s.trim())

        for (const sel of selectors) {
            try {
                await this.page.locator(sel).click({ timeout })
                console.log(`✓ Clicked: ${sel}`)
                return true
            } catch {
                // try next selector
            }
        }

        console.error(`✗ Failed to click any of: ${selector}`)
        return false
    }
    async fill(selector: string, text: string, timeout = 2000): Promise<boolean> {

        const selectors = selector.split("||").map(s => s.trim())

        for (const sel of selectors) {
            try {
                await this.page.locator(sel).fill(text, { timeout })
                console.log(`✓ Filled: ${sel}`)
                return true
            } catch {
                // try next selector
            }
        }

        console.error(`✗ Failed to fill any of: ${selector}`)
        return false
    }

    async takeScreenshot(name: string) {

        const filename = path.join(
            this.screenshotDir,
            `${this.screenshotCount}_${name}.png`
        )

        await this.page.screenshot({ path: filename })

        console.log(`📸 ${filename}`)
        this.screenshotCount++
    }

    async waitForLoader() {
        await this.page
            .locator(".loader-container")
            .waitFor({ state: "hidden", timeout: 15000 })
            .catch(() => { })

        console.log("✓ Page ready")
    }

    // ✅ Add this method for legacy code
    async waitForTimeout(ms: number): Promise<void> {
        await this.page.waitForTimeout(ms)
    }

    async waitForNavigation(url?: string | RegExp | ((url: URL) => boolean), timeout = 5000) {
        await this.page.waitForURL(url ?? /.*/, { timeout });
    }

    async pressKey(key: string) {
        await this.page.keyboard.press(key);
    }

    // Fill input by label text (fills associated input or textarea)
    async fillByLabel(labelText: string, value: string, timeout = 2000): Promise<boolean> {
        try {
            const label = this.page.locator(`label:has-text("${labelText}")`);
            if ((await label.count()) === 0) return false;

            const inputOrTextarea = label.locator('.. input, .. textarea').first();
            await inputOrTextarea.fill(value, { timeout });
            console.log(`✓ Filled by label: ${labelText}`);
            return true;
        } catch (err) {
            console.error(`✗ fillByLabel failed for "${labelText}": ${err}`);
            return false;
        }
    }
}