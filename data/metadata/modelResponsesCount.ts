import { ConfigModelResponsesCount } from '../../types/configModelResponsesCount.type';

/**
 * These values mirror what is configured in the database.
 * When the database config changes, update here only — 
 * all test data that references this preset updates automatically.
 */
export const modelResponsesCount: Record<string, ConfigModelResponsesCount> = {
    default: {
        baseModelResponsesCount: 5,
        frontierModelResponsesCount: 10
    },
    reduced: {
        baseModelResponsesCount: 2,
        frontierModelResponsesCount: 4
    }
};