# Síkalapok tervezése

Interaktív tananyag a BME Építőmérnöki Kar *Alapozás* tárgyához – a „Síkalapok tervezése” jegyzet 1–1.2.4. fejezete (18. oldal aljáig) és a 3. előadás diái alapján, webes forrásokkal kiegészítve. A sorozatban ez előzi meg a *Síkalapok teherbírásszámítása* oldalt.

**Élő oldal:** https://sikalapoktervezese.vercel.app

## Tartalom (metróvonal-navigáció, 7 állomás)
1. **Síkalap vagy mélyalap?** – alapozási döntő (építmény, teherbíró réteg, talajvíz, kimosás, ferde teher), valós példák (MOL Campus, Burj Khalifa)
2. **Alaptípusok** – 3D alaptípus-labor (sáv, pillér, szalag, gerendarács, lemez, doboz, héj; változatok, teherút-részecskék), sávalap-metszet szerkesztő a szerkesztési szabályokkal, válaszfal-alapozás, pillér–alaptest kapcsolatok, lemezváltozatok, fotógaléria, Körszálló, játék
3. **A tervezés menete** – telek-szkenner (5 szempontcsoport), lejátszható folyamatábra négy forgatókönyvvel, linkek a társoldalakra
4. **Az alapsík** – 3D alapsík-tervező (fagyhatár, teherbíró réteg, talajvíz, pince, duzzadó agyag, szomszéd; téli jéglencse-animáció), fagyhatár-kalkulátor hőmérséklet-profillal, rézsűvonal-próba, lépcsőtervező, melléépítés-animáció, alapsík-detektív
5. **Határállapotok** – animált ULS/SLS kártyák, mozgáslétra, Transcona és Pisa, határállapot-játék, eljárás-választó, új EC7 (MOST/ÚJ), GC-mátrix, sorba rendezés
6. **Talajtörés** – törésimechanizmus-labor: forgatható 3D és 2D (általános, helyi, benyomódás; T_re, I_c, φ′, B, D/B*, alaptípus), teher–süllyedés görbe, Vesić-térkép, idő–süllyedés görbék
7. **Önellenőrzés** – 40 igaz/hamis, eredménytábla, fogalomtár

## Szerkesztés
- Források: `_src/` (a Vercel nem teszi ki: `.vercelignore`)
  - `index.src.html`, `css/style.css`
  - `js/core.js` (közös motor, formázás-őr, kvíz/játék), `data.js` (kvízek, igaz/hamis, fogalomtár), `w_ch1…7.js` (fejezetek), `toro_geo.js` (törési mechanizmus geometriája és 2D rajza)
  - 3D (three.js r169, saját tárhelyről): `s3d_common.js`, `s3d_types.js`, `s3d_alapsik.js`, `s3d_toro.js`
- Újraépítés: `cd _src && python3 build.py` → egyfájlos `index.html`
- Betűk (Bricolage Grotesque, IBM Plex Sans/Mono) a `fonts/`, a three.js és a Hyphenopoly (magyar elválasztás) a `vendor/` mappában – nincs külső CDN-hívás.

A `main` ágra történő push után a Vercel automatikusan frissíti az oldalt.
