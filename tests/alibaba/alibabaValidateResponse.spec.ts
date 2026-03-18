import { test } from '../../framework/fixtures/alibaba.fixture';
import { ResponseValidationOrchestrator } from "../../framework/orchestrators/alibabaResponseValidationOrchestrator";
import { promptData } from "../../data/prompts/promptData";

const selected = promptData.find(p => p.id === "helloPrompt");

test(`LLM Prompt: helloPrompt`, async ({ testContext }) => {

  if (!selected) throw new Error("Prompt not found");

  const orchestrator = new ResponseValidationOrchestrator(testContext);

  await orchestrator.run(selected);

});