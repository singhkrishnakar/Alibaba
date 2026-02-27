"""
Authentication module for LLM Toolkit
"""
from browser_manager import BrowserManager
from config import UserCredentials
from logger_setup import setup_logger

logger = setup_logger(__name__)


class LLMToolkitAuthenticator:
    """Handles authentication for LLM Toolkit"""
    
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def login(self, credentials: UserCredentials, base_url: str = "https://llmtoolkit-staging.innodata.com"):
        """
        Login to LLM Toolkit
        
        Args:
            credentials: User credentials
            base_url: Base URL of the application
        """
        try:
            # Navigate to login page
            login_url = f"{base_url}/login"
            await self.browser.navigate_to(login_url)
            logger.info(f"Navigated to login page: {login_url}")
            
            # Robustly fill email and password using multiple possible selectors
            selectors_email = [
                "input[type='email']",
                "input[name='email']",
                "input#email",
                "input[placeholder*='Email']",
                "input[placeholder*='email']"
            ]
            selectors_password = [
                "input[type='password']",
                "input[name='password']",
                "input#password",
                "input[placeholder*='Password']",
                "input[placeholder*='password']"
            ]

            async def try_fill(selectors, value):
                for sel in selectors:
                    try:
                        element = await self.browser.find_element(sel, timeout=15000)
                        if element:
                            await self.browser.fill_text(sel, value, timeout=15000)
                            return True
                    except Exception:
                        continue
                return False

            email_filled = await try_fill(selectors_email, credentials.email)
            if email_filled:
                logger.info("Filled email field")
            else:
                raise Exception("Email input not found")

            password_filled = await try_fill(selectors_password, credentials.password)
            if password_filled:
                logger.info("Filled password field")
            else:
                raise Exception("Password input not found")

            # Click login button (try multiple variants with robust click)
            submit_selectors = ["button[type='submit']", "button:has-text('Login')", "button:has-text('Sign in')", "button:has-text('Sign In')"]
            # join selectors so BrowserManager.click will attempt each
            combined = '||'.join(submit_selectors)
            try:
                await self.browser.click(combined, timeout=3000)
                logger.info("Clicked login button (one of selectors)")
            except Exception as e:
                logger.error(f"Login button not found or clickable: {e}")
                raise
            
            # Wait for navigation to dashboard
            await self.browser.wait_for_navigation()
            logger.info("Login successful - navigated to dashboard")
            
        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise
    
    async def logout(self):
        """Logout from LLM Toolkit"""
        try:
            # Click user menu
            user_menu = await self.browser.find_element("[data-testid='user-menu']")
            if user_menu:
                await self.browser.click("[data-testid='user-menu']")
                
                # Click logout option
                await self.browser.click("[data-testid='logout-button']")
                logger.info("Logout successful")
            else:
                logger.warning("User menu not found")
        except Exception as e:
            logger.error(f"Logout failed: {e}")
