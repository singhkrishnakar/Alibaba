import { test as base } from '@playwright/test';
import { AutomationOrchestrator } from '../orchestrators/automationOrchestrator';
import { getConfig } from '../../config/config';

type Fixtures = {
  orchestrator: AutomationOrchestrator;
};

export const test = base.extend<Fixtures>({
  orchestrator: async ({}, use) => {
    const config = getConfig();
    const orchestrator = new AutomationOrchestrator(config);
    await use(orchestrator);
  }
});