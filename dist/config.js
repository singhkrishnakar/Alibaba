"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const getConfig = () => ({
    credentials: {
        email: 'pzr@innodata.com',
        password: 'Password@2027'
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
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map