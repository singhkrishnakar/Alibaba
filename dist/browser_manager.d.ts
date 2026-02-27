import { Page } from 'playwright';
export declare class BrowserManager {
    private browser;
    private context;
    private page;
    private screenshotDir;
    private screenshotCount;
    constructor(screenshotDir?: string);
    launch(headless?: boolean): Promise<void>;
    close(): Promise<void>;
    getPage(): Page;
    navigate(url: string, waitUntil?: 'domcontentloaded' | 'networkidle'): Promise<void>;
    takeScreenshot(name: string): Promise<void>;
    /**
     * Click element with multiple selector fallbacks
     * @param selector - Single selector or multiple selectors separated by ||
     * @param timeout - Timeout in ms
     */
    click(selector: string, timeout?: number): Promise<boolean>;
    /**
     * Fill text input with multiple selector fallbacks
     * @param selector - Single selector or multiple selectors separated by ||
     * @param text - Text to fill
     * @param timeout - Timeout in ms
     */
    fill(selector: string, text: string, timeout?: number): Promise<boolean>;
    /**
     * Fill input/textarea by finding a nearby label text.
     * Attempts label -> parent -> input/textarea, or uses label@for attribute.
     */
    fillByLabel(labelText: string, text: string, timeout?: number): Promise<boolean>;
    /**
     * Click a control, type text into it, then press Enter.
     * Useful for react-select style controls.
     */
    typeAndEnter(selector: string, text: string, timeout?: number): Promise<boolean>;
    waitForTimeout(ms: number): Promise<void>;
    waitForNavigation(timeout?: number): Promise<void>;
}
//# sourceMappingURL=browser_manager.d.ts.map