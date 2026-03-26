import { test } from '../../framework/fixtures/alibaba.fixture';
import { RewriteBlockedDuringRetryOrchestrator } from '../../framework/orchestrators/rewriteBlockedDuringRetryOrchestrator';
import { promptData } from '../../data/prompts/promptData';
import { PromptTestData } from '../../types/promptTestData.type';

// ─────────────────────────────────────────
// CONFIGURATION
// null → runs for all prompts
// 'simpleGreeting' → runs for one specific prompt
// ─────────────────────────────────────────

/**
    * ### What this test validates end to end
    * 1. Create prompt → Run → Navigate to workbench
    * 2. Wait for base responses to load
    * 3. Click retry on response 1
    * 4. Verify retry animation started (spinning icon)
    * 5. Click Rewrite Prompt button
    * 6. Verify error toast appears with correct message
    * 7. Verify page stayed on workbench (no navigation)
    * 8. Close toast
    * 9. Wait for retry to complete
 */
const RUN_ONLY_PROMPT_ID: string | null = 'simpleGreeting';

const selectedPrompts: PromptTestData[] = RUN_ONLY_PROMPT_ID
    ? promptData.filter(p => p.id === RUN_ONLY_PROMPT_ID)
    : promptData;

if (RUN_ONLY_PROMPT_ID && selectedPrompts.length === 0) {
    throw new Error(
        `No prompt found with id "${RUN_ONLY_PROMPT_ID}". ` +
        `Available ids: ${promptData.map(p => p.id).join(', ')}`
    );
}

for (const data of selectedPrompts) {
    test(
        `Rewrite Prompt blocked during retry: ${data.id}`,
        async ({ testContext }) => {
            const orchestrator = new RewriteBlockedDuringRetryOrchestrator(testContext);
            await orchestrator.run(data);
        }
    );
}