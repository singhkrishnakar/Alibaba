import { Locator } from '@playwright/test';
import { BasePage } from './basePage';
import { TestContext } from '../core/TestContext';
import { Logger } from '../utils/Logger';
import * as fs from "fs/promises"
import path from "path"
import { ExpectedPromptFields } from '../../data/expectedPromptFields';

export class ProjectDetailPage extends BasePage {

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
    //verify if export was successful by checking the file exists in the download directory

    async verifyExport(filePath: string): Promise<void> {

        try {
            await fs.access(filePath)
            Logger.success(`Export verified: ${filePath}`)
        } catch {
            throw new Error(`Export file not found: ${filePath}`)
        }
    }


    async verifyPromptFields(
        filePath: string,
        expected: ExpectedPromptFields
    ): Promise<void> {

        const fileContent = await fs.readFile(filePath, "utf-8")
        const prompts = JSON.parse(fileContent)

        if (!Array.isArray(prompts)) {
            throw new Error("Exported JSON is not an array")
        }

        // find prompt based on unique field
        const prompt = prompts.find(
            (p: any) => p.input_text === expected.input_text
        )

        if (!prompt) {
            throw new Error(`Prompt not found in export: ${expected.input_text}`)
        }

        // validations
        if (prompt.question_type !== expected.question_type)
            throw new Error(`question_type mismatch`)

        if (prompt.solution_process !== expected.solution_process)
            throw new Error(`solution_process mismatch`)

        if (prompt.thinking_process !== expected.thinking_process)
            throw new Error(`thinking_process mismatch`)

        if (prompt.final_answer !== expected.final_answer)
            throw new Error(`final_answer mismatch`)

        if (JSON.stringify(prompt.knowledge_points) !== JSON.stringify(expected.knowledge_points))
            throw new Error(`knowledge_points mismatch`)

        if (prompt.level?.name !== expected.level)
            throw new Error(`level mismatch`)

        if (prompt.discipline?.name !== expected.discipline)
            throw new Error(`discipline mismatch`)

        console.log("✅ Prompt fields verified successfully")
    }
}