// Planta Flami: una planta entera de oficinas separadas al estilo Vice City. Cada sala enseña una cosa.
// Se arrastra para moverse, se pellizca (o rueda) para acercarse y se toca un vídeo del cine para verlo.
window.tcOfi = (() => {
  const GX = 28, GY = 29, TW = 64, TH = 32, MURO = 190, BAJO = 30;
  const OX = 968, OY = 420, LW = 1864, LH = 1380;
  const iso = (gx, gy, z = 0) => ({ x: OX + (gx - gy) * TW / 2, y: OY + (gx + gy) * TH / 2 - z });
  const ESTRENO = new Date('2026-11-19T00:00:00+01:00');
  const SPR = window.TC_SPR || {};
  const ruta = (n) => SPR[n] || `spr/${n}.png`;
  const R = (p, s) => `${p} ${s}px Fredoka, "Baloo 2", "Trebuchet MS", system-ui, sans-serif`;
  const P = (s) => `${s}px VT323, "Courier New", monospace`;

  // Salas: las del fondo apoyan en la pared del fondo (gy=0) y las de la izquierda en la pared izquierda (gx=0)
  const SALAS = {
    analisis: { n: 'Análisis', sub: 'Don Caimán estudia las cifras', x: 0, y: 0, w: 7, d: 7, suelo: '#fde3cf', linea: '#f1c3a0', muro: 'fondo' },
    guiones: { n: 'Sala de guiones', sub: 'Rocco escribe los vídeos de mañana', x: 7, y: 0, w: 7, d: 7, suelo: '#d5e6fb', linea: '#a9c8ef', muro: 'fondo' },
    cine: { n: 'Sala de cine', sub: 'Toca un vídeo para verlo', x: 14, y: 0, w: 7, d: 7, suelo: '#3a2f5c', linea: '#4a3d72', muro: 'fondo' },
    pc: { n: 'Sala del PC', sub: 'Aquí ves si hay que encenderlo', x: 21, y: 0, w: 7, d: 7, suelo: '#dfe3ec', linea: '#c3c9d8', muro: 'fondo' },
    plato: { n: 'Plató', sub: 'Flami graba los vídeos', x: 0, y: 8, w: 7, d: 7, suelo: '#e7dafc', linea: '#c8b3f0', muro: 'izq' },
    publicacion: { n: 'Publicación', sub: 'Manolo sube los vídeos a las redes', x: 0, y: 15, w: 7, d: 7, suelo: '#d6f3e1', linea: '#a4dbba', muro: 'izq' },
    seguidores: { n: 'Seguidores', sub: 'Así crece la comunidad', x: 0, y: 22, w: 7, d: 7, suelo: '#fff1cc', linea: '#f0d68e', muro: 'izq' }
  };
  const puerta = (s) => (s.muro === 'fondo' ? { dentro: [s.x + 3.5, 6.2], fuera: [s.x + 3.5, 7.5] } : { dentro: [6.2, s.y + 3.5], fuera: [7.5, s.y + 3.5] });
  const AG = {
    analista: { sala: 'analisis', p: 'caiman', mesa: [3.9, 2.6], sofa: [1.6, 5.3], chill: [13.0, 12.2] },
    guionista: { sala: 'guiones', p: 'rocco', mesa: [10.9, 2.6], sofa: [8.6, 5.3], chill: [16.6, 11.6] },
    fabrica: { sala: 'plato', p: 'flami', mesa: [2.3, 11.4], sofa: [5.3, 9.4], chill: [14.2, 15.4] },
    publicador: { sala: 'publicacion', p: 'manolo', mesa: [2.9, 17.6], sofa: [5.3, 20.6], chill: [18.4, 14.8] }
  };
  const NOMBRES = { analista: 'Don Caimán · analista', guionista: 'Rocco · guionista', fabrica: 'Flami · fábrica', publicador: 'Manolo · publicador' };
  const MODO = { trabaja: '#2fbf71', relax: '#e8a93a', duerme: '#9a92c8', alerta: '#ff5d70' };

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
  const txF = (c, s, x, y, fuente, tam, max, col, al = 'left') => { let t = tam; c.font = fuente(t); while (t > 8 && c.measureText(s).width > max) { t -= 1; c.font = fuente(t); } tx(c, s, x, y, fuente(t), col, al); };
  const corta = (c, s, max) => { s = String(s || ''); if (c.measureText(s).width <= max) return s; while (s.length > 1 && c.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };
  const enX = (c, gx, gy, z, fn) => { const p = iso(gx, gy, z); c.save(); c.transform(1, 0.5, 0, 1, p.x, p.y); fn(); c.restore(); };
  const enY = (c, gx, gy, z, fn) => { const p = iso(gx, gy, z); c.save(); c.transform(1, -0.5, 0, 1, p.x, p.y); fn(); c.restore(); };
  const ANCHO = (n) => n * TW / 2;
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
    const sinVer = ultPc && ahora > llegada && new Date(ultPc) < llegada;
    const dia = madrid(ahora).getDay(), finde = dia === 0 || dia === 6;
    if (finde && pce !== 'Trabajando') return ['FIN DE SEMANA', 'No hace falta: el viernes quedó todo listo', '#ffd36b'];
    if (pce === 'Trabajando') return guiones > 0 ? ['DÉJALO ENCENDIDO', `Está montando ${guiones} vídeo${guiones > 1 ? 's' : ''}`, '#7df9c8'] : ['PUEDES APAGARLO', 'Todo montado. Mañana a las 8:30 hay más', '#8fb4ff'];
    if (guiones > 0 || sinVer) return ['¡ENCIÉNDELO!', guiones > 0 ? `${guiones} guion${guiones > 1 ? 'es' : ''} esperando` : 'Han llegado los guiones de hoy', '#ff7a8a'];
    if (pce === 'Apagado') return listos > 0 ? ['NO HACE FALTA', `${listos} vídeos listos se suben solos`, '#ffd36b'] : ['A LAS 8:30', 'Enciéndelo al llegar a clase', '#ffd36b'];
    return ['SIN DATOS', 'Enciéndelo para saber cómo va', '#c9c2e6'];
  }

  // ---------- datos ----------
  function datos() {
    const v = (id) => { const r = dash.data(id); return r.status === 'ok' ? r.data : []; };
    const T = v('totales')[0] || {}, C = v('cola')[0] || {}, pce = (v('pc_estado')[0] || {}).estado, pc = v('pc')[0] || {};
    const ag = v('agentes'), fila = (id) => ag.find((a) => a.id === id);
    const horas = (s) => (s ? (Date.now() - new Date(s)) / 36e5 : Infinity);
    const g = fila('guionista'), pu = fila('publicador'), an = fila('analista');
    const e = {};
    e.guionista = !g ? { modo: 'relax', txt: 'Pensando ideas' } : g.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Hoy no he escrito!' } : horas(g.ultima) < 1.5 ? { modo: 'trabaja', txt: 'Escribiendo guiones' } : { modo: 'relax', txt: 'Guiones de hoy hechos' };
    e.fabrica = pce === 'Apagado' ? { modo: 'duerme', txt: 'PC apagado, me echo la siesta' } : pce !== 'Trabajando' ? { modo: 'relax', txt: 'Esperando al PC' } : (C.guiones || 0) > 0 ? { modo: 'trabaja', txt: `¡Grabando ${C.guiones} vídeo${C.guiones > 1 ? 's' : ''}!` } : { modo: 'relax', txt: 'Todo grabado' };
    e.publicador = !pu ? { modo: 'relax', txt: 'Vigilando el copyright' } : pu.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Vídeos atascados!' } : horas(pu.ultima) < 0.4 ? { modo: 'trabaja', txt: 'Subiendo vídeos' } : (C.listos || 0) > 0 ? { modo: 'relax', txt: `${C.listos} listos para subir` } : { modo: 'relax', txt: 'Todo subido' };
    const dia = new Date().getDay();
    e.analista = !an ? { modo: 'relax', txt: 'Mirando cifras' } : horas(an.ultima) < 0.5 ? { modo: 'trabaja', txt: 'Estudiando los datos' } : { modo: 'duerme', txt: dia === 3 || dia === 0 ? 'Esta noche estudio' : dia < 3 ? 'Vuelvo el miércoles' : 'Vuelvo el domingo' };
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
      ultimos: vids.slice().sort((a, b) => String(b.publicado).localeCompare(String(a.publicado))).slice(0, 5),
      prox: { guionista: siguiente([[null, 6, 42]]), publicador: siguiente([[null, 12, 47], [null, 22, 47]]), analista: siguiente([[[0, 3], 20, 37]]) }
    };
  }

  // ---------- piezas gráficas ----------
  function pantalla(c, w, h, t, glow = '#7df9c8') {
    rr(c, -7, -7, w + 14, h + 14, 10, '#1c1828'); rr(c, -3, -3, w + 6, h + 6, 7, '#2e2944');
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#10302e'); g.addColorStop(1, '#0a1b20'); rr(c, 0, 0, w, h, 5, g);
    c.save(); c.beginPath(); c.roundRect(0, 0, w, h, 5); c.clip();
    c.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
    const k = ((t / 4200) % 1) * (h + 60) - 30, gl = c.createLinearGradient(0, k - 30, 0, k + 30);
    gl.addColorStop(0, 'rgba(125,249,200,0)'); gl.addColorStop(0.5, 'rgba(125,249,200,.07)'); gl.addColorStop(1, 'rgba(125,249,200,0)');
    c.fillStyle = gl; c.fillRect(0, k - 30, w, 60); c.restore();
    c.shadowColor = glow; c.shadowBlur = 5;
  }
  const fin = (c) => { c.shadowBlur = 0; };
  function letrero(c, s, w) {
    rr(c, 0, 0, w, 40, 10, 'rgba(36,28,58,.92)');
    txF(c, s.n, 12, 18, (z) => R(700, z), 17, w - 24, '#ffffff');
    txF(c, s.sub, 12, 33, (z) => R(500, z), 12, w - 24, '#cfc6ee');
  }
  // cabecera derecha encima de cada sala: nombre grande y para qué sirve
  function cabecera(c, s) {
    const p = s.muro === 'fondo' ? iso(s.x + 3.5, 0, MURO + 34) : iso(0, s.y + 3.5, MURO + 34);
    c.font = R(700, 19); const w1 = c.measureText(s.n).width; c.font = R(500, 13); const w2 = c.measureText(s.sub).width;
    const w = Math.max(w1, w2) + 36, h = 52, x = p.x - w / 2, y = p.y - h;
    c.shadowColor = 'rgba(20,10,40,.35)'; c.shadowBlur = 12; c.shadowOffsetY = 4; rr(c, x, y, w, h, 14, '#ff6fae'); c.shadowBlur = 0; c.shadowOffsetY = 0;
    rr(c, x + 3, y + 3, w - 6, h - 6, 11, '#2a2140');
    tx(c, s.n, p.x, y + 25, R(700, 19), '#ffffff', 'center'); tx(c, s.sub, p.x, y + 42, R(500, 13), '#ffc7e0', 'center');
    c.beginPath(); c.moveTo(p.x - 8, y + h); c.lineTo(p.x, y + h + 9); c.lineTo(p.x + 8, y + h); c.fillStyle = '#ff6fae'; c.fill();
  }
  function linea(c, x1, x2, y, col = 'rgba(125,249,200,.25)') { c.fillStyle = col; c.fillRect(x1, y, x2 - x1, 1); }

  // ---------- contenido de las paredes ----------
  function paredAnalisis(c, D, t) {
    const w = 196, h = 128; pantalla(c, w, h, t);
    tx(c, 'VISTAS TOTALES', 10, 18, P(18), '#7df9c8');
    tx(c, D.dia24 != null ? `+${fmt(D.dia24)} hoy` : '', w - 10, 18, P(18), '#ffd36b', 'right');
    txF(c, fmt(D.vistas), 10, 50, P, 38, 120, '#ffffff');
    tx(c, `♥ ${fmt(D.likes)}`, w - 10, 48, P(20), '#ff9ac4', 'right');
    const hs = D.hist, x0 = 10, y0 = 60, cw = w - 20, ch = 40;
    linea(c, x0, x0 + cw, y0 + ch);
    if (hs.length > 1) {
      const mn = Math.min(...hs), mx = Math.max(...hs);
      const pts = hs.map((v, i) => [x0 + cw * i / (hs.length - 1), y0 + ch - ch * (v - mn) / ((mx - mn) || 1)]);
      c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.lineTo(x0 + cw, y0 + ch); c.lineTo(x0, y0 + ch); c.fillStyle = 'rgba(125,249,200,.14)'; c.fill();
      c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.strokeStyle = '#7df9c8'; c.lineWidth = 2; c.stroke();
      const [ux, uy] = pts[pts.length - 1]; if (Math.floor(t / 400) % 2) { c.beginPath(); c.arc(ux, uy, 3, 0, 7); c.fillStyle = '#fff'; c.fill(); }
    } else tx(c, 'recogiendo datos...', x0, y0 + 26, P(17), '#5fbf9a');
    tx(c, 'últimas 48 h', x0, h - 8, P(15), '#5fbf9a');
    tx(c, 'estudio ' + hora(D.prox.analista), w - 10, h - 8, P(15), '#5fbf9a', 'right');
    fin(c);
  }
  function paredTop(c, D, t) {
    const w = 196, h = 128; pantalla(c, w, h, t, '#ffd36b');
    tx(c, 'LOS QUE MÁS TIRAN', 10, 18, P(18), '#ffd36b');
    const max = (D.top[0] || {}).vistas || 1;
    D.top.forEach((v, i) => {
      const y = 36 + i * 30;
      c.font = P(15); tx(c, corta(c, `${i + 1}. ${v.titulo}`, w - 20), 10, y, P(15), '#d8fff0');
      rr(c, 10, y + 5, w - 70, 8, 3, 'rgba(255,255,255,.08)');
      rr(c, 10, y + 5, Math.max(6, (w - 70) * v.vistas / max), 8, 3, ['#ff6fae', '#4ff0e0', '#ffd36b'][i]);
      tx(c, corto(v.vistas), w - 10, y + 14, P(17), '#ffffff', 'right');
    });
    if (!D.top.length) tx(c, 'sin vídeos todavía', 10, 50, P(17), '#5fbf9a');
    fin(c);
  }
  function paredGuiones(c, D) {
    const w = 196, h = 128;
    rr(c, -6, -6, w + 12, h + 12, 7, '#b9aa8e'); rr(c, 0, 0, w, h, 4, '#fdfcf5');
    c.strokeStyle = '#ece4cf'; c.lineWidth = 1; for (let y = 44; y < h - 18; y += 20) { c.beginPath(); c.moveTo(10, y + 5); c.lineTo(w - 10, y + 5); c.stroke(); }
    tx(c, 'Próximos guiones', 12, 24, R(600, 16), '#3a2f55');
    rr(c, w - 44, 8, 34, 24, 12, '#e0507f'); tx(c, String(D.guiones), w - 27, 26, R(700, 16), '#fff', 'center');
    const L = D.proximos.length ? D.proximos.slice(0, 3) : ['Cola vacía: todo montado ✓'];
    c.font = R(500, 13); L.forEach((n, i) => tx(c, corta(c, '• ' + n, w - 24), 12, 48 + i * 20, R(500, 13), i % 2 ? '#3d7be0' : '#d04478'));
    tx(c, 'Siguiente tanda: ' + hora(D.prox.guionista), 12, h - 10, R(500, 11.5), '#8a7f99');
    rr(c, 30, h + 4, 34, 5, 2, '#e0507f'); rr(c, 70, h + 4, 34, 5, 2, '#3d7be0'); rr(c, 110, h + 4, 34, 5, 2, '#2fbf71');
  }
  function paredCine(c, D, t, st) {
    const w = 208, h = 132;
    rr(c, -8, -8, w + 16, h + 16, 6, '#1a1428'); rr(c, 0, 0, w, h, 3, '#f7f3ff');
    rr(c, 0, 0, w, 22, [3, 3, 0, 0], '#2a2140');
    tx(c, 'ÚLTIMOS VÍDEOS', 10, 16, R(700, 13), '#ffd36b'); tx(c, 'toca para verlo ▶', w - 10, 16, R(500, 11), '#cfc6ee', 'right');
    D.ultimos.forEach((v, i) => {
      const y = 28 + i * 21;
      rr(c, 6, y, w - 12, 18, 5, i % 2 ? '#ece6fb' : '#f7f3ff');
      rr(c, 10, y + 4, 22, 11, 3, v.canal === 'pt' ? '#2fbf71' : '#e8333f'); tx(c, v.canal === 'pt' ? 'BR' : 'ES', 21, y + 13, R(700, 8), '#fff', 'center');
      c.font = R(500, 11); tx(c, corta(c, v.titulo, w - 92), 38, y + 13, R(500, 11), '#2b2540');
      tx(c, corto(v.vistas) + ' vistas', w - 12, y + 13, R(600, 10.5), '#6a5aa0', 'right');
      const m = c.getTransform(), esq = [[6, y], [w - 6, y], [w - 6, y + 18], [6, y + 18]].map(([a, b]) => m.transformPoint(new DOMPoint(a, b)));
      st.enlaces.push({ poli: esq.map((p) => [p.x, p.y]), url: 'https://www.youtube.com/shorts/' + v.id });
    });
    if (!D.ultimos.length) tx(c, 'Todavía no hay vídeos', 12, 50, R(500, 12), '#6a5aa0');
  }
  function paredPC(c, D, t) {
    const [titulo, txt, col] = D.consejo, w = 196, h = 128; pantalla(c, w, h, t, col);
    tx(c, '¿ENCIENDO EL PC?', 10, 18, P(18), '#7df9c8');
    const on = D.pce === 'Trabajando', off = D.pce === 'Apagado';
    c.beginPath(); c.arc(w - 16, 13, 5, 0, 7); c.fillStyle = on ? '#7df9c8' : off ? '#ff7a8a' : '#8a83b0'; c.fill();
    tx(c, on ? 'ON' : off ? 'OFF' : '?', w - 26, 18, P(16), '#d8fff0', 'right');
    const urge = col === '#ff7a8a';
    if (!urge || Math.floor(t / 550) % 2) txF(c, titulo, 10, 52, P, 34, w - 20, col);
    c.font = P(17); tx(c, corta(c, txt, w - 20), 10, 74, P(17), '#ffffff');
    linea(c, 10, w - 10, 86);
    tx(c, `grabando ${D.guiones}`, 10, 104, P(17), '#d8fff0'); tx(c, `listos ${D.listos}`, w - 10, 104, P(17), '#d8fff0', 'right');
    tx(c, D.version ? 'fábrica ' + D.version : 'fábrica automática', 10, h - 7, P(14), '#5fbf9a');
    fin(c);
  }
  function paredPlato(c, D, t, modo) {
    const w = 196, h = 128;
    rr(c, 0, 0, w, h, 4, modo === 'duerme' ? '#1f6b46' : '#2fbf71'); c.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 10; x < w; x += 16) c.fillRect(x, 0, 2, h);
    const on = modo === 'trabaja';
    rr(c, 54, 8, 88, 26, 6, '#1c1828'); c.shadowColor = '#ff3b3b'; c.shadowBlur = on ? 12 : 0;
    tx(c, 'ON AIR', 98, 26, R(700, 15), on && Math.floor(t / 700) % 2 ? '#ff4d5e' : on ? '#ff8a96' : '#6a4a56', 'center'); c.shadowBlur = 0;
    tx(c, on ? `Grabando ${D.guiones} vídeo${D.guiones === 1 ? '' : 's'}` : modo === 'duerme' ? 'Plató apagado' : 'Esperando guiones', w / 2, h - 12, R(600, 13), 'rgba(255,255,255,.85)', 'center');
  }
  function paredPublicacion(c, D, t) {
    const w = 196, h = 128; pantalla(c, w, h, t, '#ffd36b');
    tx(c, 'POR SUBIR', 10, 18, P(18), '#ffd36b'); tx(c, 'SUBIDOS', 108, 18, P(18), '#7df9c8');
    txF(c, fmt(D.listos), 10, 58, P, 46, 88, '#ffffff'); txF(c, fmt(D.publicados), 108, 58, P, 46, 80, '#ffffff');
    linea(c, 10, w - 10, 70);
    [['YT', '#ff5a5a'], ['TT', '#4ff0e0'], ['IG', '#ff8cc0'], ['BR', '#4fe08f']].forEach(([s, col], i) => { rr(c, 10 + i * 46, 78, 40, 18, 4, 'rgba(255,255,255,.07)'); tx(c, s, 30 + i * 46, 92, P(17), col, 'center'); });
    tx(c, 'próxima subida ' + hora(D.prox.publicador), 10, h - 8, P(15), '#5fbf9a');
    fin(c);
  }
  function paredSeguidores(c, D, t) {
    const w = 196, h = 150; pantalla(c, w, h, t, '#ffd36b');
    const r = D.redes, tot = ['yt', 'br', 'tt', 'ig'].reduce((a, k) => a + (Number(r[k].seguidores) || 0), 0);
    tx(c, 'SEGUIDORES', 10, 18, P(18), '#ffd36b'); tx(c, 'total ' + fmt(tot), w - 10, 18, P(18), '#ffffff', 'right');
    const f = [['YT', 'España', '#ff5a5a', r.yt.seguidores], ['BR', 'Brasil', '#4fe08f', r.br.seguidores], ['TT', 'TikTok', '#4ff0e0', r.tt.seguidores], ['IG', 'Instagram', '#ff8cc0', r.ig.seguidores]];
    f.forEach(([et, n, col, v], i) => {
      const x = 8 + (i % 2) * 92, y = 26 + Math.floor(i / 2) * 46;
      rr(c, x, y, 88, 42, 5, 'rgba(255,255,255,.07)');
      tx(c, et, x + 7, y + 15, P(16), col); tx(c, n, x + 81, y + 15, P(14), '#9fd9c2', 'right');
      txF(c, v != null ? corto(v) : '?', x + 7, y + 37, P, 26, 74, v != null ? '#ffffff' : '#ff7a8a');
    });
    const subs = Number(r.yt.seguidores) || 0;
    tx(c, 'camino a miembros', 10, 132, P(14), '#9fd9c2'); tx(c, `${subs}/500`, w - 10, 132, P(14), '#ffffff', 'right');
    rr(c, 10, 137, w - 20, 7, 3, 'rgba(255,255,255,.1)'); rr(c, 10, 137, Math.max(5, (w - 20) * Math.min(1, subs / 500)), 7, 3, '#7df9c8');
    fin(c);
  }
  function neon(c, t) {
    const w = 360, h = 92, on = Math.sin(t / 420) > -0.85;
    c.strokeStyle = '#2a2140'; c.lineWidth = 5; [70, w - 70].forEach((x) => { c.beginPath(); c.moveTo(x, h); c.lineTo(x, h + 136); c.stroke(); });
    rr(c, 0, 0, w, h, 16, '#221a38');
    c.lineWidth = 3; c.strokeStyle = on ? '#ff6fae' : '#6a2a52'; c.shadowColor = '#ff4fa3'; c.shadowBlur = on ? 16 : 0;
    c.beginPath(); c.roundRect(7, 7, w - 14, h - 14, 11); c.stroke();
    txF(c, 'Fuera del Mapa', w / 2, 50, (z) => R(700, z), 40, w - 40, on ? '#ff9ac8' : '#8a3d6a', 'center');
    c.shadowColor = '#4ff0e0';
    const ms = ESTRENO - Date.now();
    txF(c, ms > 0 ? `GTA 6 en ${Math.floor(ms / 864e5)} d ${Math.floor(ms / 36e5) % 24} h ${Math.floor(ms / 6e4) % 60} min` : '¡GTA 6 ya está aquí!', w / 2, 76, (z) => R(600, z), 17, w - 40, on ? '#8ff8ee' : '#2e6a66', 'center');
    c.shadowBlur = 0;
  }

  // ---------- suelo, paredes y tabiques ----------
  function suelo(c) {
    poli(c, [iso(0, GY), iso(GX, GY), iso(GX, GY, -18), iso(0, GY, -18)], '#5b4378');
    poli(c, [iso(GX, 0), iso(GX, GY), iso(GX, GY, -18), iso(GX, 0, -18)], '#4a3664');
    for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) poli(c, [iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1)], (i + j) % 2 ? '#efe4f6' : '#f7eefb');
    poli(c, [iso(0, 7), iso(GX, 7), iso(GX, 8), iso(0, 8)], '#b49ad6');
    poli(c, [iso(7, 8), iso(8, 8), iso(8, GY), iso(7, GY)], '#b49ad6');
    poli(c, [iso(13.6, 8), iso(14.4, 8), iso(14.4, GY), iso(13.6, GY)], '#ff9ac4');
    poli(c, [iso(8, 18.1), iso(GX, 18.1), iso(GX, 18.9), iso(8, 18.9)], '#ff9ac4');
    Object.values(SALAS).forEach((s) => {
      poli(c, [iso(s.x, s.y, 0.5), iso(s.x + s.w, s.y, 0.5), iso(s.x + s.w, s.y + s.d, 0.5), iso(s.x, s.y + s.d, 0.5)], s.suelo);
      c.strokeStyle = s.linea; c.lineWidth = 1;
      for (let i = 1; i < s.w; i++) { const a = iso(s.x + i, s.y, 0.5), b = iso(s.x + i, s.y + s.d, 0.5); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      for (let i = 1; i < s.d; i++) { const a = iso(s.x, s.y + i, 0.5), b = iso(s.x + s.w, s.y + i, 0.5); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    });
  }
  function paredes(c, D, t, modos, st) {
    poli(c, [iso(0, 0), iso(GX, 0), iso(GX, 0, MURO), iso(0, 0, MURO)], '#efe6f8');
    poli(c, [iso(0, 0), iso(0, GY), iso(0, GY, MURO), iso(0, 0, MURO)], '#dccff0');
    poli(c, [iso(0, 0), iso(GX, 0), iso(GX, 0, 14), iso(0, 0, 14)], '#7a5d9a');
    poli(c, [iso(0, 0), iso(0, GY), iso(0, GY, 14), iso(0, 0, 14)], '#6a4f88');
    poli(c, [iso(0, 0, MURO), iso(GX, 0, MURO), iso(GX, 0, MURO + 12), iso(0, 0, MURO + 12)], '#4b3a6b');
    poli(c, [iso(0, 0, MURO), iso(0, GY, MURO), iso(0, GY, MURO + 12), iso(0, 0, MURO + 12)], '#3f3060');
    Object.values(SALAS).forEach((s) => {
      if (s.muro === 'fondo') poli(c, [iso(s.x + 0.1, 0, 14), iso(s.x + s.w - 0.1, 0, 14), iso(s.x + s.w - 0.1, 0, 22), iso(s.x + 0.1, 0, 22)], tono(s.suelo, 0.75));
      else poli(c, [iso(0, s.y + 0.1, 14), iso(0, s.y + s.d - 0.1, 14), iso(0, s.y + s.d - 0.1, 22), iso(0, s.y + 0.1, 22)], tono(s.suelo, 0.75));
    });
    [7, 14, 21].forEach((gx) => poli(c, [iso(gx - 0.06, 0), iso(gx + 0.06, 0), iso(gx + 0.06, 0, MURO), iso(gx - 0.06, 0, MURO)], '#7a5d9a'));
    [8, 15, 22].forEach((gy) => poli(c, [iso(0, gy - 0.06), iso(0, gy + 0.06), iso(0, gy + 0.06, MURO), iso(0, gy - 0.06, MURO)], '#6a4f88'));
    enX(c, 8.4, 0, MURO + 240, () => neon(c, t));
    const ancho = ANCHO(6.2), mx = (7 - 196 / 32) / 2;
    const fondo = (s, fn) => enX(c, s.x + mx, 0, MURO - 30, fn);
    const izq = (s, fn) => enY(c, 0, s.y + s.d - mx, MURO - 30, fn);
    fondo(SALAS.analisis, () => paredAnalisis(c, D, t));
    fondo(SALAS.guiones, () => paredGuiones(c, D));
    fondo(SALAS.cine, () => paredCine(c, D, t, st));
    fondo(SALAS.pc, () => paredPC(c, D, t));
    izq(SALAS.plato, () => paredPlato(c, D, t, modos.fabrica));
    izq(SALAS.publicacion, () => paredPublicacion(c, D, t));
    izq(SALAS.seguidores, () => paredSeguidores(c, D, t));
    enY(c, 0, 6.6, MURO - 30, () => paredTop(c, D, t));
  }
  function tabiques(add) {
    const col = '#e8def6', tapa = '#8a6db0';
    const trozoX = (gx, gy) => add(gx + 0.5, gy, (c) => { caja(c, gx, gy - 0.07, 1, 0.14, BAJO, col); poli(c, [iso(gx, gy - 0.07, BAJO), iso(gx + 1, gy - 0.07, BAJO), iso(gx + 1, gy + 0.07, BAJO), iso(gx, gy + 0.07, BAJO)], tapa); });
    const trozoY = (gx, gy) => add(gx, gy + 0.5, (c) => { caja(c, gx - 0.07, gy, 0.14, 1, BAJO, col); poli(c, [iso(gx - 0.07, gy, BAJO), iso(gx + 0.07, gy, BAJO), iso(gx + 0.07, gy + 1, BAJO), iso(gx - 0.07, gy + 1, BAJO)], tapa); });
    for (let x = 0; x < GX; x++) { if (x % 7 === 3) continue; trozoX(x, 7); }
    [7, 14, 21].forEach((gx) => { for (let y = 0; y < 7; y++) trozoY(gx, y); });
    for (let x = 0; x < 7; x++) { trozoX(x, 8); trozoX(x, 15); trozoX(x, 22); }
    for (let y = 8; y < GY; y++) { if ((y - 8) % 7 === 3) continue; trozoY(7, y); }
  }

  // ---------- muebles ----------
  function muebles(D, t, modos) {
    const L = [], add = (gx, gy, f) => L.push({ d: gx + gy, f });
    tabiques(add);
    const mesa = (gx, gy, on, monitor = true) => add(gx + 0.9, gy + 0.45, (c) => {
      caja(c, gx, gy, 1.8, 0.9, 30, '#ffffff');
      if (monitor) { caja(c, gx + 0.6, gy + 0.15, 0.7, 0.12, 24, '#2d2a3a', 30); enX(c, gx + 0.64, gy + 0.27, 52, () => rr(c, 0, 0, 19, 18, 2, on ? '#7df9c8' : '#3b3850')); }
    });
    const sillon = (gx, gy, col) => add(gx - 0.1, gy - 0.1, (c) => { caja(c, gx - 0.45, gy - 0.45, 0.9, 0.8, 16, col); caja(c, gx - 0.45, gy - 0.55, 0.9, 0.22, 40, tono(col, 0.88)); caja(c, gx - 0.6, gy - 0.45, 0.18, 0.8, 26, tono(col, 0.8)); caja(c, gx + 0.42, gy - 0.45, 0.18, 0.8, 26, tono(col, 0.8)); });
    const planta = (gx, gy, s = 1) => add(gx, gy, (c) => { caja(c, gx - 0.25, gy - 0.25, 0.5, 0.5, 18, '#c0703c'); const p = iso(gx, gy, 18); c.fillStyle = '#3f9e5b'; [[-8, -14, 13], [8, -18, 12], [0, -30, 12], [-4, -42, 9]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(p.x + dx * s, p.y + dy * s, r * s, 0, 7); c.fill(); }); c.fillStyle = '#56b873'; c.beginPath(); c.arc(p.x + 4 * s, p.y - 36 * s, 7 * s, 0, 7); c.fill(); });
    const palmera = (gx, gy) => add(gx, gy, (c) => {
      caja(c, gx - 0.4, gy - 0.4, 0.8, 0.8, 22, '#d48a52'); const p = iso(gx, gy, 22);
      c.strokeStyle = '#8a5a35'; c.lineWidth = 6; c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x + 10, p.y - 60, p.x + 4, p.y - 118); c.stroke();
      for (let k = 0; k < 7; k++) { c.save(); c.translate(p.x + 4, p.y - 118); c.rotate(-2.9 + k * 0.82 + Math.sin(t / 1100 + k) * 0.04); c.beginPath(); c.ellipse(32, 0, 34, 8, 0, 0, 7); c.fillStyle = k % 2 ? '#2f9e5b' : '#3fb86b'; c.fill(); c.restore(); }
    });
    Object.values(AG).forEach((g, i) => sillon(g.sofa[0], g.sofa[1] - 0.05, ['#8e5bd8', '#14a8a0', '#ff8fb8', '#3d7be0'][i]));

    // análisis
    mesa(3.0, 3.0, modos.analista === 'trabaja');
    add(5.9, 1.2, (c) => { caja(c, 5.3, 0.4, 1.3, 0.5, 96, '#a8794f'); ['#e0507f', '#3d7be0', '#ffd36b', '#2fbf71', '#8e5bd8', '#ff9f43'].forEach((col, i) => caja(c, 5.4 + (i % 3) * 0.38, 0.45, 0.3, 0.38, 16, col, 30 + Math.floor(i / 3) * 34)); });
    planta(0.7, 0.8, 0.9);
    // guiones
    mesa(10.0, 3.0, modos.guionista === 'trabaja');
    add(12.2, 3.3, (c) => { const n = Math.min(10, D.guiones + 3); for (let i = 0; i < n; i++) caja(c, 11.9, 3.15, 0.45, 0.55, 2.4, i % 2 ? '#fffdf0' : '#f1ecd9', 30 + i * 2.6); });
    if (modos.guionista === 'trabaja') add(12.6, 3.6, (c) => { for (let i = 0; i < 3; i++) { const k = ((t / 1600) + i / 3) % 1, p = iso(12.1 + k * 1.4, 3.3, 60 + k * 60); c.globalAlpha = 1 - k; rr(c, p.x, p.y, 12, 15, 1, '#fffdf0'); c.globalAlpha = 1; } });
    planta(13.3, 0.8, 0.9); planta(7.7, 0.8, 0.8);
    // cine: butacas rojas y palomitas
    for (let fila = 0; fila < 3; fila++) for (let i = 0; i < 4; i++) { const gx = 15.2 + i * 1.3, gy = 3.0 + fila * 1.3; add(gx + 0.3, gy + 0.3, (c) => { caja(c, gx, gy, 0.8, 0.7, 16, '#c8324a'); caja(c, gx, gy + 0.55, 0.8, 0.2, 38, '#a82a40'); }); }
    add(20.6, 6.6, (c) => { caja(c, 20.2, 6.2, 0.6, 0.5, 30, '#ffd36b'); const p = iso(20.5, 6.4, 30); c.fillStyle = '#fff6d6'; [[-5, -4], [2, -7], [6, -2], [-1, -1]].forEach(([dx, dy]) => { c.beginPath(); c.arc(p.x + dx, p.y + dy, 4, 0, 7); c.fill(); }); });
    // sala del PC: armarios con lucecitas y el PC de la fábrica
    [4.0, 5.3].forEach((gy, j) => add(27.3, gy + 0.4, (c) => {
      const gx = 26.9; caja(c, gx, gy, 0.9, 0.9, 72, '#2a2738');
      for (let i = 0; i < 6; i++) { const p = iso(gx + 0.9, gy + 0.4, 12 + i * 10); const on = D.pce === 'Trabajando' && Math.floor(t / 170 + i * 1.7 + j) % 3; c.fillStyle = on ? '#7df9c8' : '#4a4660'; c.fillRect(p.x + 2, p.y - 2, 6, 2); c.fillStyle = on && i % 2 ? '#ff6fae' : '#4a4660'; c.fillRect(p.x + 11, p.y + 3, 6, 2); }
    }));
    add(23.3, 4.8, (c) => {
      caja(c, 22.2, 4.2, 2.0, 1.0, 30, '#ffffff'); caja(c, 23.4, 4.35, 0.55, 0.7, 44, '#1d1b28', 30);
      const p = iso(23.95, 4.7, 60), on = D.pce === 'Trabajando';
      c.beginPath(); c.arc(p.x, p.y, 6, 0, 7); c.fillStyle = on ? '#7df9c8' : '#ff5d70'; c.shadowColor = c.fillStyle; c.shadowBlur = 10; c.fill(); c.shadowBlur = 0;
      caja(c, 22.4, 4.4, 0.7, 0.12, 22, '#2d2a3a', 30); enX(c, 22.44, 4.52, 52, () => rr(c, 0, 0, 19, 18, 2, on ? '#7df9c8' : '#3b3850'));
    });
    planta(27.3, 6.3, 0.9);
    // plató: escenario, focos y cámara
    add(2.3, 11.2, (c) => caja(c, 0.6, 9.2, 2.6, 4.4, 6, '#5a3d7a'));
    [[1.2, 8.7], [4.6, 14.2]].forEach(([gx, gy], i) => add(gx, gy, (c) => {
      const p = iso(gx, gy, 0); c.strokeStyle = '#2a2140'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 100); c.stroke();
      [-12, 12].forEach((dx) => { c.beginPath(); c.moveTo(p.x, p.y - 20); c.lineTo(p.x + dx, p.y + 4); c.stroke(); });
      rr(c, p.x - 11, p.y - 114, 22, 16, 4, '#2a2140');
      if (modos.fabrica !== 'duerme') { const o = iso(2.3, 11.4, 0); c.globalAlpha = 0.14 + 0.04 * Math.sin(t / 600 + i); c.beginPath(); c.moveTo(p.x - 6, p.y - 104); c.lineTo(o.x - 48, o.y); c.lineTo(o.x + 48, o.y); c.lineTo(p.x + 6, p.y - 104); c.closePath(); c.fillStyle = '#fff3b0'; c.fill(); c.globalAlpha = 1; }
    }));
    add(5.2, 11.8, (c) => {
      const p = iso(5.2, 11.8, 0); c.strokeStyle = '#2a2140'; c.lineWidth = 3;
      [[-13, 0], [13, 0], [0, 8]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(p.x, p.y - 52); c.lineTo(p.x + dx, p.y + dy); c.stroke(); });
      rr(c, p.x - 20, p.y - 74, 40, 24, 5, '#1d1b28'); c.beginPath(); c.arc(p.x - 8, p.y - 82, 11, 0, 7); c.arc(p.x + 8, p.y - 82, 9, 0, 7); c.fillStyle = '#1d1b28'; c.fill();
      rr(c, p.x - 32, p.y - 68, 12, 12, 3, '#3a3a48');
      if (modos.fabrica === 'trabaja' && Math.floor(t / 600) % 2) { c.beginPath(); c.arc(p.x + 14, p.y - 66, 4, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); }
    });
    // publicación
    mesa(2.0, 18.1, false, false);
    add(2.9, 18.4, (c) => [['#e8333f', 2.15], ['#16151c', 2.65], ['#c13584', 3.15]].forEach(([col, gx], i) => {
      caja(c, gx, 18.25, 0.32, 0.12, 26, col, 30);
      if (Math.floor(t / 900 + i) % 4 === 0) { const p = iso(gx + 0.3, 18.25, 58); c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fillStyle = '#ff4d5e'; c.fill(); }
    }));
    for (let i = 0; i < Math.min(9, D.listos); i++) { const gx = 0.6 + (i % 3) * 0.62, gy = 20.6, z = Math.floor(i / 3) * 20; add(gx + 0.3, gy + 0.3 + i * 0.01, (c) => { caja(c, gx, gy, 0.55, 0.55, 20, '#d0a066', z); const p = iso(gx + 0.27, gy + 0.55, z + 10); c.fillStyle = '#8a5a35'; c.fillRect(p.x - 7, p.y - 1, 14, 3); }); }
    // seguidores: sofá y vitrina con el botón de YouTube que queremos ganar
    add(4.0, 26.6, (c) => { caja(c, 2.5, 26.2, 3.0, 0.9, 16, '#ffb347'); caja(c, 2.5, 26.1, 3.0, 0.3, 40, '#f29a2e'); });
    add(5.8, 23.4, (c) => { caja(c, 5.3, 22.9, 1.0, 0.8, 40, '#2a2140'); const p = iso(5.8, 23.3, 40); rr(c, p.x - 14, p.y - 32, 28, 24, 4, '#d9d9e3'); c.beginPath(); c.moveTo(p.x - 4, p.y - 26); c.lineTo(p.x + 7, p.y - 20); c.lineTo(p.x - 4, p.y - 14); c.fillStyle = '#e8333f'; c.fill(); tx(c, '100K', p.x, p.y + 12, R(700, 10), '#fff', 'center'); });
    planta(0.8, 28.3, 0.9); planta(6.3, 28.3, 0.9);

    // ---- plaza: zona chill estilo Vice City ----
    add(14.0, 9.6, (c) => { caja(c, 11.6, 9.2, 3.2, 1.0, 16, '#8e5bd8'); caja(c, 11.6, 9.1, 3.2, 0.3, 42, '#7a4bc4'); caja(c, 11.5, 9.2, 0.3, 1.0, 28, '#7a4bc4'); caja(c, 14.6, 9.2, 0.3, 1.0, 28, '#7a4bc4'); });
    add(17.6, 13.2, (c) => {
      caja(c, 16.4, 12.7, 2.2, 1.1, 34, '#2fbf71'); c.strokeStyle = '#d0d0d8'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const a = iso(16.7 + i * 0.5, 12.7, 40), b = iso(16.7 + i * 0.5, 13.8, 40); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      const bx = 17.5 + Math.sin(t / 500) * 0.8, p = iso(bx, 13.25, 36); c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fillStyle = '#fff'; c.fill();
    });
    [[21.0, 9.4, '#3d7be0', 'GTA'], [22.3, 9.4, '#ff6fae', 'VICE']].forEach(([gx, gy, col, s], j) => add(gx + 0.4, gy + 0.4, (c) => {
      caja(c, gx, gy, 0.9, 0.8, 96, col);
      enX(c, gx + 0.06, gy + 0.8, 88, () => { rr(c, 0, 0, 26, 22, 3, Math.floor(t / 300 + j) % 2 ? '#ffd36b' : '#7df9c8'); txF(c, s, 13, 15, P, 15, 24, '#1a1236', 'center'); });
    }));
    add(24.4, 9.8, (c) => { caja(c, 24.0, 9.3, 0.7, 0.6, 50, '#5a5560'); const p = iso(24.35, 9.9, 54); if (Math.floor(t / 900) % 2) { c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(p.x, p.y - 8, 2, 6); c.fillRect(p.x + 4, p.y - 12, 2, 6); } });
    Object.values(AG).forEach((g, i) => add(g.chill[0] - 0.2, g.chill[1] - 0.2, (c) => { const col = ['#ffd36b', '#4ff0e0', '#ff6fae', '#b18cff'][i], p = iso(g.chill[0], g.chill[1], 0); c.beginPath(); c.ellipse(p.x, p.y - 8, 28, 15, 0, 0, 7); c.fillStyle = tono(col, 0.8); c.fill(); c.beginPath(); c.ellipse(p.x, p.y - 14, 25, 12, 0, 0, 7); c.fillStyle = col; c.fill(); }));
    // fuente con la estatua de Flami
    add(14.0, 22.0, (c) => {
      const p = iso(14, 22, 0); c.beginPath(); c.ellipse(p.x, p.y, 96, 48, 0, 0, 7); c.fillStyle = '#c9bfe0'; c.fill();
      c.beginPath(); c.ellipse(p.x, p.y - 6, 86, 42, 0, 0, 7); c.fillStyle = '#5fd3e8'; c.fill();
      for (let i = 0; i < 3; i++) { const k = ((t / 1800) + i / 3) % 1; c.globalAlpha = 1 - k; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y - 6, 20 + k * 60, 10 + k * 30, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
      rr(c, p.x - 12, p.y - 40, 24, 34, 4, '#d9d2ea');
      const im = window.__tcFlami; if (im && im.complete && im.naturalWidth) { const h = 92, w = h * im.naturalWidth / im.naturalHeight; c.drawImage(im, p.x - w / 2, p.y - 40 - h, w, h); }
    });
    // descapotable rosa en su plataforma giratoria
    add(21.5, 21.5, (c) => {
      const p = iso(21.5, 21.5, 0); c.beginPath(); c.ellipse(p.x, p.y, 110, 55, 0, 0, 7); c.fillStyle = '#2a2140'; c.fill();
      c.beginPath(); c.ellipse(p.x, p.y - 4, 100, 50, 0, 0, 7); c.fillStyle = '#3a2f5c'; c.fill();
      c.save(); c.translate(p.x, p.y - 12); c.scale(1, 0.5); c.rotate(t / 3000);
      rr(c, -70, -30, 140, 60, 24, '#ff4fa3'); rr(c, -24, -24, 52, 48, 12, '#ffe0f0'); rr(c, -20, -20, 18, 40, 6, '#2a2140'); rr(c, 8, -20, 16, 40, 6, '#2a2140');
      c.fillStyle = '#14111f'; [[-48, -34], [36, -34], [-48, 26], [36, 26]].forEach(([x, y]) => c.fillRect(x, y, 16, 8));
      c.fillStyle = '#fff6b0'; c.fillRect(64, -22, 6, 10); c.fillRect(64, 12, 6, 10);
      c.restore();
      tx(c, 'Coche del mes', p.x, p.y + 44, R(600, 13), '#ffd36b', 'center');
    });
    palmera(9.2, 9.2); palmera(27.0, 9.2); palmera(9.2, 27.6); palmera(27.0, 27.6); palmera(10.5, 16.6); palmera(25.5, 16.6);
    planta(26.8, 14.0); planta(9.0, 14.0);
    return L;
  }

  // ---------- personajes ----------
  const salaDe = (x, y) => Object.entries(SALAS).find(([, s]) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.d);
  function camino(a, dest, propia) {
    const aqui = salaDe(a.x, a.y), alla = salaDe(dest[0], dest[1]), pu = puerta(SALAS[propia]);
    const r = [];
    if (aqui && (!alla || alla[0] !== aqui[0])) r.push(pu.dentro, pu.fuera);
    if (alla && (!aqui || alla[0] !== aqui[0])) r.push(pu.fuera, pu.dentro);
    r.push(dest); a.ruta = r; a.dest = dest;
  }
  function mover(a, dt, quieto) {
    if (!a.ruta.length) { a.anda = false; return; }
    if (quieto) { [a.x, a.y] = a.ruta[a.ruta.length - 1]; a.ruta = []; a.anda = false; return; }
    const [x2, y2] = a.ruta[0], dx = x2 - a.x, dy = y2 - a.y, dist = Math.hypot(dx, dy), v = 0.0021 * dt;
    if (dist <= v) { a.x = x2; a.y = y2; a.ruta.shift(); } else { a.x += dx / dist * v; a.y += dy / dist * v; a.dir = (dx - dy) >= 0 ? 1 : -1; }
    a.anda = a.ruta.length > 0;
  }
  function personaje(c, st, k, est, t) {
    const a = st.act[k], g = AG[k], modo = est.modo;
    const pose = a.anda ? 'relax' : modo === 'trabaja' ? 'trabaja' : modo === 'alerta' ? 'alerta' : 'relax';
    const img = st.img[g.p + '_' + pose], q = iso(a.x, a.y, 0), alto = 120;
    const bote = st.quieto ? 0 : a.anda ? Math.abs(Math.sin(t / 130)) * 5 : modo === 'trabaja' ? Math.abs(Math.sin(t / 260)) * 2 : Math.sin(t / 800) * 1.5;
    c.beginPath(); c.ellipse(q.x, q.y, 30, 11, 0, 0, 7); c.fillStyle = 'rgba(40,20,60,.25)'; c.fill();
    if (img && img.complete && img.naturalWidth) {
      const w = alto * img.naturalWidth / img.naturalHeight;
      c.save(); c.translate(q.x, q.y - bote); if (a.dir > 0) c.scale(-1, 1); if (modo === 'duerme' && !a.anda) c.globalAlpha = 0.88;
      c.drawImage(img, -w / 2, -alto, w, alto); c.restore(); c.globalAlpha = 1;
    }
    a.cab = { x: q.x, y: q.y - alto - bote };
    a.pie = q;
    if (modo === 'duerme' && !a.anda && !st.quieto) for (let i = 0; i < 3; i++) { const kk = ((t / 1300) + i / 3) % 1; c.globalAlpha = 1 - kk; tx(c, 'z', q.x + 28 + i * 8 + kk * 10, a.cab.y + 20 - kk * 32, R(700, 16 + i * 4), '#5a4b8a'); c.globalAlpha = 1; }
    if (modo === 'alerta' && Math.floor(t / 300) % 2) { c.beginPath(); c.arc(q.x + 34, a.cab.y + 10, 13, 0, 7); c.fillStyle = '#e8445a'; c.fill(); tx(c, '!', q.x + 34, a.cab.y + 17, R(700, 19), '#fff', 'center'); }
  }
  function chapa(c, st, k, est) {
    const a = st.act[k], q = a.pie; if (!q) return;
    const nom = NOMBRES[k]; c.font = R(600, 13); const wn = c.measureText(nom).width + 30;
    rr(c, q.x - wn / 2, q.y + 8, wn, 22, 11, 'rgba(42,33,64,.92)');
    c.beginPath(); c.arc(q.x - wn / 2 + 12, q.y + 19, 4, 0, 7); c.fillStyle = MODO[est.modo] || MODO.relax; c.fill();
    tx(c, nom, q.x - wn / 2 + 21, q.y + 23.5, R(600, 13), '#ffffff');
  }
  function bocadillo(c, st, k, est) {
    const a = st.act[k]; if (a.anda || !est.txt || !a.cab) return;
    c.font = R(600, 15); const w = c.measureText(est.txt).width + 40, h = 32;
    const x = a.cab.x - w / 2, y = a.cab.y - h - 12, fondo = est.modo === 'alerta' ? '#ffe3e6' : '#ffffff';
    c.shadowColor = 'rgba(40,20,70,.28)'; c.shadowBlur = 10; c.shadowOffsetY = 3; rr(c, x, y, w, h, 16, fondo); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.beginPath(); c.moveTo(a.cab.x - 7, y + h - 1); c.quadraticCurveTo(a.cab.x - 2, y + h + 8, a.cab.x + 4, y + h + 10); c.lineTo(a.cab.x + 6, y + h - 1); c.fillStyle = fondo; c.fill();
    c.beginPath(); c.arc(x + 17, y + h / 2, 5, 0, 7); c.fillStyle = MODO[est.modo] || MODO.relax; c.fill();
    tx(c, est.txt, x + 28, y + 21, R(600, 15), est.modo === 'alerta' ? '#9a1c2c' : '#3a2f55');
  }

  // ---------- montaje, arrastre, zoom y toques ----------
  return {
    LW, LH,
    // piezas que reutiliza la oficina 3D (oficina3d.js)
    datos, SALAS, AG, NOMBRES, MODO, puerta,
    paredes3d: { analisis: paredAnalisis, top: paredTop, guiones: paredGuiones, cine: paredCine, pc: paredPC, plato: paredPlato, publicacion: paredPublicacion, seguidores: paredSeguidores, neon },
    mount(el) {
      el.replaceChildren();
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Planta de oficinas de Fuera del Mapa: análisis, guiones, cine, sala del PC, plató, publicación y seguidores, cada una con sus datos y su personaje');
      cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
      const pista = document.createElement('div'); pista.className = 'tc-pista'; pista.textContent = 'Toca una sala para verla de cerca · arrastra para moverte';
      const barra = document.createElement('div'); barra.className = 'tc-salas';
      [['general', '🏢 Todo'], ['pc', '🔌 PC'], ['seguidores', '👥 Seguidores'], ['cine', '🎬 Vídeos'], ['analisis', '📊 Análisis'], ['guiones', '✍️ Guiones'], ['plato', '🎥 Plató'], ['publicacion', '🚀 Publicación']].forEach(([k, n]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.onclick = () => ir(k); barra.append(b);
      });
      const zm = document.createElement('div'); zm.className = 'tc-zoom';
      [['+', 1.35], ['−', 1 / 1.35]].forEach(([n, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-label', f > 1 ? 'Acercar' : 'Alejar'); b.onclick = () => zoom(f, el.clientWidth / 2, el.clientHeight / 2); zm.append(b); });
      el.append(cv, pista, barra, zm); setTimeout(() => pista.classList.add('fuera'), 5000);
      const quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = { cv, D: datos(), act: {}, img: {}, quieto, ult: 0, id: 0, vista: null, enlaces: [] };
      Object.entries(AG).forEach(([k, g]) => { st.act[k] = { x: g.sofa[0], y: g.sofa[1], dir: 1, ruta: [], dest: null }; });
      ['flami', 'rocco', 'manolo', 'caiman'].forEach((n) => ['relax', 'trabaja', 'alerta'].forEach((k) => { const im = new Image(); im.src = ruta(`${n}_${k}`); st.img[`${n}_${k}`] = im; }));
      window.__tcFlami = st.img.flami_relax;
      if (document.fonts && document.fonts.load) Promise.all([R(500, 16), R(600, 16), R(700, 16), P(20)].map((f) => document.fonts.load(f))).catch(() => {});
      const ctx = cv.getContext('2d');
      const ajustar = () => {
        const cw = el.clientWidth, ch = el.clientHeight, cabe = Math.min(cw / LW, ch / LH);
        const s = cw < 700 ? Math.max(cabe, 0.55) : Math.max(cabe, Math.min(0.75, ch / 900));
        st.min = cabe * 0.9; st.max = 2.4;
        const foco = iso(12, 9, 60);
        st.vista = { s, x: cw / 2 - foco.x * s, y: ch / 2 - foco.y * s };
      };
      const limitar = () => {
        const v = st.vista, cw = el.clientWidth, ch = el.clientHeight;
        v.s = Math.max(st.min, Math.min(st.max, v.s));
        const W2 = LW * v.s, H2 = LH * v.s;
        const mx = cw * 0.45, my = ch * 0.45;   // margen para poder centrar también las salas de las esquinas
        v.x = W2 <= cw ? Math.min(cw - W2 + mx, Math.max(-mx, v.x)) : Math.min(mx, Math.max(cw - W2 - mx, v.x));
        v.y = H2 <= ch ? Math.min(ch - H2 + my, Math.max(-my, v.y)) : Math.min(my, Math.max(ch - H2 - my, v.y));
      };
      // viaje suave a una sala (o a la vista general)
      const ir = (k) => {
        const cw = el.clientWidth, ch = el.clientHeight - 56; let s, f;
        if (k === 'general') { s = Math.min(cw / LW, ch / LH); f = { x: LW / 2, y: LH / 2 }; }
        else { const r = SALAS[k]; s = Math.max(0.8, Math.min(2.2, Math.min(cw / 470, ch / 520))); f = r.muro === 'fondo' ? iso(r.x + 3.5, 2.6, 95) : iso(2.6, r.y + 3.5, 95); }
        st.anim = { de: { ...st.vista }, a: { s, x: cw / 2 - f.x * s, y: ch / 2 - f.y * s }, t0: performance.now() };
        if (st.quieto) { Object.assign(st.vista, st.anim.a); st.anim = null; limitar(); requestAnimationFrame(st.frame); }
      };
      st.ir = ir;
      const salaEn = (px, py) => {
        const v = st.vista, wx = (px - v.x) / v.s, wy = (py - v.y) / v.s, a = (wx - OX) / (TW / 2), b = (wy - OY) / (TH / 2);
        let gx = (a + b) / 2, gy = (b - a) / 2;
        if (gy < 0) gy = 1; if (gx < 0) gx = 1;   // toque en una pared: la sala de esa pared
        const e = Object.entries(SALAS).find(([, r]) => gx >= r.x && gx <= r.x + r.w && gy >= r.y && gy <= r.y + r.d); return e && e[0];
      };
      const zoom = (f, px, py) => { const v = st.vista, s2 = Math.max(st.min, Math.min(st.max, v.s * f)); v.x = px - (px - v.x) * s2 / v.s; v.y = py - (py - v.y) * s2 / v.s; v.s = s2; limitar(); };
      const punteros = new Map(); let ultimoToque = 0, dist0 = 0, inicio = null;
      const pos = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      const dentro = (pt, pol) => { let r = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [xi, yi] = pol[i], [xj, yj] = pol[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) r = !r; } return r; };
      const dprAhora = () => Math.min(2, window.devicePixelRatio || 1);
      cv.addEventListener('pointerdown', (e) => {
        st.anim = null; cv.setPointerCapture(e.pointerId); const p = pos(e); punteros.set(e.pointerId, p); cv.style.cursor = 'grabbing';
        inicio = punteros.size === 1 ? { p, t: Date.now(), movido: 0 } : null;
        if (punteros.size === 2) { const [a, b] = [...punteros.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); }
      });
      cv.addEventListener('pointermove', (e) => {
        if (!punteros.has(e.pointerId)) { const [x, y] = pos(e), d = dprAhora(); cv.style.cursor = st.enlaces.some((l) => dentro([x * d, y * d], l.poli)) ? 'pointer' : 'grab'; return; }
        const prev = punteros.get(e.pointerId), now = pos(e); punteros.set(e.pointerId, now);
        if (inicio) inicio.movido += Math.hypot(now[0] - prev[0], now[1] - prev[1]);
        if (punteros.size === 1) { st.vista.x += now[0] - prev[0]; st.vista.y += now[1] - prev[1]; limitar(); }
        else if (punteros.size === 2) { const [a, b] = [...punteros.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dist0) zoom(d / dist0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dist0 = d; }
      });
      cv.addEventListener('pointerup', (e) => {
        const p = pos(e);
        if (inicio && inicio.movido < 8 && Date.now() - inicio.t < 500) {
          const d = dprAhora(), l = st.enlaces.find((x) => dentro([p[0] * d, p[1] * d], x.poli));
          if (l) window.open(l.url, '_blank', 'noopener');
          else { const k = salaEn(p[0], p[1]); if (k) ir(k); else { const ahora = Date.now(); if (ahora - ultimoToque < 320) zoom(st.vista.s > st.min * 2 ? 0.5 : 1.8, p[0], p[1]); ultimoToque = ahora; } }
        }
        punteros.delete(e.pointerId); if (!punteros.size) cv.style.cursor = 'grab'; dist0 = 0; inicio = null;
      });
      cv.addEventListener('pointercancel', (e) => { punteros.delete(e.pointerId); inicio = null; });
      cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = pos(e); zoom(e.deltaY < 0 ? 1.12 : 0.89, x, y); }, { passive: false });

      const frame = (t) => {
        const dpr = dprAhora(), cw = el.clientWidth, ch = el.clientHeight;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); ajustar(); limitar(); }
        const dt = Math.min(60, t - (st.ult || t)); st.ult = t;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        if (st.anim) { const k = Math.min(1, (t - st.anim.t0) / 650), e = 1 - Math.pow(1 - k, 3), A = st.anim; ['s', 'x', 'y'].forEach((c) => { st.vista[c] = A.de[c] + (A.a[c] - A.de[c]) * e; }); if (k >= 1) { st.anim = null; limitar(); } }
        const v = st.vista; ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.x, dpr * v.y);
        const D = st.D, modos = {};
        st.enlaces = [];
        Object.keys(AG).forEach((k) => { modos[k] = (D.est[k] || {}).modo || 'relax'; });
        suelo(ctx);
        paredes(ctx, D, t, modos, st);
        const L = muebles(D, t, modos);
        Object.entries(AG).forEach(([k, g]) => {
          const a = st.act[k], m = modos[k], dest = m === 'trabaja' || m === 'alerta' ? g.mesa : m === 'duerme' ? g.chill : g.sofa;
          if (a.dest !== dest) camino(a, dest, g.sala);
          mover(a, dt, st.quieto);
          L.push({ d: a.x + a.y + 0.02, f: (c) => personaje(c, st, k, D.est[k] || { modo: 'relax' }, t) });
        });
        L.sort((a, b) => a.d - b.d).forEach((o) => o.f(ctx));
        Object.values(SALAS).forEach((s) => cabecera(ctx, s));
        Object.keys(AG).forEach((k) => chapa(ctx, st, k, D.est[k] || {}));
        Object.keys(AG).forEach((k) => bocadillo(ctx, st, k, D.est[k] || {}));
        if (D.act) { const d = new Date(D.act); if (!isNaN(d)) { const p = iso(GX, GY, -40); tx(ctx, 'datos de las ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), p.x - 20, p.y + 10, R(500, 16), 'rgba(255,255,255,.7)', 'right'); } }
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
