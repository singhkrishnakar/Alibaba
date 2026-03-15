import { AutomationConfig, getConfig } from "../../config/config";
import { BrowserManager } from "../browser/browserManager";

import { Authenticator } from "../auth/authenticator";
import { SessionValidator } from "../auth/sessionManager";

import { PromptOrchestrator } from "../orchestrators/promptOrchestrator";
import { ReviewOrchestrator } from "../orchestrators/reviewOrchestrator";
import { WorkbenchOrchestrator } from "../orchestrators/workbenchOrchestrator";
import { ProjectDetailOrchestrator } from "../orchestrators/projectDetailOrchestration";

import { WorkbenchMenu } from "../pages/workbenchMenu";
import { WorkbenchPage } from "../pages/workbenchPage";
import { ProjectDetailPage } from "../pages/projectDetailPage";

import { FormHandler } from "../services/formHandler";
import { NavigationService } from "../services/navigationService";
import { ProjectSelector } from "../services/projectSelector";
import { PromptCreator } from "../services/promptCreator";
import { ResponseEvaluator } from "../services/responseEvaluator";

import {fileManager} from "../../config/fileManager"
export class TestContext {

    config: AutomationConfig
    browser: BrowserManager
    fileManager: typeof fileManager

    constructor(config?: AutomationConfig, browserManager?: BrowserManager) {

        this.config = config || getConfig()
        this.fileManager = fileManager

        if (!browserManager) {
            throw new Error(
                "BrowserManager must be provided via Playwright fixture"
            )
        }

        this.browser = browserManager
    }

    // ---------- AUTH ----------

    private _authenticator?: Authenticator
    get authenticator() {
        return this._authenticator ??= new Authenticator(this.browser)
    }

    private _sessionValidator?: SessionValidator
    get sessionValidator() {
        return this._sessionValidator ??= new SessionValidator(this.browser)
    }

    // ---------- SERVICES ----------

    private _projectSelector?: ProjectSelector
    get projectSelector() {
        return this._projectSelector ??= new ProjectSelector(this.browser)
    }

    private _promptCreator?: PromptCreator
    get promptCreator() {
        return this._promptCreator ??= new PromptCreator(this.browser)
    }

    private _responseEvaluator?: ResponseEvaluator
    get responseEvaluator() {
        return this._responseEvaluator ??= new ResponseEvaluator(this.browser)
    }

    private _formHandler?: FormHandler
    get formHandler() {
        return this._formHandler ??= new FormHandler(this.browser)
    }

    private _navigationService?: NavigationService
    get navigationService() {
        return this._navigationService ??=
            new NavigationService(this.browser, this.projectSelector, this.workbenchMenu)
    }

    // ---------- PAGES ----------

    private _workbenchMenu?: WorkbenchMenu
    get workbenchMenu() {
        return this._workbenchMenu ??= new WorkbenchMenu(this)
    }

    private _workbenchPage?: WorkbenchPage
    get workbenchPage() {
        return this._workbenchPage ??= new WorkbenchPage(this)
    }

    private _projectDetailPage?: ProjectDetailPage
    get projectDetailPage() {
        return this._projectDetailPage ??= new ProjectDetailPage(this)
    }

    // ---------- ORCHESTRATORS ----------

    private _workbenchOrchestrator?: WorkbenchOrchestrator
    get workbenchOrchestrator() {
        return this._workbenchOrchestrator ??= new WorkbenchOrchestrator(this)
    }

    private _promptOrchestrator?: PromptOrchestrator
    get promptOrchestrator() {
        return this._promptOrchestrator ??= new PromptOrchestrator(this)
    }

    private _reviewOrchestrator?: ReviewOrchestrator
    get reviewOrchestrator() {
        return this._reviewOrchestrator ??= new ReviewOrchestrator(this)
    }

    private _projectDetailOrchestrator?: ProjectDetailOrchestrator
    get projectDetailOrchestrator() {
        return this._projectDetailOrchestrator ??= new ProjectDetailOrchestrator(this)
    }

}