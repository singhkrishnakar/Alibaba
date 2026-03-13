import { TestContext } from '../core/TestContext'
import { BasePage } from './basePage'

export class WorkbenchMenu extends BasePage {

    private context: TestContext

    constructor(context: TestContext) {

        super(context.browser)

        this.context = context

    }

    async launch(): Promise<void> {

        console.log('🚀 Launching workbench...')

        const startTime = Date.now()

        try {

            const page = this.page()

            const title = await page.title()
            const url = page.url()

            if (title.includes('Workbench') || url.includes('workbench')) {

                console.log('ℹ Already on workbench')

                return

            }

            console.log('→ Looking for MoreVertIcon menu button...')

            const menuFound = await this.click(
                'button:has(svg[data-testid="MoreVertIcon"])||button svg[data-testid="MoreVertIcon"]',
                1000
            )

            if (menuFound) {

                console.log('ℹ Waiting for Launch Workbench menu item...')

                const menuItems = await page.locator('[role="menu"] li').allTextContents()

                console.log('Menu items found:', menuItems)

                try {

                    const workbenchOption =
                        page.locator('[role="menu"] >> text=Launch Workbench')

                    await workbenchOption.waitFor({
                        state: 'visible',
                        timeout: 5000
                    })

                    console.log('✓ Clicking Launch Workbench')

                    await workbenchOption.click()

                    await page.waitForLoadState('domcontentloaded')

                    console.log(`✓ Workbench launched (${Date.now() - startTime}ms)`)

                    return

                } catch {

                    console.log('⚠ Launch Workbench not found in menu')

                }

            }

            console.log('→ Trying direct Launch button...')

            const directLaunch = await this.click(
                'button:has-text("Launch")||a:has-text("Launch")',
                1500
            )

            if (directLaunch) {

                await this.waitForNavigation()

                await this.waitForTimeout(300)

                console.log(`✓ Workbench launched (${Date.now() - startTime}ms)`)

                return

            }

            console.log('⚠ Could not find workbench launch button')

        }

        catch (error) {

            console.error(`✗ Workbench launch error: ${error}`)

        }

    }

    async waitForLoader() { 
        console.log('⏳ Waiting for workbench to load...')
        try {
            await this.page().locator('text=Loading...').waitFor({
                state: 'hidden',
                timeout: 15000
            })
            console.log('✓ Workbench loaded')
        } catch {
            console.log('⚠ Loading indicator not found or still visible after timeout')
        }
    }

}