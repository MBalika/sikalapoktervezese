/* ===== 03 – A tervezés menete: telek-szkenner és folyamatábra ===== */
onReady(function telek() {
  const svg = $('#telekSvg'); if (!svg) return;
  const GR = [
    ['ep', 'Építmény', 'méretek, szerkezet, merevség, süllyedésérzékenység, rendeltetés'],
    ['ter', 'Terhelés', 'a terhek nagysága és elhelyezkedése'],
    ['talaj', 'Talaj és talajvíz', 'kedvezőtlen rétegek, építési és mértékadó vízszint'],
    ['korny', 'Környezet', 'szomszédok, foghíjtelek, megközelítés, anyagtárolás, korlátozások'],
    ['ido', 'Építési idő', 'évszak, időjárás, rendelkezésre álló idő']
  ];
  const HS = [
    { x: 150, y: 150, g: 'korny', t: 'Csatlakozó szomszéd: 4 szintes, pincés épület', e: 'Foghíjtelek: az új alap nem kerülhet a szomszéd alapsíkja fölé, és a munkagödör nem veszélyeztetheti a meglévő épületet – akár munkatérhatárolás is kell.' },
    { x: 610, y: 150, g: 'korny', t: 'Régi, pince nélküli szomszéd ismeretlen alapozással', e: 'Ha az új pince mélyebb, a régi ház alapját alá kell betonozni vagy jet-groutinggal megerősíteni. Az alapozását feltárással kell megismerni.' },
    { x: 440, y: 66, g: 'korny', t: 'Védett fa a telek hátsó részén', e: 'Korlátozás: a fa gyökérzónájában nem lehet mélyen kiemelni, a kiemelés és a gépek helyét ehhez kell igazítani.' },
    { x: 380, y: 430, g: 'korny', t: 'Keskeny, forgalmas utca, nincs hely anyagtárolásra', e: 'A telek megközelítése és beépítettsége a technológiát is befolyásolja: hová áll a betonpumpa, hol tárolják a vasat, zsaluzatot?' },
    { x: 296, y: 262, g: 'talaj', t: 'Fúrás: 2,4 m vastag feltöltés', e: 'Kedvezőtlen réteg: feltöltésre nem alapozunk. A teherbíró réteg alá kell menni, vagy talajjavítás, illetve más alaptípus kell.' },
    { x: 470, y: 230, g: 'talaj', t: 'Talajvízkút: a víz −2,1 m-en, a mértékadó szint magasabb', e: 'A talajvíz a pince szintjén van: víztelenítés, vízzáró lemez (ellenfödém) és felúszás-vizsgálat is szóba jön.' },
    { x: 380, y: 196, g: 'ep', t: 'Tervezett épület: 6 szint + mélygarázs, pillérváz', e: 'Az építmény mérete, szerkezete és merevsége dönti el, milyen süllyedéskülönbséget visel el – egy pillérváz érzékenyebb lehet, mint egy merev falas szerkezet.' },
    { x: 340, y: 330, g: 'ep', t: 'A földszinten orvosi rendelő érzékeny gépekkel', e: 'A rendeltetés is számít: rezgésre, süllyedésre érzékeny berendezések szigorúbb használhatósági követelményt jelentenek.' },
    { x: 452, y: 330, g: 'ter', t: 'Az utcai oldalon nagyobb pillérterhek (toronyrész)', e: 'Az egyenlőtlen terheléseloszlás süllyedéskülönbséget okoz: a nagyobb terhek alá nagyobb vagy merevebb alap kell.' },
    { x: 694, y: 52, g: 'ido', t: 'Ütemterv: az alapozás januárra esik, szoros határidővel', e: 'Télen fagyban betonozni csak védelemmel lehet; gyakran a drágább, de gyorsabban kivitelezhető megoldás nyer.' }
  ];
  const found = new Set();
  const side = $('#telekSide'), outE = $('#telekOut'), cnt = $('#telekCnt');
  function drawSide() {
    side.innerHTML = '';
    GR.forEach(([k, n, d]) => {
      const tot = HS.filter(h => h.g === k).length, f = HS.filter((h, i) => h.g === k && found.has(i)).length;
      const li = H('div', { cls: 'callout', style: `margin:0;border-left-color:${f === tot ? 'var(--ok)' : 'var(--line)'}` }, side);
      li.innerHTML = `<b>${n} <span class="pill">${f}/${tot}</span></b><p class="small" style="margin:0">${d}</p>`;
    });
    cnt.textContent = `${found.size} / ${HS.length} felfedezve`;
  }
  function draw() {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    S('rect', { x: 0, y: 0, width: 760, height: 470, style: 'fill:var(--card-2)' }, g);
    // utca
    S('rect', { x: 0, y: 392, width: 760, height: 78, fill: '#7d8288' }, g);
    for (let x = 20; x < 760; x += 70) S('rect', { x, y: 428, width: 36, height: 5, fill: '#eee' }, g);
    S('rect', { x: 0, y: 380, width: 760, height: 12, fill: '#c9c6bd' }, g);
    [[90, 404, '#c0392b'], [600, 440, '#2c5f8a'], [690, 404, '#f2c14e']].forEach(([x, y, c]) => { S('rect', { x, y, width: 60, height: 24, rx: 6, fill: c }, g); });
    // szomszédok
    S('rect', { x: 30, y: 60, width: 220, height: 300, fill: '#9aa3a8', style: 'stroke:var(--ink-2);stroke-width:1.5' }, g);
    S('text', { x: 140, y: 214, 'text-anchor': 'middle', fill: '#fff', class: 't-b', text: '4 szint + pince' }, g);
    S('rect', { x: 510, y: 90, width: 220, height: 270, fill: '#c7b79c', style: 'stroke:var(--ink-2);stroke-width:1.5' }, g);
    S('text', { x: 620, y: 230, 'text-anchor': 'middle', fill: '#4a3c2a', class: 't-b', text: 'régi ház, 1910' }, g);
    // telek
    S('rect', { x: 250, y: 30, width: 260, height: 350, fill: '#b9c98f', opacity: .55, style: 'stroke:var(--ink-2);stroke-dasharray:8 5;stroke-width:1.5' }, g);
    S('rect', { x: 262, y: 160, width: 236, height: 210, style: 'fill:none;stroke:var(--k);stroke-width:2.5;stroke-dasharray:10 6' }, g);
    S('text', { x: 380, y: 176, 'text-anchor': 'middle', class: 't-s', style: 'fill:var(--k);font-weight:600', text: 'tervezett épület' }, g);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S('rect', { x: 296 + i * 78, y: 214 + j * 52, width: 10, height: 10, style: 'fill:var(--ink-2)' }, g);
    // fa
    S('circle', { cx: 440, cy: 76, r: 36, fill: '#4f8a3a', opacity: .9 }, g);
    S('circle', { cx: 440, cy: 76, r: 50, fill: 'none', stroke: '#4f8a3a', 'stroke-dasharray': '4 4' }, g);
    // fúrás, kút
    S('circle', { cx: 296, cy: 262, r: 7, fill: '#fff', stroke: '#333', 'stroke-width': 2 }, g);
    S('path', { d: 'M291 257 l10 10 M301 257 l-10 10', stroke: '#333', 'stroke-width': 2 }, g);
    S('circle', { cx: 470, cy: 230, r: 8, style: 'fill:var(--water)' }, g);
    // naptár
    S('rect', { x: 668, y: 22, width: 52, height: 46, rx: 6, fill: '#fff', style: 'stroke:var(--ink-2)' }, g);
    S('rect', { x: 668, y: 22, width: 52, height: 12, rx: 3, fill: '#d23f2a' }, g);
    S('text', { x: 694, y: 60, 'text-anchor': 'middle', class: 't-b', style: 'fill:#222', text: 'I.' }, g);
    // pontok
    HS.forEach((h, i) => {
      const gg = S('g', { style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': h.t }, g);
      S('circle', { cx: h.x, cy: h.y, r: 15, style: `fill:${found.has(i) ? 'var(--ok)' : 'var(--k)'};stroke:#fff;stroke-width:3` + (found.has(i) ? '' : ';opacity:.92') }, gg);
      S('text', { x: h.x, y: h.y + 5, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:700;font-size:13px', text: String(i + 1) }, gg);
      if (!found.has(i)) S('circle', { cx: h.x, cy: h.y, r: 15, class: 'blink', style: 'fill:none;stroke:var(--k);stroke-width:2' }, gg);
      const act = () => { found.add(i); const G = GR.find(x => x[0] === h.g); outE.innerHTML = `<b>${i + 1}. ${h.t}</b> <span class="tag">${G[1]}</span><br>${h.e}`; draw(); drawSide(); };
      gg.addEventListener('click', act);
      gg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
  }
  draw(); drawSide();
});

onReady(function flow() {
  const svg = $('#flowSvg'); if (!svg) return;
  svg.setAttribute('viewBox', '0 0 980 690');
  const N = {
    ad: { x: 16, y: 252, w: 104, h: 40, t: ['ADATOK'] },
    e1: { x: 150, y: 40, w: 196, h: 66, t: ['Építmény szerkezete,', 'altalaj- és talajvízviszonyok,', 'környezet, helyszín'] },
    e2: { x: 150, y: 252, w: 120, h: 40, t: ['Terhek'] },
    e3: { x: 150, y: 420, w: 176, h: 46, t: ['Az építmény', 'süllyedésérzékenysége'] },
    f: { x: 330, y: 292, w: 186, h: 50, t: ['Talajban keletkező', 'feszültségek számítása'] },
    d1: { x: 590, y: 22, w: 190, h: 46, t: ['Síkalapozás lehet?'], dec: true },
    ma: { x: 372, y: 24, w: 160, h: 42, t: ['Mélyalap', '(lásd később)'] },
    n1: { x: 590, y: 98, w: 190, h: 40, t: ['Alapsík felvétele'], app: ['→ 4. állomás', '#alapsik'] },
    n2: { x: 590, y: 168, w: 190, h: 50, t: ['Alapfelület méretezése', '(teherbírás)'], app: ['→ teherbírás ↗', 'https://sikalapok-teherbirasszamitasa.vercel.app/'] },
    n3: { x: 580, y: 250, w: 210, h: 52, t: ['Süllyedés, süllyedéskülönbség,', 'billenés számítása'], app: ['→ süllyedés ↗', 'https://sikalapok-sullyedesszamitasa.vercel.app/'] },
    d2: { x: 580, y: 334, w: 210, h: 48, t: ['Elmozdulások', 'megengedhetők?'], dec: true, app: ['→ védekezés ↗', 'https://vedekezesakarossullyedesekellen.vercel.app/'] },
    n4: { x: 590, y: 414, w: 190, h: 40, t: ['Magassági méretezés'] },
    d3: { x: 590, y: 486, w: 190, h: 44, t: ['Elfér az alap?'], dec: true },
    n5: { x: 560, y: 562, w: 250, h: 46, t: ['Elcsúszás, kiborulás,', 'aláüregelődés vizsgálata'], app: ['→ állékonyság ↗', 'https://sikalapokallekonysagvizsgalata.vercel.app/'] },
    n6: { x: 580, y: 638, w: 210, h: 42, t: ['Szilárdsági méretezés', '(beton, vasalás)'] }
  };
  const c = k => [N[k].x + N[k].w / 2, N[k].y + N[k].h / 2];
  const E = {
    'ad-e1': [[120, 272], [134, 272], [134, 73], [150, 73]],
    'ad-e2': [[120, 272], [150, 272]],
    'ad-e3': [[120, 272], [134, 272], [134, 443], [150, 443]],
    'e1-d1': [[248, 40], [248, 10], [685, 10], [685, 22]],
    'd1-ma': [[590, 45], [532, 45]],
    'd1-n1': [[685, 68], [685, 98]],
    'n1-n2': [[685, 138], [685, 168]],
    'e2-n2': [[270, 262], [300, 262], [300, 193], [590, 193]],
    'n2-f': [[590, 210], [423, 210], [423, 292]],
    'e2-f': [[210, 292], [210, 317], [330, 317]],
    'f-n3': [[516, 317], [550, 317], [550, 276], [580, 276]],
    'n3-d2': [[685, 302], [685, 334]],
    'e3-d2': [[326, 443], [470, 443], [470, 358], [580, 358]],
    'd2-d1': [[790, 358], [900, 358], [900, 45], [780, 45]],
    'd2-n4': [[685, 382], [685, 414]],
    'n4-d3': [[685, 454], [685, 486]],
    'd3-n1': [[780, 508], [850, 508], [850, 118], [780, 118]],
    'd3-n5': [[685, 530], [685, 562]],
    'n5-n6': [[685, 608], [685, 638]]
  };
  const LBL = { 'd1-ma': ['nem', 556, 38], 'd1-n1': ['igen', 692, 88], 'd2-d1': ['nem', 906, 220], 'd2-n4': ['igen', 692, 402], 'd3-n1': ['nem', 856, 320], 'd3-n5': ['igen', 692, 550] };
  const TXT = {
    ad: 'Minden adat a birtokunkban van: tervek, terhek, talajvizsgálati jelentés.',
    e1: 'Az építmény szerkezete, az altalaj- és talajvízviszonyok, a környezet és a helyszín – ezekből ítéljük meg, szóba jöhet-e síkalap.',
    e2: 'A terhek nagysága és elhelyezkedése: az alapfelület méretezésének és a feszültségszámításnak a bemenete.',
    e3: 'Az építmény süllyedésérzékenysége adja a megengedhető elmozdulásokat – ehhez hasonlítjuk a számított süllyedéseket.',
    d1: 'Első lépés: alkalmazható-e valamilyen síkalapozási rendszer? Ha már a tervezés elején egyértelmű, hogy nem, rögtön mélyalapozásra térünk át.',
    ma: 'Mélyalapozás: teherközvetítő elem a mélyebb teherbíró rétegig – a tárgy későbbi részében.',
    n1: 'Kiválasztjuk a típust, majd felvesszük az alapozási síkot a fagyhatár, a teherbíró réteg, a talajvíz, a szerkezet és a környezet szerint (4. állomás).',
    n2: 'Teherbírási határállapotban méretezzük az alapfelületet: meghatározzuk a szükséges szélességet (lemezalapnál ez eleve adott), és előzetesen a magasságot is.',
    f: 'A kialakított méretek alapján kiszámítjuk az alapozás alatt keletkező feszültségeket.',
    n3: 'A feszültségekből számítjuk a süllyedéseket, a süllyedéskülönbségeket és a billenést.',
    d2: 'Az első „kontroll”: megengedhetők-e a számított süllyedések és süllyedéskülönbségek a tervezett építmény szempontjából?',
    n4: 'Magassági méretezés: az alaptest magassága (vastagsága) a teherelosztáshoz és a szilárdsághoz.',
    d3: 'Elfér az alap? Ha a szükséges méret nem fér el (telekhatár, egymásba érő alapok, szomszéd), új alapsík vagy más típus kell.',
    n5: 'Ha felmerül: a helyzeti állékonyság (elcsúszás, kiborulás) és a felúszás, aláüregelődés elleni biztonság ellenőrzése.',
    n6: 'Végül az alapozási rendszer szilárdsági méretezése: a betonminőség és a szükséges vasalás meghatározása.'
  };
  const SC = {
    a: { p: ['ad', 'e1', 'e2', 'e3', 'd1', 'n1', 'n2', 'f', 'n3', 'd2', 'n4', 'd3', 'n5', 'n6'], e: ['ad-e1', 'ad-e2', 'ad-e3', 'e1-d1', 'd1-n1', 'n1-n2', 'e2-n2', 'n2-f', 'e2-f', 'f-n3', 'n3-d2', 'e3-d2', 'd2-n4', 'n4-d3', 'd3-n5', 'n5-n6'], note: 'Minden ellenőrzés megfelel: a folyamat egyenesen végigfut.' },
    b: { p: ['ad', 'e1', 'd1', 'n1', 'n2', 'f', 'n3', 'd2', 'd1', 'n1', 'n2', 'f', 'n3', 'd2', 'n4', 'd3', 'n5', 'n6'], e: ['ad-e1', 'e1-d1', 'd1-n1', 'n1-n2', 'n2-f', 'f-n3', 'n3-d2', 'd2-d1', 'd2-n4', 'n4-d3', 'd3-n5', 'n5-n6'], note: 'A süllyedés túl nagy: visszaugrunk – más típus (pl. merevebb, lemez), mélyebb alapsík vagy nagyobb alapfelület. A második körben már megfelel.', jump: { 8: 'nem' } },
    c: { p: ['ad', 'e1', 'd1', 'n1', 'n2', 'f', 'n3', 'd2', 'n4', 'd3', 'n1', 'n2', 'f', 'n3', 'd2', 'n4', 'd3', 'n5', 'n6'], e: ['ad-e1', 'e1-d1', 'd1-n1', 'n1-n2', 'n2-f', 'f-n3', 'n3-d2', 'd2-n4', 'n4-d3', 'd3-n1', 'd3-n5', 'n5-n6'], note: 'A szükséges alap nem fér el (pl. a telekhatáron vagy az egymásba érő alapok miatt): új alapsíkot veszünk fel, esetleg összefüggő lemezre váltunk.', jump: { 10: 'nem' } },
    d: { p: ['ad', 'e1', 'd1', 'ma'], e: ['ad-e1', 'e1-d1', 'd1-ma'], note: 'Már a tervezés elején egyértelmű, hogy síkalap nem jöhet szóba: rögtön mélyalapozásra térünk át.' }
  };
  let scen = 'a', step = 0, playing = false, tok;
  const ndEl = {}, edEl = {};
  function draw() {
    svg.innerHTML = '';
    const defs = S('defs', {}, svg);
    const mk = S('marker', { id: 'arw', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, defs);
    S('path', { d: 'M0 0L10 5L0 10z', style: 'fill:var(--ink-3)' }, mk);
    for (const k in E) {
      const p = S('polyline', { points: E[k].map(q => q.join(',')).join(' '), class: 'ed' }, svg);
      edEl[k] = p;
    }
    for (const k in LBL) S('text', { x: LBL[k][1], y: LBL[k][2], class: 'el', text: LBL[k][0] }, svg);
    for (const k in N) {
      const n = N[k];
      const g = S('g', { class: 'nd' + (n.dec ? ' dec' : '') + (n.app ? ' lnk' : '') }, svg);
      S('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: n.dec ? 18 : 7 }, g);
      n.t.forEach((t, i) => S('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + (i - (n.t.length - 1) / 2) * 15 + 4, 'text-anchor': 'middle', text: t }, g));
      if (n.app) {
        S('text', { x: n.x + 4, y: n.y - 5, 'text-anchor': 'start', class: 'app', text: n.app[0] }, g);
        g.addEventListener('click', () => { if (n.app[1].startsWith('#')) location.hash = n.app[1]; else window.open(n.app[1], '_blank', 'noopener'); });
      }
      g.addEventListener('mouseenter', () => { $('#flowTxt').textContent = TXT[k]; });
      ndEl[k] = g;
    }
    tok = S('circle', { r: 8, class: 'tok', cx: c('ad')[0], cy: c('ad')[1], style: 'opacity:0' }, svg);
  }
  function mark() {
    const s = SC[scen];
    Object.values(ndEl).forEach(g => g.classList.remove('on', 'vis'));
    Object.values(edEl).forEach(e => e.classList.remove('on'));
    for (let i = 0; i <= step && i < s.p.length; i++) ndEl[s.p[i]].classList.add('vis');
    const cur = s.p[Math.min(step, s.p.length - 1)];
    ndEl[cur].classList.add('on');
    // élek a meglátogatott csomópontok között
    for (let i = 1; i <= step && i < s.p.length; i++) {
      const k = s.p[i - 1] + '-' + s.p[i];
      if (edEl[k]) edEl[k].classList.add('on');
    }
    if (step >= 3 && scen === 'a') ['ad-e2', 'ad-e3', 'e2-n2', 'e2-f', 'e3-d2'].forEach(k => { if (step >= s.p.indexOf(k.split('-')[1])) edEl[k].classList.add('on'); });
    const nn = N[cur];
    tok.setAttribute('cx', nn.x + 2); tok.setAttribute('cy', nn.y + 2); tok.style.opacity = 1;
    $('#flowTxt').innerHTML = `<b>${step + 1}/${s.p.length}.</b> ${TXT[cur]}` + (step === s.p.length - 1 ? ` <br><b>Összegzés:</b> ${s.note}` : '');
  }
  function next() {
    const s = SC[scen];
    if (step < s.p.length - 1) { step++; mark(); return true; }
    return false;
  }
  function play() {
    if (playing) { playing = false; $('#flowPlay').textContent = '▶ Lejátszás'; return; }
    playing = true; $('#flowPlay').textContent = '❚❚ Szünet';
    if (step >= SC[scen].p.length - 1) { step = 0; mark(); }
    const tick = () => { if (!playing) return; if (!next()) { playing = false; $('#flowPlay').textContent = '▶ Lejátszás'; return; } setTimeout(tick, 1500); };
    setTimeout(tick, 900);
  }
  draw();
  step = 0; mark();
  bindSeg($('#flowSeg'), v => { scen = v; step = 0; playing = false; $('#flowPlay').textContent = '▶ Lejátszás'; mark(); });
  $('#flowPlay').addEventListener('click', play);
  $('#flowStep').addEventListener('click', () => { playing = false; $('#flowPlay').textContent = '▶ Lejátszás'; next(); });
  $('#flowReset').addEventListener('click', () => { playing = false; $('#flowPlay').textContent = '▶ Lejátszás'; step = 0; mark(); });
});
onReady(() => renderQuiz($('#quiz3'), QUIZ.q3));
