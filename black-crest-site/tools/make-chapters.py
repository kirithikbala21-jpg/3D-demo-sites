"""Builds the trade chapter photos from originals the owner uploads.

Put the five Unsplash photos (Unsplash License) in black-crest-site/assets/chapters/originals/ as
barbers.jpg, cafes.jpg, gyms.jpg, trades.jpg and salons.jpg, then run:

    python3 black-crest-site/tools/make-chapters.py
    python3 black-crest-site/tools/build.py

It writes <name>-l (2400 px wide) and <name>-s (1200 px wide) as AVIF, WebP and JPEG into assets/chapters/, and
tools/chapters.json, which build.py reads for the image sizes, the focal point (so the subject stays in frame on
phones) and the photo credits. Photos missing from originals/ are skipped.
"""
import json
import os
from PIL import Image, ImageOps

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(SITE, 'assets', 'chapters')
PHOTOS = {
    'barbers': {'focus': '46% 62%', 'credit': ('André Reis', 'https://unsplash.com/photos/1_DAlXy0wng')},        # the red chair under the paintings
    'cafes': {'focus': '40% 74%', 'credit': ('Samiul Islam', 'https://unsplash.com/photos/A0lDAEXlLNk')},   # the two espresso shots, lower left
    'gyms': {'focus': '55% 55%', 'credit': ('Paweł Bulwan', 'https://unsplash.com/photos/JWK2H-2qz1Y')},    # the dumbbell
    'trades': {'focus': '50% 48%', 'credit': ('Ali Kaan Uçar', 'https://unsplash.com/photos/j8UApawyq_c')}, # the lamp-lit tool wall
    'salons': {'focus': '24% 50%', 'credit': ('Sean Boyd', 'https://unsplash.com/photos/9Snkrx_UU6A')},     # the lit mirrors
}
out = {}
for name, meta in PHOTOS.items():
    src = os.path.join(CH, 'originals', name + '.jpg')
    if not os.path.exists(src):
        print('skipped (no original):', name); continue
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    sizes = {}
    for suffix, width in (('l', 2400), ('s', 1200)):
        w = min(width, im.width); h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS); stem = os.path.join(CH, f'{name}-{suffix}')
        r.save(stem + '.avif', quality=55); r.save(stem + '.webp', quality=78, method=6); r.save(stem + '.jpg', quality=80, optimize=True, progressive=True)
        sizes[suffix] = (w, h)
    out[name] = {'size': sizes['l'], 'small': sizes['s'][0], 'focus': meta['focus'], 'credit': meta['credit']}
    print('built', name, sizes)
with open(os.path.join(SITE, 'tools', 'chapters.json'), 'w', encoding='utf-8') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
