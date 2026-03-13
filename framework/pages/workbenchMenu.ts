// Workbench Launcher - Launches workbench
import { BrowserManager } from '../browser/browserManager';

export class WorkbenchLauncher {
    constructor(private browser: BrowserManager) { }

    async launch(): Promise<void> {
        console.log('🚀 Launching workbench...');
        const startTime = Date.now();

        try {
            const page = this.browser.getPage();

            // Check if already on workbench
            const title = await page.title();
            const url = page.url();
            if (title.includes('Workbench') || url.includes('workbench')) {
                console.log('  ℹ Already on workbench');
                const duration = Date.now() - startTime;
                console.log(`✓ Already on workbench (${duration}ms)`);
                return;
            }

            // Try to find three-dot menu button (MoreVertIcon)
            console.log('  → Looking for MoreVertIcon menu button...');
            const menuFound = await this.browser.click(
                'button:has(svg[data-testid="MoreVertIcon"])||button svg[data-testid="MoreVertIcon"]',
                1000
            );

            if (menuFound) {

                const page = this.browser.getPage();

                console.log('  ℹ Waiting for Launch Workbench menu item...');

                const menuItems = await page.locator('[role="menu"] li').allTextContents();
                console.log('Menu items found:', menuItems);

                try {

                    //const workbenchOption = page.locator('text=Launch Workbench').first();

                    const workbenchOption = page.locator(
                        '[role="menu"] >> text=Launch Workbench'
                    );
                    await workbenchOption.waitFor({
                        state: 'visible',
                        timeout: 5000
                    });

                    console.log('  ✓ Clicking Launch Workbench');

                    await workbenchOption.click();

                    await page.waitForLoadState('domcontentloaded');

                    const duration = Date.now() - startTime;
                    console.log(`✓ Workbench launched (${duration}ms)`);

                    return;

                } catch (err) {

                    console.log('  ⚠ Launch Workbench not found in menu');

                }
            }

            // If menu not found or click failed, try direct click on any "Launch" button
            console.log('  → Trying direct Launch button...');
            const directLaunch = await this.browser.click(
                'button:has-text("Launch")||a:has-text("Launch")',
                1500
            );

            if (directLaunch) {
                await this.browser.waitForNavigation(5000);
                await this.browser.waitForTimeout(300);
                const duration = Date.now() - startTime;
                console.log(`✓ Workbench launched (${duration}ms)`);
                return;
            }

            // If still not found, just continue - workbench might already be open
            console.log('  ⚠ Could not find workbench launch button, continuing...');
            const duration = Date.now() - startTime;
            console.log(`⚠ Workbench launch skipped (${duration}ms)`);

        } catch (error) {
            console.error(`✗ Workbench launch error: ${error}`);
            // Don't throw - continue anyway
        }
    }

    async waitForLoader(selector: string = '.loader-container') {
        const page = this.browser.getPage();

        console.log("⏳ Waiting for loader to disappear...");

        await page.waitForSelector(selector, {
            state: 'hidden',
            timeout: 10000
        }).catch(() => { });

        console.log("✓ Loader gone");
    }
}
