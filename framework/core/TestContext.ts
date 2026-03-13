import { AutomationConfig, getConfig } from "../../config/config"
import { Authenticator } from "../auth/authenticator"
import { SessionValidator } from "../auth/sessionManager"
import { BrowserManager } from "../browser/browserManager"
import { PromptOrchestrator } from "../orchestrators/promptOrchestrator"
import { ReviewOrchestrator } from "../orchestrators/reviewOrchestrator"
import { WorkbenchOrchestrator } from "../orchestrators/workbenchOrchestrator"
import { WorkbenchMenu } from "../pages/workbenchMenu"
import { WorkbenchPage } from "../pages/workbenchPage"
import { FormHandler } from "../services/formHandler"
import { NavigationService } from "../services/navigationService"
import { ProjectSelector } from "../services/projectSelector"
import { PromptCreator } from "../services/promptCreator"
import { ResponseEvaluator } from "../services/responseEvaluator"

export class TestContext {

    config: AutomationConfig
    browser: BrowserManager

    authenticator: Authenticator
    projectSelector: ProjectSelector
    workbenchMenu: WorkbenchMenu
    workbenchPage: WorkbenchPage 
    promptCreator: PromptCreator
    responseEvaluator: ResponseEvaluator
    formHandler: FormHandler
    sessionValidator: SessionValidator
    navigationService: NavigationService

    workbenchOrchestrator: WorkbenchOrchestrator
    promptOrchestrator: PromptOrchestrator
    reviewOrchestrator: ReviewOrchestrator

    constructor(config?: AutomationConfig) {

        this.config = config || getConfig()

        // core
        this.browser = new BrowserManager(this.config.screenshotDir)

        // services
        this.authenticator = new Authenticator(this.browser)
        this.projectSelector = new ProjectSelector(this.browser)
        this.workbenchMenu = new WorkbenchMenu(this)
        this.workbenchPage = new WorkbenchPage(this)
        this.promptCreator = new PromptCreator(this.browser)
        this.responseEvaluator = new ResponseEvaluator(this.browser)
        this.formHandler = new FormHandler(this.browser)
        this.sessionValidator = new SessionValidator(this.browser)
        this.navigationService = new NavigationService(
            this.browser,
            this.projectSelector,
            this.workbenchMenu
        )

        // orchestrators
        this.workbenchOrchestrator = new WorkbenchOrchestrator(this)
        this.promptOrchestrator = new PromptOrchestrator(this)
        this.reviewOrchestrator = new ReviewOrchestrator(this)
        

    }

}