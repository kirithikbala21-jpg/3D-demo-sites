// "The concept collection": a dark basalt wall with six arched niches. Each niche has a warm spotlight with a faint
// haze cone, and holds a phone (a thin brushed-metal frame and black glass) showing that concept's real home page.
// A polished floor below holds soft reflections. Hover or focus on a niche's link warms its light, dims the rest to
// about 40% and turns its phone towards you; choosing it moves the camera into the niche, then opens the case study.
// The six links are real links in the page (see build.py), so all of this is optional: without WebGL, or on phones,
// the same links sit over still renders of the same scene.
// ?still=wall renders the whole wall once; ?still=niche&n=0..5 renders one niche close up (tools/render-gallery.mjs).
import * as THREE from '../vendor/three/three.module.min.js';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { roundedRect, faceGeometry, brushedTexture, stoneTexture, softFloor, WARM, WARM_HI } from './scene-kit.js';

const DEG = Math.PI / 180;
export const SLUGS = ['barber', 'cafe', 'gym', 'plumber', 'salon', 'parts'];
const N = 6, NW = 1.9, NH = 3.3, PITCH = 2.85, SHELF = 1.0, DEPTH = 1.3;
export const ASPECT = 2.35; // the stage keeps this shape on desktop, so the link positions stay put
const cxOf = (i) => (i - (N - 1) / 2) * PITCH;

function nicheShape(cx) {
  const s = new THREE.Shape(), r = NW / 2, top = SHELF + NH - r;
  s.moveTo(cx - r, SHELF); s.lineTo(cx + r, SHELF); s.lineTo(cx + r, top);
  s.absarc(cx, top, r, 0, Math.PI, false); s.lineTo(cx - r, SHELF);
  return s;
}

// a faint cone of light under each spotlight: brighter near the lamp, soft at its edges
function hazeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { level: { value: 1 }, color: { value: new THREE.Color(WARM) } },
    vertexShader: `varying float vH; varying vec3 vN; varying vec3 vV;
      void main() { vH = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float level; uniform vec3 color; varying float vH; varying vec3 vN; varying vec3 vV;
      void main() { float t = clamp(vH / 2.9 + 0.5, 0.0, 1.0); float edge = pow(abs(dot(vN, vV)), 2.0);
        gl_FragColor = vec4(color, pow(t, 1.6) * edge * 0.09 * level); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
}

export async function start(box, env = {}) {
  const q = new URLSearchParams(location.search), still = q.get('still'), only = still === 'niche' || still === 'detail' ? Number(q.get('n') || 0) : -1, detail = still === 'detail';
  const base = box.dataset.base || '';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!still });
  renderer.setPixelRatio(still ? 2 : Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement; canvas.className = 'gallery-canvas'; canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.12; pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(28, ASPECT, 0.1, 80);

  // the wall: a basalt slab with six arched openings, and a recessed niche behind each
  const stone = stoneTexture(512, 11); stone.repeat.set(0.18, 0.18);
  const wallShape = new THREE.Shape(); wallShape.moveTo(-15, 0); wallShape.lineTo(15, 0); wallShape.lineTo(15, 8.5); wallShape.lineTo(-15, 8.5); wallShape.lineTo(-15, 0);
  for (let i = 0; i < N; i++) wallShape.holes.push(nicheShape(cxOf(i)));
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f2026, map: stone, roughnessMap: stone, roughness: 0.92, bumpMap: stone, bumpScale: 1.2 });
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape, { depth: 0.6, bevelEnabled: false, curveSegments: 24 }), wallMat);
  wall.position.z = -0.6; scene.add(wall);
  const innerMat = new THREE.MeshStandardMaterial({ color: 0x45464e, map: stone, roughnessMap: stone, roughness: 0.88, bumpMap: stone, bumpScale: 1.0, side: THREE.BackSide });
  const brushed = brushedTexture();
  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x8e9198, metalness: 1, roughness: 0.3, roughnessMap: brushed, anisotropy: 0.6 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x030304, metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 });
  const sheenMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.18, depthWrite: false });
  const loader = new THREE.TextureLoader(), loads = [];
  const niches = [];
  for (let i = 0; i < N; i++) {
    const cx = cxOf(i);
    const inner = new THREE.Mesh(new THREE.ExtrudeGeometry(nicheShape(cx), { depth: DEPTH, bevelEnabled: false, curveSegments: 24 }), innerMat);
    inner.position.z = -DEPTH; scene.add(inner);
    const lamp = new THREE.SpotLight(WARM, 70, 7, 32 * DEG, 0.8, 1.2);
    lamp.position.set(cx, SHELF + NH - 0.12, -0.55); lamp.target.position.set(cx, SHELF, -0.7); scene.add(lamp, lamp.target);
    const haze = new THREE.Mesh(new THREE.ConeGeometry(0.78, 2.9, 40, 1, true), hazeMaterial());
    haze.position.set(cx, SHELF + NH - 0.12 - 1.45, -0.62); scene.add(haze);
    // the phone: a brushed-metal frame, black glass, the concept's own home page, and a faint glassy sheen
    const phone = new THREE.Group(), PW = 0.8, PH = 1.68, PR = 0.11;
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(PW, PH, PR), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 3, curveSegments: 10 }), frameMat);
    frame.position.z = -0.025; phone.add(frame);
    const glass = new THREE.Mesh(faceGeometry(PW - 0.012, PH - 0.012, PR - 0.006), glassMat); glass.position.z = 0.0365; phone.add(glass);
    const tex = await new Promise((res) => { loads.push(1); loader.load(`${base}img/work/${SLUGS[i]}-phone.webp`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)); });
    const screen = new THREE.Mesh(faceGeometry(PW - 0.05, PH - 0.07, PR - 0.03), new THREE.MeshBasicMaterial({ map: tex, color: 0x9a9a9a, toneMapped: false }));
    screen.position.z = 0.0372; phone.add(screen);
    const sheen = new THREE.Mesh(faceGeometry(PW - 0.012, PH - 0.012, PR - 0.006), sheenMat); sheen.position.z = 0.038; phone.add(sheen);
    const turn = (i < 3 ? 1 : -1) * 13 * DEG; // angled towards the centre of the wall
    phone.position.set(cx, SHELF + PH / 2 + 0.03, -0.72); phone.rotation.set(-5 * DEG, turn, 0); scene.add(phone);
    if (detail && i === only) { // the case study view: the laptop stands behind, the phone in front of it
      const lt = await new Promise((res) => loader.load(`${base}img/work/${SLUGS[i]}-desktop-1600.webp`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
      const LW = 1.62, LH = LW * 0.625, laptop = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(LW + 0.06, 1.0, 0.04), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), frameMat);
      deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.015, 0.5); laptop.add(deck);
      const lid = new THREE.Group(); lid.position.set(0, 0.03, 0); lid.rotation.x = -14 * DEG; laptop.add(lid);
      const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(LW + 0.06, LH + 0.06, 0.04), { depth: 0.025, bevelEnabled: false }), frameMat);
      shell.position.set(0, LH / 2 + 0.03, -0.03); lid.add(shell);
      const bezel = new THREE.Mesh(faceGeometry(LW + 0.04, LH + 0.04, 0.035), glassMat); bezel.position.set(0, LH / 2 + 0.03, -0.004); lid.add(bezel);
      const lscreen = new THREE.Mesh(faceGeometry(LW - 0.04, LH - 0.04, 0.01), new THREE.MeshBasicMaterial({ map: lt, color: 0x9a9a9a, toneMapped: false })); lscreen.position.set(0, LH / 2 + 0.035, -0.003); lid.add(lscreen);
      laptop.position.set(cx - 0.1, SHELF, -1.0); laptop.scale.setScalar(0.92); scene.add(laptop);
      phone.scale.setScalar(0.62); phone.position.set(cx + 0.55, SHELF + 1.68 * 0.62 / 2 + 0.03, -0.35); phone.rotation.set(-4 * DEG, -18 * DEG, 0);
    }
    niches.push({ cx, lamp, haze, phone, turn: phone.rotation.y, level: 1, goal: 1 });
  }
  // a dim fill so the wall face is not pure black, and the floor
  const fill = new THREE.DirectionalLight(WARM_HI, 0.6); fill.position.set(0, 6, 10); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, 14), new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.55, map: stone, roughnessMap: stone }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.002, 7); scene.add(ground); // polished black stone under the reflection
  const floor = softFloor(34, 14, { strength: 0.5, reach: 8, start: -7 }); floor.rotation.z = Math.PI; floor.position.set(0, 0, 7); scene.add(floor);

  const view = { pos: new THREE.Vector3(0, 2.7, 26), look: new THREE.Vector3(0, 2.45, 0) };
  const fit = () => {
    const w = Math.max(1, box.clientWidth), h = Math.max(1, box.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    view.pos.z = (17.6 / 2) / (Math.tan(camera.fov * DEG / 2) * camera.aspect);
    camera.position.copy(view.pos); camera.lookAt(view.look); camera.updateProjectionMatrix();
  };
  fit(); box.append(canvas);
  const apply = () => niches.forEach((n) => {
    n.lamp.intensity = 70 * n.level; n.haze.material.uniforms.level.value = n.level;
    n.lamp.color.set(WARM).lerp(new THREE.Color(WARM_HI), Math.max(0, n.level - 1) * 2);
    n.phone.rotation.y = n.turn - Math.sign(n.turn) * 8 * DEG * Math.max(0, Math.min(1, (n.level - 1) / 0.35));
  });

  if (still) {
    if (only >= 0) { // one niche, close up
      const n = niches[only]; camera.aspect = box.clientWidth / box.clientHeight; camera.fov = 30;
      if (detail) { camera.position.set(n.cx, 2.0, 5.0); camera.lookAt(n.cx, 1.95, -0.7); } else { camera.position.set(n.cx, 2.5, 6.4); camera.lookAt(n.cx, 2.35, -0.6); } camera.updateProjectionMatrix();
      niches.forEach((m, j) => { m.level = j === only ? 1.25 : 0.4; }); apply();
    } else apply();
    renderer.render(scene, camera); box.classList.add('is-live'); window.__galleryReady = true;
    // where each niche lands on screen, as percentages, for the links laid over the stills
    return niches.map((n) => {
      const r = NW / 2, pts = [[n.cx - r, SHELF], [n.cx + r, SHELF + NH]].map(([x, y]) => new THREE.Vector3(x, y, 0).project(camera));
      return { left: (pts[0].x + 1) * 50, right: (pts[1].x + 1) * 50, top: (1 - pts[1].y) * 50, bottom: (1 - pts[0].y) * 50 };
    });
  }

  // ---- interaction: the real links in the page drive the light
  const links = [...document.querySelectorAll('[data-niche]')];
  let active = -1, leaving = false;
  const setActive = (i) => { active = i; niches.forEach((n, j) => { n.goal = i < 0 ? 1 : j === i ? 1.35 : 0.4; }); play(); };
  links.forEach((a) => {
    const i = Number(a.dataset.niche);
    a.addEventListener('pointerenter', () => setActive(i)); a.addEventListener('focus', () => setActive(i));
    a.addEventListener('pointerleave', () => { if (!leaving) setActive(-1); }); a.addEventListener('blur', () => { if (!leaving) setActive(-1); });
    a.addEventListener('click', (e) => { // glide into the niche, then open the case study (a View Transition dissolves the pages)
      if (env.reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault(); leaving = true; setActive(i);
      const from = camera.position.clone(), look0 = view.look.clone(), to = new THREE.Vector3(niches[i].cx, 2.45, 4.2), look1 = new THREE.Vector3(niches[i].cx, 2.3, -0.7), t0 = performance.now();
      const glide = (now) => { const k = Math.min(1, (now - t0) / 1100), e2 = 1 - Math.pow(1 - k, 3);
        camera.position.lerpVectors(from, to, e2); camera.lookAt(new THREE.Vector3().lerpVectors(look0, look1, e2)); renderer.render(scene, camera);
        if (k < 1) requestAnimationFrame(glide); else location.href = a.href; };
      requestAnimationFrame(glide);
    });
  });

  // ---- render only while something is changing, and only on screen
  let visible = true, raf = 0, last = performance.now();
  const frame = (now) => {
    raf = 0; const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false;
    niches.forEach((n) => { const d = n.goal - n.level; if (Math.abs(d) > 0.002) { n.level += d * Math.min(1, dt * 2.2); moving = true; } else n.level = n.goal; });
    apply(); if (!leaving) renderer.render(scene, camera);
    if (moving && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf && visible && !document.hidden && !leaving) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; play(); }).observe(box);
  document.addEventListener('visibilitychange', play);
  addEventListener('resize', () => { fit(); apply(); renderer.render(scene, camera); });
  addEventListener('pageshow', (e) => { if (e.persisted) { leaving = false; fit(); setActive(-1); } }); // back from the case study
  apply(); renderer.render(scene, camera);
  requestAnimationFrame(() => box.classList.add('is-live'));
}
