import { test } from '../../framework/fixtures/alibaba.fixture';
import { RewritePromptOrchestrator } from '../../framework/orchestrators/rewritePromptOrchestrator';
import { promptData } from '../../data/prompts/promptData';

test(
    'Rewrite Prompt — edit prompt and verify new responses',
    async ({ testContext }) => {
        const orchestrator = new RewritePromptOrchestrator(testContext);

        // Original prompt — created first, run, then Rewrite is clicked
        const original = promptData.find(p => p.id === 'simpleGreeting');
        if (!original) throw new Error('Original prompt not found');

        // Rewritten prompt — filled after navigating back to creation page
        // Must be a different id so prompt text and metadata differ
        const rewritten = promptData.find(p => p.id === 'helloPrompt');
        if (!rewritten) throw new Error('Rewritten prompt not found');

        await orchestrator.run(original, rewritten);
    }
);

/**
    * ---
    ### What the full flow now covers
    Step 1  → Create original prompt (simpleGreeting) + run
    Step 2  → Wait for workbench + base responses
    Step 3  → Click Rewrite Prompt
    Step 4  → Verify navigation back to prompt creation page
    Step 5  → Verify original data auto-populated (simpleGreeting fields)
    Step 6  → Fill rewritten prompt data (helloPrompt) — smartFill overwrites changed fields
    Step 7  → Run the rewritten prompt
    Step 8  → Wait for workbench with new responses
    Step 9  → Verify responses match rewritten prompt expected response
 */