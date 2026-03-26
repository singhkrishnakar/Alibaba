import { Logger } from "../utils/Logger";
import { ExpectedPromptFields } from "../../data/prompts/expectedPromptFields";
import { QUESTION_TYPE_EXPORT_MAP } from "../constants/promptMappings";

export class PromptValidationService {

  verifyPromptFields(prompt: any, expected: ExpectedPromptFields): void {

    const actualType = this.normalize(prompt.question_type)
    const expectedType = this.normalizeQuestionType(expected.question_type)

    if (actualType !== expectedType) {
      throw new Error(`question_type mismatch`)
    }

    if (prompt.solution_process !== expected.solution_process) {
      throw new Error(`solution_process mismatch`)
    }

    if (prompt.thinking_process !== expected.thinking_process) {
      throw new Error(`thinking_process mismatch`)
    }

    if (prompt.final_answer !== expected.final_answer) {
      throw new Error(`final_answer mismatch`)
    }

    // TEMP DEBUG — remove after fixing
    console.log('Actual knowledge_points:', JSON.stringify(prompt.knowledge_points));
    console.log('Expected knowledge_points:', JSON.stringify(expected.knowledge_points));

    if (
      JSON.stringify(prompt.knowledge_points) !==
      JSON.stringify(expected.knowledge_points)
    ) {
      throw new Error(`knowledge_points mismatch`)
    }

    if (prompt.level?.name !== expected.level) {
      throw new Error(`level mismatch`)
    }

    if (prompt.discipline?.name !== expected.discipline) {
      throw new Error(`discipline mismatch`)
    }

    Logger.success("✅ Prompt fields verified successfully")
  }

  private normalize(value?: string): string {
    return value?.toLowerCase().trim() ?? ""
  }

  private normalizeQuestionType(questionType?: string): string {
    const normalized = this.normalize(questionType)
    return QUESTION_TYPE_EXPORT_MAP[normalized] ?? normalized
  }
}