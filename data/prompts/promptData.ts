import { PromptTestData } from "../../types/testData.type";
import { prompts } from "./prompts";
import { metadata } from "../metadata/metaData";

export const promptData: PromptTestData[] = [

    {
        prompt: prompts.simpleGreeting,
        expectedBaseResponsesCount: 5,
        frontierResponsesCount: 10,
        metadata: metadata.chemistryUndergrad
    }

];