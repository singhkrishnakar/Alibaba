import { request } from "@playwright/test"
import { AuthApi } from "../api/authApi"
import { Logger } from "../utils/Logger"
import { API_CONFIG } from "../../config/apiconfig"

export async function createAuthRequest() {

  Logger.info("🔐 Creating authenticated API context")

  // Step 1: Login (auth domain)
  const authContext = await request.newContext({
    baseURL: API_CONFIG.authBaseURL
  })

  const authApi = new AuthApi(authContext)
  await authApi.login()

  Logger.info("✅ Authenticated via cookies")

  // Step 2: Use same cookies for prompts domain
  const apiContext = await request.newContext({
    baseURL: API_CONFIG.promptBaseURL,
    storageState: await authContext.storageState()
  })

  return apiContext
}