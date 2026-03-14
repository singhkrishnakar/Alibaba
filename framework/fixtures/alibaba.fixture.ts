import { test as base } from "@playwright/test"
import { BrowserManager } from "../browser/browserManager"
import { TestContext } from "../core/TestContext"
import { getConfig } from "../../config/config"
import * as fs from "fs"

type Fixtures = {
  testContext: TestContext
}

export const test = base.extend<Fixtures>({

  testContext: async ({ browser }, use) => {
    const config = getConfig()

    // Make sure session file exists
    const storagePath = 'playwright/.auth/user.json'
    if (!fs.existsSync(storagePath)) {
      throw new Error('⚠️ Session file not found. Run auth.setup.ts first!')
    }

    // Create a new browser context with the saved session
    const context = await browser.newContext({ storageState: storagePath })
    const page = await context.newPage()

    const browserManager = new BrowserManager(page, config.screenshotDir)
    const ctx = new TestContext(config, browserManager)

    await use(ctx)

    // Optionally close context after tests
    await context.close()
  }

})

export { expect } from "@playwright/test"