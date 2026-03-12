import { test } from '@playwright/test';
import { AutomationOrchestrator } from '../main';
import { getConfig } from '../config';

test('LLM Automation workflow', async ({}, testInfo) => {

  test.setTimeout(650_000); // 10+ minutes

  const automationConfig = getConfig();
  const orchestrator = new AutomationOrchestrator(automationConfig);

  await orchestrator.run();

});