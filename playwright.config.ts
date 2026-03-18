import { defineConfig } from '@playwright/test';
import * as dotenv from "dotenv";

dotenv.config(); // ✅ Load environment variables before config

export default defineConfig({

    testDir: './tests',

    timeout: 650000,

    use: {
        headless: false
    },

    workers: 1,

    projects: [

        // Login setup (only for UI tests)
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/
        },

        // UI Tests
        {
            name: 'ui',
            dependencies: ['setup'],

            use: {
                storageState: 'playwright/.auth/user.json'
            },

            testMatch: /tests\/(project|alibaba)\/.*/
        },

        // API Tests (NO UI LOGIN)
        {
            name: 'api',
            testMatch: /tests\/api\/.*/
        }

    ]

});