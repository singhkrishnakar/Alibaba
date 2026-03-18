import { test } from '../../framework/fixtures/alibaba.fixture';
import { AlibabaE2EValidation } from '../../framework/orchestrators/alibabaE2EOrchestrator';
import { PromptTestData } from "../../types/testData.type"
import { promptData } from "../../data/prompts/promptData"


for (const [index, data] of promptData.entries()) {

  test(`LLM Prompt ${index + 1}`, async ({ testContext  }) => {

    const orchestrator = new AlibabaE2EValidation(testContext);

    await orchestrator.run(data);

  });

}