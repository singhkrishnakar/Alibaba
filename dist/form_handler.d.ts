import { BrowserManager } from './browser_manager';
export interface MetadataConfig {
    finalAnswer: string;
    solutionProcess: string;
    thinkingProcess: string;
    keyPoints?: string;
    answerUnit?: string;
    noUnitRequired?: boolean;
}
export declare class FormHandler {
    private browser;
    constructor(browser: BrowserManager);
    fillField(fieldName: string, value: string): Promise<boolean>;
    fillMetadata(metadata: MetadataConfig): Promise<void>;
    checkNoUnitRequired(): Promise<boolean>;
    submitForm(): Promise<void>;
}
//# sourceMappingURL=form_handler.d.ts.map