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
    const storagePath = "playwright/.auth/user.json"

    if (!fs.existsSync(storagePath)) {
      throw new Error("⚠️ Session file not found. Run auth.setup.ts first!")
    }

    const context = await browser.newContext({
      storageState: storagePath
    })

    const page = await context.newPage()

    const browserManager = new BrowserManager(
      page,
      config.screenshotDir
    )

    const ctx = new TestContext(config, browserManager)

    await use(ctx)

    await context.close()

  }

})

export { expect } from "@playwright/test"