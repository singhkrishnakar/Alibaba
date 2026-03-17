import * as fs from "fs/promises";
import { Logger } from "../utils/Logger";

export class ExportService {

  async verifyExport(filePath: string): Promise<void> {

    try {
      await fs.access(filePath);
      Logger.success(`Export verified: ${filePath}`);
    } catch {
      throw new Error(`Export file not found: ${filePath}`);
    }

  }
}