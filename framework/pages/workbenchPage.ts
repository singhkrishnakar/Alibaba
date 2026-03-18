import { Locator } from "playwright"
import * as fs from "fs"
import { BasePage } from "./basePage"
import { TestContext } from "../core/TestContext"
import { PromptTestData } from "../../types/testData.type"
import { WorkbenchService } from "../services/workbenchService"

// ✅ DUPLICATES REMOVED VERSION
export class WorkbenchPage extends BasePage {

    private context: TestContext

    constructor(context: TestContext) {
        super(context.browser)
        this.context = context
    }

    private get workbenchPage(): WorkbenchPage {
        if (!this.context.workbenchPage) {
            throw new Error("WorkbenchPage not initialized");
        }
        return this.context.workbenchPage;
    }

    // ==================== LOCATORS ====================

    get responses(): Locator {
        return this.locator('[data-testid="response"]')
    }

    get responseRadioButtons(): Locator {
        return this.locator('input[type="radio"]')
    }

    get questionText(): Locator {
        return this.locator('[data-testid="question"], [data-testid="prompt"]')
    }

    getResponseByIndex(index: number): Locator {
        return this.responses.nth(index)
    }

    getResponseRadioButton(index: number): Locator {
        return this.responseRadioButtons.nth(index)
    }

    getRadioByStatus(status: 'Correct' | 'Incorrect'): Locator {
        return this.locator(`input[type="radio"]:near(label:has-text("${status}"))`)
    }

    // ==================== RESPONSE HELPERS ====================

    async getResponseCount(): Promise<number> {
        try {
            const summaryCount = await this.page().evaluate(() => {
                const divs = Array.from(document.querySelectorAll("div"))
                const summary = divs.find(d =>
                    d.textContent?.includes("response(s) out of")
                )

                if (summary) {
                    const match = summary.textContent?.match(/(\d+)\s*response/)
                    if (match && match[1]) {
                        return parseInt(match[1], 10)
                    }
                }
                return null
            })

            if (summaryCount !== null) {
                console.log(`📊 Summary shows: ${summaryCount} responses`)
                return summaryCount
            }

        } catch {
            console.warn("⚠ Failed to read summary")
        }

        const radioCount = await this.responseRadioButtons.count()

        if (radioCount > 0) {
            const responses = Math.floor(radioCount / 2)
            console.log(`✓ Estimated ${responses} responses`)
            return responses
        }

        return 0
    }

    async getResponseText(index: number): Promise<string> {
        const text = await this.getResponseByIndex(index).textContent()
        return text?.trim() || ""
    }

    async allResponsesMarked(): Promise<boolean> {
        const total = await this.responseRadioButtons.count()
        const checked = await this.locator('input[type="radio"]:checked').count()
        return total > 0 && checked === total
    }

    async waitForResponses(timeout = 15000) { }



    async getQuestion(): Promise<string> {
        const text = await this.questionText.textContent()
        return text?.trim() || ""
    }

    async dumpPageHTML(name: string) {
        const html = await this.page().content()
        fs.writeFileSync(`./screenshots/${name}.html`, html)
    }

    async debugLogResponses() {
        const count = await this.getResponseCount()
        console.log(`📊 Found ${count} responses:`)

        for (let i = 0; i < count; i++) {
            const text = await this.getResponseText(i)
            console.log(`[${i}] ${text.substring(0, 100)}...`)
        }
    }

    async getQuestionText(): Promise<string> {
        throw new Error('Method not implemented.')
    }

    async getResponses() { }

    async getAllResponseTexts(): Promise<string[]> {
        const count = await this.responses.count();
        const texts: string[] = [];

        for (let i = 0; i < count; i++) {
            const text = await this.responses.nth(i).innerText();
            texts.push(text.trim());
        }

        return texts;
    }
}