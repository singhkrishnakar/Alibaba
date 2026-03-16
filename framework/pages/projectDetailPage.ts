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
    //verify if export was successful by checking the file exists in the download directory

    async verifyExport(filePath: string): Promise<void> {

        try {
            await fs.access(filePath)
            Logger.success(`Export verified: ${filePath}`)
        } catch {
            throw new Error(`Export file not found: ${filePath}`)
        }
    }


    async getPromptFromExport(
        filePath: string,
        inputText: string
    ): Promise<any> {

        Logger.info(`Reading exported prompts from: ${filePath}`)

        const fileContent = await fs.readFile(filePath, "utf-8")
        const prompts = JSON.parse(fileContent)

        if (!Array.isArray(prompts)) {
            Logger.error("Exported JSON is not an array")
            throw new Error("Exported JSON is not an array")
        }

        const matchingPrompts = prompts.filter(
            (p: any) => p.input_text === inputText
        )

        if (matchingPrompts.length === 0) {
            Logger.error(`No prompt found with input_text: ${inputText}`)
            throw new Error(`Prompt not found in export`)
        }

        Logger.info(`Found ${matchingPrompts.length} matching prompts`)

        const latestPrompt = matchingPrompts.sort(
            (a: any, b: any) => b.prompt_id - a.prompt_id
        )[0]

        Logger.info(`Using latest prompt → ID: ${latestPrompt.prompt_id}`)

        return latestPrompt
    }


    async verifyPromptFields(
        prompt: any,
        expected: ExpectedPromptFields
    ): Promise<void> {

        const actualValue = normalize(prompt.question_type)
        const expectedValue = normalizeQuestionType(expected.question_type)

        Logger.info(`Validating question_type`)
        Logger.info(`Expected: ${expectedValue}`)
        Logger.info(`Actual: ${actualValue}`)

        if (actualValue !== expectedValue) {
            Logger.error(`question_type mismatch`)
            throw new Error(
                `question_type mismatch → expected: "${expectedValue}" | actual: "${actualValue}"`
            )
        }

        Logger.info(`Validating solution_process`)
        Logger.info(`Expected: ${expected.solution_process}`)
        Logger.info(`Actual: ${prompt.solution_process}`)

        if (prompt.solution_process !== expected.solution_process) {
            throw new Error(
                `solution_process mismatch → expected: "${expected.solution_process}" | actual: "${prompt.solution_process}"`
            )
        }

        Logger.info(`Validating thinking_process`)
        Logger.info(`Expected: ${expected.thinking_process}`)
        Logger.info(`Actual: ${prompt.thinking_process}`)

        if (prompt.thinking_process !== expected.thinking_process) {
            throw new Error(
                `thinking_process mismatch → expected: "${expected.thinking_process}" | actual: "${prompt.thinking_process}"`
            )
        }

        Logger.info(`Validating final_answer`)
        Logger.info(`Expected: ${expected.final_answer}`)
        Logger.info(`Actual: ${prompt.final_answer}`)

        if (prompt.final_answer !== expected.final_answer) {
            throw new Error(
                `final_answer mismatch → expected: "${expected.final_answer}" | actual: "${prompt.final_answer}"`
            )
        }

        Logger.info(`Validating knowledge_points`)
        Logger.info(`Expected: ${JSON.stringify(expected.knowledge_points)}`)
        Logger.info(`Actual: ${JSON.stringify(prompt.knowledge_points)}`)

        if (
            JSON.stringify(prompt.knowledge_points) !==
            JSON.stringify(expected.knowledge_points)
        ) {
            throw new Error(
                `knowledge_points mismatch → expected: ${JSON.stringify(expected.knowledge_points)} | actual: ${JSON.stringify(prompt.knowledge_points)}`
            )
        }

        Logger.info(`Validating level`)
        Logger.info(`Expected: ${expected.level}`)
        Logger.info(`Actual: ${prompt.level?.name}`)

        if (prompt.level?.name !== expected.level) {
            throw new Error(
                `level mismatch → expected: "${expected.level}" | actual: "${prompt.level?.name}"`
            )
        }

        Logger.info(`Validating discipline`)
        Logger.info(`Expected: ${expected.discipline}`)
        Logger.info(`Actual: ${prompt.discipline?.name}`)

        if (prompt.discipline?.name !== expected.discipline) {
            throw new Error(
                `discipline mismatch → expected: "${expected.discipline}" | actual: "${prompt.discipline?.name}"`
            )
        }

        Logger.success("✅ Prompt fields verified successfully")
    }

    






   

}

function normalize(value?: string): string {
    return value?.toLowerCase().trim() ?? "";
}

export function normalizeQuestionType(questionType?: string): string {
    const normalized = normalize(questionType);
    return QUESTION_TYPE_EXPORT_MAP[normalized] ?? normalized;
}
