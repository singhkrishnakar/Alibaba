import { BrowserManager } from "../browser/browserManager"

export abstract class BasePage {

  constructor(protected browser: BrowserManager) { }

  public page() {
    return this.browser.getPage()
  }

  protected locator(selector: string) {
    return this.page().locator(selector)
  }

  protected async click(selector: string, timeout = 5000) {
    return this.browser.click(selector, timeout)
  }

  protected async waitForSelector(selector: string, timeout = 10000) {
    await this.page().waitForSelector(selector, { timeout })
  }

  protected async waitForNavigation(
    url?: string | RegExp | ((url: URL) => boolean),
    timeout = 5000
  ) {
    return this.browser.waitForNavigation(url, timeout)
  }

  protected async waitForTimeout(ms: number) {
    await this.page().waitForTimeout(ms)
  }

  protected async waitForVisible(selector: string, timeout = 10000) {
    return this.page().waitForSelector(selector, { state: 'visible', timeout })
  }

  protected async waitForLoader(selector: string = '.loader-container') {

    console.log("⏳ Waiting for loader to disappear...")

    await this.page().waitForSelector(selector, {
      state: "hidden",
      timeout: 10000
    }).catch(() => { })

    console.log("✓ Loader gone")

  }

  protected async screenshot(name: string) {
    await this.page().screenshot({ path: `./screenshots/${name}.png` })
  }

}