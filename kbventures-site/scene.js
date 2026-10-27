// KB Ventures: hero 3D scene. Two rounded glass tiles (AceGuides and KB Websites) float over a soft cyan glow,
// catch reflections from a studio environment and lean gently toward the pointer. Pauses when off screen.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ACCENT = '#22d3ee'; // keep in step with --accent in styles.css
const TILES = [
  { name: 'AceGuides', tag: 'Live', icon: ['M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z', 'M12 6v13.5'], pos: [-0.95, 0.38, 0], rot: -0.14 },
  { name: 'KB Websites', tag: 'Starting', icon: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 9h18', 'M7 6.5h.01', 'M10 6.5h.01'], pos: [0.95, -0.42, -0.5], rot: 0.12 },
];
const W = 1.6, H = 2.0, DEPTH = 0.12, R = 0.2;

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Front label: icon badge, business name and status, drawn on a transparent canvas. */
function labelTexture(t, maxAniso) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 800;
  const g = c.getContext('2d');
  // glass face: soft sheen from the top-left corner and a faint cyan tint toward the bottom
  g.save(); g.beginPath(); g.roundRect(0, 0, 640, 800, 80); g.clip();
  const face = g.createLinearGradient(0, 0, 640, 800);
  face.addColorStop(0, 'rgba(255,255,255,.22)'); face.addColorStop(.38, 'rgba(255,255,255,.05)'); face.addColorStop(1, 'rgba(34,211,238,.14)');
  g.fillStyle = face; g.fillRect(0, 0, 640, 800);
  const streak = g.createLinearGradient(0, 0, 420, 300);
  streak.addColorStop(0, 'rgba(255,255,255,0)'); streak.addColorStop(.55, 'rgba(255,255,255,.10)'); streak.addColorStop(.62, 'rgba(255,255,255,0)');
  g.fillStyle = streak; g.fillRect(0, 0, 640, 800);
  g.restore();
  // icon badge
  g.fillStyle = 'rgba(34,211,238,.14)'; g.strokeStyle = 'rgba(34,211,238,.6)'; g.lineWidth = 3;
  g.beginPath(); g.roundRect(56, 56, 132, 132, 34); g.fill(); g.stroke();
  g.save(); g.translate(78, 78); g.scale(3.67, 3.67);
  g.strokeStyle = ACCENT; g.lineWidth = 1.6; g.lineCap = 'round'; g.lineJoin = 'round';
  t.icon.forEach((d) => g.stroke(new Path2D(d)));
  g.restore();
  // name and status
  g.fillStyle = '#eef3f6'; g.textBaseline = 'alphabetic';
  let size = 128; g.font = `700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  while (g.measureText(t.name.toUpperCase()).width > 528 && size > 60) { size -= 4; g.font = `700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`; }
  g.fillText(t.name.toUpperCase(), 56, 668);
  g.fillStyle = ACCENT; g.font = '600 40px Inter, system-ui, sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '5px';
  g.fillText(t.tag.toUpperCase(), 56, 744);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
  return tex;
}

/** Soft round glow used behind the glass so the tiles have something to refract. */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(34,211,238,.9)'); grd.addColorStop(.35, 'rgba(34,211,238,.35)'); grd.addColorStop(1, 'rgba(34,211,238,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initScene(canvas, { lowEnd = false, onLost = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 7);

  const key = new THREE.PointLight(ACCENT, 18, 12); key.position.set(2.5, 2, 3); scene.add(key);
  const rim = new THREE.PointLight(0xffffff, 8, 12); rim.position.set(-3, -1.5, 2); scene.add(rim);

  // glow cards behind the glass
  const gTex = glowTexture();
  const glows = [[-0.4, 0.2, -1.6, 4.2], [1.3, -0.8, -1.9, 3.2]].map(([x, y, z, s]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: gTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
    m.position.set(x, y, z); scene.add(m); return m;
  });

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const geo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 });
  geo.translate(0, 0, -DEPTH / 2);
  // Tinted, reflective glass. (Real transmission only refracts opaque objects and everything behind these tiles is glow,
  // so a see-through tint with strong clearcoat reflections reads better and costs far less.)
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x7fdcef, metalness: 0.1, roughness: 0.08, transparent: true, opacity: lowEnd ? 0.16 : 0.12,
    clearcoat: 1, clearcoatRoughness: 0.05, iridescence: lowEnd ? 0 : 0.5, iridescenceIOR: 1.3, envMapIntensity: 1.15, side: THREE.DoubleSide, depthWrite: false });
  const edgeMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55 });
  const edgePts = roundedRect(W + 0.06, H + 0.06, R + 0.03).getPoints(48);

  const tiles = TILES.map((t, i) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(geo, glassMat);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: labelTexture(t, maxAniso), transparent: true, depthWrite: false }));
    label.position.z = DEPTH / 2 + 0.035;
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(edgePts), edgeMat);
    edge.position.z = DEPTH / 2 + 0.031;
    group.add(body, label, edge);
    group.position.set(...t.pos);
    group.rotation.z = t.rot;
    group.userData = { base: t.pos.slice(), rot: t.rot, phase: i * 2.1 };
    scene.add(group);
    return group;
  });

  // Fit the pair of tiles to the canvas, whatever its shape.
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const needW = 4.2, needH = 3.6, vFov = THREE.MathUtils.degToRad(camera.fov);
    const distH = needH / 2 / Math.tan(vFov / 2), distW = needW / 2 / (Math.tan(vFov / 2) * camera.aspect);
    camera.position.z = Math.max(distH, distW) + 0.4;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => { pointer.tx = (e.clientX / window.innerWidth) * 2 - 1; pointer.ty = (e.clientY / window.innerHeight) * 2 - 1; };
  window.addEventListener('pointermove', onMove, { passive: true });

  let visible = true, raf = 0, last = performance.now(), time = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }, { threshold: 0 });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', onVis);

  function frame(dt) {
    time += dt;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    tiles.forEach((g) => {
      const { base, rot, phase } = g.userData;
      g.position.y = base[1] + Math.sin(time * 0.7 + phase) * 0.09;
      g.rotation.x = Math.sin(time * 0.5 + phase) * 0.06 + pointer.y * 0.18;
      g.rotation.y = Math.sin(time * 0.4 + phase) * 0.12 + pointer.x * 0.28;
      g.rotation.z = rot + Math.sin(time * 0.3 + phase) * 0.02;
    });
    glows.forEach((m, i) => { m.material.opacity = 0.65 + Math.sin(time * 0.6 + i * 2) * 0.08; });
    renderer.render(scene, camera);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    frame(Math.min(0.05, (now - last) / 1000)); last = now;
    raf = requestAnimationFrame(loop);
  }

  const onLostCtx = (e) => { e.preventDefault(); onLost(); };
  canvas.addEventListener('webglcontextlost', onLostCtx);
  frame(0);
  raf = requestAnimationFrame(loop);

  return {
    dispose() {
      cancelAnimationFrame(raf); raf = 0;
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLostCtx);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
      env.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
