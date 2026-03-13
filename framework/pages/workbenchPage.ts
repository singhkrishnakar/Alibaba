import { Locator } from "playwright"
import * as fs from "fs"
import { BasePage } from "./basePage"
import { TestContext } from "../core/TestContext"

export class WorkbenchPage extends BasePage {

    private context: TestContext

    constructor(context: TestContext) {

        super(context.browser)

        this.context = context

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

    async getAllResponseTexts(): Promise<string[]> {

        try {

            const texts = await this.page().evaluate(() => {

                const responses = Array.from(
                    document.querySelectorAll('[data-testid="response"]')
                )

                return responses.map(el => {

                    const children = Array.from(el.children)

                    let responseText = ""

                    for (const child of children) {

                        const text = (child.textContent || "").trim()

                        if (
                            text.toLowerCase().includes("correct") &&
                            text.toLowerCase().includes("incorrect")
                        ) {
                            break
                        }

                        responseText += " " + text
                    }

                    return responseText.replace(/\s+/g, " ").trim()

                })

            })

            if (!texts.length) {

                const html = await this.page().content()

                const file = `./screenshots/debug_responses_${Date.now()}.html`

                fs.writeFileSync(file, html)

                console.log(`📄 Dumped HTML → ${file}`)

            }

            return texts

        } catch (e) {

            console.log("⚠ Bulk extraction failed", e)

        }

        const count = await this.getResponseCount()

        const texts: string[] = []

        for (let i = 0; i < count; i++) {

            try {

                const text = await this.getResponseByIndex(i).textContent()

                texts.push(text?.trim() || "")

            } catch {

                texts.push("")

            }

        }

        return texts
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

    async waitForResponses(timeout = 15000) {

        await this.waitForSelector('[data-testid="response"]', timeout)

    }

    async waitForResponseCount(expected: number, timeout = 20000): Promise<boolean> {

        const start = Date.now()

        while (Date.now() - start < timeout) {

            const count = await this.getResponseCount()

            if (count >= expected) {
                return true
            }

            await this.page().waitForTimeout(500)

        }

        return false
    }

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

}