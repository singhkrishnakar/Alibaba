import { PromptTestData } from "../../types/testData.type";
import { prompts } from "./prompts";
import { metadata } from "../metadata/metaData";
import { expectedResponse } from "./expectedResponse";

export const promptData: PromptTestData[] = [

    {
    id: "simpleGreeting",

    expectedResponse: expectedResponse.simpleGreeting,

    expectedBaseResponsesCount: 5,

    expectedFrontierResponsesCount: 10,

    metadata: metadata.chemistryUndergrad
},
// {
//     id: "helloPrompt",

//     expectedResponse: expectedResponse.helloPrompt,

//     expectedBaseResponsesCount: 5,

//     expectedFrontierResponsesCount: 10,

//     metadata: metadata.chemistryUndergrad
// },
// {
//     id: "modelFailingPrompt",

//     expectedResponse: expectedResponse.modelFailingPrompt,

//     expectedBaseResponsesCount: 5,

//     expectedFrontierResponsesCount: 10,

//     metadata: metadata.chemistryUndergrad
// }

];