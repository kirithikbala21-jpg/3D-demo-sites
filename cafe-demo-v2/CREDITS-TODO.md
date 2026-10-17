# Photo credits: to fill in

Every photo currently credits just **"Photo: Unsplash"** in the site footer, because the photographers' names are not known yet. Please do not guess names: look each photo up on Unsplash and fill in the real photographer.

To update a credit, edit the `credit` field of the matching slot in `data/photos.json` (for example `"credit": "Photo: Jane Doe / Unsplash"`), then run `python3 tools/build.py` and commit.

| Original file (in `img/source/`) | Used for (slot in `data/photos.json`) | Photographer | Unsplash link |
| --- | --- | --- | --- |
| `hero-interior.avif` | `hero` (hero background) and `oak-room` (Private dining / Oak room card) | TODO | TODO |
| `card-flat-white-latte.avif` | `feature-flat-white` (Ember Flat White card) | TODO | TODO |
| `card-ethiopia-pour-over.avif` | `feature-pour-over` (Ethiopia Guji Natural card) | TODO | TODO |
| `card-cardamom-bun.avif` | `feature-bun` (Cardamom Morning Bun card) | TODO | TODO |
| `roastery-roaster.avif` | `roastery` (Roastery / our story section) | TODO | TODO |
| `gallery-latte-cup.avif` | `gallery-1`, and cropped as `gallery-8` (`gallery-latte-strip.jpg`) | TODO | TODO |
| `gallery-beans.avif` | `gallery-2` | TODO | TODO |
| `gallery-espresso-shot.avif` | `gallery-3` | TODO | TODO |
| `gallery-barista-pour.avif` | `gallery-4` | TODO | TODO |
| `gallery-espresso-machine.avif` | `gallery-5` | TODO | TODO |
| `gallery-chemex-pour.avif` | `gallery-6` | TODO | TODO |
| `gallery-espresso-flatlay.avif` | `gallery-7` | TODO | TODO |

Notes
- The `.jpg` files next to the `.avif` originals are conversions (and one crop) used to make the WebP files in `img/photos/`.
- Check each photo's Unsplash licence page before this is used for a real client.
