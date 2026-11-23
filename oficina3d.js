// Oficina Flami en 3D (three.js): la misma planta de oficinas, con luces, sombras y cámara libre.
// Reutiliza los datos y las pantallas de oficina.js (window.tcOfi). Si no hay WebGL se usa la versión 2D.
window.tcOfi3d = (() => {
  const B = () => window.tcOfi;
  const R = (p, s) => `${p} ${s}px Fredoka, "Baloo 2", "Trebuchet MS", system-ui, sans-serif`;
  const SPR = window.TC_SPR || {};
  const ruta = (n) => SPR[n] || `spr/${n}.png`;
  const hayWebGL = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } };

  // ---------- ayudas de construcción ----------
  function crear(THREE, escena) {
    const mats = {};
    const mat = (col, extra = {}) => { const k = col + JSON.stringify(extra); if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, metalness: 0.05, ...extra }); return mats[k]; };
    const caja = (x, y, z, w, h, d, col, extra, sombra = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col, extra));
      m.position.set(x + w / 2, y + h / 2, z + d / 2); m.castShadow = sombra; m.receiveShadow = true; escena.add(m); return m;
    };
    const cil = (x, y, z, r1, r2, h, col, seg = 16, extra) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat(col, extra));
      m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; escena.add(m); return m;
    };
    const esfera = (x, y, z, r, col, extra) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(col, extra)); m.position.set(x, y, z); m.castShadow = true; escena.add(m); return m; };
    return { mat, caja, cil, esfera };
  }
  function lienzo(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  return {
    disponible: () => !!window.THREE && hayWebGL(),
    mount(el) {
      const THREE = window.THREE;
      el.replaceChildren();
      const st = { D: B().datos(), act: {}, tex: {}, pantallas: [], enlaces: [], parpadeo: [], quieto: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) };
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.82;
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.setAttribute('aria-label', 'Oficina 3D de GTA 6 Clips Daily: fábrica de clips, tres publicadores, cine, PC y seguidores con sus personajes y pantallas de datos');
      el.append(renderer.domElement);
      const escena = new THREE.Scene();
      escena.fog = new THREE.Fog(0x2a2140, 60, 110);
      const camara = new THREE.PerspectiveCamera(32, 1, 0.5, 300);
      const ctrl = new THREE.OrbitControls(camara, renderer.domElement);
      ctrl.enableDamping = true; ctrl.dampingFactor = 0.08; ctrl.minDistance = 8; ctrl.maxDistance = 80;
      ctrl.minPolarAngle = 0.35; ctrl.maxPolarAngle = 1.25; ctrl.screenSpacePanning = false;
      const { mat, caja, cil, esfera } = crear(THREE, escena);
      const GX = 28, GY = 29, ALTO = 4.4;

      // ---------- luces ----------
      escena.add(new THREE.HemisphereLight(0xfff1ff, 0x5b4378, 0.5));
      const sol = new THREE.DirectionalLight(0xfff3e0, 0.85);
      sol.position.set(36, 40, 30); sol.target.position.set(14, 0, 14); sol.castShadow = true;
      sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 110 }); sol.shadow.bias = -0.0006;
      escena.add(sol, sol.target);
      [[3.5, 3.5, 0xffb37a], [10.5, 3.5, 0x8fc4ff], [17.5, 3.5, 0xc68cff], [24.5, 3.5, 0x9fe8ff], [3.5, 11.5, 0xd3a6ff], [3.5, 18.5, 0x8ff0c0], [3.5, 25.5, 0xffd36b], [17, 17, 0xff6fae]].forEach(([x, z, col]) => {
        const l = new THREE.PointLight(col, 0.55, 12, 2); l.position.set(x, 2.9, z); escena.add(l);
      });

      // ---------- suelo, pasillo y salas ----------
      caja(0, -0.3, 0, GX, 0.3, GY, '#5b4378', {}, false);
      const tablero = lienzo(512, 512), tc = tablero.getContext('2d');
      for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { tc.fillStyle = (i + j) % 2 ? '#efe4f6' : '#f8f0fc'; tc.fillRect(i * 32, j * 32, 32, 32); }
      const tTab = new THREE.CanvasTexture(tablero); tTab.wrapS = tTab.wrapT = THREE.RepeatWrapping; tTab.repeat.set(GX / 4, GY / 4); tTab.encoding = THREE.sRGBEncoding;
      const suelo = new THREE.Mesh(new THREE.PlaneGeometry(GX, GY), new THREE.MeshStandardMaterial({ map: tTab, roughness: 0.6 }));
      suelo.rotation.x = -Math.PI / 2; suelo.position.set(GX / 2, 0.001, GY / 2); suelo.receiveShadow = true; escena.add(suelo);
      caja(0, 0, 7, GX, 0.02, 1, '#b49ad6', {}, false); caja(7, 0, 8, 1, 0.02, GY - 8, '#b49ad6', {}, false);
      caja(13.6, 0, 8, 0.8, 0.025, GY - 8, '#ff9ac4', {}, false); caja(8, 0, 18.1, GX - 8, 0.025, 0.8, '#ff9ac4', {}, false);
      const SALAS = B().SALAS;
      Object.values(SALAS).forEach((s) => caja(s.x, 0, s.y, s.w, 0.04, s.d, s.suelo, { roughness: 0.55 }, false));

      // ---------- paredes con zócalo ----------
      caja(0, 0, -0.2, GX, ALTO, 0.2, '#efe6f8'); caja(-0.2, 0, -0.2, 0.2, ALTO, GY + 0.2, '#e2d6f2');
      caja(0, 0, -0.02, GX, 0.18, 0.04, '#7a5d9a', {}, false); caja(-0.02, 0, 0, 0.04, 0.18, GY, '#6a4f88', {}, false);
      caja(0, ALTO, -0.25, GX, 0.18, 0.3, '#4b3a6b'); caja(-0.25, ALTO, -0.25, 0.3, 0.18, GY + 0.25, '#3f3060');
      // tira de neón rosa en lo alto de las paredes
      caja(0, ALTO - 0.12, 0.01, GX, 0.05, 0.03, '#ff6fae', { emissive: '#ff4fa3', emissiveIntensity: 1.4 }, false);
      caja(0.01, ALTO - 0.12, 0, 0.03, 0.05, GY, '#ff6fae', { emissive: '#ff4fa3', emissiveIntensity: 1.4 }, false);
      // tabiques bajos con puertas y cristal
      const vidrio = { transparent: true, opacity: 0.18, roughness: 0.1, metalness: 0.2, color: '#cfe8ff' };
      const tabique = (x, z, w, d) => { caja(x, 0, z, w, 0.9, d, '#e8def6'); caja(x, 0.9, z, w, 0.05, d, '#8a6db0', {}, false); const g = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, d), new THREE.MeshStandardMaterial(vidrio)); g.position.set(x + w / 2, 1.65, z + d / 2); escena.add(g); };
      for (let k = 0; k < 4; k++) { tabique(k * 7, 6.93, 2.8, 0.14); tabique(k * 7 + 4.2, 6.93, 2.8, 0.14); }
      [7, 14, 21].forEach((x) => tabique(x - 0.07, 0, 0.14, 7));
      [8, 15, 22].forEach((z) => tabique(0, z - 0.07, 7, 0.14));
      for (let k = 0; k < 3; k++) { const z0 = 8 + k * 7; tabique(6.93, z0, 0.14, 2.8); tabique(6.93, z0 + 4.2, 0.14, 2.8); }

      // ---------- pantallas de pared (texturas dibujadas con el mismo código que la versión 2D) ----------
      const P3 = B().paredes3d, ESC = 3;
      const pantalla = (clave, fn, w, h, x, z, girada) => {
        const c = lienzo(Math.round((w + 20) * ESC), Math.round((h + 20) * ESC)), ctx = c.getContext('2d');
        const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
        const ancho = 4.6, alto = ancho * (h + 20) / (w + 20);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
        if (girada) { m.rotation.y = Math.PI / 2; m.position.set(0.06, 1.15 + alto / 2, z); } else m.position.set(x, 1.15 + alto / 2, 0.06);
        escena.add(m);
        const p = { clave, fn, w, h, c, ctx, tex, mesh: m, enlaces: [] };
        st.pantallas.push(p); return p;
      };
      const pintar = (p, t) => {
        const { ctx, c } = p; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
        ctx.setTransform(ESC, 0, 0, ESC, 10 * ESC, 10 * ESC);
        const falso = { enlaces: [] };
        try { p.fn(ctx, st.D, t, p.clave === 'plato' ? (st.D.est.fabrica || {}).modo : falso); } catch (e) { /* una pantalla rota no tumba la oficina */ }
        if (p.clave === 'cine') p.enlaces = falso.enlaces;
        p.tex.needsUpdate = true;
      };
      const S = SALAS;
      pantalla('analisis', P3.analisis, 196, 128, 3.5, 0, false);
      pantalla('guiones', (c, D) => P3.guiones(c, D), 196, 128, 10.5, 0, false);
      pantalla('cine', P3.cine, 208, 132, 17.5, 0, false);
      pantalla('pc', P3.pc, 196, 128, 24.5, 0, false);
      pantalla('top', P3.top, 196, 128, 0, 3.5, true);
      pantalla('plato', P3.plato, 196, 128, 0, S.plato.y + 3.5, true);
      pantalla('publicacion', P3.publicacion, 196, 128, 0, S.publicacion.y + 3.5, true);
      pantalla('seguidores', P3.seguidores, 196, 150, 0, S.seguidores.y + 3.5, true);

      // ---------- carteles de cada sala y neón del tejado ----------
      const cartel = (texto, sub, w = 600, h = 150) => {
        const c = lienzo(w, h), x = c.getContext('2d');
        x.fillStyle = '#ff6fae'; x.beginPath(); x.roundRect(0, 0, w, h, 40); x.fill();
        x.fillStyle = '#2a2140'; x.beginPath(); x.roundRect(8, 8, w - 16, h - 16, 34); x.fill();
        x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = R(700, 56); x.fillText(texto, w / 2, 72);
        x.fillStyle = '#ffc7e0'; x.font = R(500, 34); x.fillText(sub, w / 2, 118);
        const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false }));
        sp.scale.set(5, 5 * h / w, 1); sp.renderOrder = 10; escena.add(sp); return sp;
      };
      Object.values(SALAS).forEach((s) => { const sp = cartel(s.n, s.sub); if (s.muro === 'fondo') sp.position.set(s.x + 3.5, ALTO + 0.9, 0.3); else sp.position.set(0.3, ALTO + 0.9, s.y + 3.5); });
      const neonC = lienzo(1080, 300), neonT = new THREE.CanvasTexture(neonC); neonT.encoding = THREE.sRGBEncoding;
      const neon = new THREE.Mesh(new THREE.PlaneGeometry(10, 10 * 300 / 1080), new THREE.MeshBasicMaterial({ map: neonT, transparent: true, toneMapped: false }));
      neon.position.set(14, ALTO + 2.6, -0.1); escena.add(neon);
      cil(10.5, ALTO + 0.2, -0.1, 0.06, 0.06, 1.2, '#2a2140'); cil(17.5, ALTO + 0.2, -0.1, 0.06, 0.06, 1.2, '#2a2140');
      const pintarNeon = (t) => { const x = neonC.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1080, 300); x.setTransform(3, 0, 0, 3, 0, 0); P3.neon(x, t); neonT.needsUpdate = true; };

      // ---------- muebles ----------
      const mesa = (x, z, encendida) => { caja(x, 0.72, z, 1.8, 0.07, 0.9, '#ffffff'); [[0.05, 0.05], [1.68, 0.05], [0.05, 0.78], [1.68, 0.78]].forEach(([a, b]) => caja(x + a, 0, z + b, 0.07, 0.72, 0.07, '#c9c2dd')); caja(x + 0.6, 0.79, z + 0.15, 0.7, 0.45, 0.06, '#2d2a3a'); const s = caja(x + 0.65, 0.84, z + 0.2, 0.6, 0.36, 0.02, encendida ? '#7df9c8' : '#3b3850', { emissive: '#7df9c8', emissiveIntensity: 0 }, false); return s; };
      const sillon = (x, z, col) => { caja(x - 0.45, 0, z - 0.45, 0.9, 0.42, 0.8, col); caja(x - 0.45, 0.42, z - 0.55, 0.9, 0.55, 0.2, col); caja(x - 0.6, 0, z - 0.45, 0.16, 0.6, 0.8, col); caja(x + 0.44, 0, z - 0.45, 0.16, 0.6, 0.8, col); };
      const planta = (x, z, s = 1) => { cil(x, 0, z, 0.22 * s, 0.17 * s, 0.4 * s, '#c0703c'); esfera(x, 0.7 * s, z, 0.32 * s, '#3f9e5b'); esfera(x + 0.12 * s, 0.98 * s, z - 0.05 * s, 0.24 * s, '#56b873'); };
      const palmera = (x, z) => {
        cil(x, 0, z, 0.38, 0.32, 0.5, '#d48a52');
        const tronco = cil(x, 0.5, z, 0.09, 0.14, 2.6, '#8a5a35', 10); tronco.rotation.z = 0.06;
        for (let k = 0; k < 7; k++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 6), mat(k % 2 ? '#2f9e5b' : '#3fb86b')); h.scale.set(1, 0.12, 0.32); const a = k / 7 * Math.PI * 2; h.position.set(x + Math.cos(a) * 0.75 + 0.15, 3.05, z + Math.sin(a) * 0.75); h.rotation.y = -a; h.rotation.z = -0.35; h.castShadow = true; escena.add(h); }
      };
      const AG = B().AG;
      Object.values(AG).forEach((g, i) => sillon(g.sofa[0], g.sofa[1] - 0.05, ['#8e5bd8', '#14a8a0', '#ff8fb8', '#3d7be0'][i]));
      const monAn = mesa(3.0, 3.0), monGu = mesa(10.0, 3.0);
      caja(5.3, 0, 0.3, 1.3, 2.2, 0.5, '#a8794f'); ['#e0507f', '#3d7be0', '#ffd36b', '#2fbf71', '#8e5bd8', '#ff9f43'].forEach((c, i) => caja(5.4 + (i % 3) * 0.4, 0.7 + Math.floor(i / 3) * 0.75, 0.35, 0.3, 0.4, 0.38, c));
      for (let i = 0; i < 6; i++) caja(11.9, 0.79 + i * 0.05, 3.15, 0.45, 0.04, 0.55, i % 2 ? '#fffdf0' : '#f1ecd9', {}, false);
      planta(0.7, 0.8); planta(13.3, 0.8); planta(7.7, 0.8, 0.8); planta(27.3, 6.3); planta(0.8, 28.3); planta(6.3, 28.3); planta(26.8, 14); planta(9, 14);
      // cine: butacas rojas
      for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) { const x = 15.2 + i * 1.3, z = 3.0 + f * 1.3; caja(x, 0, z, 0.8, 0.45, 0.7, '#c8324a'); caja(x, 0.45, z + 0.55, 0.8, 0.55, 0.15, '#a82a40'); }
      // sala del PC: armarios con luces y el PC
      [4.0, 5.3].forEach((z) => { caja(26.9, 0, z, 0.9, 1.9, 0.9, '#2a2738'); for (let i = 0; i < 6; i++) { const l = caja(26.86, 0.3 + i * 0.26, z + 0.2, 0.04, 0.05, 0.12, '#4a4660', { emissive: '#7df9c8', emissiveIntensity: 0 }, false); st.parpadeo.push({ l, i }); } });
      const monPC = mesa(22.2, 4.2); caja(23.4, 0.79, 4.35, 0.55, 0.9, 0.7, '#1d1b28');
      const boton = esfera(23.95, 1.45, 5.06, 0.07, '#ff5d70', { emissive: '#ff5d70', emissiveIntensity: 1.2 });
      // plató: escenario, focos y cámara
      caja(0.6, 0, 9.2, 2.6, 0.12, 4.4, '#5a3d7a');
      [[1.2, 8.7], [4.6, 14.2]].forEach(([x, z]) => { cil(x, 0, z, 0.04, 0.04, 2.3, '#2a2140', 8); const f = caja(x - 0.2, 2.3, z - 0.15, 0.4, 0.28, 0.3, '#2a2140'); f.lookAt(2.3, 0, 11.4); const l = new THREE.SpotLight(0xfff3b0, 0.9, 9, 0.5, 0.6); l.position.set(x, 2.4, z); l.target.position.set(2.3, 0, 11.4); escena.add(l, l.target); });
      cil(5.2, 0, 11.8, 0.04, 0.04, 1.3, '#2a2140', 8); caja(4.95, 1.3, 11.6, 0.5, 0.35, 0.4, '#1d1b28'); cil(5.0, 1.45, 11.35, 0.12, 0.12, 0.2, '#1d1b28').rotation.x = Math.PI / 2;
      const piloto = esfera(5.4, 1.58, 11.62, 0.04, '#ff3b3b', { emissive: '#ff3b3b', emissiveIntensity: 0 });
      // publicación: tres móviles y cajas de vídeos listos
      mesa(2.0, 18.1, false); [['#e8333f', 2.15], ['#16151c', 2.65], ['#c13584', 3.15]].forEach(([c, x]) => caja(x, 0.79, 18.25, 0.32, 0.55, 0.06, c));
      const cajas = []; for (let i = 0; i < 9; i++) cajas.push(caja(0.6 + (i % 3) * 0.62, Math.floor(i / 3) * 0.5, 20.6, 0.55, 0.48, 0.55, '#d0a066'));
      // seguidores: sofá y vitrina con el botón de YouTube
      caja(2.5, 0, 26.2, 3.0, 0.42, 0.9, '#ffb347'); caja(2.5, 0.42, 26.1, 3.0, 0.55, 0.25, '#f29a2e');
      caja(5.3, 0, 22.9, 1.0, 1.0, 0.8, '#2a2140'); caja(5.45, 1.0, 23.1, 0.7, 0.55, 0.06, '#d9d9e3', { metalness: 0.6, roughness: 0.3 });
      // plaza: sofá, futbolín, recreativas, cafetera, pufs, fuente y coche del mes
      caja(11.6, 0, 9.2, 3.2, 0.42, 1.0, '#8e5bd8'); caja(11.6, 0.42, 9.1, 3.2, 0.6, 0.3, '#7a4bc4');
      caja(16.4, 0.6, 12.7, 2.2, 0.3, 1.1, '#2fbf71'); [[16.5, 12.8], [18.45, 12.8], [16.5, 13.65], [18.45, 13.65]].forEach(([x, z]) => caja(x, 0, z, 0.1, 0.6, 0.1, '#1f7a4a'));
      const pelota = esfera(17.5, 0.95, 13.25, 0.06, '#ffffff');
      [[21.0, '#3d7be0'], [22.3, '#ff6fae']].forEach(([x, c]) => { caja(x, 0, 9.4, 0.9, 1.9, 0.8, c); st.parpadeo.push({ l: caja(x + 0.1, 1.2, 10.2, 0.7, 0.5, 0.02, '#ffd36b', { emissive: '#ffd36b', emissiveIntensity: 0.9 }, false), arcade: true }); });
      caja(24.0, 0, 9.3, 0.7, 1.1, 0.6, '#5a5560');
      Object.values(AG).forEach((g, i) => { const p = esfera(g.chill[0], 0.25, g.chill[1], 0.5, ['#ffd36b', '#4ff0e0', '#ff6fae', '#b18cff'][i]); p.scale.set(1, 0.55, 1); });
      cil(14, 0, 22, 2.6, 2.8, 0.45, '#c9bfe0', 32); const agua = cil(14, 0.3, 22, 2.4, 2.4, 0.18, '#5fd3e8', 32, { emissive: '#2aa6c0', emissiveIntensity: 0.25, roughness: 0.15 });
      cil(14, 0.45, 22, 0.35, 0.4, 0.9, '#d9d2ea');
      const coche = new THREE.Group(); escena.add(coche); coche.position.set(21.5, 0, 21.5);
      cil(21.5, 0, 21.5, 2.9, 3.0, 0.15, '#2a2140', 40);
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 1.5), mat('#ff4fa3', { metalness: 0.5, roughness: 0.3 })); cuerpo.position.y = 0.6; cuerpo.castShadow = true; coche.add(cuerpo);
      const cabina = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 1.3), mat('#ffe0f0', { transparent: true, opacity: 0.85 })); cabina.position.set(-0.2, 1.05, 0); coche.add(cabina);
      [[-1.1, 0.75], [1.1, 0.75], [-1.1, -0.75], [1.1, -0.75]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.25, 16), mat('#14111f')); r.rotation.x = Math.PI / 2; r.position.set(x, 0.35, z); coche.add(r); });
      [[1.72, 0.45], [1.72, -0.45]].forEach(([x, z]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.3), mat('#fff6b0', { emissive: '#fff6b0', emissiveIntensity: 1.5 })); f.position.set(x, 0.65, z); coche.add(f); });
      coche.position.y = 0.15;
      palmera(9.2, 27.6); palmera(27, 27.6); palmera(10.5, 16.6); palmera(25.5, 16.6);

      // ---------- personajes como recortables en 3D (siempre mirando a la cámara) ----------
      const cargador = new THREE.TextureLoader();
      ['flami', 'rocco', 'manolo', 'caiman'].forEach((n) => ['relax', 'trabaja', 'alerta'].forEach((k) => { const t = cargador.load(ruta(`${n}_${k}`)); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; st.tex[`${n}_${k}`] = t; }));
      const texto = (w, h) => { const c = lienzo(w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); sp.renderOrder = 20; escena.add(sp); return { c, t, sp }; };
      const NOMBRES = B().NOMBRES, MODO = B().MODO;
      Object.entries(AG).forEach(([k, g]) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: st.tex[g.p + '_relax'], transparent: true, alphaTest: 0.3 }));
        sp.center.set(0.5, 0); escena.add(sp);
        const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: 0x281440, transparent: true, opacity: 0.25 }));
        sombra.rotation.x = -Math.PI / 2; escena.add(sombra);
        st.act[k] = { x: g.sofa[0], y: g.sofa[1], dir: 1, ruta: [], dest: null, sp, sombra, bur: texto(1024, 160), chapa: texto(640, 96), ultTxt: '' };
      });
      const dibujaBurbuja = (a, est) => {
        const { c, t, sp } = a.bur, x = c.getContext('2d'), txt = est.txt || '';
        const clave = txt + est.modo; if (a.ultTxt === clave) return; a.ultTxt = clave;
        x.clearRect(0, 0, c.width, c.height); x.font = R(600, 54); const w = Math.min(c.width - 20, x.measureText(txt).width + 120), x0 = (c.width - w) / 2;
        x.fillStyle = est.modo === 'alerta' ? '#ffe3e6' : '#ffffff'; x.beginPath(); x.roundRect(x0, 10, w, 110, 55); x.fill();
        x.beginPath(); x.moveTo(c.width / 2 - 20, 118); x.lineTo(c.width / 2, 150); x.lineTo(c.width / 2 + 20, 118); x.fill();
        x.fillStyle = MODO[est.modo] || MODO.relax; x.beginPath(); x.arc(x0 + 55, 65, 16, 0, 7); x.fill();
        x.fillStyle = est.modo === 'alerta' ? '#9a1c2c' : '#3a2f55'; x.fillText(txt, x0 + 85, 84); t.needsUpdate = true;
        sp.scale.set(5.2, 5.2 * 160 / 1024, 1);
        const ch = a.chapa, y = ch.c.getContext('2d'); y.clearRect(0, 0, 640, 96); y.font = R(600, 44); const n = NOMBRES[Object.keys(st.act).find((q) => st.act[q] === a)] || '';
        const wn = Math.min(630, y.measureText(n).width + 90), xn = (640 - wn) / 2;
        y.fillStyle = 'rgba(42,33,64,.92)'; y.beginPath(); y.roundRect(xn, 8, wn, 80, 40); y.fill();
        y.fillStyle = MODO[est.modo] || MODO.relax; y.beginPath(); y.arc(xn + 40, 48, 13, 0, 7); y.fill();
        y.fillStyle = '#fff'; y.fillText(n, xn + 64, 64); ch.t.needsUpdate = true; ch.sp.scale.set(3.2, 3.2 * 96 / 640, 1);
      };
      const salaDe = (x, y) => Object.entries(SALAS).find(([, s]) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.d);
      const camino = (a, dest, propia) => {
        const aqui = salaDe(a.x, a.y), alla = salaDe(dest[0], dest[1]), pu = B().puerta(SALAS[propia]); const r = [];
        if (aqui && (!alla || alla[0] !== aqui[0])) r.push(pu.dentro, pu.fuera);
        if (alla && (!aqui || alla[0] !== aqui[0])) r.push(pu.fuera, pu.dentro);
        r.push(dest); a.ruta = r; a.dest = dest;
      };

      // ---------- cámara: vista general y visitas a cada sala ----------
      const VISTAS = { general: { t: [13, 0, 14], p: [46, 38, 46] } };
      Object.entries(SALAS).forEach(([k, s]) => { VISTAS[k] = s.muro === 'fondo' ? { t: [s.x + 3.5, 2.0, 2.4], p: [s.x + 4.5, 7.2, 15.5] } : { t: [2.4, 2.0, s.y + 3.5], p: [15.5, 7.2, s.y + 4.5] }; });
      const ir = (k) => { const v = VISTAS[k] || VISTAS.general; st.viaje = { t0: performance.now(), deT: ctrl.target.clone(), deP: camara.position.clone(), aT: new THREE.Vector3(...v.t), aP: new THREE.Vector3(...v.p) }; };
      st.ir = ir;
      camara.position.set(...VISTAS.general.p); ctrl.target.set(...VISTAS.general.t); ctrl.update();
      if ((el.clientWidth || 400) < 700) { camara.position.set(30, 26, 34); ctrl.target.set(12, 0, 12); }

      // botones y pista
      const barra = document.createElement('div'); barra.className = 'tc-salas';
      [['general', '🏢 Todo'], ['pc', '🔌 PC'], ['seguidores', '👥 Seguidores'], ['cine', '🎬 Vídeos'], ['plato', '✂️ Fábrica'], ['guiones', '🚀 Rocco 16:23'], ['publicacion', '🚀 Manolo 19:23'], ['analisis', '🚀 Caimán 22:23']].forEach(([k, n]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.onclick = () => ir(k); barra.append(b); });
      const pista = document.createElement('div'); pista.className = 'tc-pista'; pista.textContent = 'Gira con un dedo · pellizca para acercarte · toca una sala para visitarla';
      el.append(pista, barra); setTimeout(() => pista.classList.add('fuera'), 5000);

      // toques: un vídeo del cine lo abre; una sala, viaja a ella
      const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let abajo = null;
      renderer.domElement.addEventListener('pointerdown', (e) => { abajo = { x: e.clientX, y: e.clientY, t: Date.now() }; st.viaje = null; });
      renderer.domElement.addEventListener('pointerup', (e) => {
        if (!abajo || Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) > 8 || Date.now() - abajo.t > 500) return;
        const b = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
        ray.setFromCamera(ptr, camara);
        const cine = st.pantallas.find((p) => p.clave === 'cine'), hit = ray.intersectObject(cine.mesh)[0];
        if (hit && hit.uv) {
          const px = hit.uv.x * cine.c.width, py = (1 - hit.uv.y) * cine.c.height;
          const dentro = (pol) => { let r = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [xi, yi] = pol[i], [xj, yj] = pol[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) r = !r; } return r; };
          const l = cine.enlaces.find((q) => dentro(q.poli)); if (l) { window.open(l.url, '_blank', 'noopener'); return; }
        }
        const s = ray.intersectObject(suelo)[0];
        if (s) { const e2 = salaDe(s.point.x, s.point.z); if (e2) ir(e2[0]); }
      });

      // ---------- bucle ----------
      let ult = 0, ultPantallas = -1e9;
      const frame = (t) => {
        const cw = el.clientWidth, ch = el.clientHeight;
        if (renderer.domElement.width !== Math.round(cw * renderer.getPixelRatio()) || renderer.domElement.height !== Math.round(ch * renderer.getPixelRatio())) { renderer.setSize(cw, ch, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; camara.aspect = cw / Math.max(1, ch); camara.updateProjectionMatrix(); }
        const dt = Math.min(60, t - (ult || t)); ult = t;
        const D = st.D, modos = {}; Object.keys(AG).forEach((k) => { modos[k] = (D.est[k] || {}).modo || 'relax'; });
        if (st.viaje) { const v = st.viaje, k = Math.min(1, (t - v.t0) / 900), e = 1 - Math.pow(1 - k, 3); ctrl.target.lerpVectors(v.deT, v.aT, e); camara.position.lerpVectors(v.deP, v.aP, e); if (k >= 1) st.viaje = null; }
        if (t - ultPantallas > 1000) { st.pantallas.forEach((p) => pintar(p, t)); ultPantallas = t; }
        pintarNeon(t);
        Object.entries(AG).forEach(([k, g]) => {
          const a = st.act[k], m = modos[k], dest = m === 'trabaja' || m === 'alerta' ? g.mesa : m === 'duerme' ? g.chill : g.sofa;
          if (a.dest !== dest) camino(a, dest, g.sala);
          if (a.ruta.length) {
            if (st.quieto) { [a.x, a.y] = a.ruta[a.ruta.length - 1]; a.ruta = []; }
            else { const [x2, y2] = a.ruta[0], dx = x2 - a.x, dy = y2 - a.y, dist = Math.hypot(dx, dy), v = 0.0021 * dt; if (dist <= v) { a.x = x2; a.y = y2; a.ruta.shift(); } else { a.x += dx / dist * v; a.y += dy / dist * v; a.dir = (dx - dy) >= 0 ? 1 : -1; } }
          }
          const anda = a.ruta.length > 0, pose = anda ? 'relax' : m === 'trabaja' ? 'trabaja' : m === 'alerta' ? 'alerta' : 'relax';
          const tex = st.tex[g.p + '_' + pose]; if (a.sp.material.map !== tex) { a.sp.material.map = tex; a.sp.material.needsUpdate = true; }
          const img = tex.image, alto = 2.6, ancho = img && img.width ? alto * img.width / img.height : 1.4;
          const bote = st.quieto ? 0 : anda ? Math.abs(Math.sin(t / 130)) * 0.08 : m === 'trabaja' ? Math.abs(Math.sin(t / 260)) * 0.04 : Math.sin(t / 800) * 0.02;
          a.sp.scale.set(ancho * (a.dir > 0 ? -1 : 1), alto, 1); a.sp.position.set(a.x, bote, a.y);
          a.sp.material.opacity = m === 'duerme' && !anda ? 0.85 : 1; a.sp.material.transparent = true;
          a.sombra.position.set(a.x, 0.05, a.y);
          dibujaBurbuja(a, D.est[k] || {});
          a.bur.sp.visible = !anda; a.bur.sp.position.set(a.x, alto + 0.85, a.y);
          a.chapa.sp.position.set(a.x, alto + 0.25, a.y);
        });
        const on = D.pce === 'Trabajando';
        st.parpadeo.forEach((p, i) => { p.l.material.emissiveIntensity = p.arcade ? 0.6 + 0.4 * Math.sin(t / 300 + i) : on && Math.floor(t / 170 + p.i * 1.7 + i) % 3 ? 1.6 : 0; });
        boton.material.color.set(on ? '#7df9c8' : '#ff5d70'); boton.material.emissive.set(on ? '#7df9c8' : '#ff5d70');
        [monAn, monGu, monPC].forEach((mon, i) => { const enc = i === 2 ? on : modos[i ? 'guionista' : 'analista'] === 'trabaja'; mon.material.emissiveIntensity = enc ? 0.9 : 0; });
        piloto.material.emissiveIntensity = modos.fabrica === 'trabaja' && Math.floor(t / 600) % 2 ? 2 : 0;
        cajas.forEach((c, i) => { c.visible = i < Math.min(9, D.listos); });
        if (!st.quieto) { coche.rotation.y = t / 3000; pelota.position.x = 17.5 + Math.sin(t / 500) * 0.8; agua.material.emissiveIntensity = 0.2 + 0.1 * Math.sin(t / 700); }
        ctrl.update();
        renderer.render(escena, camara);
        st.id = requestAnimationFrame(frame);
      };
      st.frame = frame; st.renderer = renderer; st.ctrl = ctrl;
      st.id = requestAnimationFrame(frame);
      return st;
    },
    update(el, st) { st.D = B().datos(); },
    unmount(el, st) { if (st) { cancelAnimationFrame(st.id); st.renderer && st.renderer.dispose(); } }
  };
})();
