import { APIRequestContext } from "@playwright/test"
import { Logger } from "../utils/Logger"

export class AuthApi {

  constructor(private apiContext: APIRequestContext) {}

  async login() {

    Logger.info("🔑 Starting API authentication")

    const response = await this.apiContext.post("/api/v1/auth/login", {
      data: {
        email: process.env.EMAIL,
        password: process.env.PASSWORD
      }
    })

    Logger.info(`📥 Response status: ${response.status()}`)

    const body = await response.json()

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`)
    }

    Logger.success("✅ API login successful")

    // ❌ NO TOKEN RETURN
  }
}