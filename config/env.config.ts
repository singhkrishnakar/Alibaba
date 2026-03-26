export interface EnvConfig {
    headless: boolean;
    baseUrl: string;
    screenshotDir: string;
}

// Read from environment variable — defaults to true for CI
// Local development: set HEADLESS=false in .env to see the browser
export const envConfig: EnvConfig = {
    headless: process.env.HEADLESS !== 'false',  // true unless explicitly set to 'false'
    baseUrl: 'https://llmtoolkit-staging.innodata.com',
    screenshotDir: './screenshots'
};
