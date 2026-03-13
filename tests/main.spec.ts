import { test } from '@playwright/test';
import { AutomationOrchestrator } from '../framework/orchestrators/automationOrchestrator';
import { promptData } from '../data/promptData';
import { getConfig } from '../config/config';

for (const [index, data] of promptData.entries()) {

  test(`LLM Prompt ${index + 1}`, async () => {

    const config = getConfig();
    const orchestrator = new AutomationOrchestrator(config);

    await orchestrator.run(data);

  });

};