// Makes js/globe-points.js: evenly spread points on a sphere, kept only where there is land, for the dotted 3D globe.
// Land shapes: world-atlas 2.0.2 (land-110m, from Natural Earth, public domain; package licence ISC), used once here
// at build time. Nothing about the globe loads a map, tiles or data at runtime.
//   npm install world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1
//   node black-crest-site/tools/make-globe-points.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const land110 = require('world-atlas/land-110m.json');
const { feature } = require('topojson-client');
const { geoContains } = require('d3-geo');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'globe-points.js');

const land = feature(land110, land110.objects.land);
// d3-geo tests containment on the sphere, so shapes that cross the 180th meridian (Fiji, the tip of Russia) are right
const isLand = (lon, lat) => geoContains(land, [lon, lat]);

const N = 22000, golden = Math.PI * (3 - Math.sqrt(5)), pts = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
  const lat = Math.asin(y) * 180 / Math.PI, lon = ((Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180 / Math.PI) + 540) % 360 - 180;
  if (lat < -60) continue; // leave Antarctica out
  if (isLand(lon, lat)) pts.push(Math.round(lat * 10), Math.round(lon * 10));
}
const b64 = Buffer.from(new Int16Array(pts).buffer).toString('base64');
writeFileSync(OUT, '// Land points for the dotted globe: Int16 pairs [lat x10, lon x10, ...], base64. Made by tools/make-globe-points.mjs\n'
  + '// from world-atlas land-110m (Natural Earth, public domain). No map tiles or data APIs are used at runtime.\n'
  + `const B = '${b64}';\n`
  + 'const bin = atob(B), bytes = new Uint8Array(bin.length);\nfor (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);\n'
  + 'export const LAND = new Int16Array(bytes.buffer);\n');
console.log('land points', pts.length / 2);
