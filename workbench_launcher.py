"""
Workbench launcher module
"""
from browser_manager import BrowserManager
from logger_setup import setup_logger

logger = setup_logger(__name__)


class WorkbenchLauncher:
    """Handles launching the workbench from project"""
    
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def launch_workbench(self):
        """
        Click three-dot menu and launch workbench
        """
        try:
            logger.info("Launching workbench...")
            
            # Try to find and click three-dot menu button
            menu_selectors = [
                "button[aria-label*='More']",
                "button[aria-label*='menu']",
                "button:has-text('⋮')",
                "button.menu-button",
                "button[data-testid*='menu']"
            ]
            
            menu_clicked = False
            for sel in menu_selectors:
                try:
                    await self.browser.click(sel, timeout=10000)
                    menu_clicked = True
                    logger.info(f"Clicked three-dot menu ({sel})")
                    break
                except Exception:
                    continue
            
            if not menu_clicked:
                logger.warning("Could not find three-dot menu, trying direct workbench button")
            
            # Wait a bit for menu to appear
            await self.browser.page.wait_for_timeout(500)
            
            # Click "Launch Workbench" option
            workbench_selectors = [
                "button:has-text('Launch Workbench')",
                "a:has-text('Launch Workbench')",
                "button:has-text('launch Workbench')",
                "div:has-text('Launch Workbench')",
            ]
            
            workbench_clicked = False
            for sel in workbench_selectors:
                try:
                    await self.browser.click(sel, timeout=10000)
                    workbench_clicked = True
                    logger.info(f"Clicked Launch Workbench ({sel})")
                    break
                except Exception:
                    continue
            
            if not workbench_clicked:
                raise Exception("Could not find or click 'Launch Workbench' option")
            
            # Wait for workbench to load
            await self.browser.wait_for_navigation()
            logger.info("Workbench launched successfully")
            
        except Exception as e:
            logger.error(f"Failed to launch workbench: {e}")
            raise
