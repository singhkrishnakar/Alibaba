import { defineConfig } from '@playwright/test';
import * as dotenv from "dotenv";

dotenv.config(); // ✅ Load environment variables before config

export default defineConfig({

    testDir: './tests',

    /**
     * TIMEOUT STRATEGY:
     * 
     * ✅ Global timeout: 2700000ms (45 minutes) = safety net for entire test
     *    - Needed because frontier responses can take up to 40 minutes
     *    - This is the MAXIMUM time a single test is allowed to run
     * 
     * ✅ Action-specific timeouts (defined in code, NOT in config):
     *    - Button clicks, waits: 10000ms (10s) — fail fast if element not found
     *    - Modal dismissals: 5000ms (5s)
     *    - Verification checks: 10000ms (10s)
     *    - Response waiting: from testData.responseTimeouts (10-40 min per response)
     * 
     * 🔧 How it works:
     *    1. If an action specifies a timeout (e.g., waitForSubmitButtonEnabled(timeout=30000))
     *       that timeout is used → action fails after 30s, not 45 min
     *    2. If an action does NOT specify a timeout, the global 2700000ms applies
     *    3. Response waits pull timeout from testData to support 40+ minute responses
     * 
     * ⚠️ CRITICAL: Always specify SHORT timeouts for quick actions!
     *    Otherwise, a stuck element will wait 45 minutes before timing out.
     *    Example: verifyNoFrontierModelErrors(10000) → 10s timeout, not 45 min
     */
    timeout: 2700000,  // 45 minutes - GLOBAL safety net, overridable per action

    use: {
        headless: process.env.HEADLESS !== 'false',  // true in CI, false locally
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

    ],
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
        // ← ADD THIS — required for ReportParser to read results
        ['json', { outputFile: 'test-results/results.json' }]
    ],

});