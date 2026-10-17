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

/** Tall, soft, streaky texture for steam wisps. */
function makeWispTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.filter = 'blur(6px)';
  for (let i = 0; i < 7; i++) {
    const x = 64 + (i - 3) * 9;
    g.strokeStyle = `rgba(255,246,235,${0.22 + (i % 3) * 0.08})`;
    g.lineWidth = 10 + (i % 4) * 4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, 246);
    g.bezierCurveTo(x - 38 + i * 6, 180, x + 40 - i * 5, 100, x + (i - 3) * 3, 10);
    g.stroke();
  }
  // fade every edge so the sprite never shows a hard rectangle: soft top and bottom, then soft left and right
  g.globalCompositeOperation = 'destination-in';
  g.filter = 'none';
  const fade = g.createLinearGradient(0, 0, 0, 256);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.5, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fade; g.fillRect(0, 0, 128, 256);
  const side = g.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.3, 'rgba(0,0,0,1)'); side.addColorStop(0.7, 'rgba(0,0,0,1)'); side.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = side; g.fillRect(0, 0, 128, 256);
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
export async function initScene(canvas, { reduceMotion = false, lowEnd = false, onLost = () => {} } = {}) {
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
  // Built after the first frame (see the end of this function) so the cup appears sooner.
  let envTarget = null;
  const envIntensity = lowEnd ? 0 : 0.45;

  // ---------- Lighting: hemisphere + warm key + cool-ish rim ----------
  scene.add(new THREE.HemisphereLight(0xffe6cc, 0x3a2012, 0.55));
  const key = new THREE.DirectionalLight(0xffe0b8, 3.6);
  key.position.set(-3.5, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe0782b, 3.4); // ember rim to match the dark roast palette
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
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.74, 0.88, 0), new THREE.Vector3(1.08, 0.99, 0), new THREE.Vector3(1.36, 0.68, 0),
    new THREE.Vector3(1.14, 0.31, 0), new THREE.Vector3(0.56, 0.25, 0),
  ]);
  const handleGeo = track(new THREE.TubeGeometry(handleCurve, 48, 0.072, 16, false));
  const handle = new THREE.Mesh(handleGeo, ceramic);
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

  // Floating coffee beans: two instanced meshes (body + groove) so 16 beans cost two draw calls
  const BEAN_COUNT = 16;
  const beanGeo = track(new THREE.SphereGeometry(0.5, 20, 14));
  const beanMat = track(new THREE.MeshStandardMaterial({ color: 0x3a1d10, roughness: 0.5, metalness: 0 }));
  const grooveGeo = track(new THREE.SphereGeometry(0.5, 12, 8));
  const grooveMat = track(new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.8 }));
  const beanBodies = new THREE.InstancedMesh(beanGeo, beanMat, BEAN_COUNT);
  const beanGrooves = new THREE.InstancedMesh(grooveGeo, grooveMat, BEAN_COUNT);
  const beans = Array.from({ length: BEAN_COUNT }, (_, i) => {
    const a = (i / BEAN_COUNT) * Math.PI * 2 + Math.sin(i * 3.7) * 0.4;
    const r = 2.1 + ((i * 0.618) % 1) * 1.3;
    return { x: Math.cos(a) * r, y: -0.2 + ((i * 0.37) % 1) * 2.6, z: Math.sin(a) * r * 0.55 - 0.6, size: 0.16 + ((i * 0.29) % 1) * 0.1, rx: i * 1.3, ry: i * 0.7, spin: 0.25 + ((i * 0.53) % 1) * 0.5, phase: i * 1.9 };
  });
  const _m = new THREE.Matrix4(), _g = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  const _gl = new THREE.Matrix4().compose(new THREE.Vector3(0, 0.3, 0), new THREE.Quaternion(), new THREE.Vector3(0.96, 0.1, 0.12));
  function updateBeans(time) {
    beans.forEach((b, i) => {
      _e.set(b.rx + time * b.spin, b.ry + time * b.spin * 0.7, 0.4);
      _q.setFromEuler(_e);
      _v.set(b.x, b.y + Math.sin(time * 0.6 + b.phase) * 0.14, b.z);
      _s.set(b.size * 1.5, b.size * 0.95, b.size);
      _m.compose(_v, _q, _s);
      beanBodies.setMatrixAt(i, _m);
      _g.multiplyMatrices(_m, _gl);
      beanGrooves.setMatrixAt(i, _g);
    });
    beanBodies.instanceMatrix.needsUpdate = true;
    beanGrooves.instanceMatrix.needsUpdate = true;
  }
  beanBodies.frustumCulled = false; beanGrooves.frustumCulled = false;
  tilt.add(beanBodies, beanGrooves);

  // Steam: soft sprites that rise, sway, grow and fade
  const steamTex = track(makeBlobTexture('rgba(255,248,238,1)', 'rgba(255,244,230,A)'));
  const STEAM_COUNT = 22;
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
      q: 1,
    });
  }
  // Wisps: tall, streaky sprites that give the steam a more natural, curling look
  const wispTex = track(makeWispTexture());
  const wisps = [];
  for (let i = 0; i < 8; i++) {
    const mat = track(new THREE.SpriteMaterial({ map: wispTex, transparent: true, depthWrite: false, opacity: 0 }));
    const sprite = new THREE.Sprite(mat);
    tilt.add(sprite);
    wisps.push({ sprite, offset: i / 8, speed: 0.07 + (i % 3) * 0.01, x: Math.sin(i * 5.1) * 0.35, z: Math.cos(i * 2.7) * 0.25, phase: i * 2.2, q: 1 });
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
      s.sprite.material.opacity = Math.pow(fade, 1.4) * 0.6 * s.q;
    }
    for (const w of wisps) {
      const t = (time * w.speed + w.offset) % 1;
      w.sprite.position.set(w.x + Math.sin(t * 3.2 + w.phase) * 0.22, 0.5 + t * 2.4, w.z);
      const h = 0.9 + t * 1.5;
      w.sprite.scale.set(0.5 + t * 0.5, h, 1);
      w.sprite.material.rotation = Math.sin(t * 2.4 + w.phase) * 0.35;
      w.sprite.material.opacity = Math.pow(Math.sin(Math.PI * t), 1.2) * 0.55 * w.q;
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
    let downX = 0, downT = 0;
    on(canvas, 'pointerdown', (e) => {
      dragging = true; lastX = e.clientX; dragVel = 0; downX = e.clientX; downT = performance.now();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (e.pointerType === 'touch') requestTiltPermissionOnce();
    });
    on(canvas, 'pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      dragYaw += dx * 0.012; dragVel = dx * 0.012;
    });
    const end = () => { dragging = false; };
    on(canvas, 'pointerup', (e) => {
      // a quick tap or click (not a drag) gives the cup a spin
      if (Math.abs(e.clientX - downX) < 6 && performance.now() - downT < 350) dragVel = 0.32;
      end();
    });
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
    updateBeans(reduceMotion ? 2.1 : time);
    renderer.render(scene, camera);
  }
  let quality = 0, slow = 0, slowN = 0, warm = 0;
  function setQuality(q) {
    quality = q;
    if (q >= 1) {
      renderer.setPixelRatio(1); resize();
      beanBodies.visible = beanGrooves.visible = false;
      emberGeo.setDrawRange(0, 30);
    }
    if (q >= 2) {
      steam.forEach((s, i) => { s.q = i % 2 ? 0 : 1; });
      wisps.forEach((w) => { w.q = 0; });
      emberGeo.setDrawRange(0, 0);
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    if (++warm > 30 && raw < 0.25 && quality < 2) { slow += raw; slowN++; if (slow >= 2) { if (slow / slowN > 0.034) setQuality(quality + 1); slow = 0; slowN = 0; } }
    const dt = Math.min(0.05, raw || 0.016);
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

  if (lowEnd) setQuality(1);
  resize();
  draw(); // first frame before fade-in so the canvas is never blank
  sync();
  if (!lowEnd) {
    const later = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 800 }) : (f) => setTimeout(f, 250);
    later(async () => {
      try {
        if (disposed) return;
        const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
        if (disposed) return;
        const pmrem = new THREE.PMREMGenerator(renderer);
        envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = envTarget.texture;
        pmrem.dispose();
        if (reduceMotion) draw();
      } catch (err) { /* optional nicety: the direct lights still look fine without it */ }
    });
  }
  return { dispose };
}
