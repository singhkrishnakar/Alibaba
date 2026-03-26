import { Page, TestInfo, request } from "@playwright/test";
import { AuthApi } from "../api/authApi";
import { Authenticator } from "./authenticator";
import { SessionService } from "../services/sessionService";
import { UserSessionManager } from "./sessionManager";
import { BrowserManager } from "../browser/browserManager";
import { API_CONFIG } from "../../config/api.config";
import { getConfig } from "../../config/config";

interface AuthOptions {
  page: Page;
  workerIndex: number;
  baseUrl: string;
  testInfo: TestInfo;
}

export class AuthManager {

  static async authenticate({ page, workerIndex, baseUrl, testInfo }: AuthOptions) {

    const user = UserSessionManager.getUserForWorker(workerIndex);

    const mode =
      testInfo.project.metadata.authMode ||
      process.env.AUTH_MODE ||
      "api";

    if (mode === "api") {

      // ✅ FIX: use proper API context (not page.request)
      const apiContext = await request.newContext({
        baseURL: API_CONFIG.authBaseURL
      });

      const authApi = new AuthApi(apiContext);
      const loginData = await authApi.login(user);

      const sessionService = new SessionService();
      await sessionService.createSession(page, loginData.token);

    } else {

      const config = getConfig();

      const browserManager = new BrowserManager(
        page,
        config.env.screenshotDir
      );

      const authenticator = new Authenticator(browserManager);
      await authenticator.login(user, baseUrl);

    }

    return user;
  }
}