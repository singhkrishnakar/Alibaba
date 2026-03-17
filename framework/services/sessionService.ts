import { Page } from '@playwright/test';
import { Logger } from '../utils/Logger';

export class SessionService {

  async createSession(page: Page, token: string): Promise<void> {

    Logger.info("🔐 Injecting API session");

    await page.goto("https://llmtoolkit-staging.innodata.com");

    await page.evaluate((token) => {
      localStorage.setItem("auth_token", token);
    }, token);

    await page.reload();

    Logger.success("✓ API session created");

  }

}