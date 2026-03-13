import { BrowserManager } from "../browser/browserManager";

export abstract class BasePage {
  constructor(protected browser: BrowserManager) {}

  protected page() {
    return this.browser.getPage();
  }

  protected async waitForLoader() {
    await this.page().waitForSelector('.loader', { state: 'hidden' });
  }
}