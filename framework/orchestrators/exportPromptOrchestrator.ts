import { TestContext } from '../core/TestContext';
import { PromptTestData } from "../../types/testData.type";
import { Logger } from '../utils/Logger';
import { AutomationConfig } from '../../config/config';

export class ExportPromptOrchestrator {

    private context: TestContext
        private config: AutomationConfig
    
        constructor(context: TestContext) {
            this.context = context
            this.config = context.config}

    async run(testData: PromptTestData): Promise<void> {

        const ctx = this.context
        const config = ctx.config

        Logger.info("⏱️ Starting LLM Export Automation")

        const start = Date.now()

        try {

            Logger.info("Validating session")

            const valid = await ctx.sessionValidator.validateSession(
                config.project.baseUrl
            )

            if (!valid) {
                throw new Error("Session expired. Run auth.setup.ts again")
            }

            Logger.info("Opening dashboard")

            await ctx.navigationService.openDashboard(
                config.project.baseUrl
            )

            Logger.info("Navigating to project")

            await ctx.projectSelector.navigateToProject(
                config.project.projectName,
                config.project.baseUrl,
                config.project.projectUrl
            )

            Logger.info("Waiting for project page")

            await ctx.projectDetailPage.waitForPageLoad()

            Logger.info("Exporting prompts")

            const filePath = await ctx.projectDetailPage.exportPrompts('json')

            await ctx.projectDetailPage.verifyExport(filePath)

            const duration = ((Date.now() - start) / 1000).toFixed(1)

            Logger.info(`Automation completed in ${duration}s`)

            await ctx.projectDetailPage.verifyPromptFields(filePath, {
                question_type: testData.metadata.questionType,
                input_text: testData.prompt.promptText,
                solution_process: testData.metadata.solutionProcess,
                thinking_process: testData.metadata.thinkingProcess,
                final_answer: testData.metadata.finalAnswer,
                knowledge_points: testData.metadata.customKnowledgePoint,
                level: testData.metadata.level,
                discipline: testData.metadata.discipline
            })

        } catch (error) {

            Logger.error("Automation failed")

            throw error
        }
    }
}