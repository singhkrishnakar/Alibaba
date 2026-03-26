import { APIRequestContext, expect } from "@playwright/test"
import { Logger } from "../utils/Logger"

export class PromptsApi {

  constructor(private apiContext: APIRequestContext) { }

  async getProjectPrompts1(projectId: number) {

    Logger.info(`📡 Fetching prompts for project: ${projectId}`)

    const response = await this.apiContext.get(
      `/api/v1/prompts/project/${projectId}?page=1&limit=10&status=1&sort_by=prompt_id&sort_direction=ASC`
    )

    Logger.info(`📥 Status: ${response.status()}`)

    expect(response.status()).toBe(200)

    return await response.json()
  }

  async getProjectPrompts(projectId: number) {

    const response = await this.apiContext.get(
      `/api/v1/prompts/project/${projectId}?page=1&limit=10&status=1&sort_by=prompt_id&sort_direction=ASC`
    )

    expect(response.status()).toBe(200)

    return await response.json()
  }
}