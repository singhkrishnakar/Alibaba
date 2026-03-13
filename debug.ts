// Debug tool to find workbench launch selectors
import { BrowserManager } from './framework/browser/browserManager';
import { Authenticator } from './framework/auth/authenticator';
import { ProjectSelector } from './framework/services/projectSelector';
import { getConfig } from './config/config';

async function debug() {
    const config = getConfig();
    const browser = new BrowserManager(config.screenshotDir);
    const authenticator = new Authenticator(browser);
    const projectSelector = new ProjectSelector(browser);

    try {
        // Launch and login
        await browser.launch(config.headless);
        await authenticator.login(config.credentials, config.project.baseUrl);
        await projectSelector.navigateToProject(
            config.project.projectName,
            config.project.baseUrl,
            config.project.projectUrl
        );

        await browser.waitForTimeout(500);
        await browser.takeScreenshot('debug_project');

        // Get page for direct access
        const page = browser.getPage();

        // Find all buttons
        console.log('\n=== ALL BUTTONS ===');
        const buttons = await page.locator('button').all();
        for (let i = 0; i < Math.min(buttons.length, 30); i++) {
            const text = await buttons[i].textContent();
            const ariaLabel = await buttons[i].getAttribute('aria-label');
            const dataTestId = await buttons[i].getAttribute('data-testid');
            const className = await buttons[i].getAttribute('class');
            if (text?.trim() || ariaLabel || dataTestId) {
                console.log(`Button ${i}: text="${text?.trim()}" aria-label="${ariaLabel}" data-testid="${dataTestId}" class="${className}"`);
            }
        }

        // Find all text containing "Launch" or "Workbench"
        console.log('\n=== ELEMENTS WITH "LAUNCH" or "WORKBENCH" ===');
        const launchElements = await page.locator('*:has-text("Launch"), *:has-text("Workbench")').all();
        for (let i = 0; i < Math.min(launchElements.length, 20); i++) {
            const tag = await launchElements[i].evaluate(e => e.tagName);
            const text = await launchElements[i].textContent();
            const ariaLabel = await launchElements[i].getAttribute('aria-label');
            console.log(`${tag}: "${text?.substring(0, 60).trim()}" aria-label="${ariaLabel}"`);
        }

        // Look for menu-like elements
        console.log('\n=== MENU-LIKE ELEMENTS ===');
        const menuElements = await page.locator('[aria-label*="menu" i], [aria-label*="more" i], [data-testid*="menu"]').all();
        for (const el of menuElements) {
            const text = await el.textContent();
            const ariaLabel = await el.getAttribute('aria-label');
            console.log(`"${text?.trim()}" aria-label="${ariaLabel}"`);
        }

        console.log('\n✓ Debug complete. Check screenshot: screenshots/debug_project.png');
    } catch (error) {
        console.error(`Error: ${error}`);
    } finally {
        await browser.close();
    }
}

debug();
