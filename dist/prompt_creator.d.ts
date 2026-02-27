import { BrowserManager } from './browser_manager';
import { PromptConfig } from './config';
export declare class PromptCreator {
    private browser;
    constructor(browser: BrowserManager);
    createPrompt(config: PromptConfig): Promise<void>;
    runPrompt(): Promise<void>;
}
//# sourceMappingURL=prompt_creator.d.ts.map