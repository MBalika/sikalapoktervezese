import asyncio, sys, os
from playwright.async_api import async_playwright
url = sys.argv[1]; out = sys.argv[2]; os.makedirs(out, exist_ok=True)
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
STATES = [
 ('alt_fail3d', "TORO.P.load=1.0;"),
 ('alt_fail3d_xray', "TORO.P.load=1.0; document.querySelector('#tmXray').click();"),
 ('alt_2d', "document.querySelector('#tmView [data-v=\"2d\"]').click();"),
 ('helyi_2d', "document.querySelector('#tmMode [data-v=helyi]').click();"),
 ('beny_2d', "document.querySelector('#tmMode [data-v=beny]').click();"),
 ('beny_3d', "document.querySelector('#tmView [data-v=\"3d\"]').click();"),
 ('pill_3d', "document.querySelector('#tmMode [data-v=alt]').click(); document.querySelector('#tmShape [data-v=pill]').click();"),
 ('lemez_3d', "document.querySelector('#tmShape [data-v=lemez]').click();"),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 1440, 'height': 1000})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(url, wait_until='networkidle'); await pg.wait_for_timeout(1000)
        el = await pg.query_selector('#lab-toro')
        await pg.evaluate("document.querySelector('#lab-toro').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(1200)
        print(await pg.evaluate("[...document.querySelectorAll('#tmMode button,#tmView button,#tmShape button')].map(b=>b.dataset.v||b.dataset.m||b.outerHTML.slice(0,60)).join(' | ')"))
        for name, js in STATES:
            try:
                await pg.evaluate(js)
                await pg.evaluate("var l=document.querySelector('#tmLoad'); l.value=l.max; l.dispatchEvent(new Event('input'))")
            except Exception as e: print(name, 'ERR', str(e)[:200])
            await pg.wait_for_timeout(1500)
            await el.screenshot(path=f'{out}/{name}.png')
        print(errs); await b.close()
asyncio.run(main())
