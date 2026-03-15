import { test } from '../../framework/fixtures/alibaba.fixture';
import { AutomationOrchestrator } from '../../framework/orchestrators/alibabaPromptOrchestrator';
import { PromptTestData } from "../../types/testData.type"
import { promptData } from "../../data/prompts/promptData"


for (const [index, data] of promptData.entries()) {

  test(`LLM Prompt ${index + 1}`, async ({ testContext  }) => {

    const orchestrator = new AutomationOrchestrator(testContext);

    await orchestrator.run(data);

  });

}