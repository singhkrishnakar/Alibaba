// Authenticator - Handles login
import { BrowserManager } from '../browser/browserManager';
import { UserCredentials } from '../../config/config';

export class Authenticator {
    constructor(private browser: BrowserManager) { }

    async login(credentials: UserCredentials, baseUrl: string): Promise<void> {
        console.log('🔑 Logging in...');
        const startTime = Date.now();
        const page = this.browser.getPage();

        try {
            // Navigate to login page
            await this.browser.navigate(`${baseUrl}/login`, 'domcontentloaded');
            await this.browser.takeScreenshot('01_login_page');

            // Fill email
            const emailFilled = await this.browser.fill(
                'input[type="email"]||input[name="email"]||input#email||input[placeholder*="email"]',
                credentials.email,
                2000
            );
            if (!emailFilled) throw new Error('Email input not found');

            // Fill password
            const passwordFilled = await this.browser.fill(
                'input[type="password"]||input[name="password"]||input#password',
                credentials.password,
                2000
            );
            if (!passwordFilled) throw new Error('Password input not found');

            // Click submit button
            const submitted = await this.browser.click(
                'button[type="submit"]||button:has-text("Login")||button:has-text("Sign in")||button:has-text("Sign In")',
                2000
            );
            if (!submitted) throw new Error('Submit button not found');

            // Wait for the URL to change away from /login
            await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });

            // Verify URL contains /dashboard
            await page.waitForURL(/\/dashboard/, { timeout: 10000 });

            // Wait for dashboard element to appear
            const dashboardReady = page.locator('div[data-testid="dashboard"], main');
            await dashboardReady.first().waitFor({ state: 'visible', timeout: 5000 });

            await this.browser.takeScreenshot('02_logged_in');

            const duration = Date.now() - startTime;
            console.log(`✓ Login successful (${duration}ms)`);

        } catch (error) {
            console.error(`✗ Login failed: ${error}`);
            throw error;
        }
    }
}
