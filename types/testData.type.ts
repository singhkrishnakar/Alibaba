import { MetadataConfig } from "./metadata.types";
import { ExpectedPromptResponse } from "./expectedPromptResponse.type";
import { prompts } from "../data/prompts/prompts";

export interface PromptTestData {
    id: keyof typeof prompts & string;
    expectedResponse: ExpectedPromptResponse;
    expectedBaseResponsesCount: number;
    expectedFrontierResponsesCount: number;
    metadata: MetadataConfig;
}