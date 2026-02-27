"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseEvaluator = void 0;
class ResponseEvaluator {
    constructor(browser) {
        this.browser = browser;
    }
    async getResponseCount() {
        try {
            const page = this.browser.getPage();
            const count = await page.evaluate(() => {
                const responses = document.querySelectorAll('[data-testid="response"]');
                return responses.length;
            });
            console.log(`  ℹ Found ${count} responses`);
            return count;
        }
        catch (error) {
            console.error(`  ✗ Could not get response count: ${error}`);
            return 0;
        }
    }
    async evaluateResponse(responseIndex, status) {
        try {
            const page = this.browser.getPage();
            const result = await page.evaluate(({ index, statusValue }) => {
                const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]'));
                const statusButtons = radioButtons.filter((btn) => btn.parentElement?.textContent?.includes(statusValue));
                if (statusButtons[index]) {
                    statusButtons[index].click();
                    return true;
                }
                return false;
            }, { index: responseIndex, statusValue: status });
            if (result) {
                console.log(`  ✓ Response ${responseIndex} marked as ${status}`);
                await this.browser.waitForTimeout(1000);
            }
            return result;
        }
        catch (error) {
            console.error(`  ✗ Failed to mark response ${responseIndex}: ${error}`);
            return false;
        }
    }
    async markAllResponsesRandom() {
        try {
            console.log('📊 Evaluating responses...');
            const startTime = Date.now();
            const count = await this.getResponseCount();
            if (count === 0) {
                console.log('  ℹ No responses to evaluate');
                return;
            }
            // Mark each response randomly as Correct or Incorrect
            for (let i = 0; i < count; i++) {
                const status = Math.random() > 0.5 ? 'Correct' : 'Incorrect';
                await this.evaluateResponse(i, status);
                await this.browser.waitForTimeout(200);
            }
            const duration = Date.now() - startTime;
            console.log(`✓ All ${count} responses evaluated (${duration}ms)`);
        }
        catch (error) {
            console.error(`✗ Response evaluation failed: ${error}`);
            throw error;
        }
    }
    async markAllResponsesCorrect() {
        try {
            console.log('📊 Marking all responses as Correct...');
            const startTime = Date.now();
            const count = await this.getResponseCount();
            for (let i = 0; i < count; i++) {
                await this.evaluateResponse(i, 'Correct');
                await this.browser.waitForTimeout(200);
            }
            const duration = Date.now() - startTime;
            console.log(`✓ All ${count} responses marked as Correct (${duration}ms)`);
        }
        catch (error) {
            console.error(`✗ Failed to mark responses: ${error}`);
            throw error;
        }
    }
}
exports.ResponseEvaluator = ResponseEvaluator;
//# sourceMappingURL=response_evaluator.js.map