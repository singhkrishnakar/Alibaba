"""
Workbench Page Object - Centralized locators and element interactions for Python
"""
from typing import List
from playwright.async_api import Page, Locator


class WorkbenchPage:
    """Page Object Model for Workbench UI"""
    
    def __init__(self, page: Page):
        self.page = page
    
    # ==================== CREATE PROMPT SECTION ====================
    
    @property
    def create_button(self) -> Locator:
        """Create/New button locators"""
        return self.page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add"), button.css-sit19b')
    
    def get_prompt_type_button(self, prompt_type: str) -> Locator:
        """Get button for specific prompt type"""
        return self.page.locator(f'button:has-text("{prompt_type}"), label:has-text("{prompt_type}"), input[value="{prompt_type}"], input[type="radio"][value="{prompt_type}"]')
    
    @property
    def prompt_text_field(self) -> Locator:
        """Prompt text input field"""
        return self.page.locator('textarea[name="prompt"], textarea, input[name="promptText"], input[placeholder*="prompt"]')
    
    @property
    def education_level_select(self) -> Locator:
        """Education level dropdown select"""
        return self.page.locator('select')
    
    def get_education_level_option(self, level: str) -> Locator:
        """Get specific education level option"""
        return self.page.locator(f'option:has-text("{level}")')
    
    @property
    def react_select_input(self) -> Locator:
        """React-select input field"""
        return self.page.locator('#react-select-dropdown-undefined-input, input[id^="react-select-"], .css-1wy0on6 input, .css-1dimb5e-singleValue')
    
    def get_dropdown_option(self, text: str) -> Locator:
        """Get dropdown option by text"""
        return self.page.locator(f'div[role="option"]:has-text("{text}"), div:has-text("{text}"), li:has-text("{text}")')
    
    @property
    def subject_field(self) -> Locator:
        """Subject/Discipline input field"""
        return self.page.locator('input[placeholder*="subject" i], input[placeholder*="topic"], input[name="subject"], input[aria-label*="Subject"]')
    
    @property
    def dropdown_control(self) -> Locator:
        """Dropdown control for react-select"""
        return self.page.locator('.dropdownControl, .css-1dimb5e-singleValue, .css-hlgwow')
    
    @property
    def submit_prompt_button(self) -> Locator:
        """Submit button for prompt form"""
        return self.page.locator('button:has-text("Submit"), button:has-text("Create"), button:has-text("Save"), button[aria-haspopup="dialog"]')
    
    # ==================== RESPONSE SECTION ====================
    
    @property
    def responses(self) -> Locator:
        """All response elements"""
        return self.page.locator('[data-testid="response"]')
    
    def get_response_by_index(self, index: int) -> Locator:
        """Get response at specific index"""
        return self.page.locator('[data-testid="response"]').nth(index)
    
    def get_response_text_by_index(self, index: int) -> Locator:
        """Get response text at specific index"""
        return self.page.locator('[data-testid="response"]').nth(index).locator('div, p, span')
    
    @property
    def response_radio_buttons(self) -> Locator:
        """Radio buttons for marking responses"""
        return self.page.locator('input[type="radio"]')
    
    def get_response_radio_button(self, index: int) -> Locator:
        """Get radio button at specific index"""
        return self.page.locator('input[type="radio"]').nth(index)
    
    def get_radio_by_status(self, status: str) -> Locator:
        """Get radio button by status (Correct/Incorrect)"""
        return self.page.locator(f'input[type="radio"]:near(label:has-text("{status}"))')
    
    # ==================== QUESTION/PROMPT DISPLAY ====================
    
    @property
    def question_text(self) -> Locator:
        """Question/Prompt display area"""
        return self.page.locator('[data-testid="question"] p, [data-testid="prompt"] p, [data-testid="question"], [data-testid="prompt"]')
    
    # ==================== METADATA FORM SECTION ====================
    
    @property
    def final_answer_field(self) -> Locator:
        """Final answer input field"""
        return self.page.locator('textarea[placeholder*="answer" i], input[placeholder*="answer" i], textarea[aria-label*="answer" i]')
    
    @property
    def solution_process_field(self) -> Locator:
        """Solution process field"""
        return self.page.locator('textarea[placeholder*="solution" i], textarea[placeholder*="process" i], input[placeholder*="solution" i]')
    
    @property
    def thinking_process_field(self) -> Locator:
        """Thinking process field"""
        return self.page.locator('textarea[placeholder*="thinking" i], input[placeholder*="thinking" i], textarea[aria-label*="thinking" i]')
    
    @property
    def no_unit_required_checkbox(self) -> Locator:
        """No Unit Required checkbox"""
        return self.page.locator('input[type="checkbox"][aria-label*="unit" i], input[type="checkbox"]:near(label:has-text("Unit"))')
    
    @property
    def key_points_field(self) -> Locator:
        """Key points field"""
        return self.page.locator('textarea[placeholder*="key" i], input[placeholder*="key" i], [contenteditable="true"]')
    
    # ==================== FORM SUBMISSION ====================
    
    @property
    def submit_form_button(self) -> Locator:
        """Main form submit button"""
        return self.page.locator('button:has-text("Submit"), button:has-text("Save"), button[type="submit"]')
    
    @property
    def cancel_button(self) -> Locator:
        """Cancel button"""
        return self.page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label="Close"]')
    
    # ==================== NAVIGATION ====================
    
    @property
    def back_button(self) -> Locator:
        """Back button"""
        return self.page.locator('button:has(svg[data-testid="ArrowBackIcon"]), button[aria-label*="back" i]')
    
    @property
    def menu_button(self) -> Locator:
        """Menu/More options button"""
        return self.page.locator('button:has(svg[data-testid="MoreVertIcon"]), button[aria-haspopup="menu"]')
    
    # ==================== HELPER METHODS ====================
    
    async def get_response_count(self) -> int:
        """Get count of rendered responses"""
        return await self.responses.count()
    
    async def get_all_response_texts(self) -> List[str]:
        """Get all response texts"""
        count = await self.get_response_count()
        texts = []
        for i in range(count):
            text = await self.get_response_text_by_index(i).text_content()
            texts.append(text.strip() if text else '')
        return texts
    
    async def get_response_text(self, index: int) -> str:
        """Get response text by index"""
        text = await self.get_response_text_by_index(index).text_content()
        return text.strip() if text else ''
    
    async def has_response(self, index: int) -> bool:
        """Check if response exists at index"""
        return await self.get_response_by_index(index).count() > 0
    
    async def all_responses_marked(self) -> bool:
        """Check if all responses are marked"""
        radio_count = await self.response_radio_buttons.count()
        checked_count = await self.page.locator('input[type="radio"]:checked').count()
        return radio_count > 0 and checked_count == radio_count
    
    async def wait_for_responses(self, timeout: int = 15000) -> None:
        """Wait for responses to appear"""
        await self.page.wait_for_selector('[data-testid="response"]', timeout=timeout)
    
    async def wait_for_response_count(self, expected_count: int, timeout: int = 20000) -> bool:
        """Wait for response count to reach expected number"""
        import time
        start_time = time.time()
        while (time.time() - start_time) * 1000 < timeout:
            count = await self.get_response_count()
            if count >= expected_count:
                return True
            await self.page.wait_for_timeout(500)
        return False
    
    async def get_question_text(self) -> str:
        """Get current question/prompt text"""
        text = await self.question_text.text_content()
        return text.strip() if text else ''
    
    async def is_form_complete(self) -> bool:
        """Check if form is complete (all fields filled)"""
        final_answer = await self.final_answer_field.input_value()
        solution_process = await self.solution_process_field.input_value()
        thinking_process = await self.thinking_process_field.input_value()
        
        return bool(final_answer and final_answer.strip() and 
                   solution_process and solution_process.strip() and 
                   thinking_process and thinking_process.strip())
    
    async def take_screenshot(self, filename: str) -> None:
        """Take page screenshot"""
        await self.page.screenshot(path=f'./screenshots/{filename}.png')
    
    async def dump_page_html(self, filename: str) -> None:
        """Dump page HTML for debugging"""
        html = await self.page.content()
        with open(f'./screenshots/{filename}.html', 'w') as f:
            f.write(html)
    
    async def get_page_text(self) -> str:
        """Get all visible page text"""
        return await self.page.text_content('body') or ''
    
    async def debug_log_responses(self) -> None:
        """Log all visible responses for debugging"""
        count = await self.get_response_count()
        print(f"📊 Found {count} responses:")
        for i in range(count):
            text = await self.get_response_text(i)
            print(f"  [{i}]: {text[:100]}...")
    
    async def element_exists(self, locator: Locator) -> bool:
        """Check if element exists"""
        return await locator.count() > 0
    
    async def wait_for_element(self, locator: Locator, timeout: int = 5000) -> bool:
        """Wait for element visibility"""
        try:
            await locator.first.wait_for(state='visible', timeout=timeout)
            return True
        except:
            return False
