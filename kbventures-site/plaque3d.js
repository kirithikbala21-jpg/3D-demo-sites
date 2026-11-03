// The KB Ventures hero object: a slim plaque of smoked glass with the KB mark engraved in champagne gold, held in a
// brushed-metal foot on a basalt plinth, under one warm spotlight with a faint haze, above a polished black floor.
// It turns a few degrees on its own and leans a little towards the pointer. Rendering pauses off screen.
// Loaded by hero.js only on capable devices; everyone else keeps the still (img/hero-plaque.*).
// ?still=1 renders one fixed frame with a transparent background, for tools/render-kb.mjs.
import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/addons/RoomEnvironment.js';
import { roundedRect, faceGeometry, brushedTexture, stoneTexture, softFloor, WARM, RIM } from './kit.js';

const DEG = Math.PI / 180;
// the KB letters from img/kb-favicon.svg, exactly as supplied (a 120 x 120 box)
const KB = 'M18.74 84.00H25.23V67.29L32.58 59.53L49.98 84.00H57.67L37.06 55.12L57.63 33.07H49.12L33.91 49.51C30.80 52.86 27.96 56.21 25.13 59.87L25.23 50.50V33.07H18.74Z M67.77 84.00H86.40C98.39 84.00 103.45 78.12 103.45 70.43C103.45 62.43 97.88 58.06 93.13 57.75V57.27C97.57 56.08 101.47 53.10 101.47 46.57C101.47 39.12 96.44 33.07 85.81 33.07H67.77ZM74.26 78.26V60.89H86.57C93.09 60.89 97.20 65.27 97.20 70.36C97.20 74.77 94.15 78.26 86.22 78.26ZM74.26 55.43V38.81H85.68C92.27 38.81 95.25 42.30 95.25 46.71C95.25 51.97 90.94 55.43 85.47 55.43Z';
const PW = 2.3, PH = 3.3, PT = 0.1;

async function engraving() {
  try { await document.fonts.load('500 40px "Switzer"'); } catch (_) {}
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * PH / PW);
  const g = c.getContext('2d'), w = c.width, h = c.height; g.fillStyle = g.strokeStyle = '#fff';
  const k = (w * 0.42) / (103.45 - 18.74); // the letters 42% of the plaque wide
  g.save(); g.translate(w / 2 - ((18.74 + 103.45) / 2) * k, h * 0.4 - ((33.07 + 84) / 2) * k); g.scale(k, k); g.fill(new Path2D(KB)); g.restore();
  g.fillRect(w * 0.38, h * 0.555, w * 0.24, 2); // a fine rule
  g.font = `500 ${Math.round(w * 0.028)}px "Switzer", Arial, sans-serif`; g.textAlign = 'center';
  if ('letterSpacing' in g) g.letterSpacing = `${Math.round(w * 0.014)}px`;
  g.fillText('KB VENTURES', w / 2 + w * 0.007, h * 0.61);
  g.lineWidth = 2; g.strokeRect(w * 0.06, h * 0.045, w * 0.88, h * 0.91); // an engraved border, close to the edge
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}

function haze() {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(WARM) } },
    vertexShader: `varying float vH; varying vec3 vN; varying vec3 vV;
      void main() { vH = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 color; varying float vH; varying vec3 vN; varying vec3 vV;
      void main() { float t = clamp(vH / 6.0 + 0.5, 0.0, 1.0); gl_FragColor = vec4(color, pow(t, 1.8) * pow(abs(dot(vN, vV)), 2.0) * 0.08); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
}

export async function start(stage, opts = {}) {
  const still = /[?&]still=1\b/.test(location.search);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: still });
  renderer.setPixelRatio(still ? 2 : Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.setClearColor(0, 0);
  const canvas = renderer.domElement; canvas.className = 'plaque-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.85; pm.dispose();
  scene.environmentRotation.set(-0.15, 2.4, 0);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);

  const stone = stoneTexture(512, 5); stone.repeat.set(0.6, 0.6);
  const basalt = new THREE.MeshStandardMaterial({ color: 0x2c2d33, map: stone, roughnessMap: stone, roughness: 0.85, bumpMap: stone, bumpScale: 1.1 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.1, 1.5), basalt); plinth.position.y = 0.55;
  const brushed = brushedTexture();
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x7d8087, metalness: 1, roughness: 0.28, roughnessMap: brushed, anisotropy: 0.7 });
  const object = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 0.42), metal); foot.position.y = 1.2; object.add(foot);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x2a2d35, metalness: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.86, envMapIntensity: 3.2 });
  const pane = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(PW, PH, 0.04), { depth: PT, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), glass);
  pane.position.set(0, 1.2 + PH / 2 + 0.02, -PT / 2); object.add(pane);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.02, 0.05, PT + 0.03), metal); cap.position.y = 1.2 + PH + 0.04; object.add(cap);
  // the engraving holds a little warm light of its own, so the KB reads as lit gold even away from the lamp
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xead07a, metalness: 1, roughness: 0.2, envMapIntensity: 4.2, emissive: 0xb8902e, emissiveIntensity: 0.55, alphaMap: await engraving(), transparent: true, alphaTest: 0.35, polygonOffset: true, polygonOffsetFactor: -2 });
  const etch = new THREE.Mesh(faceGeometry(PW - 0.02, PH - 0.02, 0.03), gold); etch.position.set(0, 1.2 + PH / 2 + 0.02, PT / 2 + 0.012); object.add(etch);
  scene.add(plinth, object);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1, map: stone }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.002; scene.add(ground);
  const floor = softFloor(30, 20, { strength: 0.12, reach: 5, start: -2 }); scene.add(floor);

  const lamp = new THREE.SpotLight(WARM, 300, 14, 17 * DEG, 0.7, 1.2); lamp.position.set(0, 9.5, 1.6); lamp.target.position.set(0, 2.2, 0); scene.add(lamp, lamp.target);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.1, 6, 48, 1, true), haze()); cone.position.set(0, 6.5, 0.6); scene.add(cone);
  const rim = new THREE.DirectionalLight(RIM, 2.4); rim.position.set(5, 4, -6); scene.add(rim);
  const sweep = new THREE.PointLight(0xfff6e5, 0, 10, 1.4); sweep.position.set(-4, 4.6, 1.2); scene.add(sweep);
  // a warm key raking in low from the far left: it lights the gold KB and the glass edge, and its reflection falls
  // outside the glass (no hotspot on the face)
  const key = new THREE.SpotLight(0xfff1dc, 110, 18, 22 * DEG, 0.9, 1.3); key.position.set(-6, 2.8, 2.6); key.target.position.set(0, 2.9, 0); scene.add(key, key.target);


  const fit = () => {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // framed close: 5.45 units tall (plinth to cap, with a little air) and 4.3 wide, so the plaque fills the stage
    const d = Math.max(5.45 / (2 * Math.tan(camera.fov * DEG / 2)), 4.3 / (2 * Math.tan(camera.fov * DEG / 2) * camera.aspect));
    camera.position.set(0, 3.0, d); camera.lookAt(0, 2.15, 0); camera.updateProjectionMatrix();
  };
  fit(); stage.append(canvas);

  if (still) { object.rotation.y = -14 * DEG; sweep.position.set(-2.8, 4.6, 1.2); sweep.intensity = 6; renderer.render(scene, camera); stage.classList.add('has-3d'); window.__plaqueReady = true; return; }

  let tx = 0, cx = 0, t = 0, last = performance.now(), raf = 0, visible = true;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') tx = (e.clientX / innerWidth - 0.5) * 2; }, { passive: true });
  const frame = (now) => {
    raf = 0; const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    cx += (tx - cx) * Math.min(1, dt * 2);
    object.rotation.y = -10 * DEG + Math.sin(t * 0.28) * 8 * DEG + cx * 6 * DEG;
    const s = (t % 9) / 3; // a slow light sweep every 9 seconds
    if (s < 1) { sweep.position.x = -4 + s * 8; sweep.position.z = 1.2; sweep.intensity = Math.sin(s * Math.PI) * 8; } else sweep.intensity = 0;
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(stage);
  document.addEventListener('visibilitychange', play);
  addEventListener('resize', () => { fit(); play(); });
  renderer.render(scene, camera);
  requestAnimationFrame(() => stage.classList.add('has-3d'));
  play();
  return { dispose() { renderer.dispose(); canvas.remove(); } };
}
