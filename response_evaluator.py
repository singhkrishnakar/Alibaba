"""
Response evaluation module
"""
from typing import List, Dict
from browser_manager import BrowserManager
from config import ResponseStatus
from logger_setup import setup_logger

logger = setup_logger(__name__)


class ResponseEvaluator:
    """Handles response evaluation"""
    
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def evaluate_response(self, response_index: int, status: ResponseStatus):
        """
        Evaluate a single response
        
        Args:
            response_index: Index of the response
            status: Correct or Incorrect
        """
        try:
            script = f"""
            const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]'));
            const statusButtons = radioButtons.filter(btn => 
                btn.parentElement.textContent.includes('{status.value}')
            );
            if (statusButtons[{response_index}]) {{
                statusButtons[{response_index}].click();
                return true;
            }}
            return false;
            """
            
            result = await self.browser.evaluate_script(script)
            if result:
                logger.info(f"Response {response_index} marked as {status.value}")
            else:
                logger.warning(f"Could not mark response {response_index}")
                
        except Exception as e:
            logger.error(f"Failed to evaluate response: {e}")
            raise
    
    async def evaluate_multiple_responses(self, evaluations: List[Dict]):
        """
        Evaluate multiple responses
        
        Args:
            evaluations: List of dicts with 'index' and 'status' keys
        """
        try:
            for evaluation in evaluations:
                await self.evaluate_response(
                    evaluation['index'],
                    evaluation['status']
                )
            
            logger.info(f"Evaluated {len(evaluations)} responses")
            
        except Exception as e:
            logger.error(f"Failed to evaluate multiple responses: {e}")
            raise
    
    async def get_response_count(self):
        """Get total number of responses"""
        try:
            script = """
            const responses = Array.from(document.querySelectorAll('[data-testid="response"]'));
            return responses.length;
            """
            
            count = await self.browser.evaluate_script(script)
            logger.info(f"Found {count} responses")
            return count
            
        except Exception as e:
            logger.error(f"Failed to get response count: {e}")
            return 0
    
    async def mark_all_responses_random(self):
        """Mark all responses randomly as Correct or Incorrect"""
        try:
            import random
            
            count = await self.get_response_count()
            
            for i in range(count):
                status = ResponseStatus.CORRECT if random.choice([True, False]) else ResponseStatus.INCORRECT
                await self.evaluate_response(i, status)
            
            logger.info(f"Marked all {count} responses randomly")
            
        except Exception as e:
            logger.error(f"Failed to mark responses randomly: {e}")
            raise
