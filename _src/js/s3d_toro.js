/* ===== 3D: törési mechanizmus-labor ===== */
function initToro3D(container) {
  const st3 = makeStage(container, { pos: [9, 6, 15], target: [0, -2, -2], shadows: true, minDist: 2, maxDist: 400, shadowSize: 30, maxPolar: Math.PI * 0.62 });
  const { scene, camera, controls } = st3;
  const root = new THREE.Group(); scene.add(root);
  const INV = new THREE.MeshBasicMaterial({ visible: false }); INV.userData.keep = true;
  const soilMat = () => new THREE.MeshStandardMaterial({ map: soilTex(TORO.P.soil === 'k' ? 'agyag' : 'homok', [4, 2]), roughness: 0.95 });
  let g, st, W, Hd, Ht, Lz, baseY;
  let front, back, top, body, foot, slip, slipL, load, cvs, tex, frontMat, bodyMat, topMat, backMat, lastW = 0;
  const lAct = st3.label('aktív ék', 'lime'), lSlip = st3.label('csúszólap', 'bad'), lHeave = st3.label('felpúposodás', 'bad'), lPl = st3.label('plasztikus zónák', 'k');
  let xray = false;
  const shapeIsPill = () => g.shape === 'pill';
  function ground3(x, z) {
    if (!shapeIsPill()) return TORO.ground(g, st, x);
    const b = g.b, dx = Math.max(Math.abs(x) - b, 0), dz = Math.max(Math.abs(z) - b, 0);
    const sd = Math.hypot(dx, dz);
    if (sd <= 0) return 0;
    let w = 1;
    if (g.mode === 'alt') { const a = Math.atan2(z, x); w = Math.pow(Math.max(0, Math.cos(a)), 1.4); return TORO.ground(g, st, b + sd) * w; }
    return TORO.ground(g, st, b + sd);
  }
  function build() {
    disposeGroup(root);
    g = TORO.geom(TORO.P); st = TORO.state(TORO.P, g);
    W = g.W; Hd = g.Hd; Ht = g.Ht; baseY = -g.D;
    Lz = shapeIsPill() ? Math.max(W * 0.9, 2.5 * g.B) : Math.max(0.62 * W, 3 * g.B);
    // vászon a metszethez
    cvs = document.createElement('canvas');
    cvs.width = 1400; cvs.height = Math.round(clamp(1400 * (Hd + Ht) / (2 * W), 300, 1400));
    tex = new THREE.CanvasTexture(cvs); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.userData.own = true;
    frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, transparent: true, opacity: 1 });
    bodyMat = soilMat(); topMat = new THREE.MeshStandardMaterial({ color: TORO.P.soil === 'k' ? 0x9a7a58 : 0xcdb27a, roughness: 1 });
    backMat = soilMat();
    [frontMat, bodyMat, topMat, backMat].forEach(m => m.side = THREE.DoubleSide);
    // test (oldalak + alj)
    body = new THREE.Mesh(new THREE.BoxGeometry(2 * W, Hd, Lz), [bodyMat, bodyMat, INV, bodyMat, INV, INV]);
    body.position.set(0, -Hd / 2, -Lz / 2); body.receiveShadow = true;
    root.add(body);
    // elülső és hátsó lap: felső élük a terepprofilt követi
    const NX = 200;
    const mkFace = (mat, z) => { const geo = new THREE.PlaneGeometry(2 * W, 1, NX, 1); const m = new THREE.Mesh(geo, mat); m.position.z = z; m.receiveShadow = true; root.add(m); return m; };
    front = mkFace(frontMat, 0.0); back = mkFace(backMat, -Lz);
    top = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, Lz, NX, shapeIsPill() ? 60 : 4), topMat);
    top.rotation.x = -Math.PI / 2; top.position.z = -Lz / 2; top.receiveShadow = true;
    root.add(top);
    // alaptest
    foot = new THREE.Group();
    const conc = stdMat(0xffffff, { map: matTex('beton', [2, 1]) });
    const hf = Math.min(0.5, 0.3 * g.B + 0.1), stem = Math.min(g.B * 0.35, 0.6);
    const Lf = shapeIsPill() ? g.b + 0.02 : Lz + 0.02;
    const zc = shapeIsPill() ? -g.b / 2 + 0.01 : -Lz / 2 + 0.01;
    const fb = boxAt(g.B, hf, Lf, 0, baseY + hf / 2, zc, conc); edges(fb, 0x1b221e, 0.35); foot.add(fb);
    if (g.shape !== 'lemez') {
      const sh = Ht * 0.9 - (baseY + hf);
      const sm = boxAt(stem, sh, shapeIsPill() ? stem / 2 + 0.01 : Lz + 0.02, 0, baseY + hf + sh / 2, shapeIsPill() ? -stem / 4 : zc, conc); edges(sm, 0x1b221e, 0.35); foot.add(sm);
    }
    root.add(foot);
    // teher-nyíl
    load = arrow3(Math.max(0.8, Ht * 0.8), 0xd23f2a, Math.max(0.04, g.B * 0.03));
    load.position.set(0, Ht * 0.9, shapeIsPill() ? -g.b / 2 : -Lz * 0.08);
    root.add(load);
    // csúszólap-felületek
    const slipMat = new THREE.MeshStandardMaterial({ color: 0xd23f2a, emissive: 0xd23f2a, emissiveIntensity: 0.35, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    slip = new THREE.Group(); root.add(slip);
    buildSlip(slipMat);
    // kamera illesztés
    if (Math.abs(W - lastW) / Math.max(1, lastW) > 0.12) {
      const tgt = new THREE.Vector3(0.12 * W, -0.36 * Hd, -0.22 * Lz);
      const dir = camera.position.clone().sub(controls.target).normalize();
      controls.target.copy(tgt);
      const R = Math.sqrt(W * W + (Hd * 0.6) ** 2 + (Lz * 0.5) ** 2);
      const fov = camera.fov * Math.PI / 180, asp = Math.max(0.6, camera.aspect);
      const dist = R / Math.sin(Math.min(fov, fov * asp) / 2) * 0.6;
      camera.position.copy(tgt).add(dir.multiplyScalar(Math.max(4, dist)));
      st3.sun.shadow.camera.left = -W * 1.3; st3.sun.shadow.camera.right = W * 1.3; st3.sun.shadow.camera.top = W * 1.3; st3.sun.shadow.camera.bottom = -W * 1.3; st3.sun.shadow.camera.far = W * 6; st3.sun.position.set(W * 0.6, W * 1.4, W * 0.9); st3.sun.shadow.camera.updateProjectionMatrix();
      lastW = W;
    }
    applyX();
    update();
  }
  function ribbon(pts2, z0, z1, mat) {
    const pos = [], idx = [];
    pts2.forEach(([x, y], i) => { pos.push(x, y, z0, x, y, z1); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }
  function sweep(prof, b, mat) { // pilléralap: a fél négyzet körül söpört felület (z ≤ 0)
    const NA = 48, pos = [], idx = [];
    const n = 8;
    prof.forEach(([s, y], i) => {
      for (let j = 0; j <= NA; j++) {
        const ps = Math.PI + Math.PI * j / NA;
        const c = Math.cos(ps), sn = Math.sin(ps);
        const px = b * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), pz = b * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n);
        pos.push(px + s * c, y, pz + s * sn);
      }
      if (i) for (let j = 0; j < NA; j++) { const a = (i - 1) * (NA + 1) + j, bb = i * (NA + 1) + j; idx.push(a, bb, a + 1, a + 1, bb, bb + 1); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }
  function buildSlip(mat) {
    disposeGroup(slip);
    const z0 = -Lz, z1 = 0;
    const W2 = p => [p[0], p[1] + baseY];
    if (g.shape === 'lemez') {
      if (g.mode === 'beny') return;
      const R = g.local[0];
      const pts = [R.apex, ...R.sp, R.F, R.G].slice(0, 30);
      slip.add(ribbon(pts.map(W2), z0, z1, mat)); slip.add(ribbon(pts.map(q => W2([-q[0], q[1]])), z0, z1, mat));
      return;
    }
    if (g.mode === 'beny') {
      for (const sg of [1, -1]) {
        const pts = [[sg * g.b, 0], [sg * g.b * 1.04, -0.6 * g.B], [sg * g.b * 1.1, -1.25 * g.B]].map(W2);
        if (shapeIsPill()) slip.add(sweep([[0, baseY], [0.04 * g.b, baseY - 0.6 * g.B], [0.1 * g.b, baseY - 1.25 * g.B]], g.b, mat));
        else slip.add(ribbon(pts, z0, z1, mat));
        if (shapeIsPill()) break;
      }
      return;
    }
    const R = g.R;
    let full = [R.apex, ...R.sp, R.F, R.G];
    if (g.mode === 'helyi') full = full.slice(0, Math.round(full.length * 0.6));
    if (shapeIsPill()) {
      const prof = full.map(q => [q[0] - g.b, q[1] + baseY]);
      slip.add(sweep(prof, g.b, mat));
    } else {
      slip.add(ribbon(full.map(W2), z0, z1, mat));
      const m2 = mat.clone(); m2.opacity = g.mode === 'alt' ? 0.14 : 0.5;
      slip.add(ribbon(full.map(q => W2([-q[0], q[1]])), z0, z1, m2));
    }
  }
  function setFace(mesh, z, uv) {
    const pos = mesh.geometry.attributes.position, uvA = mesh.geometry.attributes.uv;
    const NX = (pos.count / 2) - 1;
    for (let i = 0; i <= NX; i++) {
      const x = -W + 2 * W * i / NX;
      const y = ground3(x, z);
      pos.setXYZ(i, x, y, 0);              // felső sor
      pos.setXYZ(i + NX + 1, x, -Hd, 0);   // alsó sor
      if (uv) { uvA.setXY(i, i / NX, (y + Hd) / (Hd + Ht)); uvA.setXY(i + NX + 1, i / NX, 0); }
    }
    pos.needsUpdate = true; if (uv) uvA.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();
  }
  function update() {
    g = TORO.geom(TORO.P); st = TORO.state(TORO.P, g);
    TORO.draw2D(cvs, TORO.P, { g, st, dark: false, bg: false, labels: false });
    tex.needsUpdate = true;
    setFace(front, 0, true);
    setFace(back, -Lz, true);
    // tető
    const tp = top.geometry.attributes.position;
    for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), zl = tp.getY(i); const z = -(zl) - Lz / 2 + Lz; const zz = -Lz / 2 - zl; tp.setZ(i, ground3(x, zz)); }
    tp.needsUpdate = true; top.geometry.computeVertexNormals();
    // alaptest
    foot.position.set(0, -st.settle, 0);
    foot.rotation.set(0, 0, 0);
    if (st.tilt) { foot.position.y += 0; foot.rotation.z = -st.tilt; foot.position.x = -(baseY) * Math.sin(-st.tilt) * 0; const c = Math.cos(-st.tilt), s = Math.sin(-st.tilt); foot.position.x = -(0 * c - baseY * s) + 0; foot.position.y = -st.settle - (0 * s + baseY * c) + baseY; }
    load.position.y = Ht * 0.9 - st.settle;
    load.scale.setScalar(0.6 + 0.5 * Math.min(1.1, st.q));
    // csúszólap láthatósága
    const vis = g.mode === 'beny' ? st.slip : st.slip;
    slip.visible = xray && vis > 0.05;
    slip.traverse(m => { if (m.material) m.material.opacity = (m.material.userData.base ?? (m.material.userData.base = m.material.opacity)) * vis; });
    // feliratok
    const showL = st.slip > 0.25 && g.shape !== 'lemez' && g.mode !== 'beny';
    lAct.show = showL; lSlip.show = st.slip > 0.25 && g.mode !== 'beny'; lHeave.show = st.heave > 0.03 * g.B && g.mode === 'alt'; lPl.show = st.plastic > 0.3 && st.slip < 0.3;
    if (g.R) {
      lAct.pos.set(0, baseY + g.R.apex[1] * 0.45, 0.05);
      const sp = g.R.sp[30]; lSlip.pos.set(sp[0], baseY + sp[1], 0.05);
      lHeave.pos.set(g.b + 0.5 * (g.R.G[0] - g.b), st.heave + 0.25, -Lz * 0.05);
      lPl.pos.set(0, baseY - 0.9 * g.B, 0.05);
    } else if (g.local) { const sp = g.local[0].sp[22]; lSlip.pos.set(sp[0], baseY + sp[1], 0.05); lPl.pos.set(g.b - 0.5, baseY - 1.2, 0.05); }
    st3.kick();
  }
  function applyX() {
    const o = xray ? 0.16 : 1;
    [bodyMat, topMat, backMat].forEach(m => { m.transparent = xray; m.opacity = o; m.depthWrite = !xray; m.needsUpdate = true; });
    frontMat.opacity = xray ? 0.55 : 1; frontMat.depthWrite = !xray; frontMat.needsUpdate = true;
    if (slip) slip.visible = xray && st && st.slip > 0.05;
    st3.kick();
  }
  window.addEventListener('toro', e => { if (e.detail && e.detail.rebuild) build(); else update(); });
  build();
  return { setX(v) { xray = v; applyX(); update(); } };
}
(function toroHook() {
  const el = document.getElementById('toro3d'); if (!el) return;
  onVisible(el, () => {
    const T = initToro3D(el);
    const x = document.getElementById('tmXray');
    if (x) { x.addEventListener('change', () => T.setX(x.checked)); T.setX(x.checked); }
  });
})();
