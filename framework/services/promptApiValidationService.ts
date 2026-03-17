import { expect } from "@playwright/test";
import { Logger } from "../utils/Logger";

export class PromptApiValidationService {

  validatePromptStructure(prompt: any) {

    Logger.info("🔍 Validating prompt structure");

    expect(prompt).toHaveProperty("prompt_id");
    expect(prompt).toHaveProperty("input_text");
    expect(prompt).toHaveProperty("response_text");
    expect(prompt).toHaveProperty("status");

    expect(prompt.status).toBe("Submitted");

    Logger.success("✅ Prompt structure validated");

  }

  validateProjectMetrics(metrics: any) {

    Logger.info("📊 Validating project metrics");

    expect(metrics).toHaveProperty("total_prompts");
    expect(metrics).toHaveProperty("average_task_duration");

    Logger.success("✅ Project metrics validated");

  }

}