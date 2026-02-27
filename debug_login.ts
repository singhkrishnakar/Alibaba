import { chromium } from 'playwright';

const BASE_URL = 'https://llmtoolkit-staging.innodata.com';

async function main() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Get all input fields
    console.log('\n=== INPUT FIELDS ===');
    const inputs = await page.locator('input').all();
    for (let i = 0; i < inputs.length; i++) {
        const type = await inputs[i].getAttribute('type');
        const name = await inputs[i].getAttribute('name');
        const id = await inputs[i].getAttribute('id');
        const placeholder = await inputs[i].getAttribute('placeholder');
        console.log(`Input ${i}: type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
    }
    
    // Get all buttons
    console.log('\n=== BUTTONS ===');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        const type = await buttons[i].getAttribute('type');
        const onClick = await buttons[i].getAttribute('onclick');
        console.log(`Button ${i}: type="${type}" text="${text?.trim()}" onclick="${onClick}"`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug_login.png' });
    console.log('\n✓ Screenshot: screenshots/debug_login.png');
    
    await browser.close();
}

main().catch(console.error);
