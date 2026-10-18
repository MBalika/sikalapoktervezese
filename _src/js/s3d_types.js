/* ===== 3D: alaptípusok (hős és labor) ===== */
function initTypes(container, o = {}) {
  const st3 = makeStage(container, { pos: o.hero ? [16, 5.2, 18] : [17.5, 6.2, 20.5], target: o.hero ? [0, 0.2, 0] : [0, -0.9, 0], shadows: true, autoRotate: !!o.hero, autoRotateSpeed: 0.55, fitAspect: o.hero ? 1.25 : 1.5, minDist: 8, maxDist: 46, shadowSize: 13 });
  const { scene } = st3;
  const X0 = -8.5, X1 = 8.5, Z0 = -6.5, Z1 = 6.5, DEP = -5.2;
  const layers = [{ kind: 'humusz', top: 0, bot: -0.35, topColor: '#5d7f33' }, { kind: 'homok', top: -0.35, bot: -2.6 }, { kind: 'kavics', top: -2.6, bot: DEP }];
  const back = soilBlock(layers, X0, X1, Z0, 0);
  scene.add(back);
  let front = soilBlock(layers, X0, X1, 0, Z1, { opacity: 0.25 });
  scene.add(front);
  // síkalap-sík jelölés (szaggatott vonal a metszeten)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = DEP - 0.01; ground.receiveShadow = true;
  scene.add(ground);

  const M = {
    beton: stdMat(0xffffff, { map: matTex('beton', [2, 2]) }),
    tegla: stdMat(0xffffff, { map: matTex('tegla', [3, 2]) }),
    ko: stdMat(0xffffff, { map: matTex('ko', [2, 2]) }),
    uszt: stdMat(0xffffff, { map: matTex('uszt', [2, 1]) }),
    bld: stdMat(0xeceae3, { roughness: 0.95 }),
    bld2: stdMat(0xd9d6cc, { roughness: 0.95 }),
    slab: stdMat(0xcfcdc5, { transparent: true, opacity: 0.55 }),
    col: stdMat(0xd2d0c8),
    pre: stdMat(0xb0aca2),
    steel: stdMat(0x5b6670, { metalness: 0.5, roughness: 0.45 }),
    panel: stdMat(0xffffff, { map: matTex('panel', [6, 4]) }),
    win: stdMat(0x5b7488, { roughness: 0.3, metalness: 0.2 }),
    reb: stdMat(0xa3341f, { roughness: 0.6 })
  };
  Object.values(M).forEach(m => m.userData.keep = true);
  const fnd = new THREE.Group(), bld = new THREE.Group();
  scene.add(fnd, bld);

  // --- segédfüggvények ---
  function prof(points, len, mat) {
    const sh = new THREE.Shape(points.map(([u, v]) => new THREE.Vector2(u, v)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = m.receiveShadow = true;
    edges(m, 0x1b221e, 0.22);
    return m;
  }
  function along(points, x0, z0, x1, z1, mat, ext = 0) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) + 2 * ext;
    const m = prof(points, L, mat);
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    return m;
  }
  function box(w, h, d, x, y, z, mat, e = true) { const m = boxAt(w, h, d, x, y, z, mat); if (e) edges(m, 0x1b221e, 0.2); return m; }
  const WALLS = [[-5, -4, -5, 4], [5, -4, 5, 4], [-5, -4, 5, -4], [-5, 4, 5, 4], [0, -4, 0, 4]];
  const COLS = []; for (const x of [-5, 0, 5]) for (const z of [-4, 0, 4]) COLS.push([x, z]);
  let sources = [], baseY = -1;

  function wallBuilding(top = 6, from = 0.3) {
    for (const [x0, z0, x1, z1] of WALLS) {
      const ext = (x0 === x1) ? 0.19 : 0.19;
      const m = along([[-0.19, from], [0.19, from], [0.19, top], [-0.19, top]], x0, z0, x1, z1, M.bld, ext);
      bld.add(m);
    }
    for (const y of [3, top]) bld.add(box(10.8, 0.22, 8.8, 0, y + 0.11, 0, M.bld2));
    // ablakok
    for (const z of [-4.2, 4.2]) for (const x of [-3.4, -1.2, 1.6, 3.6]) for (const y of [1.5, 4.5]) bld.add(box(1.0, 1.2, 0.06, x, y, z, M.win, false));
    for (const x of [-5.2, 5.2]) for (const z of [-2.2, 2.2]) for (const y of [1.5, 4.5]) bld.add(box(0.06, 1.2, 1.0, x, y, z, M.win, false));
  }
  function frameBuilding(colBase = -0.55, top = 6.6, opts = {}) {
    for (const [x, z] of COLS) {
      const m = box(0.4, top - colBase, 0.4, x, (top + colBase) / 2, z, opts.steel ? M.steel : M.col);
      bld.add(m);
    }
    for (const y of [3.3, top]) {
      for (const z of [-4, 0, 4]) bld.add(box(10.4, 0.45, 0.3, 0, y - 0.22, z, M.col));
      for (const x of [-5, 0, 5]) bld.add(box(0.3, 0.45, 8.4, x, y - 0.22, 0, M.col));
      bld.add(box(10.6, 0.16, 8.6, 0, y + 0.08, 0, M.slab, false));
    }
  }
  // --- típusok ---
  const SAV_PROF = {
    csom: [[-0.38, -1], [0.38, -1], [0.38, -0.5], [-0.38, -0.5]],
    tegla: [[-0.45, -1], [0.45, -1], [0.45, -0.85], [0.33, -0.85], [0.33, -0.7], [0.25, -0.7], [0.25, -0.55], [-0.25, -0.55], [-0.25, -0.7], [-0.33, -0.7], [-0.33, -0.85], [-0.45, -0.85]],
    ko: [[-0.52, -1], [0.52, -1], [0.52, -0.82], [0.36, -0.82], [0.36, -0.64], [0.24, -0.64], [0.24, -0.5], [-0.24, -0.5], [-0.24, -0.64], [-0.36, -0.64], [-0.36, -0.82], [-0.52, -0.82]],
    uszt: [[-0.45, -1], [0.45, -1], [0.45, -0.5], [-0.45, -0.5]],
    vb: [[-0.7, -1], [0.7, -1], [0.7, -0.68], [-0.7, -0.68]]
  };
  const SAV_MAT = { csom: 'beton', tegla: 'tegla', ko: 'ko', uszt: 'uszt', vb: 'beton' };
  function buildSav(v) {
    const p = SAV_PROF[v] || SAV_PROF.csom, mat = M[SAV_MAT[v] || 'beton'];
    const half = Math.max(...p.map(q => q[0]));
    for (const [x0, z0, x1, z1] of WALLS) {
      fnd.add(along(p, x0, z0, x1, z1, mat, half));
      // lábazati fal
      const topY = Math.max(...p.map(q => q[1]));
      fnd.add(along([[-0.2, topY], [0.2, topY], [0.2, 0.3], [-0.2, 0.3]], x0, z0, x1, z1, v === 'tegla' ? M.tegla : v === 'ko' ? M.ko : M.beton, 0.2));
      if (v === 'vb') {
        const L = Math.hypot(x1 - x0, z1 - z0) + 1.2;
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, L, 6), M.reb);
        r.rotation.x = Math.PI / 2;
        for (const u of [-0.5, -0.17, 0.17, 0.5]) { const rr = r.clone(); rr.position.set(u, -0.93, 0); const g = new THREE.Group(); g.add(rr); g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); g.rotation.y = Math.atan2(x1 - x0, z1 - z0); fnd.add(g); }
      }
    }
    wallBuilding();
    baseY = -1;
    sources = [];
    for (const [x0, z0, x1, z1] of WALLS) { const n = Math.round(Math.hypot(x1 - x0, z1 - z0)); for (let i = 0; i <= n; i++) sources.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, 0.6, 6]); }
  }
  function buildPill(v) {
    let colBase = -0.55;
    for (const [x, z] of COLS) {
      if (v === 'kehely') {
        fnd.add(box(2.0, 0.45, 2.0, x, -1.0, z, M.beton));
        const t = 0.22, ow = 1.0, hh = 0.75, yc = -0.775 + hh / 2;
        fnd.add(box(ow, hh, t, x, yc, z - (ow - t) / 2, M.beton)); fnd.add(box(ow, hh, t, x, yc, z + (ow - t) / 2, M.beton));
        fnd.add(box(t, hh, ow - 2 * t, x - (ow - t) / 2, yc, z, M.beton)); fnd.add(box(t, hh, ow - 2 * t, x + (ow - t) / 2, yc, z, M.beton));
        colBase = -0.75;
      } else {
        fnd.add(box(1.8, 0.35, 1.8, x, -1.025, z, M.beton));
        fnd.add(box(1.0, 0.3, 1.0, x, -0.7, z, M.beton));
        colBase = -0.55;
      }
    }
    frameBuilding(colBase, 6.6, { pre: v === 'kehely' });
    if (v === 'kehely') bld.children.forEach(m => { if (m.geometry && m.geometry.parameters && m.geometry.parameters.height > 6) m.material = M.pre; });
    baseY = -1.2;
    sources = COLS.map(([x, z]) => [x, z, 0.9, 6.6]);
  }
  const T_PROF = [[-0.7, -1.2], [0.7, -1.2], [0.7, -0.9], [0.25, -0.9], [0.25, -0.45], [-0.25, -0.45], [-0.25, -0.9], [-0.7, -0.9]];
  function buildSzalag(both) {
    for (const z of [-4, 0, 4]) fnd.add(along(T_PROF, -5.8, z, 5.8, z, M.beton));
    if (both) for (const x of [-5, 0, 5]) fnd.add(along(T_PROF, x, -4.8, x, 4.8, M.beton));
    frameBuilding(-0.45, 6.6);
    baseY = -1.2;
    sources = [];
    for (const z of [-4, 0, 4]) for (let x = -5.5; x <= 5.5; x += 1) sources.push([x, z, 0.7, 6.6]);
    if (both) for (const x of [-5, 0, 5]) for (let z = -4.5; z <= 4.5; z += 1) sources.push([x, z, 0.7, 6.6]);
  }
  function buildLemez(v) {
    const W = 11.6, D = 9.6;
    if (v === 'felul') {
      fnd.add(box(W, 0.4, D, 0, -0.95, 0, M.beton));
      for (const z of [-4, 0, 4]) fnd.add(box(W, 0.5, 0.55, 0, -0.5, z, M.beton));
      for (const x of [-5, 0, 5]) fnd.add(box(0.55, 0.5, D, x, -0.5, 0, M.beton));
      frameBuilding(-0.25, 6.6);
    } else if (v === 'alul') {
      fnd.add(box(W, 0.35, D, 0, -0.675, 0, M.beton));
      for (const z of [-4, 0, 4]) fnd.add(box(W, 0.55, 0.6, 0, -1.125, z, M.beton));
      for (const x of [-5, 0, 5]) fnd.add(box(0.6, 0.55, D, x, -1.125, 0, M.beton));
      frameBuilding(-0.5, 6.6);
    } else if (v === 'gomba') {
      fnd.add(box(W, 0.4, D, 0, -0.7, 0, M.beton));
      for (const [x, z] of COLS) {
        const g = new THREE.CylinderGeometry(1.25 * Math.SQRT2, 0.75 * Math.SQRT2, 0.4, 4, 1); g.rotateY(Math.PI / 4);
        const m = new THREE.Mesh(g, M.beton); m.position.set(x, -1.1, z); m.castShadow = m.receiveShadow = true; edges(m, 0x1b221e, 0.2); fnd.add(m);
      }
      frameBuilding(-0.5, 6.6);
    } else {
      fnd.add(box(W, 0.6, D, 0, -0.8, 0, M.beton));
      frameBuilding(-0.5, 6.6);
    }
    baseY = -1.1;
    sources = [];
    for (let x = -5.5; x <= 5.5; x += 1.1) for (let z = -4.5; z <= 4.5; z += 1.1) sources.push([x, z, 0.35, 6.6]);
  }
  function buildDoboz() {
    const W = 11.2, D = 9.2, b = -3.4;
    fnd.add(box(W, 0.4, D, 0, b + 0.2, 0, M.beton));
    for (const z of [-D / 2 + 0.15, D / 2 - 0.15]) fnd.add(box(W, 3.0, 0.3, 0, b + 0.4 + 1.5, z, M.beton));
    for (const x of [-W / 2 + 0.15, W / 2 - 0.15, 0]) fnd.add(box(0.3, 3.0, D - 0.6, x, b + 0.4 + 1.5, 0, M.beton));
    fnd.add(box(W, 0.3, D, 0, 0.15, 0, M.beton));
    // panelház
    const h = 11.2;
    const shell = box(10.4, h, 8.4, 0, 0.3 + h / 2, 0, M.panel, true);
    bld.add(shell);
    bld.add(box(10.6, 0.25, 8.6, 0, 0.3 + h + 0.12, 0, M.bld2));
    baseY = b;
    sources = [];
    for (let x = -5; x <= 5; x += 1.25) for (const z of [-4.2, 4.2]) sources.push([x, z, 0.5, 11.5]);
    for (let z = -3.5; z <= 3.5; z += 1.2) for (const x of [-5.2, 5.2]) sources.push([x, z, 0.5, 11.5]);
  }
  function buildHej() {
    const pts = [];
    const r0 = 3.0, r1 = 5.8, y0 = -0.75, y1 = -2.15, t = 0.2;
    pts.push(new THREE.Vector2(r0, y0), new THREE.Vector2(r1, y1), new THREE.Vector2(r1, y1 - t), new THREE.Vector2(r0 - 0.15, y0 - t));
    const g = new THREE.LatheGeometry(pts.concat([pts[0]]), 64);
    const shell = new THREE.Mesh(g, M.beton); shell.castShadow = shell.receiveShadow = true; edges(shell, 0x1b221e, 0.12);
    fnd.add(shell);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r1, 0.28, 10, 72), M.beton); ring.rotation.x = Math.PI / 2; ring.position.y = y1 - 0.12; ring.castShadow = true; fnd.add(ring);
    const ring0 = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.2, r0 + 0.2, 0.5, 64, 1, true), M.beton); ring0.material.side = THREE.DoubleSide; ring0.position.y = y0 + 0.2; fnd.add(ring0);
    // torony
    const tow = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0, 12, 64, 1, false), M.bld); tow.position.y = -0.5 + 6; tow.castShadow = true; tow.receiveShadow = true;
    bld.add(tow);
    for (let y = 0.8; y < 11.4; y += 1.2) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.04, r0 + 0.04, 0.5, 64, 1, true), M.win); b.position.y = y; bld.add(b); }
    baseY = y1;
    sources = [];
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; sources.push([Math.cos(a) * r0, Math.sin(a) * r0, 0, 11, a]); }
  }
  // --- teherút részecskék ---
  const N = 420;
  const pGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const pMat = new THREE.MeshBasicMaterial({ color: 0xd8f23f, transparent: true, opacity: 0.95 });
  const parts = new THREE.InstancedMesh(pGeo, pMat, N);
  parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parts.visible = false;
  parts.frustumCulled = false;
  scene.add(parts);
  const P = [];
  function resetParticles() {
    P.length = 0;
    if (!sources.length) return;
    for (let i = 0; i < N; i++) P.push(newP(Math.random()));
  }
  function newP(phase = 0) {
    const s = sources[(Math.random() * sources.length) | 0];
    const top = s[3];
    const p = { x: s[0], z: s[1], y: top - phase * (top - baseY + 2.6), sw: s[2], vx: 0, vz: 0, spread: false, src: s };
    if (p.y < baseY) { p.spread = true; const a = s[4] !== undefined ? s[4] + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2; const r = Math.random(); p.vx = Math.cos(a) * 0.5 * r; p.vz = Math.sin(a) * 0.5 * r; p.x += p.vx * (baseY - p.y); p.z += p.vz * (baseY - p.y); }
    return p;
  }
  const dm = new THREE.Object3D();
  st3.onFrame(dt => {
    if (!parts.visible) return;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      const v = 2.6 * dt;
      p.y -= v;
      if (!p.spread && p.y <= baseY) {
        p.spread = true;
        const s = p.src;
        if (s[4] !== undefined) { const a = s[4] + (Math.random() - 0.5) * 1.2, r = 0.25 + Math.random() * 0.5; p.vx = Math.cos(a) * r; p.vz = Math.sin(a) * r; }
        else { const a = Math.random() * Math.PI * 2, r = Math.random(); p.vx = Math.cos(a) * 0.5 * r; p.vz = Math.sin(a) * 0.5 * r; p.x += (Math.random() - 0.5) * p.sw; p.z += (Math.random() - 0.5) * p.sw * (s[2] > 0.5 ? 0.3 : 1); }
      }
      if (p.spread) { p.x += p.vx * v; p.z += p.vz * v; }
      let sc = 1;
      if (p.spread) sc = clamp(1 - (baseY - p.y) / 2.6, 0, 1);
      if (p.y < baseY - 2.6) P[i] = newP(0);
      dm.position.set(p.x, p.y, p.z);
      dm.scale.setScalar(sc * (p.spread ? 1.15 : 0.85));
      dm.updateMatrix();
      parts.setMatrixAt(i, dm.matrix);
    }
    parts.instanceMatrix.needsUpdate = true;
  });
  // feliratok
  const lType = st3.label('', 'lime', [0, 0, 0]);
  if (o.hero) lType.show = false;
  const lBase = st3.label('', '', [0, 0, 0]);
  let type = 'sav', variant = null, bmode = 'solid';
  function build() {
    disposeGroup(fnd); disposeGroup(bld);
    const v = variant;
    if (type === 'sav') buildSav(v || 'csom');
    else if (type === 'pill') buildPill(v || 'lepcsos');
    else if (type === 'szalag') buildSzalag(false);
    else if (type === 'racs') buildSzalag(true);
    else if (type === 'lemez') buildLemez(v || 'sik');
    else if (type === 'doboz') buildDoboz();
    else if (type === 'hej') buildHej();
    lType.set(TYPE_INFO[type].name + (v && TYPE_INFO[type].variants.length ? ' · ' + (TYPE_INFO[type].variants.find(x => x[0] === v) || [, ''])[1] : ''));
    lType.pos.set(type === 'hej' ? 5.2 : 4.6, baseY + 0.2, 5.2);
    lType.show = !o.hero;
    lBase.set(`alapsík ${fmt(baseY, 2)} m`);
    lBase.pos.set(-7.4, baseY, 0.05);
    lBase.show = !o.hero;
    resetParticles();
    if (bmode === 'ghost') bld.traverse(x => { if (x.isMesh) x.castShadow = false; });
    st3.kick();
  }
  // alapsík-vonal a metszeten
  const baseLine = new THREE.Mesh(new THREE.BoxGeometry(17, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0x86b51c }));
  scene.add(baseLine);
  st3.onFrame(() => { baseLine.position.set(0, baseY, 0.02); baseLine.visible = !o.hero; });
  build();
  return {
    setType(t, v) { type = t; variant = v || (TYPE_INFO[t].variants[0] || [null])[0]; build(); },
    setVariant(v) { variant = v; build(); },
    setBuild(mode) {
      bmode = mode;
      bld.visible = mode !== 'off';
      const ghost = mode === 'ghost';
      for (const k of ['bld', 'bld2', 'slab', 'col', 'pre', 'steel', 'panel', 'win']) {
        const m = M[k];
        if (!m.userData.op0) m.userData.op0 = m.opacity;
        m.transparent = ghost || k === 'slab';
        m.opacity = ghost ? (k === 'win' ? 0.35 : 0.26) : m.userData.op0;
        m.depthWrite = !ghost;
        m.needsUpdate = true;
      }
      bld.traverse(x => { if (x.isMesh) x.castShadow = !ghost; });
      st3.kick();
    },
    setLoad(b) { parts.visible = b; if (b) resetParticles(); st3.kick(); },
    setSoil(op) {
      front.traverse(m => { if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(mm => { mm.opacity = op; mm.transparent = op < 1; mm.depthWrite = op >= 0.99; mm.needsUpdate = true; }); });
      front.visible = op > 0.01;
      st3.kick();
    },
    stage: st3
  };
}

/* ---- csatlakoztatás: hős ---- */
(function heroTypes() {
  const el = document.getElementById('hero3d'); if (!el) return;
  let T = null, idx = 0, timer = null, pausedUntil = 0;
  const chips = document.getElementById('heroChips'), cap = document.getElementById('heroCap');
  TYPE_ORDER.forEach((k, i) => { const b = H('button', { type: 'button', text: TYPE_INFO[k].name, 'data-v': k }, chips); if (!i) b.classList.add('on'); });
  function show(i) {
    idx = i;
    const k = TYPE_ORDER[i];
    $$('button', chips).forEach(b => b.classList.toggle('on', b.dataset.v === k));
    if (T) T.setType(k);
    cap.textContent = `${TYPE_INFO[k].name} – ${TYPE_INFO[k].kind.toLowerCase()}`;
  }
  chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; pausedUntil = performance.now() + 20000; show(TYPE_ORDER.indexOf(b.dataset.v)); });
  onVisible(el, () => {
    T = initTypes(el, { hero: true });
    T.setSoil(0.16);
    T.setBuild('ghost');
    show(0);
    timer = setInterval(() => { if (performance.now() < pausedUntil || document.hidden) return; show((idx + 1) % TYPE_ORDER.length); }, 5200);
  }, '0px');
})();

/* ---- csatlakoztatás: labor ---- */
(function labTypes() {
  const el = document.getElementById('types3d'); if (!el) return;
  let T = null, type = 'sav';
  const chips = document.getElementById('tChips'), vars = document.getElementById('tVar');
  TYPE_ORDER.forEach((k, i) => { const b = H('button', { type: 'button', text: TYPE_INFO[k].name, 'data-v': k }, chips); if (!i) b.classList.add('on'); });
  function info(k) {
    const I = TYPE_INFO[k];
    $('#tKind').textContent = I.kind;
    $('#tTitle').textContent = I.name;
    $('#tDesc').textContent = I.desc;
    $('#tWhen').innerHTML = `<b>Mikor?</b><p class="small">${I.when}</p>`;
    vars.innerHTML = '';
    $('#tVarWrap').style.display = I.variants.length ? '' : 'none';
    I.variants.forEach(([v, n], i) => { const b = H('button', { type: 'button', text: n, 'data-v': v }, vars); if (!i) b.classList.add('on'); });
  }
  chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', chips).forEach(x => x.classList.toggle('on', x === b)); type = b.dataset.v; info(type); if (T) T.setType(type); });
  vars.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', vars).forEach(x => x.classList.toggle('on', x === b)); if (T) T.setVariant(b.dataset.v); });
  info(type);
  const soil = $('#tSoil'), soilO = $('#tSoilO');
  const sOut = () => soilO.textContent = Math.round(soil.value * 100) + ' %';
  sOut();
  onVisible(el, () => {
    T = initTypes(el, {});
    T.setType(type);
    T.setSoil(+soil.value);
    T.setBuild('ghost');
    bindSeg($('#tBuild'), v => T.setBuild(v));
    T.setLoad($('#tLoad').checked);
    $('#tLoad').addEventListener('change', e => T.setLoad(e.target.checked));
    soil.addEventListener('input', () => { sOut(); T.setSoil(+soil.value); });
  });
})();
