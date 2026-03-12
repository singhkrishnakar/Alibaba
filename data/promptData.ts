import { PromptConfig } from "../types/prompt.types";
import { MetadataConfig } from "../types/metadata.types";

export interface PromptTestData {
    prompt: PromptConfig;
    expectedBaseResponsesCount: number;
    frontierResponsesCount: number;
    metadata: MetadataConfig;
}

export const promptData: PromptTestData[] = [
    {
        prompt: {
            promptType: "essay",
            promptText: "Just say hi.",
            educationLevel: "Undergraduate",
            subject: "Organic Chemistry"
        },

        expectedBaseResponsesCount: 5,
        frontierResponsesCount: 10,

        metadata: {
            finalAnswer: "The answer is provided",
            solutionProcess: "Step by step process",
            thinkingProcess: "Logical reasoning applied",
            answerUnit: "N/A",
            noUnitRequired: false,
            customKnowledgePoint: "Physics"
        }
    }/*,
    {
        prompt: {
            promptType: "essay",
            promptText: "Just say bye.",
            educationLevel: "Undergraduate",
            subject: "Organic Chemistry"
        },

        expectedBaseResponsesCount: 5,
        frontierResponsesCount: 10,

        metadata: {
            finalAnswer: "The answer is provided",
            solutionProcess: "Step by step process",
            thinkingProcess: "Logical reasoning applied",
            answerUnit: "N/A",
            noUnitRequired: false,
            customKnowledgePoint: "Physics"
        }
    }*/
];