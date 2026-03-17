import { Locator } from '@playwright/test';
import { BasePage } from './basePage';
import { TestContext } from '../core/TestContext';
import { Logger } from '../utils/Logger';
import * as fs from "fs/promises"
import path from "path"
import { ExpectedPromptFields } from '../../data/expectedPromptFields';
import { QUESTION_TYPE_EXPORT_MAP } from '../constants/promptMappings';

export class ProjectDetailPage extends BasePage {
    goToNextPage() {
        throw new Error("Method not implemented.");
    }
    getPromptTextByRow(i: number) {
        throw new Error("Method not implemented.");
    }
    getProjectTitle() {
        throw new Error("Method not implemented.");
    }

    constructor(private context: TestContext) {
        super(context.browser)
    }

    // HEADER

    get projectTitle(): Locator {
        return this.page().locator('h1')
    }

    get projectStatus(): Locator {
        return this.page().locator('.chip1')
    }

    // MENU

    get moreOptionsButton(): Locator {
        return this.page().locator('[data-testid="MoreVertIcon"]')
    }

    get launchWorkbenchOption(): Locator {
        return this.page().getByText('Launch Workbench')
    }

    get projectSettingsOption(): Locator {
        return this.page().getByText('Project Settings')
    }

    // TABLE

    get promptsTable(): Locator {
        return this.page().locator('table')
    }

    get promptRows(): Locator {
        return this.page().locator('tbody tr')
    }

    get exportButton(): Locator {
        return this.page().locator('.export-dropdown-btn')
    }

    // SEARCH

    get searchInput(): Locator {
        return this.page().locator('input[placeholder="Search..."]')
    }

    // PAGINATION

    get nextPageButton(): Locator {
        return this.page().locator('[data-testid="ChevronRightIcon"]')
    }

    get prevPageButton(): Locator {
        return this.page().locator('[data-testid="ChevronLeftIcon"]')
    }

    // =========================
    // ACTION METHODS
    // =========================

    async waitForPageLoad() {
        await this.projectTitle.waitFor({ state: 'visible' })
    }

    async searchPrompt(text: string) {

        await this.searchInput.fill(text)

        await this.page().keyboard.press('Enter')

        await this.waitForLoader()
    }

    async getPromptCount(): Promise<number> {
        return await this.promptRows.count()
    }

    async launchWorkbench() {

        await this.moreOptionsButton.click()

        await this.launchWorkbenchOption.waitFor({ state: 'visible' })

        await this.launchWorkbenchOption.click()

        await this.page().waitForLoadState('domcontentloaded')
    }

    async exportPrompts(type: 'json' | 'csv'): Promise<string> {

        const page = this.page()

        await page.locator('.export-dropdown-btn').click()

        const optionText =
            type === 'json'
                ? 'Download as JSON'
                : 'Download as CSV'

        const option = page.getByText(optionText)

        await option.waitFor({ state: 'visible' })

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            option.click()
        ])

        const fileName = download.suggestedFilename()

        const filePath = path.join(
            this.context.fileManager.downloadDir,
            fileName
        )

        await download.saveAs(filePath)

        return filePath
    }   
}


