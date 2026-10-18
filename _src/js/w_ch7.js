/* ===== 07 – Önellenőrzés: igaz/hamis és fogalomtár ===== */
onReady(() => renderTF($('#tf'), TF_ITEMS));
onReady(function glossary() {
  const dl = $('#glossDl'), q = $('#glossQ'); if (!dl) return;
  function draw() {
    const s = (q.value || '').trim().toLowerCase();
    dl.innerHTML = '';
    GLOSSARY.filter(([t, d]) => !s || t.toLowerCase().includes(s) || d.toLowerCase().includes(s)).forEach(([t, d]) => {
      const div = H('div', {}, dl);
      H('dt', { text: t }, div);
      H('dd', { text: d }, div);
    });
    if (!dl.children.length) H('p', { cls: 'muted', text: 'Nincs találat.' }, dl);
  }
  q.addEventListener('input', draw);
  draw();
});
