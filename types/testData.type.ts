import { PromptConfig } from "./prompt.types";
import { MetadataConfig } from "./metadata.types";

export interface PromptTestData {
    prompt: PromptConfig;
    expectedBaseResponsesCount: number;
    frontierResponsesCount: number;
    metadata: MetadataConfig;
}