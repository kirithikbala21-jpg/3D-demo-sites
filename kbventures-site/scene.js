// KB Ventures hero object: a thin slab of brushed metal with a piano-black glass face, a fine brushed-gold edge
// and the KB Ventures mark, lit like a product render (studio environment, key and rim light, soft contact shadow).
// It turns slowly, leans toward the pointer or the phone's tilt, and a soft reflection sweeps across the glass.
// Three.js r160, self-hosted in vendor/.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Two levels of shine, compared side by side before shipping; "less" won (see CHANGES.md). ?shine=more shows the other.
const LEVELS = {
  less: { exposure: 1.0, env: 1.0, metalEnv: 1.15, key: 2.2, rim: 1.6, sweep: 0.13, glassEnv: 1.0 },
  more: { exposure: 1.18, env: 1.5, metalEnv: 1.7, key: 3.4, rim: 2.6, sweep: 0.26, glassEnv: 1.6 },
};

const W = 3.2, H = 2.0, D = 0.12, R = 0.16; // slab size (16:10), depth and corner radius
const INSET = 0.075;                          // metal border around the glass

function roundedShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
/** Shape geometry with UVs running 0..1 across its bounding box (ShapeGeometry's own UVs are in world units). */
function flatGeometry(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedShape(w, h, r), 12);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}
function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function initScene(canvas, { lowEnd = false, shine = 'less', onLost = () => {} } = {}) {
  const L = LEVELS[shine] || LEVELS.less;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2)); // capped at 2
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = L.exposure;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture; // soft studio light strips
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  camera.position.set(0, 0.35, 9);
  camera.lookAt(0, -0.05, 0);

  // Key light high on the right, cool rim light behind on the left: bright specular edges
  const key = new THREE.DirectionalLight(0xf2f4ff, L.key); key.position.set(4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa9bce6, L.rim); rim.position.set(-6, 3, -4); scene.add(rim);

  const obj = new THREE.Group();
  scene.add(obj);

  // Brushed-metal body (anisotropic, clear-coated)
  const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(W, H, R), { depth: D, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 6, curveSegments: 16 });
  bodyGeo.translate(0, 0, -D / 2);
  const brushed = canvasTexture(512, 512, (g, w, h) => { // fine horizontal brush lines, used as a roughness variation
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { const v = 130 + Math.floor(Math.random() * 60); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, w, 1); }
  }, false);
  brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping; brushed.repeat.set(1, 6);
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xc5c9d2, metalness: 1, roughness: 0.3, roughnessMap: brushed,
    anisotropy: 0.85, anisotropyRotation: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: L.metalEnv,
  });
  obj.add(new THREE.Mesh(bodyGeo, metal));

  // Fine brushed-gold edge around the glass
  const goldShape = roundedShape(W - INSET * 2 + 0.03, H - INSET * 2 + 0.03, R - INSET + 0.015);
  goldShape.holes.push(roundedShape(W - INSET * 2, H - INSET * 2, R - INSET));
  const gold = new THREE.Mesh(new THREE.ShapeGeometry(goldShape, 16), new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.32, anisotropy: 0.6, clearcoat: 0.6, envMapIntensity: L.metalEnv }));
  gold.position.z = D / 2 + 0.026;
  obj.add(gold);

  // Piano-black glass face
  const faceW = W - INSET * 2, faceH = H - INSET * 2, faceR = R - INSET;
  const glass = new THREE.Mesh(flatGeometry(faceW, faceH, faceR), new THREE.MeshPhysicalMaterial({
    color: 0x05060a, metalness: 0.15, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, ior: 1.52, envMapIntensity: L.glassEnv,
  }));
  glass.position.z = D / 2 + 0.027;
  obj.add(glass);

  // The KB Ventures mark, set into the glass in soft platinum
  const markTex = canvasTexture(1600, 1000, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(228,230,237,.92)';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '600 300px Geist, "Helvetica Neue", Arial, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '-14px';
    g.fillText('KB', w / 2, h / 2 + 70);
    g.font = '500 58px Geist, "Helvetica Neue", Arial, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '22px';
    g.fillStyle = 'rgba(138,143,158,.95)';
    g.fillText('VENTURES', w / 2 + 11, h / 2 + 190);
    g.fillStyle = 'rgba(212,175,55,.9)'; g.fillRect(w / 2 - 40, h / 2 + 236, 80, 3); // a short gold hairline under the mark
  });
  markTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(faceW, faceH), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.94 }));
  mark.position.z = D / 2 + 0.028;
  obj.add(mark);

  // A soft band of reflected light that sweeps slowly across the glass
  const sweepTex = canvasTexture(512, 64, (g, w) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.42, 'rgba(235,240,255,0)');
    grd.addColorStop(0.5, 'rgba(235,240,255,1)'); grd.addColorStop(0.58, 'rgba(235,240,255,0)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, 64);
  });
  sweepTex.wrapS = THREE.ClampToEdgeWrapping;
  const sweepMat = new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, opacity: L.sweep, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const sweep = new THREE.Mesh(flatGeometry(faceW, faceH, faceR), sweepMat);
  sweep.position.z = D / 2 + 0.029;
  sweep.rotation.z = 0; // band is tilted via texture rotation
  sweepTex.center.set(0.5, 0.5); sweepTex.rotation = -0.5; sweepTex.repeat.set(0.55, 1);
  obj.add(sweep);

  // Soft contact shadow beneath
  const shadowTex = canvasTexture(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(0,0,0,.7)'); grd.addColorStop(0.5, 'rgba(0,0,0,.28)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -1.42, 0);
  scene.add(shadow);

  // Rest pose (also the pose of the still image in img/hero-object.webp)
  const REST = { x: -0.1, y: -0.38, z: 0.035 };
  obj.rotation.set(REST.x, REST.y, REST.z);

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole slab and its shadow in frame, whatever the canvas shape
    const needW = 3.75, needH = 3.05, v = THREE.MathUtils.degToRad(camera.fov);
    camera.position.z = Math.max(needH / 2 / Math.tan(v / 2), needW / 2 / (Math.tan(v / 2) * camera.aspect)) + 0.6;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  // Pointer (desktop) and device tilt (phones) nudge the object a little
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

  function frame(dt) {
    t += dt;
    aim.x += (aim.tx - aim.x) * Math.min(1, dt * 2); aim.y += (aim.ty - aim.y) * Math.min(1, dt * 2);
    obj.rotation.y = REST.y + Math.sin(t * 0.25) * 0.16 + aim.x * 0.16;
    obj.rotation.x = REST.x + Math.sin(t * 0.19 + 1) * 0.045 + aim.y * 0.08;
    obj.rotation.z = REST.z + Math.sin(t * 0.15) * 0.012;
    obj.position.y = Math.sin(t * 0.5) * 0.035;
    shadow.material.opacity = 0.95 - obj.position.y * 2;
    // the sweep crosses the glass every 9 seconds, taking about 4 of them
    const cycle = (t % 9) / 4;
    sweepTex.offset.x = cycle <= 1 ? 1.1 - cycle * 2.2 : -1.1;
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

  // first frame at rest with the sweep off the glass (matches the still image)
  sweepTex.offset.x = -1.1;
  renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);

  return {
    /** Draw the rest pose once (used to make the still image). */
    still(sweepAt = -1.1) { cancelAnimationFrame(raf); raf = 0; visible = false; obj.rotation.set(REST.x, REST.y, REST.z); obj.position.y = 0; sweepTex.offset.x = sweepAt; renderer.render(scene, camera); },
    dispose() {
      cancelAnimationFrame(raf); raf = 0; ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onPointer); window.removeEventListener('deviceorientation', onTilt);
      document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', lost);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { for (const k of ['map', 'roughnessMap']) if (o.material[k]) o.material[k].dispose(); o.material.dispose(); } });
      env.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
