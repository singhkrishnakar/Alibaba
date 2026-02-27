"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSelector = void 0;
class ProjectSelector {
    constructor(browser) {
        this.browser = browser;
    }
    async navigateToProject(projectName, baseUrl, projectUrl) {
        console.log('📁 Navigating to project...');
        const startTime = Date.now();
        try {
            const page = this.browser.getPage();
            const currentUrl = page.url();
            // Check if already on correct project page
            if (projectUrl && currentUrl.includes(projectUrl)) {
                console.log('  ℹ Already on project page');
                const duration = Date.now() - startTime;
                console.log(`✓ Already on project (${duration}ms)`);
                return;
            }
            // Check if we're on login page (session expired)
            if (currentUrl.includes('/login')) {
                throw new Error('Session expired - back on login page. Need to re-login.');
            }
            // Only navigate if we have a project URL
            if (projectUrl) {
                const fullUrl = `${baseUrl}${projectUrl}`;
                console.log(`  → Navigating to: ${fullUrl}`);
                // Navigate with minimal wait
                await this.browser.getPage().goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
                await this.browser.waitForTimeout(1000);
                // Check if we got redirected back to login
                await this.browser.waitForTimeout(1000);
                const newUrl = page.url();
                if (newUrl.includes('/login')) {
                    throw new Error('Session expired - redirected to login page');
                }
                await this.browser.waitForTimeout(300);
            }
            else {
                console.log('  ⚠ No project URL provided, skipping navigation');
                return;
            }
            await this.browser.takeScreenshot('03_project_page');
            const duration = Date.now() - startTime;
            console.log(`✓ Project loaded (${duration}ms)`);
        }
        catch (error) {
            console.error(`✗ Project navigation failed: ${error}`);
            throw error;
        }
    }
    /**
     * Validate session is still active
     */
    async validateSession(baseUrl) {
        try {
            const page = this.browser.getPage();
            const currentUrl = page.url();
            // If on login page, session is invalid
            if (currentUrl.includes('/login')) {
                console.log('  ⚠ Session invalid - on login page');
                return false;
            }
            // If on dashboard or project, session is valid
            if (currentUrl.includes('/dashboard') || currentUrl.includes('/project')) {
                console.log('  ✓ Session valid');
                return true;
            }
            console.log(`  ? Session unknown at ${currentUrl}`);
            return true; // Assume valid if not on login
        }
        catch (error) {
            console.error(`✗ Session validation error: ${error}`);
            return false;
        }
    }
}
exports.ProjectSelector = ProjectSelector;
//# sourceMappingURL=project_selector.js.map