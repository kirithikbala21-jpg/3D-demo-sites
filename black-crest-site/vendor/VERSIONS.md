# Vendored libraries

Downloaded once from the npm registry with `npm pack` and committed, so nothing loads from a CDN at runtime.
Each version was checked to exist on npm and to be at least two weeks old on 1 November 2026.

| Library | Version | Published on npm | Licence |
| --- | --- | --- | --- |
| GSAP (core, ScrollTrigger, SplitText, Flip) | 3.14.2 | 12 Dec 2025 | GSAP Standard "no charge" licence: https://gsap.com/standard-license (free, including the plugins, since 3.13) |
| Lenis | 1.3.27 | 15 Oct 2026 | MIT |
| Three.js | 0.170.0 | 31 Oct 2024 | MIT (`three/LICENSE`) |

Three.js add-ons used: `SVGLoader` (from `examples/jsm/loaders`) and `RoomEnvironment` (from `examples/jsm/environments`).
Their one import line, `from 'three'`, was changed to `from '../three.module.min.js'` so they work without an import map. No other edits.
No bloom pass is used, to keep the page light.

## Files (bytes, first 16 characters of the SHA-256)

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `gsap/gsap.min.js` | 72,779 | `c174bfce53a72941` |
| `gsap/ScrollTrigger.min.js` | 44,235 | `45327f639648f7e8` |
| `gsap/SplitText.min.js` | 7,779 | `3c38c97c364b3048` |
| `gsap/Flip.min.js` | 25,534 | `df76166f535b37c6` |
| `lenis/lenis.min.js` | 18,815 | `80f53e77f1c13e37` |
| `lenis/lenis.css` | 513 | `2f668ae84a668327` |
| `three/three.module.min.js` | 691,648 | `08fd7545d13d2c7f` |
| `three/addons/SVGLoader.js` | 69,715 | `e56a809af85cf686` |
| `three/addons/RoomEnvironment.js` | 3,623 | `6000a93dbbf17ab0` |

## Updating
`npm pack gsap@<v> lenis@<v> three@<v>`, copy the same files over, repeat the one-line import change in the two add-ons, and update this table.
