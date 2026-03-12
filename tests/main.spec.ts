import { test } from '@playwright/test';
import { AutomationOrchestrator } from '../main';
import { promptData } from '../data/promptData';
import { getConfig } from '../config/config';

promptData.forEach((data, index) => {

  test(`LLM Prompt ${index + 1}`, async () => {

    const config = getConfig();
    const orchestrator = new AutomationOrchestrator(config);

    await orchestrator.run(data);

  });

});