import { BrowserManager } from './browser_manager';
import { UserCredentials } from './config';
export declare class Authenticator {
    private browser;
    constructor(browser: BrowserManager);
    login(credentials: UserCredentials, baseUrl: string): Promise<void>;
}
//# sourceMappingURL=authenticator.d.ts.map