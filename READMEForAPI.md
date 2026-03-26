# 📘 API Automation Framework (Playwright + TypeScript)

## 🚀 Overview

This project is an **API Automation Framework** built using **Playwright (TypeScript)**.
It supports **cookie-based authentication**, modular API structure, and scalable design suitable for enterprise-level testing.

---

## 🏗️ Framework Architecture

```
framework/
│
├── api/
│   ├── authApi.ts        # Handles authentication (login)
│   └── promptsApi.ts     # Handles prompts API
│
├── core/
│   └── apiClient.ts      # Creates authenticated API context
│
├── config/
│   └── apiConfig.ts      # Stores base URLs
│
├── utils/
│   └── Logger.ts         # Custom logging utility
│
tests/
└── api/
    └── getPrompts.spec.ts  # Sample API test
```

---

## 🌐 API Architecture

This framework works with **multiple microservices**:

| Service         | Base URL                                       |
| --------------- | ---------------------------------------------- |
| Auth Service    | https://llmtoolkit-auth-staging.innodata.com   |
| Prompts Service | https://llmtoolkit-prompt-staging.innodata.com |

---

## 🔐 Authentication Flow (Cookie-Based)

### Important:

* This system uses **cookie-based authentication**
* No token is returned in API response
* Playwright automatically stores cookies after login

### Flow:

```
Login API → Sets cookie
          ↓
Playwright stores cookie
          ↓
storageState() reused
          ↓
Authenticated API calls
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Install Playwright Browsers

```bash
npx playwright install
```

---

### 4️⃣ Configure Environment Variables

Create a `.env` file in root:

```
EMAIL=your_email
PASSWORD=your_password
```

---

## ▶️ How It Works

### Step 1: Login (`authApi.ts`)

* Sends login request
* Cookie is stored automatically

### Step 2: Create Auth Context (`apiClient.ts`)

* Creates request context with auth base URL
* Logs in
* Reuses cookies for other APIs

### Step 3: API Calls (`promptsApi.ts`)

* Uses authenticated context
* Calls prompts API

---

## 🧪 Running Tests

### Run API Tests

```bash
npx playwright test --project=api
```

---

### Run Specific Test

```bash
npx playwright test tests/api/getPrompts.spec.ts
```

---

### Run with Debug Logs

```bash
DEBUG=pw:api npx playwright test --project=api
```

---

## 📄 Sample Test

```ts
import { test, expect } from "@playwright/test"
import { createAuthRequest } from "../../framework/core/apiClient"
import { PromptsApi } from "../../framework/api/promptsApi"

test("GET Project Prompts API", async () => {

  const apiContext = await createAuthRequest()

  const promptsApi = new PromptsApi(apiContext)

  const response = await promptsApi.getProjectPrompts(356)

  expect(response).toBeTruthy()
})
```

---

## 🧠 Key Concepts Used

* Playwright `APIRequestContext`
* Cookie-based authentication
* `storageState()` for session reuse
* Modular API design
* Environment variable handling with `dotenv`

---

## ❗ Common Issues & Fixes

### 1. ❌ 401 Unauthorized

✔ Ensure cookies are reused via `storageState()`

---

### 2. ❌ Invalid URL

✔ Ensure `baseURL` is set in request context

---

### 3. ❌ Token Undefined

✔ System uses cookies, not tokens → remove token logic

---

### 4. ❌ Import Errors

✔ Ensure correct file names (e.g., `apiConfig.ts`)

---

## 🚀 Future Enhancements

* ✅ Playwright Fixtures (auto API injection)
* 🌍 Multi-environment support (dev/staging/prod)
* 📊 API schema validation
* 📈 Reporting (Allure / HTML)
* ⚙️ CI/CD integration (GitHub Actions / Jenkins)

---

## 👨‍💻 Author

Krishnakar Singh
QA Engineer | Automation | API Testing | DevOps Aspirant

---

## 🎯 Summary

This framework provides:

✔ Clean architecture
✔ Scalable API testing
✔ Real-world authentication handling
✔ Easy extensibility

---

**Happy Testing 🚀**
