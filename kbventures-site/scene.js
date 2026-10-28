// KB Ventures hero object: a thin card of deep black glass on a brushed-metal core, with a slim bevelled metal edge,
// one fine brushed-gold line around the outer bevel and a raised, polished-metal KB mark. Lit by a small studio
// (three bright light strips baked into the environment map) so the glass and bevels carry real specular highlights.
// It floats in perspective with a slow drift, leans toward the pointer or the phone's tilt, and a wide soft reflection
// sweeps across the face every few seconds. A contact shadow and a faint mirror image sit beneath it; the canvas fades
// out at the bottom with a CSS mask so the mirror image dissolves into the page. Three.js r160.
import * as THREE from 'three';

const W = 3.2, H = 2.02, D = 0.05;   // a card's proportions, thin
const R = W * 0.06;                  // corner radius: 6% of the width
const BEVEL = 0.034;                 // slim bevel that catches the light

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
/** A seeded random so the brushed texture (and so the still image) is the same on every load. */
function rand(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }

/** The studio: a dark room with three bright strips (top, left, back-right) and a faint floor bounce. */
function studioEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x030406);
  const strip = (w, h, intensity, pos, rot, tint = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); room.add(m);
  };
  strip(14, 1.4, 9, [0, 6, 3], [Math.PI / 2.4, 0, 0]);                // long strip overhead, toward the viewer: the top-edge highlight
  strip(1.2, 9, 5, [-7, 1, 2], [0, Math.PI / 2.6, 0], 0xdfe7ff);      // tall strip on the left, slightly cool
  strip(1.0, 7, 3.2, [6, 2, -5], [0, -Math.PI / 4, 0], 0xcdd8f5);     // narrow strip behind on the right: the rim
  strip(18, 18, 0.06, [0, -6, 0], [-Math.PI / 2, 0, 0], 0x8a93a8);    // a faint floor bounce, so the dark side is not dead black
  strip(12, 7, 3.4, [0, 8.5, 11], [-0.62, 0, 0], 0xe8ecf6);         // a wide soft panel above and behind the viewer: lights the raised mark, gives the glass a faint sheen
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(room, 0.02).texture;
  pmrem.dispose();
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return tex;
}

/** The KB letters as shapes (so they can be extruded and bevelled like pressed metal). Units match the card. */
function kbShapes() {
  const k = new THREE.Shape();
  [[0, 0], [0.085, 0], [0.085, 0.15], [0.125, 0.195], [0.252, 0], [0.358, 0], [0.188, 0.252], [0.346, 0.42], [0.246, 0.42], [0.085, 0.25], [0.085, 0.42], [0, 0.42]]
    .forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y)));
  const b = new THREE.Shape(), ox = 0.4;
  b.moveTo(ox, 0); b.lineTo(ox + 0.19, 0);
  b.bezierCurveTo(ox + 0.325, 0, ox + 0.325, 0.212, ox + 0.205, 0.216);
  b.bezierCurveTo(ox + 0.3, 0.228, ox + 0.3, 0.42, ox + 0.18, 0.42);
  b.lineTo(ox, 0.42); b.lineTo(ox, 0);
  const lower = new THREE.Path(); lower.moveTo(ox + 0.085, 0.075); lower.lineTo(ox + 0.18, 0.075); lower.bezierCurveTo(ox + 0.238, 0.075, ox + 0.238, 0.178, ox + 0.18, 0.178); lower.lineTo(ox + 0.085, 0.178); lower.lineTo(ox + 0.085, 0.075);
  const upper = new THREE.Path(); upper.moveTo(ox + 0.085, 0.252); upper.lineTo(ox + 0.168, 0.252); upper.bezierCurveTo(ox + 0.214, 0.252, ox + 0.214, 0.345, ox + 0.168, 0.345); upper.lineTo(ox + 0.085, 0.345); upper.lineTo(ox + 0.085, 0.252);
  b.holes.push(lower, upper);
  return [k, b];
}

export function initScene(canvas, { lowEnd = false, onLost = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2)); // capped at 2
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const env = studioEnvironment(renderer);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 60);
  const key = new THREE.DirectionalLight(0xf4f6ff, 1.4); key.position.set(2, 6, 5); scene.add(key);

  const card = new THREE.Group();
  scene.add(card);
  const rnd = rand(11);

  // Face texture: deep black glass with a subtle vertical gradient over fine horizontal brushing
  const face = canvasTexture(1024, 646, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#15181f'); grd.addColorStop(0.55, '#0a0b10'); grd.addColorStop(1, '#050609');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.05;
    for (let y = 0; y < h; y++) { const v = 90 + Math.floor(rnd() * 120); g.fillStyle = `rgb(${v},${v},${v + 8})`; g.fillRect(0, y, w, 1); }
  });
  const brushRough = canvasTexture(1024, 646, (g, w, h) => {
    for (let y = 0; y < h; y++) { const v = 150 + Math.floor(rnd() * 70); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, w, 1); }
  }, false);
  for (const t of [face, brushRough]) { t.repeat.set(1 / W, 1 / H); t.offset.set(0.5, 0.5); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); }

  // The card body. ExtrudeGeometry gives two material groups: 0 = the flat front and back, 1 = the bevel and sides.
  const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(W - BEVEL * 2, H - BEVEL * 2, R - BEVEL), {
    depth: D, bevelEnabled: true, bevelThickness: BEVEL * 0.8, bevelSize: BEVEL, bevelSegments: 10, curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -D / 2);
  const glass = new THREE.MeshPhysicalMaterial({
    map: face, roughnessMap: brushRough, color: 0xffffff, metalness: 0.55, roughness: 0.42,
    clearcoat: 1, clearcoatRoughness: 0.025, envMapIntensity: 1.0,
  });
  const edge = new THREE.MeshPhysicalMaterial({
    color: 0xc3c8d1, metalness: 1, roughness: 0.2, anisotropy: 0.65, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.05,
  });
  card.add(new THREE.Mesh(bodyGeo, [glass, edge]));

  // One fine brushed-gold line around the outer bevel, at the card's waist
  const pts = roundedShape(W + 0.002, H + 0.002, R).getSpacedPoints(320).map((p) => new THREE.Vector3(p.x, p.y, 0));
  const goldLine = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 640, 0.007, 6, true),
    new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3, anisotropy: 0.5, clearcoat: 0.5, envMapIntensity: 0.9 }),
  );
  goldLine.position.z = D / 2; // where the flat side turns into the front bevel
  card.add(goldLine);
  const front = D / 2 + BEVEL * 0.8; // z of the glass face

  // Raised KB mark in polished metal, with a soft shadow pressed into the glass below it
  const markGroup = new THREE.Group();
  const markGeo = new THREE.ExtrudeGeometry(kbShapes(), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 4, curveSegments: 18 });
  markGeo.computeBoundingBox();
  const bb = markGeo.boundingBox;
  markGeo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, 0);
  const polished = new THREE.MeshPhysicalMaterial({ color: 0xe6e8ee, metalness: 1, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.05, envMapIntensity: 1.15 });
  const markMesh = new THREE.Mesh(markGeo, polished);
  markMesh.position.z = front + 0.001;
  const markShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.82), new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 168, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }),
    transparent: true, depthWrite: false, toneMapped: false,
  }));
  markShadow.position.set(0.012, -0.03, front + 0.0005);
  // VENTURES in metallic foil, set below the letters
  const foil = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.2), new THREE.MeshPhysicalMaterial({
    color: 0xf2f4f8, metalness: 0.85, roughness: 0.16, transparent: true, depthWrite: false, envMapIntensity: 1.6, emissive: 0x9aa0ae, emissiveIntensity: 0.18,
    alphaMap: canvasTexture(1900, 200, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '500 92px Geist, "Helvetica Neue", Arial, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '34px'; g.fillText('VENTURES', w / 2 + 17, h / 2 + 3); }, false),
  }));
  foil.position.set(0, -0.4, front + 0.001);
  markGroup.add(markShadow, markMesh, foil);
  markGroup.position.set(-0.02, 0.1, 0);
  card.add(markGroup);

  // A narrow, bright, soft-edged light streak that crosses the face diagonally, with a glass-like falloff
  // (a bright core, a soft shoulder either side, and a faint wide halo)
  const sweepTex = canvasTexture(2048, 32, (g, w) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    const stops = [[0, 0], [0.4, 0], [0.455, 0.06], [0.48, 0.28], [0.495, 0.85], [0.5, 1], [0.505, 0.85], [0.52, 0.28], [0.545, 0.06], [0.6, 0], [1, 0]];
    for (const [o, a] of stops) grd.addColorStop(o, `rgba(238,242,255,${a})`);
    g.fillStyle = grd; g.fillRect(0, 0, w, 32);
  });
  sweepTex.center.set(0.5, 0.5); sweepTex.rotation = -0.7; sweepTex.repeat.set(0.85, 1);
  const sweepGeo = new THREE.ShapeGeometry(roundedShape(W - BEVEL * 2, H - BEVEL * 2, R - BEVEL), 24);
  { const p = sweepGeo.attributes.position, uv = sweepGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / W + 0.5, p.getY(i) / H + 0.5); }
  const sweep = new THREE.Mesh(sweepGeo, new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sweep.position.z = front + 0.0004;
  card.add(sweep);

  // Beneath: a soft contact shadow, then a faint mirror image of the card fading into the floor
  const FLOOR = -1.5;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,.75)'); r.addColorStop(0.45, 'rgba(0,0,0,.3)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }),
    transparent: true, depthWrite: false, toneMapped: false,
  }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = FLOOR;
  scene.add(shadow);
  const mirror = card.clone(true);
  mirror.traverse((o) => { if (o.material) { o.material = Array.isArray(o.material) ? o.material.map((m) => fade(m)) : fade(o.material); } });
  // faint; the canvas itself fades out at the bottom (CSS mask)
  function fade(m) { const c = m.clone(); c.transparent = true; c.opacity = (m.opacity ?? 1) * 0.06; c.depthWrite = false; return c; }
  scene.add(mirror);

  // Rest pose: tilted about 15 degrees back and 16 degrees sideways (also the pose of img/hero-object.webp)
  const REST = { x: -0.27, y: -0.28, z: 0.06 };
  const place = (o, s = 1) => { o.rotation.set(REST.x * s, REST.y, REST.z * s); };
  place(card);

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const needW = 3.77, needH = 3.29, // framing that draws the card about 15% bigger than the last version
      v = THREE.MathUtils.degToRad(camera.fov);
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
    shadow.material.opacity = 0.9 - lift * 1.5;
  }
  // the card tilts back a little as the page scrolls down (0 at the top, full tilt one screen down)
  let scrollTilt = 0;
  const onScrollTilt = () => { scrollTilt = Math.min(1, window.scrollY / Math.max(1, window.innerHeight)); };
  window.addEventListener('scroll', onScrollTilt, { passive: true }); onScrollTilt();
  function frame(dt) {
    t += dt;
    aim.x += (aim.tx - aim.x) * Math.min(1, dt * 1.8); aim.y += (aim.ty - aim.y) * Math.min(1, dt * 1.8);
    pose(
      Math.sin(t * 0.45) * 0.05,
      REST.x + Math.sin(t * 0.21 + 1) * 0.035 + aim.y * 0.07 - scrollTilt * 0.32,
      REST.y + Math.sin(t * 0.17) * 0.09 + aim.x * 0.14 + scrollTilt * 0.18,
      REST.z + Math.sin(t * 0.13) * 0.01,
    );
    // the streak crosses the face every 7 seconds, taking about 2.6 of them
    const c = (t % 7) / 2.6;
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
    /** Draw the rest pose once, with the reflection band part-way across (used to make the still image). */
    still(sweepAt = 0.3) { cancelAnimationFrame(raf); raf = 0; visible = false; pose(0, REST.x, REST.y, REST.z); sweepTex.offset.x = sweepAt; renderer.render(scene, camera); },
    dispose() {
      cancelAnimationFrame(raf); raf = 0; ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onPointer); window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('scroll', onScrollTilt);
      document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', lost);
      const seen = new Set();
      scene.traverse((o) => {
        if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
        for (const m of [].concat(o.material || [])) { for (const k of ['map', 'roughnessMap', 'alphaMap']) if (m[k] && !seen.has(m[k])) { seen.add(m[k]); m[k].dispose(); } m.dispose(); }
      });
      env.dispose(); renderer.dispose();
    },
  };
}
