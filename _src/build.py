#!/usr/bin/env python3
"""Összeállítja az egyfájlos index.html-t (magyar) és en.html-t (angol, /en) a _src/ forrásaiból.

Használat:  cd _src && python3 build.py
Az angol változat a magyar forrásból készül: az i18n/apply.mjs a fordítási egységeket (HTML-szövegek, attribútumok,
JS-karakterláncok) az i18n/en_*.tsv párjai szerint cseréli. Hiányzó fordításnál vagy hibás párnál a build leáll.
(Előfeltétel: cd _src && npm install)
"""
import os, pathlib, shutil, subprocess, sys
R = pathlib.Path(__file__).parent

CLASSIC = ['core.js', 'data.js', 'w_ch1.js', 'w_ch2.js', 'w_ch3.js', 'w_ch4.js', 'w_ch5.js', 'toro_geo.js', 'w_ch6.js', 'w_ch7.js']
MODULES = ['s3d_common.js', 's3d_types.js', 's3d_alapsik.js', 's3d_toro.js']
SITE = 'https://sikalapoktervezese.vercel.app'
ALT = f"""<link rel="alternate" hreflang="hu" href="{SITE}/">
<link rel="alternate" hreflang="en" href="{SITE}/en">
<link rel="alternate" hreflang="x-default" href="{SITE}/">
"""
ICON = """<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' rx='9' fill='%2386b51c'/%3E%3Cpath d='M14 6v13M22 6v13' stroke='%2313200a' stroke-width='2.6' stroke-linecap='round'/%3E%3Cpath d='M9 19h18v6H9z' fill='%2313200a'/%3E%3Cpath d='M5 29h26' stroke='%23f3f4ee' stroke-width='2.2' stroke-dasharray='3 2.2'/%3E%3C/svg%3E">
<link rel="preload" href="fonts/ibm-plex-sans-latin-ext-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/bricolage-grotesque-latin-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script src="vendor/hyphenopoly/Hyphenopoly_Loader.js"></script>
"""
HYPH = """<script>
Hyphenopoly.config({
  require: { "%s": "FORCEHYPHENOPOLY" },
  setup: { hide: "none", selectors: { ".hyphenate": { minWordLength: 6, compound: "auto" } } }
});
</script>
<script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js","three/addons/":"./vendor/three/addons/"}}</script>
"""
HEAD = {
  'hu': ("""<title>Síkalapok tervezése</title>
<meta name="description" content="Interaktív tananyag: síkalap vagy mélyalap, a hét síkalaptípus 3D-ben, az alapsík felvétele (fagyhatár, talajvíz, szomszéd), határállapotok és a talajtörés három mechanizmusa – BME Alapozás.">
<meta name="theme-color" content="#18201c">
<meta property="og:title" content="Síkalapok tervezése">
<meta property="og:description" content="BME Alapozás – interaktív tananyag 3D modellekkel, csúszkás laborokkal, kvízekkel és 40 igaz/hamis állítással.">
""" + ALT + """<script>try{if(localStorage.getItem('alap-lang')==='en'&&!/[?&]hu\\b/.test(location.search))location.replace('en'+location.hash)}catch(e){}</script>
""" + ICON + HYPH % 'hu'),
  'en-GB': ("""<title>Design of shallow foundations</title>
<meta name="description" content="Interactive learning module: shallow or deep foundation, the seven types of shallow foundation in 3D, setting the foundation level (frost depth, groundwater, neighbours), limit states and the three mechanisms of bearing failure – BME Foundation Engineering.">
<meta name="theme-color" content="#18201c">
<meta property="og:title" content="Design of shallow foundations">
<meta property="og:description" content="BME Foundation Engineering – interactive module with 3D models, slider labs, quizzes and 40 true/false statements.">
""" + ALT + ICON + HYPH % 'en-gb'),
}

def build(src, out, lang):
    css = (src / 'css' / 'style.css').read_text()
    body = (src / 'index.src.html').read_text()
    js = lambda n: (src / 'js' / n).read_text() if (src / 'js' / n).exists() else f'/* hiányzik: {n} */'
    classic = ''.join(f"<script>\n{js(f)}\n</script>\n" for f in CLASSIC)
    # a modulok egyetlen modulba fűzve (közös hatókör)
    module = "<script type=\"module\">\n" + '\n'.join(js(f) for f in MODULES) + "\n</script>\n"
    full_body = body.replace('<!--SCRIPTS-->', classic + module)
    if lang != 'hu':   # a nyelvváltó a magyar oldalra mutat
        assert 'id="langSw" href="en" hreflang="en" lang="en"' in full_body
        full_body = full_body.replace('id="langSw" href="en" hreflang="en" lang="en"', 'id="langSw" href="./" hreflang="hu" lang="hu"')
    html = f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{HEAD[lang]}<style>
{css}
</style>
</head>
<body>
{full_body}
</body>
</html>
"""
    out.write_text(html)
    print(out.name, len(html) // 1024, 'KB')

build(R, R.parent / 'index.html', 'hu')

# angol változat: fordított források a _src/.en/ mappába, abból en.html
EN = R / '.en'
shutil.rmtree(EN, ignore_errors=True); (EN / 'css').mkdir(parents=True)
shutil.copy(R / 'css' / 'style.css', EN / 'css' / 'style.css')
files = ['index.src.html'] + [f'js/{n}' for n in CLASSIC + MODULES]
tsv = ','.join(str(p) for p in sorted((R / 'i18n').glob('en_*.tsv')))
r = subprocess.run(['node', str(R / 'i18n' / 'apply.mjs'), str(R), str(EN), tsv, *files], capture_output=True, text=True, env={**os.environ, 'STRICT': '1', 'NUMFIX': '1'})
print(r.stdout.strip())
if r.returncode:
    print(r.stderr[-2000:]); print('Az angol változat nem készült el (lásd fent; a hiányzó fordítások: _src/missing.tsv).'); sys.exit(1)
# tizedesvessző → pont a le nem fordított HTML-szövegekben (képletek, számok): csak a címkék közötti szövegben
import re
p = EN / 'index.src.html'; t = p.read_text()
p.write_text(re.sub(r'>([^<]*)<', lambda m: '>' + re.sub(r'(?<=\d),(?=\d)', '.', m.group(1)) + '<', t))
build(EN, R.parent / 'en.html', 'en-GB')
# az angol oldal a társoldalak angol változatára mutat (…/en, a fejezet-horgonnyal együtt)
p = R.parent / 'en.html'; t = p.read_text()
# (a társoldalak közül azok, amelyeknek már van angol változata)
for site in ['sikalapok-teherbirasszamitasa', 'sikalapok-sullyedesszamitasa', 'sikalapokallekonysagvizsgalata', 'kedvezotlen-altalaj']:
    t, n = re.subn(rf'https://{site}\.vercel\.app/(#[\w-]+)?(?=["\'])', lambda m, s=site: f'https://{s}.vercel.app/en' + (m.group(1) or ''), t); print(site, '→ /en:', n)
p.write_text(t)
