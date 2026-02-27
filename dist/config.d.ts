export interface UserCredentials {
    email: string;
    password: string;
}
export interface ProjectConfig {
    projectName: string;
    baseUrl: string;
    projectUrl?: string;
}
export interface PromptConfig {
    promptType: string;
    promptText: string;
    educationLevel: string;
    subject: string;
}
export interface AutomationConfig {
    credentials: UserCredentials;
    project: ProjectConfig;
    prompt: PromptConfig;
    headless: boolean;
    screenshotDir: string;
}
export declare const getConfig: () => AutomationConfig;
//# sourceMappingURL=config.d.ts.map