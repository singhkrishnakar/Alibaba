import { BrowserManager } from '../browser/browserManager';
import { Logger } from '../utils/Logger';

export class FilterService {

    constructor(private browser: BrowserManager) {}

    private page() {
        return this.browser.getPage();
    }

    async openAllFilters(): Promise<void> {

        Logger.info("Opening All Filters panel");

        // Example: narrow by a parent container
        const allFiltersButton = this.page().locator(`xpath=//div[contains(text(),'All Filters')]`);

        console.log(await this.page().locator('div:has([data-testid="FilterListIcon"])').count());
        await allFiltersButton.waitFor({ state: 'visible' });
        await allFiltersButton.click();

        // Wait for the filter panel to appear
        const dateRangeOption = this.page().locator(
            '//input[@placeholder="Search..."]//ancestor::div/following-sibling::ul//span[contains(text(),"Date Range")]'
        );

        await dateRangeOption.waitFor({ state: "visible" });

        Logger.info("All Filters panel opened successfully")

    }

    async openFilter(filterName: string): Promise<void> {

        Logger.info(`Opening filter: ${filterName}`);
        // Wait for the filter panel to appear
        
        const filter = this.page().locator(
            '//input[@placeholder="Search..."]//ancestor::div/following-sibling::ul//span[contains(text(),"Date Range")]'
        );
        await filter.waitFor({ state: "visible" });
        await filter.click();

        // Wait for calendar
        const calendar = this.page().locator('table.mantine-DatePicker-month');

        await calendar.waitFor({ state: "visible", timeout: 5000 });

        Logger.success(`${filterName} filter opened`);

    }

    /**
     * Navigate calendar to correct month/year
     */
    async navigateToMonth(targetDate: Date): Promise<void> {

        const monthButton = this.page().locator(
            'button.mantine-DatePicker-calendarHeaderLevel'
        );

        await monthButton.waitFor({ state: "visible" });

        while (true) {

            const currentMonthText = await monthButton.textContent();

            if (!currentMonthText) break;

            const currentDate = new Date(currentMonthText);

            if (
                currentDate.getMonth() === targetDate.getMonth() &&
                currentDate.getFullYear() === targetDate.getFullYear()
            ) {
                break;
            }

            if (currentDate > targetDate) {

                const prevBtn = this.page().locator(
                    'button[data-direction="previous"]'
                );

                await prevBtn.click();

            } else {

                const nextBtn = this.page().locator(
                    'button[data-direction="next"]'
                );

                await nextBtn.click();
            }

            await this.page().waitForTimeout(200);
        }
    }

    /**
     * Select specific date
     */
    async selectDate(date: Date): Promise<void> {

        const day = date.getDate();

        const dayButton = this.page().locator(
            `button.mantine-DatePicker-day:not([data-outside="true"])`,
            { hasText: day.toString() }
        );

        await dayButton.first().waitFor({ state: "visible" });

        await dayButton.first().click();
    }

    /**
     * Main reusable date range selector
     */
    async filterByDateRange(startDate: string, endDate: string): Promise<void> {

        const start = new Date(startDate);
        const end = new Date(endDate);

        Logger.info(`Applying date filter: ${startDate} → ${endDate}`);

        await this.openAllFilters();

        await this.openFilter("Date Range");

        // Navigate and select start date
        await this.navigateToMonth(start);
        await this.selectDate(start);

        // Navigate and select end date
        await this.navigateToMonth(end);
        await this.selectDate(end);

        const applyBtn = this.page().locator('button:has-text("Apply")');

        await applyBtn.waitFor({ state: "visible" });

        await applyBtn.click();

        Logger.success("Date range applied successfully");
    }
}