import { TestContext } from "../core/TestContext";
import { ProjectDetailPage } from "../pages/projectDetailPage";

export class ProjectDetailOrchestrator {

    private context: TestContext;
    private page: ProjectDetailPage;

    constructor(context: TestContext) {
        this.context = context;
        this.page = context.projectDetailPage;
    }

    // =========================
    // VERIFY PROJECT PAGE
    // =========================

    async verifyProjectLoaded(expectedProjectName?: string): Promise<void> {

        console.log("📂 Verifying Project Details page...");

        await this.page.waitForPageLoad();

        const title = await this.page.getProjectTitle();

        console.log(`  Project title: ${title}`);

        if (expectedProjectName && !title.includes(expectedProjectName)) {
            throw new Error(`❌ Expected project ${expectedProjectName} but found ${title}`);
        }

        console.log("✓ Project page loaded");
    }

    // =========================
    // GET PROJECT INFO
    // =========================

    async getProjectInfo() {

        const title = await this.page.getProjectTitle();
        const promptCount = await this.page.getPromptCount();

        console.log(`📊 Project Info`);
        console.log(`  Title: ${title}`);
        console.log(`  Prompts: ${promptCount}`);

        return {
            title,
            promptCount
        };
    }

    // =========================
    // SEARCH PROMPTS
    // =========================

    async searchPrompt(promptText: string) {

        console.log(`🔎 Searching prompt: ${promptText}`);

        await this.page.searchPrompt(promptText);

        const count = await this.page.getPromptCount();

        console.log(`✓ ${count} prompts found`);

        return count;
    }

    // =========================
    // VALIDATE PROMPT EXISTS
    // =========================

    async verifyPromptExists(promptText: string) {

        const count = await this.page.getPromptCount();

        for (let i = 0; i < count; i++) {

            const text = await this.page.getPromptTextByRow(i);

            if (text.includes(promptText)) {

                console.log(`✓ Prompt found: ${promptText}`);
                return true;
            }
        }

        throw new Error(`❌ Prompt not found: ${promptText}`);
    }

    // =========================
    // OPEN WORKBENCH
    // =========================

    async launchWorkbench() {

        console.log("🚀 Opening Workbench...");

        await this.page.launchWorkbench();

        console.log("✓ Workbench launched");
    }

    // =========================
    // PAGINATION
    // =========================

    async goToNextPage() {

        console.log("➡ Moving to next page");

        await this.page.goToNextPage();

        console.log("✓ Next page loaded");
    }

    // =========================
    // VERIFY PROMPT COUNT
    // =========================

    async verifyPromptCountGreaterThan(minCount: number) {

        const count = await this.page.getPromptCount();

        if (count < minCount) {
            throw new Error(`❌ Expected at least ${minCount} prompts but found ${count}`);
        }

        console.log(`✓ Prompt count validation passed (${count})`);
    }

}