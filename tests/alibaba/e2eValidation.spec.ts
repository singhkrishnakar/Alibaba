import { test } from '../../framework/fixtures/alibaba.fixture';
import { AlibabaE2EValidation } from '../../framework/orchestrators/alibabaE2EOrchestrator';
import { PromptTestData } from "../../types/promptTestData.type"
import { promptData } from "../../data/prompts/promptData"

// ─────────────────────────────────────────
// CONFIGURATION
// Change this to control which prompts run:
//   null              → runs ALL prompts
//   'simpleGreeting'  → runs only that one prompt
// ─────────────────────────────────────────
const RUN_ONLY_PROMPT_ID: string | null = null;

// ─────────────────────────────────────────
// FILTER — resolves to all data or single entry
// ─────────────────────────────────────────
const selectedPrompts: PromptTestData[] = RUN_ONLY_PROMPT_ID
    ? promptData.filter(p => p.id === RUN_ONLY_PROMPT_ID)
    : promptData;

// Guard — fail fast if the requested ID does not exist in promptData
if (RUN_ONLY_PROMPT_ID && selectedPrompts.length === 0) {
    throw new Error(
        `No prompt found with id "${RUN_ONLY_PROMPT_ID}". ` +
        `Available ids: ${promptData.map(p => p.id).join(', ')}`
    );
}

// ─────────────────────────────────────────
// TESTS — one test per selected prompt
// ─────────────────────────────────────────
for (const data of selectedPrompts) {
    test.only(`LLM Prompt: ${data.id}`, async ({ testContext }) => {
        const orchestrator = new AlibabaE2EValidation(testContext);
        await orchestrator.run(data);
    });
}