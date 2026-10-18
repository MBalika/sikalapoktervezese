/* ===== Síkalapok tervezése – közös motor ===== */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
function fmt(v, d = 2) {
  if (!isFinite(v)) return '–';
  const s = Math.abs(v).toFixed(d).replace('.', ',');
  return (v < -1e-9 ? '−' : '') + s;
}
function cssv(name, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}
const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) {
    if (k === 'text') e.textContent = attrs[k];
    else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}
function H(tag, attrs = {}, parent) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'html') e.innerHTML = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k === 'cls') e.className = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}
function onVisible(el, fn, margin = '250px') {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margin });
  io.observe(el);
}
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

/* ---------- Téma ---------- */
(function theme() {
  const saved = store('sikt-theme');
  if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
  const btn = $('#themeBtn');
  const label = () => { if (btn) btn.textContent = isDark() ? 'Világos téma' : 'Sötét téma'; };
  label();
  if (btn) btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store('sikt-theme', next);
    label();
    window.dispatchEvent(new Event('themechange'));
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { label(); window.dispatchEvent(new Event('themechange')); });
})();

/* ---------- Csúszkák kitöltése ---------- */
function rangeFill(el) {
  const p = (el.value - el.min) / ((el.max - el.min) || 1) * 100;
  el.style.setProperty('--p', p + '%');
}
document.addEventListener('input', e => { if (e.target.matches && e.target.matches('input[type=range]')) rangeFill(e.target); });
function initRanges(root = document) { $$('input[type=range]', root).forEach(rangeFill); }

/* ---------- Formázás: nem törő egységek + magyar elválasztás ---------- */
const GUARD = (() => {
  const NB = '\u00A0', WJ = '\u2060', NNB = '\u202F', NBH = '\u2011', SHY = '\u00AD';
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'svg', 'SVG', 'CANVAS', 'SELECT', 'OPTION']);
  const BLOCK = 'main p, main li, main dd, main dt, main figcaption, main .note, main h1, main h2, main h3, main h4, main h5, main .fb, main td, main th, main .qq, main .stmt, main .sit, main label, main .cap, main .callout > b, main .kpi > div, main .verdict, main button, main .lead, footer p, footer li, .eq .w > div, .metro .st span';
  const HYPH = 'main p, main li, main dd, main figcaption, main .note, main .fb, main .lead, main .just, footer p, .eq .w > div';
  const NOHY = 'sub, sup, code, button, label, output, td, th, .nw, .formula, h1, h2, h3, h4, h5, .kpi, .chips, .seg, .mono, .pill, .tag';
  const TERMS = ['kedvező esetleges', 'esetleges teher', 'állandó teher', 'kritikus állapotbeli súrlódási szög', 'drénezetlen nyírószilárdság', 'belső súrlódási szög', 'hasznos szélesség', 'passzív földellenállás', 'tervezési érték', 'karakterisztikus érték', 'parciális tényező', 'általános állékonyság', 'általános nyírási törés', 'helyi nyírási törés', 'teherbíró réteg', 'alapozási sík', 'relatív tömörség', 'téli talajvízszint', 'roskadékony talaj', 'szerves talaj', 'aktív ék', 'passzív ék', 'plasztikus zóna', 'térszíni lemezalap', 'mélyített síkalap', 'vegyes alapozás'];
  const termRx = new RegExp('(' + TERMS.sort((a, b) => b.length - a.length).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \\u00A0]')).join('|') + ')', 'giu');
  const MULT_SYM = /^(tg|ctg|sin|cos|tan|exp|ln|log)\b/;
  const NUMW = /(^|[\s(\u00A0\u2060„])((?:[Kk]ét|[Hh]árom|[Nn]égy|[Öö]t|[Hh]at|[Hh]ét|[Nn]yolc|[Kk]ilenc|[Tt]íz|[Hh]úsz|[Ss]záz|[Ee]zer|[Ee]lső|[Mm]ásodik|[Hh]armadik|[Nn]egyedik|[Öö]tödik|[Hh]atodik|[Hh]etedik|[Nn]yolcadik|[Kk]ilencedik|[Tt]izedik|[Mm]indkét|[Mm]indhárom|[Nn]éhány|[Ee]gyik|[Kk]ettő|[Hh]armincnyolc|[Nn]egyven|[Hh]etven))(?=\s\S)\s/g;
  function textPass(s) {
    if (!/[ \-–·]/.test(s)) return s;
    // ezres tagolás
    s = s.replace(/(^|[^\d,.])(\d{1,3}) (\d{3})(?!\d)/g, '$1$2' + NNB + '$3');
    // operátorok
    s = s.replace(/ ([=≤≥≈→←×±<>⇒]) /g, NB + '$1' + NB);
    s = s.replace(/([\p{N}\p{L})\]′″]) ([+−]) (?=[\p{N}\p{L}(])/gu, '$1' + NB + '$2' + NB);
    s = s.replace(/ \/ /g, NB + '/' + NB);
    // a · kettős szerepe
    s = s.replace(/ · (?=(\S+))/g, (m, nxt) => {
      const w = nxt.replace(/^[(„"]/, '');
      if (/^\p{L}{3,}/u.test(w) && !MULT_SYM.test(w)) return m;
      return NB + '·' + NB;
    });
    // azonosítók
    s = s.replace(/(\d)-(\d)/g, '$1' + NBH + '$2');
    s = s.replace(/\b([A-Z]{2,5})-(\d)/g, '$1' + NBH + '$2');
    s = s.replace(/\b(MSZ|EN|ISO|DIN|ASCE|IRC|FprEN|prEN) (?=[A-Z\d])/g, '$1' + NB);
    s = s.replace(/(\S)–(\S)/g, '$1' + WJ + '–' + WJ + '$2');
    // függvénynév + argumentum
    s = s.replace(/\b(tg|ctg|sin|cos|tan|ln|log|exp) /g, '$1' + NB);
    // rövidítések
    s = s.replace(/(^|[\s(\u00A0])(pl\.|kb\.|ill\.|ún\.|max\.|min\.|ld\.|vö\.|cca\.|átl\.|ill|ún|kb) (?=\S)/g, '$1$2' + NB);
    // szám + mértékegység / szó; magában álló szám
    s = s.replace(/(^|[\s(\u00A0\u2060~≈≤≥=<>−+])(\d+(?:[,.]\d+)?\.?%?) (?=\S)/g, '$1$2' + NB);
    s = s.replace(/(^|[\s(\u00A0\u2060~≈≤≥=<>−+])(\d+(?:[,.]\d+)?\.?%?) (?=\S)/g, '$1$2' + NB);
    // névelők, rövid kötőszavak
    for (let i = 0; i < 2; i++) s = s.replace(/(^|[\s(\u00A0\u2060„])(a|az|A|Az|s|e|egy|Egy|és|És) (?=\S)/g, '$1$2' + NB);
    // betűvel írt számnév + amit számlál
    s = s.replace(NUMW, '$1$2' + NB);
    // utótagos kötőjel (30°-nál, RFA-n, 1173-ban)
    s = s.replace(/([\d°′″%)\]\p{Lu}\u2080-\u2089])-(\p{Ll}{1,6})(?=$|[\s.,;:!?)”\u00A0\u2060])/gu, '$1' + NBH + '$2');
    return s;
  }
  function bindPositions(full, cpl = 70) {
    const bind = new Set();
    const segMax = Math.max(14, Math.min(38, 0.42 * cpl)), parMax = Math.max(10, Math.min(24, 0.30 * cpl));
    const mark = (a, b) => { for (let i = a; i < b; i++) if (full[i] === ' ') bind.add(i); };
    // tagolás · ; – mentén
    const sepRx = / · |; | – /g;
    let last = 0, m, lastSep = '';
    const segs = [];
    while ((m = sepRx.exec(full))) { segs.push([last, m.index, lastSep, m[0]]); last = m.index + m[0].length; lastSep = m[0]; }
    segs.push([last, full.length, lastSep, '']);
    if (segs.length > 1) {
      for (const [a, b, before, after] of segs) {
        const t = full.slice(a, b).trim();
        // felsorolás-tag (· ;) ~38 karakterig; gondolatjel mellett csak rövid címke vagy verdikt
        const dashOnly = (before === ' – ' || before === '') && (after === ' – ' || after === '') && (before || after);
        const lim = dashOnly ? Math.min(22, segMax) : segMax;
        if (t.length > 0 && t.length < lim) mark(a, b);
      }
    }
    // rövid zárójeles rész
    const pr = /\(([^()]{1,30})\)/g;
    while ((m = pr.exec(full))) { if (m[0].length <= parMax) mark(m.index, m.index + m[0].length); }
    // szakkifejezések
    termRx.lastIndex = 0;
    while ((m = termRx.exec(full))) mark(m.index, m.index + m[0].length);
    // címke: érték
    const lv = /(\p{L}[\p{L}\p{N}′_]{1,22}): ([\d−+±≤≥=<>~≈α-ωΑ-Ω]\S{0,9}(?:[ \u00A0][^\s;·]{1,7})?)(?=$|[;,.·)\s])/gu;
    while ((m = lv.exec(full))) { if (m[0].length <= 34) mark(m.index, m.index + m[0].length); }
    return bind;
  }
  function textNodes(root) {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        let p = n.parentNode;
        while (p && p !== root) { if (SKIP.has(p.nodeName) || (p.dataset && p.dataset.noguard !== undefined)) return NodeFilter.FILTER_REJECT; p = p.parentNode; }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n; while ((n = w.nextNode())) out.push(n);
    return out;
  }
  let hyph = null;
  const done = new WeakMap();
  function processBlock(el) {
    if (!el.isConnected) return;
    if (el.closest('[data-noguard]')) return;
    const cur = el.textContent;
    if (done.get(el) === cur) return;
    const nodes = textNodes(el);
    for (const n of nodes) { const v = textPass(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    // blokk-szintű kötés
    const full = nodes.map(n => n.nodeValue).join('');
    // sorhossz karakterben: a doboz szélességéhez igazodó „rövid” határ
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    const cpl = el.clientWidth > 40 ? el.clientWidth / (fs * 0.52) : 70;
    const bind = bindPositions(full, cpl);
    if (bind.size) {
      let off = 0;
      for (const n of nodes) {
        const v = n.nodeValue; let o = '', ch = false;
        for (let i = 0; i < v.length; i++) {
          if (v[i] === ' ' && bind.has(off + i)) { o += NB + WJ; ch = true; } else o += v[i];
        }
        off += v.length;
        if (ch) n.nodeValue = o;
      }
    }
    if (hyph && el.matches(HYPH)) {
      for (const n of textNodes(el)) {
        if (n.parentElement && n.parentElement.closest(NOHY) && n.parentElement.closest(NOHY) !== el) continue;
        const parts = n.nodeValue.split(/( )/);
        let ch = false;
        for (let i = 0; i < parts.length; i += 2) {
          const t = parts[i];
          if (!t || !/\p{L}{6,}/u.test(t)) continue;
          const clean = t.replace(/\u00AD/g, '');
          let h;
          if (t.includes(WJ)) {
            // 16 karakternél hosszabb kötött csoport: csak az utolsó szava választható el
            const vis = clean.replace(/[\u2060]/g, '');
            if (vis.length <= 16) continue;
            const k = Math.max(clean.lastIndexOf('\u00A0'), clean.lastIndexOf(WJ));
            const tail = clean.slice(k + 1);
            if (!/\p{L}{6,}/u.test(tail)) continue;
            h = clean.slice(0, k + 1) + hyph(tail);
          } else h = hyph(clean);
          if (h !== t) { parts[i] = h; ch = true; }
        }
        if (ch) n.nodeValue = parts.join('');
      }
    }
    done.set(el, el.textContent);
  }
  let obs = null, pend = new Set(), sched = false;
  function run(root = document.body) {
    const set = new Set();
    if (root.matches && root.matches(BLOCK)) set.add(root);
    $$(BLOCK, root).forEach(e => set.add(e));
    if (obs) obs.disconnect();
    set.forEach(processBlock);
    if (obs) { obs.takeRecords(); observe(); }
  }
  function observe() { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  function flush() {
    sched = false;
    const roots = Array.from(pend); pend.clear();
    if (obs) obs.disconnect();
    for (const r of roots) {
      if (!r.isConnected) continue;
      const blk = r.closest ? r.closest(BLOCK) : null;
      if (blk) processBlock(blk);
      if (r.querySelectorAll) $$(BLOCK, r).forEach(processBlock);
    }
    if (obs) { obs.takeRecords(); observe(); }
  }
  function start() {
    run();
    obs = new MutationObserver(recs => {
      for (const r of recs) {
        const t = r.type === 'characterData' ? r.target.parentElement : r.target;
        if (t) pend.add(t);
      }
      if (!sched) { sched = true; requestAnimationFrame(flush); }
    });
    observe();
    // Hyphenopoly
    const H = window.Hyphenopoly;
    if (H && H.hyphenators && H.hyphenators.hu) {
      H.hyphenators.hu.then(fn => { hyph = s => fn(s); const all = $$(HYPH); all.forEach(e => done.delete(e)); run(); }).catch(() => {});
    }
  }
  // vászonra szánt szöveg őrzése
  function text(s, cpl = 60) {
    let v = textPass(s);
    const bind = bindPositions(v, cpl);
    if (bind.size) v = Array.from(v).map((c, i) => (c === ' ' && bind.has(i)) ? NB + WJ : c).join('');
    return v;
  }
  return { start, run, text, textPass };
})();

/* vászon-tördelő: csak sima szóközön tör */
function wrapText(ctx, str, maxW) {
  const s = GUARD.text(str);
  const words = s.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t.replace(/\u2060/g, '')).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.map(l => l.replace(/\u2060/g, ''));
}

/* ---------- Modál: videó és kép ---------- */
const MODAL = (() => {
  let m, frame, title, cap;
  function ensure() {
    if (m) return;
    m = H('div', { cls: 'modal', role: 'dialog', 'aria-modal': 'true' }, document.body);
    const box = H('div', { cls: 'box' }, m);
    const mh = H('div', { cls: 'mh' }, box);
    title = H('span', {}, mh);
    H('button', { cls: 'pbtn', type: 'button', text: 'Bezárás (Esc)', onclick: close }, mh);
    frame = H('div', { cls: 'frame' }, box);
    cap = H('div', { cls: 'cap' }, box);
    m.addEventListener('click', e => { if (e.target === m) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && m.classList.contains('open')) close(); });
  }
  function open() { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { m.classList.remove('open'); frame.innerHTML = ''; document.body.style.overflow = ''; }
  function video(id, t, short, note) {
    ensure();
    title.textContent = t || 'Videó';
    frame.className = 'frame v' + (short ? ' short' : '');
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${(t || 'Videó').replace(/"/g, '')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    cap.textContent = note || 'Külső YouTube-videó (adatkímélő beágyazás).';
    open();
  }
  function img(src, t) {
    ensure();
    title.textContent = t || '';
    frame.className = 'frame';
    frame.innerHTML = '';
    H('img', { src, alt: t || '' }, frame);
    cap.textContent = 'Kép: az előadás diáiból (Dr. Móczár Balázs, BME).';
    open();
  }
  return { video, img, close };
})();
document.addEventListener('click', e => {
  const v = e.target.closest('[data-yt]');
  if (v) { e.preventDefault(); MODAL.video(v.dataset.yt, v.dataset.title, v.dataset.short !== undefined, v.dataset.note); return; }
  const g = e.target.closest('[data-img]');
  if (g) { e.preventDefault(); MODAL.img(g.dataset.img, g.dataset.title); }
});

/* ---------- Eredmény-összesítő ---------- */
const SCORE = {
  data: {},
  set(key, ok, n) { this.data[key] = { ok, n }; try { localStorage.setItem('sikt-score', JSON.stringify(this.data)); } catch (e) {} this.render(); },
  load() { try { this.data = JSON.parse(localStorage.getItem('sikt-score') || '{}') || {}; } catch (e) { this.data = {}; } },
  render() {
    const el = $('#scoreBoard'); if (!el) return;
    const names = { q1: '01 Síkalap vagy mélyalap?', q2: '02 Alaptípusok', g2: '02 Melyik alaptípus? (játék)', q3: '03 A tervezés menete', q4: '04 Az alapsík', g4: '04 Alapsík-detektív', q5: '05 Határállapotok', g5: '05 Melyik határállapot? (játék)', q6: '06 Talajtörés', tf: '07 Igaz vagy hamis?' };
    el.innerHTML = '';
    let so = 0, sn = 0;
    for (const k in names) {
      const d = this.data[k];
      const row = H('div', { cls: 'kpi' }, el);
      const c = H('div', {}, row);
      H('small', { text: names[k] }, c);
      H('b', { text: d ? `${d.ok} / ${d.n}` : 'még nincs' }, c);
      if (d) { so += d.ok; sn += d.n; }
    }
    const t = $('#scoreTotal'); if (t) t.textContent = sn ? `${so} / ${sn} (${Math.round(so / sn * 100)} %)` : '–';
  }
};
SCORE.load();

/* ---------- Kvíz ---------- */
function renderQuiz(el, cfg) {
  if (!el) return;
  el.classList.add('quiz');
  el.innerHTML = '';
  const hd = H('header', {}, el);
  H('b', { text: cfg.title || 'Kvíz' }, hd);
  H('span', { cls: 'sp' }, hd);
  const sc = H('span', { cls: 'sc', text: `0 / ${cfg.items.length}` }, hd);
  let answered = 0, ok = 0;
  const L = 'ABCDEF';
  cfg.items.forEach((it, qi) => {
    const box = H('div', { cls: 'qi' }, el);
    const qq = H('div', { cls: 'qq' }, box);
    qq.innerHTML = `${qi + 1}. ${it.q}` + (it.sub ? `<small>${it.sub}</small>` : '');
    const ops = H('div', { cls: 'opts' + (it.o.every(o => o.length < 48) ? ' two' : '') }, box);
    const fb = H('div', { cls: 'fb' }, box);
    it.o.forEach((o, oi) => {
      const b = H('button', { type: 'button' }, ops);
      b.innerHTML = `<i>${L[oi]}</i><span>${o}</span>`;
      b.addEventListener('click', () => {
        $$('button', ops).forEach(x => x.disabled = true);
        const right = oi === it.a;
        b.classList.add(right ? 'right' : 'wrong');
        ops.children[it.a].classList.add('right');
        fb.className = 'fb show ' + (right ? 'ok' : 'no');
        fb.innerHTML = `<b>${right ? (it.ok || 'Helyes!') : (it.no || 'Nem egészen.')}</b> ${it.e}`;
        answered++; if (right) ok++;
        sc.textContent = `${ok} / ${cfg.items.length}`;
        if (answered === cfg.items.length) {
          sum.classList.add('show');
          sum.innerHTML = `Eredmény: ${ok} / ${cfg.items.length}. `;
          H('button', { cls: 'pbtn', type: 'button', text: 'Újrakezdés', onclick: () => renderQuiz(el, cfg) }, sum);
          if (cfg.key) SCORE.set(cfg.key, ok, cfg.items.length);
        }
      });
    });
  });
  const sum = H('div', { cls: 'qsum' }, el);
}

/* ---------- Esetjáték (egyesével) ---------- */
function renderGame(el, cfg) {
  if (!el) return;
  el.classList.add('game');
  el.innerHTML = '';
  const hd = H('header', {}, el);
  H('b', { text: cfg.title }, hd);
  H('span', { cls: 'sp' }, hd);
  const sc = H('span', { cls: 'pill', text: '' }, hd);
  const gin = H('div', { cls: 'gin' }, el);
  const pic = H('div', { cls: 'pic' }, gin);
  const right = H('div', {}, gin);
  let i = 0, ok = 0;
  const order = cfg.cases.map((c, k) => k);
  function show() {
    const c = cfg.cases[order[i]];
    sc.textContent = `${i + 1} / ${cfg.cases.length} · pont: ${ok}`;
    pic.innerHTML = '';
    if (c.pic) c.pic(pic); else pic.innerHTML = `<div class="muted small">${c.icon || ''}</div>`;
    right.innerHTML = '';
    H('div', { cls: 'sit', html: c.sit }, right);
    const ops = H('div', { cls: 'opts' + (cfg.two ? ' two' : '') }, right);
    const fb = H('div', { cls: 'fb' }, right);
    const nav = H('div', { cls: 'row', style: 'margin-top:12px' }, right);
    const opts = c.o || cfg.o;
    opts.forEach((o, oi) => {
      const b = H('button', { type: 'button' }, ops);
      b.innerHTML = `<i>${'ABCDEFG'[oi]}</i><span>${o}</span>`;
      b.addEventListener('click', () => {
        $$('button', ops).forEach(x => x.disabled = true);
        const r = Array.isArray(c.a) ? c.a.includes(oi) : oi === c.a;
        b.classList.add(r ? 'right' : 'wrong');
        const aa = Array.isArray(c.a) ? c.a : [c.a];
        aa.forEach(a => ops.children[a].classList.add('right'));
        if (r) ok++;
        sc.textContent = `${i + 1} / ${cfg.cases.length} · pont: ${ok}`;
        fb.className = 'fb show ' + (r ? 'ok' : 'no');
        fb.innerHTML = `<b>${r ? 'Jó döntés!' : 'Nem ez a legjobb.'}</b> ${c.e}`;
        const last = i === cfg.cases.length - 1;
        H('button', {
          cls: 'pbtn solid', type: 'button', text: last ? 'Eredmény' : 'Következő eset →', onclick: () => {
            if (last) finish(); else { i++; show(); }
          }
        }, nav);
      });
    });
  }
  function finish() {
    pic.innerHTML = `<div style="font:800 3rem var(--f-head);color:var(--k)">${ok}/${cfg.cases.length}</div>`;
    right.innerHTML = '';
    H('div', { cls: 'sit', text: ok === cfg.cases.length ? 'Hibátlan! Minden esetben jól döntöttél.' : ok >= cfg.cases.length * 0.7 ? 'Szép eredmény! Nézd át a tévesztett eseteket.' : 'Érdemes újra végigmenni az eseteken.' }, right);
    H('button', { cls: 'pbtn solid', type: 'button', text: 'Újra', onclick: () => { i = 0; ok = 0; show(); } }, right);
    if (cfg.key) SCORE.set(cfg.key, ok, cfg.cases.length);
  }
  show();
}

/* ---------- Igaz / hamis ---------- */
function renderTF(el, items) {
  if (!el) return;
  el.classList.add('tf');
  el.innerHTML = '';
  const bar = H('div', { cls: 'bar' }, el); const bi = H('i', {}, bar);
  const inn = H('div', { cls: 'in' }, el);
  let order = items.map((x, k) => k), i = 0, ok = 0;
  function shuffle() { for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; } }
  function show() {
    const it = items[order[i]];
    bi.style.width = (i / items.length * 100) + '%';
    inn.innerHTML = '';
    H('div', { cls: 'cnt', text: `${i + 1}. állítás / ${items.length} · eddig ${ok} helyes` }, inn);
    H('div', { cls: 'stmt', html: it.s }, inn);
    const row = H('div', { cls: 'row' }, inn);
    const fb = H('div', { cls: 'fb' }, inn);
    const go = ans => {
      $$('button', row).forEach(b => b.disabled = true);
      const r = ans === it.a; if (r) ok++;
      fb.className = 'fb show ' + (r ? 'ok' : 'no');
      fb.innerHTML = `<b>${r ? 'Helyes' : 'Tévedés'} – az állítás ${it.a ? 'igaz' : 'hamis'}.</b> ${it.e}`;
      const last = i === items.length - 1;
      H('button', { cls: 'pbtn solid', type: 'button', text: last ? 'Eredmény' : 'Következő →', onclick: () => { if (last) end(); else { i++; show(); } } }, row);
    };
    H('button', { cls: 'pbtn yes', type: 'button', text: 'Igaz', onclick: () => go(true) }, row);
    H('button', { cls: 'pbtn no', type: 'button', text: 'Hamis', onclick: () => go(false) }, row);
  }
  function end() {
    bi.style.width = '100%';
    inn.innerHTML = '';
    H('div', { cls: 'stmt', text: `${ok} / ${items.length} helyes válasz (${Math.round(ok / items.length * 100)} %)` }, inn);
    H('p', { text: ok >= 36 ? 'Kiváló – a síkalapok tervezésének alapjai a kisujjadban vannak.' : ok >= 28 ? 'Jó eredmény; a hibás állítások magyarázatát érdemes újraolvasni.' : 'Nézd át újra a fejezeteket, utána próbáld meg még egyszer!' }, inn);
    H('button', { cls: 'pbtn solid', type: 'button', text: 'Újrakezdés kevert sorrendben', onclick: () => { shuffle(); i = 0; ok = 0; show(); } }, inn);
    SCORE.set('tf', ok, items.length);
  }
  show();
}

/* ---------- Szegmentált gombsor ---------- */
function bindSeg(el, cb) {
  if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !el.contains(b)) return;
    $$('button', el).forEach(x => x.classList.toggle('on', x === b));
    cb(b.dataset.v, b);
  });
}
function setSeg(el, v) { $$('button', el).forEach(x => x.classList.toggle('on', x.dataset.v === v)); }

/* ---------- Metróvonal és görgetés ---------- */
function initMetro() {
  const sts = $$('.metro .st[data-sec]');
  const fill = $('.metro .fill');
  const line = $('.metro .mline');
  const secs = sts.map(s => document.getElementById(s.dataset.sec)).filter(Boolean);
  function update() {
    const y = window.scrollY + window.innerHeight * 0.35;
    let idx = -1;
    secs.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    sts.forEach((s, i) => { s.classList.toggle('on', i === idx); s.classList.toggle('done', i < idx); });
    if (fill && line) {
      if (idx < 0) fill.style.width = '0';
      else {
        const st = sts[idx], lr = line.getBoundingClientRect(), r = st.getBoundingClientRect();
        // részleges kitöltés a következő állomásig
        const cur = secs[idx], nxt = secs[idx + 1];
        let frac = 0;
        if (nxt) frac = clamp((y - cur.offsetTop) / Math.max(1, nxt.offsetTop - cur.offsetTop), 0, 1);
        let x = r.left + r.width / 2 - lr.left;
        if (nxt && sts[idx + 1]) { const r2 = sts[idx + 1].getBoundingClientRect(); x += frac * (r2.left - r.left); }
        fill.style.width = Math.max(0, x - 18) + 'px';
      }
    }
    const tt = $('.totop'); if (tt) tt.classList.toggle('show', window.scrollY > 900);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  const tt = $('.totop'); if (tt) tt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Indítás ---------- */
const INIT = [];
function onReady(fn) { INIT.push(fn); }
document.addEventListener('DOMContentLoaded', () => {
  initRanges();
  for (const f of INIT) { try { f(); } catch (e) { console.error(e); } }
  initMetro();
  SCORE.render();
  GUARD.start();
  // horgonyra érkezéskor a késleltetett tartalmak után még egyszer odaugrunk
  if (location.hash && location.hash.length > 1) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) [400, 1200].forEach(ms => setTimeout(() => t.scrollIntoView({ block: 'start' }), ms));
  }
});

/* ---------- SVG mintázatok (talajok, anyagok) ---------- */
function soilDefs(svg) {
  const id = svg.id || ('s' + Math.random().toString(36).slice(2, 7));
  const defs = S('defs', {}, svg);
  const P = (name, w, h, bg, draw) => { const p = S('pattern', { id: `${id}-${name}`, width: w, height: h, patternUnits: 'userSpaceOnUse' }, defs); S('rect', { width: w, height: h, fill: bg }, p); draw(p); };
  P('homok', 14, 14, '#dcc08a', p => { [[2, 3], [9, 5], [5, 10], [12, 12], [7, 1]].forEach(([x, y]) => S('circle', { cx: x, cy: y, r: 0.9, fill: '#9b7a45' }, p)); });
  P('kavics', 22, 18, '#c9b08a', p => { S('ellipse', { cx: 6, cy: 6, rx: 4, ry: 3, fill: '#e3d3b4', stroke: '#8a7350', 'stroke-width': .8 }, p); S('ellipse', { cx: 16, cy: 13, rx: 3.4, ry: 2.6, fill: '#d8c39c', stroke: '#8a7350', 'stroke-width': .8 }, p); S('circle', { cx: 15, cy: 4, r: 1.4, fill: '#8a7350' }, p); });
  P('agyag', 16, 10, '#b88d68', p => { S('path', { d: 'M0 5 Q4 3 8 5 T16 5', stroke: '#86603f', fill: 'none', 'stroke-width': 1 }, p); });
  P('duzz', 16, 10, '#a77b58', p => { S('path', { d: 'M0 5 Q4 3 8 5 T16 5', stroke: '#7a5232', fill: 'none', 'stroke-width': 1 }, p); });
  P('iszap', 12, 8, '#b6a589', p => { S('path', { d: 'M0 4h5M7 4h5', stroke: '#8f7f62', 'stroke-width': 1 }, p); });
  P('feltoltes', 26, 20, '#8e7d69', p => { S('rect', { x: 3, y: 4, width: 7, height: 4, fill: '#b24c33', transform: 'rotate(18 6 6)' }, p); S('rect', { x: 15, y: 12, width: 6, height: 3, fill: '#d2cbbd' }, p); S('circle', { cx: 19, cy: 4, r: 1.6, fill: '#4a3f35' }, p); S('circle', { cx: 8, cy: 16, r: 1.1, fill: '#4a3f35' }, p); });
  P('humusz', 12, 10, '#5a4431', p => { S('circle', { cx: 3, cy: 3, r: 1, fill: '#2d2116' }, p); S('circle', { cx: 9, cy: 7, r: 1, fill: '#7d6448' }, p); });
  P('kozet', 30, 24, '#9a9da2', p => { S('path', { d: 'M0 8 L12 6 L20 12 L30 10 M6 24 L10 14 M22 24 L26 16', stroke: '#6c7076', fill: 'none', 'stroke-width': 1.2 }, p); });
  P('beton', 10, 10, '#b9bab5', p => { S('circle', { cx: 2, cy: 3, r: .8, fill: '#8d8f8a' }, p); S('circle', { cx: 7, cy: 7, r: .7, fill: '#8d8f8a' }, p); });
  P('tegla', 24, 12, '#d8cfc0', p => { S('rect', { x: 0.5, y: 0.5, width: 11, height: 5, fill: '#b7553c' }, p); S('rect', { x: 12.5, y: 0.5, width: 11, height: 5, fill: '#a94b33' }, p); S('rect', { x: 6.5, y: 6.5, width: 11, height: 5, fill: '#b85a40' }, p); S('rect', { x: -5.5, y: 6.5, width: 11, height: 5, fill: '#ad5038' }, p); S('rect', { x: 18.5, y: 6.5, width: 11, height: 5, fill: '#ad5038' }, p); });
  P('ko', 30, 22, '#cfc8bb', p => { S('path', { d: 'M1 2h12l2 8H2zM16 1h13v9H17zM3 12h9l1 9H2zM14 12h15l-1 9H15z', fill: '#958e82', stroke: '#6d665a', 'stroke-width': .8 }, p); });
  P('uszt', 34, 24, '#b9bab5', p => { S('ellipse', { cx: 9, cy: 8, rx: 6, ry: 4, fill: '#a79c88', stroke: '#6d665a', 'stroke-width': .8 }, p); S('ellipse', { cx: 25, cy: 17, rx: 5, ry: 3.6, fill: '#9c917c', stroke: '#6d665a', 'stroke-width': .8 }, p); });
  P('fagy', 16, 16, 'rgba(120,200,235,.28)', p => { S('path', { d: 'M8 3v10M3.5 5.5l9 5M12.5 5.5l-9 5', stroke: 'rgba(255,255,255,.9)', 'stroke-width': 1, fill: 'none' }, p); });
  P('viz', 20, 8, 'rgba(47,111,208,.16)', p => { S('path', { d: 'M0 4 Q5 1 10 4 T20 4', stroke: 'rgba(47,111,208,.45)', fill: 'none', 'stroke-width': 1 }, p); });
  P('hatch', 8, 8, 'transparent', p => { S('path', { d: 'M-2 2l4-4M0 8l8-8M6 10l4-4', stroke: '#555', 'stroke-width': 1 }, p); });
  // nyílhegyek
  const mk = (n, col) => { const m = S('marker', { id: `${id}-${n}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs); S('path', { d: 'M0 0L10 5L0 10z', style: `fill:${col}` }, m); };
  mk('arr', 'var(--ink-2)'); mk('arrk', 'var(--k)'); mk('arrbad', 'var(--bad)'); mk('arrok', 'var(--ok)'); mk('arrw', 'var(--water)');
  const f = n => `url(#${id}-${n})`;
  return { defs, f, id };
}
/* méretvonal */
function dimLine(g, x1, y1, x2, y2, txt, o = {}) {
  const col = o.col || 'var(--ink-2)';
  const gr = S('g', {}, g);
  S('line', { x1, y1, x2, y2, style: `stroke:${col}`, 'stroke-width': 1 }, gr);
  const tick = (x, y) => S('line', { x1: x - 4, y1: y + 4, x2: x + 4, y2: y - 4, style: `stroke:${col}`, 'stroke-width': 1.3 }, gr);
  tick(x1, y1); tick(x2, y2);
  const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const tx = (x1 + x2) / 2 + (vert ? (o.dx ?? 8) : 0), ty = (y1 + y2) / 2 + (vert ? 4 : (o.dy ?? -6));
  S('text', { x: tx, y: ty, 'text-anchor': vert ? 'start' : 'middle', class: 't-s t-m', style: `fill:${col}`, text: txt }, gr);
  return gr;
}
