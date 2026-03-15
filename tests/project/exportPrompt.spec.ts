import { test } from "../../framework/fixtures/projectDetail.fixture";
import { ExportPromptOrchestrator } from "../../framework/orchestrators/exportPromptOrchestrator";
import { PromptTestData } from "../../types/testData.type"
import { promptData } from "../../data/prompts/promptData"

test.only("Export Prompt", async ({ testContext }) => {

    const orchestrator = new ExportPromptOrchestrator(testContext);

    await orchestrator.run(promptData[0]);

});