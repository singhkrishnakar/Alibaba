import * as dotenv from 'dotenv';

dotenv.config(); 

import { EmailReporter } from '../framework/utils/emailReporter';
import { ReportParser } from '../framework/utils/reportParser';

async function main() {
    console.log('\n📧 Starting email report sender...');

    try {
        const summary = ReportParser.parseResults();
        const reporter = new EmailReporter();
        await reporter.sendReport(summary);
    } catch (error) {
        console.error(`  ⚠ Email report failed: ${error}`);
        // Do not throw — email failure should not fail the CI pipeline
    }
}

main();