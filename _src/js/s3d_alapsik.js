/* ===== 3D: alapsík-tervező ===== */
function initAlapsik3D(container) {
  const st3 = makeStage(container, { fitAspect: 1.5, fitPow: 1.8, pos: [4.2, 2.2, 13.2], target: [-0.8, -1.5, -1.4], shadows: true, minDist: 7, maxDist: 40, shadowSize: 14, maxPolar: Math.PI * 0.55 });
  const { scene } = st3;
  const X0 = -9, X1 = 9, Z0 = -5, DEP = -5.4;
  const soilG = new THREE.Group(), bldG = new THREE.Group(), nbG = new THREE.Group(), fxG = new THREE.Group();
  scene.add(soilG, bldG, nbG, fxG);
  const M = {
    beton: stdMat(0xffffff, { map: matTex('beton', [2, 2]) }),
    wall: stdMat(0xeceae3, { roughness: 0.95 }),
    wall2: stdMat(0xd8d2c4, { roughness: 0.95 }),
    nb: stdMat(0xc9b79a, { roughness: 0.95 }),
    under: stdMat(0xd0602a, { roughness: 0.7 }),
    win: stdMat(0x5b7488, { roughness: 0.3 }),
    frost: new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.34, depthWrite: false, roughness: 0.2, emissive: 0x3aa8d8, emissiveIntensity: 0.12 }),
    water: new THREE.MeshStandardMaterial({ color: 0x2f6fd0, transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.1 }),
    plane: new THREE.MeshBasicMaterial({ color: 0x86b51c, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    ice: new THREE.MeshStandardMaterial({ color: 0xf4fcff, roughness: 0.15, emissive: 0x9fdcff, emissiveIntensity: 0.3 })
  };
  Object.values(M).forEach(m => m.userData.keep = true);
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.12 }));
  shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = DEP - 0.01; shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
  const L = {
    frost: st3.label('', 'frost'), gw: st3.label('', 'water'), base: st3.label('', 'lime'), fill: st3.label('feltöltés, humusz'), bear: st3.label(''),
    dry: st3.label('kiszáradási határ ≈ 2 m', 'bad'), nb: st3.label(''), under: st3.label('alábetonozás kell!', 'k'), dew: st3.label('víztelenítés kell!', 'water')
  };
  function box(w, h, d, x, y, z, m, e = true) { const b = boxAt(w, h, d, x, y, z, m); if (e) edges(b, 0x1b221e, 0.2); return b; }
  function soilPieces(layers, boxes) {
    const g = new THREE.Group();
    for (const [x0, x1, z0, z1, top, bot] of boxes) {
      const ls = layers.map(l => ({ ...l, top: Math.min(l.top, top), bot: Math.max(l.bot, bot) })).filter(l => l.top - l.bot > 0.001);
      g.add(soilBlock(ls, x0, x1, z0, z1));
    }
    return g;
  }
  let q = Object.assign({}, ALAPSIK.p), winterT = -1, heave = 0;
  let footY = []; // alaptestek alsó síkja (lencsékhez)
  const FX = { frost: null, water: null, plane: null, dry: null, lenses: [] };
  function build() {
    disposeGroup(soilG); disposeGroup(bldG); disposeGroup(nbG); disposeGroup(fxG);
    const bearKind = q.soil === 'kozet' ? 'kozet' : q.soil === 'kotott' ? (q.duzz ? 'duzzado' : 'agyag') : 'kavics';
    const layers = [
      { kind: 'humusz', top: 0, bot: -0.3, topColor: '#5d7f33' },
      { kind: 'feltoltes', top: -0.3, bot: -Math.max(0.31, q.ft) },
      { kind: bearKind, top: -Math.max(0.31, q.ft), bot: DEP }
    ];
    const pince = q.pince === 'teljes';
    const xa = -6.2, xb = 4.0, zb = -3.8;
    let boxes;
    if (pince) {
      const hp = q.hp;
      boxes = [[X0, X1, Z0, 0, -hp, DEP], [X0, xa - 0.2, Z0, 0, 0, -hp], [xb + 0.2, X1, Z0, 0, 0, -hp], [xa - 0.2, xb + 0.2, Z0, zb - 0.2, 0, -hp]];
    } else boxes = [[X0, X1, Z0, 0, 0, DEP]];
    soilG.add(soilPieces(layers, boxes));
    // épület
    const d = q.d;
    const top = pince ? Math.min(-q.hp, -d + 0.5) : Math.min(-0.05, -d + 0.5);
    const bot = Math.min(-d, top - 0.15);
    const fh = Math.max(0.15, top - bot);
    const fcy = (top + bot) / 2;
    const Bf = 0.8;
    const zLen = Math.abs(zb) + 0.02;
    footY = [];
    for (const x of [xa, -1, xb]) { bldG.add(box(Bf, fh, zLen + Bf / 2, x, fcy, (zb - Bf / 2 + 0.02) / 2, M.beton)); footY.push([x, bot]); }
    bldG.add(box(xb - xa + Bf, fh, Bf, (xa + xb) / 2, fcy, zb, M.beton));
    const wallBot = pince ? top : top;
    const wallMat = pince ? M.beton : M.beton;
    // lábazat / pincefal
    for (const x of [xa, xb]) bldG.add(box(0.36, 0.3 - wallBot, zLen, x, (0.3 + wallBot) / 2, zb / 2 + 0.01, wallMat));
    bldG.add(box(xb - xa + 0.36, 0.3 - wallBot, 0.36, (xa + xb) / 2, (0.3 + wallBot) / 2, zb, wallMat));
    bldG.add(box(0.3, 0.3 - wallBot, zLen, -1, (0.3 + wallBot) / 2, zb / 2 + 0.01, wallMat));
    if (pince) bldG.add(box(xb - xa, 0.15, zLen, (xa + xb) / 2, -q.hp + 0.075, zb / 2 + 0.01, M.beton));
    // felmenő falak
    const H1 = 3.1;
    for (const x of [xa, xb]) bldG.add(box(0.36, H1, zLen, x, 0.3 + H1 / 2, zb / 2 + 0.01, M.wall));
    bldG.add(box(xb - xa + 0.36, H1, 0.36, (xa + xb) / 2, 0.3 + H1 / 2, zb, M.wall));
    bldG.add(box(xb - xa + 0.6, 0.25, zLen + 0.3, (xa + xb) / 2, 0.3 + H1, zb / 2 + 0.01, M.wall2));
    bldG.add(box(xb - xa, 0.2, zLen, (xa + xb) / 2, 0.4, zb / 2 + 0.01, M.wall2));
    for (const x of [-4.4, -2.6, 0.8, 2.6]) bldG.add(box(1.0, 1.2, 0.06, x, 1.7, zb - 0.2, M.win, false));
    bldG.userData.baseY = 0;
    // szomszéd
    if (q.szom) {
      const nx0 = 4.6, nx1 = 9;
      const dn = q.dsz;
      nbG.add(box(0.8, 0.5, 4.5, nx0 + 0.3, -dn + 0.25, -2.25 + 0.01, M.beton));
      nbG.add(box(0.4, dn - 0.5 + 0.3, 4.5, nx0 + 0.3, (0.3 + (-dn + 0.5)) / 2, -2.25 + 0.01, M.beton));
      nbG.add(box(nx1 - nx0, 4.4, 4.5, (nx0 + nx1) / 2, 0.3 + 2.2, -2.25 + 0.01, M.nb));
      if (d > dn + 0.1) nbG.add(box(0.8, d - dn, 4.5, nx0 + 0.3, -(dn + d) / 2, -2.25 + 0.02, M.under));
    }
    // fagy
    const fr = frostDepth(q.soil, q.mBf, q.gw - q.d).d;
    FX.frostD = fr;
    FX.frost = box(X1 - X0, 1, -Z0 + 0.03, 0, -0.5, Z0 / 2 + 0.015, M.frost, false);
    FX.frost.castShadow = false; FX.frost.receiveShadow = false;
    fxG.add(FX.frost);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: 0x1595b5 }));
    fl.position.set(0, -fr, 0.04); fxG.add(fl); FX.frostLine = fl;
    // talajvíz
    if (q.gw < -DEP) {
      const h = q.gw + DEP;
      const w = box(X1 - X0, -DEP - q.gw, -Z0 + 0.04, 0, (-q.gw + DEP) / 2, Z0 / 2 + 0.02, M.water, false);
      w.castShadow = false; fxG.add(w);
      const wl = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x2f6fd0 }));
      wl.position.set(0, -q.gw, 0.05); fxG.add(wl);
    }
    // alapsík-sík
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa + 1.2, -zb + 0.8), M.plane);
    pl.rotation.x = -Math.PI / 2; pl.position.set((xa + xb) / 2, -d + 0.005, zb / 2 - 0.2);
    fxG.add(pl);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x86b51c }));
    bl.position.set(0, -d, 0.06); fxG.add(bl);
    if (q.duzz) { const dl = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: 0xd23f2a })); dl.position.set(0, -2, 0.05); fxG.add(dl); }
    // jéglencsék
    FX.lenses = [];
    for (const [x] of footY) {
      const grp = new THREE.Group();
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55 - k * 0.06, 0.55 - k * 0.06, 0.035, 20), M.ice); m.position.y = -k * 0.09; grp.add(m); }
      grp.position.set(x, -d - 0.05, -0.6); grp.visible = false; fxG.add(grp); FX.lenses.push(grp);
    }
    labels(fr);
    applyWinter();
    st3.kick();
  }
  function labels(fr) {
    const r = ALAPSIK.eval(q);
    const lx = -6.6;
    L.frost.set(`fagyhatár −${fmt(fr, 2)} m`); L.frost.pos.set(lx, -fr, 0.1);
    L.gw.set(`talajvíz −${fmt(q.gw, 2)} m`); L.gw.pos.set(lx + 1.6, -q.gw, 0.1); L.gw.show = q.gw < -DEP;
    L.base.set(`alapsík −${fmt(q.d, 2)} m`); L.base.pos.set(-1, -q.d, 0.15);
    L.base.cls(r.ok ? 'lime' : 'bad');
    L.fill.pos.set(5.6, -Math.max(0.31, q.ft) / 2 - 0.1, 0.1);
    L.fill.show = !q.szom;
    L.bear.set(q.soil === 'kozet' ? 'szilárd kőzet' : q.soil === 'kotott' ? (q.duzz ? 'térfogatváltozó agyag' : 'kötött talaj') : 'teherbíró homokos kavics');
    L.bear.pos.set(lx + 1.2, -Math.max(0.31, q.ft) - 1.25, 0.1);
    L.dry.show = q.duzz; L.dry.pos.set(3.8, -2, 0.1);
    L.nb.show = q.szom; L.nb.set(`szomszéd alapsíkja −${fmt(q.dsz, 2)} m`); L.nb.pos.set(6.4, -q.dsz - 0.25, 0.1);
    L.under.show = q.szom && q.d > q.dsz + 0.1; L.under.pos.set(5.8, -(q.dsz + q.d) / 2, 0.15);
    L.dew.show = q.d > q.gw; L.dew.pos.set(-3.5, -q.gw - 0.35, 0.15);
  }
  function applyWinter() {
    const fr = FX.frostD;
    let z = fr;
    if (winterT >= 0) z = fr * Math.sin(Math.PI * clamp(winterT, 0, 1));
    FX.frost.scale.y = Math.max(0.001, z);
    FX.frost.position.y = -z / 2;
    FX.frost.material.opacity = winterT >= 0 ? 0.5 : 0.26;
    // jéglencsék és emelés
    const susceptible = q.soil === 'kotott' && q.pince !== 'teljes';
    const pen = susceptible ? Math.max(0, z - q.d) : 0;
    heave = winterT >= 0 ? Math.min(0.35, pen * 1.6) : 0;
    bldG.position.y = heave;
    FX.lenses.forEach(g => { g.visible = heave > 0.01; g.scale.setScalar(0.6 + Math.min(1, pen * 4)); g.position.y = -q.d - 0.04; });
  }
  st3.onFrame(dt => {
    if (winterT >= 0) {
      winterT += dt / 8;
      if (winterT >= 1) { winterT = -1; const b = document.getElementById('aWinter'); if (b) b.textContent = '❄ Tél: fagy és jéglencsék'; }
      applyWinter();
    }
  });
  window.addEventListener('alapsik', e => { q = Object.assign({}, e.detail); build(); });
  build();
  return { winter() { winterT = 0; st3.kick(); } };
}
(function alapsikHook() {
  const el = document.getElementById('alapsik3d'); if (!el) return;
  onVisible(el, () => {
    const A = initAlapsik3D(el);
    const b = document.getElementById('aWinter');
    if (b) b.addEventListener('click', () => { A.winter(); b.textContent = '❄ tél folyamatban…'; });
  });
})();
