window.tcOfi = (() => {
  const LW = 760, LH = 500, TW = 56, TH = 28, OX = 300, OY = 150, MURO = 120;
  const iso = (gx, gy, z = 0) => ({ x: OX + (gx - gy) * TW / 2, y: OY + (gx + gy) * TH / 2 - z });
  const tono = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  };
  const poli = (c, pts, col) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.closePath(); c.fillStyle = col; c.fill(); };
  const caja = (c, gx, gy, w, d, h, col, z0 = 0) => {
    const t = z0 + h;
    poli(c, [iso(gx, gy + d, z0), iso(gx + w, gy + d, z0), iso(gx + w, gy + d, t), iso(gx, gy + d, t)], tono(col, 0.82));
    poli(c, [iso(gx + w, gy, z0), iso(gx + w, gy + d, z0), iso(gx + w, gy + d, t), iso(gx + w, gy, t)], tono(col, 0.68));
    poli(c, [iso(gx, gy, t), iso(gx + w, gy, t), iso(gx + w, gy + d, t), iso(gx, gy + d, t)], col);
  };
  const rect = (c, x, y, w, h, rr, col) => { c.beginPath(); c.roundRect(x, y, w, h, rr); c.fillStyle = col; c.fill(); };

  const ZONAS = [
    { n: 'SALA DE GUIONES', x: 0.4, y: 0.4, w: 5.8, d: 4.2, col: '#cfe6ff' },
    { n: 'ESTUDIO · FÁBRICA', x: 7.2, y: 0.4, w: 6.4, d: 4.2, col: '#e6d6ff' },
    { n: 'PUBLICACIÓN', x: 0.4, y: 5.4, w: 5.8, d: 4.2, col: '#d2f4e2' },
    { n: 'ANÁLISIS', x: 7.2, y: 5.4, w: 3.6, d: 4.2, col: '#ffe0c6' },
    { n: 'RELAX', x: 11.2, y: 5.4, w: 2.4, d: 4.2, col: '#fff0b3' }
  ];
  const AG = {
    guionista: { nom: 'Guionista', mesa: [3, 2.0], relax: [11.8, 6.6], camisa: '#14a8a0', pelo: '#3b2314', piel: '#f2c49b' },
    fabrica: { nom: 'Fábrica', mesa: [10.2, 2.0], relax: [12.9, 7.4], robot: true },
    publicador: { nom: 'Publicador', mesa: [3, 7.0], relax: [11.8, 8.4], camisa: '#3d7be0', pelo: '#e8b33c', piel: '#d99a6c' },
    analista: { nom: 'Analista', mesa: [9, 7.0], relax: [12.9, 9.0], camisa: '#8e5bd8', pelo: '#1b1b1b', piel: '#8d5a3b' }
  };
  const RUTA_FLAMI = [[6.7, 1], [6.7, 9.4], [1, 5], [12.5, 5], [6.7, 5]];

  const fmt = (v) => (v == null || isNaN(v) ? '—' : new Intl.NumberFormat('es-ES').format(v));

  function datos() {
    const v = (id) => dash.data(id);
    const tot = v('totales'), redes = v('redes'), cola = v('cola'), ag = v('agentes'), pc = v('pc_estado'), vids = v('videos'), hist = v('historico'), pend = v('pendientes'), pub = v('publicados');
    const fila = (id) => (ag.status === 'ok' ? ag.data.find((a) => a.id === id) : null);
    const horas = (s) => (s ? (Date.now() - new Date(s)) / 3600000 : Infinity);
    const T = tot.status === 'ok' && tot.data[0] ? tot.data[0] : {};
    const C = cola.status === 'ok' && cola.data[0] ? cola.data[0] : {};
    const pce = pc.status === 'ok' && pc.data[0] ? pc.data[0].estado : null;
    const g = fila('guionista'), pu = fila('publicador'), an = fila('analista');
    const e = {};
    e.guionista = !g ? { modo: 'relax', txt: '…' } : g.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Hoy no he escrito!', s: 'bad' } : horas(g.ultima) < 1.5 ? { modo: 'trabaja', txt: 'Escribiendo guiones ✍️' } : { modo: 'relax', txt: 'Guiones de hoy hechos ☕' };
    e.fabrica = pce === 'Apagado' ? { modo: 'duerme', txt: 'PC apagado: enciéndelo 🔌', s: 'bad' } : pce !== 'Trabajando' ? { modo: 'relax', txt: '…' } : (C.guiones || 0) > 0 ? { modo: 'trabaja', txt: `Montando ${C.guiones} vídeo${C.guiones > 1 ? 's' : ''} 🎬` } : { modo: 'relax', txt: 'Esperando guiones' };
    e.publicador = !pu ? { modo: 'relax', txt: '…' } : pu.resultado !== 'ok' ? { modo: 'alerta', txt: 'Vídeos atascados', s: 'bad' } : horas(pu.ultima) < 0.4 ? { modo: 'trabaja', txt: 'Subiendo vídeos 🚀' } : (C.listos || 0) > 0 ? { modo: 'relax', txt: `${C.listos} listo${C.listos > 1 ? 's' : ''} para subir` } : { modo: 'relax', txt: 'Todo subido ✓' };
    e.analista = !an ? { modo: 'relax', txt: '…' } : horas(an.ultima) < 0.5 && new Date().getDay() === 0 ? { modo: 'trabaja', txt: 'Estudiando datos 📊' } : { modo: 'duerme', txt: 'Vuelvo el domingo' };
    return {
      est: e,
      vistas: T.vistas, likes: T.likes, videos: T.videos,
      pend: C.guiones || 0, listos: C.listos || 0,
      publicados: pub.status === 'ok' ? pub.data.length : null,
      proximos: pend.status === 'ok' ? pend.data.slice(0, 4).map((p) => p.nombre) : [],
      top: vids.status === 'ok' ? vids.data.filter((x) => (x.canal || 'es') === 'es').sort((a, b) => b.vistas - a.vistas).slice(0, 3) : [],
      redes: redes.status === 'ok' ? redes.data : [], vistasBr: T.vistas_br,
      hist: hist.status === 'ok' ? hist.data.map((h) => h.vistas) : [],
      pce
    };
  }

  // ---------- pantallas en las paredes ----------
  function enMuroFondo(c, gx0, z0, fn) { const p = iso(gx0, 0, z0); c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); fn(); c.restore(); }
  function enMuroIzq(c, gy1, z0, fn) { const p = iso(0, gy1, z0); c.save(); c.transform(1, -0.5, 0, 1, p.x, p.y); fn(); c.restore(); }
  function pantalla(c, w, h, titulo, valor, color, t) {
    rect(c, -3, -3, w + 6, h + 6, 5, '#14111f');
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d2742'); g.addColorStop(1, '#101625');
    rect(c, 0, 0, w, h, 3, g);
    c.fillStyle = color; c.font = '700 9px Inter, system-ui, sans-serif'; c.fillText(titulo, 7, 13);
    c.fillStyle = '#ffffff'; c.font = '800 21px Inter, system-ui, sans-serif'; c.fillText(valor, 7, h - 10);
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t / 500); rect(c, w - 10, 6, 4, 4, 2, color); c.globalAlpha = 1;
  }

  function fondo(c, D, t) {
    // paredes
    poli(c, [iso(0, 0, 0), iso(14, 0, 0), iso(14, 0, MURO), iso(0, 0, MURO)], '#2b2540');
    poli(c, [iso(0, 0, 0), iso(0, 10, 0), iso(0, 10, MURO), iso(0, 0, MURO)], '#352d4f');
    poli(c, [iso(0, 0, 0), iso(14, 0, 0), iso(14, 0, 4), iso(0, 0, 4)], '#39d98a');
    poli(c, [iso(0, 0, 0), iso(0, 10, 0), iso(0, 10, 4), iso(0, 0, 4)], '#39d98a');
    // suelo de madera
    poli(c, [iso(0, 0), iso(14, 0), iso(14, 10), iso(0, 10)], '#ecc995');
    c.strokeStyle = 'rgba(150,100,50,.18)'; c.lineWidth = 1;
    for (let i = 1; i < 20; i++) { const a = iso(i * 0.7, 0), b = iso(i * 0.7, 10); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    ZONAS.forEach((z) => poli(c, [iso(z.x, z.y, 0.5), iso(z.x + z.w, z.y, 0.5), iso(z.x + z.w, z.y + z.d, 0.5), iso(z.x, z.y + z.d, 0.5)], z.col));
    // carteles de zona en el suelo
    ZONAS.forEach((z) => {
      const p = iso(z.x + 0.3, z.y + z.d - 0.25, 1);
      c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); c.fillStyle = 'rgba(60,40,90,.55)'; c.font = '800 9px Inter, system-ui, sans-serif'; c.fillText('■ ' + z.n, 0, 0); c.restore();
    });
    // pantallas del muro del fondo
    enMuroFondo(c, 0.6, 104, () => pantalla(c, 78, 50, 'VISUALIZACIONES', fmt(D.vistas), '#4ff0e0', t));
    enMuroFondo(c, 3.8, 104, () => pantalla(c, 66, 50, 'LIKES', fmt(D.likes), '#ff6fae', t));
    enMuroFondo(c, 6.3, 108, () => {
      const w = 72, h = 70; rect(c, -3, -3, w + 6, h + 6, 5, '#14111f'); rect(c, 0, 0, w, h, 3, '#101625');
      c.fillStyle = '#ffd36b'; c.font = '700 8px Inter, system-ui'; c.fillText('SEGUIDORES', 6, 12);
      const filas = [['YT', '#ff3d3d', 'YouTube'], ['TT', '#4ff0e0', 'TikTok'], ['IG', '#ff6fae', 'Instagram'], ['BR', '#39d98a', 'YouTube Brasil']];
      filas.forEach(([et, col, nom], i) => {
        const r = (D.redes || []).find((x) => x.red === nom);
        const y = 25 + i * 12;
        rect(c, 6, y - 7, 14, 9, 2, col); c.fillStyle = '#101625'; c.font = '800 6px Inter, system-ui'; c.fillText(et, 8, y);
        c.fillStyle = '#fff'; c.font = '800 9px Inter, system-ui'; c.fillText(r && r.seguidores != null ? fmt(r.seguidores) : '…', 25, y + 1);
      });
    });
    enMuroFondo(c, 9.2, 108, () => {
      const w = 130, h = 70; rect(c, -3, -3, w + 6, h + 6, 5, '#14111f'); rect(c, 0, 0, w, h, 3, '#101625');
      c.fillStyle = '#ffd36b'; c.font = '700 9px Inter, system-ui, sans-serif'; c.fillText('🏆 LOS QUE MÁS TIRAN', 7, 13);
      if (!D.top.length) { c.fillStyle = '#8fa0c0'; c.font = '600 9px Inter, system-ui'; c.fillText('Esperando cifras del PC…', 7, 34); return; }
      const max = D.top[0].vistas || 1;
      D.top.forEach((v, i) => {
        const y = 24 + i * 16;
        c.fillStyle = '#c9d3ea'; c.font = '600 7px Inter, system-ui'; c.fillText(v.titulo.slice(0, 30) + (v.titulo.length > 30 ? '…' : ''), 7, y);
        rect(c, 7, y + 3, Math.max(3, 84 * v.vistas / max), 6, 2, ['#ff6fae', '#4ff0e0', '#ffd36b'][i]);
        c.fillStyle = '#fff'; c.font = '700 8px Inter, system-ui'; c.fillText(fmt(v.vistas), 96, y + 9);
      });
    });
    // muro izquierdo: pizarra de próximos guiones y neón
    enMuroIzq(c, 4.6, 104, () => {
      const w = 112, h = 74; rect(c, -4, -4, w + 8, h + 8, 4, '#b9b3c9'); rect(c, 0, 0, w, h, 2, '#fbfaff');
      c.fillStyle = '#2b2540'; c.font = '800 9px Inter, system-ui'; c.fillText(`PRÓXIMOS GUIONES (${D.pend})`, 6, 13);
      c.font = '600 8px Inter, system-ui';
      (D.proximos.length ? D.proximos : ['Cola vacía: todo montado ✓']).forEach((n, i) => { c.fillStyle = i % 2 ? '#3d7be0' : '#e0507f'; c.fillText('• ' + n, 6, 27 + i * 12); });
    });
    enMuroIzq(c, 9.4, 96, () => {
      const on = Math.sin(t / 450) > -0.8;
      c.shadowColor = on ? '#ff4fa3' : 'transparent'; c.shadowBlur = on ? 10 : 0;
      c.fillStyle = on ? '#ff6fae' : '#7a2e5a'; c.font = '900 15px Inter, system-ui'; c.fillText('FUERA DEL MAPA', 0, 0);
      c.shadowColor = on ? '#4ff0e0' : 'transparent'; c.fillStyle = on ? '#6ff5e8' : '#2e6a66'; c.font = '800 10px Inter, system-ui'; c.fillText('GTA 6 · 19 NOV', 22, 16);
      c.shadowBlur = 0;
    });
  }

  // ---------- muebles ----------
  function muebles(D, t) {
    const L = [];
    const add = (gx, gy, f) => L.push({ d: gx + gy, f });
    // guionista: mesa, portátil, montón de guiones
    add(2.2, 2.9, (c) => { caja(c, 2.2, 2.6, 2, 0.8, 18, '#ffffff'); caja(c, 2.9, 2.7, 0.6, 0.35, 10, '#8a93a3', 18);
      const n = Math.min(8, D.pend); for (let i = 0; i < n; i++) caja(c, 3.7, 2.75, 0.35, 0.45, 2, i % 2 ? '#fffbe6' : '#f2eedd', 18 + i * 2.2); });
    add(1, 1, (c) => { caja(c, 0.7, 0.7, 0.5, 0.5, 10, '#c0703c'); c.beginPath(); const p = iso(0.95, 0.95, 26); c.arc(p.x, p.y, 11, 0, 7); c.fillStyle = '#3fbf6e'; c.fill(); });
    // fábrica: mesa con monitor, cámara, croma verde, servidor con luces
    add(9.4, 2.9, (c) => { caja(c, 9.2, 2.6, 2, 0.8, 18, '#2d2d3a'); caja(c, 9.9, 2.7, 0.7, 0.2, 18, '#14111f', 18); });
    add(12.4, 0.8, (c) => { caja(c, 12.2, 0.5, 1.2, 0.15, 80, '#39d98a'); });
    add(8.1, 1.3, (c) => {
      caja(c, 7.6, 0.7, 0.7, 0.6, 60, '#22202e');
      for (let i = 0; i < 5; i++) { const p = iso(7.6, 1.3, 10 + i * 10); const on = D.pce === 'Trabajando' && Math.floor(t / 200 + i) % 3; c.fillStyle = on ? '#39d98a' : '#454256'; c.fillRect(p.x + 4, p.y - 2, 4, 2); c.fillStyle = on && i % 2 ? '#ff6fae' : '#454256'; c.fillRect(p.x + 10, p.y - 1, 4, 2); }
    });
    add(12, 3.6, (c) => { const p = iso(12, 3.4, 0); c.strokeStyle = '#2b2540'; c.lineWidth = 2; [[-8, 0], [8, 0], [0, 6]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(p.x, p.y - 34); c.lineTo(p.x + dx, p.y + dy); c.stroke(); }); rect(c, p.x - 9, p.y - 44, 18, 12, 2, '#2b2540'); c.beginPath(); c.arc(p.x + 9, p.y - 38, 4, 0, 7); c.fillStyle = '#4ff0e0'; c.fill(); if (D.pce === 'Trabajando' && Math.floor(t / 500) % 2) { c.beginPath(); c.arc(p.x - 6, p.y - 41, 2, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); } });
    // publicación: mesa con 3 móviles (YouTube, TikTok, Instagram) y cajas de vídeos listos
    add(2.2, 7.9, (c) => { caja(c, 2.2, 7.6, 2, 0.8, 18, '#ffffff');
      [['#ff3d3d', 2.35], ['#111111', 2.95], ['#c13584', 3.55]].forEach(([col, x], i) => { caja(c, x, 7.75, 0.3, 0.12, 16, col, 18); if (i === 1) { const p = iso(x + 0.15, 7.75, 28); c.fillStyle = '#4ff0e0'; c.fillRect(p.x - 1, p.y, 3, 3); } });
    });
    for (let i = 0; i < Math.min(6, D.listos); i++) { const gx = 0.8 + (i % 3) * 0.55, gy = 8.6, z = Math.floor(i / 3) * 14; add(gx, gy + 0.01 * i, (c) => { caja(c, gx, gy, 0.5, 0.5, 14, '#c99a5b', z); const p = iso(gx + 0.25, gy + 0.5, z + 7); c.fillStyle = '#7a5530'; c.fillRect(p.x - 6, p.y - 1, 12, 2); }); }
    // análisis: mesa y caballete con la gráfica real
    add(8.2, 7.9, (c) => { caja(c, 8.2, 7.6, 2, 0.8, 18, '#ffffff'); caja(c, 8.9, 7.7, 0.6, 0.35, 10, '#8a93a3', 18); });
    add(7.6, 6.2, (c) => {
      const p = iso(7.6, 6.0, 0); c.strokeStyle = '#7a5530'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - 10, p.y); c.lineTo(p.x + 4, p.y - 60); c.lineTo(p.x + 18, p.y); c.stroke();
      const w = 64, h = 44, x0 = p.x - 28, y0 = p.y - 72;
      rect(c, x0 - 2, y0 - 2, w + 4, h + 4, 3, '#7a5530'); rect(c, x0, y0, w, h, 2, '#fffdf7');
      c.fillStyle = '#2b2540'; c.font = '800 7px Inter, system-ui'; c.fillText('VISTAS POR HORA', x0 + 4, y0 + 9);
      const hs = D.hist;
      if (hs.length < 2) { c.fillStyle = '#8a8399'; c.font = '600 6.5px Inter, system-ui'; c.fillText('recogiendo datos…', x0 + 6, y0 + 28); return; }
      const mn = Math.min(...hs), mx = Math.max(...hs) || 1;
      c.beginPath(); hs.forEach((v, i) => { const x = x0 + 4 + (w - 8) * i / (hs.length - 1), y = y0 + h - 5 - (h - 18) * (v - mn) / ((mx - mn) || 1); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.strokeStyle = '#e0507f'; c.lineWidth = 2; c.stroke();
    });
    // relax: sofá, puf, cafetera y planta
    add(12.2, 8.2, (c) => { caja(c, 12.3, 6.2, 1.0, 2.6, 8, '#ff8fb8'); caja(c, 13.1, 6.2, 0.3, 2.6, 22, '#ff6fa3'); });
    add(11.6, 9.4, (c) => { const p = iso(11.6, 9.4, 6); c.beginPath(); c.ellipse(p.x, p.y, 13, 8, 0, 0, 7); c.fillStyle = '#4ad2e8'; c.fill(); c.beginPath(); c.ellipse(p.x, p.y - 4, 12, 6, 0, 0, 7); c.fillStyle = '#6fe0f0'; c.fill(); });
    add(13.3, 5.7, (c) => { caja(c, 13.0, 5.5, 0.5, 0.4, 30, '#3a3a48'); const p = iso(13.2, 5.9, 34); if (Math.floor(t / 900) % 2) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(p.x, p.y - 6, 2, 4); } });
    add(13.6, 9.7, (c) => { caja(c, 13.4, 9.4, 0.4, 0.4, 12, '#c0703c'); const p = iso(13.6, 9.6, 30); c.beginPath(); c.arc(p.x, p.y, 12, 0, 7); c.fillStyle = '#2f9e5b'; c.fill(); c.beginPath(); c.arc(p.x - 4, p.y - 6, 7, 0, 7); c.fillStyle = '#3fbf6e'; c.fill(); });
    return L;
  }

  // ---------- personajes ----------
  function muñeco(c, a, p, e, t, quieto) {
    const q = iso(p.x, p.y, 0);
    const sent = e.modo !== 'relax' || p.llegado;
    const bob = e.modo === 'trabaja' && !quieto ? Math.sin(t / 90) * 1.2 : e.modo === 'duerme' ? 0 : Math.sin(t / 700) * 0.8;
    c.beginPath(); c.ellipse(q.x, q.y, 12, 5, 0, 0, 7); c.fillStyle = 'rgba(40,20,60,.22)'; c.fill();
    const y0 = q.y - (sent ? 8 : 0);
    if (a.robot) {
      const off = e.modo === 'duerme';
      const g = c.createLinearGradient(q.x - 10, 0, q.x + 10, 0); g.addColorStop(0, off ? '#7d8392' : '#dfe6f0'); g.addColorStop(1, off ? '#5c6170' : '#9aa6b8');
      rect(c, q.x - 10, y0 - 26, 20, 22, 6, g);
      rect(c, q.x - 5, y0 - 20, 10, 6, 2, off ? '#444' : '#ffb347');
      rect(c, q.x - 9, y0 - 44 + bob, 18, 16, 5, g);
      rect(c, q.x - 6, y0 - 39 + bob, 12, 6, 2, '#14111f');
      c.fillStyle = off ? '#333' : '#4ff0e0'; c.fillRect(q.x - 4, y0 - 37 + bob, 3, 2); c.fillRect(q.x + 1, y0 - 37 + bob, 3, 2);
      c.fillStyle = '#8a93a3'; c.fillRect(q.x - 1, y0 - 51 + bob, 2, 7);
      c.beginPath(); c.arc(q.x, y0 - 52 + bob, 3, 0, 7); c.fillStyle = off ? '#555' : (Math.floor(t / 400) % 2 ? '#ff4fa3' : '#ffd36b'); c.fill();
    } else {
      const g = c.createLinearGradient(q.x - 10, 0, q.x + 10, 0); g.addColorStop(0, tono(a.camisa, 1.15)); g.addColorStop(1, tono(a.camisa, 0.8));
      rect(c, q.x - 10, y0 - 26, 20, 23, 9, g);
      const cab = e.modo === 'duerme' ? { x: q.x + 4, y: y0 - 30 } : { x: q.x, y: y0 - 36 + bob };
      c.beginPath(); c.arc(cab.x, cab.y, 10, 0, 7); c.fillStyle = a.piel; c.fill();
      c.beginPath(); c.arc(cab.x, cab.y - 2, 10.5, Math.PI * 1.05, Math.PI * 1.95); c.fillStyle = a.pelo; c.fill();
      if (e.modo !== 'duerme') { c.fillStyle = '#1b1b1b'; c.fillRect(cab.x - 4, cab.y, 2, 3); c.fillRect(cab.x + 2, cab.y, 2, 3); }
      if (e.modo === 'trabaja') { const k = Math.floor(t / 110) % 2; rect(c, q.x - 13, y0 - 16 + k, 6, 5, 2, a.piel); rect(c, q.x + 7, y0 - 16 - k, 6, 5, 2, a.piel); }
      if (e.modo === 'relax' && p.llegado) { rect(c, q.x + 8, y0 - 20, 6, 7, 1, '#fff'); if (!quieto) { const k = (t / 1200) % 1; c.globalAlpha = 1 - k; c.fillStyle = '#fff'; c.fillRect(q.x + 10, y0 - 25 - k * 8, 2, 3); c.globalAlpha = 1; } }
    }
    if (e.modo === 'duerme' && !quieto) for (let i = 0; i < 3; i++) { const k = ((t / 1000) + i / 3) % 1; c.globalAlpha = 1 - k; c.fillStyle = '#5a4b8a'; c.font = '800 10px Inter, system-ui'; c.fillText('z', q.x + 12 + i * 4 + k * 6, y0 - 40 - k * 18); c.globalAlpha = 1; }
    if (e.modo === 'alerta' && Math.floor(t / 300) % 2) { c.beginPath(); c.arc(q.x, y0 - 64, 8, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); c.fillStyle = '#fff'; c.font = '900 11px Inter, system-ui'; c.fillText('!', q.x - 2, y0 - 60); }
    if (a.nom === 'Guionista' && e.modo === 'trabaja' && !quieto) { const k = (t / 1400) % 1; c.globalAlpha = 1 - k; rect(c, q.x + 14 + k * 10, y0 - 40 - k * 20, 8, 10, 1, '#fffbe6'); c.globalAlpha = 1; }
  }

  function flamenco(c, f, t, quieto) {
    const q = iso(f.x, f.y, 0), dir = f.dir;
    const paso = quieto ? 0 : Math.floor(t / 160) % 2;
    c.beginPath(); c.ellipse(q.x, q.y, 9, 4, 0, 0, 7); c.fillStyle = 'rgba(40,20,60,.2)'; c.fill();
    c.save(); c.translate(q.x, q.y); c.scale(dir, 1);
    c.strokeStyle = '#e0507f'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-2, -16); c.lineTo(-2 - paso * 2, 0); c.moveTo(2, -16); c.lineTo(2 + (1 - paso) * 2, 0); c.stroke();
    c.beginPath(); c.ellipse(0, -21, 10, 7, -0.2, 0, 7); c.fillStyle = '#ff7eb6'; c.fill();
    rect(c, -6, -25, 12, 6, 2, '#3dc2b6');
    c.beginPath(); c.moveTo(6, -24); c.quadraticCurveTo(14, -34, 8, -42); c.lineWidth = 4; c.strokeStyle = '#ff7eb6'; c.stroke();
    c.beginPath(); c.arc(9, -44, 5, 0, 7); c.fillStyle = '#ff7eb6'; c.fill();
    rect(c, 7, -47, 8, 3, 1, '#14111f');
    c.beginPath(); c.moveTo(13, -43); c.lineTo(19, -40); c.lineTo(13, -40); c.fillStyle = '#2b2540'; c.fill();
    c.restore();
  }

  return {
    mount(el) {
      el.replaceChildren();
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Oficina isométrica con los agentes del canal y sus datos');
      const capa = document.createElement('div'); capa.className = 'tc-ofi-capa';
      el.append(cv, capa);
      const quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = { cv, capa, D: datos(), pos: {}, flami: { x: 6.7, y: 5, i: 0, dir: 1 }, id: 0, quieto, ult: 0 };
      Object.entries(AG).forEach(([k, a]) => { st.pos[k] = { x: a.relax[0], y: a.relax[1], llegado: true }; });
      const ctx = cv.getContext('2d');
      const frame = (t) => {
        const dpr = Math.min(2, window.devicePixelRatio || 1), cw = el.clientWidth || LW;
        const sc = cw / LW;
        if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * LH / LW * dpr); }
        const dt = Math.min(60, t - (st.ult || t)); st.ult = t;
        ctx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
        ctx.clearRect(0, 0, LW, LH);
        ctx.fillStyle = '#1e1a2e'; ctx.fillRect(0, 0, LW, LH);
        fondo(ctx, st.D, t);
        const L = muebles(st.D, t);
        Object.entries(AG).forEach(([k, a]) => {
          const e = st.D.est[k] || { modo: 'relax' };
          const dest = e.modo === 'relax' ? a.relax : a.mesa;
          const p = st.pos[k];
          const dx = dest[0] - p.x, dy = dest[1] - p.y, dist = Math.hypot(dx, dy), v = st.quieto ? 99 : 0.0016 * dt;
          if (dist > v) { p.x += dx / dist * v; p.y += dy / dist * v; p.llegado = false; } else { p.x = dest[0]; p.y = dest[1]; p.llegado = true; }
          L.push({ d: p.x + p.y + 0.05, f: (c) => muñeco(c, a, p, e, t, st.quieto) });
        });
        const f = st.flami, obj = RUTA_FLAMI[f.i];
        if (!st.quieto) {
          const dx = obj[0] - f.x, dy = obj[1] - f.y, dist = Math.hypot(dx, dy), v = 0.0012 * dt;
          if (dist < v) f.i = (f.i + 1) % RUTA_FLAMI.length; else { f.x += dx / dist * v; f.y += dy / dist * v; f.dir = (dx - dy) >= 0 ? 1 : -1; }
        }
        L.push({ d: f.x + f.y + 0.02, f: (c) => flamenco(c, f, t, st.quieto) });
        L.sort((a, b) => a.d - b.d).forEach((o) => o.f(ctx));
        // carteles y burbujas en HTML, recolocados cada fotograma
        Object.keys(AG).forEach((k) => {
          const p = st.pos[k], q = iso(p.x, p.y, 0), e = st.D.est[k] || {};
          const tag = st.tags && st.tags[k];
          if (!tag) return;
          tag.nom.style.left = (q.x / LW * 100) + '%'; tag.nom.style.top = ((q.y + 6) / LH * 100) + '%';
          tag.bur.style.left = (q.x / LW * 100) + '%'; tag.bur.style.top = ((q.y - 70) / LH * 100) + '%';
          tag.bur.hidden = !p.llegado;
        });
        if (!st.quieto) st.id = requestAnimationFrame(frame);
      };
      st.frame = frame;
      st.id = requestAnimationFrame(frame);
      const caja = el.parentElement;
      if (caja && caja.scrollWidth > caja.clientWidth) caja.scrollLeft = (caja.scrollWidth - caja.clientWidth) * 0.45;
      return st;
    },
    update(el, st) {
      st.D = datos();
      st.capa.replaceChildren(); st.tags = {};
      Object.entries(AG).forEach(([k, a]) => {
        const e = st.D.est[k] || {};
        const nom = document.createElement('div'); nom.className = 'tc-tag'; nom.textContent = a.nom;
        const bur = document.createElement('div'); bur.className = 'tc-burbuja'; bur.textContent = e.txt || '…'; if (e.s) bur.dataset.s = e.s;
        st.capa.append(nom, bur); st.tags[k] = { nom, bur };
      });
      const fl = document.createElement('div'); fl.className = 'tc-sello';
      fl.textContent = st.D.publicados != null ? `🎞️ ${fmt(st.D.publicados)} vídeos publicados · 📦 ${st.D.listos} por subir` : '…';
      st.capa.append(fl);
      if (st.quieto) requestAnimationFrame(st.frame);
    },
    unmount(el, st) { if (st) cancelAnimationFrame(st.id); }
  };
})();
