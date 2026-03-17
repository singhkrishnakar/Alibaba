import { test, expect } from "@playwright/test"
import { createAuthRequest } from "../../framework/core/apiClient"
import { PromptsApi } from "../../framework/api/promptsApi"

test("GET Project Prompts API", async () => {

  const apiContext = await createAuthRequest()

  const promptsApi = new PromptsApi(apiContext)

  const response = await promptsApi.getProjectPrompts(356)

  expect(response).toBeTruthy()

})