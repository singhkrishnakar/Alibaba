"""
Browser management and utilities
"""
from pathlib import Path
from typing import Optional
import asyncio
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from logger_setup import setup_logger

logger = setup_logger(__name__)


class BrowserManager:
    """Manages browser lifecycle and common operations"""
    
    def __init__(self, headless: bool = False, screenshot_dir: str = "./screenshots"):
        self.headless = headless
        self.screenshot_dir = Path(screenshot_dir)
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
    
    async def launch(self):
        """Launch browser"""
        try:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(headless=self.headless)
            self.context = await self.browser.new_context()
            self.page = await self.context.new_page()
            logger.info("Browser launched successfully")
        except Exception as e:
            logger.error(f"Failed to launch browser: {e}")
            raise
    
    async def close(self):
        """Close browser"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            logger.info("Browser closed successfully")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
    
    async def navigate_to(self, url: str, wait_timeout: int = 30000):
        """Navigate to URL"""
        try:
            await self.page.goto(url, wait_until="networkidle", timeout=wait_timeout)
            logger.info(f"Navigated to {url}")
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {e}")
            raise
    
    async def take_screenshot(self, filename: str = None):
        """Take screenshot and save"""
        try:
            if filename is None:
                from logger_setup import get_timestamp
                filename = f"screenshot_{get_timestamp()}.png"
            
            filepath = self.screenshot_dir / filename
            await self.page.screenshot(path=str(filepath))
            logger.info(f"Screenshot saved: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to take screenshot: {e}")
    
    async def find_element(self, selector: str, timeout: int = 10000):
        """Find element by selector"""
        try:
            element = await self.page.wait_for_selector(selector, timeout=timeout)
            logger.debug(f"Found element: {selector}")
            return element
        except Exception as e:
            logger.error(f"Element not found: {selector}")
            return None
    
    async def click(self, selector: str, timeout: int = 10000):
        """Click element"""
        # selector may be a single selector or a list-like string separated by ||
        selectors = [s.strip() for s in selector.split('||')] if isinstance(selector, str) and '||' in selector else [selector]
        last_err = None
        for sel in selectors:
            try:
                # wait for element to be attached and visible
                await self.page.wait_for_selector(sel, timeout=timeout)
                # Use locator click which is more resilient
                locator = self.page.locator(sel)
                await locator.scroll_into_view_if_needed()
                await locator.click(timeout=timeout)
                logger.debug(f"Clicked: {sel}")
                return
            except Exception as e:
                # Try fallback: evaluate JS to click the element directly
                last_err = e
                logger.debug(f"Attempt to click {sel} via locator failed: {e}")
                try:
                    script = f"const el = document.querySelector(`{sel}`); if(el) {{ el.click(); return true; }} return false;"
                    result = await self.page.evaluate(script)
                    if result:
                        logger.debug(f"Clicked via JS: {sel}")
                        return
                except Exception as e2:
                    logger.debug(f"JS click fallback failed for {sel}: {e2}")
                # continue to next selector
        logger.error(f"Failed to click {selector}: {last_err}")
        raise last_err
    
    async def fill_text(self, selector: str, text: str, timeout: int = 10000):
        """Fill text input"""
        try:
            await self.page.fill(selector, text, timeout=timeout)
            logger.debug(f"Filled text in {selector}")
        except Exception as e:
            logger.error(f"Failed to fill text in {selector}: {e}")
            raise
    
    async def get_text(self, selector: str, timeout: int = 10000):
        """Get element text"""
        try:
            text = await self.page.text_content(selector, timeout=timeout)
            return text
        except Exception as e:
            logger.error(f"Failed to get text from {selector}: {e}")
            return None
    
    async def evaluate_script(self, script: str):
        """Execute JavaScript"""
        try:
            # Wrap script in a function so top-level `return` statements are valid
            wrapped = f"() => {{ {script} }}"
            result = await self.page.evaluate(wrapped)
            logger.debug(f"Script executed successfully")
            return result
        except Exception as e:
            logger.error(f"Failed to execute script: {e}")
            raise
    
    async def wait_for_navigation(self, timeout: int = 30000):
        """Wait for page navigation"""
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout)
            logger.debug("Page loaded")
        except Exception as e:
            logger.error(f"Failed waiting for navigation: {e}")
