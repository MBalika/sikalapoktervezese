/* ===== Törési mechanizmusok: geometria, állapot, 2D rajz (a 3D is ezt használja) ===== */
const TORO = (() => {
  const P = { modeSel: 'auto', soil: 'sz', tre: 0.8, ic: 1.1, phi: 36, link: true, shape: 'sav', B: 2, dB: 0.5, lam: 0 };
  const rad = d => d * Math.PI / 180;
  function phiFromTre(t) { return 26 + 12 * t; }
  function Bstar(p) { return p.shape === 'sav' ? 2 * Bof(p) : Bof(p); }
  function Bof(p) { return p.shape === 'lemez' ? 12 : p.B; }
  // Vesić-térkép (sematikus) határai
  const glB = d => Math.min(1.01, 0.70 + 0.30 * Math.pow(Math.max(0, d) / 2.2, 0.8));
  const lpB = d => Math.min(1.01, 0.35 + 0.65 * Math.pow(Math.max(0, d) / 4.8, 0.9));
  function autoMode(p) {
    const dBs = p.dB * Bof(p) / Bstar(p);
    if (p.shape === 'lemez') {
      if (p.soil === 'k' ? p.ic < 0.75 : p.tre < lpB(dBs)) return { m: 'beny', why: 'Nagy lemez laza vagy puha talajon: a térszín süppedése, benyomódás.' };
      return { m: 'helyi', why: 'Nagy vasbeton lemez alatt mély csúszólap nem tud kialakulni – a dm-es süllyedések előbb tönkreteszik az építményt –, ezért a szélek alatt helyi nyírási törés várható.' };
    }
    if (p.soil === 'k') {
      let m = p.ic >= 1.0 ? 'alt' : p.ic >= 0.75 ? 'helyi' : 'beny';
      if (p.dB > 2 && m === 'alt') m = 'helyi'; else if (p.dB > 2.5 && m === 'helyi') m = 'beny';
      const nm = { alt: 'kemény, merev kötött talaj', helyi: 'közepesen merev kötött talaj', beny: 'puha kötött talaj' }[m];
      return { m, why: `I<sub>c</sub> = ${fmt(p.ic, 2)}: ${nm} (szemléltető besorolás).` };
    }
    if (p.tre >= glB(dBs)) return { m: 'alt', why: `T<sub>re</sub> = ${fmt(p.tre, 2)} és D/B* = ${fmt(dBs, 2)}: tömör szemcsés talaj, sekély alap.` };
    if (p.tre >= lpB(dBs)) return { m: 'helyi', why: `T<sub>re</sub> = ${fmt(p.tre, 2)} és D/B* = ${fmt(dBs, 2)}: közepesen tömör talaj, vagy a mélység miatt nem fejlődik ki teljesen a csúszólap.` };
    return { m: 'beny', why: `T<sub>re</sub> = ${fmt(p.tre, 2)} és D/B* = ${fmt(dBs, 2)}: laza talaj vagy nagy relatív mélység – benyomódás.` };
  }
  function mode(p) { const a = autoMode(p); return p.modeSel === 'auto' ? a : { m: p.modeSel, why: 'Kézzel választott mechanizmus.', auto: a }; }
  function phiOf(p) { return p.link && p.soil === 'sz' ? phiFromTre(p.tre) : p.phi; }

  // Prandtl-mechanizmus jobb oldala (alapsík-koordináták: x a középtől, y felfelé, y=0 az alapsík)
  function prandtl(b, phiDeg, D, x0 = 0) {
    const phi = rad(Math.max(phiDeg, 1));
    const a = Math.PI / 4 + phi / 2, tp = Math.tan(phi);
    const r0 = b / Math.cos(a);
    const th0 = -(Math.PI - a);
    const apex = [x0, -b * Math.tan(a)];
    const sp = [];
    for (let i = 0; i <= 40; i++) {
      const th = th0 + (Math.PI / 2) * i / 40, r = r0 * Math.exp((th - th0) * tp);
      sp.push([x0 + b + r * Math.cos(th), r * Math.sin(th)]);
    }
    const E = sp[sp.length - 1];
    const beta = Math.PI / 4 - phi / 2;
    const F = [E[0] + (-E[1]) / Math.tan(beta), 0];
    const G = [F[0] + D / Math.tan(beta), D];
    const minY = Math.min(...sp.map(q => q[1]), apex[1]);
    return { apex, sp, E, F, G, beta, minY, edge: [x0 + b, 0] };
  }
  function geom(p) {
    const B = Bof(p), b = B / 2, D = p.dB * B * (p.shape === 'lemez' ? 0.15 : 1);
    const phi = phiOf(p), md = mode(p).m;
    const g = { B, b, D, phi, mode: md, shape: p.shape };
    if (p.shape === 'lemez') {
      const bl = 1.1;
      g.local = [prandtl(bl, phi, D, b - bl), null];
      const R = g.local[0];
      g.extent = R.G[0] + 1.5;
      g.depth = Math.max(-R.minY, 2.5) + 1.5;
      g.W = Math.max(g.extent * 1.08, b + 6);
    } else {
      const R = prandtl(b, phi, D);
      g.R = R;
      if (md === 'beny') { g.extent = Math.max(2.2 * B, b + 2); g.depth = 1.8 * B; }
      else { g.extent = R.G[0]; g.depth = -R.minY; }
      g.W = Math.max(g.extent * (md === 'beny' ? 1.25 : 1.12), 2.6 * B, (R.G[0]) * (md === 'beny' ? 0.0 : 1.08));
      if (md === 'beny') g.W = Math.max(g.W, 3.2 * B);
    }
    g.Hd = g.D + Math.max(g.depth * 1.22, 1.4 * B) + 0.4;
    g.Ht = Math.max(0.55 * B, 0.9);
    return g;
  }
  // teher–süllyedés görbék (q/q_t – s/B)
  const SMAX = { alt: 0.10, helyi: 0.20, beny: 0.24 };
  function qOf(m, s) {
    if (m === 'alt') { if (s <= 0.05) return 1 - Math.pow(1 - s / 0.05, 2.2); return 1 - 0.24 * (1 - Math.exp(-(s - 0.05) / 0.012)); }
    if (m === 'helyi') return Math.min(1.06, (1 - Math.exp(-s / 0.038)) * 0.97 + 0.18 * s);
    return 0.92 * (1 - Math.exp(-s / 0.075)) + 0.55 * s;
  }
  const FAIL = { alt: 0.05, helyi: 0.11, beny: 0.175 };
  function state(p, g) {
    const m = g.mode, s = p.lam * SMAX[m], q = qOf(m, s);
    const f = FAIL[m];
    const I = { alt: 0.012, helyi: 0.015, beny: 0.025 }[m];
    const ph = s < I ? 1 : s < f ? 2 : 3;
    const st = { s, q, ph, m };
    st.plastic = smooth((s - I * 0.8) / (f - I));
    st.slip = m === 'alt' ? smooth((s - (f - 0.012)) / 0.012) : m === 'helyi' ? smooth((s - (f - 0.05)) / 0.05) : smooth((s - (f - 0.06)) / 0.06);
    st.settle = s * g.B * 2.2;
    st.heave = m === 'alt' ? smooth((s - (f - 0.004)) / 0.04) * 0.24 * g.B : m === 'helyi' ? smooth((s - 0.05) / 0.1) * 0.06 * g.B : -smooth((s - 0.06) / 0.12) * 0.05 * g.B;
    st.tilt = m === 'alt' ? smooth((s - f) / 0.035) * rad(7) : 0;
    if (g.shape === 'lemez') { st.settle = s * 1.2 * 2.2; st.heave = m === 'beny' ? -smooth((s - 0.06) / 0.12) * 0.2 : smooth((s - 0.05) / 0.1) * 0.12; st.tilt = 0; }
    return st;
  }
  // terepfelszín profil (a felpúposodás)
  function ground(g, st, x) {
    const b = g.b;
    if (Math.abs(x) <= b) return 0;
    if (g.shape === 'lemez') {
      const R = g.local[0];
      const ax = Math.abs(x), L0 = b, L1 = R.G[0];
      if (ax > L1) return 0;
      const u = (ax - L0) / (L1 - L0);
      return st.heave * Math.pow(Math.sin(Math.PI * u), 1.3);
    }
    if (g.mode === 'beny') { const ax = Math.abs(x) - b; return st.heave * Math.exp(-ax / (0.45 * g.B)); }
    const R = g.R, L1 = R.G[0];
    if (g.mode === 'alt') {
      if (x < 0) return 0;
      if (x > L1) return 0;
      const u = (x - b) / (L1 - b);
      return st.heave * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 1.4);
    }
    const ax = Math.abs(x); if (ax > L1 * 0.8) return 0;
    const u = (ax - b) / (L1 * 0.8 - b);
    return st.heave * Math.pow(Math.sin(Math.PI * u), 1.2);
  }

  // ---------- 2D rajz ----------
  function palette(dark) {
    return dark ? { bg: '#1a201c', sky: 'rgba(0,0,0,0)', soil: '#6d5a42', soil2: '#7d6a50', dot: 'rgba(255,240,210,.12)', line: '#e6ece3', ink: '#e6ece3', ink2: '#b2bdb5', slip: '#ff6b55', act: 'rgba(180,226,76,.42)', radz: 'rgba(240,160,60,.42)', pas: 'rgba(255,111,160,.38)', pl: '255,190,80', conc: '#9a9b96', concE: '#e6ece3', load: '#ff6b55', base: '#b4e24c', bulb: 'rgba(20,12,4,.45)' }
      : { bg: '#ffffff', sky: 'rgba(0,0,0,0)', soil: '#d4b77c', soil2: '#c9a96c', dot: 'rgba(110,80,40,.18)', line: '#2a2f2b', ink: '#1b221e', ink2: '#47524b', slip: '#d23f2a', act: 'rgba(134,181,28,.42)', radz: 'rgba(230,140,40,.38)', pas: 'rgba(214,72,140,.32)', pl: '200,110,20', conc: '#b8b9b4', concE: '#2a2f2b', load: '#d23f2a', base: '#4a6c05', bulb: 'rgba(95,62,28,.4)' };
  }
  function draw2D(cv, p, o = {}) {
    const g = o.g || geom(p), st = o.st || state(p, g);
    const C = palette(o.dark);
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    const W = g.W, Hd = g.Hd, Ht = g.Ht;
    const X0 = o.x0 ?? -W, X1 = o.x1 ?? W;
    const sx = x => (x - X0) / (X1 - X0) * w, sy = y => (Ht - y) / (Ht + Hd) * h; // világ y: felfelé, terep y=0
    const kx = w / (X1 - X0);
    const baseY = -g.D;
    if (o.bg !== false) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); }
    // talaj
    const N = 240;
    ctx.beginPath();
    ctx.moveTo(sx(X0), sy(-Hd));
    for (let i = 0; i <= N; i++) { const x = X0 + (X1 - X0) * i / N; ctx.lineTo(sx(x), sy(ground(g, st, x))); }
    ctx.lineTo(sx(X1), sy(-Hd)); ctx.closePath();
    const gr = ctx.createLinearGradient(0, sy(0), 0, sy(-Hd));
    gr.addColorStop(0, C.soil); gr.addColorStop(1, C.soil2);
    ctx.fillStyle = gr; ctx.fill();
    // pöttyök (szemcsés) vagy vonalkák (kötött)
    ctx.save(); ctx.clip();
    ctx.fillStyle = C.dot;
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (p.soil === 'k') { ctx.strokeStyle = C.dot; ctx.lineWidth = 1; for (let y = 6; y < h; y += 12) { ctx.beginPath(); for (let x = 0; x < w; x += 10) ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 1.4); ctx.stroke(); } }
    else for (let i = 0; i < w * h / 260; i++) ctx.fillRect(r() * w, r() * h, 1.6, 1.6);
    ctx.restore();
    // alapsík szint
    ctx.setLineDash([6, 5]); ctx.strokeStyle = C.ink2; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx(X0), sy(baseY)); ctx.lineTo(sx(X1), sy(baseY)); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    const P2 = q => [sx(q[0]), sy(q[1] + baseY)];
    const poly = (pts, fill) => { ctx.beginPath(); pts.forEach((q, i) => { const [X, Y] = P2(q); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
    const line = (pts, col, lw, dash) => { ctx.beginPath(); pts.forEach((q, i) => { const [X, Y] = P2(q); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); };
    const mir = pts => pts.map(q => [-q[0], q[1]]);
    const arrow = (x0, y0, x1, y1, col, lw = 2.2) => { const A = P2([x0, y0]), Bp = P2([x1, y1]); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(Bp[0], Bp[1]); ctx.stroke(); const an = Math.atan2(Bp[1] - A[1], Bp[0] - A[0]), L = 8 + lw * 1.5; ctx.beginPath(); ctx.moveTo(Bp[0], Bp[1]); ctx.lineTo(Bp[0] - L * Math.cos(an - 0.4), Bp[1] - L * Math.sin(an - 0.4)); ctx.lineTo(Bp[0] - L * Math.cos(an + 0.4), Bp[1] - L * Math.sin(an + 0.4)); ctx.closePath(); ctx.fill(); };
    // plasztikus zónák (II.)
    const blob = (x, y, rx, ry, a) => { if (a <= 0.01) return; const [X, Y] = P2([x, y]); const R = Math.max(rx, ry) * kx; const gg = ctx.createRadialGradient(X, Y, 0, X, Y, R); gg.addColorStop(0, `rgba(${C.pl},${0.55 * a})`); gg.addColorStop(1, `rgba(${C.pl},0)`); ctx.save(); ctx.translate(X, Y); ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); ctx.translate(-X, -Y); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fill(); ctx.restore(); };
    const lbl = [];
    if (g.shape === 'lemez') {
      const R = g.local[0], b = g.b;
      const pls = st.plastic * (1 - 0.3 * st.slip);
      for (const sg of [1, -1]) blob(sg * (b - 0.4), -0.6, 1.4, 1.1, pls);
      if (g.mode === 'beny') {
        poly([[-b, 0], [b, 0], [b * 0.9, -2.2], [-b * 0.9, -2.2]], C.bulb.replace(/[\d.]+\)$/, (0.35 * st.plastic).toFixed(2) + ')'));
      } else if (st.slip > 0) {
        for (const sg of [1, -1]) {
          const pts = [R.apex, ...R.sp, R.F, R.G].map(q => [sg * q[0], q[1]]);
          const n = Math.round(pts.length * 0.62);
          ctx.globalAlpha = st.slip;
          line(pts.slice(0, n), C.slip, 3.2);
          line(pts.slice(n - 1), C.slip, 2, [7, 6]);
          ctx.globalAlpha = 1;
        }
        lbl.push(['helyi nyírási törés a szélek alatt', R.E[0], R.E[1] - 0.4, C.slip]);
      }
    } else if (g.mode === 'alt' || g.mode === 'helyi') {
      const R = g.R, b = g.b;
      const act = [[-b, 0], [b, 0], R.apex];
      const radR = [R.edge, R.apex, ...R.sp];
      const pasR = [R.edge, R.E, R.F, R.G];
      for (let i = 0; i <= 30; i++) { const x = R.G[0] - (R.G[0] - b) * i / 30; pasR.push([x, g.D + ground(g, st, x)]); }
      blob(b * 0.9, -0.25 * b, 0.75 * b, 0.6 * b, st.plastic * (1 - st.slip * 0.6));
      blob(-b * 0.9, -0.25 * b, 0.75 * b, 0.6 * b, st.plastic * (1 - st.slip * 0.6));
      const a = st.slip;
      if (a > 0.01) {
        ctx.globalAlpha = a;
        poly(act, C.act);
        if (g.mode === 'alt') {
          poly(radR, C.radz); poly(pasR, C.pas);
        } else {
          poly(radR, C.radz.replace(/[\d.]+\)$/, '0.22)')); poly(mir(radR), C.radz.replace(/[\d.]+\)$/, '0.22)'));
        }
        ctx.globalAlpha = 1;
      }
      // csúszólap
      const full = [R.apex, ...R.sp, R.F, R.G];
      if (g.mode === 'alt') {
        line(mir(full), C.ink2, 1.2, [5, 5]);
        ctx.globalAlpha = Math.max(0.25, a); line(full, C.slip, 3.4); ctx.globalAlpha = 1;
        line([[-b, 0], R.apex, [b, 0]], C.slip, a > 0.1 ? 2 : 1, a > 0.1 ? [] : [4, 4]);
        if (a > 0.2) {
          const ar = Math.max(0.5 * g.B, 0.07 * g.extent) * a;
          arrow(0, -0.25 * R.apex[1] * -1 * 0.5, 0, R.apex[1] * 0.55 + 0, C.ink, 2.4);
          const mid = R.sp[20];
          const tdir = [R.sp[22][0] - R.sp[18][0], R.sp[22][1] - R.sp[18][1]]; const tl = Math.hypot(...tdir);
          arrow(mid[0] - 0.08 * tdir[0] / tl * ar, mid[1] + 0.45 * Math.abs(mid[1]), mid[0] + tdir[0] / tl * ar, mid[1] + 0.45 * Math.abs(mid[1]) + tdir[1] / tl * ar, C.ink, 2.4);
          const pm = [(R.E[0] + R.F[0]) / 2, (R.E[1] * 0.4)];
          arrow(pm[0], pm[1], pm[0] + Math.cos(R.beta) * ar * 1.3, pm[1] + Math.sin(R.beta) * ar * 1.3, C.ink, 2.4);
          lbl.push(['aktív ék', 0, R.apex[1] * 0.45, C.ink]);
          lbl.push(['radiális nyírási zóna', R.sp[26][0] - 0.4, R.sp[26][1] * 0.55, C.ink]);
          lbl.push(['passzív ék', (R.E[0] + R.F[0]) / 2 + 0.4, R.E[1] * 0.3 + 0.2, C.ink]);
          lbl.push(['csúszólap', R.sp[30][0], R.sp[30][1] - 0.35, C.slip]);
          if (st.heave > 0.02) lbl.push(['felpúposodás', (R.F[0] + R.G[0]) / 2, g.D + st.heave + 0.35, C.slip]);
        }
      } else {
        const n = Math.round(full.length * 0.6);
        for (const pts of [full, mir(full)]) { ctx.globalAlpha = Math.max(0.2, a); line(pts.slice(0, n), C.slip, 3); line(pts.slice(n - 1), C.slip, 1.8, [7, 6]); ctx.globalAlpha = 1; }
        if (a > 0.2) {
          lbl.push(['részleges törési felület', R.sp[28][0], R.sp[28][1] - 0.35, C.slip]);
          lbl.push(['plasztikus zónák', 0, R.apex[1] * 1.15, C.ink]);
          for (const sg of [1, -1]) { const mid = R.sp[18]; arrow(sg * mid[0] * 0.95, mid[1] * 0.4, sg * (mid[0] * 0.95 + 0.35 * g.B * a), mid[1] * 0.4 - 0.05 * g.B, C.ink, 2); }
        }
      }
      if (st.plastic > 0.3 && st.slip < 0.3) lbl.push(['plasztikus zónák alakulnak ki', 0, -0.95 * g.B, C.ink]);
    } else {
      // benyomódás
      const b = g.b, B = g.B;
      const a = st.plastic;
      const bulbA = 0.15 + 0.35 * a;
      ctx.beginPath();
      const [cx, cy] = P2([0, -0.75 * B]);
      ctx.ellipse(cx, cy, 0.85 * B * kx, 0.95 * B * kx, 0, 0, 7);
      ctx.fillStyle = C.bulb.replace(/[\d.]+\)$/, bulbA.toFixed(2) + ')'); ctx.fill();
      for (const sg of [1, -1]) {
        ctx.globalAlpha = Math.max(0.15, st.slip);
        line([[sg * b, 0.0], [sg * b * 1.04, -0.6 * B], [sg * b * 1.1, -1.25 * B]], C.slip, 3);
        // nyírt sáv kis vonalkái
        for (let k = 1; k < 6; k++) { const yy = -k * 0.22 * B; line([[sg * b * 1.02 - 0.08, yy + 0.08], [sg * b * 1.02 + 0.08, yy - 0.08]], C.slip, 1.6); }
        ctx.globalAlpha = 1;
      }
      if (a > 0.2) { arrow(0, -0.2 * B, 0, -0.2 * B - 0.55 * B * a, C.ink, 2.6); for (const sg of [1, -1]) arrow(sg * 0.35 * B, -0.35 * B, sg * 0.5 * B, -0.35 * B - 0.4 * B * a, C.ink, 2); }
      lbl.push(['tömörödő talajmag', 0, -1.85 * B, C.ink]);
      if (st.slip > 0.3) lbl.push(['nyírás az alap szélei mentén', b * 1.15 + 0.2, -0.75 * B, C.slip]);
      if (st.heave < -0.01) lbl.push(['a térszín süpped', b + 0.5 * B, g.D + 0.3, C.slip]);
    }
    // alaptest
    const b = g.b, B = g.B;
    const hf = Math.min(0.5, 0.3 * B + 0.1), stem = Math.min(B * 0.35, 0.6);
    ctx.save();
    const piv = P2([0, 0]);
    ctx.translate(piv[0], piv[1] + st.settle * kx);
    ctx.rotate(st.tilt);
    ctx.translate(-piv[0], -piv[1]);
    const fx0 = sx(-b), fx1 = sx(b), fy0 = sy(baseY + hf), fy1 = sy(baseY);
    ctx.fillStyle = C.conc; ctx.strokeStyle = C.concE; ctx.lineWidth = 1.6;
    ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0); ctx.strokeRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    if (g.shape !== 'lemez') {
      const s0 = sx(-stem / 2), s1 = sx(stem / 2), sTop = sy(Ht * 0.9);
      ctx.fillRect(s0, sTop, s1 - s0, fy0 - sTop); ctx.strokeRect(s0, sTop, s1 - s0, fy0 - sTop);
      // teher
      const L = 0.3 * Ht + 0.6 * Ht * Math.min(1.1, st.q);
      ctx.restore(); ctx.save();
      const topX = piv[0], topY = sy(Ht * 0.9) + st.settle * kx;
      ctx.strokeStyle = C.load; ctx.fillStyle = C.load; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(topX, topY - L * h / (Ht + Hd) * 0.9); ctx.lineTo(topX, topY - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(topX - 8, topY - 14); ctx.lineTo(topX + 8, topY - 14); ctx.closePath(); ctx.fill();
    } else {
      ctx.restore(); ctx.save();
      ctx.fillStyle = C.load;
      for (let i = 0; i < 9; i++) { const X = sx(-b + (i + 0.5) * B / 9); const top = sy(baseY + hf) + st.settle * kx - 4; ctx.fillRect(X - 1.5, top - 26 * Math.min(1.1, st.q + 0.2), 3, 26 * Math.min(1.1, st.q + 0.2)); }
    }
    ctx.restore();
    // feliratok
    if (o.labels !== false) {
      ctx.font = `600 ${Math.max(11, Math.round(w / 70))}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [t, x, y, col] of lbl) {
        const [X, Y] = P2([x, y]);
        ctx.lineWidth = 4; ctx.strokeStyle = o.dark ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.85)'; ctx.strokeText(t, X, Y);
        ctx.fillStyle = col; ctx.fillText(t, X, Y);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = C.ink2; ctx.font = `500 ${Math.max(10, Math.round(w / 85))}px "IBM Plex Mono", monospace`;
      ctx.fillText(`B = ${fmt(B, 2)} m · D = ${fmt(g.D, 2)} m · φ′ = ${fmt(g.phi, 1)}°`, 10, h - 12);
    }
    ctx.restore();
    return { g, st, map: { sx, sy, kx } };
  }
  return { P, geom, state, mode, autoMode, phiOf, draw2D, ground, qOf, SMAX, FAIL, glB, lpB, Bstar, Bof, prandtl, palette };
})();
