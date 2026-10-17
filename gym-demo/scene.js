// Iron & Ember Athletic Club: hero 3D scene (the only 3D feature on the site).
// An Olympic barbell built from code: a chrome bar with knurled grips, black rubber bumper plates with thin yellow rings,
// yellow collars, yellow and white rim lights, drifting chalk dust. It rolls slowly, tilts toward the mouse and spins faster when clicked or dragged.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ACCENT = 0xffe000; // the accent (yellow); change with the CSS --accent token

/** Diamond knurling: crossed diagonal grooves. Used as a colour map and a bump map on the bar grips. */
function makeKnurlTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c9ced2';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#3b4146';
  g.lineWidth = 3;
  for (let i = -128; i <= 256; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(i, 128); g.lineTo(i + 128, 0); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Plate face: near-black rubber with a faint moulded logo and weight, so the roll is visible. */
function makeFaceTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#101216';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#1d2126';
  g.lineWidth = 2;
  for (const r of [118, 100, 56]) { g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = '#2b3036';
  for (let i = 0; i < 12; i++) {
    g.save(); g.translate(128, 128); g.rotate((i * Math.PI) / 6); g.fillRect(-3, -110, 6, 14); g.restore();
  }
  g.textAlign = 'center';
  g.fillStyle = '#3a4047';
  g.font = '700 58px "Barlow Condensed", Impact, "Arial Narrow", sans-serif';
  g.fillText('IRON', 128, 112);
  g.font = '600 34px "Barlow Condensed", Impact, "Arial Narrow", sans-serif';
  g.fillText('20 KG', 128, 160);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Soft round blob used for glows and chalk dust. */
function makeBlobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{reduceMotion?: boolean, lowEnd?: boolean, onLost?: () => void}} opts
 * @returns {Promise<{dispose: () => void}>}
 */
export async function initScene(canvas, { reduceMotion = false, lowEnd = false, onLost = () => {} } = {}) {
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  // Reflection map for the chrome is built after the first frame (see the end of this function).
  let envTarget = null;
  const envIntensity = lowEnd ? 0.2 : 1;

  // ---------- Lighting: cool fill, white key, yellow and white rim lights from behind ----------
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0a0b0d, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rimAccent = new THREE.PointLight(ACCENT, 38, 16, 2);
  rimAccent.position.set(3.6, 1.6, -2.6);
  scene.add(rimAccent);
  const rimWhite = new THREE.PointLight(0xffffff, 30, 16, 2);
  rimWhite.position.set(-3.8, 2.2, -3);
  scene.add(rimWhite);
  const fillAccent = new THREE.PointLight(ACCENT, 6, 9, 2);
  fillAccent.position.set(0.5, -2, 3);
  scene.add(fillAccent);

  // ---------- Geometry ----------
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const seg = lowEnd ? 28 : 56;

  const chrome = track(new THREE.MeshStandardMaterial({ color: 0xe4e8ea, metalness: lowEnd ? 0.55 : 0.92, roughness: 0.2, envMapIntensity: envIntensity * 1.1 }));
  const knurlTex = track(makeKnurlTexture());
  const knurlBump = knurlTex;
  const knurled = track(new THREE.MeshStandardMaterial({ color: 0xffffff, map: knurlTex, bumpMap: knurlBump, bumpScale: 1.4, metalness: lowEnd ? 0.5 : 0.85, roughness: 0.34, envMapIntensity: envIntensity }));
  const rubber = track(new THREE.MeshStandardMaterial({ color: 0x16181c, metalness: 0.08, roughness: 0.62, envMapIntensity: envIntensity * 0.45 }));
  const faceTex = track(makeFaceTexture());
  const faceMat = track(new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.05, roughness: 0.7, envMapIntensity: envIntensity * 0.3 }));
  const accentMat = track(new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.4, metalness: 0.1, roughness: 0.38, envMapIntensity: envIntensity * 0.4 }));

  const bar = new THREE.Group(); // rolls about its own axis (X)

  // Shaft: smooth centre and ends, two knurled grips
  const cyl = (r, len, mat, x, segs = seg) => {
    const geo = track(new THREE.CylinderGeometry(r, r, len, segs, 1));
    geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.x = x;
    return m;
  };
  bar.add(cyl(0.052, 3.2, chrome, 0));
  for (const s of [-1, 1]) {
    const grip = cyl(0.056, 0.95, knurled, s * 0.82);
    grip.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2) a[i] = v * 13; else a[i] = v * 5; });
    bar.add(grip);
  }
  // Sleeves, shoulders and end caps
  for (const s of [-1, 1]) {
    bar.add(cyl(0.092, 1.3, chrome, s * 2.08));
    bar.add(cyl(0.13, 0.05, chrome, s * 1.46));
    bar.add(cyl(0.085, 0.04, chrome, s * 2.73));
  }

  // Plates: a lathe-turned bevelled disc, a moulded face, a thin yellow ring and a hairline ring on each side, a chrome hub ring
  const plateGeos = new Map();
  const plateGeo = (R, t) => {
    const key = R + '/' + t;
    if (!plateGeos.has(key)) {
      const h = t / 2, b = 0.05, hole = 0.095;
      const pts = [[hole, -h], [R - b, -h], [R - 0.012, -h + 0.012], [R, -h + b], [R, h - b], [R - 0.012, h - 0.012], [R - b, h], [hole, h], [hole, -h]].map(([x, y]) => new THREE.Vector2(x, y));
      const geo = track(new THREE.LatheGeometry(pts, seg * 2));
      geo.rotateZ(Math.PI / 2);
      plateGeos.set(key, geo);
    }
    return plateGeos.get(key);
  };
  const ringGeos = new Map();
  const ringGeo = (a, b) => {
    const key = a + '/' + b;
    if (!ringGeos.has(key)) ringGeos.set(key, track(new THREE.RingGeometry(a, b, seg * 2)));
    return ringGeos.get(key);
  };
  function makePlate(R, t) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(plateGeo(R, t), rubber));
    for (const s of [-1, 1]) {
      const x = s * (t / 2 + 0.0015), ry = s * Math.PI / 2;
      const parts = [
        [ringGeo(0.19, R * 0.78), faceMat, 0],
        [ringGeo(R * 0.8, R * 0.835), accentMat, 0.001],
        [ringGeo(R * 0.925, R * 0.937), accentMat, 0.001],
        [ringGeo(0.098, 0.19), chrome, 0.001],
      ];
      for (const [geo, mat, lift] of parts) {
        const m = new THREE.Mesh(geo, mat);
        m.position.x = x + s * lift;
        m.rotation.y = ry;
        g.add(m);
      }
    }
    return g;
  }
  const stack = [[1.0, 0.24, 1.7], [1.0, 0.24, 1.955], [0.74, 0.16, 2.17]]; // radius, thickness, centre x (one side)
  for (const s of [-1, 1]) {
    for (const [R, t, x] of stack) {
      const p = makePlate(R, t);
      p.position.x = s * x;
      p.rotation.x = s > 0 ? 0 : 0.6; // the two sides never line up, so the roll reads as real
      bar.add(p);
    }
    // Accent collar with a chrome lock face
    bar.add(cyl(0.17, 0.24, accentMat, s * 2.4));
    bar.add(cyl(0.06, 0.05, chrome, s * 2.545, 24));
  }

  const rig = new THREE.Group(); // yaw + tilt
  rig.add(bar);
  scene.add(rig);

  // Soft yellow and white halos behind the barbell
  const blobTex = track(makeBlobTexture());
  const haloAccent = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: blobTex, color: ACCENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.26 })));
  haloAccent.position.set(1.4, 0.2, -2.2); haloAccent.scale.set(6.4, 4.6, 1);
  const haloWhite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: blobTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.12 })));
  haloWhite.position.set(-1.8, 0.6, -2.4); haloWhite.scale.set(5, 4, 1);
  scene.add(haloAccent, haloWhite);

  // Chalk dust drifting up through the light
  const DUST = 60;
  const dustPos = new Float32Array(DUST * 3);
  const dust = Array.from({ length: DUST }, (_, i) => ({ x: Math.sin(i * 91.7) * 3.2, y: ((i * 0.618) % 1) * 6 - 3, z: Math.cos(i * 37.3) * 1.8, speed: 0.05 + ((i * 0.37) % 1) * 0.1, phase: i * 2.3 }));
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = track(new THREE.PointsMaterial({ map: blobTex, size: 0.1, color: 0xf4f6ee, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.frustumCulled = false;
  scene.add(dustPoints);
  function updateDust(time) {
    dust.forEach((d, i) => {
      dustPos[i * 3] = d.x + Math.sin(time * 0.35 + d.phase) * 0.2;
      dustPos[i * 3 + 1] = ((d.y + 3 + time * d.speed) % 6) - 3;
      dustPos[i * 3 + 2] = d.z;
    });
    dustGeo.attributes.position.needsUpdate = true;
    dustMat.opacity = 0.5 + 0.15 * Math.sin(time * 1.4);
  }

  // ---------- Sizing ----------
  function resize() {
    const w = Math.max(1, stage.clientWidth);
    const h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(1.95 / tanHalf, 2.75 / (tanHalf * camera.aspect));
    camera.position.set(0, 0.2, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (reduceMotion) draw();
  }

  // ---------- Interaction ----------
  const BASE_ROLL = 0.38;            // radians per second
  let rollSpeed = BASE_ROLL, spinBoost = 0, roll = 0.5;
  let dragYaw = 0, tiltX = 0, tiltZ = 0, targetX = 0, targetZ = 0, dragging = false, lastX = 0, downX = 0, downT = 0;
  let scrollP = 0;
  const cleanups = [];
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); };

  if (!reduceMotion) {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      on(window, 'pointermove', (e) => {
        if (e.pointerType !== 'mouse' || dragging) return;
        targetX = (e.clientY / window.innerHeight - 0.5) * 0.34;
        targetZ = -(e.clientX / window.innerWidth - 0.5) * 0.3;
      }, { passive: true });
    }
    // Drag to swing the barbell and spin it up; a quick tap gives it a burst of speed
    on(canvas, 'pointerdown', (e) => {
      dragging = true; lastX = downX = e.clientX; downT = performance.now();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    on(canvas, 'pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      dragYaw = clamp(dragYaw + dx * 0.006, -0.9, 0.9);
      spinBoost = clamp(spinBoost + Math.abs(dx) * 0.04, 0, 7);
    });
    const end = (e) => {
      if (e && e.type === 'pointerup' && Math.abs(e.clientX - downX) < 6 && performance.now() - downT < 350) spinBoost = 6;
      dragging = false;
    };
    on(canvas, 'pointerup', end);
    on(canvas, 'pointercancel', end);
    on(window, 'scroll', () => { scrollP = clamp(window.scrollY / window.innerHeight, 0, 1.2); }, { passive: true });
  }

  // ---------- Render loop ----------
  let raf = 0, last = 0, time = 0, inView = true, tabVisible = !document.hidden, disposed = false;
  let quality = 0, slow = 0, slowN = 0, warm = 0;

  function draw() {
    const t = reduceMotion ? 3 : time;
    rig.rotation.y = -0.38 + Math.sin(t * 0.3) * 0.3 + dragYaw;
    rig.rotation.x = tiltX;
    rig.rotation.z = 0.2 + tiltZ;
    rig.position.y = scrollP * 0.4;
    bar.rotation.x = roll;
    updateDust(t);
    renderer.render(scene, camera);
  }
  function setQuality(q) {
    quality = q;
    if (q >= 1) { renderer.setPixelRatio(1); resize(); dustGeo.setDrawRange(0, 24); }
    if (q >= 2) { dustGeo.setDrawRange(0, 0); haloAccent.visible = haloWhite.visible = false; }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    if (++warm > 30 && raw < 0.25 && quality < 2) { slow += raw; slowN++; if (slow >= 2) { if (slow / slowN > 0.034) setQuality(quality + 1); slow = 0; slowN = 0; } }
    const dt = Math.min(0.05, raw || 0.016);
    last = now; time += dt;
    spinBoost *= Math.pow(0.12, dt);                    // the burst eases back to the calm roll
    rollSpeed = BASE_ROLL + spinBoost;
    roll += rollSpeed * dt;
    if (!dragging) dragYaw *= Math.pow(0.2, dt);
    const k = 1 - Math.pow(0.001, dt);
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
  draw(); // first frame before the fade-in, so the canvas is never blank
  sync();

  // Chrome reflections: RoomEnvironment is built after the first frame, when the browser is idle
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
        if (reduceMotion || !raf) draw();
      } catch (err) { /* optional nicety: the direct lights still look fine without it */ }
    });
  }
  return { dispose };
}
