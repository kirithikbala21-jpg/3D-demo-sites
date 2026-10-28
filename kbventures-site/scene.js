// KB Ventures hero object: a thin card of deep black anodised metal under glass, with a hairline polished edge, a fine
// champagne line around it and the KB Ventures logo (img/kb-wordmark.svg, unchanged) set into the face with a soft
// pressed-in shadow. Lit by one large soft box above-left and a gentle rim, at low exposure, so the edge catches the
// light on one side only and the face carries a soft clearcoat sheen instead of hard highlights. It floats with a
// slow, small drift, leans a few degrees toward the pointer or the phone's tilt, and a wide, faint reflection crosses
// the face now and then. A soft contact shadow and a very faint mirror image sit beneath it. Three.js r160.
import * as THREE from 'three';

const W = 3.2, H = 2.02, D = 0.028;  // a real card's proportions (85.6 x 54 mm), very thin
const R = W * 0.045;                 // corner radius: 4.5% of the width
const BEVEL = 0.009;                 // hairline polished edge (about 1 to 2px at the hero's size)
const LOGO = new URL('./img/kb-wordmark.svg', import.meta.url);
// the logo file draws its artwork inside a 360 x 120 canvas at x 114-246, y 21-110
const ART = { x: 114, y: 21, w: 132, h: 89 };

function roundedShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** A seeded random so the grain (and so the still image) is the same on every load. */
function rand(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }

/** The studio: a dark room with one large soft box above-left, a gentle rim behind on the right and a faint floor bounce. */
function studioEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x020304);
  const panel = (w, h, intensity, pos, rot, tint = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); room.add(m);
  };
  panel(10, 5, 3.2, [-4, 8, 5], [-1.0, -0.35, 0], 0xf1f3f8);           // the large soft box overhead-left: the edge's highlight
  panel(9, 6, 1.7, [-5, 7, 7], [-0.75, -0.45, 0], 0xeef1f7);          // its softer front half: the face's sheen, lighter top-left
  panel(1.4, 8, 0.9, [7, 2, -4], [0, -Math.PI / 3.2, 0], 0xc9d3ea);     // a gentle rim behind on the right
  panel(18, 18, 0.035, [0, -6, 0], [-Math.PI / 2, 0, 0], 0x8a93a8);     // floor bounce, so the dark side is not dead black
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(room, 0.04).texture;                     // blurred a little more: soft reflections
  pmrem.dispose();
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return tex;
}

/** The logo as an image. Its <svg> has no width or height, so they are added (some browsers won't draw it otherwise). */
async function loadLogo() {
  const svg = await (await fetch(LOGO)).text();
  const sized = svg.replace('<svg ', '<svg width="1080" height="360" ');
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

/** The logo set into the glass: a soft shadow below-right, a faint lit lip above-left, then the logo itself. */
function logoTexture(img) {
  const s = 7.6, pad = 40;                                  // artwork about 1000px wide, with room for the shadow
  const w = Math.round(ART.w * s) + pad * 2, h = Math.round(ART.h * s) + pad * 2;
  const art = document.createElement('canvas'); art.width = w; art.height = h;
  const a = art.getContext('2d');
  a.drawImage(img, pad - ART.x * s, pad - ART.y * s, 360 * s, 120 * s);
  const silhouette = (color) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(art, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, w, h);
    return c;
  };
  return canvasTexture(w, h, (g) => {
    g.filter = 'blur(6px)'; g.globalAlpha = 0.85; g.drawImage(silhouette('#000'), 4, 7);          // pressed-in shadow
    g.filter = 'none'; g.globalAlpha = 0.22; g.drawImage(silhouette('#ffffff'), -1.5, -2);        // a faint lit lip
    g.globalAlpha = 1; g.drawImage(art, 0, 0);
  });
}

export async function initScene(canvas, { lowEnd = false, onLost = () => {} } = {}) {
  const logoImg = await loadLogo();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2)); // capped at 2
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;                       // low overall exposure: no bloom, no glow

  const scene = new THREE.Scene();
  const env = studioEnvironment(renderer);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 60);
  const key = new THREE.DirectionalLight(0xf4f6ff, 0.6); key.position.set(-3, 5, 5); scene.add(key);

  const card = new THREE.Group();
  scene.add(card);
  const rnd = rand(11);

  // Face: deep black, slightly lighter top-left falling to darker bottom-right, with very fine brushing and micro-noise
  const face = canvasTexture(1024, 646, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#1b1e25'); grd.addColorStop(0.45, '#0d0f13'); grd.addColorStop(1, '#050608');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.035;
    for (let y = 0; y < h; y++) { const v = 80 + Math.floor(rnd() * 130); g.fillStyle = `rgb(${v},${v},${v + 6})`; g.fillRect(0, y, w, 1); }
    const n = g.getImageData(0, 0, w, h), d = n.data;       // micro-noise, so the face is never one flat colour
    for (let i = 0; i < d.length; i += 4) { const k = (rnd() - 0.5) * 7; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
    g.putImageData(n, 0, 0);
  });
  const grain = canvasTexture(1024, 646, (g, w, h) => {
    for (let y = 0; y < h; y++) { const v = 170 + Math.floor(rnd() * 50); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, w, 1); }
  }, false);
  for (const t of [face, grain]) { t.repeat.set(1 / W, 1 / H); t.offset.set(0.5, 0.5); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); }

  // The card body. ExtrudeGeometry gives two material groups: 0 = the flat front and back, 1 = the hairline edge.
  const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(W - BEVEL * 2, H - BEVEL * 2, R - BEVEL), {
    depth: D, bevelEnabled: true, bevelThickness: BEVEL * 0.7, bevelSize: BEVEL, bevelSegments: 5, curveSegments: 28,
  });
  bodyGeo.translate(0, 0, -D / 2);
  const glass = new THREE.MeshPhysicalMaterial({
    map: face, roughnessMap: grain, color: 0xffffff, metalness: 0.5, roughness: 0.55,   // matte anodised metal...
    clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 0.8,                   // ...under a gentle clearcoat
  });
  const edge = new THREE.MeshPhysicalMaterial({
    color: 0xb9bec7, metalness: 1, roughness: 0.18, anisotropy: 0.5, envMapIntensity: 1.3,   // polished: lit along the top-left, dark below
  });
  card.add(new THREE.Mesh(bodyGeo, [glass, edge]));

  // A fine, soft champagne hairline around the edge (low saturation, part see-through)
  const pts = roundedShape(W + 0.001, H + 0.001, R).getSpacedPoints(360).map((p) => new THREE.Vector3(p.x, p.y, 0));
  const goldLine = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 720, 0.0026, 5, true),
    new THREE.MeshPhysicalMaterial({ color: 0xcdbb8f, metalness: 1, roughness: 0.42, envMapIntensity: 0.7, transparent: true, opacity: 0.75, depthWrite: false }),
  );
  goldLine.position.z = D / 2;
  card.add(goldLine);
  const front = D / 2 + BEVEL * 0.7; // z of the face

  // The logo, set into the face: thin silver letters, the gold rule and VENTURES, exactly as in kb-wordmark.svg
  const logoTex = logoTexture(logoImg);
  logoTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const lw = 1.18, lh = lw * logoTex.image.height / logoTex.image.width;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshPhysicalMaterial({
    map: logoTex, transparent: true, depthWrite: false, metalness: 0.55, roughness: 0.3, envMapIntensity: 1,
    emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0.62,   // reads clearly without a bright flat block
  }));
  logo.position.set(-0.02, 0.06, front + 0.0008);
  card.add(logo);

  // A wide, faint clearcoat reflection that crosses the face slowly now and then
  const sweepTex = canvasTexture(2048, 32, (g, w) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    const stops = [[0, 0], [0.3, 0], [0.4, 0.12], [0.47, 0.5], [0.5, 0.62], [0.53, 0.5], [0.6, 0.12], [0.7, 0], [1, 0]];
    for (const [o, a] of stops) grd.addColorStop(o, `rgba(232,236,246,${a})`);
    g.fillStyle = grd; g.fillRect(0, 0, w, 32);
  });
  sweepTex.center.set(0.5, 0.5); sweepTex.rotation = -0.55; sweepTex.repeat.set(0.8, 1);
  const sweepGeo = new THREE.ShapeGeometry(roundedShape(W - BEVEL * 2, H - BEVEL * 2, R - BEVEL), 24);
  { const p = sweepGeo.attributes.position, uv = sweepGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / W + 0.5, p.getY(i) / H + 0.5); }
  const sweep = new THREE.Mesh(sweepGeo, new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sweep.position.z = front + 0.0012;
  card.add(sweep);

  // Beneath: a soft contact shadow and a very faint mirror image fading into the floor
  const FLOOR = -1.45;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.5), new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,.6)'); r.addColorStop(0.5, 'rgba(0,0,0,.22)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }),
    transparent: true, depthWrite: false, toneMapped: false,
  }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = FLOOR;
  scene.add(shadow);
  const mirror = card.clone(true);
  mirror.traverse((o) => { if (o.material) { o.material = Array.isArray(o.material) ? o.material.map((m) => fade(m)) : fade(o.material); } });
  // very faint; the canvas itself also fades out at the bottom (CSS mask)
  function fade(m) { const c = m.clone(); c.transparent = true; c.opacity = (m.opacity ?? 1) * 0.035; c.depthWrite = false; return c; }
  scene.add(mirror);

  // Rest pose: tilted about 14 degrees back and 15 degrees sideways (also the pose of img/hero-object.webp)
  const REST = { x: -0.25, y: -0.26, z: 0.05 };

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const needW = 3.77, needH = 3.29, v = THREE.MathUtils.degToRad(camera.fov);
    const dist = Math.max(needH / 2 / Math.tan(v / 2), needW / 2 / (Math.tan(v / 2) * camera.aspect));
    camera.position.set(0, dist * 0.16, dist); // a little above, looking slightly down
    camera.lookAt(0, -0.32, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const aim = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e) => { aim.tx = (e.clientX / window.innerWidth) * 2 - 1; aim.ty = (e.clientY / window.innerHeight) * 2 - 1; };
  const onTilt = (e) => { if (e.gamma == null) return; aim.tx = Math.max(-1, Math.min(1, e.gamma / 30)); aim.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('deviceorientation', onTilt, { passive: true });

  let visible = true, raf = 0, last = performance.now(), t = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', onVis);

  function pose(lift, rx, ry, rz) {
    card.position.y = lift; card.rotation.set(rx, ry, rz);
    // the mirror image hangs upside down below the floor
    mirror.position.y = 2 * FLOOR - lift; mirror.rotation.set(-rx, ry, -rz); mirror.scale.set(1, -1, 1);
    shadow.material.opacity = 0.75 - lift * 1.5;
  }
  // the card tips back slightly as the page scrolls down
  let scrollTilt = 0;
  const onScrollTilt = () => { scrollTilt = Math.min(1, window.scrollY / Math.max(1, window.innerHeight)); };
  window.addEventListener('scroll', onScrollTilt, { passive: true }); onScrollTilt();
  // heavy and slow: small drift, a few degrees toward the pointer, eased over about a second and a half
  let tilt = 0;
  function frame(dt) {
    t += dt;
    const e = 1 - Math.exp(-dt * 1.6);
    aim.x += (aim.tx - aim.x) * e; aim.y += (aim.ty - aim.y) * e; tilt += (scrollTilt - tilt) * e;
    pose(
      Math.sin(t * 0.32) * 0.022,
      REST.x + Math.sin(t * 0.15 + 1) * 0.018 + aim.y * 0.045 - tilt * 0.12,
      REST.y + Math.sin(t * 0.12) * 0.04 + aim.x * 0.07 + tilt * 0.06,
      REST.z + Math.sin(t * 0.1) * 0.006,
    );
    // the reflection crosses the face every 12 seconds, taking about 5 of them
    const c = (t % 12) / 5;
    sweepTex.offset.x = c <= 1 ? 1.1 - c * 2.2 : -1.1;
    renderer.render(scene, camera);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    frame(Math.min(0.05, (now - last) / 1000)); last = now;
    raf = requestAnimationFrame(loop);
  }
  const lost = (e) => { e.preventDefault(); onLost(); };
  canvas.addEventListener('webglcontextlost', lost);

  sweepTex.offset.x = -1.1;
  pose(0, REST.x, REST.y, REST.z);
  renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);

  return {
    /** Draw the rest pose once, with the reflection part-way across (used to make the still image). */
    still(sweepAt = 0.35) { cancelAnimationFrame(raf); raf = 0; visible = false; pose(0, REST.x, REST.y, REST.z); sweepTex.offset.x = sweepAt; renderer.render(scene, camera); },
    dispose() {
      cancelAnimationFrame(raf); raf = 0; ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onPointer); window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('scroll', onScrollTilt);
      document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', lost);
      const seen = new Set();
      scene.traverse((o) => {
        if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
        for (const m of [].concat(o.material || [])) { for (const k of ['map', 'roughnessMap', 'alphaMap', 'emissiveMap']) if (m[k] && !seen.has(m[k])) { seen.add(m[k]); m[k].dispose(); } m.dispose(); }
      });
      env.dispose(); renderer.dispose();
    },
  };
}
