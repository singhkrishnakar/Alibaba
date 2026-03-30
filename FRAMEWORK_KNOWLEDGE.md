Here is the complete knowledge document for this project:

LLM Toolkit Automation Framework — Complete Knowledge Document

1. Project Overview
This is an enterprise-level Playwright + TypeScript test automation framework for an LLM (Large Language Model) evaluation platform called LLM Toolkit. The application allows users to create prompts, run them against base and frontier AI models, mark responses as correct/incorrect, and submit for review.
The framework follows Page Object Model (POM) pattern with additional service and orchestrator layers — similar to enterprise Selenium/Java/TestNG frameworks but built for Playwright/TypeScript.

2. Folder Structure
project root
│
├── .env                          ← environment variables (never committed to git)
├── playwright.config.ts          ← Playwright configuration
├── tsconfig.json                 ← TypeScript configuration
├── package.json                  ← scripts and dependencies
│
├── config/
│   ├── api.config.ts             ← API endpoint configuration
│   ├── config.ts                 ← main AutomationConfig interface
│   ├── env.config.ts             ← reads .env variables
│   ├── fileManager.config.ts     ← file download/export paths
│   ├── project.config.ts         ← project-specific config (baseUrl, projectName etc)
│   └── users.config.ts           ← user credentials config
│
├── data/
│   ├── builders/                 ← data builder patterns (future use)
│   ├── factories/                ← data factory patterns (future use)
│   ├── filters/
│   │   └── filtersData.ts        ← filter test data (date range etc)
│   ├── metadata/
│   │   ├── metaData.ts           ← form field values per test scenario
│   │   └── modelResponsesCount.ts← response count config mirroring DB config
│   └── prompts/
│       ├── expectedPromptFields.ts← ExpectedPromptFields interface
│       ├── expectedResponse.ts   ← expected LLM response text per prompt id
│       ├── promptData.ts         ← assembled PromptTestData objects
│       ├── prompts.ts            ← prompt text keyed by id
│       └── prompts.ts            ← PromptConfig objects
│
├── framework/
│   ├── api/
│   │   ├── authApi.ts            ← authentication API calls
│   │   └── promptsApi.ts         ← prompts API calls
│   ├── auth/
│   │   ├── authenticator.ts      ← handles login flow
│   │   ├── authManager.ts        ← manages auth state
│   │   └── sessionManager.ts     ← session storage per worker
│   ├── browser/
│   │   └── browserManager.ts     ← browser launch, navigation, click, fill helpers
│   ├── constants/
│   │   ├── messages.ts           ← reusable message strings
│   │   ├── promptMappings.ts     ← QUESTION_TYPE_EXPORT_MAP
│   │   └── selectors.ts          ← shared CSS selectors
│   │   └── timeouts.ts           ← timeout constants
│   ├── core/
│   │   ├── config/               ← core config helpers
│   │   ├── errors/               ← custom error classes
│   │   ├── logger/               ← logger setup
│   │   ├── session/              ← session helpers
│   │   ├── apiClient.ts          ← HTTP client wrapper
│   │   └── TestContext.ts        ← central context object (see section 4)
│   ├── fixtures/
│   │   ├── alibaba.fixture.ts    ← test fixture for e2e tests
│   │   ├── automation.fixture.ts ← base automation fixture
│   │   └── projectDetail.fixture.ts← fixture for project detail tests
│   ├── orchestrators/            ← test flow coordinators (see section 7)
│   ├── pages/                    ← page objects (see section 5)
│   ├── services/                 ← business logic services (see section 6)
│   └── utils/
│       ├── dateHelper.ts         ← date formatting helpers
│       ├── emailReporter.ts      ← sends test report emails
│       ├── logger.ts             ← Logger utility (Logger.info/error/success)
│       ├── reportParser.ts       ← reads test-results/results.json
│       ├── retryHelper.ts        ← retry logic wrapper
│       └── waitUtils.ts          ← custom wait helpers
│
├── scripts/
│   └── sendReport.ts             ← standalone script to send email report
│
├── tests/
│   ├── alibaba/                  ← e2e test specs
│   ├── api/                      ← API test specs
│   ├── auth/
│   │   └── auth.setup.ts         ← authentication setup (runs before all ui tests)
│   ├── project/                  ← project-level test specs
│   ├── prompt/                   ← prompt-level test specs
│   └── review/                   ← review and submit test specs
│
├── types/
│   ├── configModelResponsesCount.type.ts
│   ├── expectedPromptResponse.type.ts
│   ├── filterData.type.ts
│   ├── metadata.types.ts         ← MetadataConfig discriminated union
│   ├── prompt.types.ts           ← PromptConfig interface
│   ├── promptTestData.type.ts    ← PromptTestData interface
│   ├── responseMarking.type.ts   ← WorkbenchMarkingConfig
│   └── testData.type.ts          ← legacy, being replaced by promptTestData.type.ts
│
├── playwright-report/            ← generated HTML report
├── test-results/                 ← raw results including results.json
└── screenshots/                  ← custom screenshots taken during runs

3. Configuration System
How config drives tests
.env file
    ↓
config/env.config.ts reads process.env
    ↓
config/config.ts assembles AutomationConfig
    ↓
TestContext receives config in constructor
    ↓
Orchestrators access via ctx.config.project.baseUrl etc
Key config values
typescriptinterface AutomationConfig {
    headless: boolean          // from HEADLESS env var
    project: {
        baseUrl: string        // from BASE_URL env var
        projectName: string    // from PROJECT_NAME env var
        projectUrl: string     // from PROJECT_URL env var
    }
    credentials: {
        email: string          // from EMAIL env var
        password: string       // from PASSWORD env var
    }
}
playwright.config.ts key settings
typescriptuse: {
    headless: process.env.HEADLESS !== 'false'  // false locally, true in CI
}
projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },     // runs first
    { name: 'ui', dependencies: ['setup'] },              // main tests
    { name: 'api' }                                       // API tests
]
reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]  // for email reporter
]

4. TestContext — The Central Hub
TestContext is the most important class in the framework. It is the equivalent of a Spring IoC container in Java — it initializes and holds references to ALL pages, services, and managers. Every orchestrator receives a TestContext instance.
typescriptclass TestContext {
    // Infrastructure
    browser: BrowserManager
    config: AutomationConfig

    // Auth
    sessionValidator: SessionValidator

    // Navigation
    navigationService: NavigationService
    projectSelector: ProjectSelector

    // Pages
    promptCreatorPage: PromptCreatorPage
    workbenchPage: WorkbenchPage
    projectDetailPage: ProjectDetailPage
    reviewAndSubmitForm: ReviewAndSubmitForm
    dashboardKebabMenu: DashboardKebabMenu

    // Services
    promptCreatorService: PromptCreatorService
    workbenchService: WorkbenchService
    reviewFormService: ReviewFormService
    exportService: ExportService
    filterService: FilterService
    promptValidationService: PromptValidationService
    promptExportParser: PromptExportParser
    formHandler: FormHandler
}

5. Pages
Each page class extends BasePage which provides page() (protected) and inherited browser helpers.
PageFileResponsibilityBasePagebasePage.tsBase class — provides page(), inherited locator helpersPromptCreatorPagepromptCreatorPage.tsPrompt creation form — all locators and actions for creating promptsWorkbenchPageworkbenchPage.tsWorkbench — responses, radio buttons, retry, save draft, back buttonReviewAndSubmitFormreviewAndSubmitForm.tsModal after clicking Submit — review and submit flowProjectDetailPageprojectDetailPage.tsProject page — export prompts buttonDashboardKebabMenudashboardKebabMenu.tsThree-dot menu on dashboard — Launch Workbench optionFormFieldsFormFields.tsReusable scoped form component — used by both PromptCreatorPage and ReviewAndSubmitForm
Key locator patterns established
typescript// ALWAYS use get accessors for locators — fresh locator on every call
get promptTextarea() {
    return this.page().locator('div.question-textarea textarea');
}

// ALWAYS anchor on stable attributes — data-testid, semantic classes, IDs
get frontierButton() {
    return this.page().locator('button:has-text("Test on Frontier Models")');
}

// NEVER use generated hash classes as primary selector
// css-m59yro → WRONG
// data-testid="MoreVertIcon" → CORRECT

// For radio buttons — always click the LABEL span, not the hidden input
// Use page.evaluate() when CSS cannot traverse upward to parent

6. Services
Services contain business logic. They call page methods — never raw locators directly.
ServiceFileResponsibilityPromptCreatorServicepromptCreatorService.tsCreates prompts, fills all fields, verifies fields, handles essay/MC branchingWorkbenchServiceworkbenchService.tsWaits for responses, marks responses, frontier flow, retry, save draftReviewFormServicereviewFormService.tsExtends BaseFormService — handles review and submit modalBaseFormServicebaseFormService.tsAbstract base — shared fill methods (smartFill) used by both PromptCreatorService and ReviewFormServiceNavigationServicenavigationService.tsOpens dashboard, navigates between pagesProjectSelectorprojectSelector.tsNavigates to specific projectExportServiceexportService.tsVerifies exported filesFilterServicefilterService.tsApplies date range and other filtersFormHandlerformHandler.tsLegacy form filling — being replaced by ReviewFormServicePromptValidationServicepromptValidationService.tsVerifies exported prompt fields match expectedPromptExportParserpromptExportParser.tsReads and parses exported JSON filesSessionValidatorsessionManager.tsChecks if session is still valid
smartFill pattern in BaseFormService
typescript// Before filling any field, check if already prefilled correctly
// This handles review form where fields come pre-populated from prompt creation
async smartFill(locator, value, fieldName) {
    const currentValue = await locator.inputValue();
    if (currentValue === value) {
        // Already correct — skip
    } else if (currentValue && currentValue !== value) {
        // Different value — overwrite
    } else {
        // Empty — fill normally
    }
}
```

---

## 7. Orchestrators

Orchestrators coordinate the full test flow. They receive `TestContext` and call services in sequence.

| Orchestrator | Responsibility |
|---|---|
| `AlibabaE2EOrchestrator` | Full E2E — create prompt → run → wait for responses → mark → frontier → submit review |
| `PromptCreatorVerification` | Verify prompt creation page fields after creating |
| `ExportPromptOrchestrator` | Navigate to project → export → verify exported data |
| `ExportFilteredPromptsOrchestrator` | Same as above but with date filter applied |
| `RewritePromptOrchestrator` | Create → run → Rewrite Prompt → verify auto-population → fill new data → run again |
| `RewriteBlockedDuringRetryOrchestrator` | Click retry → verify rewrite blocked with error toast |
| `SaveDraftOrchestrator` | Create → run → mark responses → save draft → back → load draft → run draft → verify markings restored |
| `ValidatedWorkbenchPageOrchestrator` | Workbench page element verification — model name, marking question, retry button, view complete response |

---

## 8. Data Flow
```
prompts.ts                    → prompt text keyed by id
metaData.ts                   → form field values per scenario
modelResponsesCount.ts        → base/frontier response counts (mirrors DB config)
expectedResponse.ts           → expected LLM response text
responseMarking.type.ts       → per-response Correct/Incorrect marking map
        ↓
promptData.ts                 ← assembles everything into PromptTestData[]
        ↓
spec file                     ← selects which prompts to run (RUN_ONLY_PROMPT_ID)
        ↓
orchestrator.run(testData)    ← receives full PromptTestData
        ↓
services                      ← use testData.metadata.xxx for form fields
                                 use prompts[testData.id].promptText for prompt text
                                 use testData.workbenchMarking[index] for radio marking
Critical rule — prompt text access
typescript// NEVER — property does not exist
testData.prompt.promptText

// ALWAYS — correct pattern
const promptConfig = prompts[testData.id];
promptConfig.promptText
MetadataConfig discriminated union
typescript// Essay type — has finalAnswer only
type EssayMetadataConfig = {
    questionType: 'essay'
    finalAnswer: string
    // + shared fields
}

// Multiple Choice type — has correctAnswer and incorrectAnswers only
type MultipleChoiceMetadataConfig = {
    questionType: 'multipleChoice'
    correctAnswer: string
    incorrectAnswers: string[]
    // + shared fields
}

// Always use type guard before accessing type-specific fields
if (testData.metadata.questionType === 'essay') {
    testData.metadata.finalAnswer     // TypeScript allows this
}
```

---

## 9. Driver Initialization Flow
```
playwright.config.ts defines projects
        ↓
auth.setup.ts runs first (setup project dependency)
    → launches browser via Playwright fixture
    → logs in via UI
    → saves session to playwright/.auth/user.json
        ↓
test fixture (alibaba.fixture.ts) runs for each test
    → creates TestContext with BrowserManager
    → BrowserManager receives Page from Playwright fixture
    → TestContext initializes all pages and services
    → passes testContext to test
        ↓
test calls orchestrator.run(testData)
BrowserManager
typescript// NOT responsible for launching browser in normal flow
// Receives Page from Playwright fixture
// Provides: navigate(), click(), fill(), takeScreenshot(), waitForTimeout()

// headless is controlled by:
headless: process.env.HEADLESS !== 'false'
// false locally (.env has HEADLESS=false)
// true in CI (ci.yml sets HEADLESS=true)
```

---

## 10. Application Flow Being Tested
```
1. Dashboard → kebab menu (⋮) → Launch Workbench
2. Prompt Creation Page:
   - Select question type (Essay / Multiple Choice)
   - Fill prompt text
   - Fill Answer Unit / check No Unit
   - Fill Solution Process
   - Fill Thinking Process
   - Add Key Points (dropdown → Add → custom input → Save)
   - Select Level (React Select dropdown)
   - Select Discipline (React Select dropdown)
   - Essay only: Fill Final Answer
   - MC only: Fill Correct Answer + Incorrect Answers
   - Click Run
3. Workbench Page:
   - Wait for base model responses (configurable count, default 5)
   - Verify model name in accordion header
   - Verify marking question visible per response
   - Mark each response Correct/Incorrect (via radio labels)
   - Frontier button enables after all base responses marked
   - Click "Test on Frontier Models"
   - Wait for frontier responses (configurable count, default 10)
   - Mark frontier responses
   - Submit button enables after all frontier responses marked
4. Review and Submit Modal:
   - Fields pre-filled from prompt creation
   - smartFill skips already-correct fields
   - Click Submit
   - Wait for confirmation toast
   - Redirect back to prompt creation page
```

### Special flows tested
```
Rewrite Prompt:
  Workbench → click Rewrite → back to creation page
  → original data auto-populated → edit fields → run again → verify new responses

Save Draft:
  Workbench → mark responses → Save Draft → verify success toast
  → click Back → Exit Workbench modal → Yes, exit
  → Load Draft modal appears → Yes, load draft
  → fields loaded in disabled/read-only mode
  → Run Draft button visible → click it → workbench with saved state

Retry blocked during rewrite:
  Click retry on response → verify spinning animation
  → click Rewrite Prompt → error toast appears
  → verify page stayed on workbench

View Complete Response:
  Short responses: text fully visible in span — no button
  Long responses: truncated with "..." → View Complete Response button
  → opens modal with full text → Close button

11. Key Locator Patterns and DevTools Verification
typescript// Radio buttons — use page.evaluate() to traverse parent
await page.evaluate(({ nameIndex, status }) => {
    const inputs = Array.from(document.querySelectorAll(
        `input[name="response-original-${nameIndex}"]`
    ));
    for (const input of inputs) {
        const parent = input.parentElement;
        const labelText = parent?.querySelector('label span')?.textContent?.trim();
        if (labelText === status) {
            (parent?.querySelector('label span') as HTMLElement)?.click();
        }
    }
}, { nameIndex, status });

// Key point chips — anchor on button.remove-btn
page.locator('button.remove-btn').evaluateAll(buttons =>
    buttons.map(btn =>
        Array.from(btn.parentElement?.childNodes ?? [])
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent?.trim()).join('').trim()
    ).filter(t => t.length > 0)
);

// React Select selected value
container.locator('div[class*="singleValue"]').textContent()

// Retry button states
// Idle:     style contains "cursor: pointer" + "opacity: 1"
// Spinning: style contains "rotateIcon" + "cursor: not-allowed"
```

---

## 12. Email Reporting

### How it works
```
Tests run
    ↓
results.json generated by Playwright JSON reporter
    ↓
scripts/sendReport.ts runs after tests
    ↓
ReportParser reads test-results/results.json
    → counts passed/failed/skipped
    → collects failed test names and error messages
    ↓
EmailReporter sends via nodemailer + Gmail SMTP
    → local: attaches playwright-report/index.html to email
    → CI: includes link to GitHub Actions run
Environment variables required
bashMAIL_ENABLED=true
MAIL_USERNAME=sender@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx   # Gmail App Password
MAIL_RECIPIENT=recipient@company.com
Run commands
bash# Local — run tests then send email
npm run test:and:report

# Just send report (after tests already ran)
npm run report:send

# CI — handled automatically by ci.yml

13. CI/CD — GitHub Actions
yamlTrigger: push or PR to implementGitAction branch
Environment: Alibaba (GitHub environment with secrets)
OS: ubuntu-latest

Steps:
1. Checkout code
2. Setup Node.js 20
3. npm install
4. npx playwright install --with-deps
5. npx playwright test --project=ui (HEADLESS=true)
6. npx tsx scripts/sendReport.ts (always runs, even on failure)
7. Upload playwright-report artifact (7 day retention)
8. Upload test-results artifact (7 day retention)
```

### Secrets in GitHub (Alibaba environment)
```
BASE_URL, TEST_EMAIL, TEST_PASSWORD, PROJECT_URL, PROJECT_NAME
MAIL_USERNAME, MAIL_PASSWORD, MAIL_RECIPIENT
```

---

## 14. Naming Conventions and Rules
```
Pages:      XxxPage.ts        → locators + atomic actions only
Services:   XxxService.ts     → business logic, calls page methods
Orchestrators: XxxOrchestrator.ts → test flow coordination, calls services
Types:      xxx.type.ts       → interfaces and types
Data:       xxxData.ts        → test data objects

Rules:
- Services NEVER call page() directly — always via page methods
- Pages NEVER contain business logic
- Orchestrators NEVER contain locators
- All locators are get accessors (fresh on every call)
- Placeholder-based selectors NEVER used for verification (disappear after fill)
- Generated CSS hash classes (css-xxx) NEVER used as primary locators
- data-testid attributes ALWAYS preferred when available
- Type guards ALWAYS used before accessing discriminated union fields
```

---

## 15. Known Issues and TODOs in Codebase
```
1. formHandler.ts — legacy file, being gradually replaced by ReviewFormService
2. workbenchMenu.ts — renamed to dashboardKebabMenu.ts, old file may still exist
3. Some generated CSS classes (sc-xxx) used as locators — marked with TODO comments
   where they may be fragile
4. BaseFormService abstract methods need FormFields dependency to be cleaned up
5. ts-node → replace with tsx everywhere for ESM compatibility

Save this document as FRAMEWORK_KNOWLEDGE.md in your project root. When starting a new chat, paste this document and the assistant will have full context to continue without re-explaining the framework. Sonnet 4.6Claude is AI and can make mistakes. Please double-check responses.Share