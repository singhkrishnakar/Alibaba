import { Locator } from 'playwright';
import { BasePage } from './basePage';
import { TestContext } from '../core/TestContext';

export class ProjectDetailPage extends BasePage {

    private context: TestContext;

    constructor(context: TestContext) {
        super(context.browser);
        this.context = context;
    }

    // =========================
    // HEADER
    // =========================

    get projectTitle(): Locator {
        return this.page().locator('h1');
    }

    get projectStatus(): Locator {
        return this.page().locator('.chip1');
    }

    // =========================
    // USER MENU (3 dots)
    // =========================

    get moreOptionsButton(): Locator {
        return this.page().locator('button:has(svg[data-testid="MoreVertIcon"])');
    }

    get launchWorkbenchOption(): Locator {
        return this.page().locator('text=Launch Workbench');
    }

    get projectSettingsOption(): Locator {
        return this.page().locator('text=Project Settings');
    }

    // =========================
    // PROMPT TABLE
    // =========================

    get promptsTable(): Locator {
        return this.page().locator('table');
    }

    get promptRows(): Locator {
        return this.page().locator('tbody tr');
    }

    get promptIdColumn(): Locator {
        return this.page().locator('tbody tr td:nth-child(1)');
    }

    get promptTextColumn(): Locator {
        return this.page().locator('tbody tr td:nth-child(4)');
    }

    // =========================
    // SEARCH
    // =========================

    get searchInput(): Locator {
        return this.page().locator('input[placeholder="Search..."]');
    }

    // =========================
    // PAGINATION
    // =========================

    get nextPageButton(): Locator {
        return this.page().locator('[data-testid="ChevronRightIcon"]');
    }

    get prevPageButton(): Locator {
        return this.page().locator('[data-testid="ChevronLeftIcon"]');
    }

    get resultsCount(): Locator {
        return this.page().locator('text=/\\d+-\\d+ of \\d+/');
    }

    // =========================
    // ACTION METHODS
    // =========================

    async waitForPageLoad() {
        await this.waitForVisible('h1');
    }

    async getProjectTitle(): Promise<string> {
        return (await this.projectTitle.textContent())?.trim() || '';
    }

    async searchPrompt(text: string) {
        await this.searchInput.fill(text);
        await this.page().keyboard.press('Enter');
        await this.waitForLoader();
    }

    async getPromptCount(): Promise<number> {
        return await this.promptRows.count();
    }

    async getPromptTextByRow(index: number): Promise<string> {
        return (
            await this.page()
                .locator(`tbody tr:nth-child(${index + 1}) td:nth-child(4)`)
                .textContent()
        )?.trim() || '';
    }

    async launchWorkbench() {
        console.log('🚀 Launching Workbench');

        await this.moreOptionsButton.click();
        await this.launchWorkbenchOption.waitFor({ state: 'visible' });
        await this.launchWorkbenchOption.click();

        await this.page().waitForLoadState('domcontentloaded');
    }

    async goToNextPage() {
        await this.nextPageButton.click();
        await this.waitForLoader();
    }

}