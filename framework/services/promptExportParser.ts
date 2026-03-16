import * as fs from "fs/promises";
import { Logger } from "../utils/Logger";

export class PromptExportParser {

  async getPromptFromExport(
    filePath: string,
    inputText: string
  ): Promise<any> {

    Logger.info(`Reading exported prompts from: ${filePath}`);

    const fileContent = await fs.readFile(filePath, "utf-8");
    const prompts = JSON.parse(fileContent);

    if (!Array.isArray(prompts)) {
      throw new Error("Exported JSON is not an array");
    }

    const matchingPrompts = prompts.filter(
      (p: any) => p.input_text === inputText
    );

    if (matchingPrompts.length === 0) {
      throw new Error(`Prompt not found in export`);
    }

    const latestPrompt = matchingPrompts.sort(
      (a: any, b: any) => b.prompt_id - a.prompt_id
    )[0];

    return latestPrompt;
  }
}