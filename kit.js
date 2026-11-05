// Shared pieces for the 3D scenes (the hero card and the concept collection): shapes, procedural textures (brushed
// metal and basalt stone, drawn on a canvas: no image downloads) and the polished floor with a soft, blurred
// reflection that fades with distance.
import * as THREE from './vendor/three/three.module.min.js';
import { Reflector } from './vendor/three/addons/Reflector.js';

export function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// a flat rounded face with 0..1 UVs across its whole width and height
export function faceGeometry(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 12), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

// fine horizontal brushing: thin streaks of slightly different roughness
export function brushedTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d'); g.fillStyle = 'rgb(150,150,150)'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * c.height, v = 110 + Math.random() * 90, a = 0.25 + Math.random() * 0.5;
    g.strokeStyle = `rgba(${v},${v},${v},${a})`; g.lineWidth = Math.random() < 0.85 ? 1 : 2;
    const x = Math.random() * c.width * 0.4, len = c.width * (0.3 + Math.random() * 0.9);
    g.beginPath(); g.moveTo(x - 200, y); g.lineTo(x + len, y + (Math.random() - 0.5) * 1.2); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

// basalt: layered value noise with fine grain, as a greyscale map (used for colour variation, roughness and bump)
export function stoneTexture(size = 512, seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const grid = (n) => { const a = []; for (let i = 0; i < (n + 1) * (n + 1); i++) a.push(rnd()); return a; };
  const octaves = [[4, 0.45], [12, 0.3], [40, 0.15], [120, 0.1]].map(([n, w]) => [n, w, grid(n)]);
  const at = (a, n, x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const v = (i, j) => a[((yi + j) % n) * (n + 1) + ((xi + i) % n)];
    return v(0, 0) * (1 - sx) * (1 - sy) + v(1, 0) * sx * (1 - sy) + v(0, 1) * (1 - sx) * sy + v(1, 1) * sx * sy; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0; for (const [n, w, a] of octaves) v += at(a, n, (x / size) * n, (y / size) * n) * w;
    v = 0.35 + v * 0.5 + (rnd() - 0.5) * 0.08;
    const k = (y * size + x) * 4, b = Math.max(0, Math.min(255, v * 255));
    img.data[k] = img.data[k + 1] = img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// the floor: a mirror rendered at reduced resolution and sampled with a soft blur that grows with distance from
// the objects, fading out, so it reads as polished stone rather than glass
const FLOOR_SHADER = {
  name: 'SoftFloor',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: 0.32 }, reach: { value: 9.0 }, start: { value: -1.0 } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vPos;
    void main() { vPos = position.xy; vUv = textureMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float strength; uniform float reach; uniform float start; varying vec4 vUv; varying vec2 vPos;
    void main() {
      vec2 uv = vUv.xy / vUv.w; float d = clamp((vPos.y - start) / reach, 0.0, 1.0);
      float r = 0.0025 + d * 0.006; vec4 acc = vec4(0.0); float n = 0.0;
      for (int i = -3; i <= 3; i++) for (int j = -3; j <= 3; j++) { float w = exp(-float(i * i + j * j) / 6.0); acc += texture2D(tDiffuse, uv + vec2(float(i), float(j)) * r) * w; n += w; }
      acc /= n;
      float fade = (1.0 - smoothstep(0.0, 1.0, d)) * (1.0 - smoothstep(reach * 0.45, reach, abs(vPos.x)));
      gl_FragColor = vec4(acc.rgb * 0.6, acc.a * strength * fade);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
};

export function softFloor(w, d, { strength = 0.32, reach = 9, start = -1 } = {}) {
  const floor = new Reflector(new THREE.PlaneGeometry(w, d), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, shader: FLOOR_SHADER });
  floor.material.transparent = true; floor.material.depthWrite = false;
  floor.material.uniforms.strength.value = strength; floor.material.uniforms.reach.value = reach; floor.material.uniforms.start.value = start;
  floor.rotation.x = -Math.PI / 2;
  return floor;
}

// the house light colours
export const WARM = 0xffe9c7, WARM_HI = 0xfff6e5, RIM = 0xafc3ff;
