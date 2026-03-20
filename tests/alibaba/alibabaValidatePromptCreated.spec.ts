import { test } from '../../framework/fixtures/alibaba.fixture';
import { promptData } from "../../data/prompts/promptData";
import { PromptCreatorVerification } from '../../framework/orchestrators/alibabaPromptCreatorVerification';

const selected = promptData.find(p => p.id === "simpleGreeting");

test.only(`LLM Prompt: helloPrompt`, async ({ testContext }) => {

  if (!selected) throw new Error("Prompt not found");

  const orchestrator = new PromptCreatorVerification(testContext);

  await orchestrator.run(selected);

});