import { userConfig } from '../../config/users.config';
import { BrowserManager } from '../browser/browserManager';


export class UserSessionManager {

  static getUserForWorker(workerIndex: number) {

    if (userConfig.mode === 'single') {
      return userConfig.users[0];
    }

    return userConfig.users[workerIndex % userConfig.users.length];
  }

  static getStorageStatePath(workerIndex: number) {

    if (userConfig.mode === 'single') {
      return 'playwright/.auth/user.json';
    }

    return `playwright/.auth/user${workerIndex}.json`;
  }

}


export class SessionValidator {

  constructor(private browser: BrowserManager) {}

  async validateSession(baseUrl: string): Promise<boolean> {

    const page = this.browser.getPage();

    try {

      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });

      // If redirected to login page → session expired
      if (page.url().includes("login")) {
        return false;
      }

      return true;

    } catch (err) {

      console.error("Session validation failed:", err);
      return false;

    }

  }

}