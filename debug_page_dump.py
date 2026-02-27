import asyncio
from browser_manager import BrowserManager

async def t():
    b=BrowserManager(headless=False)
    await b.launch()
    await b.navigate_to('https://llmtoolkit-staging.innodata.com/dashboard')
    text = await b.evaluate_script("return document.body ? document.body.innerText.slice(0,2000) : '';")
    h3s = await b.evaluate_script("return Array.from(document.querySelectorAll('h3')).map(h=>h.textContent);")
    links = await b.evaluate_script("return Array.from(document.querySelectorAll('a')).map(a=>a.textContent);")
    print('BODY:', text)
    print('H3S:', h3s)
    print('LINKS SAMPLE:', links[:30])
    await b.close()

if __name__ == '__main__':
    asyncio.run(t())
