// Ember & Oak: hero 3D scene (the only 3D feature on the site).
// A ceramic cup + saucer built from code, steam sprites, soft studio lighting.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Latte-art texture drawn on a canvas (rosetta pour). */
function makeLatteTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#6B3E22');
  grad.addColorStop(0.7, '#4E2A15');
  grad.addColorStop(1, '#2F190C');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);

  g.save();
  g.translate(size / 2, size / 2);
  g.rotate(-Math.PI / 2); // texture "up" faces the camera-left at rest
  g.shadowColor = 'rgba(244,226,196,.9)';
  g.shadowBlur = 10;
  g.fillStyle = 'rgba(244,226,196,.92)';
  // stacked leaves of the rosetta, shrinking towards the tip
  for (let i = 0; i < 7; i++) {
    const y = -150 + i * 44;
    const w = 150 - i * 15;
    const h = 46 - i * 3;
    g.beginPath();
    g.moveTo(0, y - h * 0.5);
    g.bezierCurveTo(w, y - h, w * 0.9, y + h * 0.9, 0, y + h * 0.7);
    g.bezierCurveTo(-w * 0.9, y + h * 0.9, -w, y - h, 0, y - h * 0.5);
    g.fill();
  }
  // dark pull-through down the middle
  g.shadowBlur = 4;
  g.strokeStyle = '#4A2713';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -178);
  g.bezierCurveTo(6, -60, -6, 80, 0, 190);
  g.stroke();
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Soft round blob used for steam puffs and the contact shadow. */
function makeBlobTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.45, outer.replace('A', '0.35'));
  grad.addColorStop(1, outer.replace('A', '0'));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Smooth a list of [r, y] points into a lathe profile. */
function smooth(points, divisions) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return curve.getPoints(divisions);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{reduceMotion?: boolean, onLost?: () => void}} opts
 * @returns {Promise<{dispose: () => void}>}
 */
export async function initScene(canvas, { reduceMotion = false, onLost = () => {} } = {}) {
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

  // ---------- Image-based light so the glaze has something to reflect ----------
  let envTarget = null;
  try {
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();
  } catch (err) {
    // Optional nicety: the scene still looks fine with the direct lights below.
  }
  const envIntensity = envTarget ? 0.45 : 0;

  // ---------- Lighting: hemisphere + warm key + cool-ish rim ----------
  scene.add(new THREE.HemisphereLight(0xffe6cc, 0x5a1820, 0.55));
  const key = new THREE.DirectionalLight(0xffe0b8, 3.6);
  key.position.set(-3.5, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4a3a, 3.4); // crimson rim to match the burgundy backdrop
  rim.position.set(4, 2.5, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffe7c8, 18, 12, 2);
  fill.position.set(2.5, 1.2, 4);
  scene.add(fill);

  // ---------- Geometry ----------
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const ceramic = track(new THREE.MeshStandardMaterial({
    color: 0xe4d5c0, roughness: 0.34, metalness: 0, envMapIntensity: envIntensity, side: THREE.DoubleSide,
  }));

  // Cup body: outer wall -> rim -> inner wall -> floor
  const outer = smooth([[0.001, 0], [0.4, 0], [0.45, 0.05], [0.58, 0.18], [0.74, 0.48], [0.85, 0.82], [0.9, 1.0]], 28);
  const rimPts = [[0.915, 1.025], [0.9, 1.05], [0.865, 1.045], [0.85, 1.02]].map(([x, y]) => new THREE.Vector2(x, y));
  const inner = smooth([[0.85, 1.0], [0.79, 0.85], [0.7, 0.5], [0.52, 0.2], [0.3, 0.14], [0.001, 0.13]], 24);
  const cupGeo = track(new THREE.LatheGeometry([...outer, ...rimPts, ...inner], 96));
  const cup = new THREE.Mesh(cupGeo, ceramic);
  cup.position.y = 0.11;

  // Handle
  const handleGeo = track(new THREE.TorusGeometry(0.34, 0.07, 20, 40, Math.PI * 1.15));
  const handle = new THREE.Mesh(handleGeo, ceramic);
  handle.scale.set(0.95, 1.25, 1);
  handle.position.set(0.86, 0.66, 0);
  handle.rotation.z = -Math.PI * 1.15 / 2;
  cup.add(handle);

  // Coffee surface
  const latteTex = track(makeLatteTexture());
  const coffeeMat = track(new THREE.MeshStandardMaterial({ map: latteTex, roughness: 0.22, metalness: 0, envMapIntensity: envIntensity * 1.4 }));
  const coffeeGeo = track(new THREE.CircleGeometry(0.775, 64));
  const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.88;
  cup.add(coffee);

  // Saucer
  const saucerPts = smooth([
    [0.001, 0.0], [0.62, 0.0], [0.7, 0.02], [1.0, 0.07], [1.35, 0.17], [1.62, 0.27],
  ], 18).concat([
    new THREE.Vector2(1.66, 0.3), new THREE.Vector2(1.62, 0.32), new THREE.Vector2(1.58, 0.3),
  ], smooth([[1.55, 0.27], [1.3, 0.18], [0.95, 0.11], [0.001, 0.1]], 18));
  const saucerGeo = track(new THREE.LatheGeometry(saucerPts, 96));
  const saucer = new THREE.Mesh(saucerGeo, ceramic);

  // Spin group (yaw) and tilt group (mouse/touch/scroll parallax)
  const spin = new THREE.Group();
  spin.add(saucer, cup);
  const tilt = new THREE.Group();
  tilt.add(spin);
  tilt.position.y = -0.55;
  scene.add(tilt);

  // Soft contact shadow under the saucer (cheap radial gradient plane, no shadow maps)
  const shadowTex = track(makeBlobTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,A)'));
  const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }));
  const shadowGeo = track(new THREE.PlaneGeometry(4.6, 4.6));
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.62;
  scene.add(shadow);

  // Embers: soft glowing specks drifting upward around the cup
  const EMBER_COUNT = 70;
  const emberPos = new Float32Array(EMBER_COUNT * 3);
  const embersData = Array.from({ length: EMBER_COUNT }, (_, i) => ({
    x: (Math.sin(i * 91.7) * 0.5) * 5, y: ((i * 0.6180339) % 1) * 4.2, z: (Math.cos(i * 37.3) * 0.5) * 3,
    speed: 0.12 + ((i * 0.37) % 1) * 0.22, phase: i * 2.3,
  }));
  const emberGeo = track(new THREE.BufferGeometry());
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberTex = track(makeBlobTexture('rgba(255,190,110,1)', 'rgba(255,110,50,A)'));
  const emberMat = track(new THREE.PointsMaterial({ map: emberTex, size: 0.17, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
  const embers = new THREE.Points(emberGeo, emberMat);
  embers.frustumCulled = false;
  tilt.add(embers);
  function updateEmbers(time) {
    embersData.forEach((e, i) => {
      emberPos[i * 3] = e.x + Math.sin(time * 0.6 + e.phase) * 0.22;
      emberPos[i * 3 + 1] = ((e.y + time * e.speed) % 4.2) - 0.7;
      emberPos[i * 3 + 2] = e.z;
    });
    emberGeo.attributes.position.needsUpdate = true;
    emberMat.opacity = 0.65 + 0.25 * Math.sin(time * 2.4);
  }

  // Steam: 26 soft sprites that rise, sway, grow and fade
  const steamTex = track(makeBlobTexture('rgba(255,248,238,1)', 'rgba(255,244,230,A)'));
  const STEAM_COUNT = 26;
  const steam = [];
  for (let i = 0; i < STEAM_COUNT; i++) {
    const mat = track(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }));
    const sprite = new THREE.Sprite(mat);
    tilt.add(sprite);
    steam.push({
      sprite,
      offset: i / STEAM_COUNT,
      speed: 0.11 + (i % 5) * 0.012,
      x: (Math.sin(i * 12.9898) * 0.5) * 0.7,
      z: (Math.cos(i * 78.233) * 0.5) * 0.5,
      phase: i * 1.7,
    });
  }
  function updateSteam(time) {
    for (const s of steam) {
      const t = (time * s.speed + s.offset) % 1;
      const fade = Math.sin(Math.PI * t);
      s.sprite.position.set(
        s.x + Math.sin(t * 5 + s.phase) * 0.16 * t,
        0.35 + t * 2.1,
        s.z + Math.cos(t * 4 + s.phase) * 0.08,
      );
      const size = 0.5 + t * 1.05;
      s.sprite.scale.set(size, size, 1);
      s.sprite.material.opacity = Math.pow(fade, 1.4) * 0.62;
    }
  }

  // ---------- Sizing ----------
  function resize() {
    const w = Math.max(1, stage.clientWidth);
    const h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the cup + saucer horizontally and the steam vertically
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distV = (3.0 / 2) / tanHalf;
    const distH = (3.5 / 2) / (tanHalf * camera.aspect);
    const dist = Math.max(distV, distH);
    camera.position.set(0, dist * 0.34, dist * 0.94);
    camera.lookAt(0, 0.42, 0);
    camera.updateProjectionMatrix();
    if (reduceMotion) draw();
  }

  // ---------- Interaction state ----------
  let yaw = -0.55;               // current auto rotation
  let dragYaw = 0, dragVel = 0;  // user drag offset + inertia
  let tiltX = 0, tiltZ = 0;      // smoothed
  let targetX = 0, targetZ = 0;  // wanted
  let dragging = false, lastX = 0;
  let scrollP = 0;
  const cleanups = [];
  let requestTiltPermissionOnce = () => {};
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); };

  if (!reduceMotion) {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) {
      on(window, 'pointermove', (e) => {
        if (e.pointerType !== 'mouse' || dragging) return;
        targetX = (e.clientY / window.innerHeight - 0.5) * 0.45;
        targetZ = -(e.clientX / window.innerWidth - 0.5) * 0.45;
      }, { passive: true });
    }
    // Touch / mouse drag to spin
    on(canvas, 'pointerdown', (e) => {
      dragging = true; lastX = e.clientX; dragVel = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (e.pointerType === 'touch') requestTiltPermissionOnce();
    });
    on(canvas, 'pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      dragYaw += dx * 0.012; dragVel = dx * 0.012;
    });
    const end = () => { dragging = false; };
    on(canvas, 'pointerup', end);
    on(canvas, 'pointercancel', end);

    // Device tilt: only where no permission prompt is needed, or after a user tap on iOS.
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let tiltAttached = false;
    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      targetX = clamp((e.beta - 50) / 50, -1, 1) * 0.28;
      targetZ = -clamp(e.gamma / 40, -1, 1) * 0.28;
    };
    const attachTilt = () => {
      if (tiltAttached) return;
      tiltAttached = true;
      on(window, 'deviceorientation', onOrient, { passive: true });
    };
    requestTiltPermissionOnce = () => {
      const DOE = window.DeviceOrientationEvent;
      if (!hasTouch || !DOE || typeof DOE.requestPermission !== 'function' || tiltAttached) return;
      DOE.requestPermission().then((r) => { if (r === 'granted') attachTilt(); }).catch(() => {});
    };
    if (hasTouch && window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') attachTilt();
    on(window, 'scroll', () => { scrollP = clamp(window.scrollY / window.innerHeight, 0, 1.2); }, { passive: true });
  }

  // ---------- Render loop ----------
  let raf = 0, last = 0, time = 0, inView = true, tabVisible = !document.hidden, disposed = false;

  function draw() {
    spin.rotation.y = yaw + dragYaw;
    tilt.rotation.x = tiltX;
    tilt.rotation.z = tiltZ;
    tilt.position.y = -0.55 + scrollP * 0.35;
    updateSteam(reduceMotion ? 0.35 : time);
    updateEmbers(reduceMotion ? 1.7 : time);
    renderer.render(scene, camera);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now; time += dt;
    yaw += dt * 0.35;
    if (!dragging) { dragYaw += dragVel; dragVel *= 0.92; }
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing
    tiltX += (targetX - tiltX) * k * 0.9;
    tiltZ += (targetZ - tiltZ) * k * 0.9;
    draw();
  }
  const shouldRun = () => !reduceMotion && inView && tabVisible && !disposed;
  function sync() {
    if (shouldRun() && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!shouldRun() && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  const io = new IntersectionObserver((entries) => { inView = entries[entries.length - 1].isIntersecting; sync(); }, { threshold: 0.01 });
  io.observe(canvas);
  on(document, 'visibilitychange', () => { tabVisible = !document.hidden; sync(); });

  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  on(canvas, 'webglcontextlost', (e) => { e.preventDefault(); dispose(); onLost(); });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf); raf = 0;
    io.disconnect(); ro.disconnect();
    cleanups.forEach((fn) => fn());
    disposables.forEach((d) => d.dispose());
    if (envTarget) envTarget.dispose();
    renderer.dispose();
  }
  on(window, 'pagehide', dispose);

  resize();
  draw(); // first frame before fade-in so the canvas is never blank
  sync();
  return { dispose };
}
