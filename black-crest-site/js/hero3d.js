// The home page hero: a black brushed-titanium member's card with the KB hallmark engraved in gold, floating
// above a polished black floor that holds a soft, blurred reflection. A warm key light, a faint cool rim light and a
// slow light sweep across the face. It turns a few degrees on its own, leans towards the pointer, and on scroll turns
// edge-on and slides back. Rendering pauses off screen and in hidden tabs.
// Loaded only on the home page, on capable devices, when the browser is idle (see core.js). If anything fails, the
// still image of the same card (assets/card-still.*) stays in place.
// ?still=1 renders one fixed frame with a transparent background, for tools/render-still.mjs.
import * as THREE from '../vendor/three/three.module.min.js';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { roundedRect, faceGeometry as face, brushedTexture as brushed, softFloor } from './scene-kit.js';
import { CREST, LETTERS } from './logo-mark.js';

const DEG = Math.PI / 180;
const W = 8.56, H = 5.4, T = 0.08, R = 0.3; // 85.6 x 54 x 0.8 mm with 3 mm corners, at 1 unit = 10 mm

// the engraving, drawn white on transparent and used as the gold layer's alpha
async function engraving() {
  try { await Promise.all([document.fonts.load('600 80px "Cormorant Garamond"'), document.fonts.load('500 40px "Switzer"')]); } catch (_) {}
  const c = document.createElement('canvas'); c.width = 2048; c.height = Math.round(2048 * H / W);
  const g = c.getContext('2d'), cw = c.width, ch = c.height;
  g.strokeStyle = g.fillStyle = '#fff';
  // a fine engraved border
  g.lineWidth = 3; const m = cw * 0.035, rr = cw * 0.02;
  g.beginPath(); g.roundRect(m, m, cw - 2 * m, ch - 2 * m, rr); g.stroke();
  // the hallmark, top left
  const markH = ch * 0.3, k = markH / 48;
  g.save(); g.translate(cw * 0.085, ch * 0.13); g.scale(k, k);
  g.lineWidth = 1.5; g.lineJoin = 'round'; g.stroke(new Path2D(CREST)); g.fill(new Path2D(LETTERS));
  g.restore();
  // the name, bottom left, in spaced capitals
  g.textBaseline = 'alphabetic';
  g.font = `600 ${Math.round(ch * 0.085)}px "Cormorant Garamond", Georgia, serif`;
  if ('letterSpacing' in g) g.letterSpacing = `${Math.round(ch * 0.03)}px`;
  g.fillText('KB WEB DESIGNS', cw * 0.085, ch * 0.8);
  g.font = `500 ${Math.round(ch * 0.032)}px "Switzer", Arial, sans-serif`;
  if ('letterSpacing' in g) g.letterSpacing = `${Math.round(ch * 0.016)}px`;
  g.fillText('A KB VENTURES COMPANY', cw * 0.088, ch * 0.88);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  return t;
}

export async function start(stage, env = {}) {
  const still = /[?&]still=1\b/.test(location.search);
  const frames = /[?&]frames=1\b/.test(location.search); // tools/render-orbit.mjs: draws any point u (0 to 1) of the slow orbit
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: still || frames });
  renderer.setPixelRatio(still ? 2 : frames ? 1 : Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement; canvas.className = 'hero-canvas'; canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  scene.environmentRotation.set(-0.2, 0.7, 0);
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 80);
  const target = new THREE.Vector3(0, 0.3, 0);

  // lights: warm key from the upper left, a faint cool rim behind, and a sweep that crosses the face
  const key = new THREE.SpotLight(0xffe9c7, 260, 40, 26 * DEG, 0.85, 1.6); key.position.set(-6, 9, 9); key.target.position.copy(target); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xafc3ff, 1.2); rim.position.set(6, 3, -8); scene.add(rim);
  const sweep = new THREE.PointLight(0xfff6e5, 0, 14, 1.4); sweep.position.set(-7, 1.5, 4); scene.add(sweep);

  // the card
  const streaks = brushed();
  const faceMat = new THREE.MeshPhysicalMaterial({ color: 0x1d1e23, metalness: 1, roughness: 0.36, roughnessMap: streaks, bumpMap: streaks, bumpScale: 0.25, anisotropy: 0.75, clearcoat: 0.15, clearcoatRoughness: 0.4 });
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3b42, metalness: 1, roughness: 0.18 });
  const card = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(W, H, R), { depth: T - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2, curveSegments: 10 }), edgeMat);
  body.position.z = -T / 2 + 0.01; card.add(body);
  const front = new THREE.Mesh(face(W - 0.03, H - 0.03, R - 0.015), faceMat); front.position.z = T / 2 + 0.002; card.add(front);
  const back = new THREE.Mesh(face(W - 0.03, H - 0.03, R - 0.015), faceMat); back.position.z = -T / 2 - 0.002; back.rotation.y = Math.PI; card.add(back);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3, alphaMap: await engraving(), transparent: true, alphaTest: 0.35, polygonOffset: true, polygonOffsetFactor: -2 });
  const etch = new THREE.Mesh(face(W - 0.03, H - 0.03, R - 0.015), gold); etch.position.z = T / 2 + 0.004; card.add(etch);
  const pivot = new THREE.Group(); pivot.add(card); pivot.position.copy(target); scene.add(pivot);

  // the floor
  const floor = softFloor(26, 18); floor.position.set(0, -3.1, 0); scene.add(floor);

  const resize = () => {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const dist = Math.max(10.5 / (2 * Math.tan(camera.fov * DEG / 2)) * 0.95, 11.2 / (2 * Math.tan(camera.fov * DEG / 2) * camera.aspect));
    camera.position.set(0, 1.9, dist); camera.lookAt(0, -0.4, 0); camera.updateProjectionMatrix();
    floor.getRenderTarget().setSize(Math.round(w * 0.6), Math.round(h * 0.6));
  };
  resize(); stage.append(canvas);

  const pose = (ry, rx) => { card.rotation.set(rx, ry, 0); };
  if (frames) {
    window.__setU = (u) => {
      const e = u * u * (3 - 2 * u), ease = 0.5 - 0.5 * Math.cos(Math.PI * u);
      pose((-34 + 58 * ease) * DEG, (-5 + 2 * Math.sin(u * Math.PI)) * DEG);
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      const base = Math.max(10.5 / (2 * Math.tan(camera.fov * DEG / 2)) * 0.95, 11.2 / (2 * Math.tan(camera.fov * DEG / 2) * (w / h)));
      camera.position.set(-0.5 * (1 - ease) + 0.2 * ease, 1.9 - 0.3 * e, base * (1 - 0.2 * e)); camera.lookAt(0, -0.2 + 0.2 * e, 0);
      sweep.position.set(-7 + u * 14, 1.5, 4); sweep.intensity = Math.sin(Math.min(1, u * 1.15) * Math.PI) * 22;
      renderer.render(scene, camera);
    };
    window.__setU(0); stage.classList.add('is-live'); window.__cardReady = true; return;
  }
  if (still) {
    pose(-16 * DEG, -4 * DEG); sweep.position.set(-3.2, 2.4, 4.5); sweep.intensity = 16;
    renderer.render(scene, camera); stage.classList.add('is-live'); window.__cardReady = true; return;
  }

  // pointer on desktop; on phones the device tilt, only after a tap (iOS asks permission)
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  if (!env.fine) {
    const orient = (e) => { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 30)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); };
    stage.addEventListener('click', async () => {
      try { const D = window.DeviceOrientationEvent; if (D && D.requestPermission && (await D.requestPermission()) !== 'granted') return; addEventListener('deviceorientation', orient, { passive: true }); } catch (_) {}
    }, { once: true });
  }
  // scroll: the card turns edge-on and slides back as the hero leaves
  const hero = stage.closest('.hero') || stage;
  let p = 0;
  const onScroll = () => { p = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight * 0.9))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  let visible = true, raf = 0, last = performance.now(), t = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    cx += (tx - cx) * Math.min(1, dt * 2.5); cy += (ty - cy) * Math.min(1, dt * 2.5);
    const e = p * p * (3 - 2 * p);
    pose(-12 * DEG + Math.sin(t * 0.3) * 8 * DEG + cx * 7 * DEG - e * 78 * DEG, -4 * DEG + Math.sin(t * 0.22) * 2 * DEG + cy * 4 * DEG);
    pivot.position.set(target.x, target.y + Math.sin(t * 0.6) * 0.06, -e * 7);
    const s = (t % 8) / 2.6; // a light sweep every 8 seconds
    if (s < 1) { sweep.position.x = -7 + s * 14; sweep.intensity = Math.sin(s * Math.PI) * 20; } else sweep.intensity = 0;
    canvas.style.opacity = String(1 - e * 0.85);
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; play(); }).observe(stage);
  document.addEventListener('visibilitychange', play);
  addEventListener('resize', () => { resize(); play(); });
  pose(-12 * DEG, -4 * DEG); renderer.render(scene, camera);
  requestAnimationFrame(() => stage.classList.add('is-live'));
  play();
}
