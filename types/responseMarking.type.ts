/**
 * Defines how each response should be marked on the workbench.
 * Key is the response name index (1-based, matches DOM name="response-original-N").
 * Value is the expected marking status.
 * 
 * Example:
 *   { 1: 'Correct', 2: 'Incorrect', 3: 'Correct', 4: 'Correct', 5: 'Incorrect' }
 */
export type ResponseMarkingMap = Record<number, 'Correct' | 'Incorrect'>;

export interface WorkbenchMarkingConfig {
    baseResponses: ResponseMarkingMap;
    frontierResponses: ResponseMarkingMap;
}