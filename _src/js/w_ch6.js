/* ===== 06 – Törésimechanizmus-labor: vezérlés, 2D nézet, diagramok ===== */
onReady(function toroUI() {
  const P = TORO.P;
  const cv2 = $('#toro2d'), wrap2 = $('#toro2dWrap'), wrap3 = $('#toro3d');
  let view = '3d', playing = false, raf = null;
  const NAME = { alt: 'általános nyírási törés', helyi: 'helyi nyírási törés', beny: 'benyomódás (befúródás)' };
  const PH = ['', 'I. rugalmas tartomány', 'II. átmeneti tartomány', 'III. képlékeny tartomány – törés'];
  function emit(rebuild) { window.dispatchEvent(new CustomEvent('toro', { detail: { rebuild } })); }
  function outputs() {
    $('#tmTreO').textContent = fmt(P.tre, 2);
    $('#tmIcO').textContent = fmt(P.ic, 2);
    $('#tmPhiO').textContent = fmt(TORO.phiOf(P), 1) + '°';
    $('#tmBO').textContent = P.shape === 'lemez' ? '12 m (lemez)' : fmt(P.B, 2) + ' m';
    const g = TORO.geom(P);
    const dBs = P.dB * TORO.Bof(P) / TORO.Bstar(P);
    $('#tmDO').textContent = `${fmt(P.dB, 2)} · D/B* = ${fmt(dBs, 2)}`;
    $('#tmPhi').disabled = P.link && P.soil === 'sz';
    $('#tmB').disabled = P.shape === 'lemez';
    $('#tmTreW').style.display = P.soil === 'sz' ? '' : 'none';
    $('#tmIcW').style.display = P.soil === 'k' ? '' : 'none';
    const M = TORO.mode(P);
    const mo = $('#tmModeOut');
    mo.className = 'verdict ' + (M.m === 'alt' ? 'ok' : M.m === 'helyi' ? 'warn' : 'bad');
    mo.innerHTML = `<span>Várható: <b style="font-family:var(--f-body)">${NAME[M.m]}</b></span>`;
    let why = M.why;
    if (M.auto && M.auto.m !== M.m) why += ` A talajból egyébként ${NAME[M.auto.m]} következne.`;
    const sm = $('#tmModeWhy') || H('p', { id: 'tmModeWhy', cls: 'small just', style: 'margin:0' }, mo.parentNode);
    mo.after(sm);
    sm.innerHTML = why;
    const st = TORO.state(P, g);
    const pv = $('#tmPhase');
    pv.className = 'verdict ' + (st.ph === 1 ? 'ok' : st.ph === 2 ? 'warn' : 'bad');
    pv.textContent = PH[st.ph];
    $('#tmLoadO').innerHTML = `q/q<sub>t</sub> = ${fmt(st.q, 2)} · s/B = ${fmt(st.s, 3)}`;
    drawCurve(g, st); drawVesic(); drawTime(st);
    if (view === '2d') draw2();
  }
  function draw2() {
    const r = wrap2.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(320, Math.round(r.width)), h = Math.max(240, Math.round(r.height));
    if (cv2.width !== w * dpr || cv2.height !== h * dpr) { cv2.width = w * dpr; cv2.height = h * dpr; cv2.style.width = w + 'px'; cv2.style.height = h + 'px'; }
    // a 2D nézetben a világ-arányt megtartjuk: középre illesztett rajz
    const g = TORO.geom(P);
    let x0 = -g.W, x1 = g.W;
    if (g.mode === 'alt' && g.shape !== 'lemez') { x1 = g.extent * 1.06; x0 = -Math.max(g.B * 1.6, g.extent * 0.42); }
    else if (g.mode === 'helyi' && g.shape !== 'lemez') { x1 = g.extent * 0.86; x0 = -x1; }
    const aspect = (x1 - x0) / (g.Hd + g.Ht);
    const off = document.createElement('canvas');
    let ow = cv2.width, oh = Math.round(ow / aspect);
    const maxH = Math.round(560 * dpr);
    if (oh > maxH) { oh = maxH; ow = Math.round(oh * aspect); }
    off.width = ow; off.height = oh;
    TORO.draw2D(off, P, { dark: isDark(), bg: false, x0, x1 });
    const want = Math.max(240, Math.round(oh / dpr) + 16);
    if (Math.abs(r.height - want) > 4) { wrap2.style.height = want + 'px'; requestAnimationFrame(draw2); return; }
    const ctx = cv2.getContext('2d');
    ctx.clearRect(0, 0, cv2.width, cv2.height);
    ctx.fillStyle = cssv('--card'); ctx.fillRect(0, 0, cv2.width, cv2.height);
    ctx.drawImage(off, (cv2.width - ow) / 2, (cv2.height - oh) / 2);
  }
  // ---- diagramok ----
  // éles rajz bármilyen képernyőn: a vászon a megjelenített méretéhez és a képpontsűrűséghez igazodik,
  // a rajz CSS-képpontban készül (a betűméret így nem zsugorodik össze keskeny oszlopban sem)
  function prep(cv) {
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = Math.max(240, Math.round(cv.clientWidth || cv.parentNode.clientWidth || 360)), h = Math.round(Math.min(330, Math.max(250, w * 0.74)));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }
  const F = (wgt, px, mono) => `${wgt} ${px}px ${mono ? '"IBM Plex Mono", monospace' : '"IBM Plex Sans", sans-serif'}`;
  // szöveg valódi alsó indexszel: a „σ_t”, „q_{t}” jelölést rajzolja; align: 'l' | 'r' | 'c'
  function subText(ctx, str, x, y, align) {
    const parts = []; const re = /_(\{[^}]*\}|[A-Za-z0-9])/g; let last = 0, mm;
    while ((mm = re.exec(str))) { if (mm.index > last) parts.push([str.slice(last, mm.index), 0]); parts.push([mm[1].replace(/[{}]/g, ''), 1]); last = re.lastIndex; }
    if (last < str.length) parts.push([str.slice(last), 0]);
    const base = ctx.font, px = parseFloat((base.match(/([\d.]+)px/) || [0, 12])[1]), small = base.replace(/[\d.]+px/, (px * 0.72).toFixed(1) + 'px');
    let tw = 0; parts.forEach(q => { ctx.font = q[1] ? small : base; q[2] = ctx.measureText(q[0]).width; tw += q[2]; });
    let cx = align === 'r' ? x - tw : align === 'c' ? x - tw / 2 : x;
    parts.forEach(q => { ctx.font = q[1] ? small : base; ctx.fillText(q[0], cx, y + (q[1] ? px * 0.28 : 0)); cx += q[2]; });
    ctx.font = base; return tw;
  }
  // felirat világos udvarral, hogy vonalon vagy színes mezőn is olvasható legyen
  function halo(ctx, str, x, y, col, align) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = cssv('--card');
    const tw = ctx.measureText(str.replace(/_\{?([^}]*)\}?/g, '$1')).width;
    const x0 = align === 'r' ? x - tw : align === 'c' ? x - tw / 2 : x;
    if (!/_/.test(str)) ctx.strokeText(str, x0, y); else { ctx.globalAlpha = 0.9; ctx.fillStyle = cssv('--card'); ctx.fillRect(x0 - 3, y - 11, tw + 6, 15); ctx.globalAlpha = 1; }
    ctx.fillStyle = col; subText(ctx, str, x, y, align); ctx.restore();
  }
  function drawCurve(g, st) {
    const { ctx, w, h } = prep($('#tmCurve'));
    const m = { l: 46, r: 14, t: 30, b: 34 };
    // tengelyek: x = q/q_t (0..1,15), y = s/B lefelé (0..0,25)
    const X = q => m.l + q / 1.15 * (w - m.l - m.r), Y = s => m.t + s / 0.25 * (h - m.t - m.b);
    ctx.font = F(500, 11, 1);
    for (let s = 0.05; s <= 0.251; s += 0.05) { ctx.fillStyle = cssv('--ink-2'); ctx.fillText(fmt(s, 2), 8, Y(s) + 4); ctx.strokeStyle = cssv('--line-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(m.l, Y(s)); ctx.lineTo(w - m.r, Y(s)); ctx.stroke(); }
    ctx.fillStyle = cssv('--ink-2');
    for (let q = 0; q <= 1.01; q += 0.25) { const t = fmt(q, 2); ctx.fillText(t, X(q) - ctx.measureText(t).width / 2, m.t - 9); }
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w - m.r, m.t); ctx.lineTo(m.l, m.t); ctx.lineTo(m.l, h - m.b); ctx.stroke();
    ctx.font = F(600, 12); ctx.fillStyle = cssv('--ink-2');
    subText(ctx, 'teher / törőteher, q/q_t →', w - m.r, h - 10, 'r');
    ctx.fillText('↓ süllyedés, s/B', m.l + 8, h - m.b - 8);
    const COL = { alt: cssv('--ok'), helyi: cssv('--warn'), beny: cssv('--bad') };
    for (const md of ['alt', 'helyi', 'beny']) {
      ctx.beginPath();
      const S = TORO.SMAX[md];
      for (let i = 0; i <= 120; i++) { const s = S * i / 120, q = TORO.qOf(md, s); i ? ctx.lineTo(X(q), Y(s)) : ctx.moveTo(X(q), Y(s)); }
      ctx.strokeStyle = COL[md]; ctx.lineJoin = 'round'; ctx.lineWidth = md === g.mode ? 3.4 : 1.4; ctx.globalAlpha = md === g.mode ? 1 : 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      const fs = TORO.FAIL[md];
      if (md === g.mode) { ctx.setLineDash([4, 4]); ctx.strokeStyle = COL[md]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.l, Y(fs)); ctx.lineTo(X(TORO.qOf(md, fs)), Y(fs)); ctx.stroke(); ctx.setLineDash([]); ctx.font = F(600, 11, 1); if (fs < 0.08) halo(ctx, `${fmt(fs, 2)}·B`, m.l + 6, Y(fs) + 14, COL[md]); else halo(ctx, `${fmt(fs, 2)}·B`, X(TORO.qOf(md, fs)) - 12, Y(fs) - 6, COL[md], 'r'); }
    }
    // jelmagyarázat a görbék alatti szabad sarokban
    ctx.font = F(600, 11.5);
    [['általános', 'alt'], ['helyi', 'helyi'], ['benyomódás', 'beny']].forEach(([t, k], i) => { const y = Y(0.125) + i * 17; ctx.fillStyle = COL[k]; ctx.fillRect(m.l + 10, y - 9, 16, 5); ctx.fillStyle = k === g.mode ? cssv('--ink') : cssv('--ink-2'); ctx.fillText(t, m.l + 32, y - 2); });
    ctx.fillStyle = cssv('--ink'); ctx.beginPath(); ctx.arc(X(st.q), Y(st.s), 6.5, 0, 7); ctx.fill();
    ctx.strokeStyle = cssv('--card'); ctx.lineWidth = 2.2; ctx.stroke();
  }
  function drawVesic() {
    const { ctx, w, h } = prep($('#tmVesic'));
    const m = { l: 46, r: 14, t: 30, b: 34 };
    const X = t => m.l + t * (w - m.l - m.r), Y = d => m.t + d / 5 * (h - m.t - m.b);
    const fill = (fn0, fn1, col) => { ctx.beginPath(); for (let i = 0; i <= 60; i++) { const d = 5 * i / 60; ctx.lineTo(X(Math.min(1, fn0(d))), Y(d)); } for (let i = 60; i >= 0; i--) { const d = 5 * i / 60; ctx.lineTo(X(Math.min(1, fn1(d))), Y(d)); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
    ctx.globalAlpha = 0.3;
    fill(() => 0, TORO.lpB, cssv('--bad'));
    fill(TORO.lpB, TORO.glB, cssv('--warn'));
    fill(TORO.glB, () => 1, cssv('--ok'));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1.2; ctx.strokeRect(m.l, m.t, w - m.l - m.r, h - m.t - m.b);
    ctx.fillStyle = cssv('--ink-2'); ctx.font = F(500, 11, 1);
    for (let t = 0; t <= 1.001; t += 0.2) { const s = fmt(t, 1); ctx.fillText(s, X(t) - ctx.measureText(s).width / 2, m.t - 9); }
    for (let d = 1; d <= 5; d++) ctx.fillText(String(d), m.l - 16, Y(d) + 4);
    ctx.font = F(600, 12);
    subText(ctx, 'relatív tömörség, T_{re} →', w - m.r, h - 10, 'r');
    ctx.save(); ctx.translate(15, h - m.b - 4); ctx.rotate(-Math.PI / 2); ctx.fillText('← relatív mélység, D/B*', 0, 0); ctx.restore();
    // a mezők nevei a mezők belsejében, a ponttól távol
    ctx.font = F(700, 12);
    const mid = (f0, f1, d) => (Math.min(1, f0(d)) + Math.min(1, f1(d))) / 2;
    halo(ctx, 'általános', X(Math.max(0.8, mid(TORO.glB, () => 1, 0.9))), Y(0.9) + 4, cssv('--ok'), 'c');
    halo(ctx, 'helyi', X(mid(TORO.lpB, TORO.glB, 2.1)), Y(2.1) + 4, cssv('--warn'), 'c');
    halo(ctx, 'benyomódás', X(mid(() => 0, TORO.lpB, 3.6)), Y(3.6) + 4, cssv('--bad'), 'c');
    const dBs = P.dB * TORO.Bof(P) / TORO.Bstar(P);
    if (P.soil === 'sz' && P.shape !== 'lemez') {
      const px = X(P.tre), py = Y(Math.min(5, dBs));
      ctx.strokeStyle = cssv('--ink'); ctx.globalAlpha = 0.35; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, m.t); ctx.lineTo(px, py); ctx.moveTo(m.l, py); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = cssv('--ink'); ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill(); ctx.strokeStyle = cssv('--card'); ctx.lineWidth = 2.2; ctx.stroke();
    } else {
      ctx.font = F(600, 12);
      halo(ctx, P.shape === 'lemez' ? 'nagy lemez: a szélek alatt helyi törés' : 'kötött talaj: a konzisztencia dönt', m.l + 10, h - m.b - 12, cssv('--ink'));
    }
  }
  function drawTime(st) {
    const { ctx, w, h } = prep($('#tmTime'));
    const m = { l: 30, r: 14, t: 30, b: 34 };
    const X = t => m.l + t * (w - m.l - m.r), Y = s => m.t + s * (h - m.t - m.b);
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w - m.r, m.t); ctx.lineTo(m.l, m.t); ctx.lineTo(m.l, h - m.b); ctx.stroke();
    ctx.fillStyle = cssv('--ink-2'); ctx.font = F(600, 12);
    ctx.fillText('idő →', w - m.r - ctx.measureText('idő →').width, m.t - 9);
    ctx.fillText('↓ süllyedés', m.l + 8, h - 10);
    // a felirat helye görbénként: [idő, a görbe fölött (−1) vagy alatt (+1), igazítás]
    const C = [
      [t => 0.22 * (1 - Math.exp(-t * 9)), 'I. σ_1: ds/dt = 0', cssv('--ok'), 1, 0.99, -1, 'r'],
      [t => 0.08 + 0.36 * t + 0.12 * (1 - Math.exp(-t * 8)), 'II. σ_2: ds/dt = áll.', cssv('--warn'), 2, 0.99, -1, 'r'],
      [t => 0.12 + 0.2 * t + 1.2 * Math.pow(t, 3.2), 'III. σ_t: ds/dt → ∞', cssv('--bad'), 3, 0.74, 1, 'r']
    ];
    C.forEach(([fn, lab, col, ph]) => {
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const t = i / 100, s = Math.min(1, fn(t)); i ? ctx.lineTo(X(t), Y(s)) : ctx.moveTo(X(t), Y(s)); if (s >= 1) break; }
      ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineWidth = st.ph === ph ? 3.4 : 1.4; ctx.globalAlpha = st.ph === ph ? 1 : 0.55; ctx.stroke(); ctx.globalAlpha = 1;
    });
    C.forEach(([fn, lab, col, ph, tl, side, al]) => {
      ctx.font = F(st.ph === ph ? 700 : 600, 11.5);
      const yy = side < 0 ? Y(Math.min(0.95, fn(tl - 0.3))) - 9 : Y(0.93);
      halo(ctx, lab, X(tl), yy, col, al);
    });
  }
  // ---- vezérlés ----
  bindSeg($('#tmMode'), v => { P.modeSel = v; outputs(); emit(true); });
  bindSeg($('#tmView'), v => { view = v; wrap3.style.display = v === '3d' ? '' : 'none'; wrap2.style.display = v === '2d' ? '' : 'none'; outputs(); });
  bindSeg($('#tmSoil'), v => { P.soil = v; outputs(); emit(true); });
  $('#tmShape').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#tmShape button').forEach(x => x.classList.toggle('on', x === b)); P.shape = b.dataset.v; outputs(); emit(true); });
  const num = (id, k) => $('#' + id).addEventListener('input', e => { P[k] = +e.target.value; outputs(); emit(true); });
  num('tmTre', 'tre'); num('tmIc', 'ic'); num('tmPhi', 'phi'); num('tmB', 'B'); num('tmD', 'dB');
  $('#tmLink').addEventListener('change', e => { P.link = e.target.checked; if (!P.link) { P.phi = TORO.phiOf(Object.assign({}, P, { link: true })); $('#tmPhi').value = P.phi; rangeFill($('#tmPhi')); } outputs(); emit(true); });
  $('#tmLoad').addEventListener('input', e => { P.lam = +e.target.value; stop(); outputs(); emit(false); });
  function stop() { playing = false; cancelAnimationFrame(raf); $('#tmPlay').textContent = '▶ Terhelés'; }
  $('#tmPlay').addEventListener('click', () => {
    if (playing) { stop(); return; }
    playing = true; $('#tmPlay').textContent = '❚❚ Szünet';
    if (P.lam >= 0.999) P.lam = 0;
    let last = performance.now();
    const step = now => {
      if (!playing) return;
      P.lam = Math.min(1, P.lam + (now - last) / 7000); last = now;
      $('#tmLoad').value = P.lam; rangeFill($('#tmLoad'));
      outputs(); emit(false);
      if (P.lam >= 1) { stop(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
  $('#tmReset').addEventListener('click', () => { stop(); P.lam = 0; $('#tmLoad').value = 0; rangeFill($('#tmLoad')); outputs(); emit(false); });
  $('#tmLeg').innerHTML = '<span><i style="background:rgba(134,181,28,.6)"></i>aktív ék</span><span><i style="background:rgba(230,140,40,.6)"></i>radiális zóna</span><span><i style="background:rgba(214,72,140,.5)"></i>passzív ék</span><span><i style="background:rgba(200,110,20,.5)"></i>plasztikus zóna</span><span><i style="background:#d23f2a"></i>csúszólap</span>';
  let rzT; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(outputs, 120); });
  window.addEventListener('themechange', outputs);
  outputs();
});
onReady(() => renderQuiz($('#quiz6'), QUIZ.q6));
