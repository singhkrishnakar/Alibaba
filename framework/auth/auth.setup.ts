import { test } from '@playwright/test';
import { AuthApi } from '../../framework/api/authApi';
import { SessionService } from '../../framework/services/sessionService';
import { TestContext } from '../../framework/core/TestContext';
import { Logger } from '../../framework/utils/Logger';

test('authenticate users', async ({ browser }) => {

  const loginMode = process.env.AUTH_MODE || "api";

  Logger.info(`🔐 Authentication mode: ${loginMode}`);

  const context = await browser.newContext();
  const page = await context.newPage();

  if (loginMode === "api") {

    Logger.info("🚀 Using API login");

    const authApi = new AuthApi();
    const sessionService = new SessionService();

    const loginData = await authApi.login(
      process.env.EMAIL!,
      process.env.PASSWORD!
    );

    await sessionService.createSession(page, loginData.token);

  } else {

    Logger.info("🌐 Using UI login");

    const ctx = new TestContext(undefined, {
      getContext: () => context
    } as any);

    await page.goto('https://llmtoolkit-staging.innodata.com/login');

    await page.fill('input[name="email"]', process.env.EMAIL!);
    await page.fill('input[type="password"]', process.env.PASSWORD!);
    await page.click('button:has-text("Sign in")');

    await page.waitForLoadState('networkidle');

  }

  Logger.info("💾 Saving authenticated session");

  await context.storageState({
    path: 'playwright/.auth/user.json'
  });

  Logger.success("✅ Authentication setup completed");

});