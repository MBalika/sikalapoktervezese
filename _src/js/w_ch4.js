/* ===== 04 – Az alapsík felvétele ===== */
/* közös logika (a 3D modul is ezt használja) */
function frostDepth(soil, mBf, gwBelow) {
  if (soil === 'kozet') return { d: 0.5, why: 'szilárd kőzeten álló alap' };
  if (soil === 'kotott') return mBf > 500 ? { d: 1.0, why: 'kötött talaj, 500 mBf felett' } : { d: 0.8, why: 'kötött talaj, 500 mBf alatt' };
  if (mBf < 500 && gwBelow >= 2.0) return { d: 0.5, why: 'szemcsés talaj, 500 mBf alatt, a téli talajvíz legalább 2,0 m-rel az alapsík alatt' };
  return { d: 0.8, why: mBf >= 500 ? 'szemcsés talaj, 500 mBf felett' : 'szemcsés talaj; a téli talajvíz 2,0 m-en belül megközelíti az alapsíkot' };
}
const ALAPSIK = {
  p: { d: 0.6, soil: 'szemcses', mBf: 105, ft: 0.7, gw: 4, duzz: false, pince: 'nincs', hp: 2.6, szom: false, dsz: 1.2 },
  presets: {
    p1: { d: 0.6, soil: 'szemcses', mBf: 105, ft: 0.7, gw: 4, duzz: false, pince: 'nincs', szom: false, dsz: 1.2 },
    p2: { d: 0.8, soil: 'kotott', mBf: 720, ft: 0.3, gw: 5, duzz: false, pince: 'nincs', szom: false, dsz: 1.2 },
    p3: { d: 3.1, soil: 'szemcses', mBf: 110, ft: 1.2, gw: 3.6, duzz: false, pince: 'teljes', szom: true, dsz: 1.4 },
    p4: { d: 1.0, soil: 'kotott', mBf: 130, ft: 0.4, gw: 6, duzz: true, pince: 'nincs', szom: false, dsz: 1.2 },
    p5: { d: 1.3, soil: 'szemcses', mBf: 100, ft: 0.9, gw: 1.1, duzz: false, pince: 'nincs', szom: false, dsz: 1.2 }
  },
  eval(q, dOverride) {
    const d = dOverride ?? q.d;
    const C = [];
    const fr = frostDepth(q.soil, q.mBf, q.gw - d);
    const pince = q.pince === 'teljes';
    const sReq = pince ? q.hp + 0.5 : 0.5;
    // 1 fagy
    if (pince) C.push({ k: 1, st: 'ok', t: 'Fagyhatár – a pince alatt nincs fagyveszély; a ≥ 0,4 m takarás az 50 cm-es alaptest miatt teljesül', v: `fagyhatár ${fmt(fr.d, 1)} m` });
    else C.push({ k: 1, st: d >= fr.d - 1e-6 ? 'ok' : 'bad', t: `Fagyhatár: ${fr.why}`, v: `≥ ${fmt(fr.d, 2)} m` });
    // 2 teherbíró
    C.push({ k: 2, st: d >= q.ft - 1e-6 ? 'ok' : 'bad', t: 'Teherbíró talajon: a humusz és a feltöltés alatt', v: `≥ ${fmt(q.ft, 2)} m` });
    // 3 talajvíz
    C.push({ k: 3, st: d <= q.gw + 1e-6 ? 'ok' : 'warn', t: d <= q.gw ? 'A talajvíz felett – nincs víztelenítés' : 'A talajvíz alatt: víztelenítés kell (költséges)', v: `talajvíz ${fmt(q.gw, 2)} m` });
    // 4 szerkezet
    C.push({ k: 4, st: d >= sReq - 1e-6 ? 'ok' : 'bad', t: pince ? 'A szerkezet igénye: pincepadló alatt egy alaptest-magasság' : 'A szerkezet igénye: legalább 50 cm-es alaptest', v: `≥ ${fmt(sReq, 2)} m` });
    // 5 duzzadó
    C.push(q.duzz ? { k: 5, st: d >= 2.0 - 1e-6 ? 'ok' : 'bad', t: 'Térfogatváltozó agyag: a kiszáradási határ alatt', v: '≥ 2,00 m' } : { k: 5, st: 'na', t: 'Térfogatváltozó altalaj nincs', v: '' });
    // 6 szomszéd
    if (q.szom) {
      if (d < q.dsz - 0.05) C.push({ k: 6, st: 'bad', t: 'Az új alapsík nem kerülhet a szomszédé fölé', v: `≥ ${fmt(q.dsz, 2)} m` });
      else if (d > q.dsz + 0.1) C.push({ k: 6, st: 'warn', t: 'Mélyebb a szomszédnál: a régit alá kell falazni vagy jet-groutinggal megerősíteni', v: `szomszéd ${fmt(q.dsz, 2)} m` });
      else C.push({ k: 6, st: 'ok', t: 'Igazodik a szomszéd alapsíkjához', v: `szomszéd ${fmt(q.dsz, 2)} m` });
    } else C.push({ k: 6, st: 'na', t: 'Nincs csatlakozó szomszédos épület', v: '' });
    return { C, fr, ok: C.every(c => c.st !== 'bad') };
  },
  dmin(q) {
    for (let d = 0.3; d <= 4.5; d += 0.05) { const r = this.eval(q, d); if (r.ok) return Math.round(d * 100) / 100; }
    return 4.5;
  },
  cost(q) {
    const d = q.d, pince = q.pince === 'teljes';
    let c = 30 + d * 38 + (pince ? 40 : 0);
    if (d > q.gw) c += 35 + (d - q.gw) * 40;
    if (q.szom && d > q.dsz + 0.1) c += 30 + (d - q.dsz) * 12;
    return c;
  }
};

onReady(function alapsikUI() {
  const q = ALAPSIK.p;
  const chk = $('#aChecks'), kpi = $('#aKpi');
  function sync() {
    $('#aD').value = q.d; $('#aH').value = q.mBf; $('#aFt').value = q.ft; $('#aGw').value = q.gw; $('#aSz').value = q.dsz;
    $('#aDuzz').checked = q.duzz; $('#aSzom').checked = q.szom;
    setSeg($('#aSoil'), q.soil); setSeg($('#aPince'), q.pince);
    initRanges($('#lab-alapsik'));
  }
  function render() {
    $('#aDO').textContent = '−' + fmt(q.d, 2) + ' m';
    $('#aHO').textContent = fmt(q.mBf, 0) + ' mBf';
    $('#aFtO').textContent = fmt(q.ft, 2) + ' m';
    $('#aGwO').textContent = '−' + fmt(q.gw, 2) + ' m';
    $('#aSzO').textContent = '−' + fmt(q.dsz, 2) + ' m';
    $('#aSzWrap').style.display = q.szom ? '' : 'none';
    const r = ALAPSIK.eval(q);
    chk.innerHTML = '';
    r.C.forEach(c => { const li = H('li', { cls: c.st }, chk); li.innerHTML = `<i></i><span><b>${c.k}.</b> ${c.t}</span><em>${c.v}</em>`; });
    const dm = ALAPSIK.dmin(q);
    const cost = ALAPSIK.cost(q), costMin = ALAPSIK.cost(Object.assign({}, q, { d: dm }));
    kpi.innerHTML = '';
    const K = (a, b, cls) => { const d = H('div', {}, kpi); d.innerHTML = `<small>${a}</small><b${cls ? ` style="color:var(--${cls})"` : ''}>${b}</b>`; };
    K('Állapot', r.ok ? (r.C.some(c => c.st === 'warn') ? 'megfelel, de…' : 'megfelel') : 'nem felel meg', r.ok ? (r.C.some(c => c.st === 'warn') ? 'warn' : 'ok') : 'bad');
    K('Legkisebb megfelelő alapsík', '−' + fmt(dm, 2) + ' m');
    K('Mértékadó fagyhatár', fmt(r.fr.d, 2) + ' m');
    K('Költségindex', fmt(cost / costMin * 100, 0) + ' %', cost / costMin > 1.25 ? 'warn' : '');
    window.dispatchEvent(new CustomEvent('alapsik', { detail: q }));
  }
  const num = (id, k) => $('#' + id).addEventListener('input', e => { q[k] = +e.target.value; render(); });
  num('aD', 'd'); num('aH', 'mBf'); num('aFt', 'ft'); num('aGw', 'gw'); num('aSz', 'dsz');
  $('#aDuzz').addEventListener('change', e => { q.duzz = e.target.checked; render(); });
  $('#aSzom').addEventListener('change', e => { q.szom = e.target.checked; render(); });
  bindSeg($('#aSoil'), v => { q.soil = v; render(); });
  bindSeg($('#aPince'), v => { q.pince = v; if (v === 'teljes' && q.d < q.hp + 0.5) { q.d = q.hp + 0.5; sync(); } render(); });
  $('#aSet').addEventListener('click', () => { q.d = ALAPSIK.dmin(q); sync(); render(); });
  $('#aPreset').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#aPreset button').forEach(x => x.classList.toggle('on', x === b));
    Object.assign(q, ALAPSIK.presets[b.dataset.v]); sync(); render();
  });
  Object.assign(q, ALAPSIK.presets.p1); sync(); render();
});

/* ---- Fagyhatár-kalkulátor ---- */
onReady(function fagy() {
  const svg = $('#fSvg'); if (!svg) return;
  const st = { soil: 'szemcses', mBf: 105, gwb: 3, d: 0.6, t: 0.62 };
  const HELY = [['Budapest', 105], ['Szeged', 78], ['Debrecen', 121], ['Pécs', 152], ['Sopron', 234], ['Eger', 165], ['Dobogókő', 699], ['Galyatető', 965], ['Kékestető', 1014]];
  const hc = $('#fHely');
  HELY.forEach(([n, h], i) => { const b = H('button', { type: 'button', text: n, 'data-v': String(h) }, hc); if (!i) b.classList.add('on'); });
  hc.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', hc).forEach(x => x.classList.toggle('on', x === b)); st.mBf = +b.dataset.v; $('#fH').value = st.mBf; rangeFill($('#fH')); render(); });
  const MONTH = ['november', 'december', 'január', 'február', 'március', 'április'];
  let playing = false, raf;
  function front(fr, t) {
    const Tm = 10, Tsmin = -8;
    const Ts = 6 - 14 * Math.sin(Math.PI * clamp(t, 0, 1));
    const lam = fr / Math.log((Tm - Tsmin) / Tm);
    const z = Ts < 0 ? lam * Math.log((Tm - Ts) / Tm) : 0;
    return { z, Ts, lam, Tm };
  }
  function draw() {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const fr = frostDepth(st.soil, st.mBf, st.gwb).d;
    const F = front(fr, st.t);
    const g = S('g', {}, svg);
    const y0 = 70, sc = 220; // px / m
    const Y = z => y0 + z * sc;
    const kind = st.soil === 'kotott' ? 'agyag' : st.soil === 'kozet' ? 'kozet' : 'homok';
    S('rect', { x: 0, y: 0, width: 720, height: y0, style: 'fill:var(--card)' }, g);
    S('rect', { x: 0, y: y0, width: 430, height: 430 - y0, fill: f(kind) }, g);
    // fagyott zóna
    if (F.z > 0) S('rect', { x: 0, y: y0, width: 430, height: F.z * sc, fill: f('fagy') }, g);
    // fagyhatár (tervezési)
    S('line', { x1: 0, y1: Y(fr), x2: 430, y2: Y(fr), style: 'stroke:var(--frost);stroke-width:2.2;stroke-dasharray:9 5' }, g);
    S('text', { x: 300, y: Y(fr) + 16, class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(10,60,80,.75);stroke-width:3px;font-weight:600', text: `fagyhatár ${fmt(fr, 1)} m` }, g);
    // fagyfront
    if (F.z > 0.005) { S('line', { x1: 0, y1: Y(F.z), x2: 430, y2: Y(F.z), stroke: '#fff', 'stroke-width': 2 }, g); S('text', { x: 8, y: Y(F.z) - 6, class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(10,60,80,.75);stroke-width:3px', text: `fagyfront ${fmt(F.z, 2)} m` }, g); }
    // talajvíz
    const gwY = Y(st.d + st.gwb);
    if (gwY < 430) { S('rect', { x: 0, y: gwY, width: 430, height: 430 - gwY, fill: f('viz') }, g); S('line', { x1: 0, y1: gwY, x2: 430, y2: gwY, style: 'stroke:var(--water);stroke-width:2' }, g); S('text', { x: 8, y: gwY - 6, class: 't-s', style: 'fill:var(--water);font-weight:600', text: 'téli talajvíz' }, g); }
    // alap
    const heave = (st.soil === 'kotott' && F.z > st.d) ? Math.min(26, (F.z - st.d) * 60) : 0;
    const bx = 150, bw = 120, bh = 0.5 * sc;
    const by = Y(st.d) - bh - heave;
    S('rect', { x: bx + 40, y: 0, width: 40, height: by, fill: f('tegla'), style: 'stroke:var(--ink)' }, g);
    S('rect', { x: bx, y: by, width: bw, height: bh, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.6' }, g);
    if (heave > 0) {
      for (let i = 0; i < 4; i++) S('ellipse', { cx: bx + bw / 2, cy: Y(st.d) + 4 + i * ((F.z - st.d) * sc / 4), rx: 60 - i * 6, ry: 2.4, fill: '#eaf8ff', stroke: '#7fc8e8' }, g);
      S('path', { d: `M${bx + bw / 2} ${Y(st.d) + 30} V${by + bh + 6}`, style: 'stroke:var(--bad);stroke-width:2.5', 'marker-end': `url(#${svg.id}-arrbad)` }, g);
      S('path', { d: `M${bx + 50} ${by - 30} l8 10 l-6 8 l8 12`, style: 'stroke:var(--bad);stroke-width:2;fill:none' }, g);
      S('text', { x: bx + bw + 10, y: Y(st.d) + 22, class: 't-s', style: 'fill:var(--bad);font-weight:600;paint-order:stroke;stroke:#fff;stroke-width:3px', text: 'jéglencsék – fagyemelés' }, g);
    }
    S('line', { x1: 0, y1: y0, x2: 430, y2: y0, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    if (st.t > 0.15 && st.t < 0.85) for (let i = 0; i < 14; i++) S('text', { x: 14 + i * 30, y: 22 + (i % 3) * 14, style: 'fill:var(--frost);font-size:14px', text: '❄' }, g);
    // hőmérséklet-profil
    const gx = 470, gw = 230, gy0 = y0, gh = 318;
    S('rect', { x: gx, y: gy0, width: gw, height: gh, style: 'fill:var(--card-2);stroke:var(--line)' }, g);
    const Tx = T => gx + (T + 10) / 25 * gw;
    S('line', { x1: Tx(0), y1: gy0, x2: Tx(0), y2: gy0 + gh, style: 'stroke:var(--frost);stroke-width:1.5' }, g);
    for (let T = -10; T <= 15; T += 5) { S('text', { x: Tx(T), y: gy0 + gh + 16, 'text-anchor': 'middle', class: 't-s t-m', text: (T < 0 ? '−' : '') + Math.abs(T) }, g); }
    S('text', { x: gx + gw / 2, y: gy0 + gh + 32, 'text-anchor': 'middle', class: 't-s', text: 'hőmérséklet [°C]' }, g);
    for (let z = 0; z <= 1.01; z += 0.5) S('text', { x: gx - 6, y: Y(z) + 4, 'text-anchor': 'end', class: 't-s t-m', text: z ? '−' + fmt(z, 1) : '0' }, g);
    let pd = '';
    for (let i = 0; i <= 40; i++) { const z = i / 40 * 1.58; const T = F.Tm + (F.Ts - F.Tm) * Math.exp(-z / F.lam); pd += (i ? 'L' : 'M') + Tx(clamp(T, -10, 15)) + ' ' + Y(z); }
    S('path', { d: pd, style: 'stroke:var(--k);stroke-width:2.5;fill:none' }, g);
    S('text', { x: gx + gw - 8, y: gy0 + gh - 28, 'text-anchor': 'end', class: 't-s t-b', text: MONTH[Math.min(5, Math.floor(st.t * 6))] }, g);
    S('text', { x: gx + gw - 8, y: gy0 + gh - 12, 'text-anchor': 'end', class: 't-s', text: `felszín: ${fmt(F.Ts, 1)} °C` }, g);
    return { fr, F, heave };
  }
  function render() {
    $('#fHO').textContent = fmt(st.mBf, 0) + ' mBf';
    $('#fGwO').textContent = fmt(st.gwb, 2) + ' m';
    $('#fDO').textContent = '−' + fmt(st.d, 2) + ' m';
    $('#fTO').textContent = MONTH[Math.min(5, Math.floor(st.t * 6))];
    const r = draw();
    const fr = frostDepth(st.soil, st.mBf, st.gwb);
    const ok = st.d >= fr.d - 1e-6;
    const v = $('#fVerdict');
    v.className = 'verdict ' + (ok ? 'ok' : 'bad');
    v.innerHTML = ok ? `Megfelel: −${fmt(st.d, 2)} m ≥ ${fmt(fr.d, 2)} m` : `Nem felel meg: −${fmt(st.d, 2)} m < ${fmt(fr.d, 2)} m`;
    let t = `<b>Mértékadó fagyhatár: ${fmt(fr.d, 2)} m</b> – ${fr.why}. `;
    if (st.soil === 'kotott') t += r.heave > 0 ? 'A fagyfront az alapsík alá jutott, a kötött talajban jéglencsék nőnek, és megemelik az alapot. Olvadáskor a jég helyén puha, vízzel telített talaj marad.' : 'Kötött (fagyveszélyes) talajban a fagyfrontnak az alapsík felett kell maradnia.';
    else if (st.soil === 'szemcses') t += 'A tiszta szemcsés talaj nem fagyveszélyes: nagy pórusai miatt nincs kapilláris vízutánpótlás a fagyfronthoz. Ezért csökkenthető a fagyhatár, ha a téli talajvíz elég mélyen van.';
    else t += 'Szilárd kőzetben a fagy nem okoz számottevő térfogatváltozást.';
    $('#fOut').innerHTML = t;
  }
  bindSeg($('#fSoil'), v => { st.soil = v; render(); });
  [['fH', 'mBf'], ['fGw', 'gwb'], ['fD', 'd'], ['fT', 't']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => { st[k] = +e.target.value; render(); }));
  $('#fPlay').addEventListener('click', () => {
    if (playing) { playing = false; $('#fPlay').textContent = '▶ Tél lejátszása'; cancelAnimationFrame(raf); return; }
    playing = true; $('#fPlay').textContent = '❚❚ Megállítás';
    st.t = 0; let last = performance.now();
    const step = now => { if (!playing) return; st.t += (now - last) / 9000; last = now; if (st.t >= 1) { st.t = 1; playing = false; $('#fPlay').textContent = '▶ Tél lejátszása'; } $('#fT').value = st.t; rangeFill($('#fT')); render(); if (playing) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  });
  window.addEventListener('themechange', render);
  render();
});

/* ---- Részben alápincézett épület ---- */
onReady(function reszpince() {
  const svg = $('#rSvg'); if (!svg) return;
  const st = { hp: 2.6, d: 1.0, a: 1.4, phi: 33.7 };
  function need() { return Math.max(0.8, st.hp - st.a * Math.tan(st.phi * Math.PI / 180)); }
  function draw() {
    svg.innerHTML = '';
    const { f, id } = soilDefs(svg);
    const g = S('g', {}, svg);
    const y0 = 80, sc = 82, wx = 300;
    const Y = z => y0 + z * sc;
    const fx = wx + 20 + st.a * sc; // a sekély alap belső éle
    S('rect', { x: 0, y: y0, width: 720, height: 420 - y0, fill: f('homok'), opacity: .7 }, g);
    // pince kiemelés
    S('rect', { x: 20, y: y0, width: wx - 20, height: st.hp * sc, style: 'fill:var(--card)' }, g);
    S('rect', { x: wx, y: y0 - 60, width: 20, height: (st.hp + 0.5) * sc + 60, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
    S('rect', { x: 20, y: Y(st.hp), width: wx - 20, height: 12, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
    S('rect', { x: wx - 30, y: Y(st.hp), width: 80, height: 0.5 * sc, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
    S('text', { x: 120, y: Y(st.hp) - 10, class: 't-s', text: 'pincepadló' }, g);
    S('text', { x: 100, y: y0 + 30, class: 't-b', text: 'pince' }, g);
    // sekély alap
    const fw = 0.8 * sc;
    S('rect', { x: fx, y: Y(st.d) - 0.5 * sc, width: fw, height: 0.5 * sc, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
    S('rect', { x: fx + fw / 2 - 12, y: y0 - 60, width: 24, height: Y(st.d) - 0.5 * sc - y0 + 60, fill: f('tegla'), style: 'stroke:var(--ink)' }, g);
    S('line', { x1: 0, y1: y0, x2: 720, y2: y0, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    S('line', { x1: wx + 20, y1: Y(0.8), x2: 720, y2: Y(0.8), style: 'stroke:var(--frost);stroke-dasharray:7 5;stroke-width:1.5' }, g);
    S('text', { x: 640, y: Y(0.8) - 6, class: 't-s', style: 'fill:var(--frost)', text: 'fagyhatár' }, g);
    // rézsűvonal
    const tg = Math.tan(st.phi * Math.PI / 180);
    const zHit = st.d + st.a * tg;
    const ok = zHit >= st.hp - 1e-6;
    const col = ok ? 'var(--ok)' : 'var(--bad)';
    S('line', { x1: fx, y1: Y(st.d), x2: wx + 20, y2: Y(zHit), style: `stroke:${col};stroke-width:2.6;stroke-dasharray:10 5` }, g);
    S('path', { d: `M${fx - 34} ${Y(st.d)} A34 34 0 0 0 ${fx - 34 * Math.cos(Math.atan(tg))} ${Y(st.d) + 34 * Math.sin(Math.atan(tg))}`, style: `stroke:${col};fill:none;stroke-width:1.5` }, g);
    S('text', { x: fx - 50, y: Y(st.d) + 16, style: `fill:${col};font-weight:700`, text: 'φ' }, g);
    S('circle', { cx: wx + 20, cy: Y(zHit), r: 6, style: `fill:${col}` }, g);
    if (!ok) {
      for (let i = 0; i < 4; i++) { const yy = Y(zHit) + 8 + i * 14; if (yy < Y(st.hp)) S('line', { x1: wx + 70, y1: yy, x2: wx + 24, y2: yy, style: 'stroke:var(--bad);stroke-width:2', 'marker-end': `url(#${id}-arrbad)` }, g); }
      S('text', { x: wx + 30, y: Y(zHit) - 10, class: 't-s', style: 'fill:var(--bad);font-weight:600', text: 'a pincepadló felett metszi a falat!' }, g);
    }
    dimLine(g, fx + fw + 24, y0, fx + fw + 24, Y(st.d), `−${fmt(st.d, 2)} m`);
    dimLine(g, wx + 20, Y(st.d) - 0.5 * sc - 14, fx, Y(st.d) - 0.5 * sc - 14, `a = ${fmt(st.a, 2)} m`);
    dimLine(g, 40, y0, 40, Y(st.hp), `−${fmt(st.hp, 2)} m`);
    return ok;
  }
  function render() {
    $('#rHpO').textContent = '−' + fmt(st.hp, 2) + ' m'; $('#rDO').textContent = '−' + fmt(st.d, 2) + ' m';
    $('#rAO').textContent = fmt(st.a, 2) + ' m'; $('#rPhiO').textContent = fmt(st.phi, 1) + '°';
    const ok = draw();
    const v = $('#rVerdict');
    v.className = 'verdict ' + (ok ? 'ok' : 'bad');
    v.innerHTML = ok ? `Megfelel – a rézsűvonal a pincepadló alatt éri el a falat.` : `Nem felel meg – legalább −${fmt(need(), 2)} m kell.`;
  }
  [['rHp', 'hp'], ['rD', 'd'], ['rA', 'a'], ['rPhi', 'phi']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => { st[k] = +e.target.value; render(); }));
  $('#rFix').addEventListener('click', () => { st.d = Math.ceil(need() * 20) / 20; $('#rD').value = st.d; rangeFill($('#rD')); render(); });
  render();
});

/* ---- Lépcsőzetes mélyítés / lejtős terep ---- */
onReady(function lepcso() {
  const svg = $('#lpSvg'); if (!svg) return;
  const st = { mode: 'lepcso', dh: 1.5, n: 3, l: 0.9, beta: 12, alap: 'lepcsos', h: 0.45 };
  function draw() {
    svg.innerHTML = '';
    const { f, id } = soilDefs(svg);
    const g = S('g', {}, svg);
    const C = [];
    if (st.mode === 'lepcso') {
      const sc = Math.min(130, 520 / Math.max(1, st.n * st.l + 1.2), 260 / (st.dh + 0.8));
      const x0 = 110, y0 = 60;
      const hs = st.dh / st.n;
      S('rect', { x: 0, y: y0, width: 720, height: 340, fill: f('homok'), opacity: .65 }, g);
      S('line', { x1: 0, y1: y0, x2: 720, y2: y0, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
      // lépcsőzött alaptest (felső alap – lépcsők – alsó alap)
      const t = 0.5 * sc, L = st.l * sc, H = hs * sc;
      const topBase = y0 + 0.9 * sc, lowBase = topBase + st.dh * sc;
      const xa = x0 - 0.8 * sc, xe = x0 + st.n * L + 0.8 * sc;
      let d = `M${xa} ${topBase - t} H${x0}`;
      for (let k = 1; k < st.n; k++) d += ` H${x0 + k * L} V${topBase - t + k * H}`;
      d += ` H${x0 + st.n * L} V${lowBase - t} H${xe} V${lowBase} H${x0 + (st.n - 1) * L}`;
      for (let k = st.n - 1; k >= 1; k--) d += ` V${topBase + k * H} H${x0 + (k - 1) * L}`;
      d += ` V${topBase} H${xa} Z`;
      S('path', { d, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.6' }, g);
      S('rect', { x: xa + 0.2 * sc, y: 20, width: 0.4 * sc, height: topBase - t - 20, fill: f('tegla'), style: 'stroke:var(--ink)' }, g);
      S('rect', { x: xe - 0.6 * sc, y: 20, width: 0.4 * sc, height: lowBase - t - 20, fill: f('tegla'), style: 'stroke:var(--ink)' }, g);
      const ang = Math.atan2(hs, st.l) * 180 / Math.PI;
      const ok = ang <= 30 + 1e-6;
      // sarokpontokat összekötő egyenes
      S('line', { x1: x0, y1: topBase, x2: x0 + st.n * st.l * sc, y2: lowBase, style: `stroke:${ok ? 'var(--ok)' : 'var(--bad)'};stroke-width:2.5;stroke-dasharray:8 5` }, g);
      S('text', { x: x0 + st.n * st.l * sc / 2 + 10, y: (topBase + lowBase) / 2 - 8, style: `fill:${ok ? 'var(--ok)' : 'var(--bad)'};font-weight:700`, text: `β = ${fmt(ang, 1)}°` }, g);
      dimLine(g, x0 + st.n * st.l * sc + 0.8 * sc + 26, topBase, x0 + st.n * st.l * sc + 0.8 * sc + 26, lowBase, `Δh = ${fmt(st.dh, 2)} m`);
      dimLine(g, x0, lowBase + 34, x0 + st.l * sc, lowBase + 34, `l = ${fmt(st.l, 2)} m`, { dy: 16 });
      C.push({ st: ok ? 'ok' : 'bad', t: 'A sarokpontokat összekötő egyenes legfeljebb 30°', v: `${fmt(ang, 1)}°` });
      C.push({ st: hs <= 0.5 + 1e-6 ? 'ok' : 'warn', t: 'Egy lépcső magassága lehetőleg ≤ 50 cm', v: `${fmt(hs * 100, 0)} cm` });
      C.push({ st: 'na', t: 'A lépcsőzés teljes hossza', v: `${fmt(st.n * st.l, 2)} m` });
    } else {
      const sc = 46, x0 = 40, y0 = 70;
      const tb = Math.tan(st.beta * Math.PI / 180);
      const L = 13.5;
      const ground = x => y0 + (x - x0) / sc * tb * sc;
      S('path', { d: `M0 ${ground(0)} L720 ${ground(720)} V400 H0 Z`, fill: f('agyag'), opacity: .75 }, g);
      S('line', { x1: 0, y1: ground(0), x2: 720, y2: ground(720), stroke: '#3d5a1f', 'stroke-width': 3 }, g);
      const dd = 0.9; // alapozási mélység a terep alatt
      if (st.alap === 'ferde') {
        S('path', { d: `M${x0 + 30} ${ground(x0 + 30) + dd * sc} L${x0 + 30 + L * sc} ${ground(x0 + 30 + L * sc) + dd * sc} L${x0 + 30 + L * sc} ${ground(x0 + 30 + L * sc) + (dd - 0.5) * sc} L${x0 + 30} ${ground(x0 + 30) + (dd - 0.5) * sc} Z`, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
        const mx = x0 + 30 + L * sc * 0.55, my = ground(mx) + dd * sc + 18;
        S('line', { x1: mx - 60, y1: my - 60 * tb, x2: mx + 60, y2: my + 60 * tb, style: 'stroke:var(--bad);stroke-width:3', 'marker-end': `url(#${id}-arrbad)` }, g);
        S('text', { x: mx + 70, y: my + 60 * tb + 4, class: 't-s', style: 'fill:var(--bad);font-weight:600', text: 'elcsúszási veszély a ferde síkon' }, g);
        C.push({ st: 'bad', t: 'Ferde alapsíkot sosem szabad tervezni – lépcsőzni kell', v: 'hibás' });
      } else {
        const run = st.h / tb;
        let x = x0 + 30, z = ground(x) / sc;
        const pts = [];
        let base = ground(x) + dd * sc;
        let d = `M${x} ${base}`;
        let nSteps = 0;
        while (x < x0 + 30 + L * sc - 1) {
          const nx = Math.min(x + run * sc, x0 + 30 + L * sc);
          d += ` H${nx}`;
          x = nx;
          if (x < x0 + 30 + L * sc - 1) { base += st.h * sc; d += ` V${base}`; nSteps++; }
        }
        const end = x0 + 30 + L * sc;
        d += ` V${ground(end) + (dd - 0.5) * sc} L${x0 + 30} ${ground(x0 + 30) + (dd - 0.5) * sc} Z`;
        S('path', { d, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
        S('text', { x: x0 + 30, y: ground(x0 + 30) + dd * sc + 22, class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: `${nSteps} lépcső, egyenként ${fmt(st.h * 100, 0)} cm × ${fmt(run, 2)} m` }, g);
        C.push({ st: st.h <= 0.5 + 1e-6 ? 'ok' : 'bad', t: 'Egy lépcső magassága ne legyen nagyobb 50 cm-nél', v: `${fmt(st.h * 100, 0)} cm` });
        C.push({ st: st.beta <= 30 ? 'ok' : 'bad', t: 'A lépcsők sarokpontjait összekötő egyenes ≤ 30°', v: `${fmt(st.beta, 1)}°` });
      }
      S('text', { x: 580, y: 40, class: 't-s', text: `terep lejtése: ${fmt(st.beta, 1)}° (${fmt(tb * 100, 0)} %)` }, g);
    }
    const ul = $('#lpChecks'); ul.innerHTML = '';
    C.forEach(c => { const li = H('li', { cls: c.st }, ul); li.innerHTML = `<i></i><span>${c.t}</span><em>${c.v}</em>`; });
  }
  function render() {
    $('#lpDhO').textContent = fmt(st.dh, 2) + ' m'; $('#lpNO').textContent = st.n + ' db'; $('#lpLO').textContent = fmt(st.l, 2) + ' m';
    $('#lpBetaO').textContent = fmt(st.beta, 1) + '°'; $('#lpHO').textContent = fmt(st.h * 100, 0) + ' cm';
    $$('#lpCtrl [data-m]').forEach(e => e.style.display = e.dataset.m === st.mode ? '' : 'none');
    draw();
  }
  bindSeg($('#lpSeg'), v => { st.mode = v; render(); });
  bindSeg($('#lpAlap'), v => { st.alap = v; render(); });
  [['lpDh', 'dh'], ['lpN', 'n'], ['lpL', 'l'], ['lpBeta', 'beta'], ['lpH', 'h']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => { st[k] = +e.target.value; render(); }));
  render();
});

/* ---- Szomszédos épület ---- */
onReady(function szomszed() {
  const svg = $('#szSvg'); if (!svg) return;
  let mode = 'egyezo', phase = 1, timer = null;
  const TXT = {
    fole: 'Hibás: az új alap a régi épület alapsíkja fölé kerül. Terhe a régi alap felé szétterjed, a régi falat oldalról és felülről is terheli, a régi épület megsüllyedhet, megrepedhet. Az új alapot legalább a régi alapsíkjáig mélyíteni kell.',
    egyezo: 'Helyes: az új épület alapsíkja megegyezik a régi alapsíkkal. Ez a legegyszerűbb, ha a szintek engedik.',
    melyebb: 'Ha az új épület mélyebb padlószintje miatt az alapsíkja a régi alá kerül, a régit alá kell falazni, betonozni. Ez kényes művelet: rövid, egymást nem érintő szakaszokban (1–3–5, majd 2–4–6) dolgoznak, hogy a régi fal mindig alátámasztva maradjon.',
    jet: 'Alternatíva: a régi alap alá jet-grouting technológiával talajbeton oszlopokat készítenek, amelyek a régi alap terhét az új alapsík alá viszik le – utána a munkagödör biztonságosan kiemelhető.'
  };
  function draw() {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    const y0 = 90, sc = 70;
    const Y = z => y0 + z * sc;
    const dOld = 1.2;
    const dNew = mode === 'fole' ? 0.6 : mode === 'egyezo' ? 1.2 : 3.0;
    const exc = phase >= 2 && (mode === 'melyebb' || mode === 'jet');
    S('rect', { x: 0, y: y0, width: 720, height: 400 - y0, fill: f('homok'), opacity: .7 }, g);
    if (exc || mode !== 'melyebb' && mode !== 'jet') {
      // új épület munkagödre / pince
      const pz = mode === 'melyebb' || mode === 'jet' ? 2.5 : 0;
      if (pz) S('rect', { x: 372, y: y0, width: 340, height: pz * sc, style: 'fill:var(--card)' }, g);
    }
    // régi épület
    S('rect', { x: 40, y: 0, width: 300, height: y0, style: 'fill:var(--card-2);stroke:var(--ink-2)' }, g);
    S('text', { x: 190, y: 36, 'text-anchor': 'middle', class: 't-b', text: '(régi)' }, g);
    S('rect', { x: 316, y: 0, width: 24, height: Y(dOld) - 0.5 * sc, fill: f('tegla'), style: 'stroke:var(--ink)' }, g);
    S('rect', { x: 290, y: Y(dOld) - 0.5 * sc, width: 60, height: 0.5 * sc, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
    // aláfalazás / jet
    if ((mode === 'melyebb' || mode === 'jet') && phase >= 1) {
      if (mode === 'melyebb') {
        S('rect', { x: 290, y: Y(dOld), width: 60, height: (dNew - dOld) * sc, fill: f('beton'), style: 'stroke:var(--c2);stroke-width:2.4', opacity: phase >= 1 ? 1 : 0 }, g);
        S('text', { x: 276, y: Y((dOld + dNew) / 2), 'text-anchor': 'end', class: 't-s', style: 'fill:var(--c2);font-weight:600', text: 'aláfalazás' }, g);
        // szakaszolás felülnézet
        const sx = 470, sy = 300;
        S('text', { x: sx, y: sy - 16, class: 't-s', text: 'szakaszok felülnézetben:' }, g);
        for (let i = 0; i < 6; i++) { const done = (phase >= 1 && i % 2 === 0) || phase >= 2; S('rect', { x: sx + i * 36, y: sy, width: 32, height: 22, style: `fill:${done ? 'var(--c2)' : 'var(--card)'};stroke:var(--ink-2)` }, g); S('text', { x: sx + i * 36 + 16, y: sy + 15, 'text-anchor': 'middle', class: 't-s', style: `fill:${done ? '#fff' : 'var(--ink-2)'}`, text: String(i % 2 === 0 ? (i / 2 + 1) * 2 - 1 : ((i + 1) / 2) * 2) }, g); }
      } else {
        for (let i = 0; i < 3; i++) S('path', { d: `M${300 + i * 20} ${Y(dOld)} L${296 + i * 20 - 6} ${Y(dNew)}`, style: 'stroke:#7c7f86;stroke-width:16;stroke-linecap:round;opacity:.85' }, g);
        S('text', { x: 276, y: Y((dOld + dNew) / 2), 'text-anchor': 'end', class: 't-s', style: 'fill:var(--c7);font-weight:600', text: 'jet-grouting oszlopok' }, g);
      }
    }
    // új épület
    if (phase >= 2 || mode === 'fole' || mode === 'egyezo') {
      S('rect', { x: 372, y: 0, width: 330, height: y0 - (mode === 'fole' ? 0 : 0), style: 'fill:var(--card);stroke:var(--k);stroke-width:1.5' }, g);
      S('text', { x: 540, y: 36, 'text-anchor': 'middle', class: 't-b', style: 'fill:var(--k)', text: '(új)' }, g);
      S('rect', { x: 372, y: 0, width: 24, height: Y(dNew) - 0.5 * sc, fill: f('beton'), style: 'stroke:var(--ink)' }, g);
      S('rect', { x: 360, y: Y(dNew) - 0.5 * sc, width: 70, height: 0.5 * sc, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
      if (mode === 'melyebb' || mode === 'jet') S('rect', { x: 396, y: Y(2.5), width: 306, height: 12, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
    }
    if (mode === 'fole') {
      // feszültségszétterjedés a régi alap felé
      S('path', { d: `M360 ${Y(dNew)} L300 ${Y(dNew + 1.6)} M430 ${Y(dNew)} L500 ${Y(dNew + 1.6)}`, style: 'stroke:var(--bad);stroke-width:2;stroke-dasharray:6 4' }, g);
      S('path', { d: `M300 ${Y(dNew + 1.6)} Q395 ${Y(dNew + 2.1)} 500 ${Y(dNew + 1.6)}`, style: 'stroke:var(--bad);stroke-width:2;fill:rgba(210,63,42,.12)' }, g);
      S('path', { d: 'M322 30 l8 12 l-8 10 l10 14', style: 'stroke:var(--bad);stroke-width:2.4;fill:none' }, g);
      S('text', { x: 450, y: Y(dNew + 2.4), class: 't-s', style: 'fill:var(--bad);font-weight:600', text: 'a régi alapot is terheli' }, g);
    }
    S('line', { x1: 0, y1: y0, x2: 720, y2: y0, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    S('line', { x1: 280, y1: Y(dOld), x2: 440, y2: Y(dOld), style: 'stroke:var(--ink-3);stroke-dasharray:4 3' }, g);
    S('text', { x: 140, y: Y(dOld) + 4, class: 't-s', text: `régi alapsík −${fmt(dOld, 1)} m` }, g);
    if (phase >= 2 || mode === 'fole' || mode === 'egyezo') S('text', { x: 440, y: Y(dNew) + 16, class: 't-s', style: 'fill:var(--k);font-weight:600', text: `új alapsík −${fmt(dNew, 1)} m` }, g);
    const v = $('#szVerdict');
    const cls = mode === 'fole' ? 'bad' : mode === 'egyezo' ? 'ok' : 'warn';
    v.className = 'verdict ' + cls;
    v.textContent = mode === 'fole' ? 'Hibás' : mode === 'egyezo' ? 'Helyes' : 'Helyes, de kényes művelet';
    $('#szTxt').textContent = TXT[mode];
  }
  bindSeg($('#szSeg'), v => { mode = v; phase = 2; clearTimeout(timer); draw(); });
  $('#szPlay').addEventListener('click', () => {
    clearTimeout(timer);
    phase = 0; draw();
    const seq = () => { phase++; draw(); if (phase < 2) timer = setTimeout(seq, 1600); };
    timer = setTimeout(seq, 1300);
  });
  phase = 2; draw();
});

/* ---- Alapsík-detektív ---- */
onReady(function detektiv() {
  const sk = spec => el => {
    const svg = S('svg', { viewBox: '0 0 280 180', class: 'fig', style: 'max-width:280px' }, el);
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    const T = (x, y, t, c) => S('text', { x, y, class: 't-s', style: `fill:${c || '#fff'};paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px;font-weight:600`, text: t }, g);
    spec(g, f, T);
  };
  const flat = (g, f, kind = 'homok') => { S('rect', { x: 0, y: 50, width: 280, height: 130, fill: f(kind), opacity: .75 }, g); S('line', { x1: 0, y1: 50, x2: 280, y2: 50, stroke: '#3d5a1f', 'stroke-width': 3 }, g); };
  const cases = [
    { sit: 'Lejtős telken a sávalap alsó síkját a terep lejtésével párhuzamosan, ferdén alakították ki.', a: 1, e: 'Sosem szabad ferde alapsíkot tervezni: lejtős terepen az elcsúszás veszélye miatt az alapsíkot mindig lépcsőzni kell.', pic: sk((g, f, T) => { S('path', { d: 'M0 30 L280 110 V180 H0Z', fill: f('agyag'), opacity: .75 }, g); S('line', { x1: 0, y1: 30, x2: 280, y2: 110, stroke: '#3d5a1f', 'stroke-width': 3 }, g); S('path', { d: 'M40 70 L240 127 L240 115 L40 58Z', fill: f('beton'), style: 'stroke:var(--ink)' }, g); T(10, 170, 'ferde alapsík'); }) },
    { sit: 'Lejtős terepen lépcsőzött alapsík, a lépcsők magassága 65 cm.', a: 1, e: 'Lejtős területen egy lépcső magassága ne legyen nagyobb 50 cm-nél.', pic: sk((g, f, T) => { S('path', { d: 'M0 30 L280 110 V180 H0Z', fill: f('agyag'), opacity: .75 }, g); S('line', { x1: 0, y1: 30, x2: 280, y2: 110, stroke: '#3d5a1f', 'stroke-width': 3 }, g); S('path', { d: 'M30 62 H110 V96 H190 V130 H250 V118 H190 V84 H110 V50 H30Z', fill: f('beton'), style: 'stroke:var(--ink)' }, g); T(10, 170, 'lépcső: 65 cm'); }) },
    { sit: 'Két szomszédos, merőleges alap között 1,0 m szintkülönbség van; a sarokpontokat összekötő egyenes 25°-os.', a: 0, e: 'A 30°-os határon belül marad, így a lépcsőzetes mélyítés megfelelő.', pic: sk((g, f, T) => { flat(g, f); S('rect', { x: 30, y: 70, width: 40, height: 20, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('rect', { x: 200, y: 150, width: 40, height: 20, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('line', { x1: 70, y1: 90, x2: 200, y2: 150, style: 'stroke:var(--ok);stroke-width:2.5;stroke-dasharray:6 4' }, g); T(110, 112, '25°'); }) },
    { sit: 'Pincés régi épület mellé új, pince nélküli házat építenek; az új alapsík −0,8 m, a régié −2,9 m. Az új alap közvetlenül a régi pincefal mellett van.', a: 1, e: 'Az új épület alapsíkja nem kerülhet a régi fölé – az új alap terhe a régi pincefalra hárulna. Mélyíteni kell (vagy a terhet el kell vezetni a faltól).', pic: sk((g, f, T) => { flat(g, f); S('rect', { x: 20, y: 50, width: 110, height: 100, style: 'fill:var(--card)' }, g); S('rect', { x: 120, y: 10, width: 12, height: 150, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('rect', { x: 140, y: 74, width: 40, height: 18, fill: f('beton'), style: 'stroke:var(--k);stroke-width:2' }, g); T(150, 70, 'új'); T(30, 40, 'régi, pincés', 'var(--ink)'); }) },
    { sit: 'Részben alápincézett épület: a magasabb alap belső élétől húzott természetes rézsű vonala a pincepadló alatt éri el a pincefalat.', a: 0, e: 'Ez a szabály teljesülése: a sekélyebb alap terhe nem hárul a pincefalra.', pic: sk((g, f, T) => { flat(g, f); S('rect', { x: 10, y: 50, width: 110, height: 90, style: 'fill:var(--card)' }, g); S('rect', { x: 120, y: 20, width: 10, height: 130, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('rect', { x: 190, y: 84, width: 40, height: 16, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('line', { x1: 190, y1: 100, x2: 130, y2: 148, style: 'stroke:var(--ok);stroke-width:2.5;stroke-dasharray:6 4' }, g); S('line', { x1: 10, y1: 140, x2: 120, y2: 140, style: 'stroke:var(--ink-2)' }, g); T(16, 134, 'pincepadló', 'var(--ink-2)'); }) },
    { sit: 'Budapest (kb. 105 mBf), kötött agyagtalaj, pince nélküli ház; az alapsík −0,60 m-en van.', a: 1, e: 'Kötött talajban 500 mBf alatt a fagyhatár 0,8 m, így legalább −0,80 m-re kell mélyíteni.', pic: sk((g, f, T) => { flat(g, f, 'agyag'); S('rect', { x: 0, y: 50, width: 280, height: 64, fill: f('fagy') }, g); S('rect', { x: 110, y: 56, width: 60, height: 22, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('line', { x1: 0, y1: 114, x2: 280, y2: 114, style: 'stroke:var(--frost);stroke-width:2;stroke-dasharray:6 4' }, g); T(8, 132, 'fagyhatár 0,8 m'); }) },
    { sit: 'Szilárd, ép mészkőre alapozott alap, alapsík −0,50 m.', a: 0, e: 'Szilárd kőzeten álló alapnál a fagyhatár 0,5 m – megfelel.', pic: sk((g, f, T) => { flat(g, f, 'kozet'); S('rect', { x: 110, y: 60, width: 60, height: 30, fill: f('beton'), style: 'stroke:var(--ink)' }, g); T(8, 170, 'szilárd kőzet'); }) },
    { sit: 'Szemcsés homokos kavics 120 mBf magasságon; a téli talajvíz 3 m-rel az alapsík alatt van. Az alapsík −0,55 m.', a: 0, e: 'Szemcsés talajban 500 mBf alatt a fagyhatár 0,5 m-re csökkenthető, ha a téli talajvíz legalább 2,0 m-rel az alapsík alatt marad – megfelel.', pic: sk((g, f, T) => { flat(g, f, 'kavics'); S('rect', { x: 110, y: 56, width: 60, height: 22, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('line', { x1: 0, y1: 160, x2: 280, y2: 160, style: 'stroke:var(--water);stroke-width:2' }, g); T(8, 154, 'téli talajvíz ≥ 2 m-rel lejjebb'); }) }
  ];
  renderGame($('#gameAlapsik'), { title: 'Alapsík-detektív – megfelel vagy nem?', key: 'g4', o: ['Megfelel', 'Nem felel meg'], two: true, cases });
});
onReady(() => renderQuiz($('#quiz4'), QUIZ.q4));
