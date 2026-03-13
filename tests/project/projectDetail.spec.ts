import { test, expect } from "../../framework/fixtures/projectDetail.fixture";
import { TestContext } from "../../framework/core/TestContext";
import { ProjectDetailOrchestrator } from "../../framework/orchestrators/projectDetailOrchestration";

test.only("Project prompt validation", async ({ browserManager }) => {

    const context = new TestContext(undefined, browserManager);
    const orchestrator = new ProjectDetailOrchestrator(context);

    await orchestrator.verifyProjectLoaded("Alibaba");
    await orchestrator.searchPrompt("LLM");
    await orchestrator.verifyPromptExists("LLM");
    await orchestrator.launchWorkbench();

});