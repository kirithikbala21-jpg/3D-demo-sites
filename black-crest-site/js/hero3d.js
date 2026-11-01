// The home page hero: a real-time gold crest, extruded from SVG paths (the shield, its rim, an inlay line and the
// "BC" monogram as real letter outlines). Lit by a RoomEnvironment reflection map, a warm key light, a cool rim
// light and a slow light sweep. It turns a few degrees on its own, tilts towards the pointer (or the phone, after a
// tap), and recedes and dims as the page scrolls. Rendering pauses when the hero is off screen or the tab is hidden.
// Loaded only on the home page, only on capable devices, when the browser is idle (see core.js). If anything fails,
// the still image of the same crest (assets/crest-still.*) simply stays in place.
// ?still=1 renders one fixed frame with a transparent background, for tools/render-still.mjs.
import * as THREE from '../vendor/three/three.module.min.js';
import { SVGLoader } from '../vendor/three/addons/SVGLoader.js';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { CREST_SVG } from './crest-shape.js';

const DEG = Math.PI / 180;
// layer: [svg path id, extrude depth, front face z (svg units), material]
const LAYERS = [['plate', 10, 4, 'enamel'], ['rim', 30, 22, 'gold'], ['inlay', 12, 12, 'gold'], ['mono', 22, 20, 'gold']];

function buildCrest() {
  const data = new SVGLoader().parse(CREST_SVG);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd6a648, metalness: 1, roughness: 0.25, clearcoat: 0.4, clearcoatRoughness: 0.12 });
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0x030304, metalness: 0.2, roughness: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.2 });
  const mats = { gold, enamel };
  // centre on the shield, flip SVG's downward y (a half turn about x keeps the faces pointing the right way)
  const flip = new THREE.Matrix4().makeScale(1, -1, -1).multiply(new THREE.Matrix4().makeTranslation(-240, -280, 0));
  const group = new THREE.Group();
  LAYERS.forEach(([id, depth, front, mat]) => {
    const path = data.paths.find((p) => p.userData && p.userData.node && p.userData.node.id === id);
    if (!path) return;
    const shapes = SVGLoader.createShapes(path);
    const bevel = id === 'plate' ? 2 : id === 'rim' ? 7 : 4;
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, curveSegments: id === 'mono' ? 10 : 28, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 4 });
    geo.applyMatrix4(flip);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mats[mat]);
    mesh.position.z = front - bevel;
    group.add(mesh);
  });
  group.scale.setScalar(0.01); // 480 x 560 svg units become 4.8 x 5.6 world units
  return { group, mats };
}

export function start(stage, env = {}) {
  const still = /[?&]still=1\b/.test(location.search);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: still });
  renderer.setPixelRatio(still ? 2 : Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.0;
  scene.environmentRotation.set(-0.35, 0.9, 0); // bright panels of the room catch the bevels, the faces stay deep
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  camera.position.set(0, 0, 13.5);

  const key = new THREE.DirectionalLight(0xffe0b0, 6); key.position.set(-3, 4, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb4c4ff, 3); rim.position.set(5, 1.5, -5); scene.add(rim);
  const sweep = new THREE.PointLight(0xfff4dc, 0, 9, 1.6); sweep.position.set(-4, 1, 3); scene.add(sweep);

  const { group } = buildCrest();
  const pivot = new THREE.Group(); pivot.add(group); scene.add(pivot);

  // fit the crest to the stage: the whole shield, with a little air around it
  const resize = () => {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vfit = 6.4 / (2 * Math.tan((camera.fov * DEG) / 2)); // shield is about 5.6 tall, plus air
    const hfit = 5.6 / (2 * Math.tan((camera.fov * DEG) / 2) * camera.aspect);
    camera.position.z = Math.max(vfit, hfit);
    camera.updateProjectionMatrix();
  };
  resize();
  stage.append(canvas);

  if (still) {
    pivot.rotation.set(6 * DEG, -14 * DEG, 0);
    sweep.position.set(-1.2, 1.6, 3); sweep.intensity = 6;
    renderer.render(scene, camera);
    stage.classList.add('is-live');
    window.__crestReady = true;
    return;
  }

  // ---- input: pointer on desktop; on phones the device tilt, only after a tap on the crest (iOS asks permission)
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  if (!env.fine) {
    const orient = (e) => { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 30)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); };
    stage.addEventListener('click', async () => {
      try { const D = window.DeviceOrientationEvent; if (D && D.requestPermission && (await D.requestPermission()) !== 'granted') return; addEventListener('deviceorientation', orient, { passive: true }); } catch (_) {}
    }, { once: true });
  }

  // ---- scroll: the crest recedes and dims as the hero leaves
  const hero = stage.closest('.hero') || stage;
  let p = 0;
  const onScroll = () => { p = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---- loop, paused off screen and in hidden tabs
  let visible = true, raf = 0, last = performance.now(), t = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    cx += (tx - cx) * Math.min(1, dt * 3); cy += (ty - cy) * Math.min(1, dt * 3);
    pivot.rotation.y = Math.sin(t * 0.32) * 8 * DEG + cx * 9 * DEG;
    pivot.rotation.x = Math.sin(t * 0.21) * 2 * DEG + cy * 6 * DEG;
    pivot.position.z = -p * 4; pivot.position.y = p * 0.6;
    // a light sweeps across the face every 7 seconds
    const s = (t % 7) / 2.4;
    if (s < 1) { sweep.position.x = -4 + s * 8; sweep.intensity = Math.sin(s * Math.PI) * 9; } else sweep.intensity = 0;
    renderer.toneMappingExposure = 1.1 - p * 0.65;
    canvas.style.opacity = String(1 - p * 0.75);
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(stage);
  document.addEventListener('visibilitychange', play);
  addEventListener('resize', () => { resize(); play(); });
  renderer.render(scene, camera);
  requestAnimationFrame(() => stage.classList.add('is-live'));
  play();
}
