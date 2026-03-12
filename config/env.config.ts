export interface EnvConfig {
    headless: boolean;
    baseUrl: string;
    screenshotDir: string;
}

export const envConfig: EnvConfig = {
    headless: false,
    baseUrl: 'https://llmtoolkit-staging.innodata.com',
    screenshotDir: './screenshots'
};
