import { MetadataConfig } from './metadata.types';
import { ExpectedPromptResponse } from './expectedPromptResponse.type';
import { ConfigModelResponsesCount } from './configModelResponsesCount.type';
import { prompts } from '../data/prompts/prompts';
import { WorkbenchMarkingConfig } from './responseMarking.type';

export interface PromptTestData {
    id: keyof typeof prompts & string;

    /**
     * Drives expectedBaseResponsesCount and expectedFrontierResponsesCount.
     * Source of truth for how many responses each model type should generate.
     * Mirrors the database configuration.
     */
    configModelResponsesCount: ConfigModelResponsesCount;

    expectedResponse: ExpectedPromptResponse;

    /**
     * Derived from configModelResponsesCount — kept for backward compatibility
     * and for direct access in tests without drilling into the config object.
     */
    expectedBaseResponsesCount: number;
    expectedFrontierResponsesCount: number;

    metadata: MetadataConfig;

    // How to mark each response on the workbench
    // If not provided, all responses will be marked as 'Correct' by default
    workbenchMarking?: WorkbenchMarkingConfig;

}