import { test } from '@playwright/test';
import { AuthManager } from '../../framework/auth/authManager';
import { UserSessionManager } from '../../framework/auth/sessionManager';
import { getConfig } from '../../config/config';

test('authenticate users', async ({ page }, testInfo) => {

  const config = getConfig();

  // ✅ FIX: define workerIndex
  const workerIndex = testInfo.workerIndex;

  await AuthManager.authenticate({
    page,
    workerIndex,
    baseUrl: config.project.baseUrl,
    testInfo
  });

  const path = UserSessionManager.getStorageStatePath(workerIndex);

  await page.context().storageState({ path });

});