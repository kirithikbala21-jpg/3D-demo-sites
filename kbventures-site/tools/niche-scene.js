// Tool-only scene (loaded by tools/render-kb.mjs, never by the site): one arched niche in a basalt wall, lit by a
// warm spotlight with a faint haze, holding either a printed AceGuides guide (its real cover as the book cover) or
// the Black Crest titanium card. Each render becomes a still image for the lit niche galleries on the site.
import * as THREE from '../vendor/three/three.module.min.js';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { roundedRect, faceGeometry, brushedTexture, stoneTexture, softFloor, WARM } from '../kit.js';
import { CREST, LETTERS } from '../../black-crest-site/js/logo-mark.js';

const DEG = Math.PI / 180, NW = 1.9, NH = 3.3, SHELF = 1.0, DEPTH = 1.3;

function nicheShape() {
  const s = new THREE.Shape(), r = NW / 2, top = SHELF + NH - r;
  s.moveTo(-r, SHELF); s.lineTo(r, SHELF); s.lineTo(r, top); s.absarc(0, top, r, 0, Math.PI, false); s.lineTo(-r, SHELF);
  return s;
}
const load = (url) => new Promise((res) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));

function pagesTexture() { // the cut edge of a block of pages: fine cream lines
  const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#d9d2c2'; g.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(120,110,95,${0.12 + Math.random() * 0.18})`; g.fillRect(0, y, 64, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

async function book(cover) {
  const W = 1.12, H = W * 4 / 3, D = 0.12;
  const pages = new THREE.MeshStandardMaterial({ map: pagesTexture(), roughness: 0.9 });
  const pagesTop = new THREE.MeshStandardMaterial({ map: pagesTexture(), roughness: 0.9 }); pagesTop.map.rotation = Math.PI / 2;
  const spine = new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.55 }); // AceGuides deep ivory
  const front = new THREE.MeshStandardMaterial({ map: await load(cover), roughness: 0.45 });
  const back = new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.6 });
  // box faces: +x, -x, +y, -y, +z (front), -z (back)
  const m = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [pages, spine, pagesTop, pagesTop, front, back]);
  m.position.y = SHELF + H / 2 + 0.005; m.rotation.y = -16 * DEG;
  return m;
}

async function card() {
  const W = 1.712, H = 1.08, T = 0.016;
  const g = new THREE.Group();
  const face = new THREE.MeshPhysicalMaterial({ color: 0x1d1e23, metalness: 1, roughness: 0.36, roughnessMap: brushedTexture(), anisotropy: 0.75 });
  const edge = new THREE.MeshPhysicalMaterial({ color: 0x3a3b42, metalness: 1, roughness: 0.18 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(W, H, 0.06), { depth: T, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 2 }), edge);
  body.position.z = -T / 2; g.add(body);
  const front = new THREE.Mesh(faceGeometry(W - 0.01, H - 0.01, 0.055), face); front.position.z = T / 2 + 0.004; g.add(front);
  // the engraving, as on the Black Crest hero card
  try { await document.fonts.load('600 40px "Cormorant Garamond"'); } catch (_) {}
  const c = document.createElement('canvas'); c.width = 1712; c.height = 1080; const x = c.getContext('2d'); x.fillStyle = x.strokeStyle = '#fff';
  x.lineWidth = 3; x.beginPath(); x.roundRect(60, 60, 1592, 960, 34); x.stroke();
  x.save(); x.translate(146, 140); x.scale(6.75, 6.75); x.lineWidth = 1.5; x.stroke(new Path2D(CREST)); x.fill(new Path2D(LETTERS)); x.restore();
  x.font = '600 92px "Cormorant Garamond", Georgia, serif'; if ('letterSpacing' in x) x.letterSpacing = '32px'; x.fillText('BLACK CREST', 146, 864);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3, alphaMap: t, transparent: true, alphaTest: 0.35 });
  const etch = new THREE.Mesh(faceGeometry(W - 0.01, H - 0.01, 0.055), gold); etch.position.z = T / 2 + 0.006; g.add(etch);
  // leaning back on a small brushed stand
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.2), new THREE.MeshPhysicalMaterial({ color: 0x8e9198, metalness: 1, roughness: 0.3 }));
  stand.position.set(0, SHELF + 0.03, 0.02);
  g.rotation.set(-12 * DEG, -14 * DEG, 0); g.position.set(0, SHELF + 0.06 + H / 2 * Math.cos(12 * DEG), -0.06);
  const all = new THREE.Group(); all.add(g, stand); return all;
}

export async function render(box, { object = 'book', cover = '', level = 1 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(2); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.15; pm.dispose();
  const stone = stoneTexture(512, 9); stone.repeat.set(0.18, 0.18);
  const wallShape = new THREE.Shape(); wallShape.moveTo(-6, 0); wallShape.lineTo(6, 0); wallShape.lineTo(6, 7); wallShape.lineTo(-6, 7); wallShape.lineTo(-6, 0); wallShape.holes.push(nicheShape());
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape, { depth: 0.6, bevelEnabled: false, curveSegments: 24 }), new THREE.MeshStandardMaterial({ color: 0x1f2026, map: stone, roughnessMap: stone, roughness: 0.92, bumpMap: stone, bumpScale: 1.2 }));
  wall.position.z = -0.6; scene.add(wall);
  const inner = new THREE.Mesh(new THREE.ExtrudeGeometry(nicheShape(), { depth: DEPTH, bevelEnabled: false, curveSegments: 24 }), new THREE.MeshStandardMaterial({ color: 0x45464e, map: stone, roughnessMap: stone, roughness: 0.88, bumpMap: stone, bumpScale: 1.0, side: THREE.BackSide }));
  inner.position.z = -DEPTH; scene.add(inner);
  const lamp = new THREE.SpotLight(WARM, 70 * level, 7, 32 * DEG, 0.8, 1.2); lamp.position.set(0, SHELF + NH - 0.12, -0.55); lamp.target.position.set(0, SHELF, -0.7); scene.add(lamp, lamp.target);
  const front = new THREE.SpotLight(WARM, 10, 12, 18 * DEG, 0.9, 1.5); front.position.set(0, 4.5, 5); front.target.position.set(0, 1.8, -0.6); scene.add(front, front.target);
  const fill = new THREE.DirectionalLight(0xfff6e5, 0.5); fill.position.set(0, 6, 10); scene.add(fill);
  const obj = object === 'card' ? await card() : await book(cover); obj.position.z += -0.7; scene.add(obj);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.55, map: stone }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.002, 5); scene.add(ground);
  const floor = softFloor(14, 10, { strength: 0.5, reach: 6, start: -5 }); floor.rotation.z = Math.PI; floor.position.set(0, 0, 5); scene.add(floor);
  const camera = new THREE.PerspectiveCamera(30, box.clientWidth / box.clientHeight, 0.1, 50);
  camera.position.set(0, 2.5, 6.4); camera.lookAt(0, 2.35, -0.6);
  renderer.setSize(box.clientWidth, box.clientHeight, false); box.append(renderer.domElement);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}
