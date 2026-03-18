import { Page } from '@playwright/test';
import { Logger } from '../utils/Logger';
import { getConfig } from '../../config/config';

export class SessionService {

  async createSession(page: Page, token: string): Promise<void> {

    const config = getConfig();

    Logger.info("🔐 Injecting API session");

    await page.addInitScript((tokenValue) => {
      localStorage.setItem("auth_token", tokenValue);
    }, token);

    await page.goto(config.project.baseUrl, {
      waitUntil: 'domcontentloaded'
    });

    Logger.success("✅ API session created");
  }
}