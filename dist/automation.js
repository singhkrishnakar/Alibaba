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
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const BASE_URL = 'https://llmtoolkit-staging.innodata.com';
const EMAIL = 'pzr@innodata.com';
const PASSWORD = 'Password@2027';
const PROJECT_URL = '/project/prompt/356';
let screenshotCount = 1;
async function takeScreenshot(page, name) {
    const dir = 'screenshots';
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
    const filename = path.join(dir, `${screenshotCount.toString().padStart(2, '0')}_${name}.png`);
    try {
        await page.screenshot({ path: filename });
        console.log(`  📸 ${filename}`);
        screenshotCount++;
    }
    catch (e) {
        console.log(`  ⚠️  Screenshot failed: ${name}`);
    }
}
// Ultra-fast click with multiple strategies
async function click(page, selector, timeout = 1500) {
    try {
        const locators = selector.split('||').map(s => s.trim());
        for (const sel of locators) {
            try {
                const loc = page.locator(sel);
                const count = await loc.count();
                if (count > 0) {
                    // Try to scroll and click
                    await loc.first().scrollIntoViewIfNeeded({ timeout: 500 }).catch(() => { });
                    await loc.first().click({ timeout, force: false }).catch(async () => {
                        // Fallback to JS click
                        await page.evaluate((s) => {
                            const el = document.querySelector(s);
                            if (el)
                                el.click();
                        }, sel);
                    });
                    return true;
                }
            }
            catch (e) {
                // Try next selector
            }
        }
    }
    catch (e) {
        // Silent fail
    }
    return false;
}
// Ultra-fast fill - try multiple selectors
async function fill(page, selector, text, timeout = 2000) {
    try {
        const selectors = selector.split('||').map(s => s.trim());
        for (const sel of selectors) {
            try {
                // Use page.fill which waits for the element
                await page.fill(sel, text, { timeout });
                return true;
            }
            catch (e) {
                // Try next selector
            }
        }
    }
    catch (e) {
        // Silent fail
    }
    return false;
}
async function login(page) {
    console.log('🔑 Logging in...');
    const startTime = Date.now();
    // Navigate to login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await takeScreenshot(page, 'login');
    // Fill email - try multiple selectors fast
    if (!await fill(page, 'input[type="email"]||input[name="email"]||input[placeholder*="email"]', EMAIL, 1000)) {
        throw new Error('Email input not found');
    }
    // Fill password
    if (!await fill(page, 'input[type="password"]', PASSWORD, 1000)) {
        throw new Error('Password input not found');
    }
    // Submit - try multiple selectors
    if (!await click(page, 'button[type="submit"]||button:has-text("Login")||button:has-text("Sign in")', 1500)) {
        throw new Error('Submit button not found');
    }
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded', { timeout: 6000 }).catch(() => { });
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'logged_in');
    console.log(`  ✅ Logged in (${Date.now() - startTime}ms)`);
}
async function navigateToProject(page) {
    console.log('📁 Navigating to project...');
    const startTime = Date.now();
    await page.goto(`${BASE_URL}${PROJECT_URL}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(300); // Brief wait for UI to render
    await takeScreenshot(page, 'project_page');
    console.log(`  ✅ Project loaded (${Date.now() - startTime}ms)`);
}
async function launchWorkbench(page) {
    console.log('🚀 Launching workbench...');
    const startTime = Date.now();
    // Try to find and click the menu button with very short timeout
    const menuFound = await click(page, 'button[aria-label*="More"]||button[aria-label*="menu"]||button.menu-button||button[data-testid*="menu"]||button:has-text("⋮")', 1000);
    if (menuFound) {
        await page.waitForTimeout(150); // Wait for menu animation
    }
    // Try to click "Launch Workbench"
    const workbenchClicked = await click(page, 'button:has-text("Launch Workbench")||a:has-text("Launch Workbench")||div:has-text("Launch Workbench")||[role="menuitem"]:has-text("Launch")', 1000);
    if (!workbenchClicked) {
        // Check if we're already on workbench (page might have changed)
        const title = await page.title();
        const url = page.url();
        if (title.includes('Workbench') || url.includes('workbench')) {
            console.log(`  ✅ Already on workbench (${Date.now() - startTime}ms)`);
            await takeScreenshot(page, 'workbench_launched');
            return;
        }
        throw new Error('Could not launch workbench');
    }
    // Wait for workbench to load
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => { });
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'workbench_launched');
    console.log(`  ✅ Workbench launched (${Date.now() - startTime}ms)`);
}
async function createPrompt(page) {
    console.log('📝 Creating prompt...');
    const startTime = Date.now();
    // Look for create/new button
    const createClicked = await click(page, 'button:has-text("Create")||button:has-text("New")||button:has-text("Add")||[role="button"]:has-text("Create")', 1500);
    if (createClicked) {
        await page.waitForTimeout(300);
    }
    // Fill prompt type (try for essay option)
    await click(page, 'input[value="essay"]||input[type="radio"][value="essay"]', 1000);
    // Fill prompt text
    await fill(page, 'textarea||input[placeholder*="prompt"]', 'hi', 1000);
    // Fill education level
    await click(page, 'select', 1000);
    await click(page, 'option:has-text("Undergraduate")', 800);
    // Fill subject
    await fill(page, 'input[placeholder*="subject" i]||input[placeholder*="topic"]', 'Organic Chemistry', 1000);
    // Try to submit
    const submitClicked = await click(page, 'button:has-text("Submit")||button:has-text("Create")', 1500);
    if (submitClicked) {
        await page.waitForLoadState('domcontentloaded', { timeout: 4000 }).catch(() => { });
        await page.waitForTimeout(200);
    }
    await takeScreenshot(page, 'prompt_created');
    console.log(`  ✅ Prompt creation attempted (${Date.now() - startTime}ms)`);
}
async function main() {
    let browser = null;
    const totalStart = Date.now();
    try {
        console.log('\n⏱️  Starting FAST TypeScript automation...\n');
        browser = await playwright_1.chromium.launch({ headless: false });
        const page = await browser.newPage();
        // Set aggressive timeouts
        page.setDefaultTimeout(2000);
        page.setDefaultNavigationTimeout(8000);
        await login(page);
        await navigateToProject(page);
        await launchWorkbench(page);
        await createPrompt(page);
        const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
        console.log(`\n✅ Automation completed in ${totalDuration}s\n`);
        await takeScreenshot(page, 'final_state');
        await page.waitForTimeout(2000);
    }
    catch (error) {
        const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);
        console.error(`\n❌ Error after ${totalDuration}s: ${error}\n`);
        if (browser) {
            await browser.newPage().then(p => p.screenshot({ path: 'screenshots/error.png' })).catch(() => { });
        }
        process.exit(1);
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
main().catch(console.error);
//# sourceMappingURL=automation.js.map