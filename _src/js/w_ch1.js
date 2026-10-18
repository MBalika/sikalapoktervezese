/* ===== 01 – Alapozási döntő ===== */
onReady(function dontes() {
  const svg = $('#dontesSvg'); if (!svg) return;
  const st = { ep: 'haz', tb: 1.2, nincs: false, gw: 4, sens: false, scour: false, incl: false };
  const out = $('#dontesOut');
  const LOAD = { haz: 1, lakohaz: 2, csarnok: 2, torony: 4, hid: 3 };
  const EPN = { haz: 'családi ház', lakohaz: '5 szintes lakóház', csarnok: 'ipari csarnok', torony: 'toronyház', hid: 'híd mederpillére' };
  function decide() {
    const r = [], L = LOAD[st.ep];
    const R = (t, c) => r.push({ t, c });
    let type, title, cls = 'ok';
    if (st.scour || st.incl) {
      type = 'colop'; title = 'Mélyalap (cölöp- vagy kútalap)'; cls = 'warn';
      if (st.scour) R('Síkalap alól a víz kimoshatja, kiüregelheti a talajt – a mélyalap egyik klasszikus indoka (pl. hidak mederpillérei).', 'M4');
      if (st.incl) R('Nagy ferdeségű terhelő erőnél a síkalap elcsúszhat; a cölöpök a vízszintes erőt is felveszik.', 'M5');
      return { type, title, cls, r };
    }
    if (st.nincs) {
      if (L >= 4) { type = 'cprf'; title = 'Vegyes alapozás: cölöppel gyámolított lemez'; cls = 'warn'; R('Mélyebben sincs jobb réteg, de a toronyház terhe nagy: a lemez önmagában túl nagy süllyedést adna, a cölöpök csökkentik.', 'V'); }
      else { type = 'lemez'; title = 'Lemezalap – a teher nagy felületen elosztva'; R('A felszín közeli réteg teherbírása nem nagy, de mélyebben sincs jobb: az épület súlyát nagy felületen kell elosztani.', 'S3'); if (st.sens) R('Süllyedésérzékeny felszerkezetnél a merev lemez a süllyedéskülönbségeket is csökkenti.', 'S2'); }
      return { type, title, cls, r };
    }
    const gwAbove = st.gw < st.tb + 0.3;
    if (st.tb <= 2.0) {
      R(`A teherbíró réteg ${fmt(st.tb, 1)} m mélyen kezdődik – a felszín közelében van.`, 'S1');
      if (st.ep === 'haz') { type = st.sens ? 'racs' : 'sav'; title = st.sens ? 'Merevített síkalap: vasbeton sávalap koszorúval vagy gerendarács' : 'Sávalap a falak alatt'; }
      else if (st.ep === 'lakohaz') { type = (st.gw < 3.5 || st.sens) ? 'lemez' : 'sav'; title = type === 'lemez' ? 'Lemezalap (alápincézve: ellenfödém)' : 'Sávalap a falak alatt'; if (type === 'lemez') R(st.gw < 3.5 ? 'Magas talajvíz mellett a pincés lakóház alá vasbeton lemez („ellenfödém”) célszerű.' : 'Érzékeny felszerkezetnél a merev lemez kiegyenlíti a mozgásokat.', 'S2'); }
      else if (st.ep === 'csarnok') { type = st.sens ? 'racs' : 'pill'; title = st.sens ? 'Gerendarács-alap a pillérraszter alatt' : 'Pilléralapok (kehelynyakas tömbalapok)'; if (st.sens) R('Süllyedésérzékeny csarnoknál a pillérek közötti süllyedéskülönbséget mindkét irányban csökkenteni kell.', 'S2'); }
      else if (st.ep === 'torony') { type = st.sens ? 'cprf' : 'lemez'; title = st.sens ? 'Vegyes alapozás: cölöppel gyámolított lemez' : 'Vastag lemezalap'; cls = 'warn'; R('A toronyház terhe nagy és koncentrált: a terhet a teljes alapterületen kell átadni.', 'S3'); }
      else { type = 'colop'; title = 'Mélyalap'; }
      return { type, title, cls, r };
    }
    if (st.tb <= 5.0) {
      if (gwAbove && !st.sens && L <= 2) {
        type = 'lemez'; title = 'Lemezalap a gyengébb rétegen (talajvízszint-süllyesztés nélkül)'; cls = 'warn';
        R(`A teherbíró réteg (${fmt(st.tb, 1)} m) a talajvíz alatt van: a mélyített alap víztelenítést kívánna.`, 'M3');
        R('Az építmény süllyedésre nem érzékeny, így felszínközeli lemezzel a költséges víztelenítés vagy mélyalapozás kiküszöbölhető.', 'S4');
      } else if (gwAbove) {
        type = 'colop'; title = 'Mélyalap (cölöpalap) – a magas talajvíz miatt'; cls = 'warn';
        R('A teherbíró réteg a talajvíz alatt van: a magas építési talajvízszint miatt a síkalap költségesebb.', 'M3');
        if (L >= 3) R('A nagy terhek miatt a mélyebb réteg teherbírását cölöpökkel érdemes kihasználni.', 'M1');
      } else if (L >= 4) {
        type = 'cprf'; title = 'Vegyes alapozás vagy cölöpalap'; cls = 'warn';
        R('A toronyház nagy terhét a mélyebb teherbíró réteg veheti fel; a lemez és cölöpök együttdolgozása a gazdaságos.', 'V');
      } else {
        type = 'melyitett'; title = 'Mélyített síkalap a teherbíró rétegen';
        R(`A teherbíró réteg ${fmt(st.tb, 1)} m mélyen van, de a talajvíz alatta marad: 3–5 m mélységig a síkalap technológiája még működik.`, 'MS');
        R('Teherbírását síkalapként, a köpenymenti ellenállás elhanyagolásával számítjuk.', 'MS');
      }
      return { type, title, cls, r };
    }
    // tb > 5
    if (!st.sens && L <= 2) {
      type = 'lemez'; title = 'Lemezalap a gyengébb rétegen – ha a süllyedés elviselhető'; cls = 'warn';
      R(`A megbízható teherbíró réteg csak ${fmt(st.tb, 1)} m mélyen van.`, 'M1');
      R('Ha az építmény nem érzékeny, a felszínközeli lemezzel a mélyalapozás kiküszöbölhető – de süllyedésszámítással igazolni kell.', 'S4');
    } else {
      type = L >= 4 ? 'cprf' : 'colop'; title = L >= 4 ? 'Vegyes alapozás: cölöppel gyámolított lemez' : 'Mélyalap (cölöpalap)'; cls = 'bad';
      R(`A megbízható teherbíró réteg csak ${fmt(st.tb, 1)} m mélyen van.`, 'M1');
      if (st.sens) R('Síkalap esetén meg nem engedhető süllyedések keletkeznének.', 'M2');
    }
    return { type, title, cls, r };
  }
  const CODES = { S1: 'síkalap 1. feltétel', S2: 'síkalap 2. feltétel', S3: 'síkalap 3. feltétel', S4: 'síkalap 4. feltétel', M1: 'mélyalap-indok', M2: 'mélyalap-indok', M3: 'mélyalap-indok', M4: 'mélyalap-indok', M5: 'mélyalap-indok', MS: 'mélyített síkalap', V: 'vegyes alapozás' };

  let defs;
  function draw(d) {
    svg.innerHTML = '';
    defs = soilDefs(svg);
    const f = defs.f;
    // keskeny kijelzőn keskenyebb rajzlap, hogy görgetés nélkül is olvasható legyen
    const narrow = (svg.parentElement.clientWidth || 720) < 560;
    const W = narrow ? 480 : 720, y0 = 150, yb = 430;
    svg.setAttribute('viewBox', `0 0 ${W} 440`);
    const maxD = clamp(Math.max(8, st.tb + 5), 8, 21);
    const sc = (yb - y0) / maxD;
    const Y = d => y0 + d * sc;
    const g = S('g', {}, svg);
    // ég
    S('rect', { x: 0, y: 0, width: W, height: y0, style: 'fill:var(--card)' }, g);
    // rétegek
    const topKind = st.nincs ? 'iszap' : 'feltoltes';
    if (st.ep === 'hid') {
      S('rect', { x: 0, y: y0 - 46, width: W, height: 46, fill: 'rgba(47,111,208,.25)' }, g);
      S('path', { d: `M0 ${y0 - 46} Q90 ${y0 - 52} 180 ${y0 - 46} T360 ${y0 - 46} T540 ${y0 - 46} T720 ${y0 - 46}`, style: 'stroke:var(--water)', fill: 'none', 'stroke-width': 2 }, g);
      S('text', { x: 14, y: y0 - 24, class: 't-s', style: 'fill:var(--water)', text: 'folyó – a mederfenék kimosódhat' }, g);
    }
    S('rect', { x: 0, y: y0, width: W, height: Math.min(st.tb, maxD) * sc, fill: f(topKind) }, g);
    if (!st.nincs) S('rect', { x: 0, y: Y(st.tb), width: W, height: Math.max(0, yb - Y(st.tb)), fill: f('kavics') }, g);
    else S('rect', { x: 0, y: Y(st.tb), width: W, height: Math.max(0, yb - Y(st.tb)), fill: f('agyag') }, g);
    S('line', { x1: 0, y1: Y(st.tb), x2: W, y2: Y(st.tb), stroke: '#5b4a35', 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, g);
    // talajvíz
    if (st.gw < maxD) {
      S('rect', { x: 0, y: Y(st.gw), width: W, height: yb - Y(st.gw), fill: 'rgba(47,111,208,.14)' }, g);
      S('line', { x1: 0, y1: Y(st.gw), x2: W, y2: Y(st.gw), style: 'stroke:var(--water)', 'stroke-width': 1.8 }, g);
      const tx = narrow ? 300 : 470;
      S('path', { d: `M${tx - 7} ${Y(st.gw) - 11} h14 l-7 10 z`, style: 'fill:var(--water)' }, g);
      S('text', { x: tx + 12, y: Y(st.gw) - 3, class: 't-s', style: 'fill:#fff;font-weight:600;paint-order:stroke;stroke:rgba(20,50,110,.85);stroke-width:3px', text: `talajvíz −${fmt(st.gw, 1)} m` }, g);
    }
    // terep
    S('line', { x1: 0, y1: y0, x2: W, y2: y0, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    // rétegfeliratok
    const lab = (x, y, t, b) => { const tt = S('text', { x, y, class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.55);stroke-width:3px', text: t }, g); if (b) tt.setAttribute('font-weight', '600'); };
    lab(10, y0 + 16, st.nincs ? 'közepes, összenyomható talaj' : 'gyenge réteg (feltöltés, puha agyag)');
    lab(10, Y(st.tb) + 16, st.nincs ? 'mélyebben sincs jobb' : 'teherbíró réteg (homokos kavics)', true);
    // mélységskála
    const ax = S('g', {}, g);
    for (let d = 0; d <= maxD; d += maxD > 12 ? 2 : 1) {
      S('line', { x1: W - 30, y1: Y(d), x2: W - 22, y2: Y(d), style: 'stroke:var(--ink-3)' }, ax);
      S('text', { x: W - 34, y: Y(d) + 4, 'text-anchor': 'end', class: 't-s t-m', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.5);stroke-width:3px', text: d === 0 ? '0' : '−' + d }, ax);
    }
    S('text', { x: W - 26, y: y0 - 8, 'text-anchor': 'end', class: 't-s t-m', style: 'fill:var(--ink-3)', text: 'mélység [m]' }, ax);
    // épület
    const cx = narrow ? 262 : 330;
    drawBuilding(g, cx, y0, st.ep, sc);
    drawFoundation(g, cx, y0, sc, d, f);
  }
  function drawBuilding(g, cx, y0, ep, sc) {
    const st1 = 'fill:var(--card-2);stroke:var(--ink-2);stroke-width:1.5';
    if (ep === 'haz') {
      S('rect', { x: cx - 90, y: y0 - 70, width: 180, height: 70, style: st1 }, g);
      S('path', { d: `M${cx - 104} ${y0 - 70} L${cx} ${y0 - 128} L${cx + 104} ${y0 - 70} Z`, style: 'fill:var(--c2);opacity:.85;stroke:var(--ink-2);stroke-width:1.5' }, g);
      S('rect', { x: cx - 60, y: y0 - 50, width: 30, height: 26, style: 'fill:var(--water-soft);stroke:var(--ink-3)' }, g);
      S('rect', { x: cx + 26, y: y0 - 50, width: 30, height: 26, style: 'fill:var(--water-soft);stroke:var(--ink-3)' }, g);
    } else if (ep === 'lakohaz') {
      S('rect', { x: cx - 120, y: y0 - 140, width: 240, height: 140, style: st1 }, g);
      for (let i = 1; i < 5; i++) S('line', { x1: cx - 120, y1: y0 - i * 28, x2: cx + 120, y2: y0 - i * 28, style: 'stroke:var(--line)' }, g);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) S('rect', { x: cx - 108 + j * 38, y: y0 - 132 + i * 28, width: 22, height: 14, style: 'fill:var(--water-soft);stroke:var(--ink-3);stroke-width:.6' }, g);
    } else if (ep === 'csarnok') {
      S('path', { d: `M${cx - 150} ${y0} V${y0 - 70} L${cx} ${y0 - 100} L${cx + 150} ${y0 - 70} V${y0}`, style: st1 }, g);
      for (let i = -2; i <= 2; i++) S('line', { x1: cx + i * 70, y1: y0, x2: cx + i * 70, y2: y0 - 72 - (2 - Math.abs(i)) * 13, style: 'stroke:var(--ink-2);stroke-width:4' }, g);
    } else if (ep === 'torony') {
      S('rect', { x: cx - 70, y: 6, width: 140, height: y0 - 6, style: st1 }, g);
      for (let y = y0 - 14; y > 10; y -= 14) S('line', { x1: cx - 70, y1: y, x2: cx + 70, y2: y, style: 'stroke:var(--line)' }, g);
      S('text', { x: cx, y: 22, 'text-anchor': 'middle', class: 't-s', style: 'fill:var(--ink-3)', text: '… 25+ szint' }, g);
    } else if (ep === 'hid') {
      S('rect', { x: Math.max(0, cx - 250), y: 20, width: Math.min(500, W - Math.max(0, cx - 250)), height: 18, style: st1 }, g);
      S('rect', { x: cx - 26, y: 38, width: 52, height: y0 - 38, style: st1 }, g);
    }
  }
  function drawFoundation(g, cx, y0, sc, d, f) {
    const Y = dd => y0 + dd * sc;
    const conc = f('beton');
    const sty = 'stroke:var(--ink);stroke-width:1.5';
    const fe = (x, w, d0, d1) => S('rect', { x, y: Y(d0), width: w, height: (d1 - d0) * sc, fill: conc, style: sty }, g);
    const t = d.type;
    const ep = st.ep;
    const half = { haz: 90, lakohaz: 120, csarnok: 150, torony: 70, hid: 26 }[ep];
    const fd = 1.0;
    if (t === 'sav') { const B = ep === 'haz' ? 0.8 : 1.4; fe(cx - half - B * sc / 2 + 6, B * sc, fd - 0.5, fd); fe(cx + half - B * sc / 2 - 6, B * sc, fd - 0.5, fd); if (ep !== 'haz') fe(cx - B * sc / 2, B * sc, fd - 0.5, fd); }
    else if (t === 'pill') { for (let i = -2; i <= 2; i++) fe(cx + i * 70 - 0.9 * sc, 1.8 * sc, fd - 0.6, fd + 0.2); }
    else if (t === 'racs') { fe(cx - half - 10, half * 2 + 20, fd - 0.2, fd + 0.3); for (let i = -2; i <= 2; i++) { const x = ep === 'csarnok' ? cx + i * 70 : cx + i * half / 2; fe(x - 0.5 * sc, 1.0 * sc, fd - 0.3, fd + 0.3); } S('text', { x: cx, y: Y(fd + 0.3) + 16, 'text-anchor': 'middle', class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: 'mindkét irányban összekötött alapok' }, g); }
    else if (t === 'lemez') { const th = ep === 'torony' ? 2.0 : 0.6; const top = ep === 'lakohaz' && st.gw < 3.5 ? 2.6 : 0.6; fe(cx - half - 12, half * 2 + 24, top, top + th); if (top > 1) { S('rect', { x: cx - half - 12, y: y0, width: 10, height: top * sc, fill: conc, style: sty }, g); S('rect', { x: cx + half + 2, y: y0, width: 10, height: top * sc, fill: conc, style: sty }, g); S('text', { x: cx, y: Y(top) - 8, 'text-anchor': 'middle', class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: 'pince – ellenfödém' }, g); } }
    else if (t === 'melyitett') { const B = 1.6; [-half + 8, half - 8].forEach(x => { S('rect', { x: cx + x - 0.25 * sc, y: Y(0.4), width: 0.5 * sc, height: (st.tb - 0.4) * sc, fill: conc, style: sty }, g); fe(cx + x - B * sc / 2, B * sc, st.tb, st.tb + 0.6); }); S('text', { x: cx, y: Y(st.tb) - 10, 'text-anchor': 'middle', class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: 'mélyített síkalap a teherbíró rétegen' }, g); }
    else if (t === 'colop' || t === 'cprf') {
      const capTop = t === 'cprf' ? 0.6 : (ep === 'hid' ? 0 : 0.5);
      const capH = t === 'cprf' ? (ep === 'torony' ? 2.0 : 1.0) : 0.8;
      const span = ep === 'hid' ? 70 : half + 10;
      fe(cx - span, span * 2, capTop, capTop + capH);
      const tip = st.nincs ? capTop + capH + 12 : Math.max(st.tb + 3, capTop + capH + 4);
      const n = t === 'cprf' ? 7 : (ep === 'hid' ? 3 : 5);
      for (let i = 0; i < n; i++) {
        const x = cx - span + 16 + i * (span * 2 - 32) / (n - 1);
        S('rect', { x: x - 0.4 * sc, y: Y(capTop + capH), width: 0.8 * sc, height: (Math.min(tip, 20.5) - capTop - capH) * sc, fill: conc, style: 'stroke:var(--ink);stroke-width:1.2' }, g);
      }
      S('text', { x: cx, y: Y(Math.min(tip, 20)) + 16, 'text-anchor': 'middle', class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: t === 'cprf' ? 'lemez + cölöpök együttdolgozása' : 'cölöpök a teherbíró rétegig' }, g);
    }
  }
  function render() {
    $('#dTbO').textContent = '−' + fmt(st.tb, 1) + ' m';
    $('#dGwO').textContent = '−' + fmt(st.gw, 1) + ' m';
    $('#dTb').disabled = st.nincs;
    const d = decide();
    draw(d);
    out.innerHTML = '';
    const v = H('div', { cls: 'verdict ' + d.cls }, out);
    v.innerHTML = `Javaslat (${EPN[st.ep]}): <span>${d.title}</span>`;
    const ul = H('ul', { cls: 'checks', style: 'margin-top:10px' }, out);
    d.r.forEach(x => { const li = H('li', { cls: x.c.startsWith('S') || x.c === 'MS' ? 'ok' : 'warn' }, ul); li.innerHTML = `<i></i><span>${x.t}</span><em>${CODES[x.c] || ''}</em>`; });
  }
  $('#dEpulet').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#dEpulet button').forEach(x => x.classList.toggle('on', x === b));
    st.ep = b.dataset.v;
    if (st.ep === 'hid') { st.scour = true; $('#dScour').checked = true; }
    render();
  });
  const bind = (id, k, fn = v => +v) => { const el = $('#' + id); el.addEventListener('input', () => { st[k] = el.type === 'checkbox' ? el.checked : fn(el.value); render(); }); };
  bind('dTb', 'tb'); bind('dGw', 'gw'); bind('dNincs', 'nincs'); bind('dSens', 'sens'); bind('dScour', 'scour'); bind('dIncl', 'incl');
  window.addEventListener('themechange', render);
  let lastNarrow = null;
  window.addEventListener('resize', () => { const n = (svg.parentElement.clientWidth || 720) < 560; if (n !== lastNarrow) { lastNarrow = n; render(); } });
  render();
});
onReady(() => renderQuiz($('#quiz1'), QUIZ.q1));
