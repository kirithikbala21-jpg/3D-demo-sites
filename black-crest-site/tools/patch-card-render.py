"""Re-letters the hero card render for the KB Web Designs name without re-rendering it.

Reads   assets/renders/originals/card-hero-black-crest.png   (the original render, kept as is)
Writes  assets/renders/originals/card-hero.png                (the same card: shield kept, "BC" -> "KB", "BLACK CREST" -> "KB WEB DESIGNS")
Then run tools/make-renders.py to make every web size.

The old letters are painted out with the card's own brushed metal (copied from clean parts of the card), then the new
letters are drawn as fine engraved outlines in the same warm gold, with a thin highlight and shadow so they read as cut into metal.
    pip install pillow numpy fonttools brotli
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(SITE, 'assets', 'renders', 'originals', 'card-hero-black-crest.png')
DST = os.path.join(SITE, 'assets', 'renders', 'originals', 'card-hero.png')
OX, OY = 1500, 400          # the crop used while measuring: card-local (x, y) + this = source pixel
SS = 4                      # draw at 4x, then shrink, for clean thin lines

img = Image.open(SRC).convert('RGB')
a = np.array(img).astype(np.float32)


def region(x0, y0, x1, y1):
    return (slice(OY + y0, OY + y1), slice(OX + x0, OX + x1))


def paint_out(box, from_dx, from_dy, feather=10):
    """Cover `box` with metal copied from the same card, offset by (from_dx, from_dy), matched to the surrounding brightness."""
    x0, y0, x1, y1 = box
    dst, srcr = region(x0, y0, x1, y1), region(x0 + from_dx, y0 + from_dy, x1 + from_dx, y1 + from_dy)
    patch = a[srcr].copy()
    ring = np.concatenate([a[region(x0 - 14, y0 - 14, x1 + 14, y0 - 2)].reshape(-1, 3), a[region(x0 - 14, y1 + 2, x1 + 14, y1 + 14)].reshape(-1, 3),
                           a[region(x0 - 14, y0, x0 - 2, y1)].reshape(-1, 3), a[region(x1 + 2, y0, x1 + 14, y1)].reshape(-1, 3)])
    patch *= np.median(ring, 0) / np.median(patch.reshape(-1, 3), 0)
    h, w = patch.shape[:2]
    m = np.ones((h, w), np.float32)
    f = min(feather, h // 2, w // 2)
    for i in range(f):
        k = (i + 1) / (f + 1)
        m[i, :] = np.minimum(m[i, :], k); m[h - 1 - i, :] = np.minimum(m[h - 1 - i, :], k)
        m[:, i] = np.minimum(m[:, i], k); m[:, w - 1 - i] = np.minimum(m[:, w - 1 - i], k)
    a[dst] = a[dst] * (1 - m[..., None]) + patch * m[..., None]


# 1. paint out "BC" (inside the shield) and "BLACK CREST" (below it)
paint_out((350, 238, 510, 414), 190, 0)
paint_out((228, 490, 640, 574), 0, 84)

# 2. the new lettering, drawn as engraved outlines
font = TTFont(os.path.join(SITE, 'fonts', 'cormorant-garamond.woff2'))
if 'fvar' in font:
    font = instantiateVariableFont(font, {'wght': 500})
ttf = os.path.join('/tmp', 'cormorant-500.ttf'); font.flavor = None; font.save(ttf)


def outline(mask, w=1.5):
    m = mask.filter(ImageFilter.MaxFilter(3)); e = mask.filter(ImageFilter.MinFilter(3))
    return Image.fromarray(np.clip(np.array(m).astype(int) - np.array(e).astype(int), 0, 255).astype(np.uint8))


W, H = 900 * SS, 600 * SS
layer = Image.new('L', (W, H), 0)          # engraved line mask
clear = Image.new('L', (W, H), 0)          # where an in-front letter hides the one behind
big = ImageFont.truetype(ttf, 150 * SS)
d_k = Image.new('L', (W, H), 0); ImageDraw.Draw(d_k).text((362 * SS, 238 * SS), 'K', font=big, fill=255)
d_b = Image.new('L', (W, H), 0); ImageDraw.Draw(d_b).text((418 * SS, 292 * SS), 'B', font=big, fill=255)
ok = outline(d_k.filter(ImageFilter.GaussianBlur(0.3)), 1)
ob = outline(d_b.filter(ImageFilter.GaussianBlur(0.3)), 1)
inner_b = d_b.filter(ImageFilter.MinFilter(3))
ok = Image.fromarray(np.where(np.array(d_b) > 128, 0, np.array(ok)).astype(np.uint8))   # B sits in front of K
layer = Image.fromarray(np.maximum(np.array(ok), np.array(ob)))

small = ImageFont.truetype(ttf, 46 * SS)
text, track = 'KB WEB DESIGNS', 8 * SS
widths = [small.getlength(c) for c in text]
total = sum(widths) + track * (len(text) - 1)
tx, ty = 432 * SS - total / 2, 501 * SS
dt = Image.new('L', (W, H), 0); dd = ImageDraw.Draw(dt)
for c, w_ in zip(text, widths):
    dd.text((tx, ty), c, font=small, fill=255); tx += w_ + track
# the lettering is a solid engraving at this size (like the original), the monogram is outline only
layer = Image.fromarray(np.maximum(np.array(layer), np.array(dt)))

# a very slight turn, to sit on the card's plane
layer = layer.rotate(-0.8, resample=Image.BICUBIC, center=(432 * SS, 400 * SS))
layer = layer.resize((900, 600), Image.LANCZOS)
L = np.array(layer).astype(np.float32) / 255

def shift(arr, dx, dy):
    return np.roll(np.roll(arr, dy, 0), dx, 1)

gold = np.array([212, 160, 108], np.float32)
hi = np.array([246, 218, 186], np.float32)
sh = np.array([16, 13, 10], np.float32)
region_ = (slice(OY, OY + 600), slice(OX, OX + 900))
base = a[region_]
out = base * (1 - 0.85 * shift(L, 1, 1)[..., None]) + sh * 0.85 * shift(L, 1, 1)[..., None]          # shadow edge
out = out * (1 - 0.95 * L[..., None]) + gold * 0.95 * L[..., None]                                      # the cut line
top = np.clip(L - shift(L, 0, 1), 0, 1)
out = out * (1 - 0.7 * top[..., None]) + hi * 0.7 * top[..., None]                                   # lit upper edge
a[region_] = out
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(DST)
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).crop((OX, OY, OX + 900, OY + 600)).save('/tmp/patched_crop.png')
print('wrote', DST)
