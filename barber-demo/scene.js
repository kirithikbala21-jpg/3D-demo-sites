// Brass & Blade: hero 3D scene (the only 3D feature on the site).
// A barber pole built from code: a glass tube, helical red / white / blue stripes that spin,
// brass caps and wall mount, red and blue neon halos, and a few drifting dust motes.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Helical stripes: one full turn rises one texture height, so wrapping the texture round a cylinder gives a spiral. */
function makeStripeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#F6F1E7';
  g.fillRect(0, 0, 256, 256);
  for (const [col, off] of [['#C21F2B', 0], ['#1F3F8C', 128]]) {
    g.fillStyle = col;
    for (let k = -2; k <= 2; k++) {
      const y = off + k * 256, h = 64;
      g.beginPath();
      g.moveTo(0, y); g.lineTo(256, y - 256); g.lineTo(256, y - 256 + h); g.lineTo(0, y + h);
      g.closePath(); g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  tex.anisotropy = 8;
  return tex;
}

/** Soft round blob used for halos and dust. */
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  // Reflection map for the brass and glass is built after the first frame (see the end of this function).
  let envTarget = null;
  const envIntensity = lowEnd ? 0.15 : 1;

  // ---------- Lighting: cool sky, warm key, red and blue shop-sign colours, glow inside the tube ----------
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a1418, 0.7));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const redLight = new THREE.PointLight(0xff3345, 30, 14, 2);
  redLight.position.set(-3.2, 0.4, 2.2);
  scene.add(redLight);
  const blueLight = new THREE.PointLight(0x4a7dff, 30, 14, 2);
  blueLight.position.set(3.2, 0.4, 2.2);
  scene.add(blueLight);
  const inner = new THREE.PointLight(0xfff2d6, 5, 5, 2);
  inner.position.set(0, 0, 0);
  scene.add(inner);

  // ---------- Geometry ----------
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const stripes = track(makeStripeTexture());
  const bodyMat = track(new THREE.MeshStandardMaterial({ map: stripes, emissive: 0xffffff, emissiveMap: stripes, emissiveIntensity: 0.38, roughness: 0.45, metalness: 0 }));
  const body = new THREE.Mesh(track(new THREE.CylinderGeometry(0.6, 0.6, 3.2, 64, 1, true)), bodyMat);

  const glassMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.13, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: envIntensity * 1.4 }));
  const glass = new THREE.Mesh(track(new THREE.CylinderGeometry(0.66, 0.66, 3.3, 64, 1, true)), glassMat);

  const brass = track(new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: lowEnd ? 0.45 : 0.92, roughness: 0.28, envMapIntensity: envIntensity * 1.2 }));
  const capProfile = [[0.001, 0], [0.72, 0], [0.72, 0.1], [0.66, 0.14], [0.66, 0.22], [0.58, 0.3], [0.42, 0.4], [0.22, 0.52], [0.1, 0.62], [0.001, 0.66]].map(([x, y]) => new THREE.Vector2(x, y));
  const capGeo = track(new THREE.LatheGeometry(capProfile, 64));
  const finialGeo = track(new THREE.SphereGeometry(0.13, 24, 16));
  const ringGeo = track(new THREE.TorusGeometry(0.675, 0.045, 14, 72));
  const topCap = new THREE.Mesh(capGeo, brass);
  topCap.position.y = 1.62;
  const topFinial = new THREE.Mesh(finialGeo, brass);
  topFinial.position.y = 1.62 + 0.76;
  const botCap = new THREE.Mesh(capGeo, brass);
  botCap.position.y = -1.62; botCap.rotation.x = Math.PI;
  const botFinial = new THREE.Mesh(finialGeo, brass);
  botFinial.position.y = -1.62 - 0.76;
  const ringTop = new THREE.Mesh(ringGeo, brass); ringTop.rotation.x = Math.PI / 2; ringTop.position.y = 1.64;
  const ringBot = new THREE.Mesh(ringGeo, brass); ringBot.rotation.x = Math.PI / 2; ringBot.position.y = -1.64;

  // Wall mount behind the pole
  const armGeo = track(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 20));
  const plateGeo = track(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 48));
  const armTop = new THREE.Mesh(armGeo, brass); armTop.rotation.x = Math.PI / 2; armTop.position.set(0, 1.1, -0.95);
  const armBot = new THREE.Mesh(armGeo, brass); armBot.rotation.x = Math.PI / 2; armBot.position.set(0, -1.1, -0.95);
  const plate = new THREE.Mesh(plateGeo, brass); plate.rotation.x = Math.PI / 2; plate.position.set(0, 0, -1.32); plate.scale.set(1, 1, 3.1);

  const pole = new THREE.Group();
  pole.add(body, glass, topCap, topFinial, botCap, botFinial, ringTop, ringBot, armTop, armBot, plate);
  scene.add(pole);

  // Fixed highlights on the glass, so they stay put while the stripes move
  const hlMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
  const hlGeo = track(new THREE.PlaneGeometry(0.07, 2.9));
  const hl1 = new THREE.Mesh(hlGeo, hlMat); hl1.position.set(-0.36, 0, 0.56); hl1.rotation.y = -0.55;
  const hl2 = new THREE.Mesh(hlGeo, hlMat); hl2.position.set(0.3, 0, 0.58); hl2.rotation.y = 0.45; hl2.scale.set(0.5, 0.8, 1);
  scene.add(hl1, hl2);

  // Neon halos: soft red on the left, blue on the right
  const blobTex = track(makeBlobTexture());
  const haloRed = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: blobTex, color: 0xff3b4a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })));
  haloRed.position.set(-1.5, 0.3, -1.6); haloRed.scale.set(5.4, 6.4, 1);
  const haloBlue = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: blobTex, color: 0x3c6de0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })));
  haloBlue.position.set(1.5, 0.3, -1.6); haloBlue.scale.set(5.4, 6.4, 1);
  scene.add(haloRed, haloBlue);

  // Dust motes drifting up through the light
  const DUST = 46;
  const dustPos = new Float32Array(DUST * 3);
  const dust = Array.from({ length: DUST }, (_, i) => ({ x: Math.sin(i * 91.7) * 2.6, y: ((i * 0.618) % 1) * 6 - 3, z: Math.cos(i * 37.3) * 1.6, speed: 0.06 + ((i * 0.37) % 1) * 0.12, phase: i * 2.3 }));
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = track(new THREE.PointsMaterial({ map: blobTex, size: 0.12, color: 0xffe9bf, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.frustumCulled = false;
  scene.add(dustPoints);
  function updateDust(time) {
    dust.forEach((d, i) => {
      dustPos[i * 3] = d.x + Math.sin(time * 0.4 + d.phase) * 0.18;
      dustPos[i * 3 + 1] = ((d.y + 3 + time * d.speed) % 6) - 3;
      dustPos[i * 3 + 2] = d.z;
    });
    dustGeo.attributes.position.needsUpdate = true;
    dustMat.opacity = 0.55 + 0.2 * Math.sin(time * 1.6);
  }

  // ---------- Sizing ----------
  function resize() {
    const w = Math.max(1, stage.clientWidth);
    const h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((5.6 / 2) / tanHalf, (3.2 / 2) / (tanHalf * camera.aspect));
    camera.position.set(0, 0.15, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (reduceMotion) draw();
  }

  // ---------- Interaction ----------
  const BASE_SPEED = 0.16;           // stripes per second
  let stripeSpeed = BASE_SPEED, spinBoost = 0;
  let dragYaw = 0, tiltX = 0, tiltZ = 0, targetX = 0, targetZ = 0, dragging = false, lastX = 0, downX = 0, downT = 0;
  let scrollP = 0;
  const cleanups = [];
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); };

  if (!reduceMotion) {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      on(window, 'pointermove', (e) => {
        if (e.pointerType !== 'mouse' || dragging) return;
        targetX = (e.clientY / window.innerHeight - 0.5) * 0.3;
        targetZ = -(e.clientX / window.innerWidth - 0.5) * 0.3;
      }, { passive: true });
    }
    // Drag to wind the stripes up and swing the pole; a quick tap gives the stripes a burst of speed
    on(canvas, 'pointerdown', (e) => {
      dragging = true; lastX = downX = e.clientX; downT = performance.now();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    on(canvas, 'pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      dragYaw = clamp(dragYaw + dx * 0.006, -0.9, 0.9);
      spinBoost = clamp(spinBoost + Math.abs(dx) * 0.012, 0, 2.4);
    });
    const end = (e) => {
      if (e && e.type === 'pointerup' && Math.abs(e.clientX - downX) < 6 && performance.now() - downT < 350) spinBoost = 2.2;
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
    pole.rotation.y = Math.sin(time * 0.35) * 0.22 + dragYaw;
    pole.rotation.x = tiltX;
    pole.rotation.z = tiltZ;
    pole.position.y = scrollP * 0.4;
    stripes.offset.y = reduceMotion ? 0.12 : -time * 0 - stripeOffset;
    updateDust(reduceMotion ? 3 : time);
    renderer.render(scene, camera);
  }
  let stripeOffset = 0;
  function setQuality(q) {
    quality = q;
    if (q >= 1) { renderer.setPixelRatio(1); resize(); dustGeo.setDrawRange(0, 20); }
    if (q >= 2) { dustGeo.setDrawRange(0, 0); haloRed.visible = haloBlue.visible = false; }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000;
    if (++warm > 30 && raw < 0.25 && quality < 2) { slow += raw; slowN++; if (slow >= 2) { if (slow / slowN > 0.034) setQuality(quality + 1); slow = 0; slowN = 0; } }
    const dt = Math.min(0.05, raw || 0.016);
    last = now; time += dt;
    spinBoost *= Math.pow(0.04, dt);                    // the burst eases back to the calm speed
    stripeSpeed = BASE_SPEED + spinBoost;
    stripeOffset += stripeSpeed * dt;
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
