// Oficina Flami: planta isométrica grande con una sala por agente. Se arrastra para moverse y se pellizca para hacer zoom.
window.tcOfi = (() => {
  const GX = 21, GY = 15, TW = 64, TH = 32, MURO = 170;
  const OX = 500, OY = 250, LW = 1192, LH = 860;
  const iso = (gx, gy, z = 0) => ({ x: OX + (gx - gy) * TW / 2, y: OY + (gx + gy) * TH / 2 - z });
  const ESTRENO = new Date('2026-11-19T00:00:00+01:00');
  const SPR = window.TC_SPR || {};
  const ruta = (n) => SPR[n] || `spr/${n}.png`;
  // Letras: Fredoka para carteles y bocadillos, VT323 para lo que sale en las pantallas
  const R = (p, s) => `${p} ${s}px Fredoka, "Baloo 2", "Comic Sans MS", system-ui, sans-serif`;
  const P = (s) => `${s}px VT323, "Courier New", monospace`;

  const SALAS = {
    guiones: { n: 'Sala de guiones', x: 0.3, y: 0.3, w: 6.5, d: 6.0, suelo: '#cfe3fb', borde: '#9fc2ee' },
    recepcion: { n: 'Recepción', x: 7.3, y: 0.3, w: 6.4, d: 6.0, suelo: '#f6ecd9', borde: '#e0cba6' },
    analisis: { n: 'Análisis', x: 14.2, y: 0.3, w: 6.5, d: 6.0, suelo: '#fde0c8', borde: '#f2bb92' },
    publicacion: { n: 'Publicación', x: 0.3, y: 7.9, w: 6.5, d: 6.8, suelo: '#d3f2df', borde: '#9bd8b3' },
    plato: { n: 'Plató · fábrica', x: 7.3, y: 7.9, w: 6.4, d: 6.8, suelo: '#e4d7fb', borde: '#bea9ec' },
    relax: { n: 'Zona chill', x: 14.2, y: 7.9, w: 6.5, d: 6.8, suelo: '#fdefb8', borde: '#efd27a' }
  };
  const AG = {
    guionista: { sala: 'guiones', p: 'rocco', mesa: [3.6, 2.5], sofa: [1.5, 5.2], chill: [15.3, 10.1] },
    fabrica: { sala: 'plato', p: 'flami', mesa: [11.9, 9.7], sofa: [9.9, 14.0], chill: [17.4, 9.9] },
    analista: { sala: 'analisis', p: 'caiman', mesa: [17.6, 2.5], sofa: [19.6, 4.4], chill: [19.3, 12.6] },
    publicador: { sala: 'publicacion', p: 'manolo', mesa: [3.6, 10.6], sofa: [5.4, 12.8], chill: [15.6, 13.6] }
  };
  const MODO = { trabaja: ['trabajando', '#2fbf71'], relax: ['de descanso', '#e8a93a'], duerme: ['durmiendo', '#a79fd0'], alerta: ['¡ojo!', '#ff6b7d'] };

  // ---------- utilidades ----------
  const fmt = (v) => (v == null || isNaN(v) ? '—' : new Intl.NumberFormat('es-ES').format(v));
  const corto = (v) => (v == null || isNaN(v) ? '—' : v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : v >= 1e4 ? Math.round(v / 1000) + 'K' : fmt(v));
  const tono = (hex, f) => { const n = parseInt(hex.slice(1), 16), k = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${k(n >> 16)},${k((n >> 8) & 255)},${k(n & 255)})`; };
  const poli = (c, pts, col) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.closePath(); c.fillStyle = col; c.fill(); };
  const caja = (c, gx, gy, w, d, h, col, z0 = 0) => {
    const t = z0 + h;
    poli(c, [iso(gx, gy + d, z0), iso(gx + w, gy + d, z0), iso(gx + w, gy + d, t), iso(gx, gy + d, t)], tono(col, 0.84));
    poli(c, [iso(gx + w, gy, z0), iso(gx + w, gy + d, z0), iso(gx + w, gy + d, t), iso(gx + w, gy, t)], tono(col, 0.7));
    poli(c, [iso(gx, gy, t), iso(gx + w, gy, t), iso(gx + w, gy + d, t), iso(gx, gy + d, t)], col);
  };
  const rr = (c, x, y, w, h, r, col) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = col; c.fill(); };
  const tx = (c, s, x, y, f, col, al = 'left') => { c.font = f; c.fillStyle = col; c.textAlign = al; c.fillText(s, x, y); c.textAlign = 'left'; };
  const corta = (c, s, max) => { s = String(s || ''); if (c.measureText(s).width <= max) return s; while (s.length > 1 && c.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };
  const enX = (c, gx, gy, z, fn) => { const p = iso(gx, gy, z); c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); fn(); c.restore(); };
  const enY = (c, gx, gy, z, fn) => { const p = iso(gx, gy, z); c.save(); c.transform(1, -0.5, 0, 1, p.x, p.y); fn(); c.restore(); };
  const madrid = (x) => new Date(x.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  function siguiente(lista) {
    const ahora = new Date(), des = madrid(ahora) - ahora;
    for (let d = 0; d < 8; d++) for (const [dias, h, m] of lista) {
      const b = madrid(ahora); b.setDate(b.getDate() + d); b.setHours(h, m, 0, 0);
      if (dias && !dias.includes(b.getDay())) continue;
      const r = new Date(b - des); if (r > ahora) return r;
    }
    return null;
  }
  const hora = (x) => (x ? x.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

  // ¿Hay que encender el PC? Los guiones llegan a las 06:42 y solo el PC los convierte en vídeos.
  function consejoPC(pce, guiones, listos, ultPc) {
    const ahora = new Date(), des = madrid(ahora) - ahora;
    const hoy = madrid(ahora); hoy.setHours(6, 50, 0, 0); const llegada = new Date(hoy - des);
    const sinVer = ultPc && ahora > llegada && new Date(ultPc) < llegada;   // guiones de hoy que el PC aún no ha visto
    if (pce === 'Trabajando') return guiones > 0 ? ['Déjalo encendido', `Está montando ${guiones} vídeo${guiones > 1 ? 's' : ''}`, '#2fbf71'] : ['Puedes apagarlo', 'Todo montado. Mañana a las 7:00 llegan más guiones', '#7aa8ff'];
    if (guiones > 0 || sinVer) return ['¡Enciéndelo!', guiones > 0 ? `Hay ${guiones} guion${guiones > 1 ? 'es' : ''} esperando a la fábrica` : 'Han llegado los guiones de hoy', '#ff6b7d'];
    if (pce === 'Apagado') return listos > 0 ? ['No hace falta', `Hay ${listos} vídeos listos y se suben solos`, '#e8a93a'] : ['Enciéndelo a las 7:00', 'Cuando lleguen los guiones de mañana', '#e8a93a'];
    return ['Sin datos del PC', 'Enciéndelo para saber cómo va', '#a79fd0'];
  }

  // ---------- datos ----------
  function datos() {
    const v = (id) => { const r = dash.data(id); return r.status === 'ok' ? r.data : []; };
    const T = v('totales')[0] || {}, C = v('cola')[0] || {}, pce = (v('pc_estado')[0] || {}).estado, pc = v('pc')[0] || {};
    const ag = v('agentes'), fila = (id) => ag.find((a) => a.id === id);
    const horas = (s) => (s ? (Date.now() - new Date(s)) / 36e5 : Infinity);
    const g = fila('guionista'), pu = fila('publicador'), an = fila('analista');
    const e = {};
    e.guionista = !g ? { modo: 'relax', txt: 'Pensando ideas…' } : g.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Hoy no he escrito!' } : horas(g.ultima) < 1.5 ? { modo: 'trabaja', txt: 'Escribiendo guiones' } : { modo: 'relax', txt: 'Guiones de hoy hechos' };
    e.fabrica = pce === 'Apagado' ? { modo: 'duerme', txt: 'PC apagado' } : pce !== 'Trabajando' ? { modo: 'relax', txt: 'Esperando al PC…' } : (C.guiones || 0) > 0 ? { modo: 'trabaja', txt: `¡Grabando ${C.guiones} vídeo${C.guiones > 1 ? 's' : ''}!` } : { modo: 'relax', txt: 'Todo grabado' };
    e.publicador = !pu ? { modo: 'relax', txt: 'Revisando el copyright' } : pu.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Vídeos atascados!' } : horas(pu.ultima) < 0.4 ? { modo: 'trabaja', txt: 'Subiendo vídeos' } : (C.listos || 0) > 0 ? { modo: 'relax', txt: `${C.listos} listos para subir` } : { modo: 'relax', txt: 'Todo subido' };
    const dia = new Date().getDay();
    e.analista = !an ? { modo: 'relax', txt: 'Mirando cifras…' } : horas(an.ultima) < 0.5 ? { modo: 'trabaja', txt: 'Estudiando los datos' } : { modo: 'duerme', txt: dia === 3 || dia === 0 ? 'Esta noche estudio' : dia < 3 ? 'Vuelvo el miércoles' : 'Vuelvo el domingo' };
    const vids = v('videos'), es = vids.filter((x) => (x.canal || 'es') === 'es');
    const hist = v('historico').map((h) => ({ t: new Date(h.hora).getTime(), v: Number(h.vistas) || 0 }));
    let dia24 = null;
    if (hist.length > 1) { const u = hist[hist.length - 1], ref = hist.find((x) => u.t - x.t <= 864e5) || hist[0]; dia24 = u.v - ref.v; }
    const red = (n) => v('redes').find((r) => r.red === n) || {};
    return {
      est: e, pce, version: pc.version, act: pc.ultima_ejecucion,
      consejo: consejoPC(pce, C.guiones || 0, C.listos || 0, pc.ultima_ejecucion),
      vistas: T.vistas, likes: T.likes, guiones: C.guiones || 0, listos: C.listos || 0, publicados: v('publicados').length,
      proximos: v('pendientes').map((p) => p.nombre),
      hist: hist.slice(-48).map((h) => h.v), dia24,
      redes: { yt: red('YouTube'), br: red('YouTube Brasil'), tt: red('TikTok'), ig: red('Instagram') },
      top: es.slice().sort((a, b) => b.vistas - a.vistas).slice(0, 3),
      prox: { guionista: siguiente([[null, 6, 42]]), publicador: siguiente([[null, 12, 47], [null, 22, 47]]), analista: siguiente([[[0, 3], 20, 37]]) }
    };
  }

  // ---------- pantallas ----------
  function pantalla(c, w, h, t, color = '#7df9c8') {
    rr(c, -6, -6, w + 12, h + 12, 9, '#1c1828');
    rr(c, -3, -3, w + 6, h + 6, 7, '#2c2740');
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0f2a2a'); g.addColorStop(1, '#0a1a1f');
    rr(c, 0, 0, w, h, 5, g);
    c.save(); c.beginPath(); c.roundRect(0, 0, w, h, 5); c.clip();
    c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
    const k = ((t / 4000) % 1) * (h + 40) - 20; const gl = c.createLinearGradient(0, k - 20, 0, k + 20); gl.addColorStop(0, 'rgba(125,249,200,0)'); gl.addColorStop(0.5, 'rgba(125,249,200,.07)'); gl.addColorStop(1, 'rgba(125,249,200,0)');
    c.fillStyle = gl; c.fillRect(0, k - 20, w, 40);
    c.restore();
    c.shadowColor = color; c.shadowBlur = 6;
  }
  const finPantalla = (c) => { c.shadowBlur = 0; };

  // ---------- paredes, suelo y pantallas fijas ----------
  function edificio(c, D, t) {
    poli(c, [iso(0, GY), iso(GX, GY), iso(GX, GY, -16), iso(0, GY, -16)], '#8a6a52');
    poli(c, [iso(GX, 0), iso(GX, GY), iso(GX, GY, -16), iso(GX, 0, -16)], '#6f533f');
    poli(c, [iso(0, 0), iso(GX, 0), iso(GX, GY), iso(0, GY)], '#c9b79c');
    poli(c, [iso(0, 6.4), iso(GX, 6.4), iso(GX, 7.8), iso(0, 7.8)], '#8f7cb8');
    poli(c, [iso(6.85, 0), iso(7.25, 0), iso(7.25, GY), iso(6.85, GY)], '#8f7cb8');
    poli(c, [iso(13.75, 0), iso(14.15, 0), iso(14.15, GY), iso(13.75, GY)], '#8f7cb8');
    Object.values(SALAS).forEach((s) => {
      poli(c, [iso(s.x, s.y, 0.5), iso(s.x + s.w, s.y, 0.5), iso(s.x + s.w, s.y + s.d, 0.5), iso(s.x, s.y + s.d, 0.5)], s.suelo);
      c.strokeStyle = s.borde; c.lineWidth = 1;
      for (let i = 1; i < s.w; i++) { const a = iso(s.x + i, s.y, 0.5), b = iso(s.x + i, s.y + s.d, 0.5); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      for (let i = 1; i < s.d; i++) { const a = iso(s.x, s.y + i, 0.5), b = iso(s.x + s.w, s.y + i, 0.5); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    });
    poli(c, [iso(0, 0), iso(GX, 0), iso(GX, 0, MURO), iso(0, 0, MURO)], '#efe6f7');
    poli(c, [iso(0, 0), iso(0, GY), iso(0, GY, MURO), iso(0, 0, MURO)], '#ddd0ec');
    poli(c, [iso(0, 0), iso(GX, 0), iso(GX, 0, 12), iso(0, 0, 12)], '#7a5d9a');
    poli(c, [iso(0, 0), iso(0, GY), iso(0, GY, 12), iso(0, 0, 12)], '#6a4f88');
    poli(c, [iso(0, 0, MURO), iso(GX, 0, MURO), iso(GX, 0, MURO + 10), iso(0, 0, MURO + 10)], '#4b3a6b');
    poli(c, [iso(0, 0, MURO), iso(0, GY, MURO), iso(0, GY, MURO + 10), iso(0, 0, MURO + 10)], '#3f3060');
    [6.9, 13.8].forEach((gx) => enX(c, gx, 0, 150, () => rr(c, 0, 0, 10, 138, 2, '#7a5d9a')));
    enX(c, 0.7, 0, 158, () => pizarraGuiones(c, D));
    enX(c, 7.75, 0, 162, () => muroSeguidores(c, D, t));
    enX(c, 14.6, 0, 158, () => graficaVistas(c, D, t));
    enY(c, 0, 5.9, 132, () => neon(c, t));
    enY(c, 0, 14.3, 158, () => pantallaPublicacion(c, D, t));
  }

  function pizarraGuiones(c, D) {
    const w = 170, h = 112;
    rr(c, -5, -5, w + 10, h + 10, 6, '#b8a98e'); rr(c, 0, 0, w, h, 3, '#fbfaf3');
    tx(c, 'próximos guiones', 10, 20, R(600, 15), '#3a2f55');
    tx(c, String(D.guiones), w - 12, 22, R(700, 20), '#e0507f', 'right');
    c.strokeStyle = '#e8dfc8'; c.lineWidth = 1; for (let y = 34; y < h - 10; y += 18) { c.beginPath(); c.moveTo(8, y + 4); c.lineTo(w - 8, y + 4); c.stroke(); }
    const L = D.proximos.length ? D.proximos.slice(0, 3) : ['cola vacía, todo montado ✓'];
    c.font = R(500, 13); L.forEach((n, i) => tx(c, corta(c, n, w - 20), 10, 50 + i * 18, R(500, 13), i % 2 ? '#3d7be0' : '#d04478'));
    tx(c, 'siguiente tanda ' + hora(D.prox.guionista), 10, h - 7, R(500, 11), '#8a7f99');
    rr(c, 24, h + 2, 30, 5, 2, '#e0507f'); rr(c, 60, h + 2, 30, 5, 2, '#3d7be0');
  }
  function monitorPC(c, D, t) {
    const w = 118, h = 112; pantalla(c, w, h, t);
    const on = D.pce === 'Trabajando', off = D.pce === 'Apagado';
    const col = on ? '#7df9c8' : off ? '#ff7a8a' : '#c9c2e6';
    tx(c, 'PC FÁBRICA', 8, 18, P(18), '#7df9c8');
    if (Math.floor(t / 700) % 2 || !off) { c.beginPath(); c.arc(16, 40, 6, 0, 7); c.fillStyle = col; c.fill(); }
    tx(c, on ? 'ENCENDIDO' : off ? 'APAGADO' : 'SIN DATOS', 28, 47, P(24), col);
    tx(c, 'grabando ' + D.guiones, 8, 72, P(19), '#d8fff0');
    tx(c, 'listos    ' + D.listos, 8, 90, P(19), '#d8fff0');
    tx(c, D.version ? 'ver ' + D.version : '', 8, h - 6, P(15), '#5fbf9a');
    finPantalla(c);
  }
  function graficaVistas(c, D, t) {
    const w = 170, h = 112; pantalla(c, w, h, t);
    tx(c, 'VISTAS', 8, 18, P(18), '#7df9c8');
    tx(c, D.dia24 != null ? `+${fmt(D.dia24)} hoy` : '', w - 8, 18, P(18), '#ffd36b', 'right');
    tx(c, fmt(D.vistas), 8, 44, P(32), '#ffffff');
    const hs = D.hist, x0 = 8, y0 = 52, cw = w - 16, ch = 36;
    if (hs.length > 1) {
      const mn = Math.min(...hs), mx = Math.max(...hs);
      const pts = hs.map((v, i) => [x0 + cw * i / (hs.length - 1), y0 + ch - ch * (v - mn) / ((mx - mn) || 1)]);
      c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.lineTo(x0 + cw, y0 + ch); c.lineTo(x0, y0 + ch); c.fillStyle = 'rgba(125,249,200,.15)'; c.fill();
      c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.strokeStyle = '#7df9c8'; c.lineWidth = 2; c.stroke();
      const [ux, uy] = pts[pts.length - 1]; if (Math.floor(t / 400) % 2) { c.beginPath(); c.arc(ux, uy, 3, 0, 7); c.fillStyle = '#fff'; c.fill(); }
    } else tx(c, 'recogiendo datos...', x0, y0 + 22, P(17), '#5fbf9a');
    tx(c, `♥ ${fmt(D.likes)} · ${hora(D.prox.analista)}`, 8, h - 6, P(15), '#5fbf9a');
    finPantalla(c);
  }
  function pantallaPublicacion(c, D, t) {
    const w = 170, h = 112; pantalla(c, w, h, t);
    tx(c, 'POR SUBIR', 8, 18, P(17), '#ffd36b'); tx(c, 'SUBIDOS', 96, 18, P(17), '#7df9c8');
    tx(c, fmt(D.listos), 8, 54, P(42), '#fff'); tx(c, fmt(D.publicados), 96, 54, P(42), '#fff');
    tx(c, 'YT  TT  IG', 8, 78, P(18), '#d8fff0');
    tx(c, 'próxima ' + hora(D.prox.publicador), 8, h - 8, P(16), '#5fbf9a');
    finPantalla(c);
  }
  function neon(c, t) {
    const on = Math.sin(t / 420) > -0.85;
    rr(c, -8, -10, 178, 74, 10, '#2a2140');
    c.shadowColor = '#ff4fa3'; c.shadowBlur = on ? 16 : 0;
    tx(c, 'Fuera del Mapa', 6, 26, R(700, 28), on ? '#ff8cc0' : '#7a3a62');
    c.shadowColor = '#4ff0e0';
    const ms = ESTRENO - Date.now();
    tx(c, ms > 0 ? `GTA 6 en ${Math.floor(ms / 864e5)}d ${Math.floor(ms / 36e5) % 24}h ${Math.floor(ms / 6e4) % 60}m` : '¡GTA 6 ya a la venta!', 8, 52, R(600, 16), on ? '#7ff7ec' : '#2e6a66');
    c.shadowBlur = 0;
  }
  // tarjeta fija arriba (no se mueve con el zoom): ¿enciendo el PC?
  function cartelPC(c, D, t, cw) {
    const [titulo, txt, col] = D.consejo, w = Math.min(cw - 24, 460), h = 70, x = (cw - w) / 2, y = 12;
    const urge = col === '#ff6b7d';
    c.shadowColor = 'rgba(10,5,25,.45)'; c.shadowBlur = 14; c.shadowOffsetY = 4;
    rr(c, x, y, w, h, 18, 'rgba(36,28,58,.94)'); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.lineWidth = 2.5; c.strokeStyle = urge && Math.floor(t / 500) % 2 ? '#ffffff' : col; c.beginPath(); c.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 17); c.stroke();
    rr(c, x + 14, y + 15, 40, 30, 5, '#1c1828'); rr(c, x + 18, y + 19, 32, 22, 3, D.pce === 'Trabajando' ? '#7df9c8' : '#3b3850');
    rr(c, x + 29, y + 45, 10, 6, 2, '#1c1828'); rr(c, x + 22, y + 51, 24, 4, 2, '#1c1828');
    c.beginPath(); c.arc(x + 34, y + 31, 6, -1.2, 4.3); c.strokeStyle = D.pce === 'Trabajando' ? '#0a1a1f' : col; c.lineWidth = 2.2; c.stroke();
    c.beginPath(); c.moveTo(x + 34, y + 23); c.lineTo(x + 34, y + 30); c.stroke();
    let cab = '¿Enciendo el PC?';
    if (D.act) { const d = new Date(D.act); if (!isNaN(d)) cab += '  ·  datos de las ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
    tx(c, cab, x + 66, y + 22, R(500, 12.5), '#b9b1d6');
    tx(c, titulo, x + 66, y + 44, R(700, 20), col);
    c.font = R(500, 13); tx(c, corta(c, txt, w - 80), x + 66, y + 61, R(500, 13), '#e8e3fa');
  }

  // ---------- muebles de cada sala ----------
  function muebles(D, t, modos) {
    const L = [], add = (gx, gy, f) => L.push({ d: gx + gy, f });
    const mesa = (gx, gy, pc = true, on = false) => add(gx + 0.9, gy + 0.45, (c) => {
      caja(c, gx, gy, 1.8, 0.9, 30, '#ffffff');
      if (pc) { caja(c, gx + 0.6, gy + 0.15, 0.7, 0.12, 22, '#2d2a3a', 30); enX(c, gx + 0.64, gy + 0.27, 50, () => rr(c, 0, 0, 19, 17, 2, on ? '#7df9c8' : '#3b3850')); }
    });
    const planta = (gx, gy, s = 1) => add(gx, gy, (c) => { caja(c, gx - 0.25, gy - 0.25, 0.5, 0.5, 18, '#c0703c'); const p = iso(gx, gy, 18); c.fillStyle = '#3f9e5b'; [[-8, -14, 13], [8, -18, 12], [0, -30, 12], [-4, -42, 9]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(p.x + dx * s, p.y + dy * s, r * s, 0, 7); c.fill(); }); c.fillStyle = '#56b873'; c.beginPath(); c.arc(p.x + 4 * s, p.y - 36 * s, 7 * s, 0, 7); c.fill(); });
    const estanteria = (gx, gy) => add(gx + 0.5, gy + 0.2, (c) => { caja(c, gx, gy, 1.2, 0.4, 90, '#a8794f'); ['#e0507f', '#3d7be0', '#ffd36b', '#2fbf71', '#8e5bd8'].forEach((col, i) => caja(c, gx + 0.08 + (i % 3) * 0.36, gy + 0.05, 0.28, 0.3, 14, col, 34 + Math.floor(i / 3) * 34)); });

    const sillon = (gx, gy, col) => add(gx - 0.1, gy - 0.1, (c) => { caja(c, gx - 0.45, gy - 0.5, 0.9, 0.8, 16, col); caja(c, gx - 0.45, gy - 0.6, 0.9, 0.25, 38, tono(col, 0.88)); caja(c, gx - 0.6, gy - 0.5, 0.2, 0.8, 26, tono(col, 0.8)); caja(c, gx + 0.4, gy - 0.5, 0.2, 0.8, 26, tono(col, 0.8)); });
    Object.values(AG).forEach((g, i) => sillon(g.sofa[0], g.sofa[1] - 0.05, ['#14a8a0', '#ff8fb8', '#8e5bd8', '#3d7be0'][i]));
    // sala de guiones
    mesa(2.7, 3.0, true, modos.guionista === 'trabaja');
    add(4.4, 3.2, (c) => { const n = Math.min(10, D.guiones + 3); for (let i = 0; i < n; i++) caja(c, 4.1, 3.1, 0.45, 0.55, 2.4, i % 2 ? '#fffdf0' : '#f1ecd9', 30 + i * 2.6); });
    if (modos.guionista === 'trabaja') add(4.6, 3.6, (c) => { for (let i = 0; i < 3; i++) { const k = ((t / 1600) + i / 3) % 1, p = iso(4.3 + k * 1.4, 3.3, 60 + k * 60); c.globalAlpha = 1 - k; rr(c, p.x, p.y, 12, 15, 1, '#fffdf0'); c.globalAlpha = 1; } });
    estanteria(0.6, 0.5); planta(6.2, 5.6); planta(5.4, 0.9, 0.8);
    // recepción (fondo, centro): mostrador y sofás de espera
    add(10.6, 4.4, (c) => {
      caja(c, 9.2, 3.8, 2.8, 0.9, 40, '#ff8fb8'); caja(c, 9.1, 3.7, 3.0, 1.1, 5, '#ffffff', 40);
      enX(c, 9.5, 4.7, 26, () => tx(c, 'Fuera del Mapa', 0, 0, R(700, 15), '#ffffff'));
    });
    add(8.4, 5.4, (c) => { caja(c, 7.7, 5.0, 1.5, 0.8, 14, '#14a8a0'); caja(c, 7.7, 4.9, 1.5, 0.25, 32, '#0f8a83'); });
    planta(7.8, 1.0); planta(13.3, 1.0); planta(13.3, 5.7, 0.8);
    // análisis
    mesa(16.7, 3.0, true, modos.analista === 'trabaja');
    add(15.2, 4.7, (c) => {
      const p = iso(15.2, 4.7, 0); c.strokeStyle = '#8a5a35'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(p.x - 18, p.y); c.lineTo(p.x, p.y - 96); c.lineTo(p.x + 18, p.y); c.stroke();
      rr(c, p.x - 52, p.y - 118, 104, 72, 4, '#8a5a35'); rr(c, p.x - 48, p.y - 114, 96, 64, 2, '#fffdf4');
      tx(c, 'los que más tiran', p.x - 42, p.y - 100, R(600, 11), '#3a2f55');
      const max = (D.top[0] || {}).vistas || 1;
      D.top.forEach((v, i) => { const y = p.y - 90 + i * 14; rr(c, p.x - 42, y, Math.max(4, 70 * v.vistas / max), 8, 3, ['#e0507f', '#3d7be0', '#e8a93a'][i]); tx(c, corto(v.vistas), p.x + 34, y + 8, R(600, 10), '#3a2f55'); });
    });
    planta(20.2, 5.6); estanteria(19.2, 0.5);
    // publicación
    mesa(2.7, 11.1, false);
    add(3.6, 11.4, (c) => [['#e8333f', 2.85], ['#16151c', 3.35], ['#c13584', 3.85]].forEach(([col, gx], i) => {
      caja(c, gx, 11.25, 0.32, 0.12, 26, col, 30);
      if (Math.floor(t / 900 + i) % 4 === 0) { const p = iso(gx + 0.3, 11.25, 58); c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fillStyle = '#ff4d5e'; c.fill(); }
    }));
    for (let i = 0; i < Math.min(9, D.listos); i++) { const gx = 0.8 + (i % 3) * 0.62, gy = 13.4, z = Math.floor(i / 3) * 20; add(gx + 0.3, gy + 0.3 + i * 0.01, (c) => { caja(c, gx, gy, 0.55, 0.55, 20, '#d0a066', z); const p = iso(gx + 0.27, gy + 0.55, z + 10); c.fillStyle = '#8a5a35'; c.fillRect(p.x - 7, p.y - 1, 14, 3); }); }
    planta(6.2, 8.5); planta(6.2, 14.2, 0.8);
    // plató (delante, centro): croma, escenario, focos, cámara, servidor y monitor del PC
    add(11.8, 8.6, (c) => {
      caja(c, 10.4, 8.2, 2.9, 0.15, 6, '#2a2140'); caja(c, 10.4, 8.25, 0.1, 0.1, 118, '#2a2140'); caja(c, 13.2, 8.25, 0.1, 0.1, 118, '#2a2140');
      enX(c, 10.5, 8.35, 118, () => { rr(c, 0, 0, 86, 112, 3, modos.fabrica === 'duerme' ? '#1f6b46' : '#2fbf71'); c.fillStyle = 'rgba(255,255,255,.09)'; for (let x = 8; x < 86; x += 14) c.fillRect(x, 0, 2, 112); });
    });
    add(11.8, 9.6, (c) => caja(c, 10.6, 8.9, 2.6, 1.6, 6, '#5a3d7a'));
    [[9.6, 9.0], [13.3, 12.2]].forEach(([gx, gy], i) => add(gx, gy, (c) => {
      const p = iso(gx, gy, 0); c.strokeStyle = '#2a2140'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 96); c.stroke();
      [-12, 12].forEach((dx) => { c.beginPath(); c.moveTo(p.x, p.y - 20); c.lineTo(p.x + dx, p.y + 4); c.stroke(); });
      rr(c, p.x - 11, p.y - 110, 22, 16, 4, '#2a2140');
      if (modos.fabrica !== 'duerme') { const o = iso(11.9, 9.7, 0); c.globalAlpha = 0.13 + 0.04 * Math.sin(t / 600 + i); c.beginPath(); c.moveTo(p.x - 6, p.y - 100); c.lineTo(o.x - 46, o.y); c.lineTo(o.x + 46, o.y); c.lineTo(p.x + 6, p.y - 100); c.closePath(); c.fillStyle = '#fff3b0'; c.fill(); c.globalAlpha = 1; }
    }));
    add(11.2, 12.8, (c) => {
      const p = iso(11.2, 12.8, 0); c.strokeStyle = '#2a2140'; c.lineWidth = 3;
      [[-13, 0], [13, 0], [0, 8]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(p.x, p.y - 52); c.lineTo(p.x + dx, p.y + dy); c.stroke(); });
      rr(c, p.x - 20, p.y - 74, 40, 24, 5, '#1d1b28'); c.beginPath(); c.arc(p.x - 6, p.y - 82, 11, 0, 7); c.arc(p.x + 10, p.y - 82, 9, 0, 7); c.fillStyle = '#1d1b28'; c.fill();
      rr(c, p.x + 18, p.y - 68, 12, 12, 3, '#3a3a48');
      if (modos.fabrica === 'trabaja' && Math.floor(t / 600) % 2) { c.beginPath(); c.arc(p.x - 14, p.y - 66, 4, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); }
    });
    add(8.2, 12.6, (c) => {
      caja(c, 7.8, 12.2, 0.8, 0.7, 84, '#2a2738');
      for (let i = 0; i < 7; i++) { const p = iso(8.6, 12.5, 12 + i * 10); const on = D.pce === 'Trabajando' && Math.floor(t / 180 + i * 1.7) % 3; c.fillStyle = on ? '#7df9c8' : '#4a4660'; c.fillRect(p.x + 3, p.y - 2, 5, 2); c.fillStyle = on && i % 2 ? '#ff6fae' : '#4a4660'; c.fillRect(p.x + 11, p.y + 2, 5, 2); }
    });
    add(8.9, 8.6, (c) => {
      caja(c, 7.75, 8.25, 2.4, 0.3, 8, '#2a2140'); caja(c, 8.8, 8.3, 0.2, 0.2, 14, '#2a2140');
      enX(c, 7.8, 8.55, 128, () => monitorPC(c, D, t));
    });
    planta(13.3, 14.2);
    // zona chill
    add(16.4, 9.0, (c) => { caja(c, 15.0, 8.4, 2.6, 1.0, 16, '#8e5bd8'); caja(c, 15.0, 8.3, 2.6, 0.3, 40, '#7a4bc4'); caja(c, 14.9, 8.4, 0.3, 1.0, 28, '#7a4bc4'); caja(c, 17.4, 8.4, 0.3, 1.0, 28, '#7a4bc4'); });
    add(20.0, 8.6, (c) => {
      caja(c, 19.6, 8.2, 0.9, 0.8, 92, '#3d7be0');
      enX(c, 19.65, 9.0, 84, () => { rr(c, 0, 0, 26, 22, 3, Math.floor(t / 300) % 2 ? '#ff6fae' : '#ffd36b'); tx(c, 'GTA', 2, 15, P(15), '#1a1236'); });
    });
    add(20.1, 10.3, (c) => { caja(c, 19.8, 10.0, 0.6, 0.5, 46, '#5a5560'); const p = iso(20.1, 10.5, 50); if (Math.floor(t / 900) % 2) { c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(p.x, p.y - 8, 2, 6); c.fillRect(p.x + 4, p.y - 12, 2, 6); } });
    add(17.2, 12.0, (c) => {
      caja(c, 16.1, 11.5, 2.2, 1.1, 34, '#2fbf71'); c.strokeStyle = '#d0d0d8'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const a = iso(16.4 + i * 0.5, 11.5, 40), b = iso(16.4 + i * 0.5, 12.6, 40); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      const bx = 17.2 + Math.sin(t / 500) * 0.8, p = iso(bx, 12.05, 36); c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fillStyle = '#fff'; c.fill();
    });
    [[19.3, 11.6, '#ffd36b'], [16.6, 13.0, '#4ff0e0'], [15.4, 10.4, '#ff6fae']].forEach(([gx, gy, col]) => add(gx - 0.2, gy - 0.2, (c) => { const p = iso(gx, gy, 0); c.beginPath(); c.ellipse(p.x, p.y - 8, 26, 14, 0, 0, 7); c.fillStyle = tono(col, 0.8); c.fill(); c.beginPath(); c.ellipse(p.x, p.y - 14, 23, 11, 0, 0, 7); c.fillStyle = col; c.fill(); }));
    add(15.0, 14.3, (c) => {
      caja(c, 14.6, 14.0, 1.6, 0.4, 24, '#3a3348');
      enX(c, 14.65, 14.25, 82, () => { rr(c, -3, -3, 50, 34, 3, '#1c1828'); rr(c, 0, 0, 44, 28, 2, '#ff6fae'); const ms = ESTRENO - Date.now(); tx(c, ms > 0 ? `${Math.floor(ms / 36e5)}h` : '¡YA!', 22, 21, P(22), '#1a1236', 'center'); });
    });
    planta(20.3, 14.3);
    return L;
  }

  function muroSeguidores(c, D, t) {
    const w = 172, h = 164; pantalla(c, w, h, t, '#ffd36b');
    const r = D.redes, tot = ['yt', 'br', 'tt', 'ig'].reduce((a, k) => a + (Number(r[k].seguidores) || 0), 0);
    tx(c, 'SEGUIDORES', 8, 18, P(19), '#ffd36b'); tx(c, fmt(tot), w - 8, 18, P(19), '#ffffff', 'right');
    const f = [['YT', 'España', '#ff5a5a', r.yt.seguidores], ['BR', 'Brasil', '#4fe08f', r.br.seguidores], ['TT', 'TikTok', '#4ff0e0', r.tt.seguidores], ['IG', 'Instagram', '#ff8cc0', r.ig.seguidores]];
    f.forEach(([et, n, col, v], i) => {
      const x = 6 + (i % 2) * 82, y = 26 + Math.floor(i / 2) * 50;
      rr(c, x, y, 78, 46, 4, 'rgba(255,255,255,.06)');
      tx(c, et, x + 6, y + 15, P(17), col); tx(c, n, x + 26, y + 15, P(14), '#9fd9c2');
      tx(c, v != null ? corto(v) : '?', x + 6, y + 40, P(30), v != null ? '#ffffff' : '#ff7a8a');
    });
    tx(c, `vistas ${fmt(D.vistas)}  ♥ ${fmt(D.likes)}`, 8, 140, P(16), '#d8fff0');
    const subs = Number(r.yt.seguidores) || 0;
    rr(c, 8, 147, w - 16, 8, 3, 'rgba(255,255,255,.1)'); rr(c, 8, 147, Math.max(4, (w - 16) * Math.min(1, subs / 500)), 8, 3, '#7df9c8');
    tx(c, `${subs}/500 para miembros`, w - 8, h - 1, P(12), '#5fbf9a', 'right');
    finPantalla(c);
  }

  // ---------- personajes ----------
  function camino(a, dest) {
    const pasillo = 7.1, fila = (y) => (y < 6.4 ? 0 : 1);
    a.ruta = fila(a.y) === fila(dest[1]) && Math.abs(a.x - dest[0]) < 5 ? [dest] : [[a.x, pasillo], [dest[0], pasillo], dest];
    a.dest = dest;
  }
  function mover(a, dt, quieto) {
    if (!a.ruta || !a.ruta.length) { a.anda = false; return; }
    if (quieto) { [a.x, a.y] = a.ruta[a.ruta.length - 1]; a.ruta = []; a.anda = false; return; }
    const [x2, y2] = a.ruta[0], dx = x2 - a.x, dy = y2 - a.y, dist = Math.hypot(dx, dy), v = 0.0019 * dt;
    if (dist <= v) { a.x = x2; a.y = y2; a.ruta.shift(); } else { a.x += dx / dist * v; a.y += dy / dist * v; a.dir = (dx - dy) >= 0 ? 1 : -1; }
    a.anda = a.ruta.length > 0;
  }
  function dibujaPersonaje(c, st, k, est, t) {
    const a = st.act[k], g = AG[k], modo = est.modo;
    const pose = a.anda ? 'relax' : modo === 'trabaja' ? 'trabaja' : modo === 'alerta' ? 'alerta' : 'relax';
    const img = st.img[g.p + '_' + pose], q = iso(a.x, a.y, 0), alto = 118;
    const bote = st.quieto ? 0 : a.anda ? Math.abs(Math.sin(t / 130)) * 5 : modo === 'trabaja' ? Math.abs(Math.sin(t / 260)) * 2 : Math.sin(t / 800) * 1.5;
    c.beginPath(); c.ellipse(q.x, q.y, 30, 11, 0, 0, 7); c.fillStyle = 'rgba(40,20,60,.25)'; c.fill();
    if (img && img.complete && img.naturalWidth) {
      const w = alto * img.naturalWidth / img.naturalHeight;
      c.save(); c.translate(q.x, q.y - bote); if (a.dir > 0) c.scale(-1, 1); if (modo === 'duerme' && !a.anda) c.globalAlpha = 0.85;
      c.drawImage(img, -w / 2, -alto, w, alto); c.restore(); c.globalAlpha = 1;
    }
    a.cab = { x: q.x, y: q.y - alto - bote };
    if (modo === 'duerme' && !a.anda && !st.quieto) for (let i = 0; i < 3; i++) { const kk = ((t / 1300) + i / 3) % 1; c.globalAlpha = 1 - kk; tx(c, 'z', q.x + 28 + i * 8 + kk * 10, a.cab.y + 20 - kk * 32, R(700, 16 + i * 4), '#5a4b8a'); c.globalAlpha = 1; }
    if (modo === 'alerta' && Math.floor(t / 300) % 2) { c.beginPath(); c.arc(q.x + 34, a.cab.y + 10, 13, 0, 7); c.fillStyle = '#e8445a'; c.fill(); tx(c, '!', q.x + 34, a.cab.y + 17, R(700, 19), '#fff', 'center'); }
  }
  function bocadillo(c, st, k, est) {
    const a = st.act[k]; if (a.anda || !est.txt || !a.cab) return;
    c.font = R(600, 15); const w = c.measureText(est.txt).width + 24, h = 30;
    const x = a.cab.x - w / 2, y = a.cab.y - h - 12, col = est.modo === 'alerta' ? '#ffe3e6' : '#ffffff';
    c.shadowColor = 'rgba(40,20,70,.25)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    rr(c, x, y, w, h, 15, col); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.beginPath(); c.moveTo(a.cab.x - 7, y + h - 1); c.quadraticCurveTo(a.cab.x - 2, y + h + 8, a.cab.x + 4, y + h + 10); c.lineTo(a.cab.x + 6, y + h - 1); c.fillStyle = col; c.fill();
    tx(c, est.txt, x + 12, y + 20, R(600, 15), est.modo === 'alerta' ? '#9a1c2c' : '#3a2f55');
  }
  function cartel(c, sala, est) {
    const s = SALAS[sala];
    const p = s.y < 1 ? iso(s.x + s.w / 2, 0, MURO + 62) : s.x < 1 ? iso(0, s.y + s.d / 2, MURO + 62) : iso(s.x + s.w - 0.3, s.y + s.d - 0.3, 0);
    const [m, col] = est ? MODO[est.modo] || MODO.relax : [null, null];
    c.font = R(700, 16); const w1 = c.measureText(s.n).width; c.font = R(500, 13); const w2 = m ? c.measureText(m).width + 18 : 0;
    const w = Math.max(w1, w2) + 26, h = m ? 48 : 30, x = p.x - w / 2, y = p.y - h - 4;
    rr(c, x, y, w, h, 12, 'rgba(42,33,64,.9)');
    tx(c, s.n, p.x, y + 21, R(700, 16), '#ffffff', 'center');
    if (m) { c.beginPath(); c.arc(p.x - w2 / 2 + 4, y + 36, 4.5, 0, 7); c.fillStyle = col; c.fill(); tx(c, m, p.x - w2 / 2 + 14, y + 41, R(500, 13), col); }
  }

  // ---------- montaje, arrastre y zoom ----------
  return {
    LW, LH,
    mount(el) {
      el.replaceChildren();
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Oficina isométrica de Fuera del Mapa: una sala por agente, cada uno es un personaje del canal, con pantallas que muestran los datos reales y un cartel que dice si hay que encender el PC');
      cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
      const pista = document.createElement('div'); pista.className = 'tc-pista'; pista.textContent = 'Arrastra para moverte · pellizca para acercarte';
      el.append(cv, pista);
      setTimeout(() => pista.classList.add('fuera'), 4500);
      const quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = { cv, D: datos(), act: {}, img: {}, quieto, ult: 0, id: 0, vista: null };
      Object.entries(AG).forEach(([k, g]) => { st.act[k] = { x: g.sofa[0], y: g.sofa[1], dir: 1, ruta: [], dest: null }; });
      ['flami', 'rocco', 'manolo', 'caiman'].forEach((n) => ['relax', 'trabaja', 'alerta'].forEach((k) => { const im = new Image(); im.src = ruta(`${n}_${k}`); st.img[`${n}_${k}`] = im; }));
      if (document.fonts && document.fonts.load) Promise.all([document.fonts.load(R(600, 16)), document.fonts.load(R(700, 16)), document.fonts.load(P(20))]).catch(() => {});
      const ctx = cv.getContext('2d');
      const ajustar = () => {
        const cw = el.clientWidth, ch = el.clientHeight, cabe = Math.min(cw / LW, ch / LH);
        const s = cw < 700 ? Math.max(cabe, Math.min(0.85, (ch - 70) * 0.95 / LH)) : Math.min(cw / LW, (ch - 80) / LH);
        st.min = cabe * 0.9; st.max = 2.6;
        st.vista = { s, x: cw / 2 - (OX + 140) * s, y: 80 + (ch - 80 - LH * s) / 2 };
      };
      const limitar = () => {
        const v = st.vista, cw = el.clientWidth, ch = el.clientHeight;
        v.s = Math.max(st.min, Math.min(st.max, v.s));
        const W2 = LW * v.s, H2 = LH * v.s;
        v.x = W2 <= cw ? (cw - W2) / 2 : Math.min(0, Math.max(cw - W2, v.x));
        v.y = H2 <= ch ? (ch - H2) / 2 : Math.min(0, Math.max(ch - H2, v.y));
      };
      const zoom = (f, px, py) => { const v = st.vista, s2 = Math.max(st.min, Math.min(st.max, v.s * f)); v.x = px - (px - v.x) * s2 / v.s; v.y = py - (py - v.y) * s2 / v.s; v.s = s2; limitar(); };
      const punteros = new Map(); let ultimoToque = 0, dist0 = 0;
      const pos = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      cv.addEventListener('pointerdown', (e) => {
        cv.setPointerCapture(e.pointerId); punteros.set(e.pointerId, pos(e)); cv.style.cursor = 'grabbing';
        if (punteros.size === 2) { const [a, b] = [...punteros.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); }
        const ahora = Date.now();
        if (punteros.size === 1 && ahora - ultimoToque < 300) { const [x, y] = pos(e); zoom(st.vista.s > st.min * 1.9 ? 0.5 : 1.8, x, y); }
        ultimoToque = ahora;
      });
      cv.addEventListener('pointermove', (e) => {
        if (!punteros.has(e.pointerId)) return;
        const prev = punteros.get(e.pointerId), now = pos(e); punteros.set(e.pointerId, now);
        if (punteros.size === 1) { st.vista.x += now[0] - prev[0]; st.vista.y += now[1] - prev[1]; limitar(); }
        else if (punteros.size === 2) { const [a, b] = [...punteros.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dist0) zoom(d / dist0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dist0 = d; }
      });
      const suelta = (e) => { punteros.delete(e.pointerId); if (!punteros.size) cv.style.cursor = 'grab'; dist0 = 0; };
      cv.addEventListener('pointerup', suelta); cv.addEventListener('pointercancel', suelta);
      cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = pos(e); zoom(e.deltaY < 0 ? 1.12 : 0.89, x, y); }, { passive: false });

      const frame = (t) => {
        const dpr = Math.min(2, window.devicePixelRatio || 1), cw = el.clientWidth, ch = el.clientHeight;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); ajustar(); limitar(); }
        const dt = Math.min(60, t - (st.ult || t)); st.ult = t;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        const v = st.vista; ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.x, dpr * v.y);
        const D = st.D, modos = {};
        Object.keys(AG).forEach((k) => { modos[k] = (D.est[k] || {}).modo || 'relax'; });
        edificio(ctx, D, t);
        const L = muebles(D, t, modos);
        Object.entries(AG).forEach(([k, g]) => {
          const a = st.act[k], m = modos[k], dest = m === 'trabaja' || m === 'alerta' ? g.mesa : m === 'duerme' ? g.chill : g.sofa;
          if (a.dest !== dest) camino(a, dest);
          mover(a, dt, st.quieto);
          L.push({ d: a.x + a.y + 0.02, f: (c) => dibujaPersonaje(c, st, k, D.est[k] || { modo: 'relax' }, t) });
        });
        L.sort((a, b) => a.d - b.d).forEach((o) => o.f(ctx));
        Object.keys(AG).forEach((k) => bocadillo(ctx, st, k, D.est[k] || {}));
        Object.entries(AG).forEach(([k, g]) => cartel(ctx, g.sala, D.est[k] || { modo: 'relax' }));
        cartel(ctx, 'recepcion'); cartel(ctx, 'relax');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cartelPC(ctx, D, t, cw);
        if (!st.quieto) st.id = requestAnimationFrame(frame);
      };
      st.frame = frame;
      st.id = requestAnimationFrame(frame);
      return st;
    },
    update(el, st) { st.D = datos(); if (st.quieto) requestAnimationFrame(st.frame); },
    unmount(el, st) { if (st) cancelAnimationFrame(st.id); }
  };
})();
