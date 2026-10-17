# Photo credits: to fill in

Every photo currently credits just **"Photo: Unsplash"** in the site footer, because the photographers' names are not known yet. Please do not guess names: look each photo up on Unsplash and fill in the real photographer.

To update a credit, edit the `credit` field of the matching slot in `data/photos.json` (for example `"credit": "Photo: Jane Doe / Unsplash"`), then run `python3 tools/build.py` and commit.

| Original file (in `img/source/`) | Used for (slot in `data/photos.json`) | Photographer | Unsplash link |
| --- | --- | --- | --- |
| `hero-interior-chair.avif` | `hero`, `story` (hero background and "Our story") | TODO | TODO |
| `service-skin-fade.avif` | `signature1` (Skin Fade panel) | TODO | TODO |
| `service-hot-towel-shave.avif` | `signature2` (Hot Towel Shave panel) | TODO | TODO |
| `service-full-works.avif` | `signature3` (The Full Works panel) | TODO | TODO |
| `gallery-red-chair-room.avif` | `gallery1`, and cropped as `gallery6` (`gallery-red-chair-detail.jpg`) | TODO | TODO |
| `gallery-tools.avif` | `gallery2`, and cropped as `gallery5` (`gallery-tools-detail.jpg`) | TODO | TODO |
| `gallery-products.avif` | `gallery3`, and cropped as `gallery8` (`gallery-products-strip.jpg`) | TODO | TODO |
| `gallery-fade-gloves.avif` | `gallery4`, and cropped as `gallery7` (`gallery-fade-detail.jpg`) | TODO | TODO |

Notes
- The `.jpg` files next to the `.avif` originals are conversions and crops used to make the WebP files in `img/photos/`.
- Also check each photo's Unsplash licence page before the site is used for a real client.
- Two photos show third-party brand names (a "HAIR BY BS" t-shirt in the Full Works photo and "Barber Jack" bottles in the products photo). That is fine for a demo, but swap them if this becomes a real client site.
