# Photo slots

All 15 slots are filled with the owner's photos (Unsplash; see `CREDITS-TODO.md`). A slot with no file on disk still renders a dark placeholder with a label such as `PHOTO SLOT: gallery-3 - cardio and rowing, landscape 3:2, min 900px wide` (the `needs` text in `data/photos.json`), so any slot can be re-shot or swapped. Replace or add a photo with:

```
python3 tools/add-photo.py path/to/photo.jpg SLOT --alt "Alt text" --credit "Photographer / Source"
python3 tools/build.py
```

`add-photo.py` (needs `pip install pillow`) resizes to at most 1600px wide, saves WebP under 250 KB into `img/photos/SLOT.webp`, and records the alt text and credit (shown in the footer). The originals are kept in `img/source/` (AVIF as supplied, plus JPG conversions used as the source for the tool). Slot definitions, `pos` (crop focus, set per photo with object-fit: cover) and `needs` live in `data/photos.json`. Only use photos you have the rights to.

| Slot | Status | Source file | Where it appears | Shape | Suggested size (px) | Alt text |
| --- | --- | --- | --- | --- | --- | --- |
| `hero` | filled | `img/source/hero.avif` | Home: full-screen hero background (slow zoom; a looping video can replace it) | 16:9 landscape | 1600 x 900 | Wide view of a dark industrial gym floor with racks, plates and tall windows |
| `studio` | filled | `img/source/class-group-silhouettes.avif` | Home: image above the class timetable | wide banner 16:7 (cropped from any landscape) | 1600 x 700 | Members silhouetted against large windows in the group-class studio |
| `banner` | filled | `img/source/action-dumbbell-torso.avif` | Home: full-width banner with "Built by effort." between the offer and the facilities | wide 16:6 strip (cropped from any size; portrait sources are fine) | 1600 x 600 | Shirtless lifter looking down while curling a barbell in a dim gym |
| `coaching` | filled | `img/source/coaching-two-trainers.avif` | Home: next to "What's included" in the 7-day trial offer | 3:2 landscape | 1200 x 800 | Two trainers talking in a bright gym beside a mirror and medicine balls |
| `gallery-1` | filled | `img/source/gallery-1-weights-floor-neon.avif` | Home > Facilities: large feature tile (wide) | 3:2 landscape | 1600 x 1067 | Dim weights floor lit by a neon strip, with rows of machines and benches |
| `gallery-2` | filled | `img/source/gallery-2-kettlebells.avif` | Home > Facilities: wide tile, bottom left | 3:2 landscape | 1600 x 1067 | Rows of black kettlebells on rubber flooring, in black and white |
| `gallery-3` | filled | `img/source/gallery-3-cardio-row.avif` | Home > Facilities: wide tile, bottom right | 3:2 landscape | 1600 x 1067 | A long row of treadmills in a teal-lit cardio hall |
| `gallery-4` | filled | `img/source/gallery-4-sauna-recovery.avif` | Home > Facilities: tall tile beside the feature tile (captioned "Recovery") | portrait 3:4 | 1200 x 1600 | Empty wooden sauna with a softly lit bench |
| `gallery-5` | filled | `img/source/gallery-5-treadmills.avif` | Home > Facilities: tall tile, row two left | portrait 3:5 to 3:4 | 1200 x 1600 | Treadmills and cross-trainers beside large windows in a bright gym |
| `gallery-6` | filled | `img/source/gallery-6-equipment-rack.avif` | Home > Facilities: tall tile, row two middle | portrait 3:5 to 3:4 | 1200 x 1600 | Wall-mounted rack holding an exercise ball, kettlebells and weights beside wooden wall bars |
| `gallery-7` | filled | `img/source/gallery-7-sled-track.avif` | Home > Facilities: tall tile, row two right | portrait 3:5 to 3:4 | 1200 x 1600 | Dark sled track with white lane lines running toward a doorway |
| `coach-1` | filled | `img/source/coach-1-battle-ropes.avif` | Home and Coaches page: coach card 1 | 4:5 portrait, face and upper body in the top half | 900 x 1125 | Coach in a dark sleeveless top standing between heavy battle ropes |
| `coach-2` | filled | `img/source/coach-2-kettlebell-fullbody.avif (cropped to the upper body: coach-2-kettlebell-fullbody-crop.jpg)` | Home and Coaches page: coach card 2 | 4:5 portrait, face and upper body in the top half | 900 x 1125 | Coach in black training gear standing against a dark wall, upper body |
| `coach-3` | filled | `img/source/coach-3-crossed-arms-beard.avif` | Home and Coaches page: coach card 3 | 4:5 portrait, face and upper body in the top half | 900 x 1125 | Bearded coach in a grey training shirt with arms crossed |
| `coach-4` | filled | `img/source/coach-4-crossed-arms-blue.avif (cropped: coach-4-crossed-arms-blue-crop.jpg)` | Home and Coaches page: coach card 4 | 4:5 portrait, face and upper body in the top half | 900 x 1125 | Coach in a dark green t-shirt with arms crossed under blue light |

Notes: the supplied photos are at most 900px wide, so the hero is upscaled on large screens; replace `hero` with a 2000px+ wide shot when one is available (the tool caps at 1600px, edit `add-photo.py` to go larger). There is no reception or exterior photo, so the Visit block is the map and opening hours only. Every photo gets the same look: sepia .12, saturate .85, contrast 1.03, one dark gradient, a 1px yellow hairline and 6px corners on framed photos; the hero and banner are full-bleed with a dark overlay for legibility. For a hero video, set `hero.video` and `hero.poster` in `site.config.json` (see README).
