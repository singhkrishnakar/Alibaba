import { test } from '../../framework/fixtures/alibaba.fixture';
import { SaveDraftOrchestrator } from '../../framework/orchestrators/saveDraftOrchestrator';
import { promptData } from '../../data/prompts/promptData';
import { PromptTestData } from '../../types/promptTestData.type';

// ─────────────────────────────────────────
// CONFIGURATION
// null  → runs for ALL prompts
// 'id'  → runs for one specific prompt
// ─────────────────────────────────────────
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
    test.only(
        `Save Draft — save, go back, load draft, run: ${data.id}`,
        async ({ testContext }) => {
            const orchestrator = new SaveDraftOrchestrator(testContext);
            await orchestrator.run(data);
        }
    );
}

/**
    * ### Complete flow summary
    ```
    Step 1  → Create prompt + run
    Step 2  → Wait for workbench + base responses
    Step 3  → Verify Save Draft button ENABLED (disabled before responses)
    Step 4  → Mark all base responses
    Step 5  → Click Save Draft
    Step 6  → Click Back 
    → waits for Exit Workbench modal
    → clicks "Yes, exit"
    → waits for modal to close
    → waits for URL to change to /promptCreationWorkbench
    → waits for page load    
    Step 7  → Load Draft modal appears → click "Yes, load draft"
    Step 8  → Verify fields in disabled/read-only mode
    Step 9  → Verify "Run draft" button visible (not "Run")
    Step 10 → Verify draft data matches original prompt data
    Step 11 → Click "Run draft" → navigate to workbench
    Step 12 → Wait for workbench with saved state
    Step 13 → Verify base response markings are restored from draft 
 */
