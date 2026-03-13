import { test as base } from "@playwright/test";
import { BrowserManager } from "../browser/browserManager";
import { TestContext } from "../core/TestContext";

// Extend Playwright test with a browserManager fixture
export const test = base.extend<{ browserManager: BrowserManager }>({

  browserManager: async ({}, use) => {
    const browserManager = new BrowserManager();
    await browserManager.launch();       // auto-launch browser
    await use(browserManager);           // provide to tests
    await browserManager.close();        // cleanup
  },

});

// You can also export Playwright expect if needed
export { expect } from "@playwright/test";