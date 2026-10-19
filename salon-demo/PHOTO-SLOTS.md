# Photo slots

There are **21 photo slots**. None has a photo yet (the demo was built without downloads and without faking any), so each renders a neutral branded panel: an ivory/clay tone with a faint crescent-moon watermark and **no text**. Add `?slots=1` to the page URL to show a "PHOTO SLOT: name" label on each panel (labels stay in the DOM, visually hidden, otherwise). Layout, cropping and alt text are set, so a photo drops straight in.

Add or replace a photo (needs `pip install pillow`):

```
python3 tools/add-photo.py path/to/photo.jpg SLOT --alt "Describe the photo" --credit "Photographer / Source"
python3 tools/build.py
```

`add-photo.py` resizes to at most **900px wide for `stylist-*` portraits and 1600px for everything else**, saves WebP under 250 KB in `img/photos/SLOT.webp`, and records alt text, size and credit (credits show in the footer) in `data/photos.json`. The hero is loaded eagerly with high priority (and preloaded); all other photos are lazy. Each slot in `data/photos.json` has `file`, `alt`, `credit`, `label`, `pos` (CSS object-position focal point, e.g. faces in the upper third for stylists), `ratio` (the placeholder shape) and `needs`.

Keep the look consistent: warm natural light, soft ivory/clay/sage tones, no heavy filters. Use only photos you may use, and fill in `CREDITS-TODO.md`.

## Before and after tabs: what shows when
- both the before and after photo exist: a comparison slider (range input, keyboard and touch);
- only one of the pair exists: a single "Recent work" photo (the after photo first, then the before);
- neither: a related photo from the fallback list in `data/jobs.json` (gallery or treatment photos), else the neutral panel. A tab is never empty.
- Treatment has one photo (`treatment-1`), so it is always a single "Recent work" photo.

| Slot | Where it appears | Shape | Minimum size | What it should show |
| --- | --- | --- | --- | --- |
| `hero` | Home hero (full-bleed) | landscape 16:9 | min 1600px wide | calm salon or a styled head of hair |
| `stylist-1` | Meet the stylists, card 1 (Amara) | portrait 4:5 | min 800px wide | portrait of Amara |
| `stylist-2` | Meet the stylists, card 2 (Jonah) | portrait 4:5 | min 800px wide | portrait of Jonah |
| `stylist-3` | Meet the stylists, card 3 (Mei) | portrait 4:5 | min 800px wide | portrait of Mei |
| `stylist-4` | Meet the stylists, card 4 (Priya) | portrait 4:5 | min 800px wide | portrait of Priya |
| `gallery-1` | Gallery, tile 1 | portrait 4:5 | min 1000px on the long side | a finished hairstyle or colour result |
| `gallery-2` | Gallery, tile 2 | square 1:1 | min 1000px on the long side | a finished hairstyle or colour result |
| `gallery-3` | Gallery, tile 3 | portrait 3:4 | min 1200px on the long side | a finished hairstyle or colour result |
| `gallery-4` | Gallery, tile 4 | landscape 4:3 | min 1200px on the long side | a finished hairstyle or colour result |
| `gallery-5` | Gallery, tile 5 | portrait 2:3 | min 1200px on the long side | a finished hairstyle or colour result |
| `gallery-6` | Gallery, tile 6 | portrait 4:5 | min 1000px on the long side | a finished hairstyle or colour result |
| `gallery-7` | Gallery, tile 7 | square 1:1 | min 1000px on the long side | a finished hairstyle or colour result |
| `gallery-8` | Gallery, tile 8 | portrait 3:4 | min 1200px on the long side | a finished hairstyle or colour result |
| `colour-before-1` | Before and after, Colour before | portrait 4:5 | min 1000px wide | colour before photo |
| `colour-after-1` | Before and after, Colour after | portrait 4:5 | min 1000px wide | colour after photo |
| `cut-before-1` | Before and after, Cut before | portrait 4:5 | min 1000px wide | cut before photo |
| `cut-after-1` | Before and after, Cut after | portrait 4:5 | min 1000px wide | cut after photo |
| `treatment-1` | Before and after, Treatment tab (single 'Recent work' photo) | portrait 4:5 | min 1000px wide | glossy |
| `interior-1` | Why choose us (tall photo) | portrait 4:5 | min 900px wide | the salon interior |
| `interior-2` | Visit us (beside the hours) | landscape 16:9 | min 1200px wide | the salon front or reception desk |
| `products-1` | Why choose us (small square) | square 1:1 | min 900px | the professional products on a shelf or trolley |

Ratios are the placeholder shapes; photos are cropped with `object-fit: cover` so a slightly different ratio still works. Gallery tiles use the photo's own proportions (masonry), so mix portrait, square and landscape.
