import { test as base } from "@playwright/test";
import { BrowserManager } from "../browser/browserManager";
import { AutomationConfig, getConfig } from "../../config/config";
import { TestContext } from "../core/TestContext";

type Fixtures = {
  testContext: TestContext;
  config: AutomationConfig;
};

export const test = base.extend<Fixtures>({
  
  config: async ({}, use) => {
    const config = getConfig();
    await use(config);
  },

  testContext: async ({ config }, use) => {

    const browserManager = new BrowserManager(config.screenshotDir);

    await browserManager.launch(config.headless);

    const context = new TestContext(config, browserManager);

    await use(context);

    await browserManager.close();
  },

});

export { expect } from "@playwright/test";