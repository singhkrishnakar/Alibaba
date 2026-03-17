import { chromium } from '@playwright/test';
import { BrowserManager } from '../framework/browser/browserManager';
import { Authenticator } from '../framework/auth/authenticator';
import { ProjectSelector } from '../framework/services/projectSelector';
import { getConfig } from '../config/config';

async function debug() {
    const config = getConfig();

    // Launch browser & page using Playwright
    const browserInstance = await chromium.launch({ headless: config.headless });
    const context = await browserInstance.newContext();
    const page = await context.newPage();

    // Pass the Playwright page to BrowserManager
    const browser = new BrowserManager(page, config.screenshotDir);
    const authenticator = new Authenticator(browser);
    const projectSelector = new ProjectSelector(browser);

    try {
        // Login
        await authenticator.login(config.credentials, config.project.baseUrl);

        // Navigate to project
        await projectSelector.navigateToProject(
            config.project.projectName,
            config.project.baseUrl,
            config.project.projectUrl
        );

        await page.waitForTimeout(500);
        await browser.takeScreenshot('debug_project');

        // … your button/debug code stays the same

    } catch (error) {
        console.error(`Error: ${error}`);
    } finally {
        await context.close();
        await browserInstance.close();
    }
}

debug();