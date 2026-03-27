import * as fs from 'fs';
import * as path from 'path';
import { TestSummary, FailedTest } from './emailReporter';

export class ReportParser {

    /**
     * Reads Playwright JSON results and builds TestSummary.
     * Requires reporter: [['json', { outputFile: 'test-results/results.json' }]]
     * in playwright.config.ts
     */
    static parseResults(): TestSummary {
        const resultsPath = path.join(
            process.cwd(), 'test-results', 'results.json'
        );

        if (!fs.existsSync(resultsPath)) {
            console.warn('  ⚠ results.json not found — using empty summary');
            return {
                passed: 0, failed: 0, skipped: 0,
                total: 0, duration: 'N/A',
                failures: [],
                runMode: process.env.CI === 'true' ? 'ci' : 'local'
            };
        }

        const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const failures: FailedTest[] = [];
        let totalDurationMs = 0;

        for (const suite of raw.suites ?? []) {
            for (const spec of suite.specs ?? []) {
                for (const test of spec.tests ?? []) {
                    totalDurationMs += test.results?.[0]?.duration ?? 0;

                    if (test.status === 'expected') passed++;
                    else if (test.status === 'skipped') skipped++;
                    else {
                        failed++;
                        const errorMessage = test.results?.[0]?.error?.message
                            ?? 'Unknown error';
                        failures.push({
                            title: spec.title,
                            error: errorMessage
                        });
                    }
                }
            }
        }

        const durationSec = (totalDurationMs / 1000).toFixed(1);

        return {
            passed,
            failed,
            skipped,
            total: passed + failed + skipped,
            duration: `${durationSec}s`,
            failures,
            runMode: process.env.CI === 'true' ? 'ci' : 'local'
        };
    }
}