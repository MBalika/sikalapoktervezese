/* ===== 3D: alapsík-tervező ===== */
function initAlapsik3D(container) {
  const st3 = makeStage(container, { fitAspect: 1.5, fitPow: 1.8, pos: [4.6, 2.9, 15.6], target: [-0.8, -0.35, -1.4], shadows: true, minDist: 7, maxDist: 40, shadowSize: 14, maxPolar: Math.PI * 0.55 });
  const { scene } = st3;
  const X0 = -9, X1 = 9, Z0 = -5, DEP = -5.4;
  const soilG = new THREE.Group(), bldG = new THREE.Group(), nbG = new THREE.Group(), fxG = new THREE.Group();
  scene.add(soilG, bldG, nbG, fxG);
  const M = {
    beton: stdMat(0xffffff, { map: matTex('beton', [2, 2]) }),
    wall: stdMat(0xffffff, { map: matTex('vakolat', [3, 2]), roughness: 0.95 }),
    brick: stdMat(0xffffff, { map: matTex('tegla', [1, 5]) }),
    roof: stdMat(0xffffff, { map: matTex('cserep', [7, 4]), roughness: 0.8 }),
    frame: stdMat(0xf7f5ee, { roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9cc4dc, roughness: 0.15, metalness: 0.1, emissive: 0x6fa6c4, emissiveIntensity: 0.25 }),
    door: stdMat(0x7a5236, { roughness: 0.7 }),
    wall2: stdMat(0xd8d2c4, { roughness: 0.95 }),
    nb: stdMat(0xd9c9ad, { map: matTex('vakolat', [2, 2]), roughness: 0.95 }),
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
    // felmenő falak: vakolt téglafalak, az elmetszett falvégeken látszik a tégla
    const H1 = 2.9, y0w = 0.3;
    const sideWall = x => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.36, H1, zLen), [M.wall, M.wall, M.wall, M.wall, M.brick, M.wall]); m.position.set(x, y0w + H1 / 2, zb / 2 + 0.01); m.castShadow = m.receiveShadow = true; edges(m, 0x1b221e, 0.2); return m; };
    for (const x of [xa, xb]) bldG.add(sideWall(x));
    bldG.add(box(xb - xa + 0.36, H1, 0.36, (xa + xb) / 2, y0w + H1 / 2, zb, M.wall));
    bldG.add(box(xb - xa, 0.2, zLen, (xa + xb) / 2, 0.4, zb / 2 + 0.01, M.wall2));            // földszinti padló
    bldG.add(box(xb - xa + 0.36, 0.22, zLen, (xa + xb) / 2, y0w + H1 + 0.11, zb / 2 + 0.01, M.wall2)); // zárófödém
    // ablakok és ajtó a hátsó falon (belülről látszanak)
    const zi = zb + 0.185;
    for (const x of [-4.6, -2.7, 2.5]) { bldG.add(box(1.16, 1.36, 0.05, x, 1.75, zi, M.frame, false)); bldG.add(box(1.0, 1.2, 0.06, x, 1.75, zi + 0.01, M.glass, false)); bldG.add(box(0.05, 1.2, 0.07, x, 1.75, zi + 0.012, M.frame, false)); }
    bldG.add(box(1.06, 2.16, 0.05, 0.6, 0.5 + 1.08, zi, M.frame, false)); bldG.add(box(0.94, 2.05, 0.06, 0.6, 0.5 + 1.03, zi + 0.01, M.door, false));
    // nyeregtető (a gerinc a metszetre merőleges): cserép, oromfal, kémény
    const yE = y0w + H1 + 0.22, half = (xb - xa) / 2 + 0.6, rise = 1.75, cx0 = (xa + xb) / 2, ang = Math.atan2(rise, half);
    for (const sg of [-1, 1]) {
      const hx = sg > 0 && q.szom ? (xb - xa) / 2 + 0.2 : half, ry = rise * hx / half, sl = Math.hypot(hx, ry); // a szomszéd felőli oldalon nincs eresztúlnyúlás (tűzfal)
      const r = new THREE.Mesh(new THREE.BoxGeometry(sl + 0.12, 0.16, zLen + 0.5), [M.wall2, M.wall2, M.roof, M.wall2, M.wall2, M.wall2]);
      r.position.set(cx0 + sg * hx / 2, yE + rise - ry / 2 + 0.05, zb / 2 - 0.2); r.rotation.z = -sg * ang; r.castShadow = r.receiveShadow = true; edges(r, 0x1b221e, 0.2); bldG.add(r);
    }
    const gs = new THREE.Shape([new THREE.Vector2(-half + 0.55, 0), new THREE.Vector2(half - 0.55, 0), new THREE.Vector2(0, rise * (half - 0.55) / half)]);
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: 0.36, bevelEnabled: false }), M.wall); gable.position.set(cx0, yE, zb - 0.18); gable.castShadow = true; bldG.add(gable);
    bldG.add(box(0.5, 1.5, 0.5, cx0 + 2.4, yE + rise * 0.55 + 0.5, zb / 2 - 0.9, M.brick));
    bldG.userData.baseY = 0;
    // szomszéd
    if (q.szom) {
      const nx0 = 4.6, nx1 = 9;
      const dn = q.dsz;
      nbG.add(box(0.8, 0.5, 4.5, nx0 + 0.3, -dn + 0.25, -2.25 + 0.01, M.beton));
      nbG.add(box(0.4, dn - 0.5 + 0.3, 4.5, nx0 + 0.3, (0.3 + (-dn + 0.5)) / 2, -2.25 + 0.01, M.beton));
      nbG.add(box(nx1 - nx0, 5.6, 4.5, (nx0 + nx1) / 2, 0.3 + 2.8, -2.25 + 0.01, M.nb));
      for (const y of [0.42, 3.1, 5.78]) nbG.add(box(nx1 - nx0 + 0.02, 0.24, 4.52, (nx0 + nx1) / 2, y, -2.25 + 0.01, M.wall2, false)); // födémek a metszeten
      for (const y of [1.75, 4.45]) for (const x of [5.9, 7.7]) { nbG.add(box(1.0, 1.3, 0.05, x, y, 0.035, M.frame, false)); nbG.add(box(0.86, 1.16, 0.06, x, y, 0.04, M.glass, false)); }
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
    const lx = -6.9;
    L.frost.set(`fagyhatár −${fmt(fr, 2)} m`); L.frost.pos.set(lx, -fr, 0.1);
    L.gw.set(`talajvíz −${fmt(q.gw, 2)} m`); L.gw.pos.set(lx + 2.5, -q.gw, 0.1); L.gw.show = q.gw < -DEP;
    L.base.set(`alapsík −${fmt(q.d, 2)} m`); L.base.pos.set(-1.2, -q.d, 0.15);
    L.base.cls(r.ok ? 'lime' : 'bad');
    L.fill.pos.set(5.6, -Math.max(0.31, q.ft) / 2 - 0.1, 0.1);
    L.fill.show = !q.szom;
    L.bear.set(q.soil === 'kozet' ? 'szilárd kőzet' : q.soil === 'kotott' ? (q.duzz ? 'térfogatváltozó agyag' : 'kötött talaj') : 'teherbíró homokos kavics');
    L.bear.pos.set(lx + 1.2, -Math.max(0.31, q.ft) - 1.25, 0.1);
    L.dry.show = q.duzz; L.dry.pos.set(3.8, -2, 0.1);
    L.nb.show = q.szom; L.nb.set(`szomszéd alapsíkja −${fmt(q.dsz, 2)} m`); L.nb.pos.set(6.4, -q.dsz - 0.25, 0.1);
    L.under.show = q.szom && q.d > q.dsz + 0.1; L.under.pos.set(5.8, -(q.dsz + q.d) / 2, 0.15);
    L.dew.show = q.d > q.gw; L.dew.pos.set(1.7, -q.gw - 0.02, 0.15);
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
