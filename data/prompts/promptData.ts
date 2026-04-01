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
                3: 'Correct',
                4: 'Correct',
                5: 'Correct',
                6: 'Incorrect'
            }
        },
        // This test case has model error blocking enabled,
        //  so if any model errors are present, 
        // the app should block frontier/submit actions
        featureFlags: {
            modelErrorBlockingEnabled: true  // change to false if project has this disabled
        },
        responseTimeouts: {
            baseResponseTimeout: 600000,   // 10 min — simple prompt
            frontierResponseTimeout: 600000    // 10 min — simple prompt
        }
    },
    {
        id: 'helloPrompt',
        configModelResponsesCount: modelResponsesCount.reduced,
        expectedResponse: expectedResponse.helloPrompt,
        expectedBaseResponsesCount: modelResponsesCount.reduced.baseModelResponsesCount,
        expectedFrontierResponsesCount: modelResponsesCount.reduced.frontierModelResponsesCount,
        metadata: metadata.chemistryUndergrad,

        // Use the allCorrect preset — no specific marking needed
        workbenchMarking: allCorrect(
            modelResponsesCount.default.baseModelResponsesCount +
            modelResponsesCount.default.frontierModelResponsesCount
        ),
        // This test case has model error blocking enabled,
        //  so if any model errors are present, 
        // the app should block frontier/submit actions
        featureFlags: {
            modelErrorBlockingEnabled: true  // change to false if project has this disabled
        }
    },
    {
        id: 'tellAboutYourself',
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
                3: 'Correct',
                4: 'Correct',
                5: 'Correct',
                6: 'Incorrect'
            }
        },
        // This test case has model error blocking enabled,
        //  so if any model errors are present, 
        // the app should block frontier/submit actions
        featureFlags: {
            modelErrorBlockingEnabled: true  // change to false if project has this disabled
        }
    },
    {
        id: 'computeValueOfi',
        configModelResponsesCount: modelResponsesCount.reduced,
        expectedResponse: expectedResponse.computeValueOfi,
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
                3: 'Correct',
                4: 'Correct',
                5: 'Correct',
                6: 'Incorrect'
            }
        },
        // This test case has model error blocking enabled,
        //  so if any model errors are present, 
        // the app should block frontier/submit actions
        featureFlags: {
            modelErrorBlockingEnabled: true  // change to false if project has this disabled
        },
        responseTimeouts: {
            baseResponseTimeout: 1600000,  // 27 min — complex prompt
            frontierResponseTimeout: 2400000   // 40 min — very complex prompt
        }
    },
    {
        id: 'missingMarkingValidation',
        configModelResponsesCount: modelResponsesCount.reduced,
        expectedResponse: expectedResponse.simpleGreeting,
        expectedBaseResponsesCount: modelResponsesCount.reduced.baseModelResponsesCount,
        expectedFrontierResponsesCount: modelResponsesCount.reduced.frontierModelResponsesCount,
        metadata: metadata.chemistryUndergrad,

        // ─────────────────────────────────────────
        // INTENTIONALLY INCOMPLETE MARKING:
        // Only mark SOME base and frontier responses
        // This triggers the missing marking validation flows
        // ─────────────────────────────────────────
        workbenchMarking: {
            // Mark only 1st base response - leave others unmarked
            // This will trigger the Toast: "Please mark all responses..."
            baseResponses: {
                1: 'Incorrect'
                // Intentionally omit 2, 3, 4, 5 to trigger missing marking
            },
            // Mark only 1st frontier response - leave others unmarked
            // This will trigger the Modal: "Incorrect Responses Required"
            frontierResponses: {
                1: 'Correct'
                // Intentionally omit 2, 3, 4, 5, 6 to trigger missing marking
            }
        },
        // Model error blocking enabled to test full error flow
        featureFlags: {
            modelErrorBlockingEnabled: true
        },
        // Simple prompt - quick response times
        responseTimeouts: {
            baseResponseTimeout: 600000,   // 10 min
            frontierResponseTimeout: 600000    // 10 min
        }
    },
];