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
  function axes(ctx, w, h, m, xl, yl) {
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, h - m.b); ctx.lineTo(w - m.r, h - m.b); ctx.stroke();
    ctx.fillStyle = cssv('--ink-2'); ctx.font = '500 12px "IBM Plex Sans", sans-serif';
    ctx.fillText(xl, w - m.r - ctx.measureText(xl).width, h - m.b + 26);
    ctx.save(); ctx.translate(14, m.t + 4); ctx.fillText(yl, 0, 0); ctx.restore();
  }
  function drawCurve(g, st) {
    const cv = $('#tmCurve'), ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    const m = { l: 44, r: 12, t: 24, b: 40 };
    // tengelyek: x = q/q_t (0..1,15), y = s/B lefelé (0..0,25)
    const X = q => m.l + q / 1.15 * (w - m.l - m.r), Y = s => m.t + s / 0.25 * (h - m.t - m.b);
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(w - m.r, m.t); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, h - m.b); ctx.stroke();
    ctx.fillStyle = cssv('--ink-2'); ctx.font = '500 11px "IBM Plex Mono", monospace';
    for (let q = 0; q <= 1.01; q += 0.25) { ctx.fillText(fmt(q, 2), X(q) - 12, m.t - 8); }
    for (let s = 0.05; s <= 0.251; s += 0.05) { ctx.fillText(fmt(s, 2), 6, Y(s) + 4); ctx.strokeStyle = cssv('--line-2'); ctx.beginPath(); ctx.moveTo(m.l, Y(s)); ctx.lineTo(w - m.r, Y(s)); ctx.stroke(); }
    ctx.font = '600 12px "IBM Plex Sans", sans-serif'; ctx.fillStyle = cssv('--ink-2');
    ctx.fillText('teher / törőteher →', w - m.r - 120, h - 12);
    ctx.save(); ctx.translate(m.l + 6, h - m.b - 6); ctx.fillText('↓ süllyedés s/B', 0, 0); ctx.restore();
    const COL = { alt: cssv('--ok'), helyi: cssv('--warn'), beny: cssv('--bad') };
    for (const md of ['alt', 'helyi', 'beny']) {
      ctx.beginPath();
      const S = TORO.SMAX[md];
      for (let i = 0; i <= 120; i++) { const s = S * i / 120, q = TORO.qOf(md, s); i ? ctx.lineTo(X(q), Y(s)) : ctx.moveTo(X(q), Y(s)); }
      ctx.strokeStyle = COL[md]; ctx.lineWidth = md === g.mode ? 3.2 : 1.2; ctx.globalAlpha = md === g.mode ? 1 : 0.45; ctx.stroke(); ctx.globalAlpha = 1;
      const fs = TORO.FAIL[md];
      if (md === g.mode) { ctx.setLineDash([4, 4]); ctx.strokeStyle = COL[md]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(m.l, Y(fs)); ctx.lineTo(X(TORO.qOf(md, fs)), Y(fs)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = COL[md]; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.fillText(`${fmt(fs, 2)}B`, m.l + 4, Y(fs) - 4); }
    }
    ctx.fillStyle = cssv('--ink'); ctx.beginPath(); ctx.arc(X(st.q), Y(st.s), 6, 0, 7); ctx.fill();
    ctx.strokeStyle = cssv('--card'); ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '600 11px "IBM Plex Sans", sans-serif';
    [['általános', 'alt'], ['helyi', 'helyi'], ['benyomódás', 'beny']].forEach(([t, k], i) => { ctx.fillStyle = COL[k]; ctx.fillRect(w - m.r - 96, h - m.b - 52 + i * 16, 10, 10); ctx.fillStyle = cssv('--ink-2'); ctx.fillText(t, w - m.r - 82, h - m.b - 43 + i * 16); });
  }
  function drawVesic() {
    const cv = $('#tmVesic'), ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    const m = { l: 44, r: 14, t: 26, b: 40 };
    const X = t => m.l + t * (w - m.l - m.r), Y = d => m.t + d / 5 * (h - m.t - m.b);
    const fill = (fn0, fn1, col) => { ctx.beginPath(); for (let i = 0; i <= 60; i++) { const d = 5 * i / 60; ctx.lineTo(X(Math.min(1, fn0(d))), Y(d)); } for (let i = 60; i >= 0; i--) { const d = 5 * i / 60; ctx.lineTo(X(Math.min(1, fn1(d))), Y(d)); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
    ctx.globalAlpha = 0.28;
    fill(() => 0, TORO.lpB, cssv('--bad'));
    fill(TORO.lpB, TORO.glB, cssv('--warn'));
    fill(TORO.glB, () => 1, cssv('--ok'));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1; ctx.strokeRect(m.l, m.t, w - m.l - m.r, h - m.t - m.b);
    ctx.fillStyle = cssv('--ink-2'); ctx.font = '500 11px "IBM Plex Mono", monospace';
    for (let t = 0; t <= 1.001; t += 0.2) ctx.fillText(fmt(t, 1), X(t) - 9, m.t - 8);
    for (let d = 1; d <= 5; d++) ctx.fillText(String(d), m.l - 14, Y(d) + 4);
    ctx.font = '600 12px "IBM Plex Sans", sans-serif';
    ctx.fillText('relatív tömörség →', w - m.r - 120, h - 12);
    ctx.save(); ctx.translate(12, h - m.b - 8); ctx.rotate(-Math.PI / 2); ctx.fillText('D/B* ↓', 0, 0); ctx.restore();
    ctx.font = '700 12px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = cssv('--ok'); ctx.fillText('általános', X(0.8), Y(0.35));
    ctx.fillStyle = cssv('--warn'); ctx.fillText('helyi', X(0.52), Y(1.0));
    ctx.fillStyle = cssv('--bad'); ctx.fillText('benyomódás', X(0.12), Y(3.4));
    const dBs = P.dB * TORO.Bof(P) / TORO.Bstar(P);
    if (P.soil === 'sz' && P.shape !== 'lemez') {
      ctx.fillStyle = cssv('--ink'); ctx.beginPath(); ctx.arc(X(P.tre), Y(Math.min(5, dBs)), 7, 0, 7); ctx.fill(); ctx.strokeStyle = cssv('--card'); ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = cssv('--ink-2'); ctx.font = '500 12px "IBM Plex Sans", sans-serif';
      ctx.fillText(P.shape === 'lemez' ? 'nagy lemez: a szélek alatt helyi törés' : 'kötött talaj: a konzisztencia dönt', m.l + 8, h - m.b - 10);
    }
  }
  function drawTime(st) {
    const cv = $('#tmTime'), ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    const m = { l: 40, r: 14, t: 26, b: 34 };
    const X = t => m.l + t * (w - m.l - m.r), Y = s => m.t + s * (h - m.t - m.b);
    ctx.strokeStyle = cssv('--ink-3'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(w - m.r, m.t); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, h - m.b); ctx.stroke();
    ctx.fillStyle = cssv('--ink-2'); ctx.font = '600 12px "IBM Plex Sans", sans-serif';
    ctx.fillText('idő →', w - m.r - 40, m.t - 8);
    ctx.save(); ctx.translate(m.l + 6, h - m.b + 22); ctx.fillText('↓ süllyedés', 0, 0); ctx.restore();
    const C = [
      [t => 0.22 * (1 - Math.exp(-t * 9)), 'I. σ₁: ds/dt = 0', cssv('--ok'), 1],
      [t => 0.08 + 0.36 * t + 0.12 * (1 - Math.exp(-t * 8)), 'II. σ₂: ds/dt = áll.', cssv('--warn'), 2],
      [t => 0.12 + 0.2 * t + 1.2 * Math.pow(t, 3.2), 'III. σ_t: ds/dt → ∞', cssv('--bad'), 3]
    ];
    C.forEach(([fn, lab, col, ph]) => {
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const t = i / 100, s = Math.min(1, fn(t)); i ? ctx.lineTo(X(t), Y(s)) : ctx.moveTo(X(t), Y(s)); if (s >= 1) break; }
      ctx.strokeStyle = col; ctx.lineWidth = st.ph === ph ? 3.4 : 1.3; ctx.globalAlpha = st.ph === ph ? 1 : 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      const ly = Y(Math.min(0.95, fn(0.62))) - 6;
      ctx.fillStyle = col; ctx.font = (st.ph === ph ? '700 ' : '500 ') + '11px "IBM Plex Sans", sans-serif';
      ctx.fillText(lab, X(0.64), ly);
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
  window.addEventListener('resize', () => { if (view === '2d') draw2(); });
  window.addEventListener('themechange', outputs);
  outputs();
});
onReady(() => renderQuiz($('#quiz6'), QUIZ.q6));
