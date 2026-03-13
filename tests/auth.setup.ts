import { test } from '@playwright/test';
import { userConfig } from '../config/users.config';
import { BrowserManager } from '../framework/browser/browserManager';
import { Authenticator } from '../framework/auth/authenticator';

test('authenticate users', async () => {

  for (let i = 0; i < userConfig.users.length; i++) {

    const browser = new BrowserManager();
    await browser.launch(false);

    const auth = new Authenticator(browser);

    await auth.login(
      userConfig.users[i],
      'https://llmtoolkit-staging.innodata.com'
    );

    // await browser.getContext().storageState({
    //   path: `playwright/.auth/user${i}.json`
    // });


    await browser.getContext().storageState({
      path: 'playwright/.auth/user.json'
    });

    await browser.close();
  }

});