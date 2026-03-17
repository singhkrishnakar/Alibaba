import { test } from "../../framework/fixtures/projectDetail.fixture";
import { ExportPromptsOrchestrator } from "../../framework/orchestrators/exportFilteredPromptsOrchestrator";
import { promptData } from "../../data/prompts/promptData";

test.describe("Export Prompts Tests", () => {

    test("Export Prompt without filter", async ({ testContext }) => {
        const orchestrator = new ExportPromptsOrchestrator(testContext);
        await orchestrator.run(promptData[0]);
    });

    test.only("Export Prompt with date filter", async ({ testContext }) => {

        const orchestrator = new ExportPromptsOrchestrator(testContext);

        const today = new Date();
        const startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        const endDate = today.toISOString().split("T")[0];

        await orchestrator.run(promptData[0], {
            filterByDateRange: { startDate, endDate }
        });

    });
});