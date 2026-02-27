import { BrowserManager } from './browser_manager';
export declare class ProjectSelector {
    private browser;
    constructor(browser: BrowserManager);
    navigateToProject(projectName: string, baseUrl: string, projectUrl?: string): Promise<void>;
    /**
     * Validate session is still active
     */
    validateSession(baseUrl: string): Promise<boolean>;
}
//# sourceMappingURL=project_selector.d.ts.map