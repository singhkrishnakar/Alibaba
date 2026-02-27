import asyncio
from project_selector import ProjectSelector
from browser_manager import BrowserManager

async def t():
    b=BrowserManager(headless=False)
    await b.launch()
    await b.navigate_to('https://llmtoolkit-staging.innodata.com/dashboard')
    ps=ProjectSelector(b)
    projects = await ps.get_available_projects()
    print('PROJECTS:', projects)
    await b.close()

if __name__ == '__main__':
    asyncio.run(t())
