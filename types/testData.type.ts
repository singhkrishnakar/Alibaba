import { PromptConfig } from "./prompt.types";
import { MetadataConfig } from "./metadata.types";
import { ExpectedPromptResponse } from "./expectedPromptResponse.type";

export interface PromptTestData {
    id: string; // 🔥 KEY (important)
    prompt: PromptConfig;
    expectedResponse: ExpectedPromptResponse;
    expectedBaseResponsesCount: number;
    expectedFrontierResponsesCount: number;
    metadata: MetadataConfig;
}