"""Web versions of the KB Ventures hero render (a digital render of the brand plaque, not a photo).

Source (kept as is):   img/renders/originals/kb-plaque-hero-platinum.png   2752 x 1536: the plaque in a brushed platinum frame,
                       champagne-gold KB engraved in smoked glass, a cool white spotlight, obsidian background.
                       (The older bronze render is kept in originals/legacy/ and is not used.)
Colour: the source carries a navy cast; it is matched channel by channel to the hero video's poster
(img/video/kb-hero-poster.jpg, made from the same render), so the still is neutral obsidian and the film fades in
over it without a colour jump.
Writes:
  img/renders/kb-plaque-hero-{2752,1920,1280,800}.{avif,webp,jpg}   the 16:9 hero, for wide screens
  img/renders/kb-plaque-hero-4x5-{1080,720}.{avif,webp,jpg}          the 4:5 phone crop, centred on the plaque
  img/niches/biz-black-crest.{avif,webp,jpg}                         the Black Crest card on its plinth, cropped from the
                                                                     Black Crest render, so "Our businesses" matches that site
  og.jpg                                                             the share image, 1200 x 630

    python3 kbventures-site/tools/make-renders.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'img', 'renders')
SRC = os.path.join(OUT, 'originals', 'kb-plaque-hero-platinum.png')
REF = os.path.join(SITE, 'img', 'video', 'kb-hero-poster.jpg')
BC_SRC = os.path.join(SITE, '..', 'black-crest-site', 'assets', 'renders', 'originals', 'card-hero.png')
CENTRE_X = 1870                       # the plaque and plinth, horizontally (source pixels)
BC_TIGHT = (1330, 150, 2630, 1543)    # the Black Crest card on its plinth (14:15, as the niche next to it)


def save(im, stem):
    im.save(stem + '.avif', quality=55)
    im.save(stem + '.webp', quality=78, method=6)
    im.save(stem + '.jpg', quality=82, optimize=True, progressive=True)


src = Image.open(SRC).convert('RGB')
if os.path.exists(REF):
    a = np.asarray(src).astype(np.float32); r = np.asarray(Image.open(REF).convert('RGB')).astype(np.float32)
    for c in range(3):
        a[..., c] = (a[..., c] - a[..., c].mean()) * (r[..., c].std() / a[..., c].std()) + r[..., c].mean()
    src = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
W, H = src.size
for w in (2752, 1920, 1280, 800):
    save(src if w == W else src.resize((w, round(H * w / W)), Image.LANCZOS), os.path.join(OUT, f'kb-plaque-hero-{w}'))

cw = round(H * 4 / 5); x0 = max(0, min(W - cw, CENTRE_X - cw // 2))
phone = src.crop((x0, 0, x0 + cw, H))
for w in (1080, 720):
    save(phone.resize((w, round(w * 5 / 4)), Image.LANCZOS), os.path.join(OUT, f'kb-plaque-hero-4x5-{w}'))

if os.path.exists(BC_SRC):
    save(Image.open(BC_SRC).convert('RGB').crop(BC_TIGHT).resize((1120, 1200), Image.LANCZOS), os.path.join(SITE, 'img', 'niches', 'biz-black-crest'))

oh = round(W * 630 / 1200); y0 = (H - oh) // 2
og = src.crop((0, y0, W, y0 + oh)).resize((1200, 630), Image.LANCZOS)
d = ImageDraw.Draw(og)
serif = ImageFont.truetype(os.path.join(SITE, 'fonts', 'cormorant-garamond.woff2'), 72)
try:
    serif.set_variation_by_name('Medium')
except Exception:
    pass
sans = ImageFont.truetype(os.path.join(SITE, 'fonts', 'switzer-500.woff2'), 19)
d.text((64, 230), 'KB VENTURES', font=sans, fill=(212, 175, 55))
for i, line in enumerate(('Many businesses.', 'One standard.')):
    d.text((60, 266 + i * 76), line, font=serif, fill=(228, 230, 237))
og.save(os.path.join(SITE, 'og.jpg'), quality=86, optimize=True, progressive=True)

for f in sorted(os.listdir(OUT)):
    if '.' in f:
        print(f'{os.path.getsize(os.path.join(OUT, f)) / 1024:7.0f} KB  {f}')
