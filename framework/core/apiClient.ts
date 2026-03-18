import { request } from "@playwright/test";
import { AuthApi } from "../api/authApi";
import { Logger } from "../utils/Logger";
import { API_CONFIG } from "../../config/api.config";
import { UserSessionManager } from "../auth/sessionManager";

export async function createAuthRequest(workerIndex: number = 0) {

  Logger.info("🔐 Creating authenticated API context");

  // ✅ Get user (supports single + multi mode)
  const user = UserSessionManager.getUserForWorker(workerIndex);

  // Step 1: Login (auth domain)
  const authContext = await request.newContext({
    baseURL: API_CONFIG.authBaseURL
  });

  const authApi = new AuthApi(authContext);

  const loginData = await authApi.login(user); // ✅ FIXED

  Logger.info("✅ Authenticated via cookies");

  // Step 2: Use same cookies for prompts domain
  const apiContext = await request.newContext({
    baseURL: API_CONFIG.promptBaseURL,
    storageState: loginData.storageState // ✅ cleaner
  });

  return apiContext;
}