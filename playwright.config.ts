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

        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            metadata: {
                authMode: 'ui'   // ✅ force UI login
            }
        },

        {
            name: 'ui',
            dependencies: ['setup'],
            use: {
                storageState: 'playwright/.auth/user.json'
            },
            metadata: {
                authMode: 'ui'   // ✅ UI tests
            },
            testMatch: /tests\/(project|alibaba)\/.*/
        },

        {
            name: 'api',
            metadata: {
                authMode: 'api'  // ✅ API tests
            },
            testMatch: /tests\/api\/.*/
        }

    ]

});