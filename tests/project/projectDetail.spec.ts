import { test } from "../../framework/fixtures/projectDetail.fixture";
import { ProjectDetailOrchestrator } from "../../framework/orchestrators/projectDetailOrchestration";

test("Project prompt validation", async ({ testContext }) => {

    const orchestrator = new ProjectDetailOrchestrator(testContext);

    await orchestrator.run();

});