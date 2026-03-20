import { PromptTestData } from '../../types/promptTestData.type';
import { metadata } from '../metadata/metaData';
import { expectedResponse } from './expectedResponse';
import { modelResponsesCount } from '../metadata/modelResponsesCount';
import { WorkbenchMarkingConfig } from '../../types/responseMarking.type';

/**
 * All test data defined here.
 * 
 * - metadata        → field values for the prompt creation form
 * - expectedResponse → what text we expect to see in LLM responses
 * - configModelResponsesCount → how many responses each model generates (from DB config)
 * - expectedBaseResponsesCount / expectedFrontierResponsesCount → derived from config
 *   but kept as flat fields so orchestrators can access them directly
 *   without writing: testData.configModelResponsesCount.baseModelResponsesCount
 */

// Reusable preset — all correct, used when you just want to pass everything through
const allCorrect = (count: number): WorkbenchMarkingConfig => ({
    baseResponses: Object.fromEntries(
        Array.from({ length: count }, (_, i) => [i + 1, 'Correct'])
    ) as Record<number, 'Correct' | 'Incorrect'>,
    frontierResponses: Object.fromEntries(
        Array.from({ length: count }, (_, i) => [i + 1, 'Correct'])
    ) as Record<number, 'Correct' | 'Incorrect'>
});

export const promptData: PromptTestData[] = [
    {
        id: 'simpleGreeting',
        configModelResponsesCount: modelResponsesCount.reduced,
        expectedResponse: expectedResponse.simpleGreeting,
        expectedBaseResponsesCount: modelResponsesCount.reduced.baseModelResponsesCount,
        expectedFrontierResponsesCount: modelResponsesCount.reduced.frontierModelResponsesCount,
        metadata: metadata.chemistryUndergrad,

        // Mark responses 1,2,3 as Correct and 4,5 as Incorrect for base
        // Mark all frontier as Correct
        workbenchMarking: {
            baseResponses: {
                1: 'Correct',
                2: 'Incorrect'
            },
            frontierResponses: {
                3:  'Correct',
                4:  'Correct',
                5:  'Correct',
                6:  'Incorrect'
            }
        }
    },
    {
        id: 'helloPrompt',
        configModelResponsesCount: modelResponsesCount.default,
        expectedResponse: expectedResponse.helloPrompt,
        expectedBaseResponsesCount: modelResponsesCount.default.baseModelResponsesCount,
        expectedFrontierResponsesCount: modelResponsesCount.default.frontierModelResponsesCount,
        metadata: metadata.chemistryUndergrad,

        // Use the allCorrect preset — no specific marking needed
        workbenchMarking: allCorrect(
            modelResponsesCount.default.baseModelResponsesCount +
            modelResponsesCount.default.frontierModelResponsesCount
        )
    }
];