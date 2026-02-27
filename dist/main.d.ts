import { AutomationConfig } from './config';
export declare class AutomationOrchestrator {
    private config;
    private browser;
    private authenticator;
    private projectSelector;
    private workbenchLauncher;
    private promptCreator;
    private responseEvaluator;
    private formHandler;
    constructor(config?: AutomationConfig);
    run(): Promise<void>;
}
//# sourceMappingURL=main.d.ts.map