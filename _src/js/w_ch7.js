/* ===== 07 – Önellenőrzés: igaz/hamis és fogalomtár ===== */
onReady(() => renderTF($('#tf'), TF_ITEMS));
onReady(function glossary() {
  const dl = $('#glossDl'), q = $('#glossQ'); if (!dl) return;
  const plain = x => x.replace(/<[^>]+>/g, '').toLowerCase();
  function draw() {
    const s = (q.value || '').trim().toLowerCase();
    dl.innerHTML = '';
    GLOSSARY.filter(([t, d]) => !s || plain(t).includes(s) || plain(d).includes(s)).forEach(([t, d]) => {
      const div = H('div', {}, dl);
      H('dt', { html: t }, div);
      H('dd', { html: d }, div);
    });
    if (!dl.children.length) H('p', { cls: 'muted', text: 'Nincs találat.' }, dl);
  }
  q.addEventListener('input', draw);
  draw();
});
