/* ===== 3D közös: színpad, textúrák, feliratok (three.js r169) ===== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
window.THREE = THREE;

const DARK = () => (typeof isDark === 'function' ? isDark() : false);

function makeStage(container, o = {}) {
  const W = () => Math.max(10, container.clientWidth), Hh = () => Math.max(10, container.clientHeight);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), Hh());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !!o.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(o.fov || 38, W() / Hh(), 0.1, 400);
  camera.position.set(...(o.pos || [14, 9, 16]));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...(o.target || [0, -0.5, 0]));
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = o.minDist || 6;
  controls.maxDistance = o.maxDist || 60;
  controls.maxPolarAngle = o.maxPolar || Math.PI * 0.52;
  controls.enablePan = !!o.pan;
  controls.autoRotate = !!o.autoRotate;
  controls.autoRotateSpeed = o.autoRotateSpeed || 0.8;
  controls.update();
  // fények
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(10, 18, 12);
  if (o.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const s = o.shadowSize || 16;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 60 });
    sun.shadow.bias = -0.0008;
  }
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.45);
  fill.position.set(-12, 6, -8);
  scene.add(fill);

  // feliratréteg
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  container.appendChild(layer);
  const labels = [];
  function label(text, cls = '', pos = [0, 0, 0]) {
    const el = document.createElement('div');
    el.className = 'lbl3d ' + cls;
    el.textContent = text;
    layer.appendChild(el);
    const L = { el, pos: new THREE.Vector3(...pos), show: true, set(t) { if (el.textContent !== t) el.textContent = t; }, cls(c) { el.className = 'lbl3d ' + c; } };
    labels.push(L);
    return L;
  }
  const v = new THREE.Vector3();
  function updateLabels() {
    const w = W(), h = Hh();
    for (const L of labels) {
      if (!L.show) { L.el.style.display = 'none'; continue; }
      v.copy(L.pos).project(camera);
      if (v.z > 1 || v.z < -1) { L.el.style.display = 'none'; continue; }
      L.el.style.display = '';
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      L.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    }
  }
  const updaters = [];
  let visible = false, running = false, last = performance.now();
  function loop(now) {
    if (!visible || document.hidden) { running = false; return; }
    running = true;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const f of updaters) f(dt, now / 1000);
    controls.update();
    renderer.render(scene, camera);
    updateLabels();
    requestAnimationFrame(loop);
  }
  function kick() { if (!running && visible) { last = performance.now(); requestAnimationFrame(loop); } }
  const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); kick(); }, { rootMargin: '80px' });
  io.observe(container);
  document.addEventListener('visibilitychange', kick);
  const baseDist = camera.position.distanceTo(controls.target);
  const ro = new ResizeObserver(() => {
    renderer.setSize(W(), Hh());
    camera.aspect = W() / Hh();
    camera.updateProjectionMatrix();
    if (o.fitAspect) {
      // keskeny (mobil) vásznon távolabb áll a kamera, hogy a jelenet kiférjen
      const k = Math.max(1, Math.pow(o.fitAspect / camera.aspect, o.fitPow || 0.9));
      const dir = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(dir, baseDist * k);
      controls.update();
    }
    renderer.render(scene, camera);
    updateLabels();
  });
  ro.observe(container);
  // felhasználói interakció leállítja az automatikus forgatást
  if (o.autoRotate) {
    let tmo;
    renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; clearTimeout(tmo); tmo = setTimeout(() => controls.autoRotate = true, 9000); });
  }
  return { THREE, scene, camera, renderer, controls, label, labels, onFrame: f => updaters.push(f), kick, layer, sun, hemi };
}

/* ---------- eljárásos textúrák ---------- */
const TEX = {};
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(key, w, h, draw, rep = [1, 1]) {
  const k = key + rep.join('x');
  if (TEX[k]) return TEX[k];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  TEX[k] = t;
  return t;
}
const SOILCOL = {
  humusz: '#4e3b2a', feltoltes: '#7a6a58', homok: '#d8b97c', kavics: '#bfa37a', agyag: '#a87b57', iszap: '#9c8b70', kozet: '#8e9196', duzzado: '#9a6e4e', lösz: '#d6b98a'
};
function soilTex(kind, rep = [1, 1]) {
  return canvasTex('soil-' + kind, 256, 256, (g, w, h) => {
    const r = rnd(kind.length * 977 + 13);
    g.fillStyle = SOILCOL[kind] || '#c8a878';
    g.fillRect(0, 0, w, h);
    if (kind === 'homok' || kind === 'lösz' || kind === 'iszap') {
      for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < .5 ? '90,60,30' : '255,240,210'},${0.12 + r() * 0.18})`; g.fillRect(r() * w, r() * h, 1.6, 1.6); }
    } else if (kind === 'kavics') {
      for (let i = 0; i < 140; i++) { const x = r() * w, y = r() * h, rr = 2 + r() * 6; g.fillStyle = `hsl(${30 + r() * 20},${15 + r() * 15}%,${45 + r() * 25}%)`; g.beginPath(); g.ellipse(x, y, rr, rr * (0.6 + r() * 0.4), r() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,20,.35)'; g.stroke(); }
    } else if (kind === 'agyag' || kind === 'duzzado') {
      g.strokeStyle = 'rgba(70,40,20,.28)'; g.lineWidth = 1.4;
      for (let y = 6; y < h; y += 11) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 1.5); g.stroke(); }
      if (kind === 'duzzado') { g.strokeStyle = 'rgba(40,20,10,.55)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { let x = r() * w, y = r() * h * 0.6; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 14; y += 7 + r() * 8; g.lineTo(x, y); } g.stroke(); } }
    } else if (kind === 'humusz') {
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < .5 ? '20,14,8' : '120,96,60'},${0.25 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 2, 2); }
      g.strokeStyle = 'rgba(160,130,90,.5)'; for (let i = 0; i < 20; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y + 10, x + (r() - .5) * 20, y + 22); g.stroke(); }
    } else if (kind === 'feltoltes') {
      for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < 0.4 ? '#a5452f' : r() < 0.6 ? '#c8c2b5' : '#4b4036'; g.save(); g.translate(x, y); g.rotate(r() * 3); g.fillRect(-3 - r() * 6, -2 - r() * 3, 6 + r() * 10, 4 + r() * 5); g.restore(); }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(30,25,20,${0.15 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    } else if (kind === 'kozet') {
      g.strokeStyle = 'rgba(40,44,50,.45)'; g.lineWidth = 2;
      for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 90; y += (r() - .5) * 60; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2, 2); }
    }
  }, rep);
}
function matTex(kind, rep = [1, 1]) {
  return canvasTex('mat-' + kind, 256, 256, (g, w, h) => {
    const r = rnd(kind.length * 31 + 7);
    if (kind === 'beton') {
      g.fillStyle = '#b4b5b0'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(${r() < .5 ? '60,60,60' : '240,240,235'},${0.06 + r() * 0.1})`; g.fillRect(r() * w, r() * h, 2, 2); }
    } else if (kind === 'tegla') {
      g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, w, h);
      const bh = 32, bw = 64;
      for (let row = 0; row * bh < h; row++) for (let col = -1; col * bw < w; col++) {
        const x = col * bw + (row % 2 ? bw / 2 : 0), y = row * bh;
        g.fillStyle = `hsl(${10 + r() * 8},${48 + r() * 12}%,${38 + r() * 9}%)`;
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    } else if (kind === 'ko') {
      g.fillStyle = '#cfc9bd'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.fillStyle = `hsl(${30 + r() * 20},${8 + r() * 10}%,${42 + r() * 22}%)`; g.beginPath(); const n = 6 + (r() * 3 | 0), R = 14 + r() * 20; for (let k = 0; k < n; k++) { const a = k / n * 6.283, rr = R * (0.7 + r() * 0.4); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,50,40,.4)'; g.stroke(); }
    } else if (kind === 'uszt') {
      g.fillStyle = '#b4b5b0'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(60,60,60,${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 2, 2); }
      for (let i = 0; i < 22; i++) { const x = r() * w, y = h * 0.35 + r() * h * 0.6; g.fillStyle = `hsl(${30 + r() * 20},${10 + r() * 10}%,${45 + r() * 20}%)`; g.beginPath(); g.ellipse(x, y, 10 + r() * 14, 7 + r() * 9, r() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(50,40,30,.35)'; g.stroke(); }
    } else if (kind === 'panel') {
      g.fillStyle = '#e4e1d8'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(80,80,80,.55)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
      g.fillStyle = 'rgba(70,90,110,.55)'; g.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.36);
    } else if (kind === 'ablak') {
      g.fillStyle = '#ecebe6'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(60,84,104,.6)'; for (let i = 0; i < 4; i++) g.fillRect(i * 64 + 10, 40, 44, 150);
      g.fillStyle = 'rgba(120,120,120,.35)'; g.fillRect(0, 226, w, 30);
    }
  }, rep);
}
function stdMat(color, o = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.88, metalness: 0.02 }, o));
}
function boxAt(w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function edges(mesh, color = 0x1b221e, opacity = 0.28) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  mesh.add(e);
  return e;
}
function arrow3(len, color, rad = 0.06) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: color, emissiveIntensity: 0.25 });
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len * 0.75, 10), m);
  sh.position.y = len * 0.375 + len * 0.25;
  const hd = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.6, len * 0.25, 14), m);
  hd.rotation.x = Math.PI; hd.position.y = len * 0.125;
  g.add(sh, hd);
  return g;
}
function disposeGroup(g) {
  g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m && !(m.userData && m.userData.keep)) { if (m.map && m.map.userData && m.map.userData.own) m.map.dispose(); m.dispose(); } }); } });
  while (g.children.length) g.remove(g.children[0]);
}
/* talajtömb rétegekből: layers = [{kind, top, bot}] (y lefelé negatív) */
function soilBlock(layers, x0, x1, z0, z1, o = {}) {
  const grp = new THREE.Group();
  for (const L of layers) {
    const h = L.top - L.bot; if (h <= 0.001) continue;
    const t = soilTex(L.kind, [(x1 - x0) / 3, Math.max(1, h / 3)]);
    const tz = soilTex(L.kind, [(z1 - z0) / 3, Math.max(1, h / 3)]);
    const mats = [];
    const side = new THREE.MeshStandardMaterial({ map: tz, roughness: 0.95, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: o.opacity ? false : true });
    const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: o.opacity ? false : true });
    const top = new THREE.MeshStandardMaterial({ color: L.topColor || SOILCOL[L.kind], roughness: 1, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: o.opacity ? false : true });
    mats.push(side, side, top, top, face, face);
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), mats);
    m.position.set((x0 + x1) / 2, (L.top + L.bot) / 2, (z0 + z1) / 2);
    m.receiveShadow = true;
    m.userData.layer = L;
    grp.add(m);
  }
  return grp;
}
