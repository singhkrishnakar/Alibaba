import { PromptTestData } from "../../data/promptData";
import { PromptCreator } from "../services/promptCreator";
import { ResponseEvaluator } from "../services/responseEvaluator";
import { WorkbenchOrchestrator } from "./workbenchOrchestrator";
import { AutomationConfig, PromptConfig } from "../../config/config";

export class PromptOrchestrator {

    constructor(
        private promptCreator: PromptCreator,
        private workbenchOrchestrator: WorkbenchOrchestrator,
        private responseEvaluator: ResponseEvaluator,
        private config: AutomationConfig,
    ) { }

    async runPrompt(testData: PromptTestData) {

        const created = await this.promptCreator.createPrompt(testData.prompt, true);
        if (!created) throw new Error("Prompt creation failed");

        await this.workbenchOrchestrator.verifyUserNavigatedToWorkbench(
            this.config.project.baseUrl,
            testData
        );

        await this.workbenchOrchestrator.waitForAllResponses(
            testData.expectedBaseResponsesCount,
            600000
        );

        await this.workbenchOrchestrator.getAllResponses();
        await this.responseEvaluator.mark2Incorrect3Correct();
    }

    // async createPrompt(testData: PromptTestData) {
    //     const created = await this.promptCreator.createPrompt(testData, true);
    //     if (!created) throw new Error('Prompt creation failed, aborting automation');
    // }

    async createPrompt(promptConfig: PromptConfig): Promise<void> {
        const created = await this.promptCreator.createPrompt(promptConfig);
        if (!created) throw new Error('Prompt creation failed, aborting automation');
    }

    async handleResponses(testData: PromptTestData) {
        await this.workbenchOrchestrator.verifyUserNavigatedToWorkbench(
            this.config.project.baseUrl,
            testData
        );

        const allResponsesReady = await this.workbenchOrchestrator!.waitForAllResponses(
            testData.expectedBaseResponsesCount, 600000
        );

        if (!allResponsesReady) console.warn('⚠ Not all responses generated');

        await this.workbenchOrchestrator!.getAllResponses();
        await this.responseEvaluator.mark2Incorrect3Correct();

        const beforeFrontierCount = await this.workbenchOrchestrator!.getResponseCount();
        const frontierEnabled = await this.workbenchOrchestrator!.waitForFrontierButtonEnabled(15000);

        if (frontierEnabled) {
            const frontierReady = await this.workbenchOrchestrator!.testOnFrontierModels(
                testData.frontierResponsesCount, 30000
            );
            if (frontierReady) {
                await this.workbenchOrchestrator!.getAllFrontierResponses();
                const afterFrontierCount = await this.workbenchOrchestrator!.getResponseCount();
                const newResponses = afterFrontierCount - beforeFrontierCount;
                if (newResponses > 0) await this.responseEvaluator.mark2Incorrect3Correct(beforeFrontierCount);
            }
        }
    }


    private async executePromptFlow(testData: PromptTestData) {

        const created = await this.promptCreator.createPrompt(testData.prompt, true);

        if (!created) {
            throw new Error('Prompt creation failed');
        }

        await this.workbenchOrchestrator!.verifyUserNavigatedToWorkbench(
            this.config.project.baseUrl,
            testData
        );

        await this.workbenchOrchestrator!.waitForAllResponses(
            testData.expectedBaseResponsesCount,
            600000
        );

        await this.workbenchOrchestrator!.getAllResponses();

        await this.responseEvaluator.mark2Incorrect3Correct();
    }
}