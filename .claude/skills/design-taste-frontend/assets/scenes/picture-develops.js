// tasteskill / scenes / picture-develops.js — a drawing draws itself as the page scrolls (references/scenes.md).
//
// A near full-width pen drawing is held on the stage and laid down by the scroll: the heaviest strokes
// first, then the hatching, then the faint construction lines, each stroke growing along its own length
// like a pen, its newest stretch wet vermilion ink that dries black. Every inked point of the art gets an
// arrival order from its darkness and from when the pen reaches it (a stroke starts where the sweep and a
// coarse noise first touch it, then grows along itself), equalised by ink so coverage follows the
// scrollbar evenly on any drawing. The camera starts
// close on the heart of the drawing (scale 1.6) and pulls back to the whole sheet as it fills, so the
// scene opens on wet marks filling the stage, runs off the frame's edges while it draws, and ends on a
// wide establishing view. The page is never blank: seed strokes are already on the sheet when it arrives.
// The title is static and readable from the first frame; once the heavy outlines are down a short note
// rises in beside the title (on a phone it waits under the sheet from the start) while the hatching and
// the construction lines go on arriving, so every stretch of the hold adds something; the drawing
// dries and completes near the end, then a short still read before the page moves on.
// Use it when the subject owns high-contrast drawn material (sketches, plans, maps, scans) and the story
// is process. For a photograph use mode 'darkroom': the print develops, shadows first.
//
// DOM
//   <section class="scene" data-scene="picture-develops" data-options='{}' aria-labelledby="pd-title">
//     <div class="scene-stage">
//       <header class="pd-head">
//         <h2 class="pd-title" id="pd-title">Three to seven words, two lines at most</h2>
//         <p class="pd-note">25-40 words. Plain text is split into masked lines at runtime; a note with
//            inline markup (a link) is kept whole and rises as one block out of its own mask. On a phone it
//            sits under the sheet, shown from the start.</p>
//       </header>
//       <figure class="pd-frame">
//         <div class="pd-art">
//           <picture>
//             <source media="(max-aspect-ratio: 4/5)" srcset="drawing-portrait.svg">  (optional, 0.8-0.95:1, cut
//                       close round the drawing's main mass: phones and portrait tablets; chosen by shape)
//             <img src="drawing.svg" width="2880" height="1200" alt="One sentence describing the drawing" crossorigin="anonymous">
//           </picture>
//           <canvas class="pd-canvas" aria-hidden="true"></canvas>               (optional, made if missing)
//         </div>
//         <figcaption class="pd-caption">Subject and medium, 2-8 words</figcaption>
//       </figure>
//     </div>
//   </section>
//
// The art: one drawing, landscape 2:1 to 2.4:1, dark ink on white or on a transparent ground (SVG best;
// PNG; JPEG only at q85+), 8-24% of its area inked, with three visible tiers: heavy outlines, mid
// hatching, faint construction lines. Draw it with a heavy, loose pen: at its display size the heavy
// tier 5 CSS px or more, gone over twice where it matters, the hatching 2.5px or more as scribbled
// zig-zags, the construction lines about 2px; hairline art reads timid and breaks into dust on the wet
// front. On a 2880-wide sheet shown 1440 wide that is about 10-12 / 5-6 / 4 units. The art must be
// same-origin or served with CORS (crossorigin="anonymous"): the scene reads its pixels. An SVG is
// redrawn at whatever resolution the camera's close-up needs; a bitmap is never shown larger than its
// own pixels allow. Art too faint to order (under 3% of the area darker than mid grey), a tainted image
// or a failed decode all give the finished composition. Art denser than 35% is treated as a photograph
// (mode 'darkroom').
//
// The fit is read from the img's own CSS (object-fit, object-position) and copied exactly.
// Defaults: contain at 50% 100% on desktop, cover at 50% 55% on a phone.
//
// Tokens (on the section or the page; the scene takes the page's look)
//   --pd-paper   the sheet           default var(--paper, var(--ground, #f3f3f0))
//   --pd-ink     the drawn line      default var(--ink, #141413)   (12:1 or better on the paper)
//   --pd-accent  the wet edge only   default var(--accent, #e5401a) (3:1 or better on the paper; never on text)
//   The scene reads these on start and on every theme change (no new preparation). When the ink is
//   lighter than the paper (a dark page) it adds the class pd-invert itself, so the finished img (reduced
//   motion, rest) is shown inverted: dark art on a light sheet reads as light ink on the dark paper. A
//   page that must look right without script can put pd-invert on the section by hand.
//
// Options (data-options JSON)      default       range
//   mode         'ink'        'ink' (a drawing) | 'darkroom' (a photograph develops, shadows first)
//   hold         2            screens held on desktop, 1.6-3.5
//   phoneHold    1.5          screens held on a phone, 1.2-2.6
//   phone        'same'       'same' | 'rest' (the phone shows the finished composition)
//   sweep        'radial'     'radial' (outward from where the camera starts) | 'tl-down' | 'down' | 'up'
//                             | 'right' | 'left'
//   focus        (zoomFocus)  the origin of a radial sweep on the art, 'x% y%'; by default the point the
//                             camera starts on, so the drawing spreads from the middle of the opening view
//                             to the sheet's edges as the camera pulls back
//   inkWeight    0.40         0.25-0.60: higher is stricter darkest-first, lower a directional wipe
//   sweepWeight  0.36         0.20-0.60
//   coarse       0.14         0-0.20: where strokes start: higher starts more segments out of sweep order;
//                             faded out where the ink is dense, and there the pen runs along the hatching
//                             4x faster than across it, so a hatched block or a filled window arrives stroke
//                             by stroke behind one straight front, never as holes or a blot
//   fine         0            0-0.06: a stipple on the front; off by default, so the wet front reads as
//                             strokes, not dust, in the close-up (darkroom default 0.12)
//   edge         'accent'     'accent' (the wet edge; in darkroom a warm developer cast) | 'off'
//   band         0.10         0.04-0.16: width of the wet edge, in arrival order
//   strength     0.9          0.5-1: how much of the accent the newest marks carry
//   start        0.16         0.06-0.24: share of the order already on the sheet at progress 0 (never blank)
//   phoneStart   0.24         0.06-0.28: the same on a phone
//   scale        1.6          1-1.8: the camera's opening close-up; it pulls back to 1 as the drawing
//                             completes (power1.out, done at 0.88; even-paced on a phone); 1 turns the camera off
//   zoomFocus    '44% 46%'    the point of the drawing the camera starts on, brought to the frame's
//                             middle: put it on the densest mass of the drawing
//   phoneZoomFocus '50% 50%'  the same on a phone (the portrait art when there is one)
//   scrub        0.6          seconds of catch-up; true locks it to the scrollbar
//
// Progress map (desktop 1440x900, hold 2, ink mode, the demo's sheet; coverage = share of the final
// ink, which follows r: 0.16 + 0.94 x progress / 0.88; the camera's scale in brackets). The drawing runs
// over the whole hold, so no stretch of it stands still but the last read.
//   0          16%: the seed, seen close (1.6): the house's heaviest outlines round the middle of the
//              opening view as long strokes partly drawn, their newest stretches wet (vermilion), the first
//              ones already dried black; title readable, note not shown; the section arrives showing this
//   0.10       27%: the outlines grow along themselves toward the frame's edges, the dark windows filling,
//              wet tips on every growing stroke (1.47)
//   0.25       43%: the house's outlines nearly all in, the first hatching growing stroke by stroke from the
//              middle, the trees and the lowest terrace still arriving at the edges (1.31)
//   0.36-0.54  the note rises line by line out of its masks, beside the title, while the hatching goes on
//   0.50       69%: every outline and most of the hatching in (1.11)
//   0.70       91%: the ground and the construction lines arriving (1.03)
//   0.80-0.88  the wet edge dries; complete at 0.88: pure ink, scale 1, the finished drawing (the 2D
//              fallback hands over to the img here and takes the stage back if the page scrolls up)
//   0.88-1     a still read; the pin releases on the finished composition
// Phone (390x844, hold 1.5): the same camera on the portrait sheet (a close crop of the house, 0.8-0.95:1,
// so the frame is full from the first frame), from 50% 50%, pulling back at an even pace, with more seed
// (24% / 34% / 48% / 73% at 0 / 0.10 / 0.25 / 0.50); the note sits under the sheet from the first frame,
// so the screen is a whole page (title, drawing, note) all the way through. Coverage follows r within a
// few % on any suitable art (the order is equalised by ink).
//
// Rendering: WebGL2 where it exists. The order is prepared on the CPU at about display size: each inked
// pixel's start time (sweep and noise), then a shortest-path search along the strokes (the pen: a mark is
// reached from an earlier mark of about the same darkness; in dense hatching it keeps to the hatching's
// direction), then darkness first, equalised; a stroke's soft rim takes its core's order exactly, so a line
// arrives across its whole width and its wet stretch never has a rim of another colour, while a fainter
// line that only touches it keeps its own time (no stubs sprouting from a heavy line). A fragment shader
// reads that order image and colours every device pixel from a texture of the art (four taps a pixel), with
// the camera inside the shader: the close-up is drawn at full device resolution, never an enlarged bitmap;
// a pen end and a wet-dry boundary are cut over 1.5 device pixels; where strokes of different times meet,
// each pixel takes the time of the stroke whose darkness it matches; the finished frame matches the img,
// and a frame costs one draw call (nothing at all while the scroll stands still). Without WebGL2 a 2D
// canvas does the same on the CPU (a frame rewrites only the marks inside the moving front, the camera a CSS transform, the img
// taking over at 0.88). Preparing starts as soon as the picture has decoded and runs in tasks of about
// 8ms that give the page a turn between them (the one longer task is the browser creating the WebGL
// context): the order and a first texture first, so the seed shows within a few frames of the picture,
// then the art again at the resolution the close-up needs, strip by strip (an SVG is redrawn sharp, up to
// 4096px).
(() => {
  const Scenes = (window.Scenes = window.Scenes || {});
  const DRAW = 0.88;        // the drawing is complete here (r reaches its end): it runs over the whole hold
  const DRY = [0.8, 0.88];  // the wet edge dries over this span
  const NOTE = 0.36;        // the note starts rising here (desktop), once the heavy outlines are down
  const R_END = 1.1;       // 1 + the widest band, so no tint is ever left
  const RAMP = 0.005;      // a mark goes from nothing to full ink over this much order: a crisp pen end, not a fade
  const WET = 0.004;       // ...and from wet (accent) to dry (ink) over this much: fresh ink, not a glow
                           // (the 2D canvas; the GPU cuts both over 1.5 screen pixels of the order's own slope)
  const RAMP_GL = '0.0001'; // the GPU's shortest cut, where the order is flat or two strokes meet
  const PEN = 2.4;         // a stroke, once started, grows along itself this much faster than the sweep moves
  const GAP = 0.16;        // marks this close in darkness belong to the same stroke (the pen follows them)
  const DENSE = [0.28, 0.42]; // local ink density over which the pen keeps more and more to the hatching's direction
  const ANI = 4;              // ...where it runs along the strokes this much faster than across them
  const BINS = 1024;       // the equalising histogram
  const STRIP = 0.15e6;    // pixels rasterised per task
  const TILES = 16;        // (2D) the canvas is uploaded in a 16x16 grid of tiles, only where marks changed
  const SWEEPS = ['tl-down', 'down', 'up', 'right', 'left', 'radial'];
  const LITTLE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const num = (v, d) => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? d : +v);
  const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  // 'x% y%' -> [0-1, 0-1]
  const point = (s, d) => {
    const v = String(s || d).trim().split(/\s+/).map((p) => (Number.isFinite(parseFloat(p)) ? clamp(parseFloat(p) / 100) : 0.5));
    if (v.length < 2) v.push(v[0]);
    return v;
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const vector = (src) => /^data:image\/svg|\.svg([?#]|$)/i.test(src || '');

  // seeded generator: the same noise on every visit
  const rng = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // short tasks: preparation yields to the page between its steps, and a newer request cancels it
  const CANCEL = { cancelled: true };
  const pause = (job) => new Promise((res) => setTimeout(res, 0)).then(() => { if (job.cancelled) throw CANCEL; job.t = performance.now(); });
  // a long loop asks now and then whether its task has run for a few milliseconds, and gives the page a turn
  const due = (job) => { const t = performance.now(); if (!job.t) job.t = t; return t - job.t > 8; };

  // any CSS colour to [r, g, b]: hex and rgb() are read directly (a canvas readback costs tens of ms the
  // first time, on the main thread); anything else (oklch(), color-mix()...) through a 1px canvas
  let probe = null;
  const rgbOf = (css, fallback) => {
    const s = String(css || fallback).trim();
    let m = /^#([0-9a-f]{3,8})$/i.exec(s);
    if (m && m[1].length !== 5 && m[1].length !== 7) {
      let h = m[1];
      if (h.length < 6) h = h.replace(/./g, (q) => q + q);
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*[,/)]/i.exec(s);
    if (m && !s.includes('%')) return [+m[1], +m[2], +m[3]].map((v) => Math.round(clamp(v, 0, 255)));
    try {
      if (!probe) { const c = document.createElement('canvas'); c.width = c.height = 1; probe = c.getContext('2d', { willReadFrequently: true }); }
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = fallback; probe.fillStyle = css || fallback;
      probe.fillRect(0, 0, 1, 1);
      const d = probe.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    } catch { return [20, 20, 19]; }
  };

  // one object-position component: a share of the free space (0-1) or a length in px
  const posPart = (s, free) => {
    s = (s || '').trim();
    if (s.endsWith('%')) return (free * parseFloat(s)) / 100;
    if (s.endsWith('px')) return parseFloat(s);
    return free / 2;
  };

  // ---- the GPU renderer ----
  // A full-screen triangle; the fragment shader undoes the camera, reads the art, computes the mark's
  // arrival order exactly as the CPU analysis does (darkness, sweep, coarse lattice noise, fine noise),
  // equalises it through the CDF and colours it. uTex is the part of the art the texture holds (art uv).
  const VS = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2. - 1., 0., 1.); }`;
  // A drawing's order is prepared on the CPU (marks grow along their own strokes, see analyse) and read
  // from a texture (uOrd); a photograph's (darkroom) is worked out here per device pixel. No screen-space
  // derivatives anywhere: the texture gradients come from the camera's own numbers, because dFdx/dFdy next
  // to an early return are undefined (some GPU compilers move them past it, which drew a grey line along
  // the art's edge).
  const FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uArt, uCdf, uLat, uOrd;
uniform vec2 uView, uBox, uPan, uLatN, uFineN;
uniform vec4 uFit, uTex, uOrdRect, uVis, uCam, uW, uTone;
uniform vec3 uFocus, uLevels, uInk, uAccent;
uniform float uR, uAcc, uBand;
uniform int uSweep, uLuma;
out vec4 o;
float lumOf(vec4 t) { return uLuma == 1 ? t.r : dot(t.rgb, vec3(.2126, .7152, .0722)); }
void main() {
  vec2 p = vec2(gl_FragCoord.x, uView.y - gl_FragCoord.y) * uBox / uView;
  vec2 uv = (uCam.xy + (p - uPan - uCam.xy) / uCam.z - uFit.xy) / uFit.zw;
  vec2 tuv = (uv - uTex.xy) / uTex.zw;
  // one device pixel in texture space (the camera only scales and pans, so this is exact)
  vec2 gx = vec2(uBox.x / (uView.x * uCam.z * uFit.z * uTex.z), 0.), gy = vec2(0., uBox.y / (uView.y * uCam.z * uFit.w * uTex.w));
  // only the part of the art the frame shows at rest (the close-up enlarges that, never more of the sheet)
  if (uv.x < uVis.x || uv.y < uVis.y || uv.x > uVis.z || uv.y > uVis.w) { o = vec4(0.); return; }
  bool dark = uLevels.z > .5;
  // bare paper (most of a drawing): one blurred look tells there is no ink near this pixel
  if (!dark && lumOf(textureGrad(uArt, tuv, gx * 2., gy * 2.)) > .97) { o = vec4(0.); return; }
  // four taps a pixel (a rotated grid, each from the sharper mip level): crisp where the art is shown
  // smaller than its texture, smooth where the close-up enlarges it
  vec2 h1 = gx * .5, h2 = gy * .5;
  vec4 t = (textureGrad(uArt, tuv + .125 * gx + .375 * gy, h1, h2) + textureGrad(uArt, tuv - .125 * gx - .375 * gy, h1, h2) +
            textureGrad(uArt, tuv + .375 * gx - .125 * gy, h1, h2) + textureGrad(uArt, tuv - .375 * gx + .125 * gy, h1, h2)) * .25;
  float L = lumOf(t);
  float ink = clamp((uLevels.x - L) / uLevels.y, 0., 1.);
  if (!dark && ink < .02) { o = vec4(0.); return; }
  if (!dark) {
    // the order between the four nearest texels. Along a stroke it is blended, and the pen's end and the
    // wet-dry boundary are cut over a pixel and a half of the screen (from the order's own slope there):
    // a crisp nib and fresh ink, never an airbrushed fade. Where strokes of different times meet, each
    // texel's own state (drawn or not, wet or dry) is weighted by how well the pixel's darkness matches
    // that texel's stroke and by its distance: the junction follows the drawing's own edges, smoothly,
    // not the order image's texels as steps.
    ivec2 on = textureSize(uOrd, 0);
    vec2 ot = (uv - uOrdRect.xy) / uOrdRect.zw * vec2(on) - .5;
    ivec2 o0 = ivec2(floor(ot)), hi = on - 1;
    vec2 of = ot - floor(ot);
    vec2 e0 = texelFetch(uOrd, clamp(o0, ivec2(0), hi), 0).rg, e1 = texelFetch(uOrd, clamp(o0 + ivec2(1, 0), ivec2(0), hi), 0).rg;
    vec2 e2 = texelFetch(uOrd, clamp(o0 + ivec2(0, 1), ivec2(0), hi), 0).rg, e3 = texelFetch(uOrd, clamp(o0 + ivec2(1, 1), ivec2(0), hi), 0).rg;
    float al, m;
    if (max(max(e0.x, e1.x), max(e2.x, e3.x)) - min(min(e0.x, e1.x), min(e2.x, e3.x)) < .03) {
      float d = uR - mix(mix(e0.x, e1.x, of.x), mix(e2.x, e3.x, of.x), of.y);
      vec2 tpp = vec2(on) / (uOrdRect.zw * uFit.zw) * uBox / (uView * uCam.z);
      vec2 gr = vec2(mix(e1.x - e0.x, e3.x - e2.x, of.y), mix(e2.x - e0.x, e3.x - e1.x, of.x)) * tpp;
      float rmp = max(1.5 * length(gr), ${RAMP_GL});
      al = clamp(d / rmp, 0., 1.);
      m = clamp((uBand - d) / rmp, 0., 1.);
    } else {
      vec4 w = vec4((1. - of.x) * (1. - of.y), of.x * (1. - of.y), (1. - of.x) * of.y, of.x * of.y);
      w /= .04 + abs(vec4(e0.y, e1.y, e2.y, e3.y) - ink);
      w /= dot(w, vec4(1.));
      vec4 dd = uR - vec4(e0.x, e1.x, e2.x, e3.x);
      vec4 a4 = clamp(dd / ${RAMP_GL}, 0., 1.);
      al = dot(w, a4);
      m = dot(w * a4, clamp((uBand - dd) / ${RAMP_GL}, 0., 1.)) / max(al, 1e-4);
    }
    if (al <= 0.) { o = vec4(0.); return; }
    // ink is wet or dry: the newest stretch of a stroke is fully the accent, then it dries in one step
    m *= uAcc;
    float k = 1. - L;
    float tone = uTone.w > .5 ? k : clamp(uTone.z > .5 ? (k - uTone.x) / uTone.y : (uTone.x - 1. + k) / uTone.y, 0., 1.);
    float a = tone * al * smoothstep(.02, .06, ink);
    o = vec4(mix(uInk, uAccent, m) * a, a);
    return;
  }
  float d;
  {
    float sw;
    if (uSweep == 0) sw = .75 * uv.y + .25 * uv.x;
    else if (uSweep == 1) sw = uv.y;
    else if (uSweep == 2) sw = 1. - uv.y;
    else if (uSweep == 3) sw = uv.x;
    else if (uSweep == 4) sw = 1. - uv.x;
    else sw = min(1., length(uv - uFocus.xy) / uFocus.z);
    vec2 c = uv * uLatN; ivec2 i = ivec2(floor(c)); vec2 f = fract(c); f = f * f * (3. - 2. * f);
    float co = mix(mix(texelFetch(uLat, i, 0).r, texelFetch(uLat, i + ivec2(1, 0), 0).r, f.x),
                   mix(texelFetch(uLat, i + ivec2(0, 1), 0).r, texelFetch(uLat, i + ivec2(1, 1), 0).r, f.x), f.y);
    vec2 fc = floor(uv * uFineN);
    float fi = fract(52.9829189 * fract(.06711056 * fc.x + .00583715 * fc.y));
    float b = clamp(dot(uW, vec4(1. - ink, sw, co, fi)), 0., 1.) * 1024.;
    int ib = min(int(b), 1023);
    float lo = ib > 0 ? texelFetch(uCdf, ivec2(ib - 1, 0), 0).r : 0.;
    d = uR - mix(lo, texelFetch(uCdf, ivec2(ib, 0), 0).r, min(1., b - float(ib)));
  }
  // a photograph (darkroom): its own colour arrives by order; the developer's warm cast fades across the band
  float al = clamp(d / ${RAMP}, 0., 1.);
  if (al <= 0.) { o = vec4(0.); return; }
  float u = clamp(d / uBand, 0., 1.);
  o = vec4(mix(t.rgb, vec3(.353, .227, .133), .35 * uAcc * (1. - u)) * al, al);
}`;
  const UNIFORMS = ['uArt', 'uCdf', 'uLat', 'uOrd', 'uView', 'uBox', 'uPan', 'uLatN', 'uFineN', 'uFit', 'uTex', 'uOrdRect', 'uVis', 'uCam', 'uW', 'uTone', 'uFocus', 'uLevels', 'uInk', 'uAccent', 'uR', 'uAcc', 'uBand', 'uSweep', 'uLuma'];
  const startGL = (canvas) => {
    let gl = null;
    try { gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch {}
    if (!gl) return null;
    // compiled in the background where the browser can (KHR_parallel_shader_compile); checked before use
    const par = gl.getExtension('KHR_parallel_shader_compile');
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(prog, s);
    }
    gl.linkProgram(prog);
    return { gl, prog, par, U: null, max: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096 };
  };

  Scenes['picture-develops'] = (root, opts = {}) => {
    if (!root || !window.Stage) return null;
    const frame = root.querySelector('.pd-frame');
    const art = root.querySelector('.pd-art');
    const img = art && art.querySelector('img');
    const note = root.querySelector('.pd-note');
    const lowEnd = !!((navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2));
    if (!frame || !art || !img) return Stage.scene(root, { build: null });

    let mode = opts.mode === 'darkroom' ? 'darkroom' : 'ink';
    const hold = clamp(num(opts.hold, 2), 1.6, 3.5);
    const phoneHold = clamp(num(opts.phoneHold, 1.5), 1.2, 2.6);
    const sweep = SWEEPS.includes(opts.sweep) ? opts.sweep : 'radial';
    const focusOpt = opts.focus ? point(opts.focus, '50% 50%') : null;
    const zoomDesk = point(opts.zoomFocus, '44% 46%');
    const zoomPhone = point(opts.phoneZoomFocus, '50% 50%');
    const wInk = clamp(num(opts.inkWeight, 0.4), 0.25, 0.8);
    const wSweep = clamp(num(opts.sweepWeight, 0.36), 0.1, 0.6);
    const wCoarse = clamp(num(opts.coarse, 0.14), 0, 0.2);
    const wFine = clamp(num(opts.fine, 0), 0, 0.12);
    const edgeOn = opts.edge !== 'off';
    const band = clamp(num(opts.band, 0.1), 0.04, 0.16);
    const strength = clamp(num(opts.strength, 0.9), 0.5, 1);
    const startDesk = clamp(num(opts.start, 0.16), 0.06, 0.24);
    const startPhone = clamp(num(opts.phoneStart, Math.max(0.24, startDesk)), 0.06, 0.28);
    const scaleFrom = clamp(num(opts.scale, 1.6), 1, 1.8);
    const scrub = opts.scrub ?? 0.6;
    let R0 = startDesk;

    // ---- the canvas and its renderer: WebGL2 (made when the picture is ready, not while the page
    // loads), or a 2D canvas when there is none ----
    let canvas = art.querySelector('canvas.pd-canvas');
    if (!canvas) { canvas = document.createElement('canvas'); canvas.className = 'pd-canvas'; canvas.setAttribute('aria-hidden', 'true'); art.appendChild(canvas); }
    let G = null, g2 = null, glTried = false;
    const use2D = () => {
      // a canvas that once gave a WebGL context cannot give a 2D one: swap in a fresh element
      if (G) { const c = canvas.cloneNode(false); canvas.replaceWith(c); canvas = c; G = null; }
      if (!g2) g2 = canvas.getContext('2d');
      canvas.style.willChange = 'transform';
    };
    const onLost = (e) => {
      // a lost GPU context shows the finished picture until the context is back, then prepares again
      e.preventDefault();
      if (job) job.cancelled = true;
      job = null; P = null;
      setDone(true);
    };
    const onRestored = () => { G = startGL(canvas); if (!G) use2D(); requestPrep(); };
    const ensureRenderer = (m) => {
      if (glTried) return;
      glTried = true;
      // sized before the context exists, so its drawing buffer is made once, at the size it is used
      if (m) { const k = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(5e6 / (m.bw * m.bh))); canvas.width = Math.max(1, Math.round(m.bw * k)); canvas.height = Math.max(1, Math.round(m.bh * k)); }
      G = startGL(canvas);
      if (!G) { use2D(); return; }
      canvas.addEventListener('webglcontextlost', onLost);
      canvas.addEventListener('webglcontextrestored', onRestored);
    };

    // ---- state ----
    let P = null;            // the prepared art (tables and texture, or the 2D buffers)
    let tl = null;           // the current timeline (desktop and phone each build their own)
    let live = false, phone = false, failed = false, drawn = false, done = false, dirty = true, mm = null;
    let lastR = -1, lastA = -1, lastCam = '', reqToken = 0, job = null, prepTimer = 0;
    let inkRGB = [20, 20, 19], accRGB = [229, 64, 26], colourKey = '', invert = false, handOff = true;
    const tone = [0.95, 0.88, 0, 0]; // paper luminance, ink-paper span, inverted, flat
    // the camera at timeline time t: the pull-back runs with the drawing, done at 0.88 (power1.out on a
    // wide frame; on a phone's tall frame at an even pace, so the close-up stays on drawn marks while the
    // sheet's top and bottom are still arriving). The scale and the pan come from the aim read at the last
    // measure, so a resize never leaves stale numbers. origin is the point it starts on (box px).
    const camAt = (t) => {
      if (!zoom()) return [1, 0, 0];
      const u = clamp(t / DRAW), e = phone ? u : 1 - (1 - u) * (1 - u), v = 1 - e;
      return [scaleFrom + (1 - scaleFrom) * e, pan[0] * v, pan[1] * v];
    };
    let origin = [0, 0], pan = [0, 0];
    // (2D) the canvas's opacity for every darkness of the art (0-255), so a mark drawn in --pd-ink over
    // --pd-paper lands on the same tone the img shows there: the hand-over to the img is seamless
    const AL = new Float32Array(256);

    const readColours = () => {
      const cs = getComputedStyle(root);
      const ik = cs.getPropertyValue('--pd-ink').trim(), ac = cs.getPropertyValue('--pd-accent').trim(), pp = cs.getPropertyValue('--pd-paper').trim();
      const key = ik + '|' + ac + '|' + pp;
      if (key === colourKey) return false;
      colourKey = key;
      inkRGB = rgbOf(ik, '#141413');
      accRGB = rgbOf(ac, '#e5401a');
      const paper = rgbOf(pp, '#f3f3f0');
      const li = lum(inkRGB), lp = lum(paper);
      // light ink on dark paper: the finished img is shown inverted (derived, not a class to remember;
      // a photograph in darkroom mode is never inverted)
      invert = li > lp;
      root.classList.toggle('pd-invert', invert && mode === 'ink');
      // the img (inverted or not) shows grey art as its own tone; the canvas reaches that tone with this
      // opacity of the ink. Tokens too close to tell apart fall back to plain darkness.
      const span = invert ? li - lp : lp - li;
      tone[0] = lp; tone[1] = Math.max(span, 1e-3); tone[2] = invert ? 1 : 0; tone[3] = span < 0.2 ? 1 : 0;
      for (let k = 0; k < 256; k++) {
        const d = k / 255;
        AL[k] = span < 0.2 ? d : clamp(invert ? (d - lp) / span : (lp - 1 + d) / span);
      }
      // the img can take over only when it looks like the canvas: a near-neutral ink at the dark (or,
      // inverted, the light) end. A coloured ink keeps the canvas to the end. (A darkroom print always
      // can: the canvas draws the photograph's own colours.)
      const chroma = Math.max(...inkRGB) - Math.min(...inkRGB);
      handOff = chroma < 28 && (invert ? li > 0.78 : li < 0.2);
      if (G && G.U) colourGL();
      return true;
    };

    // where the scroll has the drawing: everything follows the timeline's own time (0-1)
    const now = () => (tl ? Math.min(1, tl.time()) : 0);
    const rAt = (t) => R0 + (R_END - R0) * clamp(t / DRAW);
    const accentAt = (t) => (t <= DRY[0] ? 1 : t >= DRY[1] ? 0 : 1 - (t - DRY[0]) / (DRY[1] - DRY[0]));

    // ---- the note, split into masked lines (re-split when its width or the fonts change) ----
    let lines = [], noteText = null, noteW = 0;
    const plainNote = note && !note.children.length;
    // a note with inline markup is not split (its links and emphasis stay as they are): it is wrapped
    // whole in one mask and rises as a block, so it never slides over the frame unclipped
    const wrapNote = () => {
      let inner = note.querySelector(':scope > .pd-line > .pd-line-in');
      if (!inner) {
        const outer = document.createElement('span');
        outer.className = 'pd-line';
        inner = document.createElement('span');
        inner.className = 'pd-line-in';
        while (note.firstChild) inner.appendChild(note.firstChild);
        outer.appendChild(inner);
        note.appendChild(outer);
      }
      inner.__y = null;
      lines = [inner];
    };
    const splitNote = () => {
      if (!note) { lines = []; return; }
      if (!plainNote) { wrapNote(); return; }
      if (noteText === null) noteText = note.textContent.trim();
      const words = noteText.split(/\s+/);
      note.style.width = '';
      note.innerHTML = words.map((w) => `<span class="pd-w">${esc(w)}</span>`).join(' ');
      // the note keeps the width its wrapped text gives it (block lines alone would shrink it to the longest
      // line, and the finished frame would sit a few px off the finished composition)
      const nw = note.getBoundingClientRect().width;
      const groups = [];
      let top = null;
      for (const w of note.querySelectorAll('.pd-w')) {
        const t = w.offsetTop;
        if (top === null || Math.abs(t - top) > 3) { groups.push([]); top = t; }
        groups[groups.length - 1].push(w.textContent);
      }
      note.innerHTML = groups.map((g) => `<span class="pd-line"><span class="pd-line-in">${esc(g.join(' '))}</span></span>`).join(' ');
      lines = [...note.querySelectorAll('.pd-line-in')];
      note.style.width = nw ? `${nw}px` : '';
      noteW = window.innerWidth;
      for (const l of lines) l.__y = null;
    };
    const unsplitNote = () => {
      if (note && plainNote && noteText !== null) { note.textContent = noteText; note.style.width = ''; }
      if (note && !plainNote) {
        const outer = note.querySelector(':scope > .pd-line');
        const inner = outer && outer.firstElementChild;
        if (inner) { while (inner.firstChild) note.insertBefore(inner.firstChild, outer); outer.remove(); }
      }
      lines = [];
    };
    const applyNote = (t) => {
      const n = lines.length;
      if (!n) return;
      // on a phone the note sits under the sheet from the first frame: its row is never bare paper while
      // the drawing fills the frame above it, and nothing ever crosses it
      if (phone) t = 1;
      const st = n > 1 ? Math.min(0.02, 0.08 / (n - 1)) : 0;
      for (let i = 0; i < n; i++) {
        const p = clamp((t - NOTE - i * st) / 0.1);
        const e = 1 - (1 - p) * (1 - p) * (1 - p); // power3.out
        const y = Math.round((1 - e) * 1100) / 10;
        const el = lines[i];
        if (el.__y === y) continue;
        el.__y = y;
        el.style.transform = y ? `translate3d(0, ${y}%, 0)` : '';
        el.style.opacity = e >= 1 ? '' : e.toFixed(3);
      }
    };

    // ---- measuring: the art box and the picture's fit inside it ----
    const measure = () => {
      const bw = art.offsetWidth, bh = art.offsetHeight;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      if (!bw || !bh || !iw || !ih) return null;
      const cs = getComputedStyle(img);
      const fit = cs.objectFit || 'fill';
      let sx, sy;
      if (fit === 'fill') { sx = bw / iw; sy = bh / ih; }
      else {
        let s = fit === 'cover' ? Math.max(bw / iw, bh / ih) : fit === 'none' ? 1 : Math.min(bw / iw, bh / ih);
        if (fit === 'scale-down') s = Math.min(1, s);
        sx = sy = s;
      }
      const dw = iw * sx, dh = ih * sy;
      const pos = (cs.objectPosition || '50% 50%').split(/\s+(?![^(]*\))/);
      const dx = posPart(pos[0], bw - dw), dy = posPart(pos[1] || pos[0], bh - dh);
      // the part of the art the box shows (art uv): all the camera ever needs
      const vis = [clamp(-dx / dw), clamp(-dy / dh), clamp((bw - dx) / dw), clamp((bh - dy) / dh)];
      return { bw, bh, dx, dy, dw, dh, vis, src: img.currentSrc || img.src, fit, pos: cs.objectPosition, phone };
    };
    const zoom = () => scaleFrom > 1.001;
    const zoomAt = () => (phone ? zoomPhone : zoomDesk);

    // the camera: it starts close on a point of the drawing (zoomFocus) brought to the middle of the
    // view, and pulls back to the whole sheet. The point is the origin the scale grows round and the pan
    // carries it to the frame's centre; both are read again at every measure.
    const aim = (m) => {
      const z = zoomAt();
      const bw = m ? m.bw : art.offsetWidth, bh = m ? m.bh : art.offsetHeight;
      const fx = m ? clamp(m.dx + z[0] * m.dw, 0, bw) : z[0] * bw;
      const fy = m ? clamp(m.dy + z[1] * m.dh, 0, bh) : z[1] * bh;
      origin = [fx, fy];
      pan = zoom() ? [Math.round(bw / 2 - fx), Math.round(bh / 2 - fy)] : [0, 0];
      if (g2) canvas.style.transformOrigin = `${fx.toFixed(1)}px ${fy.toFixed(1)}px`;
      lastCam = '';
    };

    // ---- preparing the art: the order of every mark ----
    // The art is rasterised at about display size, strip by strip, onto white
    const raster = async (m, k, j) => {
      const W = Math.max(1, Math.round(m.bw * k)), H = Math.max(1, Math.round(m.bh * k));
      const data = new Uint8ClampedArray(W * H * 4);
      const SH = Math.max(1, Math.ceil(STRIP / W));
      const c = document.createElement('canvas');
      c.width = W;
      const cx = c.getContext('2d', { willReadFrequently: true });
      for (let y0 = 0; y0 < H; y0 += SH) {
        const h = Math.min(SH, H - y0);
        if (c.height !== h) c.height = h;
        cx.imageSmoothingQuality = 'high';
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, h);
        cx.drawImage(img, m.dx * k, m.dy * k - y0, m.dw * k, m.dh * k);
        data.set(cx.getImageData(0, 0, W, h).data, y0 * W * 4); // throws on a tainted canvas
        await pause(j);
      }
      c.width = c.height = 0;
      return { W, H, data };
    };
    // ...and read: the art check, the photograph test and the ink-weighted histogram of the raw order,
    // whose CDF equalises the order so coverage follows the scroll linearly on any art. The 2D renderer
    // also keeps every inked pixel, bucketed by order.
    const analyse = async (m, k, j, full) => {
      const { W, H, data } = await raster(m, k, j);
      const ax = m.dx * k, ay = m.dy * k, aw = m.dw * k, ah = m.dh * k;
      const x0 = Math.max(0, Math.floor(ax)), x1 = Math.min(W, Math.ceil(ax + aw));
      const y0 = Math.max(0, Math.floor(ay)), y1 = Math.min(H, Math.ceil(ay + ah));
      const artArea = Math.max(1, (x1 - x0) * (y1 - y0));
      // luminance of the art's part of the raster (paper white elsewhere)
      const LUM = new Float32Array(W * H).fill(1);
      for (let y = y0; y < y1; y++) {
        for (let x = x0, i = y * W + x0, p = i * 4; x < x1; x++, i++, p += 4) LUM[i] = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
        if (due(j)) await pause(j);
      }
      // the marks (ink 0.04 and up, or every pixel of a photograph), gathered once. INKF is the pixel's
      // own ink (its weight); INKO orders it. A pixel on the soft edge of a line (a clearly darker neighbour
      // on one side, a lighter one or paper on the other) is ordered by that line's darkness and later takes
      // its order exactly (RIMN), so a line arrives across its whole width; a fainter line that only touches
      // or crosses a heavy one has no lighter side there and keeps its own darkness and time, so it never
      // sprouts stubs when the heavy line arrives
      let CAND, INKF, INKO, DARK, RIMN, count, dark, wp, span;
      const N8 = [1, W + 1, W, W - 1, -1, -W - 1, -W, -W + 1]; // the 8 neighbours, in turn round the pixel
      for (;;) {
        dark = mode === 'darkroom';
        wp = dark ? 0.98 : 0.92; span = wp - (dark ? 0.05 : 0.18);
        const cut = dark ? 0 : 0.04;
        const dL = 0.15 * span, eL = 0.06 * span, tL = GAP * span;
        CAND = new Uint32Array(Math.max(1, artArea >> 2)); INKF = new Float32Array(CAND.length); INKO = new Float32Array(CAND.length); DARK = new Uint8Array(CAND.length); RIMN = new Int32Array(CAND.length);
        count = 0;
        let n04 = 0, n50 = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0, i = y * W + x0; x < x1; x++, i++) {
            const L = LUM[i];
            let ink = (wp - L) / span;
            ink = ink < 0 ? 0 : ink > 1 ? 1 : ink;
            if (ink >= 0.04) n04++;
            if (ink > 0.5) n50++;
            if (ink < cut) continue;
            if (count === CAND.length) {
              const n2 = count * 2;
              const c2 = new Uint32Array(n2); c2.set(CAND); CAND = c2;
              const f2 = new Float32Array(n2); f2.set(INKF); INKF = f2;
              const o2 = new Float32Array(n2); o2.set(INKO); INKO = o2;
              const k2 = new Uint8Array(n2); k2.set(DARK); DARK = k2;
              const r2 = new Int32Array(n2); r2.set(RIMN); RIMN = r2;
            }
            let Lo = L, rim = -1;
            if (!dark && x > 0 && y > 0 && x < W - 1 && y < H - 1) {
              // the far side (the pixel opposite the darker one) under half this pixel's ink, its two flanks
              // lighter than this pixel: an edge, not a fainter line running into the darker one
              const lt = 0.5 * (wp + L), lf = L + 0.03 * span, tl = L - tL;
              for (let n = 0; n < 8; n++) {
                const a = LUM[i + N8[n]];
                if (a >= Lo) continue;
                if (a < L - dL && LUM[i + N8[(n + 4) & 7]] > lt && LUM[i + N8[(n + 3) & 7]] > lf && LUM[i + N8[(n + 5) & 7]] > lf) { Lo = a; rim = i + N8[n]; }
                // ...and a darker neighbour of the same tier is this pixel's own line too (the soft edge of
                // a grey hatch line, a thin line whose pixels catch it unevenly): one darkness, one time
                else if (a < L - eL && a >= tl) { Lo = a; rim = i + N8[n]; }
              }
            }
            const io = (wp - Lo) / span;
            CAND[count] = i; INKF[count] = ink; INKO[count] = io < 0 ? 0 : io > 1 ? 1 : io; DARK[count] = ((1 - L) * 255 + 0.5) | 0; RIMN[count] = rim; count++;
          }
          if (due(j)) await pause(j);
        }
        if (!dark && n04 / artArea > 0.35) { mode = 'darkroom'; root.classList.remove('pd-invert'); continue; } // a photograph
        if (!dark && n50 / artArea < 0.03) throw new Error('art too faint to draw');
        break;
      }
      const wI = dark && opts.inkWeight == null ? 0.7 : wInk;
      const wS = dark && opts.sweepWeight == null ? 0.18 : wSweep;
      const wC = dark && opts.coarse == null ? 0 : wCoarse;
      const wF = dark && opts.fine == null ? 0.12 : wFine;
      const sum = wI + wS + wC + wF;
      const wts = [wI / sum, wS / sum, wC / sum, wF / sum];
      // coarse value noise on a lattice of 1/64 of the art's width (1/40 on a phone): where strokes start;
      // fine noise on cells of 1.5 CSS px (1 on a phone). Both live on the art, not the screen.
      const LX = m.phone ? 40 : 64, LY = (LX * m.dh) / m.dw;
      const cols = LX + 2, rows = Math.ceil(LY) + 2;
      const lat = new Float32Array(cols * rows);
      const rnd = rng(7);
      for (let i = 0; i < lat.length; i++) lat[i] = rnd();
      const NF = [Math.max(1, Math.round(m.dw / (m.phone ? 1 : 1.5))), Math.max(1, Math.round(m.dh / (m.phone ? 1 : 1.5)))];
      const fz = focusOpt || zoomAt();
      const rmax = Math.hypot(Math.max(fz[0], 1 - fz[0]), Math.max(fz[1], 1 - fz[1])) || 1;
      const sw0 = SWEEPS.indexOf(sweep);
      // a drawing: where the ink is dense (a hatched block, a filled window) the coarse noise is faded out,
      // so the block never opens as holes, and the pen is held to the hatching's own direction (below), so
      // the block fills stroke by stroke behind one front instead of spreading through it as a blot. The
      // density is the share of ink in a box about one lattice cell wide, the direction the structure of the
      // ink's edges in the same box: both from a grid of small cells blurred twice, read bilinearly.
      let DG = null, JA = null, JB = null, JD = null, gc = 1, GW = 0, GH = 0;
      if (!dark) {
        gc = Math.max(2, Math.round(aw / LX / 3));
        GW = Math.ceil(W / gc) + 1; GH = Math.ceil(H / gc) + 1;
        const N = GW * GH, tmp = new Float32Array(N);
        DG = new Float32Array(N); JA = new Float32Array(N); JB = new Float32Array(N); JD = new Float32Array(N);
        for (let c = 0; c < count; c++) {
          const i = CAND[c], y = (i / W) | 0, x = i - y * W, g = ((y / gc) | 0) * GW + ((x / gc) | 0);
          DG[g] += INKF[c];
          if (x > 0 && y > 0 && x < W - 1 && y < H - 1) {
            const ex = LUM[i + 1] - LUM[i - 1], ey = LUM[i + W] - LUM[i - W];
            JA[g] += ex * ex; JB[g] += ex * ey; JD[g] += ey * ey;
          }
          if ((c & 4095) === 4095 && due(j)) await pause(j);
        }
        const R = 2;
        for (const a of [DG, JA, JB, JD]) {
          for (let y = 0; y < GH; y++) {
            for (let x = 0; x < GW; x++) { let s = 0; for (let q = -R; q <= R; q++) { const xx = x + q; if (xx >= 0 && xx < GW) s += a[y * GW + xx]; } tmp[y * GW + x] = s; }
          }
          for (let y = 0; y < GH; y++) {
            for (let x = 0; x < GW; x++) { let s = 0; for (let q = -R; q <= R; q++) { const yy = y + q; if (yy >= 0 && yy < GH) s += tmp[yy * GW + x]; } a[y * GW + x] = s; }
          }
          if (due(j)) await pause(j);
        }
        const n = (2 * R + 1) * (2 * R + 1) * gc * gc;
        for (let g = 0; g < N; g++) DG[g] /= n;
      }
      // per mark (a drawing): the direction across its hatching (NX, NY) and how strongly the pen keeps to
      // it (AW: dense and clearly directed ink only; 0 on open outlines)
      const NX = DG ? new Float32Array(count) : null, NY = DG ? new Float32Array(count) : null, AW = DG ? new Float32Array(count) : null;
      // where each mark starts: the sweep, the coarse lattice noise and the fine noise, in order units;
      // a photograph's order is this plus its darkness, per pixel
      const T = new Float32Array(count);
      for (let c = 0; c < count; c++) {
        const i = CAND[c];
        const y = (i / W) | 0, x = i - y * W;
        let xn = (x + 0.5 - ax) / aw, yn = (y + 0.5 - ay) / ah;
        xn = xn < 0 ? 0 : xn > 1 ? 1 : xn; yn = yn < 0 ? 0 : yn > 1 ? 1 : yn;
        const sw = sw0 === 0 ? 0.75 * yn + 0.25 * xn : sw0 === 1 ? yn : sw0 === 2 ? 1 - yn : sw0 === 3 ? xn : sw0 === 4 ? 1 - xn : Math.min(1, Math.hypot(xn - fz[0], yn - fz[1]) / rmax);
        let u = 0;
        if (DG) {
          const gx = (x + 0.5) / gc - 0.5, gy = (y + 0.5) / gc - 0.5;
          const qx = gx < 0 ? 0 : gx | 0, qy = gy < 0 ? 0 : gy | 0, fx = gx - qx, fy = gy - qy, o2 = qy * GW + qx;
          const bil = (G) => { const t0 = G[o2] + (G[o2 + 1] - G[o2]) * fx, t1 = G[o2 + GW] + (G[o2 + GW + 1] - G[o2 + GW]) * fx; return t0 + (t1 - t0) * fy; };
          const den = bil(DG);          u = (den - 0.24) / 0.22;
          u = u < 0 ? 0 : u > 1 ? 1 : u;
          u = u * u * (3 - 2 * u);
          const ja = bil(JA), jb = bil(JB), jd = bil(JD), tr = ja + jd;
          if (tr > 1e-6) {
            const th = 0.5 * Math.atan2(2 * jb, ja - jd), coh = Math.sqrt((ja - jd) * (ja - jd) + 4 * jb * jb) / tr;
            let v = (den - DENSE[0]) / (DENSE[1] - DENSE[0]), k = (coh - 0.2) / 0.35;
            v = v < 0 ? 0 : v > 1 ? 1 : v; k = k < 0 ? 0 : k > 1 ? 1 : k;
            NX[c] = Math.cos(th); NY[c] = Math.sin(th); AW[c] = v * v * (3 - 2 * v) * k;
          }
        }
        let co = 0;
        if (wC) {
          const cx = xn * LX, ix = cx | 0, tx = cx - ix, sx = tx * tx * (3 - 2 * tx);
          const cy = yn * LY, iy = cy | 0, ty = cy - iy, sy = ty * ty * (3 - 2 * ty);
          const o = iy * cols + ix;
          const a0 = lat[o] + (lat[o + 1] - lat[o]) * sx;
          const a1 = lat[o + cols] + (lat[o + cols + 1] - lat[o + cols]) * sx;
          co = a0 + (a1 - a0) * sy;
          co += (0.5 - co) * u;
        }
        let fi = 0;
        if (wF) {
          const f1 = 0.06711056 * Math.floor(xn * NF[0]) + 0.00583715 * Math.floor(yn * NF[1]);
          const f2 = 52.9829189 * (f1 - Math.floor(f1));
          fi = f2 - Math.floor(f2);
        }
        T[c] = wts[1] * sw + wts[2] * co + wts[3] * fi;
        if ((c & 4095) === 4095 && due(j)) await pause(j);
      }
      DG = JA = JB = JD = null;      let MAP = null;
      if (!dark) {
        // A drawing: the pen. Every mark may start at its own time (above), or be reached sooner along its
        // own stroke from a mark that started earlier: a stroke grows from where it starts, at PEN times
        // the sweep's pace, through marks of about the same darkness (a shortest-path search over the inked
        // pixels). So a stroke arrives as segments growing along it, the wet edge is the growing end, and
        // nothing ever opens a hole across a line.
        MAP = new Int32Array(W * H).fill(-1);
        for (let c = 0; c < count; c++) MAP[CAND[c]] = c;
        if (due(j)) await pause(j);
        const rs = sw0 === 5 ? rmax : 1;
        const sp = wts[1] / PEN;
        const sx = sp / (aw * rs), sy = sp / (ah * rs), sd = Math.hypot(sx, sy);
        // a bucket queue (times quantised far finer than one step's cost): every mark is first queued at its
        // own start time; a mark taken from the queue is final and offers its neighbours an earlier time
        let tmax = 0;
        for (let c = 0; c < count; c++) if (T[c] > tmax) tmax = T[c];
        const NB = 32768, bw = (tmax || 1) / (NB - 1);
        const head = new Int32Array(NB).fill(-1);
        let cap = count * 2 + 16, en = 0;
        let enext = new Int32Array(cap), enode = new Int32Array(cap);
        for (let c = 0; c < count; c++) { const q = (T[c] / bw) | 0; enode[en] = c; enext[en] = head[q]; head[q] = en++; }
        const done = new Uint8Array(count);
        let pops = 0;
        for (let q = 0; q < NB; q++) {
          while (head[q] >= 0) {
            const e = head[q], c = enode[e];
            head[q] = enext[e];
            if (done[c]) continue;
            done[c] = 1;
            const k = T[c], i = CAND[c], y = (i / W) | 0, x = i - y * W, io = INKO[c], nx = NX[c], ny = NY[c];
            const aw2 = AW[c] > 0 ? (1 - AW[c] * (1 - 1 / ANI)) ** 2 : 0;
            for (let n = 0; n < 8; n++) {
              const dx = n < 3 ? -1 : n < 5 ? 0 : 1, dy = n === 0 || n === 3 || n === 5 ? -1 : n === 1 || n === 6 ? 0 : 1;
              const xx = x + dx, yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
              const c2 = MAP[i + dy * W + dx];
              if (c2 < 0 || done[c2]) continue;
              const g = INKO[c2] - io;
              if (g > GAP || g < -GAP) continue;
              // in dense hatching the pen runs along the strokes ANI times faster than across them, so each
              // stroke arrives whole and the block fills behind one straight front
              let s = dx && dy ? sd : dx ? sx : sy;
              if (aw2) { const pr = dx * nx + dy * ny, c2 = (pr * pr) / (dx && dy ? 2 : 1); s *= Math.sqrt(c2 + (1 - c2) * aw2); }
              const t = k + s;
              if (t < T[c2]) {
                T[c2] = t;
                if (en === cap) {
                  cap *= 2;
                  const a2 = new Int32Array(cap); a2.set(enext); enext = a2;
                  const b2 = new Int32Array(cap); b2.set(enode); enode = b2;
                }
                const q2 = Math.max(q, (t / bw) | 0);
                enode[en] = c2; enext[en] = head[q2]; head[q2] = en++;
              }
            }
            if ((++pops & 1023) === 0 && due(j)) await pause(j);
          }
        }
      }
      // the order: darkness first, then the time the pen reaches the mark (equalised by its CDF, weighted by
      // ink, so coverage follows the scroll linearly on any art)
      const RAW = new Float32Array(count);
      const hist = new Float64Array(BINS);
      for (let c = 0; c < count; c++) {
        const raw = wts[0] * (1 - INKO[c]) + T[c];
        RAW[c] = raw;
        hist[Math.min(BINS - 1, Math.max(0, (raw * BINS) | 0))] += dark ? 1 : INKF[c];
        if ((c & 32767) === 32767 && due(j)) await pause(j);
      }
      const cdf = new Float32Array(BINS);
      let total = 0;
      for (let b = 0; b < BINS; b++) total += hist[b];
      for (let b = 0, acc = 0; b < BINS; b++) { acc += hist[b]; cdf[b] = acc / (total || 1); }
      if (due(j)) await pause(j);
      const ORD = new Float32Array(count);
      for (let c = 0; c < count; c++) {
        const b = Math.min(1, Math.max(0, RAW[c])) * BINS, ib = Math.min(BINS - 1, b | 0);
        const lo = ib ? cdf[ib - 1] : 0;
        ORD[c] = lo + (cdf[ib] - lo) * Math.min(1, b - ib);
        if ((c & 32767) === 32767 && due(j)) await pause(j);
      }
      if (due(j)) await pause(j);
      if (MAP) {
        // the soft edge of a stroke takes its stroke's order exactly, so a stroke's rim never arrives
        // before its core (a dry rim on a wet line) or after it (a wet rim on a dry one). Two passes, so an
        // outer rim reads the inner rim's order.
        for (let pass = 0; pass < 2; pass++) {
          for (let c = 0; c < count; c++) {
            const r = RIMN[c];
            if (r >= 0) { const c2 = MAP[r]; if (c2 >= 0) ORD[c] = ORD[c2]; }
          }
          if (due(j)) await pause(j);
        }
        MAP = null;
      }
      const base = { dark, wp, span, wts, sweep: sw0, fz, rmax, lat, cols, rows, LX, LY, NF, cdf, W, H };
      if (!full) {
        // (GPU) a drawing's order as an image over the raster (order, and the darkness of the stroke the
        // texel belongs to: where strokes of different times meet, the shader gives each sharp pixel the
        // order of the stroke it matches), grown three pixels past the marks so the sharper texture's soft
        // edges read their own stroke's order; bare paper arrives last
        let ord = null;
        if (!dark) {
          ord = new Float32Array(W * H * 2);
          for (let i = 0; i < W * H; i++) ord[2 * i] = 1;
          const mark = new Uint8Array(W * H);
          let front = new Int32Array(count), fn = count;
          for (let c = 0; c < count; c++) { const i = CAND[c]; ord[2 * i] = ORD[c]; ord[2 * i + 1] = INKO[c]; mark[i] = 1; front[c] = i; }
          let next = new Int32Array(Math.max(16, count));
          for (let pass = 2; pass < 5; pass++) {
            let nn = 0;
            for (let f = 0; f < fn; f++) {
              const i = front[f], y = (i / W) | 0, x = i - y * W, v = ord[2 * i], vk = ord[2 * i + 1];
              for (let dy = y > 0 ? -1 : 0; dy <= (y < H - 1 ? 1 : 0); dy++) {
                for (let dx = x > 0 ? -1 : 0; dx <= (x < W - 1 ? 1 : 0); dx++) {
                  const n = i + dy * W + dx, mk = mark[n];
                  if (mk && mk < pass) continue;
                  if (mk === pass) { if (v < ord[2 * n]) { ord[2 * n] = v; ord[2 * n + 1] = vk; } }
                  else {
                    mark[n] = pass; ord[2 * n] = v; ord[2 * n + 1] = vk;
                    if (nn === next.length) { const n2 = new Int32Array(nn * 2); n2.set(next); next = n2; }
                    next[nn++] = n;
                  }
                }
              }
              if ((f & 1023) === 1023 && due(j)) await pause(j);
            }
            const t = front; front = next; next = t.length >= nn ? t : new Int32Array(nn); fn = nn;
          }
        }
        return { ...base, data, ord };
      }

      // (2D) the marks, bucketed by arrival order (a counting sort), so a frame only touches the orders
      // whose look changed; and for each order the tiles of a 16x16 grid it touches, so a frame only
      // uploads the dirty tiles
      const start = new Uint32Array(257);
      const O8 = new Uint8Array(count);
      for (let c = 0; c < count; c++) { O8[c] = Math.round(255 * ORD[c]); start[O8[c] + 1]++; }
      for (let o = 0; o < 256; o++) start[o + 1] += start[o];
      const fill = start.slice(0, 256);
      const IDX = new Uint32Array(count);
      const INK = new Uint8Array(count);
      const SRC = dark ? new Uint32Array(count) : null;
      const d32 = dark ? new Uint32Array(data.buffer) : null;
      const tiles = new Uint16Array(256 * TILES);
      for (let c = 0; c < count; c++) {
        const i = CAND[c], o = O8[c], jj = fill[o]++;
        const y = (i / W) | 0, x = i - y * W;
        IDX[jj] = i;
        INK[jj] = DARK[c];
        if (dark) SRC[jj] = d32[i];
        tiles[o * TILES + ((y * TILES) / H | 0)] |= 1 << ((x * TILES) / W | 0);
      }
      return { ...base, IDX, INK, SRC, start, tiles };
    };

    // ---- (GPU) textures ----
    // filter: 'mip' (the art), 'linear' (the order image) or 'nearest' (tables)
    const makeTex = (w, h, filter) => {
      const { gl } = G;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter === 'mip' ? gl.LINEAR_MIPMAP_LINEAR : filter === 'linear' ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === 'nearest' ? gl.NEAREST : gl.LINEAR);
      return t;
    };
    // the order's tables (the equalising curve, the coarse lattice, a drawing's order image) and a first
    // texture: the analysis raster itself, so the seed shows a few frames after the picture decodes
    const firstGL = (m, a) => {
      const { gl } = G;
      gl.activeTexture(gl.TEXTURE3); // a spare unit: the live textures stay bound while these fill
      const cdfT = makeTex(BINS, 1, 'nearest');
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, BINS, 1, 0, gl.RED, gl.FLOAT, a.cdf);
      const latT = makeTex(a.cols, a.rows, 'nearest');
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, a.cols, a.rows, 0, gl.RED, gl.FLOAT, a.lat);
      // the order image (order, stroke darkness): full floats (along a stroke the order changes by less than
      // a half float can tell apart, and the pen's end would step), read texel by texel and blended in the shader
      const ordT = makeTex(a.ord ? a.W : 1, a.ord ? a.H : 1, 'nearest');
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, a.ord ? a.W : 1, a.ord ? a.H : 1, 0, gl.RG, gl.FLOAT, a.ord || new Float32Array(2));
      const tex = makeTex(a.W, a.H, 'mip');
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, a.W, a.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, a.data);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
      // the raster is the whole box: in art uv it starts at -dx/dw and spans bw/dw
      const rect = [-m.dx / m.dw, -m.dy / m.dh, m.bw / m.dw, m.bh / m.dh];
      return { tex, cdfT, latT, ordT, rect, ordRect: rect, res: a.W / m.bw, luma: false };
    };
    // the resolution the closest view needs (texels per CSS px of the box): device pixels x the opening
    // scale, within the GPU's limit and a memory cap; a bitmap never beyond its own pixels
    const need = (m) => {
      const d = Math.min(window.devicePixelRatio || 1, 3);
      let k = d * scaleFrom;
      if (!vector(m.src)) k = Math.min(k, img.naturalWidth / m.dw);
      const vw = (m.vis[2] - m.vis[0]) * m.dw, vh = (m.vis[3] - m.vis[1]) * m.dh;
      const maxT = Math.min(G.max, 4096);
      return Math.max(0.25, Math.min(k, maxT / vw, maxT / vh, Math.sqrt(8e6 / (vw * vh))));
    };
    const sharp = (m) => P && P.tex && P.res >= 0.85 * need(m) && P.rect[0] <= m.vis[0] + 1e-3 && P.rect[1] <= m.vis[1] + 1e-3 &&
      P.rect[0] + P.rect[2] >= m.vis[2] - 1e-3 && P.rect[1] + P.rect[3] >= m.vis[3] - 1e-3;
    // the sharp texture: the visible part of the art at the resolution the close-up needs, drawn in
    // strips of about 0.15 MP on the CPU (one short task each) and uploaded as they come, from plain bytes
    // (no canvas readback or format conversion inside the upload); a drawing is stored as its luminance
    // only (one byte a pixel), a photograph in colour
    const refine = async (m, j) => {
      const { gl } = G;
      const luma = !P.dark;
      const k = need(m);
      const [u0, v0, u1, v1] = m.vis;
      const TW = Math.max(1, Math.round((u1 - u0) * m.dw * k)), TH = Math.max(1, Math.round((v1 - v0) * m.dh * k));
      gl.activeTexture(gl.TEXTURE3);
      const tex = makeTex(TW, TH, 'mip');
      gl.texStorage2D(gl.TEXTURE_2D, 1 + Math.floor(Math.log2(Math.max(TW, TH))), luma ? gl.R8 : gl.RGBA8, TW, TH);
      try {
        const SH = Math.max(1, Math.min(TH, Math.ceil(STRIP / TW)));
        const c = document.createElement('canvas');
        c.width = TW;
        const cx = c.getContext('2d', { willReadFrequently: true });
        const one = luma ? new Uint8Array(TW * SH) : null;
        for (let y0 = 0; y0 < TH; y0 += SH) {
          const h = Math.min(SH, TH - y0);
          if (c.height !== h) c.height = h;
          cx.imageSmoothingQuality = 'high';
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, TW, h);
          cx.drawImage(img, -u0 * m.dw * k, -v0 * m.dh * k - y0, m.dw * k, m.dh * k);
          const px = cx.getImageData(0, 0, TW, h).data; // throws on a tainted canvas
          let src = px;
          if (luma) {
            for (let q = 0, p = 0, n = TW * h; q < n; q++, p += 4) one[q] = (0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2] + 0.5) | 0;
            src = one.subarray(0, TW * h);
          }
          gl.activeTexture(gl.TEXTURE3);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, TW, h, luma ? gl.RED : gl.RGBA, gl.UNSIGNED_BYTE, src);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
          await pause(j);
        }
        c.width = c.height = 0;
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return { tex, rect: [u0, v0, u1 - u0, v1 - v0], res: TW / ((u1 - u0) * m.dw), luma };
      } catch (e) {
        gl.deleteTexture(tex);
        throw e;
      }
    };

    // (GPU) the program, once it has linked (in the background where the browser can)
    const readyGL = async (j) => {
      const { gl, prog, par } = G;
      while (par && !gl.getProgramParameter(prog, par.COMPLETION_STATUS_KHR)) await pause(j);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      if (!G.U) {
        G.U = {};
        for (const n of UNIFORMS) G.U[n] = gl.getUniformLocation(prog, n);
        gl.useProgram(prog);
        gl.uniform1i(G.U.uArt, 0); gl.uniform1i(G.U.uCdf, 1); gl.uniform1i(G.U.uLat, 2); gl.uniform1i(G.U.uOrd, 4);
        colourGL();
      }
      return true;
    };
    const colourGL = () => {
      const { gl, U, prog } = G;
      gl.useProgram(prog);
      gl.uniform3f(U.uInk, inkRGB[0] / 255, inkRGB[1] / 255, inkRGB[2] / 255);
      gl.uniform3f(U.uAccent, accRGB[0] / 255, accRGB[1] / 255, accRGB[2] / 255);
      gl.uniform4f(U.uTone, tone[0], tone[1], tone[2], tone[3]);
    };
    // (GPU) the prepared art's tables, its texture and the order's constants
    const bindGL = (Q) => {
      const { gl, U, prog } = G;
      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, Q.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, Q.cdfT);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, Q.latT);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, Q.ordT);
      gl.uniform4f(U.uTex, Q.rect[0], Q.rect[1], Q.rect[2], Q.rect[3]);
      gl.uniform4f(U.uOrdRect, Q.ordRect[0], Q.ordRect[1], Q.ordRect[2], Q.ordRect[3]);
      gl.uniform4f(U.uW, Q.wts[0], Q.wts[1], Q.wts[2], Q.wts[3]);
      gl.uniform1i(U.uSweep, Q.sweep);
      gl.uniform3f(U.uFocus, Q.fz[0], Q.fz[1], Q.rmax);
      gl.uniform2f(U.uLatN, Q.LX, Q.LY);
      gl.uniform2f(U.uFineN, Q.NF[0], Q.NF[1]);
      gl.uniform3f(U.uLevels, Q.wp, Q.span, Q.dark ? 1 : 0);
      gl.uniform1f(U.uBand, band);
      gl.uniform1i(U.uLuma, Q.luma ? 1 : 0);
      lastR = -1;
    };
    // (GPU) the canvas follows the art box at device resolution (capped at 5 MP); cheap, so a resize
    // realigns at once, with no stretched frame while anything else is redone
    const place = (m) => {
      const { gl, U, prog } = G;
      const d = Math.min(window.devicePixelRatio || 1, 3);
      const k = Math.min(d, Math.sqrt(5e6 / (m.bw * m.bh)));
      const cw = Math.max(1, Math.round(m.bw * k)), ch = Math.max(1, Math.round(m.bh * k));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      canvas.style.objectFit = 'fill';
      gl.viewport(0, 0, cw, ch);
      gl.useProgram(prog);
      gl.uniform2f(U.uView, cw, ch);
      gl.uniform2f(U.uBox, m.bw, m.bh);
      gl.uniform4f(U.uFit, m.dx, m.dy, m.dw, m.dh);
      gl.uniform4f(U.uVis, m.vis[0], m.vis[1], m.vis[2], m.vis[3]);
      lastR = -1;
    };
    const dispose = (Q) => {
      if (!Q || !Q.tex || !G) return;
      for (const t of [Q.tex, Q.cdfT, Q.latT, Q.ordT]) G.gl.deleteTexture(t);
    };

    // what a preparation depends on: the picture and the device class (the GPU path re-places the canvas
    // for any other change and sharpens its texture when it needs to; the 2D path is prepared for the box
    // at its resolution)
    const k2D = (m) => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5) * (zoom() ? scaleFrom : 1);
      return Math.min(d, 2400 / m.bw, Math.sqrt((m.phone ? 0.5e6 : 1.25e6) / (m.bw * m.bh)));
    };
    const keyOf = (m) => {
      // (the order image covers the part of the art the box shows: a cover fit whose crop changes needs a new one)
      if (G) return [m.src, m.phone, mode, m.vis.map((v) => v.toFixed(2)).join(',')].join('|');
      const k = k2D(m);
      return [Math.round(m.bw * k), Math.round(m.bh * k), Math.round(m.dx), Math.round(m.dy), Math.round(m.dw), Math.round(m.dh), m.src, m.phone].join('|');
    };

    const prepare = async (m, j) => {
      if (G) {
        const a = await analyse(m, clamp(Math.sqrt((m.phone ? 0.6e6 : 0.9e6) / (m.bw * m.bh)), 0.5, 2), j, false);
        if (!(await readyGL(j))) throw new Error('no shader');
        const t = firstGL(m, a);
        delete a.data; delete a.ord;
        return { ...a, ...t, key: keyOf(m) };
      }
      const a = await analyse(m, k2D(m), j, true);
      const out = g2.createImageData(a.W, a.H);
      delete a.data;
      return { ...a, out, out32: new Uint32Array(out.data.buffer), row: new Uint32Array(256), key: keyOf(m), fit: m.fit, pos: m.pos };
    };
    // (2D) the canvas takes the new preparation's size; it keeps its own aspect when the box changes
    // before the next preparation (a resize is debounced): fitted like the img, never stretched
    const size2D = (Q) => {
      canvas.width = Q.W; canvas.height = Q.H;
      canvas.style.objectFit = Q.fit === 'cover' ? 'cover' : 'contain';
      canvas.style.objectPosition = Q.pos || '';
    };

    // ---- drawing a frame ----
    // (2D) once the drawing is complete (pure ink, scale 1) the img takes over and the canvas is hidden
    // (the 2D canvas is a bitmap of at most 1.5 device pixels to the CSS px, softer than the img);
    // scrolling back under 0.88 hands the stage back to the canvas in the same frame. The GPU canvas is
    // drawn at device resolution and keeps the stage to the end: showing the img would make the browser
    // rasterise the drawing for the first time in the middle of the scroll, a stall of 70-200ms on a
    // complex SVG.
    const setDone = (v) => {
      if (v === done) return;
      done = v;
      root.classList.toggle('pd-done', v);
      if (!v) lastR = -1;
    };
    const render = (force = false) => {
      if (!P || !live) return;
      const t = now(), r = rAt(t), acc = edgeOn ? accentAt(t) * (P.dark ? 1 : strength) : 0;
      setDone(!P.tex && t >= DRAW - 1e-4 && (handOff || P.dark));
      if (done) return;
      const [cs, cx, cy] = camAt(t);
      const ck = cs.toFixed(4) + ',' + cx.toFixed(2) + ',' + cy.toFixed(2);
      if (!force && lastR >= 0 && Math.abs(r - lastR) < 0.0004 && Math.abs(acc - lastA) < 0.004 && ck === lastCam) return;
      if (P.tex) {
        const { gl, U } = G;
        lastR = r; lastA = acc; lastCam = ck;
        gl.uniform1f(U.uR, r);
        gl.uniform1f(U.uAcc, acc);
        gl.uniform4f(U.uCam, origin[0], origin[1], cs, 0);
        gl.uniform2f(U.uPan, cx, cy);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else {
        if (ck !== lastCam) { lastCam = ck; canvas.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) scale(${cs.toFixed(4)})`; }
        draw2D(r, acc, force);
      }
      if (!drawn) { drawn = true; root.classList.add('is-drawn'); }
    };

    // (2D) rewrite the marks whose order is inside the moving front, upload only the dirty tiles
    const rowMask = new Uint16Array(TILES);
    const putDirty = (lo, hi) => {
      const { tiles, W, H, out } = P;
      rowMask.fill(0);
      for (let o = lo; o <= hi; o++) for (let ty = 0, b = o * TILES; ty < TILES; ty++) rowMask[ty] |= tiles[b + ty];
      let dirtyTiles = 0;
      for (let ty = 0; ty < TILES; ty++) for (let v = rowMask[ty]; v; v &= v - 1) dirtyTiles++;
      if (dirtyTiles > TILES * TILES * 0.6) { g2.putImageData(out, 0, 0); return; }
      for (let ty = 0; ty < TILES; ty++) {
        const bits = rowMask[ty];
        if (!bits) continue;
        let tb = ty;
        while (tb < TILES - 1 && rowMask[tb + 1] === bits) tb++;
        const y0 = Math.floor((ty * H) / TILES), y1 = Math.ceil(((tb + 1) * H) / TILES);
        ty = tb;
        for (let tx = 0; tx < TILES; tx++) {
          if (!(bits & (1 << tx))) continue;
          let te = tx;
          while (te < TILES - 1 && bits & (1 << (te + 1))) te++;
          const x0 = Math.floor((tx * W) / TILES), x1 = Math.ceil(((te + 1) * W) / TILES);
          g2.putImageData(out, 0, 0, x0, y0, x1 - x0, y1 - y0);
          tx = te;
        }
      }
    };
    const draw2D = (r, acc, force) => {
      if (!force && Math.abs(r - lastR) < 0.0008 && Math.abs(acc - lastA) < 0.004) return;
      const full = force || lastR < 0;
      const w = Math.max(RAMP, edgeOn ? band : 0);
      const lo = full ? 0 : clamp(Math.floor(255 * (Math.min(r, lastR) - w)) - 1, 0, 255);
      const hi = full ? 255 : clamp(Math.ceil(255 * Math.max(r, lastR)) + 1, 0, 255);
      lastR = r; lastA = acc;
      const { IDX, INK, start, out32, row } = P;
      if (!P.dark) {
        for (let o = lo; o <= hi; o++) {
          const s = start[o], e = start[o + 1];
          if (s === e) continue;
          const d = r - o / 255;
          const al = d <= 0 ? 0 : d >= RAMP ? 1 : d / RAMP;
          if (!al) { for (let j = s; j < e; j++) out32[IDX[j]] = 0; continue; }
          const m = acc && d < band ? acc * clamp((band - d) / WET) : 0;
          const cr = Math.round(inkRGB[0] + (accRGB[0] - inkRGB[0]) * m);
          const cg = Math.round(inkRGB[1] + (accRGB[1] - inkRGB[1]) * m);
          const cb = Math.round(inkRGB[2] + (accRGB[2] - inkRGB[2]) * m);
          const s255 = 255 * al;
          if (LITTLE) { const rgb = (cb << 16) | (cg << 8) | cr; for (let k = 0; k < 256; k++) row[k] = ((((AL[k] * s255 + 0.5) | 0) << 24) | rgb) >>> 0; }
          else { const rgb = ((cr << 24) | (cg << 16) | (cb << 8)) >>> 0; for (let k = 0; k < 256; k++) row[k] = (rgb | ((AL[k] * s255 + 0.5) | 0)) >>> 0; }
          for (let j = s; j < e; j++) out32[IDX[j]] = row[INK[j]];
        }
      } else {
        // darkroom: the print's own colour arrives by order at full strength; the newest marks carry a
        // warm developer cast that has cleared by the time they are fixed
        const SRC = P.SRC;
        const tr = 0x5a, tg = 0x3a, tb = 0x22;
        for (let o = lo; o <= hi; o++) {
          const s = start[o], e = start[o + 1];
          if (s === e) continue;
          const d = r - o / 255;
          const a = d <= 0 ? 0 : d >= RAMP ? 255 : Math.round((255 * d) / RAMP);
          if (!a) { for (let j = s; j < e; j++) out32[IDX[j]] = 0; continue; }
          const m = acc && d < band ? 0.35 * acc * (1 - d / band) : 0;
          for (let j = s; j < e; j++) {
            let px = SRC[j];
            if (m) {
              const c0 = LITTLE ? px & 255 : px >>> 24, c1 = LITTLE ? (px >>> 8) & 255 : (px >>> 16) & 255, c2 = LITTLE ? (px >>> 16) & 255 : (px >>> 8) & 255;
              const r0 = (c0 + (tr - c0) * m) | 0, g0 = (c1 + (tg - c1) * m) | 0, b0 = (c2 + (tb - c2) * m) | 0;
              px = LITTLE ? ((b0 << 16) | (g0 << 8) | r0) : (((r0 << 24) | (g0 << 16) | (b0 << 8)) >>> 0);
            } else px = LITTLE ? px & 0x00ffffff : px & 0xffffff00;
            out32[IDX[j]] = (LITTLE ? (a << 24) | px : px | a) >>> 0;
          }
        }
      }
      if (full) g2.putImageData(P.out, 0, 0); else putDirty(lo, hi);
    };

    // ---- failing gracefully: the finished composition, no hold ----
    const fail = () => {
      if (failed) return;
      failed = true;
      if (job) job.cancelled = true;
      dispose(P);
      P = null;
      setDone(false);
      root.classList.remove('is-drawn');
      if (mm) mm.revert();
      root.classList.remove('is-live');
      root.classList.add('is-rest', 'pd-failed');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    // (GPU) sharpen the texture in the background when the closest view needs more than it holds
    const sharpen = (m) => {
      if (!P || !P.tex || sharp(m) || (job && job.kind === 'refine')) return;
      if (job) return; // a preparation is on its way; it sharpens when it is done
      const j = (job = { kind: 'refine', key: P.key, cancelled: false });
      const Q = P;
      refine(m, j).then((t) => {
        if (j.cancelled || P !== Q || !live) { G.gl.deleteTexture(t.tex); return; }
        job = null;
        const old = P.tex;
        Object.assign(P, t);
        bindGL(P);
        G.gl.deleteTexture(old);
        render(true);
      }, (e) => { if (job === j) job = null; if (e !== CANCEL && !j.cancelled) fail(); });
    };

    // (re)prepare when the picture or the device class changed; otherwise re-place and redraw
    const requestPrep = () => {
      if (!live || failed) return;
      const req = ++reqToken;
      const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      ready.then(() => {
        if (req !== reqToken || !live || failed) return;
        // the picture decodes before anything is drawn from it; a picture that never loads gives the rest state
        if (!img.naturalWidth) { if (img.complete) fail(); else img.addEventListener('error', fail, { once: true }); return; }
        const m = measure();
        if (!m) return;
        ensureRenderer(m);
        aim(m);
        const key = keyOf(m);
        if (P && P.key === key) {
          if (P.tex) { place(m); sharpen(m); }
          render(true);
          return;
        }
        if (job && job.kind === 'prep' && job.key === key) return; // already on its way
        if (job) job.cancelled = true;
        const j = (job = { kind: 'prep', key, cancelled: false });
        prepare(m, j).then((Q) => {
          if (j.cancelled || !live) { dispose(Q); return; }
          job = null;
          const old = P;
          P = Q;
          const m2 = measure() || m;
          if (P.tex) { bindGL(P); place(m2); } else size2D(P);
          dispose(old);
          lastR = -1;
          render(true);
          if (P.tex) sharpen(m2);
        }, (e) => {
          if (e === CANCEL || j.cancelled) return;
          job = null;
          // a GPU that cannot run the shader: the 2D canvas does the same job
          if (G && e && e.message === 'no shader') { use2D(); P = null; aim(m); requestPrep(); return; }
          fail();
        });
      });
    };

    const onUpdate = () => { dirty = true; applyNote(now()); };
    const tick = () => { if (dirty) { dirty = false; render(); } };

    const build = (timeline, ctx) => {
      tl = timeline;
      phone = ctx.phone;
      R0 = phone ? startPhone : startDesk;
      live = true;
      readColours();
      // the camera: close on the heart of the drawing at 0, the whole sheet when it completes (the frame
      // clips it, so nothing ever crosses the title band or the caption)
      aim(img.naturalWidth ? measure() : null);
      timeline.eventCallback('onUpdate', onUpdate);
      splitNote();
      applyNote(0);
      dirty = true;
      requestPrep();
    };

    // the colours (and with them pd-invert) are read before anything shows, so the finished composition
    // of reduced motion or a phone at rest is right on a dark page too
    readColours();
    // a device that asks to save data, or has very little memory, gets the finished composition
    if (lowEnd) return Stage.scene(root, { build: null });

    mm = Stage.scene(root, {
      hold,
      scrub,
      build,
      phone: opts.phone === 'rest' ? 'rest' : { hold: phoneHold, build },
    });
    if (!mm) return null;

    gsap.ticker.add(tick);

    // leaving the live state (reduced motion switched on, a phone set to rest): give the page back its text
    new MutationObserver(() => {
      const isLive = root.classList.contains('is-live');
      if (isLive || !live) return;
      live = false; tl = null; drawn = false;
      if (job) { job.cancelled = true; job = null; }
      setDone(false);
      root.classList.remove('is-drawn');
      canvas.style.transform = '';
      unsplitNote();
    }).observe(root, { attributes: true, attributeFilter: ['class'] });

    // resizes, late fonts, late pictures: re-split the note, re-aim the camera, re-place the canvas, and
    // re-prepare only when the picture or the device class changed (the camera is aimed as a refresh
    // begins, so the invalidated tween reads the new pan)
    ScrollTrigger.addEventListener('refreshInit', () => { if (live) aim(img.naturalWidth ? measure() : null); });
    ScrollTrigger.addEventListener('refresh', () => {
      if (!live) return;
      if (note && plainNote && window.innerWidth !== noteW) splitNote();
      applyNote(now());
      if (P && P.tex) {
        // the GPU path follows the box at once; a new picture or device class is prepared in the background
        const m = measure();
        if (m) { aim(m); place(m); render(true); if (P.key !== keyOf(m)) requestPrep(); else sharpen(m); }
        return;
      }
      clearTimeout(prepTimer);
      prepTimer = setTimeout(requestPrep, P ? 200 : 0);
    });
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => { if (live && plainNote) { splitNote(); applyNote(now()); } });
    }
    img.addEventListener('load', () => { if (live) requestPrep(); });

    // theme switches recolour the marks without re-preparing. The page's <html> is watched for a theme
    // attribute, a class or an inline style, but not for the classes Lenis toggles at every scroll start
    // and stop (lenis-scrolling...): those would force a style read twice a gesture for nothing.
    const recolour = () => { if (readColours() && live) { lastR = -1; render(true); } };
    const dm = window.matchMedia('(prefers-color-scheme: dark)');
    if (dm.addEventListener) dm.addEventListener('change', recolour);
    const html = document.documentElement;
    const themeish = (rec) => {
      if (rec.attributeName !== 'class') return true;
      const was = new Set((rec.oldValue || '').split(/\s+/).filter(Boolean)), is = new Set(html.className.split(/\s+/).filter(Boolean));
      for (const c of was) if (!is.has(c) && !c.startsWith('lenis')) return true;
      for (const c of is) if (!was.has(c) && !c.startsWith('lenis')) return true;
      return false;
    };
    new MutationObserver((recs) => { if (recs.some(themeish)) recolour(); })
      .observe(html, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'], attributeOldValue: true });

    return mm;
  };
})();
