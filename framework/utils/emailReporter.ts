import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface TestSummary {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: string;
    failures: FailedTest[];
    runMode: 'local' | 'ci';
}

export interface FailedTest {
    title: string;
    error: string;
}

export class EmailReporter {

    private readonly smtpConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME ?? '',
            pass: process.env.MAIL_PASSWORD ?? ''
        }
    };

    private get isEnabled(): boolean {
        return process.env.MAIL_ENABLED === 'true'
            && !!process.env.MAIL_USERNAME
            && !!process.env.MAIL_PASSWORD
            && !!process.env.MAIL_RECIPIENT;
    }

    private get runMode(): 'local' | 'ci' {
        return process.env.CI === 'true' ? 'ci' : 'local';
    }

    private get runNumber(): string {
        return process.env.GITHUB_RUN_NUMBER ?? 'local';
    }

    private get branch(): string {
        return process.env.GITHUB_REF_NAME ?? 'local';
    }

    private get triggeredBy(): string {
        return process.env.GITHUB_ACTOR ?? process.env.USER ?? 'local';
    }

    private get repoName(): string {
        return process.env.GITHUB_REPOSITORY ?? 'local run';
    }

    private get commitSha(): string {
        return process.env.GITHUB_SHA?.substring(0, 7) ?? 'N/A';
    }

    // ─────────────────────────────────────────
    // MAIN SEND METHOD
    // ─────────────────────────────────────────

    async sendReport(summary: TestSummary): Promise<void> {
        if (!this.isEnabled) {
            console.log(
                '  ℹ Email reporting disabled. ' +
                'Set MAIL_ENABLED=true, MAIL_USERNAME, MAIL_PASSWORD, ' +
                'MAIL_RECIPIENT in .env to enable.'
            );
            return;
        }

        console.log('📧 Sending test report email...');

        const transporter = nodemailer.createTransport(this.smtpConfig);

        const subject = this.buildSubject(summary);
        const html = this.buildHtmlBody(summary);
        const attachments = this.buildAttachments();

        await transporter.sendMail({
            from: `GitHub Actions <${process.env.MAIL_USERNAME}>`,
            to: process.env.MAIL_RECIPIENT,
            subject,
            html,
            attachments
        });

        console.log(`  ✓ Report sent to ${process.env.MAIL_RECIPIENT}`);
    }

    // ─────────────────────────────────────────
    // EMAIL PARTS
    // ─────────────────────────────────────────

    private buildSubject(summary: TestSummary): string {
        const status = summary.failed === 0 ? '✅ PASSED' : '❌ FAILED';
        const mode = this.runMode === 'ci' ? `CI Run #${this.runNumber}` : 'Local Run';
        return `🤖 Playwright Report — ${status} | ${mode} | ${this.branch}`;
    }

    private buildHtmlBody(summary: TestSummary): string {
        const statusColor = summary.failed === 0 ? '#28a745' : '#dc3545';
        const statusText = summary.failed === 0 ? '✅ All Tests Passed' : '❌ Some Tests Failed';
        const ciLink = process.env.GITHUB_RUN_ID
            ? `https://github.com/${this.repoName}/actions/runs/${process.env.GITHUB_RUN_ID}`
            : null;

        const failureRows = summary.failures.length > 0
            ? `
                <h3 style="color: #dc3545;">❌ Failed Tests</h3>
                <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                    <tr style="background: #dc3545; color: white;">
                        <th style="padding: 8px; text-align: left;">Test</th>
                        <th style="padding: 8px; text-align: left;">Error</th>
                    </tr>
                    ${summary.failures.map((f, i) => `
                        <tr style="background: ${i % 2 === 0 ? '#fff5f5' : '#ffffff'}">
                            <td style="padding: 8px; border: 1px solid #f5c6cb;">
                                ${f.title}
                            </td>
                            <td style="padding: 8px; border: 1px solid #f5c6cb;
                                       font-family: monospace; font-size: 12px;">
                                ${f.error.substring(0, 200)}...
                            </td>
                        </tr>
                    `).join('')}
                </table>
            `
            : '';

        return `
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 650px;
                     margin: 0 auto; padding: 20px; color: #333;">

            <h2 style="color: ${statusColor}; border-bottom: 2px solid ${statusColor};
                        padding-bottom: 10px;">
                ${statusText}
            </h2>

            <!-- Run Info -->
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6; width: 40%;">
                        <strong>Run Mode</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        ${this.runMode === 'ci' ? '🤖 CI / GitHub Actions' : '💻 Local'}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <strong>Repository</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        ${this.repoName}
                    </td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <strong>Branch</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        ${this.branch}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <strong>Triggered by</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        ${this.triggeredBy}
                    </td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <strong>Run Number</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        #${this.runNumber}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <strong>Commit</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        ${this.commitSha}
                    </td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        <strong>Duration</strong>
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">
                        ${summary.duration}
                    </td>
                </tr>
            </table>

            <!-- Test Results -->
            <h3 style="color: #333;">📊 Test Results</h3>
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 12px; border: 1px solid #dee2e6;
                               background: #d4edda; text-align: center; width: 33%;">
                        <div style="font-size: 28px; font-weight: bold; color: #28a745;">
                            ${summary.passed}
                        </div>
                        <div style="color: #28a745;">✅ Passed</div>
                    </td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;
                               background: #f8d7da; text-align: center; width: 33%;">
                        <div style="font-size: 28px; font-weight: bold; color: #dc3545;">
                            ${summary.failed}
                        </div>
                        <div style="color: #dc3545;">❌ Failed</div>
                    </td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;
                               background: #fff3cd; text-align: center; width: 33%;">
                        <div style="font-size: 28px; font-weight: bold; color: #856404;">
                            ${summary.skipped}
                        </div>
                        <div style="color: #856404;">⏭ Skipped</div>
                    </td>
                </tr>
                <tr>
                    <td colspan="3" style="padding: 8px; border: 1px solid #dee2e6;
                                           text-align: center; background: #e9ecef;">
                        <strong>Total: ${summary.total} tests</strong>
                    </td>
                </tr>
            </table>

            <!-- Failed Tests Detail -->
            ${failureRows}

            <!-- Action Button -->
            ${ciLink ? `
                <p>
                    <a href="${ciLink}"
                       style="background: #0366d6; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 4px;
                              display: inline-block; font-weight: bold;">
                        📋 View Full Report on GitHub
                    </a>
                </p>
            ` : `
                <p style="color: #6c757d; font-size: 12px;">
                    HTML report attached to this email.
                    Open playwright-report/index.html in a browser for full details.
                </p>
            `}

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            <p style="color: #6c757d; font-size: 11px;">
                Sent by Playwright Test Reporter |
                ${new Date().toLocaleString()} |
                ${this.runMode === 'ci' ? 'GitHub Actions' : 'Local Machine'}
            </p>

        </body>
        </html>`;
    }

    private buildAttachments(): nodemailer.SendMailOptions['attachments'] {
        const reportPath = path.join(process.cwd(), 'playwright-report', 'index.html');
        const attachments: nodemailer.SendMailOptions['attachments'] = [];

        if (fs.existsSync(reportPath)) {
            attachments.push({
                filename: `playwright-report-${this.runNumber}.html`,
                path: reportPath,
                contentType: 'text/html'
            });
        }

        return attachments;
    }
}