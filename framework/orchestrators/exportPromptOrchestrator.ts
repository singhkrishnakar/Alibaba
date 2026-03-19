import { TestContext } from '../core/TestContext';
import { PromptTestData } from "../../types/testData.type";
import { Logger } from '../utils/Logger';
import { AutomationConfig } from '../../config/config';
import { prompts } from '../../data/prompts/prompts';
export class ExportPromptOrchestrator {

  private context: TestContext
  private config: AutomationConfig

  constructor(context: TestContext) {
    this.context = context
    this.config = context.config
  }

  async run(testData: PromptTestData): Promise<void> {

    const ctx = this.context
    const config = ctx.config

    Logger.info("⏱️ Starting LLM Export Automation")

    const start = Date.now()

    try {

      const valid = await ctx.sessionValidator.validateSession(
        config.project.baseUrl
      )

      if (!valid) {
        throw new Error("Session expired. Run auth.setup.ts again")
      }

      await ctx.navigationService.openDashboard(config.project.baseUrl)

      await ctx.projectSelector.navigateToProject(
        config.project.projectName,
        config.project.baseUrl,
        config.project.projectUrl
      )

      await ctx.projectDetailPage.waitForPageLoad()

      Logger.info("Exporting prompts")

      const filePath = await ctx.projectDetailPage.exportPrompts("json")
      const promptConfig = prompts[testData.id];

      await ctx.exportService.verifyExport(filePath)

      const prompt = await ctx.promptExportParser.getPromptFromExport(
        filePath,
        promptConfig.promptText
      )

      ctx.promptValidationService.verifyPromptFields(prompt, {
        question_type: testData.metadata.questionType,
        input_text: promptConfig.promptText,
        solution_process: testData.metadata.solutionProcess,
        thinking_process: testData.metadata.thinkingProcess,
        final_answer: testData.metadata.finalAnswer,
        knowledge_points: testData.metadata.knowledgePoints,
        level: testData.metadata.level,
        discipline: testData.metadata.discipline
      })

      const duration = ((Date.now() - start) / 1000).toFixed(1)

      Logger.info(`Automation completed in ${duration}s`)

    } catch (error) {

      Logger.error("Automation failed")

      throw error
    }
  }
}