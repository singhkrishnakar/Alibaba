import { test } from '../../framework/fixtures/alibaba.fixture';
import { AutomationOrchestrator } from '../../framework/orchestrators/alibabaPromptOrchestrator';
import { PromptTestData } from "../../types/testData.type"
import { promptData } from "../../data/prompts/promptData"
import { ResponseValidationOrchestrator } from '../../framework/orchestrators/alibabaResponseOrchestrator';


for (const [index, data] of promptData.entries()) {

  test(`LLM Prompt ${index + 1}`, async ({ testContext  }) => {

    const orchestrator = new ResponseValidationOrchestrator(testContext);

    await orchestrator.run(data);

  });

}