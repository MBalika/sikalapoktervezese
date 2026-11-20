import asyncio, sys, os
from playwright.async_api import async_playwright
url = sys.argv[1]; out = sys.argv[2]; W = int(sys.argv[3]) if len(sys.argv) > 3 else 1440; os.makedirs(out, exist_ok=True)
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': W, 'height': 1000})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(url, wait_until='networkidle'); await pg.wait_for_timeout(1000)
        await pg.evaluate("document.querySelector('#alapsik3d').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(1200)
        el = await pg.query_selector('#alapsik3d')
        n = await pg.evaluate("document.querySelectorAll('#aPreset button').length")
        for i in range(n):
            await pg.evaluate(f"document.querySelectorAll('#aPreset button')[{i}].click()"); await pg.wait_for_timeout(900)
            await el.screenshot(path=f'{out}/p{i}.png')
        print(errs); await b.close()
asyncio.run(main())
