import { APIRequestContext } from "@playwright/test";
import { Logger } from "../utils/Logger";
import { UserCredential } from "../../config/users.config";

export class AuthApi {

  constructor(private apiContext: APIRequestContext) {}

  async login(user: UserCredential) {

    Logger.info("🔑 Starting API authentication");

    const response = await this.apiContext.post("/api/v1/auth/login", {
      data: {
        email: user.email,
        password: user.password
      }
    });

    Logger.info(`📥 Response status: ${response.status()}`);

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }

    const body = await response.json();

    Logger.success("✅ API login successful");

    return {
      token: body.token,
      storageState: await this.apiContext.storageState()
    };
  }
}