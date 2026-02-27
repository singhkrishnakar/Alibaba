"""
Project selection module
"""
from browser_manager import BrowserManager
from logger_setup import setup_logger

logger = setup_logger(__name__)


class ProjectSelector:
    """Handles project selection in LLM Toolkit"""
    
    def __init__(self, browser_manager: BrowserManager):
        self.browser = browser_manager
    
    async def navigate_to_project(self, project_name: str, base_url: str = "https://llmtoolkit-staging.innodata.com"):
        """
        Navigate to a project by name
        
        Args:
            project_name: Name of the project to select
            base_url: Base URL of the application
        """
        try:
            
            # Try to find and click the project, retrying for up to 30 seconds
            script = f"""
            const projects = Array.from(document.querySelectorAll('h3'));
            const project = projects.find(h => h.textContent.includes('{project_name}'));
            if (project) {{
                project.click();
                return true;
            }}
            // Also try clickable project links or cards
            const links = Array.from(document.querySelectorAll('a'));
            const link = links.find(a => a.textContent && a.textContent.includes('{project_name}'));
            if (link) {{
                link.click();
                return true;
            }}
            return false;
            """

            result = False
            import asyncio as _asyncio
            for _ in range(30):
                try:
                    result = await self.browser.evaluate_script(script)
                    if result:
                        break
                except Exception:
                    pass
                await _asyncio.sleep(1)

            if result:
                await self.browser.wait_for_navigation()
                logger.info(f"Selected project: {project_name}")
            else:
                # Gather available project titles for debugging
                try:
                    projects = await self.get_available_projects()
                except Exception:
                    projects = []
                raise Exception(f"Project '{project_name}' not found. Available projects: {projects}")
                
        except Exception as e:
            logger.error(f"Failed to navigate to project: {e}")
            raise
    
    async def get_available_projects(self):
        """Get list of available projects"""
        try:
            await self.browser.navigate_to("https://llmtoolkit-staging.innodata.com/dashboard")
            
            script = """
            const projects = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
            return projects;
            """
            
            projects = await self.browser.evaluate_script(script)
            logger.info(f"Found {len(projects)} projects")
            return projects
            
        except Exception as e:
            logger.error(f"Failed to get projects: {e}")
            return []
