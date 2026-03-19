import { expect } from '@playwright/test';
import { TestContext } from '../core/TestContext';
import { BasePage } from './basePage';

export class DashboardKebabMenu extends BasePage {
    private context: TestContext;

    constructor(context: TestContext) {
        super(context.browser);
        this.context = context;
    }

    // ─────────────────────────────────────────
    // LOCATORS
    // ─────────────────────────────────────────

    get kebabMenuButton() {
        return this.page().locator('button:has(svg[data-testid="MoreVertIcon"])');
    }

    // ✅ Stable — targets ul sibling of the kebab button
    get kebabMenuList() {
        return this.page().locator('button:has(svg[data-testid="MoreVertIcon"]) ~ ul');
    }

    get menuItems() {
        return this.page().locator('button:has(svg[data-testid="MoreVertIcon"]) ~ ul li');
    }

    // ✅ Stable — text-based, structure-independent
    // get launchWorkbenchOption() {
    //     return this.page()
    //         .locator('button:has(svg[data-testid="MoreVertIcon"]) ~ ul li')
    //         .filter({ hasText: 'Launch Workbench' });
    // }

    get projectSettingsOption() {
        return this.page()
            .locator('button:has(svg[data-testid="MoreVertIcon"]) ~ ul li')
            .filter({ hasText: 'Project Settings' });
    }

    get signOutOption() {
        return this.page()
            .locator('button:has(svg[data-testid="MoreVertIcon"]) ~ ul li')
            .filter({ hasText: 'Sign Out' });
    }

    get menuList() {
        return this.page().locator('[role="menu"] li');
    }

    get launchWorkbenchOption() {
        return this.page().locator('[role="menu"]').getByText('Launch Workbench');
    }

    get directLaunchButton() {
        return this.page().locator('button:has-text("Launch"), a:has-text("Launch")');
    }

    get loadingIndicator() {
        return this.page().locator('text=Loading...');
    }

    // ─────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────


    async openKebabMenu(): Promise<void> {
        console.log('  → Opening kebab menu...');
        await this.kebabMenuButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.kebabMenuButton.click();
        // Wait for ul to become visible (display: block)
        await this.kebabMenuList.waitFor({ state: 'visible', timeout: 3000 });
    }

    async logMenuItems(): Promise<void> {
        const items = await this.menuItems.allTextContents();
        console.log('  Menu items found:', items.map(i => i.trim()));
    }

    async clickLaunchWorkbench(): Promise<void> {
        console.log('  → Clicking Launch Workbench option...');
        await this.launchWorkbenchOption.waitFor({ state: 'visible', timeout: 5000 });
        await this.launchWorkbenchOption.click();
    }

    async clickDirectLaunch(): Promise<void> {
        console.log('  → Clicking direct Launch button...');
        await this.directLaunchButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.directLaunchButton.click();
    }

    async waitForLoader(): Promise<void> {
        console.log('⏳ Waiting for workbench to load...');
        try {
            await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 15000 });
            console.log('✓ Workbench loaded');
        } catch {
            console.log('⚠ Loading indicator not found or timed out');
        }
    }


    // ─────────────────────────────────────────
    // ORCHESTRATION
    // ─────────────────────────────────────────

    async launch(): Promise<void> {
        console.log('🚀 Launching workbench...');
        const startTime = Date.now();

        try {
            if (await this.isAlreadyOnWorkbench()) {
                console.log('ℹ Already on workbench');
                return;
            }

            // Strategy 1: kebab menu → Launch Workbench option
            if (await this.tryLaunchViaKebabMenu()) {
                console.log(`✓ Workbench launched via kebab menu (${Date.now() - startTime}ms)`);
                return;
            }

            // Strategy 2: direct Launch button on page
            if (await this.tryDirectLaunch()) {
                console.log(`✓ Workbench launched via direct button (${Date.now() - startTime}ms)`);
                return;
            }

            console.warn('⚠ Could not find any workbench launch button');
        } catch (error) {
            console.error(`✗ Workbench launch error: ${error}`);
            throw error;
        }
    }

    // ─────────────────────────────────────────
    // VERIFICATIONS
    // ─────────────────────────────────────────

    async verifyKebabMenuVisible(): Promise<void> {
        await expect(this.kebabMenuButton).toBeVisible();
    }

    async verifyLaunchWorkbenchOptionVisible(): Promise<void> {
        await expect(this.launchWorkbenchOption).toBeVisible();
    }

    async verifyLoaderHidden(): Promise<void> {
        await expect(this.loadingIndicator).toBeHidden();
    }

    // ─────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────

    private async isAlreadyOnWorkbench(): Promise<boolean> {
        const title = await this.page().title();
        const url = this.page().url();
        return title.includes('Workbench') || url.includes('workbench');
    }

    private async tryLaunchViaKebabMenu(): Promise<boolean> {
        try {
            console.log('  → Trying kebab menu strategy...');
            await this.openKebabMenu();       // waits for ul visible
            await this.logMenuItems();        // now safe to read
            await this.clickLaunchWorkbench();
            await this.page().waitForLoadState('domcontentloaded');
            return true;
        } catch {
            console.log('  ⚠ Kebab menu strategy failed');
            return false;
        }
    }

    private async tryDirectLaunch(): Promise<boolean> {
        try {
            console.log('  → Trying direct launch strategy...');
            await this.clickDirectLaunch();
            await this.waitForNavigation();
            await this.waitForTimeout(300);
            return true;
        } catch {
            console.log('  ⚠ Direct launch strategy failed');
            return false;
        }
    }
}