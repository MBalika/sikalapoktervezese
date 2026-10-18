/* ===== 02 – Alaptípusok: 2D szerkesztők és játék ===== */
onReady(function savalap() {
  const svg = $('#savSvg'); if (!svg) return;
  const st = { anyag: 'tegla', vf: 0.38, B: 0.8, m: 0.5, tg: 1.5 };
  const MAT = {
    tegla: { name: 'Tégla', tg: 1.7, pat: 'tegla', kiegy: true, step: true },
    ko: { name: 'Terméskő', tg: 1.75, pat: 'ko', kiegy: true, step: true },
    uszt: { name: 'Úsztatott beton', tg: null, range: [1.0, 1.6], pat: 'uszt', kiegy: false, step: false },
    csom: { name: 'Csömöszölt beton', tg: null, range: [1.0, 1.5], pat: 'beton', kiegy: false, step: false },
    vb: { name: 'Vasbeton', tg: null, pat: 'beton', kiegy: false, step: false, rc: true }
  };
  const chk = $('#savChecks'), out = $('#savOut');
  function req() {
    const M = MAT[st.anyag];
    return M.tg != null ? M.tg : st.tg;
  }
  function checks() {
    const M = MAT[st.anyag], c = (st.B - st.vf) / 2, L = [];
    L.push({ ok: st.B >= 0.5 - 1e-6, t: 'Alapszélesség B ≥ 50 cm', v: `B = ${fmt(st.B * 100, 0)} cm` });
    L.push({ ok: c >= 0.05 - 1e-6, t: 'Elhelyezési biztonság mindkét oldalon ≥ 5 cm', v: `c = ${fmt(c * 100, 1)} cm` });
    if (M.rc) {
      L.push({ ok: st.m >= st.B / 10 - 1e-6, t: 'Vasbeton alap magassága m ≥ B/10', v: `${fmt(st.m * 100, 0)} ≥ ${fmt(st.B * 10, 0)} cm` });
      L.push({ ok: true, info: true, t: 'Peremvastagság v ≥ 20 cm (a rajzon 20 cm)', v: 'v = 20 cm' });
      L.push({ ok: true, info: true, t: 'Alul hosszvasalás és kengyelek; az alaptest hajlítást vesz fel', v: '' });
    } else {
      L.push({ ok: st.m >= 0.5 - 1e-6, t: 'Alapmagasság m ≥ 50 cm', v: `m = ${fmt(st.m * 100, 0)} cm` });
      const tg = c > 0.001 ? st.m / c : 99;
      L.push({ ok: tg >= req() - 1e-6, t: `Teherelosztás: tg α = m/c ≥ ${fmt(req(), 2)}`, v: c > 0.001 ? `tg α = ${fmt(Math.min(tg, 99), 2)}` : 'nincs kinyúlás' });
      if (M.kiegy) L.push({ ok: true, info: true, t: 'Az első sor alatt 5–10 cm kiegyenlítő homok vagy mészhabarcs', v: '' });
      if (st.anyag === 'uszt') L.push({ ok: true, info: true, t: 'Az úsztatott kő a magasság kb. felét kitevő sávban', v: '' });
      if (st.anyag === 'tegla') L.push({ ok: true, info: true, t: 'Lépcsők: a téglasor és a féltégla többszörösei', v: '' });
    }
    return L;
  }
  function draw() {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const M = MAT[st.anyag];
    const W = 720, cx = 330, yTop = 150;
    const sc = Math.min(240, 560 / st.B, 250 / st.m);
    const B = st.B * sc, m = st.m * sc, vf = st.vf * sc, c = (B - vf) / 2;
    const yB = yTop + m;
    const g = S('g', {}, svg);
    // talaj
    S('rect', { x: 0, y: 112, width: W, height: 470 - 112, fill: f('homok'), opacity: 0.55 }, g);
    S('line', { x1: 0, y1: 112, x2: W, y2: 112, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    // padló, fal
    S('rect', { x: cx + vf / 2, y: 112, width: W - cx - vf / 2, height: 12, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
    S('text', { x: cx + vf / 2 + 12, y: 106, class: 't-s', text: 'padló' }, g);
    S('rect', { x: cx - vf / 2, y: 44, width: vf, height: yTop - 44, fill: f(st.anyag === 'ko' ? 'ko' : 'tegla'), style: 'stroke:var(--ink);stroke-width:1.5' }, g);
    // alaptest
    const st1 = 'stroke:var(--ink);stroke-width:1.8';
    if (M.rc) {
      const v = 0.2 * sc;
      const p = `M${cx - B / 2} ${yB} L${cx - B / 2} ${yB - v} L${cx - vf / 2 - 6} ${yTop} L${cx + vf / 2 + 6} ${yTop} L${cx + B / 2} ${yB - v} L${cx + B / 2} ${yB} Z`;
      S('path', { d: p, fill: f('beton'), style: st1 }, g);
      // vasalás
      S('line', { x1: cx - B / 2 + 8, y1: yB - 8, x2: cx + B / 2 - 8, y2: yB - 8, stroke: '#a3341f', 'stroke-width': 3 }, g);
      for (let i = 0; i < 7; i++) S('circle', { cx: cx - B / 2 + 14 + i * (B - 28) / 6, cy: yB - 13, r: 3, fill: '#a3341f' }, g);
      S('path', { d: `M${cx - 10} ${yB - 10} V${yTop - 40} M${cx + 10} ${yB - 10} V${yTop - 40}`, stroke: '#a3341f', 'stroke-width': 2.4, fill: 'none' }, g);
      dimLine(g, cx + B / 2 + 18, yB - v, cx + B / 2 + 18, yB, 'v = 20 cm');
      S('rect', { x: cx - B / 2 - 6, y: yB, width: B + 12, height: 0.08 * sc, fill: f('beton'), opacity: 0.6, style: 'stroke:var(--ink-3)' }, g);
      S('text', { x: cx + B / 2 + 10, y: yB + 0.08 * sc + 14, class: 't-s', text: 'szerelőbeton' }, g);
    } else if (M.step) {
      const n = Math.max(1, Math.min(6, Math.round((st.B - st.vf) / 2 / 0.125)));
      let pts = [];
      for (let i = 0; i <= n; i++) {
        const xi = vf / 2 + c * i / n, yi = yTop + m * i / n;
        if (i === 0) pts.push([xi, yi]); else { pts.push([xi, yTop + m * (i - 1) / n]); pts.push([xi, yi]); }
      }
      const right = pts.map(([x, y]) => `${cx + x} ${y}`).join(' L');
      const left = pts.slice().reverse().map(([x, y]) => `${cx - x} ${y}`).join(' L');
      S('path', { d: `M${cx - vf / 2} ${yTop} L${right} L${cx + B / 2} ${yB} L${cx - B / 2} ${yB} L${left} Z`, fill: f(M.pat), style: st1 }, g);
      // kiegyenlítő
      S('rect', { x: cx - B / 2, y: yB, width: B, height: 0.075 * sc, fill: f('homok'), style: 'stroke:var(--ink-3)' }, g);
      S('text', { x: cx + B / 2 + 10, y: yB + 0.075 * sc, class: 't-s', text: '5–10 cm kiegyenlítő réteg' }, g);
    } else {
      S('path', { d: `M${cx - vf / 2 - 0.05 * sc} ${yTop} L${cx + vf / 2 + 0.05 * sc} ${yTop} L${cx + B / 2} ${yTop + Math.min(m, 0.15 * sc)} L${cx + B / 2} ${yB} L${cx - B / 2} ${yB} L${cx - B / 2} ${yTop + Math.min(m, 0.15 * sc)} Z`, fill: f(M.pat), style: st1 }, g);
      if (st.anyag === 'uszt') S('rect', { x: cx - B / 2 + 4, y: yTop + m * 0.45, width: B - 8, height: 1, style: 'stroke:var(--ink-3);stroke-dasharray:4 3' }, g);
    }
    // teherelosztási vonal
    if (!M.rc) {
      S('line', { x1: cx + vf / 2, y1: yTop, x2: cx + B / 2, y2: yB, style: 'stroke:var(--k);stroke-width:2;stroke-dasharray:6 4' }, g);
      S('path', { d: `M${cx + B / 2 - 26} ${yB} A26 26 0 0 0 ${cx + B / 2 - 26 * Math.cos(Math.atan2(m, c))} ${yB - 26 * Math.sin(Math.atan2(m, c))}`, style: 'stroke:var(--k);fill:none;stroke-width:1.5' }, g);
      S('text', { x: cx + B / 2 - 40, y: yB - 8, class: 't-b', style: 'fill:var(--k)', text: 'α' }, g);
    }
    // teher
    for (let i = -2; i <= 2; i++) S('line', { x1: cx + i * vf / 5, y1: 4, x2: cx + i * vf / 5, y2: 40, style: 'stroke:var(--bad);stroke-width:2', 'marker-end': `url(#${svg.id}-arrbad)` }, g);
    // méretek
    dimLine(g, cx - B / 2, yB + (M.kiegy ? 0.075 * sc : 0) + 30, cx + B / 2, yB + (M.kiegy ? 0.075 * sc : 0) + 30, `B = ${fmt(st.B * 100, 0)} cm`, { dy: 16 });
    dimLine(g, cx - B / 2 - 26, yTop, cx - B / 2 - 26, yB, `m = ${fmt(st.m * 100, 0)} cm`, { dx: -70 });
    dimLine(g, cx - vf / 2 - 60, 80, cx - vf / 2, 80, '', {}); S('text', { x: cx - vf / 2 - 64, y: 84, 'text-anchor': 'end', class: 't-s t-m', text: `fal: ${fmt(st.vf * 100, 0)} cm` }, g);
    if (c > 4) dimLine(g, cx + vf / 2, yB + (M.kiegy ? 0.075 * sc : 0) + 62, cx + B / 2, yB + (M.kiegy ? 0.075 * sc : 0) + 62, `c = ${fmt((st.B - st.vf) / 2 * 100, 1)} cm`, { dy: 16 });
    S('text', { x: 18, y: 26, class: 't-b', text: M.name + ' sávalap' }, g);
  }
  function render() {
    const M = MAT[st.anyag];
    $('#sFalO').textContent = fmt(st.vf * 100, 0) + ' cm';
    $('#sBO').textContent = fmt(st.B * 100, 0) + ' cm';
    $('#sMO').textContent = fmt(st.m * 100, 0) + ' cm';
    $('#sTgWrap').style.display = M.range ? '' : 'none';
    if (M.range) { const t = $('#sTg'); t.min = M.range[0]; t.max = M.range[1]; if (st.tg > M.range[1]) st.tg = M.range[1]; t.value = st.tg; rangeFill(t); }
    $('#sTgO').textContent = fmt(st.tg, 2);
    draw();
    chk.innerHTML = '';
    const L = checks();
    L.forEach(x => { const li = H('li', { cls: x.info ? 'na' : x.ok ? 'ok' : 'bad' }, chk); li.innerHTML = `<i></i><span>${x.t}</span><em>${x.v}</em>`; });
    const all = L.filter(x => !x.info).every(x => x.ok);
    const area = M.rc ? (st.B * 0.2 + (st.m - 0.2) * (st.B + st.vf) / 2) : st.B * st.m * (M.step ? 0.78 : 0.95);
    out.innerHTML = `<div class="verdict ${all ? 'ok' : 'bad'}">${all ? 'A metszet megfelel a szerkesztési szabályoknak.' : 'A metszet nem felel meg – nézd meg a piros sorokat!'} <span class="sp"></span><span class="nw">anyagigény ≈ ${fmt(area, 2)} m³/fm</span> <span class="nw">B/v<sub>f</sub> = ${fmt(st.B / st.vf, 2)}</span></div>`;
  }
  $('#sAnyag').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#sAnyag button').forEach(x => x.classList.toggle('on', x === b));
    st.anyag = b.dataset.v;
    if (st.anyag === 'vb' && st.B < 1.2) { st.B = 1.4; st.m = 0.35; $('#sB').value = st.B; $('#sM').value = st.m; initRanges($('#lab-sav')); }
    render();
  });
  [['sFal', 'vf'], ['sB', 'B'], ['sM', 'm'], ['sTg', 'tg']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => { st[k] = +e.target.value; render(); }));
  $('#sFix').addEventListener('click', () => {
    const M = MAT[st.anyag];
    st.B = Math.max(st.B, 0.5, st.vf + 0.1);
    const c = (st.B - st.vf) / 2;
    if (M.rc) st.m = Math.max(0.3, Math.ceil(st.B / 10 * 20) / 20);
    else st.m = Math.max(0.5, Math.ceil(req() * c * 20 - 1e-9) / 20);
    st.m = Math.min(st.m, 1.4);
    $('#sB').value = st.B; $('#sM').value = st.m; initRanges($('#lab-sav'));
    render();
  });
  window.addEventListener('themechange', render);
  render();
});

/* ---- Válaszfal alapozása ---- */
onReady(function valaszfal() {
  const svg = $('#vfSvg'); if (!svg) return;
  const TXT = {
    a: 'Külön, kisebb sávalap a válaszfal alatt – ugyanúgy, mint a főfalaknál, csak kisebb méretben. Biztos, de földmunkát és betont igényel.',
    b: 'A padozatot (aljzatbetont) a válaszfal alatt megvastagítjuk és megfelelően vasaljuk. Könnyű válaszfalaknál gazdaságos.',
    c: 'Ha eleve előregyártott gerendás födém készül, egy vasbeton gerenda „áthordja” a válaszfal terhét a merőleges főfalak sávalapjaira.'
  };
  function draw(v) {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    S('rect', { x: 0, y: 150, width: 720, height: 150, fill: f('homok'), opacity: .6 }, g);
    const slabY = 140;
    if (v === 'a') {
      S('rect', { x: 0, y: slabY, width: 720, height: 14, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
      S('rect', { x: 320, y: slabY + 14, width: 80, height: 110, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.6' }, g);
      S('text', { x: 410, y: slabY + 80, class: 't-s', text: 'kisebb sávalap' }, g);
    } else if (v === 'b') {
      S('path', { d: `M0 ${slabY} H720 V${slabY + 14} H440 L410 ${slabY + 50} H310 L280 ${slabY + 14} H0 Z`, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.6' }, g);
      S('line', { x1: 300, y1: slabY + 42, x2: 420, y2: slabY + 42, stroke: '#a3341f', 'stroke-width': 3 }, g);
      S('text', { x: 450, y: slabY + 44, class: 't-s', text: 'padozat-vastagítás vasalással' }, g);
    } else {
      S('rect', { x: 0, y: slabY, width: 720, height: 14, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
      S('rect', { x: 300, y: slabY - 30, width: 120, height: 30, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.6' }, g);
      S('line', { x1: 305, y1: slabY - 6, x2: 415, y2: slabY - 6, stroke: '#a3341f', 'stroke-width': 3 }, g);
      S('text', { x: 430, y: slabY - 12, class: 't-s', text: 'vb. gerenda – a terhet a főfalakra viszi' }, g);
      [[40, 'főfal'], [640, 'főfal']].forEach(([x, t]) => { S('rect', { x, y: 30, width: 40, height: slabY - 30, fill: f('tegla'), style: 'stroke:var(--ink)' }, g); S('rect', { x: x - 20, y: slabY + 14, width: 80, height: 70, fill: f('beton'), style: 'stroke:var(--ink)' }, g); S('text', { x: x + 20, y: 24, 'text-anchor': 'middle', class: 't-s', text: t }, g); });
      S('path', { d: 'M300 95 C 200 60, 120 60, 80 90', style: 'stroke:var(--k);stroke-width:2;fill:none', 'marker-end': `url(#${svg.id}-arrk)` }, g);
      S('path', { d: 'M420 95 C 520 60, 600 60, 640 90', style: 'stroke:var(--k);stroke-width:2;fill:none', 'marker-end': `url(#${svg.id}-arrk)` }, g);
    }
    const wy = v === 'c' ? slabY - 30 : slabY;
    S('rect', { x: 345, y: 20, width: 30, height: wy - 20, fill: f('tegla'), style: 'stroke:var(--ink);stroke-width:1.4' }, g);
    S('text', { x: 360, y: 14, 'text-anchor': 'middle', class: 't-s t-b', text: 'válaszfal' }, g);
    S('text', { x: 14, y: slabY - 8, class: 't-s', text: 'aljzatbeton' }, g);
    $('#vfOut').textContent = TXT[v];
  }
  bindSeg($('#vfSeg'), draw);
  draw('a');
});

/* ---- Pillér–alaptest kapcsolat ---- */
onReady(function kapcsolat() {
  const svg = $('#kSvg'); if (!svg) return;
  const TXT = {
    befog: 'Befogott kapcsolat: a pillér fővasai (indítóvasai) lehorgonyozva futnak le az alaptestbe, így a csomópont nyomatékot is átad. Az alaptest alul legalább hálós vasalást kap.',
    csuklo: 'Csuklós jellegű kapcsolat: a pillér a csomópontban leszűkül, a hézagot rugalmasan deformálható anyag tölti ki, a vasak a nyírást és a függőleges erőt adják át – nyomatékot gyakorlatilag nem.',
    kehely: 'Korábbi megoldás: előregyártott vasbeton kehelyalap. Az oszlopot a talp „kelyhébe” állították, majd kibetonozással rögzítették végleges helyzetében.',
    nyak: 'Mai megoldás: az előregyártott oszlopot monolit vasbeton tömbalapra (lemezre) helyezett kehelynyakba állítják és fogják be.',
    acel: 'Acélpillér és betonalap: talplemez, alátöltés és tőcsavarok. A csavarorsós lekötés az esetleges húzóerők átadásához kell (egy- vagy kétirányú nyomatékbíró kapcsolat).',
    kor: 'Zárt alaprajzú építmény (víztorony, gyárkémény): egyetlen tömbként kialakított, rendszerint kör alaprajzú alaptest – lényegében nagyméretű pilléralap.'
  };
  function draw(v) {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    const st = 'stroke:var(--ink);stroke-width:1.6';
    S('rect', { x: 0, y: 180, width: 720, height: 140, fill: f('kavics'), opacity: .55 }, g);
    S('line', { x1: 0, y1: 180, x2: 720, y2: 180, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    const red = '#a3341f';
    if (v === 'kor') {
      S('path', { d: 'M150 300 V250 L230 230 H490 L570 250 V300 Z', fill: f('beton'), style: st }, g);
      S('rect', { x: 260, y: 20, width: 34, height: 210, fill: f('beton'), style: st }, g);
      S('rect', { x: 426, y: 20, width: 34, height: 210, fill: f('beton'), style: st }, g);
      S('ellipse', { cx: 360, cy: 20, rx: 100, ry: 12, fill: 'none', style: 'stroke:var(--ink-2);stroke-dasharray:4 3' }, g);
      dimLine(g, 150, 312, 570, 312, 'D – kör alaprajzú tömb', { dy: -6 });
    } else if (v === 'acel') {
      S('rect', { x: 250, y: 200, width: 220, height: 90, fill: f('beton'), style: st }, g);
      S('rect', { x: 300, y: 190, width: 120, height: 10, fill: '#d9d4c5', style: 'stroke:var(--ink-3)' }, g);
      S('rect', { x: 296, y: 180, width: 128, height: 10, fill: '#59636c', style: st }, g);
      S('path', { d: 'M340 180 V30 M380 180 V30', style: 'stroke:#59636c;stroke-width:8' }, g);
      S('path', { d: 'M332 30 H388 M332 176 H388', style: 'stroke:#59636c;stroke-width:5' }, g);
      [312, 408].forEach(x => { S('line', { x1: x, y1: 172, x2: x, y2: 270, style: 'stroke:#2f3a44;stroke-width:4' }, g); S('path', { d: `M${x - 10} 270 H${x + 10}`, style: 'stroke:#2f3a44;stroke-width:4' }, g); S('rect', { x: x - 7, y: 168, width: 14, height: 6, fill: '#2f3a44' }, g); });
      S('text', { x: 440, y: 190, class: 't-s', text: 'alátöltés' }, g);
      S('text', { x: 440, y: 250, class: 't-s', text: 'tőcsavarok (húzóerők)' }, g);
    } else if (v === 'kehely' || v === 'nyak') {
      const top = v === 'kehely' ? 200 : 140;
      if (v === 'kehely') S('path', { d: `M220 300 V250 H290 V${top} H310 V280 H410 V${top} H430 V250 H500 V300 Z`, fill: f('beton'), style: st }, g);
      else { S('rect', { x: 210, y: 240, width: 300, height: 60, fill: f('beton'), style: st }, g); S('path', { d: `M290 240 V${top} H310 V230 H410 V${top} H430 V240 Z`, fill: f('beton'), style: st }, g); }
      S('rect', { x: 318, y: 20, width: 84, height: (v === 'kehely' ? 260 : 210), fill: '#cfcac0', style: st }, g);
      S('path', { d: `M310 ${top} H318 V${v === 'kehely' ? 280 : 230} H310 Z M402 ${top} H410 V${v === 'kehely' ? 280 : 230} H402 Z`, fill: '#8a8f86' }, g);
      S('text', { x: 440, y: top + 20, class: 't-s', text: v === 'kehely' ? 'előregyártott kehelyalap' : 'monolit kehelynyak' }, g);
      S('text', { x: 440, y: top + 38, class: 't-s', text: 'kibetonozás' }, g);
      S('text', { x: 300, y: 14, class: 't-s', text: 'előregyártott oszlop' }, g);
    } else {
      S('path', { d: 'M220 300 V250 L320 215 H400 L500 250 V300 Z', fill: f('beton'), style: st }, g);
      const narrow = v === 'csuklo';
      S('rect', { x: 320, y: 20, width: 80, height: narrow ? 180 : 195, fill: f('beton'), style: st }, g);
      if (narrow) { S('rect', { x: 340, y: 200, width: 40, height: 15, fill: f('beton'), style: st }, g); S('rect', { x: 320, y: 200, width: 20, height: 15, fill: '#e6c34a', opacity: .8 }, g); S('rect', { x: 380, y: 200, width: 20, height: 15, fill: '#e6c34a', opacity: .8 }, g); S('text', { x: 508, y: 212, class: 't-s', text: 'rugalmasan deformálható anyag' }, g); S('path', { d: 'M352 60 V270 M368 60 V270', stroke: red, 'stroke-width': 3 }, g); }
      else { S('path', { d: 'M332 30 V285 H300 M388 30 V285 H420', stroke: red, 'stroke-width': 3, fill: 'none' }, g); S('text', { x: 508, y: 262, class: 't-s', text: 'lehorgonyzott indítóvasak' }, g); }
      S('line', { x1: 232, y1: 290, x2: 488, y2: 290, stroke: red, 'stroke-width': 3 }, g);
      for (let i = 0; i < 9; i++) S('circle', { cx: 240 + i * 30, cy: 285, r: 3, fill: red }, g);
      S('text', { x: 506, y: 296, class: 't-s', text: 'alsó vasháló' }, g);
    }
    $('#kOut').textContent = TXT[v];
  }
  bindSeg($('#kSeg'), draw);
  draw('befog');
});

/* ---- Lemezalap-változatok ---- */
onReady(function lemezek() {
  const svg = $('#lSvg'); if (!svg) return;
  const TXT = {
    sik: 'Azonos vastagságú síklemez: viszonylag kisebb terheknél. Egyszerű zsaluzni és vasalni, de hajlékony.',
    felul: 'Felülbordás lemez: a falak és pillérek vonalában felfelé álló bordák merevítenek. Az alsó sík sík marad, a bordák közét feltöltik.',
    alul: 'Alulbordás lemez: a bordák a talajba nyúlnak. A felső sík sík padlót ad, de a bordák árkait ki kell emelni.',
    gomba: '„Gombafödém” jellegű lemez: pillérvázas épületeknél nagyobb terhek esetén a pillérek alatti megvastagítás az átszúródást akadályozza meg.',
    rejtett: 'Rejtettbordás lemez: a bordák helyén csak erősítő vasbetétek maradnak, a vastagság a bordákéval azonos.',
    terszini: 'Térszíni lemezalap: csak a humuszos talajt és (részben) a feltöltést távolítják el; a vasalt lemez egy jól tömörített, min. 50–60 cm vastag szemcsés ágyazati rétegre kerül, alsó síkja a fagyhatár felett marad(hat). Néhány szintes épületeknél, kedvezőtlenebb altalajon és magas talajvíznél is alkalmazható.'
  };
  function draw(v) {
    svg.innerHTML = '';
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    const st = 'stroke:var(--ink);stroke-width:1.6';
    const red = '#a3341f';
    const y = v === 'terszini' ? 100 : 120, t = v === 'rejtett' ? 46 : 26;
    S('rect', { x: 0, y: y, width: 720, height: 280 - y, fill: f(v === 'terszini' ? 'agyag' : 'homok'), opacity: .55 }, g);
    if (v === 'terszini') {
      S('rect', { x: 60, y: y + 26, width: 600, height: 58, fill: f('kavics'), style: 'stroke:var(--ink-3)' }, g);
      S('text', { x: 670, y: y + 60, class: 't-s', 'text-anchor': 'end', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: 'tömörített szemcsés ágyazat ≥ 50–60 cm' }, g);
      S('line', { x1: 0, y1: y + 130, x2: 720, y2: y + 130, style: 'stroke:var(--frost);stroke-width:2;stroke-dasharray:8 5' }, g);
      S('text', { x: 10, y: y + 124, class: 't-s', style: 'fill:var(--frost)', text: 'fagyhatár – a lemez alsó síkja felette maradhat' }, g);
      S('line', { x1: 0, y1: y, x2: 60, y2: y, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
      S('line', { x1: 660, y1: y, x2: 720, y2: y, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    }
    const py = v === 'terszini' ? y : y;
    S('rect', { x: 60, y: py, width: 600, height: t, fill: f('beton'), style: st }, g);
    [150, 360, 570].forEach(x => {
      if (v === 'felul') S('rect', { x: x - 22, y: py - 44, width: 44, height: 44, fill: f('beton'), style: st }, g);
      if (v === 'alul') S('rect', { x: x - 22, y: py + t, width: 44, height: 44, fill: f('beton'), style: st }, g);
      if (v === 'gomba') S('path', { d: `M${x - 70} ${py + t} L${x - 40} ${py + t + 30} H${x + 40} L${x + 70} ${py + t} Z`, fill: f('beton'), style: st }, g);
      if (v === 'rejtett') { for (let k = -2; k <= 2; k++) S('circle', { cx: x + k * 9, cy: py + t - 10, r: 3.2, fill: red }, g); S('rect', { x: x - 26, y: py + 4, width: 52, height: t - 8, fill: 'none', style: 'stroke:#a3341f;stroke-dasharray:3 3' }, g); }
      const top = v === 'felul' ? py - 44 : py;
      S('rect', { x: x - 12, y: 10, width: 24, height: top - 10, fill: f('beton'), style: st }, g);
    });
    S('line', { x1: 66, y1: py + t - 6, x2: 654, y2: py + t - 6, stroke: red, 'stroke-width': 2.4 }, g);
    S('line', { x1: 66, y1: py + 6, x2: 654, y2: py + 6, stroke: red, 'stroke-width': 1.6, 'stroke-dasharray': '10 5' }, g);
    $('#lOut').textContent = TXT[v];
  }
  bindSeg($('#lSeg'), draw);
  draw('sik');
});

/* ---- Játék: melyik alaptípus? ---- */
onReady(function tipusJatek() {
  const icon = kind => el => {
    const svg = S('svg', { viewBox: '0 0 280 180', class: 'fig', style: 'max-width:280px' }, el);
    const { f } = soilDefs(svg);
    const g = S('g', {}, svg);
    S('rect', { x: 0, y: 120, width: 280, height: 60, fill: f(kind.soil || 'homok'), opacity: .6 }, g);
    S('line', { x1: 0, y1: 120, x2: 280, y2: 120, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    if (kind.gw) { S('line', { x1: 0, y1: 120 + kind.gw, x2: 280, y2: 120 + kind.gw, style: 'stroke:var(--water);stroke-width:2' }, g); S('path', { d: `M240 ${112 + kind.gw} h12 l-6 8z`, style: 'fill:var(--water)' }, g); }
    const st = 'fill:var(--card);stroke:var(--ink-2);stroke-width:1.5';
    const b = kind.b;
    if (b === 'haz') { S('rect', { x: 80, y: 70, width: 120, height: 50, style: st }, g); S('path', { d: 'M70 70 L140 30 L210 70Z', style: 'fill:var(--c2);opacity:.8' }, g); }
    if (b === 'csarnok') { S('path', { d: 'M30 120 V70 L140 50 L250 70 V120', style: st }, g); for (let i = 0; i < 5; i++) S('line', { x1: 40 + i * 50, y1: 120, x2: 40 + i * 50, y2: 66, style: 'stroke:var(--ink-2);stroke-width:4' }, g); }
    if (b === 'pillersor') { S('rect', { x: 30, y: 60, width: 220, height: 8, style: st }, g); for (let i = 0; i < 5; i++) S('line', { x1: 40 + i * 50, y1: 120, x2: 40 + i * 50, y2: 68, style: 'stroke:var(--ink-2);stroke-width:5' }, g); }
    if (b === 'halo') { for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) S('circle', { cx: 60 + i * 55 + r * 12, cy: 70 + r * 16, r: 5, style: 'fill:var(--ink-2)' }, g); S('text', { x: 140, y: 40, 'text-anchor': 'middle', class: 't-s', text: 'pillérháló felülnézetben' }, g); }
    if (b === 'lakohaz') { S('rect', { x: 70, y: 20, width: 140, height: 100, style: st }, g); for (let i = 1; i < 10; i++) S('line', { x1: 70, y1: 20 + i * 10, x2: 210, y2: 20 + i * 10, style: 'stroke:var(--line)' }, g); }
    if (b === 'panel') { S('rect', { x: 60, y: 14, width: 160, height: 106, style: st }, g); for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) S('rect', { x: 60 + i * 40, y: 14 + j * 15, width: 40, height: 15, style: 'fill:none;stroke:var(--ink-3)' }, g); }
    if (b === 'torony') { S('rect', { x: 115, y: 10, width: 50, height: 110, style: st }, g); S('path', { d: 'M105 10 h70', style: 'stroke:var(--ink-2);stroke-width:3' }, g); }
    if (b === 'kicsi') { S('rect', { x: 70, y: 60, width: 140, height: 60, style: st }, g); S('rect', { x: 70, y: 50, width: 140, height: 10, style: 'fill:var(--c2);opacity:.6' }, g); }
    if (kind.t) S('text', { x: 10, y: 172, class: 't-s', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: kind.t }, g);
  };
  const O = ['Sávalap', 'Pilléralap', 'Szalagalap', 'Gerendarács-alap', 'Lemezalap', 'Dobozalap', 'Nagyméretű kör alaptest (pilléralap)'];
  renderGame($('#gameTipus'), {
    title: 'Melyik alaptípus? – nyolc tervezési helyzet', key: 'g2', o: O, two: true,
    cases: [
      { sit: 'Kétszintes, falazott családi ház. A teherbíró homokos kavics 1,1 m mélyen kezdődik, a talajvíz mélyen van.', pic: icon({ b: 'haz', soil: 'kavics', t: 'homokos kavics 1,1 m-től' }), a: 0, e: 'Falazott épület, jó talaj a felszín közelében: a falak alatti sávalap a legegyszerűbb és legolcsóbb.' },
      { sit: 'Acélvázas ipari csarnok 6 m-es pillérkiosztással, jó szemcsés talajon. A pillérek közötti süllyedéskülönbség nem okoz gondot.', pic: icon({ b: 'csarnok', soil: 'kavics', t: 'jó szemcsés talaj' }), a: 1, e: 'Koncentrált pillérterhek, külön-külön kezelhető süllyedések: pilléralapok (acélpillérnél tőcsavarral, előregyártott oszlopnál kehelynyakkal).' },
      { sit: 'Egy pillérsor gyengébb altalajon: a pillérek között egy irányban megengedhetetlenül nagy süllyedéskülönbség keletkezne.', pic: icon({ b: 'pillersor', soil: 'agyag', t: 'gyengébb altalaj' }), a: 2, e: 'A szalagalap (talpgerenda) a pillérsort egy irányban köti össze, és hosszirányú merevséget ad.' },
      { sit: 'Pillérháló, ahol mindkét irányban csökkenteni kell a süllyedéskülönbségeket, de a teljes alapterületre még nincs szükség.', pic: icon({ b: 'halo', soil: 'agyag', t: 'mindkét irányban' }), a: 3, e: 'Egymást metsző szalagalapok: gerendarács-alap.' },
      { sit: '10 szintes, teljesen alápincézett lakóház; a mértékadó talajvízszint a pincepadló felett van, a különálló alapok majdnem összeérnének.', pic: icon({ b: 'lakohaz', soil: 'homok', gw: 18, t: 'magas talajvíz' }), a: 4, e: 'A terhet a teljes alapterületen kell átadni, a magas talajvíz miatt pedig vízzáró vasbeton lemez („ellenfödém”) kell: lemezalap.' },
      { sit: 'Házgyári elemekből épülő panelház, amely csak nagyon kis alakváltozást tud károsodás nélkül elviselni.', pic: icon({ b: 'panel', soil: 'homok', t: 'kis alakváltozást tűr' }), a: 5, e: 'Az alaplemez, a pincefalak és a födém együttdolgozó szekrénytartója, a dobozalap adja a szükséges merevséget.' },
      { sit: 'Víztorony zárt, kör alaprajzzal; a teljes teher egyetlen koncentrált tömbön jut az altalajra.', pic: icon({ b: 'torony', soil: 'kavics', t: 'kör alaprajz' }), a: 6, e: 'A zárt alaprajzú építmények egyetlen tömbként kialakított, rendszerint kör alaprajzú alaptestei lényegében nagyméretű pilléralapok.' },
      { sit: 'Kétszintes épület gyenge, de nem szerves felszíni talajon, magas talajvízzel; a feltöltést részben eltávolítják, és tömörített szemcsés ágyazatot építenek.', pic: icon({ b: 'kicsi', soil: 'agyag', gw: 14, t: 'magas talajvíz, gyenge felszín' }), a: 4, e: 'Térszíni lemezalap: a vasalt lemez min. 50–60 cm vastag tömörített szemcsés ágyazatra kerül, alsó síkja a fagyhatár felett maradhat.' }
    ]
  });
});
onReady(() => renderQuiz($('#quiz2'), QUIZ.q2));
