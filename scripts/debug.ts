import { chromium } from '@playwright/test';
import { BrowserManager } from '../framework/browser/browserManager';
import { Authenticator } from '../framework/auth/authenticator';
import { ProjectSelector } from '../framework/services/projectSelector';
import { getConfig } from '../config/config';
import { userConfig } from '../config/users.config';

async function debug() {
    const config = getConfig();

    // Launch browser & context
    const browserInstance = await chromium.launch({ headless: config.env.headless });
    const context = await browserInstance.newContext();
    const page = await context.newPage();

    // Initialize BrowserManager
    const browser = new BrowserManager(page, config.fileManager.downloadDir);

    // Optional: start worker 0 to load session if needed
    await browser.start(0);  // ✅ ensures context & page ready

    const authenticator = new Authenticator(browser);
    const projectSelector = new ProjectSelector(browser);

    try {
        // Login
        await authenticator.login(
            userConfig.users[0],           // ✅ single UserCredential
            config.project.baseUrl
        );
        // Navigate to project
        await projectSelector.navigateToProject(
            config.project.projectName,
            config.project.baseUrl,
            config.project.projectUrl
        );

        await page.waitForTimeout(500);
        await browser.takeScreenshot('debug_project');

        console.log("✅ Debug finished successfully");

    } catch (error) {
        console.error(`❌ Error: ${error}`);
    } finally {
        await context.close();
        await browserInstance.close();
    }
}

debug();