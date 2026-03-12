import { defineConfig } from '@playwright/test';

export default defineConfig({

    testDir: './tests',

    timeout: 650000,

    use: {
        headless: false
    },

    workers: 1, // run tests in parallel
    fullyParallel: true,

    projects: [

        // Setup project (runs login once)
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/
        },

        // Actual tests
        {
            name: 'chromium',
            dependencies: ['setup'],

            // use: {
            //     storageState: 'playwright/.auth/user.json'
            // }
        }

    ]

});