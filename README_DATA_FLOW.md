```

---

### Now let me create the data flow diagram you asked for
```
DATA FLOW: From Test Data Definition → Spec File → Orchestrator → Services
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│  DATA LAYER  (define once, reuse everywhere)                        │
│                                                                     │
│  data/prompts/prompts.ts                                            │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  prompts['simpleGreeting'].promptText = "Just say hi"│           │
│  │  prompts['helloPrompt'].promptText    = "Hello..."   │           │
│  └─────────────────────────────────────────────────────┘           │
│            ↑ accessed via prompts[testData.id]                      │
│                                                                     │
│  data/metadata/metaData.ts                                          │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  metadata['chemistryUndergrad'] = {                 │           │
│  │      questionType, finalAnswer, solutionProcess,    │           │
│  │      thinkingProcess, level, discipline, ...        │           │
│  │  }                                                  │           │
│  └─────────────────────────────────────────────────────┘           │
│            ↑ accessed via testData.metadata.xxx                     │
│                                                                     │
│  data/metadata/modelResponsesCount.ts                               │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  modelResponsesCount['default'] = {                 │           │
│  │      baseModelResponsesCount:     5,                │           │
│  │      frontierModelResponsesCount: 10                │           │
│  │  }                                                  │           │
│  └─────────────────────────────────────────────────────┘           │
│            ↑ accessed via testData.configModelResponsesCount.xxx    │
│                                                                     │
│  data/prompts/expectedResponse.ts                                   │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  expectedResponse['simpleGreeting'] = {             │           │
│  │      expectedResponseText: "hi"                     │           │
│  │  }                                                  │           │
│  └─────────────────────────────────────────────────────┘           │
│            ↑ accessed via testData.expectedResponse.xxx             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ASSEMBLY LAYER  (combine all data into one object per test case)   │
│                                                                     │
│  data/prompts/promptData.ts                                         │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  export const promptData: PromptTestData[] = [      │           │
│  │    {                                                │           │
│  │      id: 'simpleGreeting',          ← links to prompts file     │
│  │      metadata: metadata.chemistryUndergrad,         │           │
│  │      expectedResponse: expectedResponse.simpleGreeting,         │
│  │      configModelResponsesCount: modelResponsesCount.default,    │
│  │      expectedBaseResponsesCount: 5,                 │           │
│  │      expectedFrontierResponsesCount: 10,            │           │
│  │      workbenchMarking: { baseResponses: {...}, ... }│           │
│  │    }                                                │           │
│  │  ]                                                  │           │
│  └─────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  SPEC FILE  (selects which test data to run)                        │
│                                                                     │
│  tests/alibaba/alibabaE2EValidation.spec.ts                         │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  const RUN_ONLY_PROMPT_ID = null  ← null = run all  │           │
│  │                                                      │           │
│  │  for (const data of selectedPrompts) {              │           │
│  │    test(`LLM Prompt: ${data.id}`, async () => {     │           │
│  │      await orchestrator.run(data)  ← pass testData  │           │
│  │    })                                               │           │
│  │  }                                                  │           │
│  └─────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR  (receives testData, coordinates services)            │
│                                                                     │
│  framework/orchestrators/alibabaE2EOrchestrator.ts                  │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  async run(testData: PromptTestData) {              │           │
│  │                                                      │           │
│  │    // Prompt text — from prompts file via id        │           │
│  │    const promptConfig = prompts[testData.id]        │           │
│  │    promptConfig.promptText  ← "Just say hi."        │           │
│  │                                                      │           │
│  │    // Form fields — from testData.metadata          │           │
│  │    testData.metadata.level        ← "Undergraduate" │           │
│  │    testData.metadata.discipline   ← "Org Chemistry" │           │
│  │                                                      │           │
│  │    // Response counts — from configModelResponsesCount          │
│  │    testData.expectedBaseResponsesCount     ← 5      │           │
│  │    testData.expectedFrontierResponsesCount ← 10     │           │
│  │                                                      │           │
│  │    // Marking config — from workbenchMarking        │           │
│  │    testData.workbenchMarking.baseResponses[1] ← 'Correct'      │
│  │  }                                                  │           │
│  └─────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  SERVICES & PAGES  (use specific fields from testData)              │
│                                                                     │
│  promptCreatorService   → testData.metadata.xxx (form fields)       │
│  workbenchService       → testData.expectedBaseResponsesCount       │
│                           testData.workbenchMarking.baseResponses   │
│  reviewFormService      → testData.metadata.xxx (same fields)       │
│  promptValidationService→ testData.metadata.xxx + promptConfig.text │
│  exportService          → promptConfig.promptText (from prompts[id])│
└─────────────────────────────────────────────────────────────────────┘

KEY RULE — WHERE DOES PROMPT TEXT COME FROM?
════════════════════════════════════════════
  NEVER:  testData.prompt.promptText        ← does not exist
  ALWAYS: prompts[testData.id].promptText   ← correct pattern

  Reason: prompt text is stored separately in prompts.ts
  and linked to testData only through the shared 'id' key.
  This keeps prompt text and test configuration decoupled —
  you can change prompt text without touching test data and vice versa.



  Here is the updated `README_DATA_FLOW.md`:

```markdown
# DATA FLOW: From Test Data Definition → Spec File → Orchestrator → Services

## Overview

Test data flows through 4 layers before reaching the browser actions.
Each layer has a single responsibility — define, assemble, select, execute.

---

## Layer 1 — DATA LAYER (define once, reuse everywhere)

### `data/prompts/prompts.ts`
Stores prompt text keyed by a string ID.
```typescript
prompts['simpleGreeting'].promptText = "Just say hi."
prompts['helloPrompt'].promptText    = "Hello what you can do?"
```
> ⚠️ NEVER access prompt text via `testData.prompt.promptText` — it does not exist.
> ALWAYS use `prompts[testData.id].promptText`

---

### `data/metadata/metaData.ts`
Stores form field values per test scenario.
Question type determines which fields are present — enforced by TypeScript at compile time.

```typescript
// Essay preset — has finalAnswer, NO correctAnswer or incorrectAnswers
metadata['chemistryUndergrad'] = {
    questionType:    'essay',             // ← discriminator
    finalAnswer:     'The answer...',     // essay only
    solutionProcess: 'Step by step...',
    thinkingProcess: 'Logical reasoning...',
    answerUnit:      'N/A',
    noUnitRequired:  false,
    knowledgePoints: ['Physics'],
    level:           'Undergraduate',
    discipline:      'Organic Chemistry'
}

// Multiple Choice preset — has correctAnswer + incorrectAnswers, NO finalAnswer
metadata['chemistryUndergradMC'] = {
    questionType:     'multipleChoice',   // ← discriminator
    correctAnswer:    'H2O',              // MC only
    incorrectAnswers: ['CO2', 'NaCl'],    // MC only
    solutionProcess:  'Step by step...',
    thinkingProcess:  'Logical reasoning...',
    answerUnit:       '',
    noUnitRequired:   true,
    knowledgePoints:  ['Chemistry'],
    level:            'Undergraduate',
    discipline:       'Organic Chemistry'
}
```

---

### `data/metadata/modelResponsesCount.ts`
Mirrors database configuration for how many responses each model generates.
Change here only — all test data referencing this preset updates automatically.

```typescript
modelResponsesCount['default'] = {
    baseModelResponsesCount:     5,
    frontierModelResponsesCount: 10
}
modelResponsesCount['reduced'] = {
    baseModelResponsesCount:     3,
    frontierModelResponsesCount: 6
}
```

---

### `data/prompts/expectedResponse.ts`
Stores what text we expect to see in LLM responses.

```typescript
expectedResponse['simpleGreeting'] = { expectedResponseText: "hi" }
expectedResponse['helloPrompt']    = { expectedResponseText: "Hello" }
```

---

## Layer 2 — TYPE LAYER (TypeScript enforces correct shape)

### `types/metadata.types.ts`
Uses a **discriminated union** — `questionType` is the discriminator.
TypeScript narrows the type automatically inside `if` blocks.

```
MetadataConfig (union type)
       │
       ├── EssayMetadataConfig
       │       questionType: 'essay'        ← literal type string
       │       finalAnswer:  string         ← ONLY available for essay
       │       + all base fields (solutionProcess, thinkingProcess,
       │                          answerUnit, noUnitRequired,
       │                          knowledgePoints, discipline, level)
       │
       └── MultipleChoiceMetadataConfig
               questionType:     'multipleChoice'  ← literal type string
               correctAnswer:    string            ← ONLY available for MC
               incorrectAnswers: string[]          ← ONLY available for MC
               + all base fields (same as above)
```

**How TypeScript protects you:**
```typescript
if (testData.metadata.questionType === 'essay') {
    testData.metadata.finalAnswer    // ✅ TypeScript knows this exists
    testData.metadata.correctAnswer  // ❌ Compile error — not on EssayMetadataConfig
} else {
    testData.metadata.correctAnswer  // ✅ TypeScript knows this exists
    testData.metadata.finalAnswer    // ❌ Compile error — not on MultipleChoiceMetadataConfig
}
```

### `types/promptTestData.type.ts`
The assembled test data shape passed to every orchestrator.

```typescript
interface PromptTestData {
    id:                           keyof typeof prompts & string
    configModelResponsesCount:    ConfigModelResponsesCount
    expectedResponse:             ExpectedPromptResponse
    expectedBaseResponsesCount:   number
    expectedFrontierResponsesCount: number
    metadata:                     MetadataConfig        // ← union type
    workbenchMarking?:            WorkbenchMarkingConfig // ← optional
}
```

### `types/responseMarking.type.ts`
Controls which response gets marked Correct or Incorrect on the workbench.

```typescript
type ResponseMarkingMap = Record<number, 'Correct' | 'Incorrect'>

interface WorkbenchMarkingConfig {
    baseResponses:     ResponseMarkingMap  // key = response-original-N index
    frontierResponses: ResponseMarkingMap  // key = response-frontier-N index
}
```

---

## Layer 3 — ASSEMBLY LAYER (combine all data into one object per test case)

### `data/prompts/promptData.ts`

```typescript
export const promptData: PromptTestData[] = [
    {
        id: 'simpleGreeting',                              // links to prompts.ts
        metadata: metadata.chemistryUndergrad,             // essay type
        expectedResponse: expectedResponse.simpleGreeting,
        configModelResponsesCount: modelResponsesCount.default,
        expectedBaseResponsesCount:     5,                 // derived from config
        expectedFrontierResponsesCount: 10,                // derived from config
        workbenchMarking: {
            baseResponses:     { 1:'Correct', 2:'Correct', 3:'Correct', 4:'Incorrect', 5:'Incorrect' },
            frontierResponses: { 6:'Correct', 7:'Correct', 8:'Correct', 9:'Incorrect', 10:'Correct',
                                 11:'Correct', 12:'Correct', 13:'Incorrect', 14:'Correct', 15:'Correct' }
        }
    },
    {
        id: 'helloPrompt',
        metadata: metadata.chemistryUndergradMC,           // multiple choice type
        expectedResponse: expectedResponse.helloPrompt,
        configModelResponsesCount: modelResponsesCount.default,
        expectedBaseResponsesCount:     5,
        expectedFrontierResponsesCount: 10,
        workbenchMarking: allCorrect(15)                   // helper preset
    }
]
```

---

## Layer 4 — SPEC FILE (selects which prompts to run)

### `tests/alibaba/alibabaE2EValidation.spec.ts`

```typescript
const RUN_ONLY_PROMPT_ID: string | null = null
//  null              → runs ALL prompts in promptData
//  'simpleGreeting'  → runs only that one prompt

for (const data of selectedPrompts) {
    test(`LLM Prompt: ${data.id}`, async ({ testContext }) => {
        await orchestrator.run(data)   // passes full PromptTestData object
    })
}
```

**CLI override — no file change needed:**
```bash
npx playwright test --grep "simpleGreeting"   # run one prompt
npx playwright test --grep "helloPrompt"      # run another
npx playwright test                           # run all
```

---

## Layer 5 — ORCHESTRATOR (coordinates services using testData)

### `framework/orchestrators/alibabaE2EOrchestrator.ts`

```typescript
async run(testData: PromptTestData) {

    // ── Prompt text ──────────────────────────────────────────────────
    // From prompts.ts via testData.id — NEVER from testData.prompt
    const promptConfig = prompts[testData.id]
    promptConfig.promptText                        // "Just say hi."

    // ── Form fields ──────────────────────────────────────────────────
    testData.metadata.level                        // "Undergraduate"
    testData.metadata.discipline                   // "Organic Chemistry"
    testData.metadata.solutionProcess              // "Step by step process"

    // ── Question type branching ──────────────────────────────────────
    if (testData.metadata.questionType === 'essay') {
        testData.metadata.finalAnswer              // only accessible here
    } else {
        testData.metadata.correctAnswer            // only accessible here
        testData.metadata.incorrectAnswers         // only accessible here
    }

    // ── Response counts ──────────────────────────────────────────────
    testData.expectedBaseResponsesCount            // 5
    testData.expectedFrontierResponsesCount        // 10
    testData.configModelResponsesCount.baseModelResponsesCount  // 5

    // ── Workbench marking ────────────────────────────────────────────
    testData.workbenchMarking?.baseResponses[1]    // 'Correct'
    testData.workbenchMarking?.baseResponses[4]    // 'Incorrect'
}
```

---

## Layer 6 — SERVICES & PAGES (use specific fields from testData)

```
Service                  → Fields used from testData
─────────────────────────────────────────────────────────────────────
promptCreatorService     → metadata.questionType (branching)
                           metadata.solutionProcess, thinkingProcess
                           metadata.level, discipline
                           metadata.knowledgePoints, answerUnit
                           essay:  metadata.finalAnswer
                           MC:     metadata.correctAnswer, incorrectAnswers
                           prompts[id].promptText

workbenchService         → expectedBaseResponsesCount
                           expectedFrontierResponsesCount
                           configModelResponsesCount.baseModelResponsesCount
                           workbenchMarking.baseResponses[N]
                           workbenchMarking.frontierResponses[N]

reviewFormService        → metadata.solutionProcess, thinkingProcess
                           metadata.level, discipline
                           metadata.knowledgePoints, answerUnit
                           essay:  metadata.finalAnswer
                           MC:     metadata.correctAnswer, incorrectAnswers

promptValidationService  → metadata.questionType, solutionProcess
                           metadata.thinkingProcess, finalAnswer
                           metadata.knowledgePoints, level, discipline
                           prompts[id].promptText  (as input_text)

exportService            → prompts[id].promptText  (to find prompt in export)
```

---

## KEY RULES — Quick Reference

```
❌ NEVER:  testData.prompt.promptText
✅ ALWAYS: prompts[testData.id].promptText

❌ NEVER:  testData.metadata.finalAnswer        (outside essay type guard)
✅ ALWAYS: if (metadata.questionType === 'essay') { metadata.finalAnswer }

❌ NEVER:  testData.metadata.correctAnswer      (outside MC type guard)
✅ ALWAYS: if (metadata.questionType === 'multipleChoice') { metadata.correctAnswer }

❌ NEVER:  hardcode response counts like 5 or 10
✅ ALWAYS: testData.expectedBaseResponsesCount
           testData.configModelResponsesCount.baseModelResponsesCount

❌ NEVER:  hardcode 'Correct' for all responses
✅ ALWAYS: testData.workbenchMarking?.baseResponses[index] ?? defaultStatus
```

---

## Complete Data Flow Diagram

```
prompts.ts          ──┐
                      │  id key joins them
metaData.ts         ──┤
                      ├──→ promptData.ts ──→ spec file ──→ orchestrator ──→ services ──→ pages ──→ browser
modelResponsesCount ──┤        (assembly)    (selection)   (coordination)  (business    (locators
                      │                                                      logic)       + actions)
expectedResponse.ts ──┤
                      │
responseMarking.ts  ──┘
```

---

## CRITICAL: Passing Complex Prompts with LaTeX

### The Problem
When passing prompts containing LaTeX with escape sequences (like `\begin{cases}`, `\int`, etc.), the browser incorrectly interprets the escaping during text entry, resulting in:

❌ **WRONG** (what happens without proper escaping):
```
Compute the value of $I$ from the system
$$
S: \begin{cases}
I+J = \int_0^1 ...
```

✅ **CORRECT** (what the app expects):
```
Compute the value of $I$ from the system\n$$\nS: \\begin{cases}\nI+J = \\int_0^1 ...
```

### Solution: Double-Escape in `data/prompts/prompts.ts`

When defining complex prompts with LaTeX, apply extra escaping:

```typescript
// WRONG — browser will interpret \n as newline, \\ as single backslash
computeValueOfi: {
    promptText: "Compute the value of $I$...\n$$\nS: \\begin{cases}..."
}

// CORRECT — browser receives literal \n and \\begin which LaTeX can interpret
computeValueOfi: {
    promptText: "Compute the value of $I$...\\n$$\\nS: \\\\begin{cases}..."
}
```

### Mapping Examples

| What you want in app | What to write in prompts.ts | Reason |
|---|---|---|
| Literal newline in LaTeX formula | `\\n` | `\` + `n` stays as 2 characters, then interpreted by LaTeX |
| Literal backslash before `begin` | `\\\\` | `\` + `\` + `b` + `e` + ... → LaTeX sees `\\begin` |
| Literal double backslash `\\\\` | `\\\\\\\\` | Each `\\` becomes `\` after JavaScript parsing |

### Implementation in `promptCreatorPage.fillPrompt()`

The framework uses direct DOM manipulation + React event dispatch:

```typescript
async fillPrompt(text: string): Promise<void> {
    // Set value directly on textarea element
    await page.evaluate((value: string) => {
        const textarea = document.querySelector('div.question-textarea textarea');
        textarea.value = value;
        
        // Dispatch React events so React state updates
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }, text);
}
```

This approach:
1. Bypasses Playwright's character-by-character typing (which escapes special chars)
2. Preserves exact string as defined in prompts.ts
3. Triggers React's onChange so the component state updates

### Debug Output

When adding complex prompts, check the debug logs:

```
[DEBUG] Input text length: 360 chars
[DEBUG] Textarea maxLength: -1  (no char limit)
[DEBUG] Final textarea value length: 360 chars
[DEBUG] Final value ends with: "$$"  ✓ Full text entered
```

If "Final textarea value length: 0", the text didn't enter — check:
1. Is the textarea selector correct?
2. Are React events properly dispatched?
3. Is there a character limit on the textarea?

### Validation

After prompt entry, validation runs to ensure mandatory fields are filled:

```typescript
async getAllValidationErrors(): Promise<string[]> {
    const promptValue = await this.promptTextarea.inputValue();
    if (!promptValue || promptValue.trim() === '') {
        errors.push('Prompt: Question is required');
    }
    // Also check Level and Discipline dropdowns
}
```

This catches empty prompts **before** attempting to run, preventing silent failures.

---

## Test Timeout Configuration

For complex prompts that require long LLM processing times, ensure `playwright.config.ts` has sufficient timeout:

```typescript
// Default: 650000ms (10.8 minutes) — TOO SHORT for complex prompts
// Recommended: 2700000ms (45 minutes) — handles 40min frontier responses + buffer
timeout: 2700000
```

If your test data specifies:
```typescript
responseTimeouts: {
    baseResponseTimeout: 1200000,    // 20 min
    frontierResponseTimeout: 2400000  // 40 min
}
```

Then Playwright timeout must be **greater than** the sum of all timeouts plus buffer.

Save this as `README_DATA_FLOW.md` in your project root — it now reflects the discriminated union type change, the workbench marking config, and all the key rules built up through this session.