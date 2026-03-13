import { test } from '@playwright/test';
import { promptData } from '../../data/promptData';
import { AutomationOrchestrator } from '../../framework/orchestrators/automationOrchestrator';

for (const data of promptData) {

    // test(`Prompt Test: ${data.prompt.promptText}`, async () => {

    //     const orchestrator = new AutomationOrchestrator();

    //     await orchestrator.run(data);

    // });

}