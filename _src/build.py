#!/usr/bin/env python3
"""Összeállítja az egyfájlos index.html-t a _src/ forrásaiból.

Használat:  cd _src && python3 build.py
"""
import pathlib
R = pathlib.Path(__file__).parent
OUT = R.parent / 'index.html'

css = (R / 'css' / 'style.css').read_text()
body = (R / 'index.src.html').read_text()

CLASSIC = ['core.js', 'data.js', 'w_ch1.js', 'w_ch2.js', 'w_ch3.js', 'w_ch4.js', 'w_ch5.js', 'toro_geo.js', 'w_ch6.js', 'w_ch7.js']
MODULES = ['s3d_common.js', 's3d_types.js', 's3d_alapsik.js', 's3d_toro.js']

def js(name):
    p = R / 'js' / name
    return p.read_text() if p.exists() else f'/* hiányzik: {name} */'

classic = ''.join(f"<script>\n{js(f)}\n</script>\n" for f in CLASSIC)
# a modulok egyetlen modulba fűzve (közös hatókör)
mod_src = '\n'.join(js(f) for f in MODULES)
module = f"<script type=\"module\">\n{mod_src}\n</script>\n"

head = """<title>Síkalapok tervezése</title>
<meta name="description" content="Interaktív tananyag: síkalap vagy mélyalap, a hét síkalaptípus 3D-ben, az alapsík felvétele (fagyhatár, talajvíz, szomszéd), határállapotok és a talajtörés három mechanizmusa – BME Alapozás.">
<meta name="theme-color" content="#18201c">
<meta property="og:title" content="Síkalapok tervezése">
<meta property="og:description" content="BME Alapozás – interaktív tananyag 3D modellekkel, csúszkás laborokkal, kvízekkel és 40 igaz/hamis állítással.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' rx='9' fill='%2386b51c'/%3E%3Cpath d='M14 6v13M22 6v13' stroke='%2313200a' stroke-width='2.6' stroke-linecap='round'/%3E%3Cpath d='M9 19h18v6H9z' fill='%2313200a'/%3E%3Cpath d='M5 29h26' stroke='%23f3f4ee' stroke-width='2.2' stroke-dasharray='3 2.2'/%3E%3C/svg%3E">
<link rel="preload" href="fonts/ibm-plex-sans-latin-ext-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/bricolage-grotesque-latin-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script src="vendor/hyphenopoly/Hyphenopoly_Loader.js"></script>
<script>
Hyphenopoly.config({
  require: { "hu": "FORCEHYPHENOPOLY" },
  setup: { hide: "none", selectors: { ".hyphenate": { minWordLength: 6, compound: "auto" } } }
});
</script>
<script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js","three/addons/":"./vendor/three/addons/"}}</script>
"""

full_body = body.replace('<!--SCRIPTS-->', classic + module)
html = f"""<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}<style>
{css}
</style>
</head>
<body>
{full_body}
</body>
</html>
"""
OUT.write_text(html)
print('index.html', len(html) // 1024, 'KB')
