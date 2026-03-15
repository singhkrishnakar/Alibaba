import { PromptTestData } from "../../data/promptData";
import { PromptCreator } from "../services/promptCreator";
import { ResponseEvaluator } from "../services/responseEvaluator";
import { WorkbenchOrchestrator } from "./workbenchOrchestrator";
import { AutomationConfig, PromptConfig } from "../../config/config";
import { TestContext } from "../core/TestContext";

export class PromptOrchestrator {

    private context: TestContext
    
        constructor(context: TestContext) {
            this.context = context
        }

    async runPrompt(testData: PromptTestData) {

        const created = await this.context.promptCreator.createPrompt(testData, true);
        if (!created) throw new Error("Prompt creation failed");

        await this.context.workbenchOrchestrator.verifyUserNavigatedToWorkbench(
            this.context.config.project.baseUrl,
            testData
        );

        await this.context.workbenchOrchestrator.waitForAllResponses(
            testData.expectedBaseResponsesCount,
            600000
        );

        await this.context.workbenchOrchestrator.getAllResponses();
        await this.context.responseEvaluator.mark2Incorrect3Correct();
    }

    async createPrompt(testData: PromptTestData): Promise<void> {
        const created = await this.context.promptCreator.createPrompt(testData);
        if (!created) throw new Error('Prompt creation failed, aborting automation');
    }

    async handleResponses(testData: PromptTestData) {
        await this.context.workbenchOrchestrator.verifyUserNavigatedToWorkbench(
            this.context.config.project.baseUrl,
            testData
        );

        const allResponsesReady = await this.context.workbenchOrchestrator!.waitForAllResponses(
            testData.expectedBaseResponsesCount, 600000
        );

        if (!allResponsesReady) console.warn('⚠ Not all responses generated');

        await this.context.workbenchOrchestrator!.getAllResponses();
        await this.context.responseEvaluator.mark2Incorrect3Correct();

        const beforeFrontierCount = await this.context.workbenchOrchestrator!.getResponseCount();
        const frontierEnabled = await this.context.workbenchOrchestrator!.waitForFrontierButtonEnabled(15000);

        if (frontierEnabled) {
            const frontierReady = await this.context.workbenchOrchestrator!.testOnFrontierModels(
                testData.frontierResponsesCount, 30000
            );
            if (frontierReady) {
                await this.context.workbenchOrchestrator!.getAllFrontierResponses();
                const afterFrontierCount = await this.context.workbenchOrchestrator!.getResponseCount();
                const newResponses = afterFrontierCount - beforeFrontierCount;
                if (newResponses > 0) await this.context.responseEvaluator.mark2Incorrect3Correct(beforeFrontierCount);
            }
        }
    }


    private async executePromptFlow(testData: PromptTestData) {

        const created = await this.context.promptCreator.createPrompt(testData, true);

        if (!created) {
            throw new Error('Prompt creation failed');
        }

        await this.context.workbenchOrchestrator!.verifyUserNavigatedToWorkbench(
            this.context.config.project.baseUrl,
            testData
        );

        await this.context.workbenchOrchestrator!.waitForAllResponses(
            testData.expectedBaseResponsesCount,
            600000
        );

        await this.context.workbenchOrchestrator!.getAllResponses();

        await this.context.responseEvaluator.mark2Incorrect3Correct();
    }
}