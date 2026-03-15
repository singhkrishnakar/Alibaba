// Configuration module
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

export const getConfig = (): AutomationConfig => ({
   
    credentials: {
        email: 'pzr@innodata.com',
        password: 'Password@2029'
    },
    project: {
        projectName: 'Chem v3',
        baseUrl: 'https://llmtoolkit-staging.innodata.com',
        projectUrl: '/project/prompt/356'
    },
    prompt: {
        promptType: 'essay',
        promptText: 'hi',
        educationLevel: 'Undergraduate',
        subject: 'Organic Chemistry'
    },
    headless: false,
    screenshotDir: './screenshots'
});
