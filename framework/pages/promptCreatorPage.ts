import { Page } from "@playwright/test";
import { PromptTestData } from "../../types/testData.type";
import { TestContext } from "../core/TestContext";
import { BasePage } from "./basePage";

export class PromptCreatorPage extends BasePage {
    private context: TestContext

    constructor(context: TestContext) {

        super(context.browser)

        this.context = context

    }
    async navigateToCreatePrompt(baseUrl: string) {
        await this.page().goto(`${baseUrl}/prompt/create`)
    }

    async fillPromptForm(data: any) {
        await this.page().fill('textarea[name="prompt"]', data.prompt)
    }

    async submitPrompt() {
        await this.page().click('button:has-text("Submit")')
    }

    async isPromptCreated(): Promise<boolean> {
        return await this.page().isVisible('text=Prompt created')
    }

    async createPrompt(testData: PromptTestData): Promise<void> {
        const created = await this.context.promptCreator.createPrompt(testData);
        if (!created) throw new Error('Prompt creation failed, aborting automation');
    }
}