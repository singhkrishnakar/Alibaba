// Workbench Launcher - Launches workbench
import { BrowserManager } from './browser_manager';

export class WorkbenchLauncher {
    constructor(private browser: BrowserManager) {}

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
                // Wait for menu dropdown to appear
                await this.browser.waitForTimeout(300);
                console.log('  ℹ Menu opened, clicking Launch Workbench option');
                await this.browser.waitForTimeout(500);
                
                // Try to click workbench option - it's in a <li><button><span> structure
                const workbenchClicked = await this.browser.click(
                    'li button span:has-text("Launch Workbench")||li button:has-text("Launch Workbench")||span:has-text("Launch Workbench")',
                    1000
                );

                if (workbenchClicked) {
                    console.log('  ℹ Workbench option clicked, pausing for visibility');
                    await this.browser.waitForTimeout(1000);
                    await this.browser.waitForNavigation(5000);
                    await this.browser.waitForTimeout(300);
                    const duration = Date.now() - startTime;
                    console.log(`✓ Workbench launched (${duration}ms)`);
                    return;
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
}
