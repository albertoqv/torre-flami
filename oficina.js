window.tcOfi = (() => {
  // Mundo isométrico: 19 × 10 baldosas (oficina + plató del reparto)
  const LW = 900, LH = 590, TW = 56, TH = 28, OX = 320, OY = 150, MURO = 120, GX = 19, GY = 10;
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
  const F = (peso, px) => `${peso} ${px}px Inter, system-ui, sans-serif`;

  const ZONAS = [
    { n: 'SALA DE GUIONES', x: 0.4, y: 0.4, w: 5.8, d: 4.2, col: '#cfe6ff' },
    { n: 'ESTUDIO · FÁBRICA', x: 7.2, y: 0.4, w: 6.4, d: 4.2, col: '#e6d6ff' },
    { n: 'PUBLICACIÓN', x: 0.4, y: 5.4, w: 5.8, d: 4.2, col: '#d2f4e2' },
    { n: 'ANÁLISIS', x: 7.2, y: 5.4, w: 3.6, d: 4.2, col: '#ffe0c6' },
    { n: 'RELAX', x: 11.2, y: 5.4, w: 2.4, d: 4.2, col: '#fff0b3' },
    { n: 'PLATÓ DEL REPARTO', x: 14.4, y: 0.4, w: 4.2, d: 9.2, col: '#ffd9e8' }
  ];
  const AG = {
    guionista: { nom: 'Guionista', mesa: [3, 2.0], relax: [11.8, 6.6], camisa: '#14a8a0', pelo: '#3b2314', piel: '#f2c49b' },
    fabrica: { nom: 'Fábrica', mesa: [10.2, 2.0], relax: [12.9, 7.4], robot: true },
    publicador: { nom: 'Publicador', mesa: [3, 7.0], relax: [11.8, 8.4], camisa: '#3d7be0', pelo: '#e8b33c', piel: '#d99a6c' },
    analista: { nom: 'Analista', mesa: [9, 7.0], relax: [12.9, 9.0], camisa: '#8e5bd8', pelo: '#1b1b1b', piel: '#8d5a3b' }
  };
  // Reparto de los vídeos: personajes originales del canal
  const SPR = window.TC_SPR || { caiman: 'spr/caiman.png', rocco: 'spr/rocco.png', manolo: 'spr/manolo.png' };
  const REPARTO = {
    caiman: { nom: 'Don Caimán', alto: 74, pos: [16.9, 2.3] },
    rocco: { nom: 'Rocco', alto: 70, pos: [17.0, 7.1] },
    manolo: { nom: 'Agente Manolo', alto: 68, ruta: [[15.0, 9.0], [18.2, 9.0], [18.2, 4.6], [15.0, 4.6]] }
  };
  const RUTA_FLAMI = [[6.7, 1], [6.7, 9.4], [1, 5], [13.9, 5], [15.6, 4.2], [13.9, 9.4], [6.7, 5]];
  const ESTRENO = new Date('2026-11-19T00:00:00+01:00');

  const fmt = (v) => (v == null || isNaN(v) ? '—' : new Intl.NumberFormat('es-ES').format(v));
  const corto = (v) => (v == null || isNaN(v) ? '—' : v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',') + ' M' : v >= 1e4 ? Math.round(v / 1000) + ' mil' : fmt(v));

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
    const dia = new Date().getDay();
    e.analista = !an ? { modo: 'relax', txt: '…' } : horas(an.ultima) < 0.5 ? { modo: 'trabaja', txt: 'Estudiando datos 📊' } : { modo: 'duerme', txt: dia === 3 || dia === 0 ? 'Esta noche estudio 📊' : dia < 3 ? 'Vuelvo el miércoles' : 'Vuelvo el domingo' };
    const lista = vids.status === 'ok' ? vids.data : [];
    const es = lista.filter((x) => (x.canal || 'es') === 'es');
    const yt = redes.status === 'ok' ? redes.data.find((r) => r.red === 'YouTube') : null;
    const prox = pend.status === 'ok' ? pend.data.map((p) => p.nombre) : [];
    const faltan = (ESTRENO - Date.now()) / 3600000;
    return {
      est: e,
      vistas: T.vistas, likes: T.likes, videos: T.videos,
      pend: C.guiones || 0, listos: C.listos || 0,
      publicados: pub.status === 'ok' ? pub.data.length : null,
      proximos: prox.slice(0, 4),
      top: es.slice().sort((a, b) => b.vistas - a.vistas).slice(0, 3),
      redes: redes.status === 'ok' ? redes.data : [], vistasBr: T.vistas_br,
      hist: hist.status === 'ok' ? hist.data.map((h) => h.vistas) : [],
      subs: yt ? yt.seguidores : null,
      vistas90: es.filter((x) => Date.now() - new Date(x.publicado) < 90 * 864e5).reduce((s, x) => s + (Number(x.vistas) || 0), 0),
      pce,
      reparto: {
        caiman: prox.length ? { txt: '¡Acción! Rodamos: ' + (prox[0].length > 22 ? prox[0].slice(0, 22) + '…' : prox[0]) } : { txt: '¡Corten! Todo grabado 🎬' },
        rocco: faltan > 0 ? { txt: faltan > 48 ? `Plan GTA 6: faltan ${Math.ceil(faltan / 24)} días` : `Plan GTA 6: faltan ${Math.ceil(faltan)} h ⏳` } : { txt: '¡GTA 6 ya está en la calle! 🌴' },
        manolo: { txt: 'Aquí cero copyright 👮' }
      }
    };
  }

  // ---------- cielo de Vice City detrás de la oficina ----------
  const ESTRELLAS = Array.from({ length: 60 }, (_, i) => [(i * 137.5) % LW, (i * 71.3) % 230, (i % 3) + 1]);
  const EDIF = [[560, 70, 120], [590, 40, 170], [636, 56, 140], [690, 34, 210], [726, 60, 150], [790, 44, 190], [836, 64, 130]];
  function cielo(c, t) {
    const g = c.createLinearGradient(0, 0, 0, LH); g.addColorStop(0, '#24184a'); g.addColorStop(0.45, '#5a2a6e'); g.addColorStop(0.62, '#c2456f'); g.addColorStop(1, '#1e1a2e');
    c.fillStyle = g; c.fillRect(0, 0, LW, LH);
    ESTRELLAS.forEach(([x, y, r], i) => { c.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + i); c.fillStyle = '#fff'; c.fillRect(x, y, r, r); });
    c.globalAlpha = 1;
    // luna
    c.beginPath(); c.arc(820, 58, 22, 0, 7); c.fillStyle = '#ffe9b8'; c.fill();
    c.beginPath(); c.arc(812, 52, 22, 0, 7); c.fillStyle = 'rgba(36,24,74,.35)'; c.fill();
    // rascacielos con ventanas de neón
    EDIF.forEach(([x, w, h], i) => {
      const base = 330; rect(c, x, base - h, w, h, 2, i % 2 ? '#2a1d4d' : '#33245c');
      for (let fy = base - h + 10; fy < base - 8; fy += 12) for (let fx = x + 6; fx < x + w - 6; fx += 10) {
        if ((fx * 7 + fy * 3 + i) % 5 < 2) { c.fillStyle = (fx + fy) % 3 ? 'rgba(79,240,224,.55)' : 'rgba(255,111,174,.6)'; c.fillRect(fx, fy, 4, 5); }
      }
    });
    // palmeras a la izquierda
    [[70, 250, 1], [130, 205, 0.8]].forEach(([x, y, s]) => {
      c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#1b1233'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -60, 4, -110); c.stroke();
      c.fillStyle = '#1b1233';
      for (let k = 0; k < 6; k++) { c.save(); c.translate(4, -110); c.rotate(-2.6 + k * 0.85); c.beginPath(); c.ellipse(26, 0, 28, 6, 0, 0, 7); c.fill(); c.restore(); }
      c.restore();
    });
  }

  // ---------- pantallas en las paredes ----------
  function enMuroFondo(c, gx0, z0, fn) { const p = iso(gx0, 0, z0); c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); fn(); c.restore(); }
  function enMuroIzq(c, gy1, z0, fn) { const p = iso(0, gy1, z0); c.save(); c.transform(1, -0.5, 0, 1, p.x, p.y); fn(); c.restore(); }
  function enPlano(c, gx, gy, z, fn) { const p = iso(gx, gy, z); c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); fn(); c.restore(); }
  function marco(c, w, h) { rect(c, -3, -3, w + 6, h + 6, 5, '#14111f'); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d2742'); g.addColorStop(1, '#101625'); rect(c, 0, 0, w, h, 3, g); }
  function pantalla(c, w, h, titulo, valor, color, t) {
    marco(c, w, h);
    c.fillStyle = color; c.font = F(700, 9); c.fillText(titulo, 7, 13);
    c.fillStyle = '#ffffff'; c.font = F(800, 21); c.fillText(valor, 7, h - 10);
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t / 500); rect(c, w - 10, 6, 4, 4, 2, color); c.globalAlpha = 1;
  }
  function barra(c, x, y, w, val, meta, marca, col) {
    rect(c, x, y, w, 7, 3, '#2a3352');
    rect(c, x, y, Math.max(4, Math.min(1, (val || 0) / meta) * w), 7, 3, col);
    if (marca) { const mx = x + w * marca / meta; c.fillStyle = '#ffd36b'; c.fillRect(mx - 1, y - 3, 2, 13); }
  }

  function fondo(c, D, t) {
    // paredes
    poli(c, [iso(0, 0, 0), iso(GX, 0, 0), iso(GX, 0, MURO), iso(0, 0, MURO)], '#2b2540');
    poli(c, [iso(0, 0, 0), iso(0, GY, 0), iso(0, GY, MURO), iso(0, 0, MURO)], '#352d4f');
    poli(c, [iso(0, 0, MURO), iso(GX, 0, MURO), iso(GX, 0, MURO - 3), iso(0, 0, MURO - 3)], '#ff6fae');
    poli(c, [iso(0, 0, MURO), iso(0, GY, MURO), iso(0, GY, MURO - 3), iso(0, 0, MURO - 3)], '#ff6fae');
    poli(c, [iso(0, 0, 0), iso(GX, 0, 0), iso(GX, 0, 4), iso(0, 0, 4)], '#39d98a');
    poli(c, [iso(0, 0, 0), iso(0, GY, 0), iso(0, GY, 4), iso(0, 0, 4)], '#39d98a');
    // suelo de madera con canto
    poli(c, [iso(0, GY), iso(GX, GY), iso(GX, GY, -10), iso(0, GY, -10)], '#a8794a');
    poli(c, [iso(GX, 0), iso(GX, GY), iso(GX, GY, -10), iso(GX, 0, -10)], '#8c6038');
    poli(c, [iso(0, 0), iso(GX, 0), iso(GX, GY), iso(0, GY)], '#ecc995');
    c.strokeStyle = 'rgba(150,100,50,.18)'; c.lineWidth = 1;
    for (let i = 1; i < 28; i++) { const a = iso(i * 0.7, 0), b = iso(i * 0.7, GY); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    ZONAS.forEach((z) => poli(c, [iso(z.x, z.y, 0.5), iso(z.x + z.w, z.y, 0.5), iso(z.x + z.w, z.y + z.d, 0.5), iso(z.x, z.y + z.d, 0.5)], z.col));
    // alfombra roja del plató
    poli(c, [iso(15.1, 3.6, 1), iso(15.9, 3.6, 1), iso(15.9, 9.4, 1), iso(15.1, 9.4, 1)], '#e0507f');
    ZONAS.forEach((z) => {
      const p = iso(z.x + 0.3, z.y + z.d - 0.25, 1);
      c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); c.fillStyle = 'rgba(60,40,90,.55)'; c.font = F(800, 9); c.fillText('■ ' + z.n, 0, 0); c.restore();
    });
    // pantallas del muro del fondo
    enMuroFondo(c, 0.6, 104, () => pantalla(c, 78, 50, 'VISUALIZACIONES', fmt(D.vistas), '#4ff0e0', t));
    enMuroFondo(c, 3.8, 104, () => pantalla(c, 66, 50, 'LIKES', fmt(D.likes), '#ff6fae', t));
    enMuroFondo(c, 6.3, 108, () => {
      const w = 72, h = 70; marco(c, w, h);
      c.fillStyle = '#ffd36b'; c.font = F(700, 8); c.fillText('SEGUIDORES', 6, 12);
      const filas = [['YT', '#ff3d3d', 'YouTube'], ['TT', '#4ff0e0', 'TikTok'], ['IG', '#ff6fae', 'Instagram'], ['BR', '#39d98a', 'YouTube Brasil']];
      filas.forEach(([et, col, nom], i) => {
        const r = (D.redes || []).find((x) => x.red === nom);
        const y = 25 + i * 12;
        rect(c, 6, y - 7, 14, 9, 2, col); c.fillStyle = '#101625'; c.font = F(800, 6); c.fillText(et, 8, y);
        c.fillStyle = '#fff'; c.font = F(800, 9); c.fillText(r && r.seguidores != null ? fmt(r.seguidores) : '…', 25, y + 1);
      });
    });
    enMuroFondo(c, 9.2, 108, () => {
      const w = 130, h = 70; marco(c, w, h);
      c.fillStyle = '#ffd36b'; c.font = F(700, 9); c.fillText('🏆 LOS QUE MÁS TIRAN', 7, 13);
      if (!D.top.length) { c.fillStyle = '#8fa0c0'; c.font = F(600, 9); c.fillText('Esperando cifras del PC…', 7, 34); return; }
      const max = D.top[0].vistas || 1;
      D.top.forEach((v, i) => {
        const y = 24 + i * 16;
        c.fillStyle = '#c9d3ea'; c.font = F(600, 7); c.fillText(v.titulo.slice(0, 30) + (v.titulo.length > 30 ? '…' : ''), 7, y);
        rect(c, 7, y + 3, Math.max(3, 84 * v.vistas / max), 6, 2, ['#ff6fae', '#4ff0e0', '#ffd36b'][i]);
        c.fillStyle = '#fff'; c.font = F(700, 8); c.fillText(fmt(v.vistas), 96, y + 9);
      });
    });
    // gran pantalla: camino a cobrar (Programa de Socios de YouTube)
    enMuroFondo(c, 14.35, 112, () => {
      const w = 120, h = 84; marco(c, w, h);
      c.fillStyle = '#39d98a'; c.font = F(800, 9); c.fillText('💰 CAMINO A COBRAR', 7, 13);
      c.fillStyle = '#c9d3ea'; c.font = F(600, 7); c.fillText('Suscriptores', 7, 27);
      c.fillStyle = '#fff'; c.font = F(800, 8); c.textAlign = 'right'; c.fillText(`${fmt(D.subs)} / 1.000`, 113, 27); c.textAlign = 'left';
      barra(c, 7, 31, 106, D.subs, 1000, 500, '#ff6fae');
      c.fillStyle = '#c9d3ea'; c.font = F(600, 7); c.fillText('Shorts 90 días', 7, 52);
      c.fillStyle = '#fff'; c.font = F(800, 8); c.textAlign = 'right'; c.fillText(`${corto(D.vistas90)} / 10 M`, 113, 52); c.textAlign = 'left';
      barra(c, 7, 56, 106, D.vistas90, 1e7, 3e6, '#4ff0e0');
      c.fillStyle = '#ffd36b'; c.font = F(700, 6.5); c.fillText('▮ fase 1: miembros', 7, 77);
    });
    // muro izquierdo: pizarra de próximos guiones y neón
    enMuroIzq(c, 4.6, 104, () => {
      const w = 112, h = 74; rect(c, -4, -4, w + 8, h + 8, 4, '#b9b3c9'); rect(c, 0, 0, w, h, 2, '#fbfaff');
      c.fillStyle = '#2b2540'; c.font = F(800, 9); c.fillText(`PRÓXIMOS GUIONES (${D.pend})`, 6, 13);
      c.font = F(600, 8);
      (D.proximos.length ? D.proximos : ['Cola vacía: todo montado ✓']).forEach((n, i) => { c.fillStyle = i % 2 ? '#3d7be0' : '#e0507f'; c.fillText('• ' + (n.length > 22 ? n.slice(0, 22) + '…' : n), 6, 27 + i * 12); });
    });
    enMuroIzq(c, 9.4, 96, () => {
      const on = Math.sin(t / 450) > -0.8;
      c.shadowColor = on ? '#ff4fa3' : 'transparent'; c.shadowBlur = on ? 10 : 0;
      c.fillStyle = on ? '#ff6fae' : '#7a2e5a'; c.font = F(900, 15); c.fillText('FUERA DEL MAPA', 0, 0);
      c.shadowColor = on ? '#4ff0e0' : 'transparent'; c.fillStyle = on ? '#6ff5e8' : '#2e6a66'; c.font = F(800, 10); c.fillText('GTA 6 · 19 NOV', 22, 16);
      c.shadowBlur = 0;
    });
  }

  // ---------- muebles ----------
  function muebles(D, t) {
    const L = [];
    const add = (gx, gy, f) => L.push({ d: gx + gy, f });
    add(2.2, 2.9, (c) => { caja(c, 2.2, 2.6, 2, 0.8, 18, '#ffffff'); caja(c, 2.9, 2.7, 0.6, 0.35, 10, '#8a93a3', 18);
      const n = Math.min(8, D.pend); for (let i = 0; i < n; i++) caja(c, 3.7, 2.75, 0.35, 0.45, 2, i % 2 ? '#fffbe6' : '#f2eedd', 18 + i * 2.2); });
    add(1, 1, (c) => { caja(c, 0.7, 0.7, 0.5, 0.5, 10, '#c0703c'); c.beginPath(); const p = iso(0.95, 0.95, 26); c.arc(p.x, p.y, 11, 0, 7); c.fillStyle = '#3fbf6e'; c.fill(); });
    add(5.6, 1.0, (c) => { caja(c, 5.2, 0.6, 0.8, 0.5, 46, '#c99a5b'); for (let i = 0; i < 4; i++) caja(c, 5.25, 0.65, 0.7, 0.4, 2, ['#ff6fae', '#4ff0e0', '#ffd36b', '#8e5bd8'][i], 8 + i * 10); });
    add(9.4, 2.9, (c) => { caja(c, 9.2, 2.6, 2, 0.8, 18, '#2d2d3a'); caja(c, 9.9, 2.7, 0.7, 0.2, 18, '#14111f', 18);
      const p = iso(10.25, 2.7, 30); c.fillStyle = D.pce === 'Trabajando' ? '#4ff0e0' : '#3a4060'; c.fillRect(p.x - 6, p.y - 4, 12, 8); });
    add(12.4, 0.8, (c) => { caja(c, 12.2, 0.5, 1.2, 0.15, 80, '#39d98a'); });
    add(8.1, 1.3, (c) => {
      caja(c, 7.6, 0.7, 0.7, 0.6, 60, '#22202e');
      for (let i = 0; i < 5; i++) { const p = iso(7.6, 1.3, 10 + i * 10); const on = D.pce === 'Trabajando' && Math.floor(t / 200 + i) % 3; c.fillStyle = on ? '#39d98a' : '#454256'; c.fillRect(p.x + 4, p.y - 2, 4, 2); c.fillStyle = on && i % 2 ? '#ff6fae' : '#454256'; c.fillRect(p.x + 10, p.y - 1, 4, 2); }
    });
    add(12, 3.6, (c) => { const p = iso(12, 3.4, 0); c.strokeStyle = '#2b2540'; c.lineWidth = 2; [[-8, 0], [8, 0], [0, 6]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(p.x, p.y - 34); c.lineTo(p.x + dx, p.y + dy); c.stroke(); }); rect(c, p.x - 9, p.y - 44, 18, 12, 2, '#2b2540'); c.beginPath(); c.arc(p.x + 9, p.y - 38, 4, 0, 7); c.fillStyle = '#4ff0e0'; c.fill(); if (D.pce === 'Trabajando' && Math.floor(t / 500) % 2) { c.beginPath(); c.arc(p.x - 6, p.y - 41, 2, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); } });
    add(2.2, 7.9, (c) => { caja(c, 2.2, 7.6, 2, 0.8, 18, '#ffffff');
      [['#ff3d3d', 2.35], ['#111111', 2.95], ['#c13584', 3.55]].forEach(([col, x], i) => { caja(c, x, 7.75, 0.3, 0.12, 16, col, 18); if (i === 1) { const p = iso(x + 0.15, 7.75, 28); c.fillStyle = '#4ff0e0'; c.fillRect(p.x - 1, p.y, 3, 3); } });
    });
    for (let i = 0; i < Math.min(6, D.listos); i++) { const gx = 0.8 + (i % 3) * 0.55, gy = 8.6, z = Math.floor(i / 3) * 14; add(gx, gy + 0.01 * i, (c) => { caja(c, gx, gy, 0.5, 0.5, 14, '#c99a5b', z); const p = iso(gx + 0.25, gy + 0.5, z + 7); c.fillStyle = '#7a5530'; c.fillRect(p.x - 6, p.y - 1, 12, 2); }); }
    add(8.2, 7.9, (c) => { caja(c, 8.2, 7.6, 2, 0.8, 18, '#ffffff'); caja(c, 8.9, 7.7, 0.6, 0.35, 10, '#8a93a3', 18); });
    add(7.6, 6.2, (c) => {
      const p = iso(7.6, 6.0, 0); c.strokeStyle = '#7a5530'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - 10, p.y); c.lineTo(p.x + 4, p.y - 60); c.lineTo(p.x + 18, p.y); c.stroke();
      const w = 64, h = 44, x0 = p.x - 28, y0 = p.y - 72;
      rect(c, x0 - 2, y0 - 2, w + 4, h + 4, 3, '#7a5530'); rect(c, x0, y0, w, h, 2, '#fffdf7');
      c.fillStyle = '#2b2540'; c.font = F(800, 7); c.fillText('VISTAS POR HORA', x0 + 4, y0 + 9);
      const hs = D.hist.slice(-48);
      if (hs.length < 2) { c.fillStyle = '#8a8399'; c.font = F(600, 6.5); c.fillText('recogiendo datos…', x0 + 6, y0 + 28); return; }
      const mn = Math.min(...hs), mx = Math.max(...hs) || 1;
      c.beginPath(); hs.forEach((v, i) => { const x = x0 + 4 + (w - 8) * i / (hs.length - 1), y = y0 + h - 5 - (h - 18) * (v - mn) / ((mx - mn) || 1); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.strokeStyle = '#e0507f'; c.lineWidth = 2; c.stroke();
    });
    add(12.2, 8.2, (c) => { caja(c, 12.3, 6.2, 1.0, 2.6, 8, '#ff8fb8'); caja(c, 13.1, 6.2, 0.3, 2.6, 22, '#ff6fa3'); });
    add(11.6, 9.4, (c) => { const p = iso(11.6, 9.4, 6); c.beginPath(); c.ellipse(p.x, p.y, 13, 8, 0, 0, 7); c.fillStyle = '#4ad2e8'; c.fill(); c.beginPath(); c.ellipse(p.x, p.y - 4, 12, 6, 0, 0, 7); c.fillStyle = '#6fe0f0'; c.fill(); });
    add(13.3, 5.7, (c) => { caja(c, 13.0, 5.5, 0.5, 0.4, 30, '#3a3a48'); const p = iso(13.2, 5.9, 34); if (Math.floor(t / 900) % 2) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(p.x, p.y - 6, 2, 4); } });
    add(13.6, 9.7, (c) => { caja(c, 13.4, 9.4, 0.4, 0.4, 12, '#c0703c'); const p = iso(13.6, 9.6, 30); c.beginPath(); c.arc(p.x, p.y, 12, 0, 7); c.fillStyle = '#2f9e5b'; c.fill(); c.beginPath(); c.arc(p.x - 4, p.y - 6, 7, 0, 7); c.fillStyle = '#3fbf6e'; c.fill(); });

    // ---- plató del reparto ----
    // escenario con decorado de atardecer y palmeras
    add(15.7, 1.6, (c) => {
      caja(c, 15.6, 1.0, 2.8, 2.4, 6, '#5a3d7a');
      caja(c, 15.6, 0.9, 2.8, 0.12, 74, '#2b2540', 6);
      enPlano(c, 15.62, 1.02, 78, () => {
        const w = 2.76 * TW / 2, h = 70;
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ff6fae'); g.addColorStop(0.6, '#ffb36b'); g.addColorStop(1, '#ffd36b');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.beginPath(); c.arc(w / 2, h * 0.72, 16, Math.PI, 0); c.fillStyle = '#fff3b0'; c.fill();
        c.fillStyle = 'rgba(80,30,90,.55)'; for (let i = 0; i < 4; i++) c.fillRect(0, h * 0.72 + 4 + i * 4, w, 2);
        [[12, 1], [w - 14, -1]].forEach(([x, s]) => { c.strokeStyle = '#3a1d4f'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x + 4 * s, h - 30, x + 2 * s, h - 46); c.stroke(); c.fillStyle = '#3a1d4f'; for (let k = 0; k < 5; k++) { c.save(); c.translate(x + 2 * s, h - 46); c.rotate(-2.6 + k * 1.05); c.beginPath(); c.ellipse(11, 0, 12, 3, 0, 0, 7); c.fill(); c.restore(); } });
        c.fillStyle = '#fff'; c.font = F(900, 8); c.fillText('¿QUÉ HARÍAS?', 6, 11);
      });
    });
    // focos con haz de luz
    [[15.0, 1.4], [18.7, 3.8]].forEach(([gx, gy], i) => add(gx, gy, (c) => {
      const p = iso(gx, gy, 0); c.strokeStyle = '#2b2540'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 58); c.stroke();
      rect(c, p.x - 7, p.y - 66, 14, 10, 3, '#2b2540');
      const o = iso(16.9, 2.2, 10);
      c.globalAlpha = 0.16 + 0.05 * Math.sin(t / 700 + i); c.beginPath(); c.moveTo(p.x - 4, p.y - 60); c.lineTo(o.x - 26, o.y); c.lineTo(o.x + 26, o.y); c.lineTo(p.x + 4, p.y - 60); c.closePath(); c.fillStyle = '#fff3b0'; c.fill(); c.globalAlpha = 1;
    }));
    // cámara de cine con trípode y piloto rojo
    add(15.4, 5.4, (c) => {
      const p = iso(15.4, 5.4, 0); c.strokeStyle = '#2b2540'; c.lineWidth = 2;
      [[-9, 0], [9, 0], [0, 7]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(p.x, p.y - 36); c.lineTo(p.x + dx, p.y + dy); c.stroke(); });
      rect(c, p.x - 13, p.y - 50, 26, 16, 3, '#1b1b26'); c.beginPath(); c.arc(p.x + 2, p.y - 54, 7, 0, 7); c.arc(p.x - 9, p.y - 54, 6, 0, 7); c.fillStyle = '#1b1b26'; c.fill();
      rect(c, p.x + 11, p.y - 47, 8, 9, 2, '#3a3a48');
      if (Math.floor(t / 600) % 2) { c.beginPath(); c.arc(p.x - 9, p.y - 45, 2.4, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); }
    });
    // silla de director "FLAMI"
    add(16.4, 5.0, (c) => {
      const p = iso(16.4, 5.0, 0); c.strokeStyle = '#7a5530'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - 8, p.y); c.lineTo(p.x + 8, p.y - 18); c.moveTo(p.x + 8, p.y); c.lineTo(p.x - 8, p.y - 18); c.stroke();
      rect(c, p.x - 10, p.y - 20, 20, 4, 1, '#e0507f'); rect(c, p.x - 10, p.y - 34, 20, 9, 1, '#e0507f');
      c.fillStyle = '#fff'; c.font = F(900, 6); c.fillText('FLAMI', p.x - 9, p.y - 27);
    });
    // claqueta sobre una mesita
    add(18.0, 5.6, (c) => {
      caja(c, 17.8, 5.4, 0.5, 0.5, 14, '#3a3a48');
      const p = iso(18.05, 5.65, 15); const ab = Math.floor(t / 1600) % 2 ? -0.35 : 0;
      rect(c, p.x - 9, p.y - 10, 18, 11, 1, '#1b1b26');
      c.save(); c.translate(p.x - 9, p.y - 10); c.rotate(ab); c.fillStyle = '#fff'; c.fillRect(0, -4, 18, 4); c.fillStyle = '#1b1b26'; for (let i = 0; i < 4; i++) c.fillRect(1 + i * 4.5, -4, 2, 4); c.restore();
    });
    // pizarra del plan de Rocco
    add(17.9, 6.5, (c) => {
      const p = iso(17.9, 6.5, 0); c.strokeStyle = '#7a7390'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - 14, p.y); c.lineTo(p.x - 10, p.y - 30); c.moveTo(p.x + 14, p.y); c.lineTo(p.x + 10, p.y - 30); c.stroke();
      rect(c, p.x - 22, p.y - 64, 44, 36, 2, '#7a7390'); rect(c, p.x - 20, p.y - 62, 40, 32, 1, '#fbfaff');
      c.fillStyle = '#2b2540'; c.font = F(900, 6); c.fillText('PLAN 19/11', p.x - 17, p.y - 54);
      c.strokeStyle = '#3d7be0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.x - 16, p.y - 36); c.lineTo(p.x - 6, p.y - 46); c.lineTo(p.x + 4, p.y - 40); c.lineTo(p.x + 14, p.y - 50); c.stroke();
      c.strokeStyle = '#e0507f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p.x + 10, p.y - 54); c.lineTo(p.x + 18, p.y - 46); c.moveTo(p.x + 18, p.y - 54); c.lineTo(p.x + 10, p.y - 46); c.stroke();
    });
    // palmera en maceta en la esquina del plató
    add(18.4, 9.4, (c) => {
      caja(c, 18.2, 9.2, 0.45, 0.45, 12, '#c0703c'); const p = iso(18.42, 9.42, 12);
      c.strokeStyle = '#7a5530'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x + 4, p.y - 26, p.x + 1, p.y - 44); c.stroke();
      c.fillStyle = '#2f9e5b'; for (let k = 0; k < 6; k++) { c.save(); c.translate(p.x + 1, p.y - 44); c.rotate(-2.7 + k * 0.9); c.beginPath(); c.ellipse(14, 0, 15, 4, 0, 0, 7); c.fill(); c.restore(); }
    });
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
    if (e.modo === 'duerme' && !quieto) for (let i = 0; i < 3; i++) { const k = ((t / 1000) + i / 3) % 1; c.globalAlpha = 1 - k; c.fillStyle = '#5a4b8a'; c.font = F(800, 10); c.fillText('z', q.x + 12 + i * 4 + k * 6, y0 - 40 - k * 18); c.globalAlpha = 1; }
    if (e.modo === 'alerta' && Math.floor(t / 300) % 2) { c.beginPath(); c.arc(q.x, y0 - 64, 8, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); c.fillStyle = '#fff'; c.font = F(900, 11); c.fillText('!', q.x - 2, y0 - 60); }
    if (a.nom === 'Guionista' && e.modo === 'trabaja' && !quieto) { const k = (t / 1400) % 1; c.globalAlpha = 1 - k; rect(c, q.x + 14 + k * 10, y0 - 40 - k * 20, 8, 10, 1, '#fffbe6'); c.globalAlpha = 1; }
  }

  function actor(c, img, r, p, t, quieto) {
    const q = iso(p.x, p.y, r === REPARTO.caiman ? 6 : 0);
    c.beginPath(); c.ellipse(q.x, q.y, 15, 6, 0, 0, 7); c.fillStyle = 'rgba(40,20,60,.25)'; c.fill();
    if (!img || !img.complete || !img.naturalWidth) { rect(c, q.x - 9, q.y - 40, 18, 40, 8, '#7a6aa8'); return; }
    const h = r.alto, w = h * img.naturalWidth / img.naturalHeight;
    const bote = quieto ? 0 : p.anda ? Math.abs(Math.sin(t / 160)) * 2.5 : Math.sin(t / 650) * 1.2;
    c.save(); c.translate(q.x, q.y - bote); if (p.dir < 0) c.scale(-1, 1);
    c.drawImage(img, -w / 2, -h, w, h); c.restore();
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
    LW, LH,
    mount(el) {
      el.replaceChildren();
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Oficina isométrica con los agentes del canal, el plató del reparto y sus datos');
      const capa = document.createElement('div'); capa.className = 'tc-ofi-capa';
      el.append(cv, capa);
      const quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = { cv, capa, D: datos(), pos: {}, flami: { x: 6.7, y: 5, i: 0, dir: 1 }, id: 0, quieto, ult: 0, img: {}, actores: {} };
      Object.entries(AG).forEach(([k, a]) => { st.pos[k] = { x: a.relax[0], y: a.relax[1], llegado: true }; });
      Object.entries(REPARTO).forEach(([k, r]) => {
        const im = new Image(); im.onload = () => st.quieto && requestAnimationFrame(st.frame); im.src = SPR[k]; st.img[k] = im;
        const ini = r.pos || r.ruta[0];
        st.actores[k] = { x: ini[0], y: ini[1], i: 1, dir: k === 'caiman' ? -1 : 1, anda: !!r.ruta, llegado: true };
      });
      const ctx = cv.getContext('2d');
      const coloca = (tag, q, alto) => {
        tag.nom.style.left = (q.x / LW * 100) + '%'; tag.nom.style.top = ((q.y + 6) / LH * 100) + '%';
        tag.bur.style.left = (q.x / LW * 100) + '%'; tag.bur.style.top = ((q.y - alto) / LH * 100) + '%';
      };
      const frame = (t) => {
        const dpr = Math.min(2, window.devicePixelRatio || 1), cw = el.clientWidth || LW;
        const sc = cw / LW;
        if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * LH / LW * dpr); }
        const dt = Math.min(60, t - (st.ult || t)); st.ult = t;
        ctx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
        ctx.clearRect(0, 0, LW, LH);
        cielo(ctx, t);
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
        Object.entries(REPARTO).forEach(([k, r]) => {
          const p = st.actores[k];
          if (r.ruta && !st.quieto) {
            const obj = r.ruta[p.i], dx = obj[0] - p.x, dy = obj[1] - p.y, dist = Math.hypot(dx, dy), v = 0.0007 * dt;
            if (dist < v) p.i = (p.i + 1) % r.ruta.length; else { p.x += dx / dist * v; p.y += dy / dist * v; p.dir = (dx - dy) >= 0 ? 1 : -1; }
          }
          L.push({ d: p.x + p.y + 0.06, f: (c) => actor(c, st.img[k], r, p, t, st.quieto) });
        });
        const f = st.flami, obj = RUTA_FLAMI[f.i];
        if (!st.quieto) {
          const dx = obj[0] - f.x, dy = obj[1] - f.y, dist = Math.hypot(dx, dy), v = 0.0012 * dt;
          if (dist < v) f.i = (f.i + 1) % RUTA_FLAMI.length; else { f.x += dx / dist * v; f.y += dy / dist * v; f.dir = (dx - dy) >= 0 ? 1 : -1; }
        }
        L.push({ d: f.x + f.y + 0.02, f: (c) => flamenco(c, f, t, st.quieto) });
        L.sort((a, b) => a.d - b.d).forEach((o) => o.f(ctx));
        if (st.tags) {
          Object.keys(AG).forEach((k) => { const p = st.pos[k], tag = st.tags[k]; if (!tag) return; coloca(tag, iso(p.x, p.y, 0), 70); tag.bur.hidden = !p.llegado; });
          Object.entries(REPARTO).forEach(([k, r]) => { const p = st.actores[k], tag = st.tags[k]; if (tag) coloca(tag, iso(p.x, p.y, k === 'caiman' ? 6 : 0), r.alto + 8); });
        }
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
      const etiqueta = (k, nombre, e, clase) => {
        const nom = document.createElement('div'); nom.className = 'tc-tag' + (clase ? ' ' + clase : ''); nom.textContent = nombre;
        const bur = document.createElement('div'); bur.className = 'tc-burbuja'; bur.textContent = e.txt || '…'; if (e.s) bur.dataset.s = e.s;
        st.capa.append(nom, bur); st.tags[k] = { nom, bur };
      };
      Object.entries(AG).forEach(([k, a]) => etiqueta(k, a.nom, st.D.est[k] || {}));
      Object.entries(REPARTO).forEach(([k, r]) => etiqueta(k, r.nom, st.D.reparto[k] || {}, 'tc-tag-rep'));
      const fl = document.createElement('div'); fl.className = 'tc-sello';
      fl.textContent = st.D.publicados != null ? `🎞️ ${fmt(st.D.publicados)} vídeos publicados · 📦 ${st.D.listos} por subir` : '…';
      st.capa.append(fl);
      if (st.quieto) requestAnimationFrame(st.frame);
    },
    unmount(el, st) { if (st) cancelAnimationFrame(st.id); }
  };
})();
