import { test } from '@playwright/test';
import { userConfig } from '../../config/users.config';
import { BrowserManager } from '../../framework/browser/browserManager';
import { Authenticator } from '../../framework/auth/authenticator';
import { getConfig } from '../../config/config';

test('authenticate users', async ({ page }) => {

  const config = getConfig();

  const browser = new BrowserManager(
    page,
    config.screenshotDir
  );

  const auth = new Authenticator(browser);

  for (const user of userConfig.users) {

    await auth.login(
      user,
      'https://llmtoolkit-staging.innodata.com'
    );

    await page.context().storageState({
      path: 'playwright/.auth/user.json'
    });

  }

});