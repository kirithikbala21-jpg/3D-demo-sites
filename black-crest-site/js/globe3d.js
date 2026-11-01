// The "Where" globe: land drawn as dots (from js/globe-points.js, made once from Natural Earth data; no map tiles,
// no data APIs), turning until Melbourne faces you, where a gold pin pulses. Loaded only when the section comes
// near the screen on capable devices (see core.js); everyone else keeps the still image. Pauses off screen.
// ?still=1 renders one fixed frame with a transparent background, for tools/render-still.mjs.
import * as THREE from '../vendor/three/three.module.min.js';
import { LAND } from './globe-points.js';

const DEG = Math.PI / 180;
const MEL = { lat: -37.81, lon: 144.96 };
const vec = (lat, lon, r = 1) => {
  const phi = (90 - lat) * DEG, th = (lon + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

function dotSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(16, 16, 13, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function start(box, env = {}) {
  const still = /[?&]still=1\b/.test(location.search);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: still });
  renderer.setPixelRatio(still ? 2 : Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20); camera.position.set(0, 0, 4.4);

  // tilt (x) on the outside, spin (y) inside: north stays up while it turns
  const tilt = new THREE.Group(), spin = new THREE.Group(); tilt.add(spin); scene.add(tilt);
  // a dark core hides the dots on the far side
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(0.985, 48, 32), new THREE.MeshBasicMaterial({ color: 0x0b0c10 })));
  // a faint rim of light around the edge
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.22, 96), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.82, d) * smoothstep(0.80, 0.84, d); gl_FragColor = vec4(0.83, 0.69, 0.22, a * 0.22); }'
  }));
  scene.add(halo);

  const pos = new Float32Array((LAND.length / 2) * 3);
  for (let i = 0, j = 0; i < LAND.length; i += 2, j += 3) { const v = vec(LAND[i] / 10, LAND[i + 1] / 10); pos[j] = v.x; pos[j + 1] = v.y; pos[j + 2] = v.z; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.03, map: dotSprite(), transparent: true, alphaTest: 0.4, color: 0xc9cdd6, sizeAttenuation: true }));
  spin.add(dots);

  // Melbourne: a gold pin and a ring that pulses outward
  const mel = vec(MEL.lat, MEL.lon, 1.0);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe9cf73 }));
  pin.position.copy(mel); spin.add(pin);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 48), new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  ring.position.copy(mel.clone().multiplyScalar(1.002)); ring.lookAt(mel.clone().multiplyScalar(2)); spin.add(ring);

  // the angles that bring Melbourne to the front, a little below centre
  const az = Math.atan2(mel.x, mel.z);
  const target = { y: -az, x: MEL.lat * DEG * 0.78 };
  tilt.rotation.x = target.x;

  const resize = () => { const w = Math.max(1, box.clientWidth), h = Math.max(1, box.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  resize(); box.append(canvas);

  if (still) {
    spin.rotation.y = target.y; ring.scale.setScalar(1.6); ring.material.opacity = 0.5;
    renderer.render(scene, camera); box.classList.add('is-live'); window.__globeReady = true; return;
  }

  let visible = true, raf = 0, last = performance.now(), t = 0, arrive = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    arrive = Math.min(1, arrive + dt / 2.6);
    const e = 1 - Math.pow(1 - arrive, 4); // the house curve: fast start, long settle
    spin.rotation.y = target.y + (1 - e) * 1.9 + Math.sin(t * 0.25) * 0.05 * e;
    const k = (t % 2.2) / 2.2;
    ring.scale.setScalar(1 + k * 2.6); ring.material.opacity = (1 - k) * 0.9;
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; play(); }).observe(box);
  document.addEventListener('visibilitychange', play);
  addEventListener('resize', () => { resize(); play(); });
  spin.rotation.y = target.y + 1.9;
  renderer.render(scene, camera);
  requestAnimationFrame(() => box.classList.add('is-live'));
  play();
}
