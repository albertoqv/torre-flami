// Tarjetas de información debajo de la oficina. Leen lo mismo que la oficina (dash.data).
window.tcPan = (() => {
  const ESTRENO = new Date('2026-11-19T00:00:00+01:00');
  const fmt = (v) => (v == null || isNaN(v) ? '…' : new Intl.NumberFormat('es-ES').format(v));
  const corto = (v) => (v == null || isNaN(v) ? '…' : v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' M' : v >= 1e4 ? Math.round(v / 1000) + ' mil' : fmt(v));
  const d = (id) => { const r = dash.data(id); return r.status === 'ok' ? r.data : []; };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const hace = (s) => { if (!s) return ''; const m = Math.round((Date.now() - new Date(s)) / 60000); if (isNaN(m)) return ''; const a = Math.abs(m); const t = a < 60 ? `${a} min` : a < 1440 ? `${Math.round(a / 60)} h` : `${Math.round(a / 1440)} d`; return m < 0 ? 'en ' + t : 'hace ' + t; };

  // Próxima ejecución según el horario fijo (hora de Madrid)
  function siguiente(lista) {
    const ahora = new Date();
    const madrid = (x) => new Date(x.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const desfase = madrid(ahora) - ahora;
    for (let dia = 0; dia < 8; dia++) for (const [dows, h, m] of lista) {
      const base = madrid(ahora); base.setDate(base.getDate() + dia); base.setHours(h, m, 0, 0);
      if (dows && !dows.includes(base.getDay())) continue;
      const real = new Date(base - desfase);
      if (real > ahora) return real;
    }
    return null;
  }
  const hora = (x) => (x ? x.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

  function tarjeta(titulo, icono, acento) {
    const t = el('article', 'tp-card'); t.style.setProperty('--ac', acento);
    const h = el('h3', 'tp-h'); h.append(el('span', 'tp-ico', icono), document.createTextNode(titulo)); t.append(h); return t;
  }
  function barra(val, meta, col, marca) {
    const b = el('div', 'tp-barra'); const r = el('i'); r.style.width = Math.max(2, Math.min(100, 100 * (val || 0) / meta)) + '%'; r.style.background = col; b.append(r);
    if (marca) { const m = el('b'); m.style.left = (100 * marca / meta) + '%'; b.append(m); }
    return b;
  }

  function seguidores() {
    const t = tarjeta('Seguidores por red', '👥', '#ff6fae');
    const redes = d('redes');
    const total = redes.reduce((s, r) => s + (Number(r.seguidores) || 0), 0);
    t.append(el('p', 'tp-grande', fmt(total)), el('p', 'tp-sub', 'entre todas las redes'));
    const info = { 'YouTube': ['YT', '#ff3d3d', 'Fuera del Mapa'], 'YouTube Brasil': ['BR', '#39d98a', 'Fora do Mapa'], 'TikTok': ['TT', '#4ff0e0', '@elfueradelmapa'], 'Instagram': ['IG', '#ff6fae', '@fueradelmapa_gta'] };
    const ul = el('ul', 'tp-redes');
    ['YouTube', 'YouTube Brasil', 'TikTok', 'Instagram'].forEach((n) => {
      const r = redes.find((x) => x.red === n) || {}, [et, col, cuenta] = info[n];
      const li = el('li'); const b = el('span', 'tp-badge', et); b.style.background = col;
      const tx = el('span', 'tp-red'); tx.append(el('b', '', n), el('small', '', cuenta + (r.likes ? ` · ${fmt(r.likes)} ❤` : '')));
      li.append(b, tx, el('span', 'tp-num', r.seguidores != null ? fmt(r.seguidores) : '…')); ul.append(li);
    });
    t.append(ul); return t;
  }

  function cobrar() {
    const t = tarjeta('Camino a cobrar', '💰', '#39d98a');
    const yt = d('redes').find((r) => r.red === 'YouTube') || {};
    const subs = yt.seguidores;
    const es = d('videos').filter((v) => (v.canal || 'es') === 'es');
    const v90 = es.filter((v) => Date.now() - new Date(v.publicado) < 90 * 864e5).reduce((s, v) => s + (Number(v.vistas) || 0), 0);
    const fases = [
      { n: 'Fase 1 · Miembros y Super Thanks', s: 500, v: 3e6, txt: 'Los fans pueden hacerse miembros del canal (cuota mensual con emojis e insignias de Flami) y dejar propinas.' },
      { n: 'Fase 2 · Anuncios', s: 1000, v: 1e7, txt: 'YouTube reparte ingresos de los anuncios de los Shorts.' }
    ];
    fases.forEach((f) => {
      const box = el('div', 'tp-fase'); const ok = (subs || 0) >= f.s && v90 >= f.v;
      box.append(el('p', 'tp-fase-n', (ok ? '✅ ' : '') + f.n));
      const l1 = el('div', 'tp-linea'); l1.append(el('span', '', 'Suscriptores'), el('b', '', `${fmt(subs)} / ${fmt(f.s)}`)); box.append(l1, barra(subs, f.s, '#ff6fae'));
      const l2 = el('div', 'tp-linea'); l2.append(el('span', '', 'Vistas Shorts · 90 días'), el('b', '', `${corto(v90)} / ${corto(f.v)}`)); box.append(l2, barra(v90, f.v, '#4ff0e0'));
      box.append(el('p', 'tp-mini', ok ? '¡Conseguido! Se pide desde YouTube Studio → Ganar dinero.' : `Faltan ${fmt(Math.max(0, f.s - (subs || 0)))} suscriptores y ${corto(Math.max(0, f.v - v90))} vistas. ${f.txt}`));
      t.append(box);
    });
    return t;
  }

  function fabrica() {
    const t = tarjeta('La fábrica ahora', '🏭', '#8e5bd8');
    const pc = (d('pc_estado')[0] || {}).estado, ver = (d('pc')[0] || {}).version, C = d('cola')[0] || {};
    const est = el('p', 'tp-estado ' + (pc === 'Trabajando' ? 'ok' : pc === 'Apagado' ? 'mal' : ''), pc === 'Trabajando' ? '🟢 PC encendido y trabajando' : pc === 'Apagado' ? '🔴 PC apagado: enciéndelo para montar vídeos' : '… sin datos del PC');
    t.append(est);
    const nums = el('div', 'tp-nums');
    [[C.guiones, 'guiones en cola'], [C.listos, 'vídeos por subir'], [d('publicados').length, 'publicados']].forEach(([n, s]) => { const x = el('div'); x.append(el('b', '', fmt(n)), el('span', '', s)); nums.append(x); });
    t.append(nums);
    const ul = el('ul', 'tp-turnos');
    [['✍️ Guionista', siguiente([[null, 6, 42]])], ['🚀 Publicador', siguiente([[null, 12, 47], [null, 22, 47]])], ['📊 Analista', siguiente([[[0, 3], 20, 37]])]].forEach(([n, x]) => {
      const li = el('li'); li.append(el('span', '', n), el('b', '', hora(x)), el('small', '', hace(x))); ul.append(li);
    });
    t.append(el('p', 'tp-mini', 'Próximos turnos' + (ver ? ` · fábrica ${ver}` : '')), ul);
    return t;
  }

  function cuenta() {
    const t = tarjeta('Cuenta atrás GTA 6', '🌴', '#ffd36b');
    const ms = ESTRENO - Date.now();
    if (ms > 0) {
      const dd = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60;
      const reloj = el('div', 'tp-reloj');
      [[dd, 'días'], [hh, 'horas'], [mm, 'min']].forEach(([n, s]) => { const x = el('div'); x.append(el('b', '', String(n).padStart(2, '0')), el('span', '', s)); reloj.append(x); });
      t.append(reloj, el('p', 'tp-mini', 'A las 00:00 del 19 de noviembre sale el especial de lanzamiento. Semana a tope: más vídeos al día.'));
    } else {
      t.append(el('p', 'tp-grande', '¡Ya a la venta!'), el('p', 'tp-mini', `Lleva ${Math.floor(-ms / 864e5)} días en la calle: es el momento de más búsquedas, a por ello.`));
    }
    return t;
  }

  function ritmo() {
    const t = tarjeta('Cómo va el canal', '📈', '#4ff0e0');
    const h = d('historico'), vids = d('videos'), es = vids.filter((v) => (v.canal || 'es') === 'es'), br = vids.filter((v) => v.canal === 'pt');
    let dia = null;
    if (h.length > 1) { const ult = h[h.length - 1]; const ref = h.find((x) => new Date(ult.hora) - new Date(x.hora) <= 24 * 36e5) || h[0]; dia = ult.vistas - ref.vistas; }
    const nums = el('div', 'tp-nums');
    const totEs = es.reduce((s, v) => s + v.vistas, 0);
    [[dia, 'vistas en 24 h'], [es.length ? Math.round(totEs / es.length) : null, 'media por vídeo'], [br.reduce((s, v) => s + v.vistas, 0), 'vistas en Brasil']].forEach(([n, s]) => { const x = el('div'); x.append(el('b', '', fmt(n)), el('span', '', s)); nums.append(x); });
    t.append(nums);
    const top = es.slice().sort((a, b) => b.vistas - a.vistas)[0];
    if (top) {
      const a = el('a', 'tp-top'); a.href = 'https://youtube.com/shorts/' + top.id; a.target = '_blank'; a.rel = 'noopener';
      a.append(el('small', '', '🏆 El que más tira'), el('b', '', top.titulo), el('span', '', fmt(top.vistas) + ' vistas · ' + fmt(top.likes) + ' ❤'));
      t.append(a);
    }
    return t;
  }

  function ideas() {
    const t = tarjeta('Ideas para crecer', '💡', '#ff9f43');
    const subs = (d('redes').find((r) => r.red === 'YouTube') || {}).seguidores || 0;
    const lista = [
      subs < 500 ? 'Prioridad: suscriptores. Cada Short acaba con «suscríbete para decidir el próximo capítulo».' : 'Ya puedes activar Miembros: niveles «Ciudadano de Vice» y «Socio de Don Caimán».',
      'Pregunta TÚ DECIDES fijada en comentarios: los comentarios empujan el algoritmo.',
      'Recopilatorio largo semanal: suma horas de vídeo largo (la otra vía para cobrar).',
      'Encuestas en la pestaña Comunidad la semana del lanzamiento.',
      'Playlists por personaje (Flami, Don Caimán, Rocco, Manolo) para encadenar vistas.'
    ];
    const ul = el('ul', 'tp-ideas'); lista.forEach((x) => ul.append(el('li', '', x))); t.append(ul); return t;
  }

  return function pintar(caja) {
    caja.classList.add('tp-grid');
    caja.replaceChildren(seguidores(), cobrar(), cuenta(), fabrica(), ritmo(), ideas());
  };
})();
