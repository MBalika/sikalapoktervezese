/* ===== 05 – Határállapotok ===== */
const LIMIT = (() => {
  // mini jelenetek: draw(g, f, p) – p: 0..1 animációs fázis
  const soil = (g, f, y = 120, kind = 'homok') => { S('rect', { x: 0, y, width: 300, height: 190 - y, fill: f(kind), opacity: .75 }, g); S('line', { x1: 0, y1: y, x2: 300, y2: y, stroke: '#3d5a1f', 'stroke-width': 3 }, g); };
  const T = (g, x, y, t, col) => S('text', { x, y, class: 't-s', style: `fill:${col || 'var(--ink-2)'};font-weight:600`, text: t }, g);
  const footing = (g, f, ox, oy, rot = 0, cx = 150, cy = 140) => {
    const gg = S('g', { transform: `translate(${ox} ${oy}) rotate(${rot} ${cx} ${cy})` }, g);
    S('rect', { x: 110, y: 130, width: 80, height: 22, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, gg);
    S('rect', { x: 140, y: 40, width: 20, height: 90, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, gg);
    return gg;
  };
  const scenes = {
    borulas: { code: 'EQU', n: 'a) Felborulás (általános állékonyság)', d: (g, f, p, id) => { soil(g, f); const r = smooth(p) * 16; const gg = footing(g, f, 0, 0, r, 190, 152); S('line', { x1: 60, y1: 50, x2: 132, y2: 50, style: 'stroke:var(--bad);stroke-width:3', 'marker-end': `url(#${id}-arrbad)` }, gg); T(g, 10, 180, 'billenés az alaptest élén'); } },
    tores: { code: 'GEO', n: 'b) Talajtörés, átfúródás, kipréselődés', d: (g, f, p, id) => { const e = smooth(p); S('rect', { x: 0, y: 120, width: 300, height: 70, fill: f('homok'), opacity: .75 }, g); S('path', { d: `M110 152 Q120 ${185} 170 186 Q220 182 250 ${120 - e * 10} L300 120`, fill: 'rgba(214,72,140,.28)', stroke: 'rgba(214,72,140,.7)', 'stroke-width': 1.5 }, g); S('path', { d: `M0 120 H190 Q220 ${120 - e * 14} 250 ${120 - e * 10} L300 120`, stroke: '#3d5a1f', 'stroke-width': 3, fill: 'none' }, g); footing(g, f, 0, e * 14, -e * 6, 150, 150); S('path', { d: 'M140 172 Q180 186 214 154', style: 'stroke:var(--ink-2);stroke-width:1.6;fill:none', 'marker-end': `url(#${id}-arr)` }, g); T(g, 10, 180, 'csúszólap a talajban'); } },
    csuszas: { code: 'GEO', alt: 'vagy EQU', n: 'c) Elcsúszás az alapsíkon', d: (g, f, p, id) => { soil(g, f); const dx = smooth(p) * 36; S('rect', { x: 110, y: 130, width: 80, height: 22, style: 'fill:none;stroke:var(--ink-3);stroke-dasharray:4 3' }, g); footing(g, f, dx, 0); S('line', { x1: 40, y1: 70, x2: 120 + dx, y2: 70, style: 'stroke:var(--bad);stroke-width:3', 'marker-end': `url(#${id}-arrbad)` }, g); T(g, 10, 180, 'eltolódás az alapsíkon'); } },
    str: { code: 'STR', n: 'd) Az alaptest tönkremenetele', d: (g, f, p) => { soil(g, f); const e = smooth(p); S('rect', { x: 110, y: 130, width: 52, height: 22, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, g); S('rect', { x: 140, y: 40, width: 20, height: 90, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, g); const gg = S('g', { transform: `translate(${e * 10} ${e * 6}) rotate(${e * 22} 162 152)` }, g); S('path', { d: 'M162 130 H190 V152 H168 Z', fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, gg); S('path', { d: 'M162 130 L168 152', style: 'stroke:var(--bad);stroke-width:2' }, g); T(g, 10, 180, 'az alaptest eltörik'); } },
    egyutt: { code: 'STR', n: 'e) Szerkezet és altalaj együttes tönkremenetele', d: (g, f, p, id) => { const e = smooth(p); S('rect', { x: 0, y: 120, width: 300, height: 70, fill: f('homok'), opacity: .75 }, g); S('path', { d: `M0 120 H200 Q235 ${120 - e * 16} 270 ${120 - e * 4} L300 120`, stroke: '#3d5a1f', 'stroke-width': 3, fill: 'none' }, g); S('rect', { x: 110, y: 130, width: 52, height: 22, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, g); S('rect', { x: 140, y: 40, width: 20, height: 90, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, g); const gg = S('g', { transform: `translate(${e * 12} ${e * 8}) rotate(${e * 26} 162 152)` }, g); S('path', { d: 'M162 130 H190 V152 H168 Z', fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, gg); S('path', { d: 'M196 160 Q226 150 244 132', style: 'stroke:var(--ink-2);stroke-width:1.6;fill:none', 'marker-end': `url(#${id}-arr)` }, g); T(g, 10, 180, 'törés és talajkinyomódás'); } },
    upl: { code: 'UPL', n: 'f) Felúszás', d: (g, f, p, id) => { const e = smooth(p); S('rect', { x: 0, y: 70, width: 300, height: 120, fill: f('homok'), opacity: .75 }, g); S('rect', { x: 0, y: 92, width: 300, height: 98, fill: f('viz') }, g); S('line', { x1: 0, y1: 92, x2: 300, y2: 92, style: 'stroke:var(--water);stroke-width:2' }, g); S('line', { x1: 0, y1: 70, x2: 300, y2: 70, stroke: '#3d5a1f', 'stroke-width': 3 }, g); S('path', { d: `M100 ${50 - e * 26} V${160 - e * 26} H200 V${50 - e * 26} H188 V${148 - e * 26} H112 V${50 - e * 26} Z`, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.4' }, g); for (let i = 0; i < 5; i++) S('line', { x1: 112 + i * 19, y1: 186, x2: 112 + i * 19, y2: 166 - e * 26, style: 'stroke:var(--water);stroke-width:2.4', 'marker-end': `url(#${id}-arrw)` }, g); T(g, 10, 30, 'üres medence, magas talajvíz'); } },
    sully: { code: 'SLS', n: 'Túlzott süllyedés', d: (g, f, p, id) => { soil(g, f); const e = smooth(p) * 18; S('rect', { x: 110, y: 130, width: 80, height: 22, style: 'fill:none;stroke:var(--ink-3);stroke-dasharray:4 3' }, g); footing(g, f, 0, e); S('line', { x1: 150, y1: 4, x2: 150, y2: 34 + e, style: 'stroke:var(--bad);stroke-width:3', 'marker-end': `url(#${id}-arrbad)` }, g); T(g, 200, 160 + e / 2, 'Δh', 'var(--bad)'); } },
    kulonb: { code: 'SLS', n: 'Süllyedéskülönbség', d: (g, f, p) => { soil(g, f); const e = smooth(p) * 18; S('path', { d: `M60 ${60} L240 ${60 + e}`, style: 'stroke:var(--ink-2);stroke-width:8' }, g); S('rect', { x: 52, y: 60, width: 16, height: 70, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('rect', { x: 232, y: 60 + e, width: 16, height: 70, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('rect', { x: 36, y: 130, width: 48, height: 18, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('rect', { x: 216, y: 130 + e, width: 48, height: 18, fill: f('beton'), style: 'stroke:var(--ink)' }, g); T(g, 120, 40, 'elferdülő keret'); } },
    rezges: { code: 'SLS', n: 'Elfogadhatatlan rezgés', d: (g, f, p) => { soil(g, f); const ph = p * 12; S('path', { d: 'M30 120 V70 L70 44 L110 70 V120 Z', style: 'fill:var(--c2);opacity:.75;stroke:var(--ink-2)' }, g); S('rect', { x: 236, y: 10, width: 18, height: 40, fill: '#e2b43a', style: 'stroke:var(--ink-2)' }, g); S('rect', { x: 240, y: 50, width: 10, height: 120, fill: f('beton'), style: 'stroke:var(--ink)' }, g); let d = 'M120 120'; for (let x = 120; x <= 230; x += 4) d += ` L${x} ${120 + Math.sin((x + ph * 20) / 7) * 6 * Math.max(0, 1 - Math.abs(x - 175) / 70)}`; S('path', { d, style: 'stroke:var(--bad);stroke-width:2;fill:none' }, g); T(g, 120, 30, 'cölöpverés a szomszédban'); } },
    emel: { code: 'SLS', n: 'Túlzott megemelkedés', d: (g, f, p, id) => { soil(g, f, 120, 'duzz'); const e = smooth(p) * 14; S('path', { d: `M40 ${120 - e * .4} Q150 ${120 - e * 1.6} 260 ${120 - e * .4}`, style: 'stroke:var(--ink);stroke-width:6;fill:none' }, g); for (let i = 0; i < 4; i++) S('line', { x1: 90 + i * 40, y1: 176, x2: 90 + i * 40, y2: 140 - e, style: 'stroke:var(--c2);stroke-width:2.4', 'marker-end': `url(#${id}-arrk)` }, g); T(g, 10, 30, 'duzzadó agyag megemeli a padlót'); } }
  };
  function card(key, parent) {
    const s = scenes[key];
    const c = H('button', { type: 'button', cls: 'card', style: 'text-align:left;cursor:pointer;padding:12px' }, parent);
    const svg = S('svg', { viewBox: '0 0 300 190', class: 'fig', id: 'lim-' + key }, c);
    const b = H('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:8px' }, c);
    H('span', { cls: 'tag', text: s.code }, b);
    if (s.alt) H('span', { cls: 'tag', text: s.alt, style: 'background:var(--c7s);color:var(--c7)' }, b);
    H('b', { text: s.n, style: 'font-size:.92rem' }, b);
    let p = 0, raf = null, dir = 1;
    const paint = () => { svg.innerHTML = ''; const { f, id } = soilDefs(svg); const g = S('g', {}, svg); s.d(g, f, p, id); };
    paint();
    c.addEventListener('click', () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now(), p0 = p, target = p > 0.5 ? 0 : 1;
      const step = now => { const k = clamp((now - t0) / 1600, 0, 1); p = lerp(p0, target, k); paint(); if (k < 1) raf = requestAnimationFrame(step); else if (key === 'rezges' && target === 1) { /* rezgés: ismétlés */ const t1 = performance.now(); const loop = n2 => { p = 1 + ((n2 - t1) / 1000) % 1; paint(); if (p > 0.5) raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); } };
      raf = requestAnimationFrame(step);
    });
    return { svg, paint: (pp) => { p = pp; paint(); } };
  }
  function pic(key) { return el => { const svg = S('svg', { viewBox: '0 0 300 190', class: 'fig', style: 'max-width:300px' }, el); const { f, id } = soilDefs(svg); const g = S('g', {}, svg); scenes[key].d(g, f, 1, id); }; }
  return { scenes, card, pic };
})();

onReady(function hatarCards() {
  const ug = $('#ulsGrid'), sg = $('#slsGrid');
  if (ug) ['borulas', 'tores', 'csuszas', 'str', 'egyutt', 'upl'].forEach(k => LIMIT.card(k, ug));
  if (sg) ['sully', 'kulonb', 'rezges', 'emel'].forEach(k => LIMIT.card(k, sg));
});

/* ---- Mozgáslétra ---- */
onReady(function letra() {
  const svg = $('#letraSvg'); if (!svg) return;
  const inp = $('#letra');
  const STAGES = [
    [0, 'Nincs látható hatás', 'A mozgás olyan kicsi, hogy semmilyen kárt nem okoz.'],
    [15, 'Esztétikai „zavar”', 'Már kisebb mozgásoknál is: az építmény dőlése, a padlólemez behajlása, a burkolatok ferdülése. Csökkenti az épület értékét, és a laikusokban riadalmat kelt.'],
    [42, 'A használhatóság korlátozódik', 'Kisebb repedések a falakon, a nyílászárók befeszülése, a padlók dőlése, csatlakozási problémák a járdákhoz és a szomszédos épületekhez.'],
    [72, 'A felszerkezet károsodik', 'Még nagyobb mozgásoknál a felszerkezet jelentősen károsodhat, tönkremehet: törés alakulhat ki. Ez már a felszerkezet teherbírási (STR) határállapota.']
  ];
  function draw(v) {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    const e = v / 100;
    const sR = e * 34; // jobb oldali süllyedés px
    const prof = x => sR * Math.pow((x - 180) / 360, 2);
    S('rect', { x: 0, y: 238, width: 720, height: 62, fill: f('agyag'), opacity: .7 }, g);
    let gd = 'M0 238 L180 238'; for (let x = 180; x <= 540; x += 10) gd += ` L${x} ${238 + prof(x)}`; gd += ' L720 ' + (238 + sR);
    S('path', { d: gd, stroke: '#3d5a1f', 'stroke-width': 3, fill: 'none' }, g);
    // ház: alsó él a profilt követi
    const L = 180, R = 540, top = 60;
    const yb = x => 238 + prof(x);
    S('path', { d: `M${L} ${yb(L)} ${Array.from({ length: 37 }, (_, i) => { const x = L + i * 10; return `L${x} ${yb(x)}`; }).join(' ')} L${R} ${top + sR * 0.55} L${L} ${top} Z`, style: 'fill:var(--card-2);stroke:var(--ink-2);stroke-width:2' }, g);
    S('path', { d: `M${L - 12} ${top} L${(L + R) / 2} ${top - 46 + sR * 0.25} L${R + 12} ${top + sR * 0.55} Z`, style: 'fill:var(--c2);opacity:.8;stroke:var(--ink-2)' }, g);
    // ablakok
    const skew = e * 6;
    [[220, 100], [320, 100], [420, 100], [220, 170], [420, 170]].forEach(([x, y]) => {
      const dy = prof(x) * 0.8;
      S('path', { d: `M${x} ${y + dy} l60 ${skew * 0.6} l${-skew * 0.2} 44 l-60 ${-skew * 0.6} Z`, style: 'fill:var(--water-soft);stroke:var(--ink-3);stroke-width:1.4' }, g);
    });
    S('path', { d: `M330 ${178 + prof(330) * 0.8} l46 ${skew * 0.5} l${-skew * 0.4} ${58 + prof(376) - prof(330)} l-46 ${-skew * 0.5} Z`, style: 'fill:var(--c6s);stroke:var(--ink-3);stroke-width:1.4' }, g);
    // repedések
    if (v > 42) {
      const w = 1 + (v - 42) / 12;
      [[290, 150], [490, 120], [400, 214]].forEach(([x, y], i) => { const dy = prof(x) * 0.8; S('path', { d: `M${x} ${y + dy} l${8 + i * 2} 14 l-6 10 l12 18`, style: `stroke:var(--bad);stroke-width:${w};fill:none` }, g); });
    }
    if (v > 72) {
      S('path', { d: `M470 ${70 + sR * 0.5} l-20 40 l16 26 l-22 46 l14 40`, style: `stroke:var(--bad);stroke-width:${3 + (v - 72) / 7};fill:none` }, g);
      S('text', { x: 590, y: 120, class: 't-b', style: 'fill:var(--bad)', text: 'törés!' }, g);
    }
    if (v > 15) {
      S('line', { x1: 560, y1: 238, x2: 560, y2: 238 + sR, style: 'stroke:var(--bad);stroke-width:2' }, g);
      S('text', { x: 568, y: 238 + sR / 2 + 4, class: 't-s', style: 'fill:var(--bad)', text: 'Δs' }, g);
    }
    // vízmérték a padlón
    const slope = (prof(540) - prof(180)) / 360;
    S('text', { x: 20, y: 30, class: 't-s t-m', text: `szögtorzulás β ≈ ${v ? '1/' + Math.round(1 / Math.max(1e-6, e / 70)) : '0'}` }, g);
  }
  function render() {
    const v = +inp.value;
    let s = STAGES[0]; for (const x of STAGES) if (v >= x[0]) s = x;
    $('#letraO').textContent = s[1];
    $('#letraTxt').innerHTML = `<b>${s[1]}.</b> ${s[2]}`;
    draw(v);
  }
  inp.addEventListener('input', render);
  render();
});

/* ---- Játék: melyik határállapot? ---- */
onReady(function hatarJatek() {
  const O = ['GEO – talajtörés', 'STR – szerkezeti', 'EQU – helyzeti állékonyság', 'UPL – felúszás', 'SLS – használhatósági'];
  renderGame($('#gameHatar'), {
    title: 'Melyik határállapot? – kilenc eset', key: 'g5', o: O,
    cases: [
      { sit: 'Egy tavaszi árvíz után az üres úszómedence kiemelkedik a talajból.', pic: LIMIT.pic('upl'), a: 3, e: 'A felhajtóerő nagyobb lett, mint a könnyű, üres szerkezet súlya: felúszás.' },
      { sit: 'Viharban a reklámtábla pilléralapja az élén átfordul.', pic: LIMIT.pic('borulas'), a: 2, e: 'Merev testként való helyzetváltozás, a szilárdságok nem játszanak szerepet: EQU.' },
      { sit: 'A silótorony első feltöltésekor az alaplemez alatt mély csúszólap alakul ki, a siló megdől, mellette felpúposodik a talaj.', pic: LIMIT.pic('tores'), a: 0, e: 'Az alap alatti talajtörés: GEO – mint 1913-ban Transconában.' },
      { sit: 'A túl vékony pilléralapot a pillér átszúrja.', pic: LIMIT.pic('str'), a: 1, e: 'Az alaptest mint tartószerkezet ment tönkre (átszúródás): STR.' },
      { sit: 'A lakóház egyik sarka 3 cm-rel többet süllyed: a nyílászárók befeszülnek, a vakolat megreped.', pic: LIMIT.pic('kulonb'), a: 4, e: 'A süllyedéskülönbség a használhatóságot rontja: használhatósági határállapot.' },
      { sit: 'A szomszéd telken cölöpverés folyik, a rezgés zavarja a lakóház használatát.', pic: LIMIT.pic('rezges'), a: 4, e: 'Az elfogadhatatlan mértékű rezgés használhatósági határállapot.' },
      { sit: 'A duzzadó agyag a csapadékos ősszel megemeli a pince padlóját.', pic: LIMIT.pic('emel'), a: 4, e: 'A duzzadás, fagy vagy más okok miatti túlzott megemelkedés használhatósági határállapot.' },
      { sit: 'A támfal talpa a földnyomás hatására az alapsíkon elmozdul.', pic: LIMIT.pic('csuszas'), a: [0, 2], e: 'Az EC7 szerint az alapsíkon való elcsúszás GEO (a talaj nyírószilárdsága dönt); EQU-ként is szokás besorolni. Mindkét választ elfogadjuk.' },
      { sit: 'Az alaptest konzolja letörik, és a darab a talajjal együtt kifordul.', pic: LIMIT.pic('egyutt'), a: 1, e: 'A tartószerkezet és az altalaj együttes tönkremenetele STR jellegű.' }
    ]
  });
});

/* ---- Eljárás-választó ---- */
onReady(function eljaras() {
  const el = $('#eljaras'); if (!el) return;
  const O = ['Közvetlen', 'Közvetett', 'Szokáson alapuló'];
  const C = [
    ['Sávalap homokon: törőfeszültség-képlettel igazolod a talajtörést, süllyedésszámítással a használhatóságot.', 0, 'Minden határállapotra saját számítási modell: közvetlen tervezési eljárás.'],
    ['Kis családi ház: a CPT-szondázás csúcsellenállásából tapasztalati képlettel becsülöd a talajtörési ellenállást.', 1, 'Összehasonlító tapasztalat és terepi mérés: közvetett eljárás – az 1. és részben a 2. geotechnikai kategóriában.'],
    ['Ép gránitra alapozott hídfő: a kőzet típusa, tagoltsága és egyirányú nyomószilárdsága alapján megengedett talpfeszültséget veszel fel.', 2, 'Valószínűsített talajtörési ellenállás kőzetre: szokáson alapuló eljárás (G melléklet).'],
    ['Lemezalap végeselemes modellje, amelyben a teher–süllyedés kapcsolatot egészen a törési állapotig vizsgálod.', 0, 'A numerikus méretezés is a közvetlen tervezési eljárás része (az új EC7-ben: számításon alapuló tervezés).']
  ];
  const grid = H('div', { cls: 'grid g2x2' }, el);
  C.forEach(([t, a, e]) => {
    const c = H('div', { cls: 'card' }, grid);
    H('p', { cls: 'small', text: t, style: 'margin-bottom:10px' }, c);
    const ops = H('div', { cls: 'chips' }, c);
    const fb = H('div', { cls: 'fb' }, c);
    O.forEach((o, i) => H('button', {
      type: 'button', text: o, onclick: ev => {
        $$('button', ops).forEach(b => b.disabled = true);
        ev.target.classList.add('on');
        ev.target.style.background = i === a ? 'var(--ok)' : 'var(--bad)'; ev.target.style.borderColor = ev.target.style.background;
        if (i !== a) { const r = ops.children[a]; r.classList.add('on'); r.style.background = 'var(--ok)'; r.style.borderColor = 'var(--ok)'; }
        fb.className = 'fb show ' + (i === a ? 'ok' : 'no'); fb.innerHTML = `<b>${i === a ? 'Helyes!' : 'Nem egészen.'}</b> ${e}`;
      }
    }, ops));
  });
});

/* ---- GC-mátrix ---- */
onReady(function gcMatrix() {
  const el = $('#gcMx'), out = $('#gcOut'); if (!el) return;
  const CC = { CC3: 'Nagy következmény: sok ember életét veszélyeztető vagy nagy gazdasági, társadalmi kárral járó tönkremenetel (pl. stadion, kórház, magas középület).', CC2: 'Normál következmény: a szokásos lakó- és irodaépületek.', CC1: 'Kis következmény: pl. mezőgazdasági épület, raktár, ahol ritkán tartózkodnak emberek.' };
  const GCC = { GCC1: 'Kisebb komplexitás: elhanyagolható bizonytalanság, egyenletes talajviszonyok, bevált technológia, elszigetelt sekély alapok, egyszerű talaj–szerkezet kölcsönhatás.', GCC2: 'Normál komplexitás: minden, ami nem tartozik a kisebb vagy a nagyobb osztályba.', GCC3: 'Nagyobb komplexitás: jelentős bizonytalanság, nehéz talajviszonyok vagy geológia, jelentős talajvízérzékenység, összetett talaj–szerkezet kölcsönhatás.' };
  const GC = { GC1: 'Egyszerű, tapasztalaton is alapuló igazolás lehet; minimális feltárás, a szokásos ellenőrzés.', GC2: 'Szokásos feltárás és számítással való igazolás, rendszeres ellenőrzés a kivitelezés során.', GC3: 'Kiterjedt feltárás, részletes elemzés, szigorúbb (akár független) tervellenőrzés, fokozott felügyelet és monitoring.' };
  const V = { CC3: ['GC2', 'GC3', 'GC3'], CC2: ['GC2', 'GC2', 'GC3'], CC1: ['GC1', 'GC2', 'GC2'] };
  H('div', { cls: 'h', text: '' }, el);
  ['GCC1 kisebb', 'GCC2 normál', 'GCC3 nagyobb'].forEach(t => H('div', { cls: 'h', text: t }, el));
  ['CC3', 'CC2', 'CC1'].forEach(cc => {
    H('div', { cls: 'h', text: cc }, el);
    V[cc].forEach((gc, i) => {
      const b = H('button', { type: 'button', cls: gc.toLowerCase().replace('gc', 'g'), text: gc }, el);
      b.addEventListener('click', () => {
        $$('button', el).forEach(x => x.classList.toggle('on', x === b));
        const gcc = 'GCC' + (i + 1);
        out.innerHTML = `<div class="verdict">${cc} + ${gcc} → <b>${gc}</b></div><p class="small just"><b>${cc}:</b> ${CC[cc]}</p><p class="small just"><b>${gcc}:</b> ${GCC[gcc]}</p><p class="small just"><b>${gc} jellemzően:</b> ${GC[gc]}</p>`;
      });
    });
  });
  out.innerHTML = '<p class="small just">A következményosztály (sor) és a geotechnikai komplexitási osztály (oszlop) együtt adja a besorolást. Kattints egy cellára a magyarázatért!</p>';
});

/* ---- Sorba rendezés ---- */
onReady(function sorrend() {
  const el = $('#sorrend'); if (!el) return;
  let items = [['SLS', 'süllyedés, süllyedéskülönbség'], ['GEO', 'talajtörés'], ['UPL', 'felúszás'], ['STR', 'szerkezeti megfelelőség']];
  const NOTE = {
    UPL: 'A könnyű, víz alá kerülő szerkezetnél a felúszás gyakran a mértékadó – különösen építés közben, amikor még hiányzik a feltöltés és a felszerkezet súlya.',
    STR: 'A víznyomás a lemezt alulról terheli: hajlításra, nyírásra méretezni kell, és vízzáróságot is igényel.',
    GEO: 'A talajtörés könnyű szerkezetnél ritkán kritikus, de építési állapotban, nagy pontterheknél vizsgálni kell.',
    SLS: 'A süllyedés kicsi lehet, viszont a tehermentesítés miatti megemelkedés és a csatlakozó szerkezetekhez képesti elmozdulás fontos.'
  };
  function draw() {
    el.innerHTML = '';
    H('p', { cls: 'small', text: 'Állítsd sorba a nyilakkal, milyen sorrendben ellenőriznéd a határállapotokat! Utána nézd meg a megjegyzéseket.' }, el);
    const ul = H('ul', { cls: 'checks' }, el);
    items.forEach((it, i) => {
      const li = H('li', { cls: 'na', style: 'opacity:1;grid-template-columns:30px 1fr auto' }, ul);
      li.innerHTML = `<span class="pill">${i + 1}.</span><span><b>${it[0]}</b> – ${it[1]}</span>`;
      const b = H('span', { cls: 'row', style: 'gap:4px' }, li);
      H('button', { cls: 'pbtn', type: 'button', text: '▲', 'aria-label': 'feljebb', onclick: () => { if (i > 0) { [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); } } }, b);
      H('button', { cls: 'pbtn', type: 'button', text: '▼', 'aria-label': 'lejjebb', onclick: () => { if (i < items.length - 1) { [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); } } }, b);
    });
    const r = H('div', { cls: 'row', style: 'margin-top:10px' }, el);
    H('button', { cls: 'pbtn solid', type: 'button', text: 'Kész – mutasd a megjegyzéseket', onclick: () => {
      const fb = $('.fb', el) || H('div', { cls: 'fb show' }, el);
      fb.className = 'fb show';
      fb.innerHTML = `<b>A te sorrended: ${items.map(x => x[0]).join(' → ')}.</b> Egy lehetséges gondolatmenet: <b>UPL → STR → GEO → SLS</b>. ` + ['UPL', 'STR', 'GEO', 'SLS'].map(k => `<br><b>${k}:</b> ${NOTE[k]}`).join('') + '<br>A sorrend a tervezési helyzettől függ – a lényeg, hogy egyik határállapot se maradjon ki.';
    } }, r);
  }
  draw();
});
onReady(() => renderQuiz($('#quiz5'), QUIZ.q5));
