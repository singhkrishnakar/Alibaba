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

    /**
     * Project-level feature flags.
     * modelErrorBlockingEnabled: true  → app blocks frontier/submit when model errors exist
     *                             false → app allows proceeding despite model errors
     */
    featureFlags?: ProjectFeatureFlags;

    /**
    * Response wait timeouts in milliseconds.
    * Defaults used if not provided:
    *   baseResponseTimeout:     600000  (10 min) — simple prompts
    *   frontierResponseTimeout: 600000  (10 min) — simple prompts
    * For complex prompts set up to 2400000 (40 min)
    */
    responseTimeouts?: ResponseTimeoutConfig;
}

export interface ProjectFeatureFlags {
    modelErrorBlockingEnabled: boolean;
}

export interface ResponseTimeoutConfig {
    baseResponseTimeout?: number;      // ms to wait for base responses
    frontierResponseTimeout?: number;  // ms to wait for frontier responses
}