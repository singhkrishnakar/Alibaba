import { test } from '../../framework/fixtures/alibaba.fixture';
import { promptData } from "../../data/prompts/promptData";
import { ValidatedWorkbechPageOrchestrator } from '../../framework/orchestrators/p2cWorkbenchValidationOrchestrator';

const selected = promptData.find(p => p.id === "tellAboutYourself");

test(`LLM Prompt: helloPrompt`, async ({ testContext }) => {

  if (!selected) throw new Error("Prompt not found");

  const orchestrator = new ValidatedWorkbechPageOrchestrator(testContext);

  await orchestrator.run(selected);

});