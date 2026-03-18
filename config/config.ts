import { projectConfig } from "./project.config";
import { envConfig } from "./env.config";
import { fileManager } from "./fileManager.config";

export interface AutomationConfig {
    project: {
        projectName: string;
        baseUrl: string;
        projectUrl?: string;
    };
    env: {
        headless: boolean;
        screenshotDir: string;
    };
    fileManager: {
        downloadDir: string;
    };
}

export const getConfig = (): AutomationConfig => {


    return {
        project: {
            projectName: projectConfig.projectName,
            baseUrl: envConfig.baseUrl,
            projectUrl: projectConfig.projectUrl
        },

        env: {
            headless: envConfig.headless,
            screenshotDir: envConfig.screenshotDir
        },

        fileManager: {
            downloadDir: fileManager.downloadDir
        }
    };
};