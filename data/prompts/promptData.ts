import { PromptTestData } from "../../types/testData.type";
import { prompts } from "./prompts";
import { metadata } from "../metadata/metaData";
import { expectedResponse } from "./expectedResponse";

export const promptData: PromptTestData[] = [

    {
        id: "helloPrompt",

        prompt: prompts.helloPrompt,

        expectedResponse: expectedResponse.simpleGreeting,

        expectedBaseResponsesCount: 5,

        expectedFrontierResponsesCount: 10,

        metadata: metadata.chemistryUndergrad
    }

];