/* ===== 02 – Alaptípusok: 2D szerkesztők és játék ===== */
onReady(function savalap() {
  const svg = $('#savSvg'); if (!svg) return;
  const st = { anyag: 'tegla', vf: 0.38, B: 0.8, m: 0.5, tg: 1.5, kh: 2 };
  const KH = {
    2: 'Tömör szemcsés talaj (φ ≥ 36°) vagy kemény kötött talaj (c<sub>u</sub> ≥ 75 kPa)',
    1.5: 'Szemcsés talaj vagy gyúrható kötött talaj (c<sub>u</sub> ≥ 40 kPa)',
    1: 'Kis teherbírású talaj'
  };
  const MAT = {
    tegla: { name: 'Tégla', tg: 1.7, pat: 'tegla', kiegy: true, step: true },
    ko: { name: 'Terméskő', tg: 1.75, pat: 'ko', kiegy: true, step: true },
    csom: { name: 'Csömöszölt beton', tg: null, pat: 'beton', kiegy: false, step: false },
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
    L.push({ ok: c >= 0.05 - 1e-6, t: 'Elhelyezési biztonság oldalanként ≥ 5 cm', v: `c = ${fmt(c * 100, 1)} cm` });
    if (M.rc) {
      L.push({ ok: st.m >= st.B / 10 - 1e-6, t: 'Vasbeton alap magassága m ≥ B/10', v: `${fmt(st.m * 100, 0)} ≥ ${fmt(st.B * 10, 0)} cm` });
      L.push({ ok: true, info: true, t: 'Az alaptest teteje vízszintes; alul hosszvasalás és kengyelek, az alaptest hajlítást vesz fel', v: '' });
      L.push({ ok: true, info: true, t: 'Nem agresszív talajvíz esetén legalább C16/20 betonminőség', v: '' });
    } else {
      L.push({ ok: st.m >= 0.5 - 1e-6, t: 'Alapmagasság m ≥ 50 cm', v: `m = ${fmt(st.m * 100, 0)} cm` });
      if (M.step) {
        const tg = c > 0.001 ? st.m / c : 99;
        L.push({ ok: tg >= req() - 1e-6, t: `Teherelosztás: tg α = m/c ≥ ${fmt(req(), 2)}`, v: c > 0.001 ? `tg α = ${fmt(Math.min(tg, 99), 2)}` : 'nincs kinyúlás' });
      } else {
        const need = st.kh * c;
        L.push({ ok: st.m >= need - 1e-6, t: `Egyszerűsített szabály: k : h = 1 : ${fmt(st.kh, st.kh % 1 ? 1 : 0)}, azaz m ≥ ${fmt(st.kh, st.kh % 1 ? 1 : 0)} · c`, v: `${fmt(st.m * 100, 0)} ≥ ${fmt(need * 100, 0)} cm` });
        L.push({ ok: true, info: true, t: 'Nem agresszív talajvíz esetén legalább C12/15 betonminőség', v: '' });
      }
      if (M.kiegy) L.push({ ok: true, info: true, t: 'Az első sor alatt 5–10 cm kiegyenlítő homok vagy mészhabarcs', v: '' });
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
      S('rect', { x: cx - B / 2, y: yTop, width: B, height: m, fill: f('beton'), style: st1 }, g);
      // vasalás
      S('line', { x1: cx - B / 2 + 8, y1: yB - 8, x2: cx + B / 2 - 8, y2: yB - 8, stroke: '#a3341f', 'stroke-width': 3 }, g);
      for (let i = 0; i < 7; i++) S('circle', { cx: cx - B / 2 + 14 + i * (B - 28) / 6, cy: yB - 13, r: 3, fill: '#a3341f' }, g);
      S('path', { d: `M${cx - 10} ${yB - 10} V${yTop - 40} M${cx + 10} ${yB - 10} V${yTop - 40}`, stroke: '#a3341f', 'stroke-width': 2.4, fill: 'none' }, g);
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
      // beton alaptest: vízszintes tetejű téglalap, k : h vonallal
      S('rect', { x: cx - B / 2, y: yTop, width: B, height: m, fill: f(M.pat), style: st1 }, g);
      S('line', { x1: cx + vf / 2, y1: yTop, x2: cx + B / 2, y2: yB, style: 'stroke:var(--k);stroke-width:2;stroke-dasharray:6 4' }, g);
      S('line', { x1: cx - vf / 2, y1: yTop, x2: cx - B / 2, y2: yB, style: 'stroke:var(--k);stroke-width:2;stroke-dasharray:6 4' }, g);
      if (c > 4) S('text', { x: cx + B / 2 + 10, y: yTop + m / 2 + 5, class: 't-b', style: 'fill:var(--k)', text: `k : h = 1 : ${fmt(st.m / ((st.B - st.vf) / 2), 2)}` }, g);
    }
    // teherelosztási vonal: csak tégla és terméskő alapnál
    if (M.step) {
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
    $('#sKhWrap').style.display = st.anyag === 'csom' ? '' : 'none';
    $$('#sKh button').forEach(b => b.classList.toggle('on', +b.dataset.v === st.kh));
    $('#sKhD').innerHTML = KH[st.kh] + ` → <span class="nw">k : h = 1 : ${fmt(st.kh, st.kh % 1 ? 1 : 0)}</span>`;
    draw();
    chk.innerHTML = '';
    const L = checks();
    L.forEach(x => { const li = H('li', { cls: x.info ? 'na' : x.ok ? 'ok' : 'bad' }, chk); li.innerHTML = `<i></i><span>${x.t}</span><em>${x.v}</em>`; });
    const all = L.filter(x => !x.info).every(x => x.ok);
    const area = st.B * st.m * (M.step ? 0.78 : 1);
    out.innerHTML = `<div class="verdict ${all ? 'ok' : 'bad'}">${all ? 'A metszet megfelel a szerkesztési szabályoknak.' : 'A metszet nem felel meg – nézd meg a piros sorokat!'} <span class="sp"></span><span class="nw">anyagigény ≈ ${fmt(area, 2)} m³/fm</span> <span class="nw">B/v<sub>f</sub> = ${fmt(st.B / st.vf, 2)}</span></div>`;
  }
  $('#sAnyag').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#sAnyag button').forEach(x => x.classList.toggle('on', x === b));
    st.anyag = b.dataset.v;
    if (st.anyag === 'vb' && st.B < 1.2) { st.B = 1.4; st.m = 0.35; $('#sB').value = st.B; $('#sM').value = st.m; initRanges($('#lab-sav')); }
    render();
  });
  $('#sKh').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.kh = +b.dataset.v; render();
  });
  [['sFal', 'vf'], ['sB', 'B'], ['sM', 'm']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => { st[k] = +e.target.value; render(); }));
  $('#sFix').addEventListener('click', () => {
    const M = MAT[st.anyag];
    st.B = Math.max(st.B, 0.5, st.vf + 0.1);
    const c = (st.B - st.vf) / 2;
    if (M.rc) st.m = Math.max(0.3, Math.ceil(st.B / 10 * 20) / 20);
    else if (M.step) st.m = Math.max(0.5, Math.ceil(req() * c * 20 - 1e-9) / 20);
    else st.m = Math.max(0.5, Math.ceil(st.kh * c * 20 - 1e-9) / 20);
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
    c: 'Ha eleve előregyártott gerendás födém készül, a válaszfal alá is előregyártott vasbeton gerenda kerül. Ennek két vége a merőleges főfalak sávalapjaira van ráültetve és bekötve, így a válaszfal terhét azokra „áthordja”. A metszetben a gerenda keresztmetszete látszik, a főfalak alapjai a metszet síkja előtt és mögött vannak.'
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
      const sY = 18; // vasalt padló vastagsága a rajzon
      S('path', { d: `M0 ${slabY} H720 V${slabY + sY} H440 L410 ${slabY + 56} H310 L280 ${slabY + sY} H0 Z`, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.6' }, g);
      // vasháló: a rajz síkjában futó vas vonalként, az arra merőleges vasak elmetszve (pöttyök)
      const RC = '#a3341f';
      const mesh = (x1, x2, y, step) => {
        S('line', { x1, y1: y, x2, y2: y, stroke: RC, 'stroke-width': 2 }, g);
        for (let x = x1 + step / 2; x < x2 - 2; x += step) S('circle', { cx: x, cy: y - 3.2, r: 2.3, fill: RC }, g);
      };
      mesh(0, 720, slabY + 11, 20);           // a teljes padlóban
      mesh(318, 402, slabY + 49, 12);         // a vastagítás alján, betontakarással
      S('text', { x: 452, y: slabY + 46, class: 't-s', text: 'padozat-vastagítás vasalással' }, g);
      S('text', { x: 452, y: slabY - 8, class: 't-s', text: 'vasháló a teljes padlóban' }, g);
    } else {
      // előregyártott vb. gerenda keresztmetszete a válaszfal alatt
      const bx = 322, bw = 76, bh = 92, RC = '#a3341f';
      S('rect', { x: 0, y: slabY, width: bx, height: 14, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
      S('rect', { x: bx + bw, y: slabY, width: 720 - bx - bw, height: 14, fill: f('beton'), style: 'stroke:var(--ink-3)' }, g);
      S('rect', { x: bx, y: slabY, width: bw, height: bh, fill: f('beton'), style: 'stroke:var(--ink);stroke-width:1.8' }, g);
      S('rect', { x: bx + 7, y: slabY + 7, width: bw - 14, height: bh - 14, rx: 4, fill: 'none', stroke: RC, 'stroke-width': 1.8 }, g);
      [[bx + 13, slabY + 13], [bx + bw - 13, slabY + 13], [bx + 13, slabY + bh - 13], [bx + bw / 2, slabY + bh - 13], [bx + bw - 13, slabY + bh - 13]]
        .forEach(([x, y]) => S('circle', { cx: x, cy: y, r: 3.6, fill: RC }, g));
      S('line', { x1: bx + bw + 6, y1: slabY + 50, x2: 430, y2: slabY + 50, style: 'stroke:var(--ink-3)' }, g);
      ['előregyártott vb. gerenda (metszet)', 'két vége a merőleges főfalak', 'sávalapjaira ültetve, bekötve', '(a metszetben nem látszanak)']
        .forEach((t, i) => S('text', { x: 436, y: slabY + 54 + i * 18, class: 't-s' + (i ? '' : ' t-b'), text: t }, g));
    }
    const wy = slabY;
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
      S('rect', { x: 150, y: 214, width: 420, height: 66, fill: f('beton'), style: st }, g);
      S('rect', { x: 260, y: 20, width: 34, height: 194, fill: f('beton'), style: st }, g);
      S('rect', { x: 426, y: 20, width: 34, height: 194, fill: f('beton'), style: st }, g);
      S('ellipse', { cx: 360, cy: 20, rx: 100, ry: 12, fill: 'none', style: 'stroke:var(--ink-2);stroke-dasharray:4 3' }, g);
      dimLine(g, 150, 294, 570, 294, 'D – kör alaprajzú tömb', { dy: 18 });
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
      S('rect', { x: 220, y: 215, width: 280, height: 85, fill: f('beton'), style: st }, g);
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
      // az ágyazat mindkét oldalon 50–60 cm-rel túlnyúlik a lemez szélén (a rajzon ~1 px/cm)
      S('rect', { x: 4, y: y + 26, width: 712, height: 58, fill: f('kavics'), style: 'stroke:var(--ink-3)' }, g);
      dimLine(g, 660, y + 96, 716, y + 96, '50–60 cm', { dy: 16 });
      S('text', { x: 670, y: y + 60, class: 't-s', 'text-anchor': 'end', style: 'fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px', text: 'tömörített szemcsés ágyazat ≥ 50–60 cm' }, g);
      S('line', { x1: 0, y1: y + 130, x2: 720, y2: y + 130, style: 'stroke:var(--frost);stroke-width:2;stroke-dasharray:8 5' }, g);
      S('text', { x: 10, y: y + 124, class: 't-s', style: 'fill:var(--frost)', text: 'fagyhatár – a lemez alsó síkja felette maradhat' }, g);
      S('line', { x1: 0, y1: y, x2: 60, y2: y, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
      S('line', { x1: 660, y1: y, x2: 720, y2: y, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    }
    const py = v === 'terszini' ? y : y;
    if (v === 'alul' || v === 'gomba') {
      // a bordák / gombafejek a lemezzel együtt, egyben betonozva: egyetlen körvonal
      let d = `M60 ${py} H660 V${py + t}`;
      [570, 360, 150].forEach(x => {
        d += v === 'alul' ? ` H${x + 22} V${py + t + 44} H${x - 22} V${py + t}` : ` H${x + 70} L${x + 40} ${py + t + 30} H${x - 40} L${x - 70} ${py + t}`;
      });
      S('path', { d: d + ' H60 Z', fill: f('beton'), style: st }, g);
    } else S('rect', { x: 60, y: py, width: 600, height: t, fill: f('beton'), style: st }, g);
    [150, 360, 570].forEach(x => {
      if (v === 'felul') S('rect', { x: x - 34, y: py - 28, width: 68, height: 28, fill: f('beton'), style: st }, g);
      if (v === 'rejtett') { for (let k = -2; k <= 2; k++) S('circle', { cx: x + k * 9, cy: py + t - 10, r: 3.2, fill: red }, g); S('rect', { x: x - 26, y: py + 4, width: 52, height: t - 8, fill: 'none', style: 'stroke:#a3341f;stroke-dasharray:3 3' }, g); }
      const top = v === 'felul' ? py - 28 : py;
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
    if (!kind.plan) {
      S('rect', { x: 0, y: 120, width: 280, height: 60, fill: f(kind.soil || 'homok'), opacity: .6 }, g);
      S('line', { x1: 0, y1: 120, x2: 280, y2: 120, stroke: '#3d5a1f', 'stroke-width': 3 }, g);
    }
    if (kind.gw) { S('line', { x1: 0, y1: 120 + kind.gw, x2: 280, y2: 120 + kind.gw, style: 'stroke:var(--water);stroke-width:2' }, g); S('path', { d: `M240 ${112 + kind.gw} h12 l-6 8z`, style: 'fill:var(--water)' }, g); }
    const st = 'fill:var(--card);stroke:var(--ink-2);stroke-width:1.5';
    const b = kind.b;
    if (b === 'haz') { S('rect', { x: 80, y: 70, width: 120, height: 50, style: st }, g); S('path', { d: 'M70 70 L140 30 L210 70Z', style: 'fill:var(--c2);opacity:.8' }, g); }
    if (b === 'csarnok') { S('path', { d: 'M30 120 V70 L140 50 L250 70 V120', style: st }, g); for (let i = 0; i < 5; i++) S('line', { x1: 40 + i * 50, y1: 120, x2: 40 + i * 50, y2: 66, style: 'stroke:var(--ink-2);stroke-width:4' }, g); }
    if (b === 'pillersor') { S('rect', { x: 30, y: 60, width: 220, height: 8, style: st }, g); for (let i = 0; i < 5; i++) S('line', { x1: 40 + i * 50, y1: 120, x2: 40 + i * 50, y2: 68, style: 'stroke:var(--ink-2);stroke-width:5' }, g); }
    if (b === 'raszter') {
      // négyzetrácsos pillérraszter felülnézetben: tengelyek és pillérek a csomópontokban
      const xs = [65, 115, 165, 215], ys = [45, 95, 145];
      xs.forEach(x => S('line', { x1: x, y1: 30, x2: x, y2: 160, style: 'stroke:var(--ink-3);stroke-dasharray:6 3 1 3' }, g));
      ys.forEach(y => S('line', { x1: 50, y1: y, x2: 230, y2: y, style: 'stroke:var(--ink-3);stroke-dasharray:6 3 1 3' }, g));
      xs.forEach(x => ys.forEach(y => S('rect', { x: x - 6, y: y - 6, width: 12, height: 12, style: 'fill:var(--ink-2)' }, g)));
      S('text', { x: 140, y: 18, 'text-anchor': 'middle', class: 't-s', text: 'pillérraszter felülnézetben' }, g);
    }
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
      { sit: 'Négyzetrácsos pillérraszter, ahol mindkét irányban csökkenteni kell a süllyedéskülönbségeket, de a teljes alapterületre még nincs szükség.', pic: icon({ b: 'raszter', plan: true }), a: 3, e: 'Egymást metsző szalagalapok: gerendarács-alap.' },
      { sit: '10 szintes, teljesen alápincézett lakóház; a mértékadó talajvízszint a pincepadló felett van, a különálló alapok majdnem összeérnének.', pic: icon({ b: 'lakohaz', soil: 'homok', gw: 18, t: 'magas talajvíz' }), a: 4, e: 'A terhet a teljes alapterületen kell átadni, a magas talajvíz miatt pedig vízzáró vasbeton lemez („ellenfödém”) kell: lemezalap.' },
      { sit: 'Házgyári elemekből épülő panelház, amely csak nagyon kis alakváltozást tud károsodás nélkül elviselni.', pic: icon({ b: 'panel', soil: 'homok', t: 'kis alakváltozást tűr' }), a: 5, e: 'Az alaplemez, a pincefalak és a födém együttdolgozó szekrénytartója, a dobozalap adja a szükséges merevséget.' },
      { sit: 'Víztorony zárt, kör alaprajzzal; a teljes teher egyetlen koncentrált tömbön jut az altalajra.', pic: icon({ b: 'torony', soil: 'kavics', t: 'kör alaprajz' }), a: 6, e: 'A zárt alaprajzú építmények egyetlen tömbként kialakított, rendszerint kör alaprajzú alaptestei lényegében nagyméretű pilléralapok.' },
      { sit: 'Kétszintes épület gyenge, de nem szerves felszíni talajon, magas talajvízzel; a feltöltést részben eltávolítják, és tömörített szemcsés ágyazatot építenek.', pic: icon({ b: 'kicsi', soil: 'agyag', gw: 14, t: 'magas talajvíz, gyenge felszín' }), a: 4, e: 'Térszíni lemezalap: a vasalt lemez min. 50–60 cm vastag tömörített szemcsés ágyazatra kerül, alsó síkja a fagyhatár felett maradhat.' }
    ]
  });
});
onReady(() => renderQuiz($('#quiz2'), QUIZ.q2));
