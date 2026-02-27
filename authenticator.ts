// Authenticator - Handles login
import { BrowserManager } from './browser_manager';
import { UserCredentials } from './config';

export class Authenticator {
    constructor(private browser: BrowserManager) {}

    async login(credentials: UserCredentials, baseUrl: string): Promise<void> {
        console.log('🔑 Logging in...');
        const startTime = Date.now();

        try {
            // Navigate to login page
            await this.browser.navigate(`${baseUrl}/login`, 'domcontentloaded');
            await this.browser.takeScreenshot('01_login_page');

            // Fill email with multiple selector attempts
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

            // Wait for navigation with longer timeout to ensure page load
            await this.browser.waitForTimeout(2000);
            const page = this.browser.getPage();
            const currentUrl = page.url();
            
            console.log(`  ℹ After login, URL: ${currentUrl}`);
            await this.browser.waitForTimeout(1000);

            // Check if we're still on login page
            if (currentUrl.includes('/login')) {
                throw new Error('Login failed - still on login page after submission');
            }

            await this.browser.takeScreenshot('02_logged_in');

            const duration = Date.now() - startTime;
            console.log(`✓ Login successful (${duration}ms)`);
        } catch (error) {
            console.error(`✗ Login failed: ${error}`);
            throw error;
        }
    }
}
