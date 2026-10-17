# Photo slots

There are **18 photo slots**. None has a photo yet (the demo was built without downloads), so each one renders a clearly marked placeholder: a light-grey panel with a faint pipe/grid texture and a label such as `PHOTO SLOT: hero-plumber-van - white branded van, front three-quarter, daylight, landscape 3:2, min 1600px`. Layout, cropping and alt text are already set, so a photo drops straight in and the page looks right (images are `object-fit: cover` with a per-slot focal point).

Add or replace a photo (needs `pip install pillow`):

```
python3 tools/add-photo.py path/to/photo.jpg SLOT --alt "Describe the photo" --credit "Photographer / Source"
python3 tools/build.py
```

`add-photo.py` resizes to at most 1600px wide (900px for the `team-*` portraits), saves WebP under 250 KB in `img/photos/SLOT.webp`, and records the alt text, size and credit (credits show in the footer) in `data/photos.json`. The hero is loaded eagerly with high priority; every other photo is lazy. Slot definitions (`file`, `alt`, `credit`, `label`, `pos` = crop focal point, `needs` = the placeholder text, `eager`) live in `data/photos.json`. Keep the look natural: warm daylight, no dark or sepia grade, the same light treatment across all photos. Use photos you have the rights to, real ones of the real business for a real client, and fill in `CREDITS-TODO.md`.

| Slot | Where it appears | Shape | Minimum size (px) | What it should show | Suggested alt text |
| --- | --- | --- | --- | --- | --- |
| `hero-plumber-van` | Home: hero, beside the headline (full width image under the buttons on phones) | 3:2 landscape (4:3 crop on desktop), keep the van in the middle | 1600 x 1067 | White branded van parked outside a Melbourne house, front three-quarter view, bright daylight, plumber in navy uniform smiling beside it. No dark grade. | Branded Waverley Plumbing & Gas van parked outside a Melbourne home, with a plumber in a navy uniform smiling beside it |
| `plumber-at-work-1` | Home: Emergency plumbing service card | 3:2 landscape, shown at 16:10 | 1200 x 800 | Plumber in a navy uniform checking a pipe or burst fitting under a kitchen sink, warm natural light, hands visible. | Plumber in a navy uniform checking a pipe under a sink in daylight |
| `plumber-at-work-2` | Home: Leaks and taps service card | 3:2 landscape, shown at 16:10 | 1200 x 800 | Plumber tightening a tap or toilet fitting in a bright, tidy kitchen or bathroom. | Plumber tightening a tap fitting in a bright kitchen |
| `tools-closeup` | Home: Gas fitting service card | 3:2 landscape, shown at 16:10 | 1200 x 800 | Close-up of hands and a wrench on copper pipework or a gas fitting. Shallow depth of field, daylight, clean tools. | Close-up of a plumber's hands holding a wrench on a copper gas fitting |
| `hot-water-unit` | Home: Hot water systems service card | 3:2 landscape, shown at 16:10 | 1200 x 800 | A newly installed hot water system on a clean wall with tidy copper pipes and fittings. | New hot water unit installed on a clean wall with copper pipes |
| `bathroom-clean` | Home: Bathroom and kitchen renovation service card | 3:2 landscape, shown at 16:10 | 1200 x 800 | Finished modern bathroom in natural light: shower screen, vanity, taps. Bright and uncluttered. | Bright renovated bathroom with a new shower screen and vanity |
| `blocked-drain-work` | Home: Blocked drains service card | 3:2 landscape, shown at 16:10 | 1200 x 800 | Plumber feeding a drain camera cable or drain machine into an outdoor drain, daylight. | Plumber feeding a drain camera cable into an outdoor drain |
| `team-1` | Home: Meet the team, card 1 (Mark Delaney, founder) | 4:5 portrait, face and shoulders in the upper third | 900 x 1125 | Friendly head-and-shoulders portrait, navy work shirt, neutral or outdoor background, natural light. | Mark, founder and master plumber, in a navy work shirt |
| `team-2` | Home: Meet the team, card 2 (Aisha Rahman, gas fitter) | 4:5 portrait, face and shoulders in the upper third | 900 x 1125 | As team-1: navy work shirt, natural light, friendly and direct. | Aisha, gas fitter, in a navy work shirt |
| `team-3` | Home: Meet the team, card 3 (Luke Nguyen, drainage) | 4:5 portrait, face and shoulders in the upper third | 900 x 1125 | As team-1: navy work shirt, natural light, friendly and direct. | Luke, drainage specialist, in a navy work shirt |
| `team-4` | Home: Meet the team, card 4 (Tom Kerrigan, hot water and renovations) | 4:5 portrait, face and shoulders in the upper third | 900 x 1125 | As team-1: navy work shirt, natural light, friendly and direct. | Tom, hot water and renovation plumber, in a navy work shirt |
| `before-after-1-before` | Home: Recent jobs, job 1 (leaking tap), left of the slider | 4:3 shown, supply 3:2 landscape; identical framing to the after shot | 1200 x 800 | The leaking kitchen tap before the repair (visible drip or water at the base). | Kitchen tap leaking at the base before the repair |
| `before-after-1-after` | Home: Recent jobs, job 1 (leaking tap), right of the slider | same framing as the before shot | 1200 x 800 | The same tap and sink after the repair: dry, tidy, same camera position. | The same kitchen tap after the repair, dry and tidy |
| `before-after-2-before` | Home: Recent jobs, job 2 (hot water unit), left of the slider | same framing as the after shot | 1200 x 800 | The old hot water unit before replacement (rusty or leaking, in its position on the wall). | Old rusted hot water unit before replacement |
| `before-after-2-after` | Home: Recent jobs, job 2 (hot water unit), right of the slider | same framing as the before shot | 1200 x 800 | The new unit in the same spot, new pipework, clean wall. | New hot water unit in the same spot after installation |
| `before-after-3-before` | Home: Recent jobs, job 3 (bathroom reno), left of the slider | same framing as the after shot | 1200 x 800 | The old or stripped-back bathroom from the doorway. | Old bathroom stripped back before renovation |
| `before-after-3-after` | Home: Recent jobs, job 3 (bathroom reno), right of the slider | same framing as the before shot | 1200 x 800 | The finished bathroom from the same spot, bright and clean. | The finished bathroom with new fittings |
| `emergency-night-van` | Home: Emergency strip background (navy overlay added in CSS for legibility) | wide landscape 16:9; keep the left half calm, text sits there | 1600 x 900 | The branded van parked on a suburban street at dusk or night with headlights and house lights on. | Waverley Plumbing & Gas van with headlights on at dusk in a suburban street |

Notes
- The before/after pairs must be shot from the same position so the slider lines up. Keep the subject centred; the divider starts at 50%.
- The portraits are cropped 4:5 with the focal point at 50% 25%, so keep faces in the top third.
- The emergency strip photo sits under a navy overlay in CSS (left to right, 94% to 70%), so it can be a bright photo.
