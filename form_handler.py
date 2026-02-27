"""
Form handling and submission module
"""
from browser_manager import BrowserManager
from config import MetadataConfig
from logger_setup import setup_logger

logger = setup_logger(__name__)


class FormHandler:
    """Handles form filling and submission"""
    
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def fill_metadata(self, metadata: MetadataConfig):
        """
        Fill metadata form fields
        
        Args:
            metadata: Metadata configuration
        """
        try:
            # Fill Final Answer
            await self._fill_field("Final Answer", metadata.final_answer)
            
            # Fill Solution Process
            await self._fill_field("Solution Process", metadata.solution_process)
            
            # Fill Thinking Process
            await self._fill_field("Thinking Process", metadata.thinking_process)
            
            # Fill Key Points if provided
            if metadata.key_points:
                await self._fill_key_points(metadata.key_points)
            
            # Handle Answer Unit
            if metadata.no_unit_required:
                await self._check_no_unit_required()
            elif metadata.answer_unit:
                await self._fill_field("Answer Unit", metadata.answer_unit)
            
            logger.info("Metadata form filled successfully")
            
        except Exception as e:
            logger.error(f"Failed to fill metadata: {e}")
            raise
    
    async def _fill_field(self, field_name: str, value: str):
        """Fill a text field"""
        try:
            script = f"""
            const labels = Array.from(document.querySelectorAll('label, generic'));
            const field = labels.find(l => l.textContent.includes('{field_name}'));
            if (field) {{
                const input = field.parentElement.querySelector('input, textarea, [contenteditable]');
                if (input) {{
                    input.value = '{value}';
                    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    return true;
                }}
            }}
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            if result:
                logger.info(f"Filled field: {field_name}")
            else:
                logger.warning(f"Could not fill field: {field_name}")
                
        except Exception as e:
            logger.error(f"Failed to fill field {field_name}: {e}")
    
    async def _fill_key_points(self, key_points: str):
        """Fill key points field"""
        try:
            script = f"""
            const keyPointsDiv = Array.from(document.querySelectorAll('div')).find(div =>
                div.textContent.includes('Enter key points')
            );
            if (keyPointsDiv) {{
                keyPointsDiv.click();
                keyPointsDiv.textContent = '{key_points}';
                keyPointsDiv.dispatchEvent(new Event('input', {{ bubbles: true }}));
                keyPointsDiv.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return true;
            }}
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            if result:
                logger.info("Filled key points")
            else:
                logger.warning("Could not fill key points")
                
        except Exception as e:
            logger.error(f"Failed to fill key points: {e}")
    
    async def _check_no_unit_required(self):
        """Check 'This answer does not require a unit' checkbox"""
        try:
            script = """
            const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
            const unitCheckbox = checkboxes.find(cb =>
                cb.parentElement.textContent.includes('does not require a unit')
            );
            if (unitCheckbox && !unitCheckbox.checked) {{
                unitCheckbox.click();
                return true;
            }}
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            if result:
                logger.info("Checked 'no unit required'")
            else:
                logger.warning("Could not check 'no unit required'")
                
        except Exception as e:
            logger.error(f"Failed to check no unit required: {e}")
    
    async def submit_form(self):
        """Submit the form"""
        try:
            # Try form.submit() first
            script = """
            const form = document.querySelector('form');
            if (form) {
                form.submit();
                return 'form.submit()';
            }
            
            // Fallback to button click
            const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                btn.textContent.trim() === 'Submit'
            );
            if (submitBtn) {
                submitBtn.click();
                return 'button.click()';
            }
            
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            if result:
                await self.browser.wait_for_navigation()
                logger.info(f"Form submitted using {result}")
            else:
                raise Exception("Could not find submit button or form")
                
        except Exception as e:
            logger.error(f"Failed to submit form: {e}")
            raise
