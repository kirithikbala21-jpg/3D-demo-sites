"""Web versions of the KB hero render (a digital render of the brand card, not a photo).

Source (kept as is):   assets/renders/originals/card-hero.png      2752 x 1536, the card on its plinth, right of centre
Writes:
  assets/renders/card-hero-{2752,1920,1280,800}.{avif,webp,jpg}      the 16:9 hero, for wide screens
  assets/renders/card-hero-4x5-{1080,720}.{avif,webp,jpg}             the 4:5 phone crop, centred on the card
  assets/renders/card-tight.{avif,webp,jpg}                           the card on its plinth, tight (final call to action)
  assets/renders/kb-plaque-small.{avif,webp,jpg}                      a small crop of the KB Ventures render ("Part of KB Ventures")
  img/og.jpg                                                          the share image, 1200 x 630
  assets/video/bc-hero-poster{,-mobile}.{avif,webp}                  the video posters, smaller formats

    python3 black-crest-site/tools/make-renders.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'assets', 'renders')
SRC = os.path.join(OUT, 'originals', 'card-hero.png')
# the KB Ventures plaque as KB's own tool made it (the platinum render, colour-matched): kept in sync with that site
KB_SRC = os.path.join(SITE, '..', 'kbventures-site', 'img', 'renders', 'kb-plaque-hero-2752.jpg')
CENTRE_X = 1960                       # the card and plinth, horizontally (source pixels)
TIGHT = (1330, 150, 2630, 1543)       # the card on its plinth with the spotlight above (14:15)
KB_SMALL = (1170, 230, 2570, 1455)    # the platinum plaque on its plinth (8:7)


def save(im, stem):
    im.save(stem + '.avif', quality=55)
    im.save(stem + '.webp', quality=78, method=6)
    im.save(stem + '.jpg', quality=82, optimize=True, progressive=True)


def kb(stem):
    return os.path.join(OUT, stem)


src = Image.open(SRC).convert('RGB')
W, H = src.size
for w in (2752, 1920, 1280, 800):
    save(src if w == W else src.resize((w, round(H * w / W)), Image.LANCZOS), kb(f'card-hero-{w}'))

# 4:5 phone crop, full height, centred on the card and plinth
cw = round(H * 4 / 5); x0 = max(0, min(W - cw, CENTRE_X - cw // 2))
phone = src.crop((x0, 0, x0 + cw, H))
for w in (1080, 720):
    save(phone.resize((w, round(w * 5 / 4)), Image.LANCZOS), kb(f'card-hero-4x5-{w}'))

save(src.crop(TIGHT).resize((1120, 1200), Image.LANCZOS), kb('card-tight'))
if os.path.exists(KB_SRC):
    save(Image.open(KB_SRC).convert('RGB').crop(KB_SMALL).resize((640, 560), Image.LANCZOS), kb('kb-plaque-small'))

# share image: the render, with the line set in the dark left side
oh = round(W * 630 / 1200); y0 = (H - oh) // 2
og = src.crop((0, y0, W, y0 + oh)).resize((1200, 630), Image.LANCZOS)
d = ImageDraw.Draw(og)
serif = ImageFont.truetype(os.path.join(SITE, 'fonts', 'cormorant-garamond.woff2'), 70)
try:
    serif.set_variation_by_name('Medium')
except Exception:
    pass
sans = ImageFont.truetype(os.path.join(SITE, 'fonts', 'switzer-500.woff2'), 19)
d.text((64, 214), 'KB WEB DESIGNS', font=sans, fill=(212, 175, 55))
for i, line in enumerate(('Premium sites', 'for local', 'businesses.')):
    d.text((60, 250 + i * 72), line, font=serif, fill=(228, 230, 237))
og.save(os.path.join(SITE, 'img', 'og.jpg'), quality=86, optimize=True, progressive=True)

# the video posters (assets/video, made with the hero videos) also as AVIF and WebP, for the small video in the
# final call to action, where the poster shows until the video is on screen
VIDEO = os.path.join(SITE, 'assets', 'video')
for name in ('bc-hero-poster-mobile', 'bc-hero-poster'):
    jp = os.path.join(VIDEO, name + '.jpg')
    if os.path.exists(jp):
        im = Image.open(jp).convert('RGB'); im.save(os.path.join(VIDEO, name + '.avif'), quality=55); im.save(os.path.join(VIDEO, name + '.webp'), quality=78, method=6)

for f in sorted(os.listdir(OUT)):
    if '.' in f:
        print(f'{os.path.getsize(os.path.join(OUT, f)) / 1024:7.0f} KB  {f}')
