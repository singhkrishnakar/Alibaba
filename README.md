Playwright Automation Framework – LLM Toolkit
Overview

This repository contains an enterprise-style end-to-end automation framework built using Playwright + TypeScript.

The framework is designed to test the LLM Toolkit platform with a focus on:

Scalable test architecture

Maintainable Page Object Model

Service-based automation logic

Reusable orchestrators

Session-based authentication

API + UI automation

Clean logging and reporting

The framework separates test logic, UI interactions, services, and orchestration layers to ensure tests remain readable, stable, and easy to extend.

Framework Architecture

The framework follows a layered architecture:

tests
   ↓
fixtures
   ↓
orchestrators
   ↓
services
   ↓
pages
   ↓
browser manager
Layer Responsibilities
Layer	Responsibility
Tests	Define test scenarios
Fixtures	Provide shared test context
Orchestrators	Combine services to run flows
Services	Business logic (filters, export, validation)
Pages	UI locators and page interactions
BrowserManager	Wrapper around Playwright page
API	API interaction layer
Utils	Logging, helpers
Project Structure
framework
│
├── api
│   ├── authApi.ts
│   └── promptsApi.ts
│
├── browser
│   └── browserManager.ts
│
├── core
│   └── TestContext.ts
│
├── fixtures
│   └── projectDetail.fixture.ts
│
├── orchestrators
│   ├── exportFilteredPromptsOrchestrator.ts
│   ├── promptOrchestrator.ts
│   ├── reviewOrchestrator.ts
│   └── workbenchOrchestrator.ts
│
├── pages
│   ├── basePage.ts
│   ├── projectDetailPage.ts
│   ├── workbenchMenu.ts
│   └── workbenchPage.ts
│
├── services
│   ├── exportService.ts
│   ├── filterService.ts
│   ├── formHandler.ts
│   ├── navigationService.ts
│   ├── promptCreator.ts
│   ├── promptExportParser.ts
│   ├── promptValidationService.ts
│   ├── promptApiValidationService.ts
│   └── responseEvaluator.ts
│
├── utils
│   └── Logger.ts
│
tests
│
├── auth
│   └── auth.setup.ts
│
├── project
│   └── exportPrompt.spec.ts
│
├── api
│   └── getPrompts.spec.ts
│
data
│
├── prompts
│   └── promptData.ts
│
config
│
├── config.ts
├── users.config.ts
└── fileManager.ts
Authentication Strategy

The framework supports two authentication methods.

1️⃣ UI Login (For UI Tests)

The framework logs in once and reuses session storage.

Flow
auth.setup.ts
    ↓
UI Login
    ↓
Save session state
    ↓
playwright/.auth/user.json
    ↓
All UI tests reuse session
Benefits

Faster UI tests

No repeated login

Stable session reuse

2️⃣ API Login (For API Tests)

API tests authenticate using Auth API.

AuthApi.login()
      ↓
Get access token
      ↓
Pass token to API services
      ↓
Execute API requests

Example login endpoint:

POST https://llmtoolkit-auth-staging.innodata.com/api/v1/auth/login

Request body:

{
  "email": "...",
  "password": "..."
}
Playwright Projects

Playwright is configured with three projects.

projects
│
├── setup
├── ui
└── api
Setup Project

Runs authentication setup.

tests/auth/auth.setup.ts
UI Project

Runs UI automation tests.

Uses saved session:

playwright/.auth/user.json
API Project

Runs API tests.

Does NOT run UI login

Uses API authentication

Environment Setup

Create a .env file in the project root.

EMAIL=pzr@innodata.com
PASSWORD=Password@2029

Example structure:

Alibaba
 ├── framework
 ├── tests
 ├── playwright.config.ts
 ├── package.json
 └── .env

Environment variables are loaded using dotenv in playwright.config.ts.

Installation

Clone repository

git clone <repo>
cd Alibaba

Install dependencies

npm install

Install Playwright browsers

npx playwright install
Running Tests
Run All Tests
npx playwright test
Run UI Tests Only
npx playwright test --project=ui

This will:

setup project
   ↓
UI login
   ↓
reuse session
   ↓
run UI tests
Run API Tests Only
npx playwright test --project=api

This will:

API login
   ↓
retrieve token
   ↓
execute API requests

No browser will open.

Run Specific Test
npx playwright test tests/project/exportPrompt.spec.ts
Run Tests in Headed Mode
npx playwright test --headed
API Testing Example

Example API test:

tests/api/getPrompts.spec.ts

Flow:

API login
↓
fetch prompts
↓
validate response
↓
validate metrics

Example validation:

validator.validatePromptStructure(prompt)
validator.validateProjectMetrics(metrics)
Logging System

The framework uses a centralized Logger utility.

Log types:

Logger.info()
Logger.success()
Logger.error()

Example output:

🔑 Authenticating via API
🌐 Sending login request
📥 Response status: 200
✅ API login successful
📡 Fetching prompts
Data Driven Testing

Test data is stored in:

data/prompts/promptData.ts

Benefits:

Reusable test inputs

Clean test cases

Easier maintenance

Screenshots

Screenshots are captured automatically during key UI steps.

Stored under:

screenshots/

Examples:

login page

successful login

important UI states

Session Storage

Authenticated UI sessions are stored in:

playwright/.auth/user.json

Add to .gitignore:

playwright/.auth
Key Benefits of This Framework

✔ Modular architecture
✔ UI + API automation support
✔ Reusable services and orchestrators
✔ Clean logging system
✔ Session-based authentication
✔ Scalable enterprise architecture

Future Improvements

Possible enhancements:

API schema validation

UI vs API data validation

CI/CD integration

parallel test execution

visual regression testing

automated test reporting

Conclusion

This framework follows modern Playwright best practices and supports both UI and API automation.

The architecture ensures:

maintainability

scalability

reliability

making it suitable for enterprise-level automation suites.

If you want, I can also help you add one section that makes your README look very senior-level:

CI/CD Integration (GitHub Actions / Jenkins)

Most enterprise repos include that — and it makes the framework look production-ready.