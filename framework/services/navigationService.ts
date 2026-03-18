import { BrowserManager } from "../browser/browserManager";
import { ProjectSelector } from '../services/projectSelector';
import { WorkbenchMenu } from "../pages/workbenchMenu";

export class NavigationService {

    constructor(private browser: BrowserManager, private projectSelector: ProjectSelector,
        private workbenchMenu: WorkbenchMenu) { }

    async openDashboard(baseUrl: string) {

        const page = this.browser.getPage();

        console.log('📊 Opening dashboard...');

        await page.goto(`${baseUrl}/dashboard`);

        await this.browser.waitForLoader();

        await page.waitForLoadState('networkidle');

        console.log('✓ Dashboard ready');
    }

    async navigateToProject(baseUrl: string, projectName: string, projectUrl: string) {
        await this.projectSelector.navigateToProject(
            projectName,
            baseUrl,
            projectUrl
        );
        await this.workbenchMenu.waitForLoader();
    }
}