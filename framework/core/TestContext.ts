import { AutomationConfig, getConfig } from "../../config/config";
import { BrowserManager } from "../browser/browserManager";

import { Authenticator } from "../auth/authenticator";
import { SessionValidator } from "../auth/sessionManager";

import { WorkbenchMenu } from "../pages/workbenchMenu";
import { WorkbenchPage } from "../pages/workbenchPage";
import { ProjectDetailPage } from "../pages/projectDetailPage";
import { PromptCreatorPage } from "../pages/promptCreatorPage";
import { ReviewAndSubmitForm } from "../pages/reviewAndSubmitForm";

import { FormHandler } from "../services/formHandler";
import { NavigationService } from "../services/navigationService";
import { ProjectSelector } from "../services/projectSelector";
import { ResponseEvaluator } from "../services/responseEvaluator";
import { WorkbenchService } from "../services/workbenchService";

import { fileManager } from "../../config/fileManager"
import { FilterService } from "../services/filterService";
import { PromptValidationService } from "../services/promptValidationService";
import { ExportService } from "../services/exportService";
import { PromptExportParser } from "../services/promptExportParser";
import { PromptCreatorService } from "../services/promptCreatorService";

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

    private _promptCreator?: PromptCreatorService
    get promptCreator() {
        return this._promptCreator ??= new PromptCreatorService(this.browser, this.promptCreationPage)
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

    private _filterService?: FilterService
    get filterService() {
        return this._filterService ??= new FilterService(this.browser)
    }

    private _promptValidationService?: PromptValidationService
    get promptValidationService() {
        return this._promptValidationService ??= new PromptValidationService()
    }

    private _exportService?: ExportService
    get exportService() {
        return this._exportService ??= new ExportService()
    }

    private _promptExportParser?: PromptExportParser
    get promptExportParser() {
        return this._promptExportParser ??= new PromptExportParser()
    }

    private _workbenchService?: WorkbenchService
    get workbenchService() {
        return this._workbenchService ??= new WorkbenchService(this)
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

    private _promptCreatorPage?: PromptCreatorPage
    get promptCreationPage() {
        return this._promptCreatorPage ??= new PromptCreatorPage(this)
    }

    private _reviewAndSubmitForm?: ReviewAndSubmitForm
    get reviewAndSubmitForm() {
        return this._reviewAndSubmitForm ??= new ReviewAndSubmitForm(this)
    }

    // ---------- ORCHESTRATORS ----------
}