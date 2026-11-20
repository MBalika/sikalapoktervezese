import asyncio, sys, os, json
from playwright.async_api import async_playwright
# labs.py url outdir width [json actions: {"id":"js"}] 
url, out, W = sys.argv[1], sys.argv[2], int(sys.argv[3])
acts = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
sel = sys.argv[5] if len(sys.argv) > 5 else '.lab'
os.makedirs(out, exist_ok=True)
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': W, 'height': 1000})
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto(url, wait_until='networkidle'); await pg.wait_for_timeout(1200)
        ids = await pg.evaluate(f"[...document.querySelectorAll('{sel}')].map((e,i)=>e.id||(e.id='x'+i))")
        for i in ids:
            if acts and i not in acts and not acts.get('*'): continue
            el = await pg.query_selector('#' + i)
            await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(900)
            if i in acts and acts[i]:
                await pg.evaluate(acts[i]); await pg.wait_for_timeout(float(acts.get(i + ':wait', 1200)))
            await el.screenshot(path=f'{out}/{i}.png')
        print('\n'.join(errs[:10])); await b.close()
asyncio.run(main())
