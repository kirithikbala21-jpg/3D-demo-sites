// The home page hero: a slowly turning gold crest with drifting dust and light, and a light that follows the cursor.
// Loaded only on the home page, only on capable devices, after the page has finished loading (see main.js).
// Three.js comes from cdnjs, pinned to 0.160.0. If anything fails, the static SVG crest simply stays.
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// the crest outline, the same shape as the logo (48 x 56 units, y pointing down as in SVG)
function shieldShape(scale = 1, cx = 24, cy = 28) {
  const p = (x, y) => [(x - cx) * scale, -(y - cy) * scale];
  const s = new THREE.Shape();
  s.moveTo(...p(24, 2.5)); s.lineTo(...p(43.5, 9.2)); s.lineTo(...p(43.5, 26));
  s.bezierCurveTo(...p(43.5, 38.6), ...p(35.4, 47.6), ...p(24, 53.5));
  s.bezierCurveTo(...p(12.6, 47.6), ...p(4.5, 38.6), ...p(4.5, 26));
  s.lineTo(...p(4.5, 9.2)); s.closePath();
  return s;
}

function monogramTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 120, 0, 400);
  grad.addColorStop(0, '#FFF3C4'); grad.addColorStop(.5, '#E2C15A'); grad.addColorStop(1, '#A8842A');
  g.fillStyle = grad; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 250px "Cormorant Garamond", Georgia, serif';
  g.fillText('BC', 256, 270);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,240,200,.6)'); r.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function start(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  camera.position.set(0, 0, 118);

  // studio lighting baked into an environment map: a dark room with a few soft boxes
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: 0x08090c, side: THREE.BackSide })));
  const box = (w, h, x, y, z, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  box(60, 18, 0, 45, 10, 0xffffff); box(16, 60, -46, 5, 20, 0xfff1d0); box(16, 50, 46, -5, 15, 0xd8dcff); box(40, 10, 0, -45, 30, 0x6a5a30);
  scene.environment = pmrem.fromScene(room, 0.03).texture;

  const gold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.24 });
  const plate = new THREE.MeshStandardMaterial({ color: 0x15161c, metalness: 0.75, roughness: 0.38 });
  const crest = new THREE.Group();

  // the gold rim: the outer shield with the inner shield cut out
  const outer = shieldShape(1); outer.holes.push(new THREE.Path(shieldShape(0.8).getPoints(64).reverse()));
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 5, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 0.9, bevelSegments: 6, curveSegments: 48 }), gold);
  rim.position.z = -2.5; crest.add(rim);
  // the dark plate, slightly recessed
  const inner = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape(0.82), { depth: 3, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.3, bevelSegments: 3, curveSegments: 48 }), plate);
  inner.position.z = -1.5; crest.add(inner);
  // a fine gold inlay line
  const inlay = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const s = shieldShape(0.7); s.holes.push(new THREE.Path(shieldShape(0.675).getPoints(64).reverse())); return s; })(), { depth: 0.6, bevelEnabled: false, curveSegments: 48 }), gold);
  inlay.position.z = 1.95; crest.add(inlay); // just proud of the plate's front face (z = 1.9)
  const inlayBack = inlay.clone(); inlayBack.position.z = -2.55; crest.add(inlayBack);
  // the BC monogram on both faces
  const mono = new THREE.MeshBasicMaterial({ map: monogramTexture(), transparent: true, depthWrite: false });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), mono); front.position.set(0, -1.2, 2.6); crest.add(front);
  const back = front.clone(); back.rotation.y = Math.PI; back.position.z = -2.6; crest.add(back);
  scene.add(crest);

  // lights: a key light, and a warm spotlight that follows the cursor
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const key = new THREE.DirectionalLight(0xfff4dc, 1.6); key.position.set(-30, 50, 80); scene.add(key);
  const follow = new THREE.PointLight(0xffd88a, 900, 220, 1.6); follow.position.set(20, 10, 60); scene.add(follow);

  // dust and light: slow particles in front of and behind the crest
  const N = 520, pos = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 160; pos[i * 3 + 1] = (Math.random() - 0.5) * 110; pos[i * 3 + 2] = (Math.random() - 0.5) * 90; speed[i] = 0.4 + Math.random(); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ size: 1.1, map: dotTexture(), color: 0xf3dc9a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(dust);

  // size, pointer, visibility
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 1.2 ? 190 : w / h > 1.6 ? 120 : 165;
    camera.updateProjectionMatrix();
  };
  resize(); new ResizeObserver(resize).observe(stage);
  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  let first = true;
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    crest.rotation.y += dt * 0.32;
    crest.rotation.x = Math.sin(t * 0.4) * 0.06 + py * 0.08;
    crest.position.y = Math.sin(t * 0.6) * 1.6;
    follow.position.set(px * 70, -py * 45, 55);
    const a = pg.attributes.position.array;
    for (let i = 0; i < N; i++) {
      a[i * 3 + 1] += dt * speed[i] * 1.6; a[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.6;
      if (a[i * 3 + 1] > 56) a[i * 3 + 1] = -56;
    }
    pg.attributes.position.needsUpdate = true;
    dust.rotation.y = px * 0.05;
    renderer.render(scene, camera);
    if (first) { first = false; stage.classList.add('is-3d'); }
  });
}
