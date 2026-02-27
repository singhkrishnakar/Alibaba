import { BrowserManager } from './browser_manager';
export declare class ResponseEvaluator {
    private browser;
    constructor(browser: BrowserManager);
    getResponseCount(): Promise<number>;
    evaluateResponse(responseIndex: number, status: 'Correct' | 'Incorrect'): Promise<boolean>;
    markAllResponsesRandom(): Promise<void>;
    markAllResponsesCorrect(): Promise<void>;
}
//# sourceMappingURL=response_evaluator.d.ts.map