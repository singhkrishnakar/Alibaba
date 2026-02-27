"""
Main automation orchestrator
"""
import asyncio
import json
from pathlib import Path
from config import (
    AutomationConfig, UserCredentials, ProjectConfig, PromptConfig,
    MetadataConfig, QuestionType, ResponseStatus
)
from logger_setup import setup_logger, get_timestamp
from browser_manager import BrowserManager
from authenticator import LLMToolkitAuthenticator
from project_selector import ProjectSelector
from workbench_launcher import WorkbenchLauncher
from prompt_creator import PromptCreator
from response_evaluator import ResponseEvaluator
from form_handler import FormHandler

logger = setup_logger(__name__, f"./logs/automation_{get_timestamp()}.log")


class LLMToolkitAutomation:
    """Main automation orchestrator"""
    
    def __init__(self, config: AutomationConfig):
        self.config = config
        self.browser = BrowserManager(
            headless=config.headless,
            screenshot_dir=config.screenshot_dir
        )
        self.authenticator = LLMToolkitAuthenticator(self.browser)
        self.project_selector = ProjectSelector(self.browser)
        self.workbench_launcher = WorkbenchLauncher(self.browser)
        self.prompt_creator = PromptCreator(self.browser)
        self.response_evaluator = ResponseEvaluator(self.browser)
        self.form_handler = FormHandler(self.browser)
    
    async def run(self):
        """Execute the complete automation workflow"""
        try:
            logger.info("Starting LLM Toolkit automation")
            
            # Launch browser
            await self.browser.launch()
            await self.browser.take_screenshot("01_start.png")
            
            # Login
            await self.authenticator.login(
                self.config.credentials,
                self.config.project.base_url
            )
            await self.browser.take_screenshot("02_logged_in.png")
            
            # Navigate to project
            await self.project_selector.navigate_to_project(
                self.config.project.project_name,
                self.config.project.base_url
            )
            await self.browser.take_screenshot("03_project_selected.png")
            
            # Launch workbench
            await self.workbench_launcher.launch_workbench()
            await self.browser.take_screenshot("04_workbench_launched.png")
            
            # Create prompt
            await self.prompt_creator.create_prompt(self.config.prompt)
            await self.browser.take_screenshot("05_prompt_created.png")
            
            # Run prompt
            await self.prompt_creator.run_prompt()
            await self.browser.take_screenshot("05_prompt_ran.png")
            
            # Evaluate responses
            await self.response_evaluator.mark_all_responses_random()
            await self.browser.take_screenshot("06_responses_marked.png")
            
            # Fill metadata
            await self.form_handler.fill_metadata(self.config.metadata)
            await self.browser.take_screenshot("07_metadata_filled.png")
            
            # Submit form
            await self.form_handler.submit_form()
            await self.browser.take_screenshot("08_form_submitted.png")
            
            logger.info("Automation completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Automation failed: {e}")
            try:
                await self.browser.take_screenshot("error.png")
            except:
                pass
            return False
        
        finally:
            await self.browser.close()
    
    @staticmethod
    async def from_config_file(config_path: str):
        """Load configuration from JSON file and run automation"""
        try:
            with open(config_path, 'r') as f:
                config_dict = json.load(f)
            
            # Parse configuration
            config = AutomationConfig(
                credentials=UserCredentials(**config_dict['credentials']),
                project=ProjectConfig(**config_dict['project']),
                prompt=PromptConfig(
                    question_text=config_dict['prompt']['question_text'],
                    question_type=QuestionType[config_dict['prompt']['question_type'].upper().replace(' ', '_')],
                    level=config_dict['prompt']['level'],
                    discipline=config_dict['prompt']['discipline']
                ),
                metadata=MetadataConfig(**config_dict['metadata']),
                headless=config_dict.get('headless', False),
                wait_timeout=config_dict.get('wait_timeout', 10000),
                take_screenshots=config_dict.get('take_screenshots', True),
                screenshot_dir=config_dict.get('screenshot_dir', './screenshots')
            )
            
            automation = LLMToolkitAutomation(config)
            return await automation.run()
            
        except Exception as e:
            logger.error(f"Failed to load config file: {e}")
            raise


async def main():
    """Main entry point"""
    # Example: Create and run with inline configuration
    config = AutomationConfig(
        credentials=UserCredentials(
            email="pzr@innodata.com",
            password="Password@2027"
        ),
        project=ProjectConfig(
            project_name="Chem v3",
            project_url="/project/prompt/356"
        ),
        prompt=PromptConfig(
            question_text="hi",
            question_type=QuestionType.ESSAY_STYLE,
            level="Undergraduate",
            discipline="Organic Chemistry"
        ),
        metadata=MetadataConfig(
            final_answer="The model responded with a greeting. This is an appropriate response.",
            solution_process="Evaluated response quality and correctness.",
            thinking_process="Assessed model response appropriateness.",
            level="Undergraduate",
            discipline="Organic Chemistry",
            key_points="Model greeting responses are appropriate",
            no_unit_required=True
        ),
        headless=False,
        take_screenshots=True
    )
    
    automation = LLMToolkitAutomation(config)
    success = await automation.run()
    
    if success:
        logger.info("Automation completed successfully")
    else:
        logger.error("Automation failed")


if __name__ == "__main__":
    asyncio.run(main())
