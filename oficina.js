// Torre Flami: el edificio de los agentes, planta por planta. Lee los datos con dash.data(...)
window.tcOfi = (() => {
  const W = 560, H = 1220;
  const TX = 40, TW = 480, RX = 52, RW = 396, SX = 456, SW = 52;   // torre, salas, hueco del ascensor
  const ALTO = 172, TECHO = 190, LOBBY = 878, CALLE = 1108;
  const ESTRENO = new Date('2026-11-19T00:00:00+01:00');
  const SPR = window.TC_SPR || {};
  const ruta = (n) => SPR[n] || `spr/${n}.png`;
  const PISOS = [
    { k: 'analista', n: 'ANÁLISIS', ico: '📊', y: TECHO, pared: '#ffe3cc', ag: 'caiman', nom: 'Don Caimán', mesa: RX + 312, relax: RX + 238 },
    { k: 'guionista', n: 'SALA DE GUIONES', ico: '✍️', y: TECHO + ALTO, pared: '#d6e9ff', ag: 'rocco', nom: 'Rocco', mesa: RX + 312, relax: RX + 240 },
    { k: 'fabrica', n: 'PLATÓ · FÁBRICA', ico: '🎬', y: TECHO + ALTO * 2, pared: '#e9dcff', ag: 'flami', nom: 'Flami', mesa: RX + 330, relax: RX + 292 },
    { k: 'publicador', n: 'PUBLICACIÓN', ico: '🚀', y: TECHO + ALTO * 3, pared: '#d5f5e3', ag: 'manolo', nom: 'Agente Manolo', mesa: RX + 312, relax: RX + 240 }
  ];
  const MODO = { trabaja: ['TRABAJANDO', '#39d98a'], relax: ['DESCANSANDO', '#ffd36b'], duerme: ['DURMIENDO', '#9b93c9'], alerta: ['¡ALERTA!', '#ff4d5e'] };

  // ---------- utilidades ----------
  const F = (p, s) => `${p} ${s}px Inter, system-ui, sans-serif`;
  const fmt = (v) => (v == null || isNaN(v) ? '—' : new Intl.NumberFormat('es-ES').format(v));
  const corto = (v) => (v == null || isNaN(v) ? '—' : v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' M' : v >= 1e4 ? Math.round(v / 1000) + ' mil' : fmt(v));
  const rr = (c, x, y, w, h, r, col) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = col; c.fill(); };
  const tx = (c, s, x, y, f, col, al = 'left') => { c.font = f; c.fillStyle = col; c.textAlign = al; c.fillText(s, x, y); c.textAlign = 'left'; };
  const corta = (c, s, max) => { s = String(s || ''); if (c.measureText(s).width <= max) return s; while (s.length > 1 && c.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };
  const tono = (hex, f) => { const n = parseInt(hex.slice(1), 16), k = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${k(n >> 16)},${k((n >> 8) & 255)},${k(n & 255)})`; };
  function siguiente(lista) {
    const ahora = new Date(), madrid = (x) => new Date(x.toLocaleString('en-US', { timeZone: 'Europe/Madrid' })), des = madrid(ahora) - ahora;
    for (let d = 0; d < 8; d++) for (const [dias, h, m] of lista) {
      const b = madrid(ahora); b.setDate(b.getDate() + d); b.setHours(h, m, 0, 0);
      if (dias && !dias.includes(b.getDay())) continue;
      const r = new Date(b - des); if (r > ahora) return r;
    }
    return null;
  }
  const hora = (x) => (x ? x.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

  // ---------- datos ----------
  function datos() {
    const v = (id) => { const r = dash.data(id); return r.status === 'ok' ? r.data : []; };
    const T = v('totales')[0] || {}, C = v('cola')[0] || {}, pce = (v('pc_estado')[0] || {}).estado, pc = v('pc')[0] || {};
    const ag = v('agentes'), fila = (id) => ag.find((a) => a.id === id);
    const horas = (s) => (s ? (Date.now() - new Date(s)) / 36e5 : Infinity);
    const g = fila('guionista'), pu = fila('publicador'), an = fila('analista');
    const e = {};
    e.guionista = !g ? { modo: 'relax', txt: 'Pensando ideas…' } : g.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Hoy no he escrito!' } : horas(g.ultima) < 1.5 ? { modo: 'trabaja', txt: 'Escribiendo guiones ✍️' } : { modo: 'relax', txt: 'Guiones de hoy hechos ☕' };
    e.fabrica = pce === 'Apagado' ? { modo: 'duerme', txt: 'PC apagado: enciéndelo 🔌' } : pce !== 'Trabajando' ? { modo: 'relax', txt: 'Esperando al PC…' } : (C.guiones || 0) > 0 ? { modo: 'trabaja', txt: `¡Grabando ${C.guiones} vídeo${C.guiones > 1 ? 's' : ''}! 🎬` } : { modo: 'relax', txt: 'Todo grabado, a esperar' };
    e.publicador = !pu ? { modo: 'relax', txt: 'Revisando el copyright' } : pu.resultado !== 'ok' ? { modo: 'alerta', txt: '¡Vídeos atascados!' } : horas(pu.ultima) < 0.4 ? { modo: 'trabaja', txt: 'Subiendo vídeos 🚀' } : (C.listos || 0) > 0 ? { modo: 'relax', txt: `${C.listos} listos para subir 📦` } : { modo: 'relax', txt: 'Todo subido ✓' };
    const dia = new Date().getDay();
    e.analista = !an ? { modo: 'relax', txt: 'Mirando cifras…' } : horas(an.ultima) < 0.5 ? { modo: 'trabaja', txt: 'Estudiando los datos 📊' } : { modo: 'duerme', txt: dia === 3 || dia === 0 ? 'Esta noche estudio 📊' : dia < 3 ? 'Vuelvo el miércoles' : 'Vuelvo el domingo' };
    const vids = v('videos'), es = vids.filter((x) => (x.canal || 'es') === 'es');
    const hist = v('historico').map((h) => ({ t: new Date(h.hora).getTime(), v: Number(h.vistas) || 0 }));
    let dia24 = null;
    if (hist.length > 1) { const u = hist[hist.length - 1], ref = hist.find((x) => u.t - x.t <= 864e5) || hist[0]; dia24 = u.v - ref.v; }
    const red = (n) => v('redes').find((r) => r.red === n) || {};
    return {
      est: e, pce, version: pc.version, act: pc.ultima_ejecucion || pc.actualizado,
      vistas: T.vistas, likes: T.likes, guiones: C.guiones || 0, listos: C.listos || 0, publicados: v('publicados').length,
      proximos: v('pendientes').map((p) => p.nombre),
      hist: hist.slice(-48).map((h) => h.v), dia24,
      redes: { yt: red('YouTube'), br: red('YouTube Brasil'), tt: red('TikTok'), ig: red('Instagram') },
      vistas90: es.filter((x) => Date.now() - new Date(x.publicado) < 90 * 864e5).reduce((s, x) => s + (Number(x.vistas) || 0), 0),
      top: es.slice().sort((a, b) => b.vistas - a.vistas)[0],
      prox: { guionista: siguiente([[null, 6, 42]]), publicador: siguiente([[null, 12, 47], [null, 22, 47]]), analista: siguiente([[[0, 3], 20, 37]]) }
    };
  }

  // ---------- exterior ----------
  const ESTRELLAS = Array.from({ length: 70 }, (_, i) => [(i * 151.3) % W, (i * 67.7) % 420, (i % 3) ? 1.5 : 2.5]);
  const SKY = [[0, 34, 560], [18, 22, 760], [524, 36, 600], [540, 20, 820]];
  const COCHES = [{ c: '#ff4fa3', v: 70, y: 1158, d: 1, x: 0 }, { c: '#4ff0e0', v: 95, y: 1188, d: -1, x: 300 }, { c: '#ffd36b', v: 55, y: 1158, d: 1, x: 380 }];
  function exterior(c, t, D) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#140d33'); g.addColorStop(0.3, '#3b1d63'); g.addColorStop(0.62, '#a8346f'); g.addColorStop(0.85, '#ff8a5c'); g.addColorStop(1, '#ffb36b');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    ESTRELLAS.forEach(([x, y, s], i) => { c.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(t / 1100 + i)); c.fillStyle = '#fff'; c.fillRect(x, y, s, s); });
    c.globalAlpha = 1;
    c.beginPath(); c.arc(58, 44, 17, 0, 7); c.fillStyle = '#ffe9b8'; c.fill();
    c.beginPath(); c.arc(51, 39, 16, 0, 7); c.fillStyle = 'rgba(20,13,51,.45)'; c.fill();
    // rascacielos a los lados
    SKY.forEach(([x, w, h], i) => {
      rr(c, x - w / 2, CALLE - h, w, h, 2, i % 2 ? '#24184a' : '#2e2160');
      for (let y = CALLE - h + 12; y < CALLE - 10; y += 16) for (let k = 0; k < 2; k++) if ((y + i * 7 + k * 3) % 5 < 2) { c.fillStyle = (y + k) % 3 ? 'rgba(79,240,224,.6)' : 'rgba(255,111,174,.65)'; c.fillRect(x - w / 2 + 5 + k * (w / 2), y, 5, 6); }
    });
    // focos del tejado barriendo el cielo
    [[110, 1], [450, -1]].forEach(([x, s], i) => {
      const a = -Math.PI / 2 + s * (0.35 + 0.3 * Math.sin(t / 2200 + i * 2));
      c.save(); c.translate(x, TECHO - 8); c.rotate(a + Math.PI / 2);
      const lg = c.createLinearGradient(0, 0, 0, -520); lg.addColorStop(0, 'rgba(255,243,176,.35)'); lg.addColorStop(1, 'rgba(255,243,176,0)');
      c.beginPath(); c.moveTo(-6, 0); c.lineTo(-60, -520); c.lineTo(60, -520); c.lineTo(6, 0); c.fillStyle = lg; c.fill(); c.restore();
      rr(c, x - 10, TECHO - 16, 20, 10, 3, '#2a2148');
    });
    // antena
    c.strokeStyle = '#2a2148'; c.lineWidth = 4; c.beginPath(); c.moveTo(500, TECHO); c.lineTo(500, 34); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(488, 70); c.lineTo(512, 70); c.moveTo(492, 50); c.lineTo(508, 50); c.stroke();
    c.beginPath(); c.arc(500, 30, 5, 0, 7); c.fillStyle = Math.floor(t / 600) % 2 ? '#ff4d5e' : '#5a1830'; c.fill();
    // cartel de neón
    c.strokeStyle = '#2a2148'; c.lineWidth = 5; [110, 450].forEach((x) => { c.beginPath(); c.moveTo(x, 166); c.lineTo(x, TECHO); c.stroke(); });
    rr(c, 66, 62, 412, 108, 14, '#1a1236');
    const on = Math.sin(t / 420) > -0.85;
    c.lineWidth = 3; c.strokeStyle = on ? '#ff6fae' : '#6a2a52'; c.shadowColor = '#ff4fa3'; c.shadowBlur = on ? 14 : 0;
    c.beginPath(); c.roundRect(74, 70, 396, 92, 10); c.stroke();
    tx(c, 'FUERA DEL MAPA', W / 2 - 8, 116, F(900, 40), on ? '#ff8cc0' : '#8a3d6a', 'center');
    c.shadowColor = '#4ff0e0';
    const ms = ESTRENO - Date.now();
    const cuenta = ms > 0 ? `GTA 6 · FALTAN ${Math.floor(ms / 864e5)} D ${String(Math.floor(ms / 36e5) % 24).padStart(2, '0')} H ${String(Math.floor(ms / 6e4) % 60).padStart(2, '0')} MIN` : 'GTA 6 · ¡YA A LA VENTA!';
    tx(c, cuenta, W / 2 - 8, 146, F(800, 17), on ? '#7ff7ec' : '#2e6a66', 'center');
    c.shadowBlur = 0;
    if (D.act) { const d = new Date(D.act); if (!isNaN(d)) tx(c, 'Datos de las ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), 12, 18, F(600, 12), 'rgba(255,255,255,.7)'); }
  }

  function calle(c, t, dt) {
    rr(c, 0, CALLE, W, 24, 0, '#c9bfdc');
    c.fillStyle = 'rgba(80,60,120,.25)'; for (let x = 0; x < W; x += 28) c.fillRect(x, CALLE, 2, 24);
    rr(c, 0, CALLE + 24, W, H - CALLE - 24, 0, '#2a2438');
    c.fillStyle = '#ffd36b'; for (let x = (t / 30) % 40 - 40; x < W; x += 40) c.fillRect(x, CALLE + 64, 20, 3);
    COCHES.forEach((k) => {
      k.x += k.d * k.v * dt / 1000; if (k.x > W + 60) k.x = -60; if (k.x < -60) k.x = W + 60;
      c.save(); c.translate(k.x, k.y); c.scale(k.d, 1);
      rr(c, -26, -16, 52, 14, 5, k.c); rr(c, -14, -26, 26, 12, 5, tono(k.c, 0.8)); rr(c, -10, -23, 18, 7, 2, '#bfe9ff');
      c.fillStyle = '#14111f'; c.beginPath(); c.arc(-15, -2, 5, 0, 7); c.arc(15, -2, 5, 0, 7); c.fill();
      c.fillStyle = '#fff3b0'; c.fillRect(24, -13, 4, 4); c.restore();
    });
    // farolas y palmeras delante del edificio
    [[16, 1], [544, -1]].forEach(([x, s]) => {
      c.strokeStyle = '#3a2f63'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, CALLE + 22); c.quadraticCurveTo(x + 14 * s, CALLE - 80, x + 4 * s, CALLE - 150); c.stroke();
      c.fillStyle = '#1f6b4a';
      for (let k = 0; k < 7; k++) { c.save(); c.translate(x + 4 * s, CALLE - 150); c.rotate(-2.9 + k * 0.8 + Math.sin(t / 900 + k) * 0.04); c.beginPath(); c.ellipse(30, 0, 32, 7, 0, 0, 7); c.fill(); c.restore(); }
    });
  }

  // ---------- estructura del edificio ----------
  function estructura(c) {
    rr(c, TX - 6, TECHO - 12, TW + 12, 14, 4, '#2a2148');
    c.fillStyle = '#ff6fae'; c.fillRect(TX - 6, TECHO - 2, TW + 12, 3);
    rr(c, TX, TECHO, TW, CALLE - TECHO, 0, '#3a2f63');
    rr(c, SX, TECHO + 4, SW, CALLE - TECHO - 4, 0, '#1b1530');
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; [SX + 14, SX + SW - 14].forEach((x) => { c.beginPath(); c.moveTo(x, TECHO); c.lineTo(x, CALLE); c.stroke(); });
  }
  function forjado(c, y) { rr(c, TX, y, TW, 10, 0, '#2a2148'); c.fillStyle = '#4ff0e0'; c.globalAlpha = 0.55; c.fillRect(RX, y + 8, RW, 2); c.globalAlpha = 1; }

  function ascensor(c, t, quieto) {
    const paradas = PISOS.map((p) => p.y + 150).concat([LOBBY + 196]);
    const ciclo = 4800, n = paradas.length, fase = quieto ? 0 : (t % (ciclo * n * 2)) / ciclo;
    const idx = Math.floor(fase), f = fase - idx, seq = paradas.concat(paradas.slice(1, -1).reverse());
    const a = seq[idx % seq.length], b = seq[(idx + 1) % seq.length];
    const k = f < 0.55 ? 0 : (f - 0.55) / 0.45, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const y = a + (b - a) * e;
    c.strokeStyle = '#8a83b0'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(SX + SW / 2, TECHO); c.lineTo(SX + SW / 2, y - 62); c.stroke();
    rr(c, SX + 4, y - 62, SW - 8, 62, 4, '#ffd36b');
    rr(c, SX + 9, y - 54, SW - 18, 30, 3, '#fff6d6');
    c.beginPath(); c.arc(SX + SW / 2, y - 40, 5, 0, 7); c.fillStyle = '#ff7eb6'; c.fill();
    c.strokeStyle = '#ff7eb6'; c.lineWidth = 2; c.beginPath(); c.moveTo(SX + SW / 2, y - 35); c.lineTo(SX + SW / 2, y - 26); c.stroke();
    c.fillStyle = '#c99a3a'; c.fillRect(SX + SW / 2 - 1, y - 20, 2, 18);
    ['4', '3', '2', '1', 'B'].forEach((s, i) => { const yy = (i < 4 ? PISOS[i].y : LOBBY) + 22; rr(c, SX + 14, yy - 13, 24, 18, 5, '#2a2148'); tx(c, s, SX + 26, yy + 1, F(900, 12), '#ffd36b', 'center'); });
  }

  // ---------- planta genérica ----------
  function sala(c, p, modo, t) {
    const y = p.y, apagada = modo === 'duerme';
    const g = c.createLinearGradient(0, y, 0, y + 136); g.addColorStop(0, apagada ? tono(p.pared, 0.42) : p.pared); g.addColorStop(1, apagada ? tono(p.pared, 0.34) : tono(p.pared, 0.9));
    c.fillStyle = g; c.fillRect(RX, y, RW, 136);
    c.fillStyle = apagada ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.18)'; for (let x = RX + 18; x < RX + RW; x += 36) c.fillRect(x, y, 10, 136);
    // suelo de madera
    rr(c, RX, y + 136, RW, 26, 0, apagada ? '#7a5a3c' : '#d9a66b');
    c.fillStyle = 'rgba(100,60,30,.25)'; for (let x = RX + 30; x < RX + RW; x += 46) c.fillRect(x, y + 136, 2, 26);
    rr(c, RX, y + 134, RW, 4, 0, apagada ? '#5a4060' : '#ffffff');
    // lámpara de techo
    const lx = RX + 286;
    c.strokeStyle = '#2a2148'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, y); c.lineTo(lx, y + 14); c.stroke();
    c.beginPath(); c.moveTo(lx - 14, y + 24); c.lineTo(lx - 6, y + 14); c.lineTo(lx + 6, y + 14); c.lineTo(lx + 14, y + 24); c.closePath(); c.fillStyle = '#2a2148'; c.fill();
    if (!apagada) {
      const lg = c.createLinearGradient(0, y + 24, 0, y + 150); lg.addColorStop(0, 'rgba(255,246,190,.45)'); lg.addColorStop(1, 'rgba(255,246,190,0)');
      c.beginPath(); c.moveTo(lx - 12, y + 24); c.lineTo(lx - 80, y + 150); c.lineTo(lx + 80, y + 150); c.lineTo(lx + 12, y + 24); c.fillStyle = lg; c.fill();
    }
  }
  function placa(c, p, modo) {
    c.font = F(800, 13); const s = `${p.ico} ${p.n}`, w = c.measureText(s).width + 20;
    rr(c, RX + 10, p.y + 9, w, 24, 8, 'rgba(26,18,54,.9)'); tx(c, s, RX + 20, p.y + 26, F(800, 13), '#fff');
    const [et, col] = MODO[modo] || MODO.relax; c.font = F(900, 11); const w2 = c.measureText(et).width + 26;
    rr(c, RX + RW - 10 - w2, p.y + 10, w2, 22, 11, 'rgba(26,18,54,.9)');
    c.beginPath(); c.arc(RX + RW - w2 + 1, p.y + 21, 4, 0, 7); c.fillStyle = col; c.fill();
    tx(c, et, RX + RW - 10 - w2 + 18, p.y + 25, F(900, 11), col);
  }
  function pantalla(c, x, y, w, h) {
    rr(c, x - 4, y - 4, w + 8, h + 8, 8, '#14111f');
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1f2a48'); g.addColorStop(1, '#111829'); rr(c, x, y, w, h, 5, g);
  }
  function mesa(c, x, y, col = '#ffffff') {
    rr(c, x - 50, y + 108, 92, 7, 2, col); c.fillStyle = tono(col.length === 7 ? col : '#ffffff', 0.7);
    c.fillRect(x - 46, y + 115, 5, 21); c.fillRect(x + 33, y + 115, 5, 21);
  }
  function sofa(c, x, y, col) { rr(c, x - 34, y + 104, 68, 22, 8, tono(col, 0.85)); rr(c, x - 34, y + 118, 68, 16, 6, col); rr(c, x - 40, y + 108, 10, 26, 5, tono(col, 0.75)); rr(c, x + 30, y + 108, 10, 26, 5, tono(col, 0.75)); }
  function planta(c, x, y) { rr(c, x - 10, y + 116, 20, 20, 3, '#c0703c'); c.fillStyle = '#2f9e5b'; [[-8, 100, 9], [6, 96, 10], [0, 86, 9]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); }); }

  // ---------- contenido de cada planta ----------
  function analisis(c, p, D, t) {
    const x = RX + 14, y = p.y + 40, w = 196, h = 92; pantalla(c, x, y, w, h);
    tx(c, 'VISTAS POR HORA', x + 10, y + 15, F(800, 10), '#4ff0e0');
    tx(c, fmt(D.vistas) + ' 👁', x + 10, y + 38, F(900, 20), '#fff');
    tx(c, (D.dia24 != null ? '+' + fmt(D.dia24) : '—') + ' en 24 h', x + w - 10, y + 36, F(800, 11), '#ffd36b', 'right');
    const hs = D.hist, cx = x + 10, cy = y + 46, cw = w - 20, ch = 28;
    if (hs.length > 1) {
      const mn = Math.min(...hs), mx = Math.max(...hs);
      const pts = hs.map((v, i) => [cx + cw * i / (hs.length - 1), cy + ch - ch * (v - mn) / ((mx - mn) || 1)]);
      const ag = c.createLinearGradient(0, cy, 0, cy + ch); ag.addColorStop(0, 'rgba(255,111,174,.45)'); ag.addColorStop(1, 'rgba(255,111,174,0)');
      c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.lineTo(cx + cw, cy + ch); c.lineTo(cx, cy + ch); c.fillStyle = ag; c.fill();
      c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.strokeStyle = '#ff6fae'; c.lineWidth = 2; c.stroke();
      const [ux, uy] = pts[pts.length - 1]; c.beginPath(); c.arc(ux, uy, 3 + Math.sin(t / 300), 0, 7); c.fillStyle = '#fff'; c.fill();
    } else tx(c, 'recogiendo datos…', cx, cy + 18, F(600, 11), '#8fa0c0');
    tx(c, '❤ ' + fmt(D.likes) + ' likes · estudio ' + hora(D.prox.analista), x + 10, y + h - 7, F(600, 9.5), '#b9c3dd');
    planta(c, RX + 228, p.y);
  }
  function guiones(c, p, D, t, modo) {
    const x = RX + 14, y = p.y + 40, w = 196, h = 92;
    rr(c, x - 5, y - 5, w + 10, h + 10, 6, '#a9a2bf'); rr(c, x, y, w, h, 3, '#fdfcff');
    tx(c, `PRÓXIMOS GUIONES · ${D.guiones}`, x + 10, y + 16, F(900, 11), '#2b2540');
    const L = D.proximos.length ? D.proximos.slice(0, 3) : ['Cola vacía: todo montado ✓'];
    c.font = F(700, 11); L.forEach((n, i) => tx(c, '• ' + corta(c, n, w - 24), x + 10, y + 35 + i * 16, F(700, 11), i % 2 ? '#3d7be0' : '#e0507f'));
    tx(c, 'Siguiente tanda: ' + hora(D.prox.guionista), x + 10, y + h - 7, F(600, 9.5), '#6a6384');
    rr(c, RX + 224, p.y + 104, 34, 30, 3, '#c99a5b'); for (let i = 0; i < Math.min(6, D.guiones + 2); i++) rr(c, RX + 228, p.y + 100 - i * 3, 26, 3, 1, i % 2 ? '#fffbe6' : '#f2eedd');
    if (modo === 'trabaja') for (let i = 0; i < 3; i++) { const k = ((t / 1600) + i / 3) % 1; c.globalAlpha = 1 - k; rr(c, p.mesa + 10 + k * 40, p.y + 80 - k * 60 + i * 4, 12, 15, 1, '#fffbe6'); c.globalAlpha = 1; }
  }
  function plato(c, p, D, t, modo) {
    const y = p.y;
    rr(c, RX + 268, y + 40, 116, 96, 4, modo === 'duerme' ? '#1f5a3e' : '#39d98a');
    const x = RX + 14, yy = y + 40, w = 196, h = 92; pantalla(c, x, yy, w, h);
    const on = D.pce === 'Trabajando', off = D.pce === 'Apagado';
    c.beginPath(); c.arc(x + 18, yy + 26, 7, 0, 7); c.fillStyle = on ? '#39d98a' : off ? '#ff4d5e' : '#8a83b0'; c.fill();
    tx(c, on ? 'PC ENCENDIDO' : off ? 'PC APAGADO' : 'PC SIN DATOS', x + 32, yy + 31, F(900, 15), '#fff');
    tx(c, `Grabando: ${D.guiones}   ·   Listos: ${D.listos}`, x + 10, yy + 56, F(700, 11), '#cfd8ee');
    tx(c, off ? 'Enciéndelo para grabar vídeos' : 'Monta los vídeos solo', x + 10, yy + 72, F(600, 10), off ? '#ff9aa6' : '#8fa0c0');
    tx(c, D.version ? 'Fábrica ' + D.version : 'Fábrica automática', x + 10, yy + h - 7, F(600, 9.5), '#8fa0c0');
    // cámara
    const cx = RX + 232; c.strokeStyle = '#2b2540'; c.lineWidth = 2;
    [[-10, 0], [10, 0], [0, 4]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx, y + 108); c.lineTo(cx + dx, y + 136 + dy); c.stroke(); });
    rr(c, cx - 16, y + 92, 30, 18, 4, '#1b1b26'); c.beginPath(); c.arc(cx - 6, y + 86, 8, 0, 7); c.arc(cx + 6, y + 86, 7, 0, 7); c.fillStyle = '#1b1b26'; c.fill();
    rr(c, cx + 14, y + 96, 10, 9, 2, '#3a3a48');
    if (on && Math.floor(t / 600) % 2) { c.beginPath(); c.arc(cx - 10, y + 98, 3, 0, 7); c.fillStyle = '#ff3b3b'; c.fill(); }
  }
  function publicacion(c, p, D, t) {
    const x = RX + 14, y = p.y + 40, w = 196, h = 92; pantalla(c, x, y, w, h);
    tx(c, 'POR SUBIR', x + 10, y + 16, F(800, 10), '#ffd36b');
    tx(c, fmt(D.listos), x + 10, y + 48, F(900, 30), '#fff');
    tx(c, 'PUBLICADOS', x + 104, y + 16, F(800, 10), '#4ff0e0');
    tx(c, fmt(D.publicados), x + 104, y + 48, F(900, 30), '#fff');
    tx(c, 'YouTube · TikTok · Instagram', x + 10, y + 66, F(600, 10), '#8fa0c0');
    tx(c, 'Próxima subida: ' + hora(D.prox.publicador), x + 10, y + h - 7, F(600, 9.5), '#b9c3dd');
    for (let i = 0; i < Math.min(6, D.listos); i++) { const bx = RX + 220 + (i % 3) * 18, by = p.y + 118 - Math.floor(i / 3) * 16; rr(c, bx, by, 16, 16, 2, '#c99a5b'); c.fillStyle = '#7a5530'; c.fillRect(bx + 3, by + 7, 10, 2); }
  }
  function movilesMesa(c, p, t) {
    [['#ff3d3d', -34], ['#111111', -16], ['#c13584', 2]].forEach(([col, dx], i) => {
      rr(c, p.mesa + dx, p.y + 92, 14, 18, 3, col); rr(c, p.mesa + dx + 2, p.y + 94, 10, 12, 2, 'rgba(255,255,255,.25)');
      if (Math.floor(t / 900 + i) % 4 === 0) { c.beginPath(); c.arc(p.mesa + dx + 12, p.y + 92, 4, 0, 7); c.fillStyle = '#ff4d5e'; c.fill(); }
    });
  }
  function portatil(c, x, y, on) { rr(c, x - 22, y + 86, 34, 22, 3, '#3a3f52'); rr(c, x - 19, y + 89, 28, 16, 2, on ? '#4ff0e0' : '#262a38'); rr(c, x - 26, y + 107, 42, 3, 1, '#8a93a3'); }

  // ---------- recepción: los seguidores ----------
  function recepcion(c, D, t) {
    const y = LOBBY;
    const g = c.createLinearGradient(0, y, 0, CALLE); g.addColorStop(0, '#2d2452'); g.addColorStop(1, '#3d2f6b');
    c.fillStyle = g; c.fillRect(RX, y, RW, CALLE - y);
    rr(c, RX, CALLE - 22, RW, 22, 0, '#e8e0f5'); c.fillStyle = 'rgba(120,100,170,.25)'; for (let x = RX; x < RX + RW; x += 40) c.fillRect(x, CALLE - 22, 1, 22);
    c.font = F(800, 13); const s = '🏢 RECEPCIÓN · SEGUIDORES'; rr(c, RX + 10, y + 9, c.measureText(s).width + 20, 24, 8, 'rgba(255,255,255,.12)'); tx(c, s, RX + 20, y + 26, F(800, 13), '#fff');
    const r = D.redes, tot = ['yt', 'br', 'tt', 'ig'].reduce((a, k) => a + (Number(r[k].seguidores) || 0), 0);
    tx(c, fmt(tot) + ' en total', RX + RW - 12, y + 26, F(800, 12), '#ffd36b', 'right');
    const fichas = [['YouTube', 'YT', '#ff3d3d', r.yt.seguidores, 'España'], ['YouTube', 'BR', '#39d98a', r.br.seguidores, 'Brasil'], ['TikTok', 'TT', '#4ff0e0', r.tt.seguidores, r.tt.likes != null ? fmt(r.tt.likes) + ' ❤' : ''], ['Instagram', 'IG', '#ff6fae', r.ig.seguidores, '']];
    const fw = (RW - 20 - 18) / 4;
    fichas.forEach(([n, et, col, val, sub], i) => {
      const fx = RX + 10 + i * (fw + 6), fy = y + 42;
      rr(c, fx, fy, fw, 84, 10, '#1a1236'); rr(c, fx, fy, fw, 5, [10, 10, 0, 0], col);
      rr(c, fx + 8, fy + 13, 26, 17, 5, col); tx(c, et, fx + 21, fy + 26, F(900, 10), '#14111f', 'center');
      tx(c, n, fx + 39, fy + 26, F(700, 10), '#cfc8ea');
      tx(c, val != null ? corto(val) : '—', fx + fw / 2, fy + 60, F(900, 26), '#fff', 'center');
      tx(c, val != null ? sub : 'sin dato aún', fx + fw / 2, fy + 76, F(600, 10), val != null ? '#b9b1d6' : '#ff9aa6', 'center');
    });
    tx(c, `👁 ${fmt(D.vistas)} visualizaciones   ·   ❤ ${fmt(D.likes)} likes`, RX + RW / 2, y + 148, F(800, 13), '#fff', 'center');
    // camino a cobrar
    const by = y + 162, subs = Number(r.yt.seguidores) || 0;
    tx(c, '💰 Camino a cobrar', RX + 12, by + 10, F(800, 11), '#39d98a');
    tx(c, `${fmt(r.yt.seguidores)} / 500 subs · ${corto(D.vistas90)} / 3 M`, RX + RW - 12, by + 10, F(700, 10.5), '#cfc8ea', 'right');
    rr(c, RX + 12, by + 17, RW - 24, 9, 5, '#1a1236');
    const pr = Math.min(1, Math.min(subs / 500, D.vistas90 / 3e6) * 0.5 + Math.max(subs / 500, D.vistas90 / 3e6) * 0.5);
    const bg = c.createLinearGradient(RX, 0, RX + RW, 0); bg.addColorStop(0, '#39d98a'); bg.addColorStop(1, '#4ff0e0');
    rr(c, RX + 12, by + 17, Math.max(8, (RW - 24) * pr), 9, 5, bg);
  }

  // ---------- personajes ----------
  function personaje(c, st, p, est, t, dt) {
    const a = st.act[p.k], modo = est.modo;
    const dest = modo === 'trabaja' || modo === 'alerta' ? p.mesa : p.relax;
    const dx = dest - a.x, v = st.quieto ? 999 : 0.07 * dt;
    if (Math.abs(dx) > v) { a.x += Math.sign(dx) * v; a.dir = Math.sign(dx); a.anda = true; } else { a.x = dest; a.anda = false; a.dir = modo === 'trabaja' ? -1 : a.dir; }
    const pose = a.anda ? 'relax' : modo === 'trabaja' ? 'trabaja' : modo === 'alerta' ? 'alerta' : 'relax';
    const img = st.img[p.ag + '_' + pose];
    const pie = p.y + 150, alto = 90;
    const bote = st.quieto ? 0 : a.anda ? Math.abs(Math.sin(t / 140)) * 4 : modo === 'trabaja' ? Math.abs(Math.sin(t / 260)) * 2 : Math.sin(t / 800) * 1.2;
    c.beginPath(); c.ellipse(a.x, pie, 24, 6, 0, 0, 7); c.fillStyle = 'rgba(30,15,50,.22)'; c.fill();
    if (img && img.complete && img.naturalWidth) {
      const w = alto * img.naturalWidth / img.naturalHeight;
      c.save(); c.translate(a.x, pie - bote); if (a.dir > 0) c.scale(-1, 1);
      if (modo === 'duerme') c.globalAlpha = 0.75;
      c.drawImage(img, -w / 2, -alto, w, alto); c.restore(); c.globalAlpha = 1;
    }
    a.cabeza = pie - alto - bote;
    if (modo === 'duerme' && !st.quieto) for (let i = 0; i < 3; i++) { const k = ((t / 1200) + i / 3) % 1; c.globalAlpha = 1 - k; tx(c, 'z', a.x + 22 + i * 6 + k * 8, a.cabeza + 14 - k * 26, F(900, 13 + i * 2), '#fff'); c.globalAlpha = 1; }
    if (modo === 'alerta' && Math.floor(t / 300) % 2) { c.beginPath(); c.arc(a.x + 30, a.cabeza + 8, 10, 0, 7); c.fillStyle = '#ff4d5e'; c.fill(); tx(c, '!', a.x + 30, a.cabeza + 13, F(900, 14), '#fff', 'center'); }
  }
  function burbuja(c, st, p, est) {
    const a = st.act[p.k]; if (a.anda || !est.txt) return;
    c.font = F(800, 12); const w = c.measureText(est.txt).width + 18, h = 24;
    const bx = Math.max(RX + 216, Math.min(RX + RW - 8 - w, a.x - w / 2)), by = Math.max(p.y + 38, a.cabeza - h - 8);
    rr(c, bx, by, w, h, 10, modo2col(est.modo));
    c.beginPath(); c.moveTo(a.x - 6, by + h); c.lineTo(a.x, by + h + 7); c.lineTo(a.x + 6, by + h); c.fillStyle = modo2col(est.modo); c.fill();
    tx(c, est.txt, bx + 9, by + 16, F(800, 12), est.modo === 'alerta' ? '#8a1c1c' : '#2b2540');
  }
  const modo2col = (m) => (m === 'alerta' ? '#ffe1e1' : '#ffffff');

  // ---------- montaje ----------
  return {
    W, H,
    mount(el) {
      el.replaceChildren();
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'La Torre Flami: un edificio con una planta por agente, sus personajes y los datos del canal');
      el.append(cv);
      const quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = { cv, D: datos(), act: {}, img: {}, quieto, ult: 0, id: 0 };
      PISOS.forEach((p) => { st.act[p.k] = { x: p.relax, dir: 1, anda: false, cabeza: p.y + 60 }; });
      ['flami', 'rocco', 'manolo', 'caiman'].forEach((n) => ['relax', 'trabaja', 'alerta'].forEach((k) => {
        const im = new Image(); im.onload = () => st.quieto && requestAnimationFrame(st.frame); im.src = ruta(`${n}_${k}`); st.img[`${n}_${k}`] = im;
      }));
      const ctx = cv.getContext('2d');
      const frame = (t) => {
        const dpr = Math.min(2, window.devicePixelRatio || 1), cw = el.clientWidth || W, sc = cw / W;
        if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * H / W * dpr); }
        const dt = Math.min(60, t - (st.ult || t)); st.ult = t;
        ctx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
        const D = st.D;
        exterior(ctx, t, D);
        estructura(ctx);
        PISOS.forEach((p) => {
          const est = D.est[p.k] || { modo: 'relax' }, modo = est.modo;
          sala(ctx, p, modo, t);
          if (p.k === 'analista') { analisis(ctx, p, D, t); sofa(ctx, p.relax, p.y, '#8e5bd8'); }
          if (p.k === 'guionista') { guiones(ctx, p, D, t, modo); sofa(ctx, p.relax, p.y, '#14a8a0'); }
          if (p.k === 'fabrica') { plato(ctx, p, D, t, modo); }
          if (p.k === 'publicador') { publicacion(ctx, p, D, t); sofa(ctx, p.relax, p.y, '#3d7be0'); }
          personaje(ctx, st, p, est, t, dt);
          if (p.k !== 'fabrica') { mesa(ctx, p.mesa, p.y); if (p.k === 'publicador') movilesMesa(ctx, p, t); else portatil(ctx, p.mesa - 4, p.y, modo === 'trabaja'); }
          else { rr(ctx, p.mesa - 48, p.y + 132, 96, 6, 3, '#5a3d7a'); }
          placa(ctx, p, modo);
          burbuja(ctx, st, p, est);
          forjado(ctx, p.y + 162);
        });
        recepcion(ctx, D, t);
        ascensor(ctx, t, st.quieto);
        calle(ctx, t, dt);
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
