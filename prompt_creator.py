"""
Prompt creation module
"""
from browser_manager import BrowserManager
from config import PromptConfig, QuestionType
from logger_setup import setup_logger

logger = setup_logger(__name__)


class PromptCreator:
    """Handles prompt creation in LLM Toolkit"""
    
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def create_prompt(self, prompt_config: PromptConfig):
        """
        Create a new prompt
        
        Args:
            prompt_config: Prompt configuration
        """
        try:
            logger.info(f"Creating prompt: {prompt_config.question_text}")
            
            # Select question type
            await self._select_question_type(prompt_config.question_type)
            
            # Fill prompt text
            await self.browser.fill_text("input[placeholder*='Solve']", prompt_config.question_text)
            logger.info("Filled prompt text")
            
            # Select level
            await self._select_dropdown("Level", prompt_config.level)
            
            # Select discipline
            await self._select_dropdown("Discipline", prompt_config.discipline)
            
            logger.info("Prompt created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create prompt: {e}")
            raise
    
    async def _select_question_type(self, question_type: QuestionType):
        """Select question type"""
        try:
            script = f"""
            const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]'));
            const typeButton = radioButtons.find(btn => 
                btn.parentElement.textContent.includes('{question_type.value}')
            );
            if (typeButton) {{
                typeButton.click();
                return true;
            }}
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            if result:
                logger.info(f"Selected question type: {question_type.value}")
            else:
                raise Exception(f"Question type not found: {question_type.value}")
                
        except Exception as e:
            logger.error(f"Failed to select question type: {e}")
            raise
    
    async def _select_dropdown(self, dropdown_name: str, value: str):
        """Select value from dropdown"""
        try:
            script = f"""
            const labels = Array.from(document.querySelectorAll('label'));
            const dropdownLabel = labels.find(l => l.textContent.includes('{dropdown_name}'));
            if (dropdownLabel) {{
                const combobox = dropdownLabel.parentElement.querySelector('[role="combobox"]');
                if (combobox) {{
                    combobox.click();
                    return true;
                }}
            }}
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            
            if result:
                # Wait for dropdown to open
                await self.browser.page.wait_for_timeout(500)
                
                # Click the option
                option_script = f"""
                const options = Array.from(document.querySelectorAll('[role="option"]'));
                const option = options.find(o => o.textContent.includes('{value}'));
                if (option) {{
                    option.click();
                    return true;
                }}
                return false;
                """
                
                option_result = await self.browser.evaluate_script(option_script)
                if option_result:
                    logger.info(f"Selected {dropdown_name}: {value}")
                else:
                    raise Exception(f"Option not found: {value}")
            else:
                raise Exception(f"Dropdown not found: {dropdown_name}")
                
        except Exception as e:
            logger.error(f"Failed to select from dropdown: {e}")
            raise
    
    async def run_prompt(self):
        """Run the prompt against the base model"""
        try:
            # Click Run button
            await self.browser.click("button:has-text('Run')")
            logger.info("Clicked Run button")
            
            # Wait for responses
            await self.browser.wait_for_navigation()
            logger.info("Responses generated")
            
        except Exception as e:
            logger.error(f"Failed to run prompt: {e}")
            raise
