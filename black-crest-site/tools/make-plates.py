# Builds the raster "plates" for the KB Web Designs gold-leaf home page.
# The gold leaf and the gilded KB shield are drawn in code, the card is our own render and the street is a licensed
# Unsplash photo (credits.html). The three shopfront tiles are AI images the owner approved on 9 Nov 2026
# (originals in assets/plates/originals/); they show kinds of shop, not real businesses.
#   python3 black-crest-site/tools/make-plates.py
import os, re, subprocess, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'assets', 'plates')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def p(*a):
    return os.path.join(SITE, *a)


# ---------- gold leaf: square leaves laid edge to edge, each burnished a little differently ----------
def gold_leaf(w, h, leaf=None):
    leaf = leaf or max(48, w // 9)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    base = np.zeros((h, w), np.float32)
    # each leaf gets its own tone and a soft burnish direction
    for ly in range(-1, h // leaf + 2):
        for lx in range(-1, w // leaf + 2):
            ox, oy = rng.integers(-leaf // 6, leaf // 6, 2)
            x0, y0 = lx * leaf + ox, ly * leaf + oy
            tone = rng.normal(0, 0.028)
            ang = rng.uniform(0, np.pi)
            sl = (slice(max(0, y0), max(0, min(h, y0 + leaf))), slice(max(0, x0), max(0, min(w, x0 + leaf))))
            if sl[0].stop <= sl[0].start or sl[1].stop <= sl[1].start:
                continue
            gx, gy = xx[sl] - x0, yy[sl] - y0
            base[sl] = tone + 0.05 * np.sin((gx * np.cos(ang) + gy * np.sin(ang)) / leaf * np.pi)
    # broad burnish across the whole piece (the light catching the window)
    base += 0.16 * np.sin(xx / w * np.pi * 1.3 + 0.4) * np.cos(yy / h * np.pi * 0.9)
    # one soft specular sweep, the street light catching the leaf
    base += 0.22 * np.exp(-(((xx - 0.62 * w) * 0.6 + (yy - 0.3 * h)) / (0.16 * (w + h))) ** 2)
    # fine streaks from the gilder's brush
    streak = rng.normal(0, 1, (h, 1)).repeat(w, 1).astype(np.float32)
    streak = np.array(Image.fromarray(((streak + 3) * 40).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255 - 0.47
    base += 0.05 * streak
    # leaf seams: thin slightly darker lines where two leaves overlap
    seam = ((xx % leaf) < 1.2) | ((yy % leaf) < 1.2)
    base[seam] -= 0.035
    t = base.clip(-0.4, 0.4)
    lo, mid, hi = np.array([120, 84, 26]), np.array([214, 172, 74]), np.array([251, 232, 168])
    k = (t + 0.4) / 0.8
    rgb = np.where(k[..., None] < 0.55, lo + (mid - lo) * (k[..., None] / 0.55), mid + (hi - mid) * ((k[..., None] - 0.55) / 0.45))
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8), 'RGB')


leaf = gold_leaf(1600, 400, 110)
leaf.save(p('assets', 'plates', 'gold-leaf.jpg'), quality=90)
leaf.save(p('assets', 'plates', 'gold-leaf.webp'), quality=82)

# ---------- the gilded KB shield (transparent PNG), from the hallmark's own outlines (js/logo-mark.js) ----------
mark = open(p('js', 'logo-mark.js'), encoding='utf-8').read()
CREST = re.search(r'CREST = "([^"]+)"', mark).group(1)
LETTERS = re.search(r'LETTERS = "([^"]+)"', mark).group(1)
W, H = 560, 640
svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="4 2.6 32 43.6">
<path d="{CREST}" fill="none" stroke="#fff" stroke-width="1.15" stroke-linejoin="round"/>
<path d="M9.4 11.2Q20 7.6 30.6 11.2L30.6 23.1C30.6 31.2 25.8 36.9 20 40.3C14.2 36.9 9.4 31.2 9.4 23.1Z" fill="none" stroke="#fff" stroke-width=".32" stroke-linejoin="round"/>
<path d="{LETTERS}" fill="#fff" transform="translate(20 24.4) scale(1.42) translate(-20 -24.4)"/></svg>"""
open('/tmp/crest-mask.svg', 'w').write(svg)
subprocess.run(['node', '-e', f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const pg=await b.newPage({{viewport:{{width:{W},height:{H}}}}});
await pg.setContent('<html><body style="margin:0;background:transparent">'+require('fs').readFileSync('/tmp/crest-mask.svg','utf8')+'</body></html>');
await pg.screenshot({{path:'/tmp/crest-mask.png',omitBackground:true}});await b.close();}})();"""],
               check=True, env={**os.environ, 'NODE_PATH': subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()})
alpha = Image.open('/tmp/crest-mask.png').split()[-1]
# the sign-writer's shade: the same shape, offset down-right, in deep bronze-black
shade_a = Image.new('L', (W, H), 0)
shade_a.paste(alpha, (7, 9))
shade = Image.new('RGBA', (W, H), (34, 22, 10, 0))
shade.putalpha(shade_a)
gold = gold_leaf(W, H, 60).convert('RGBA')
gold.putalpha(alpha)
Image.alpha_composite(shade, gold).save(p('assets', 'plates', 'hero-crest.png'), optimize=True)

# ---------- the titanium card (our render), cropped to the comp's card box ----------
card = Image.open(p('assets', 'renders', 'card-hero-2752.jpg')).convert('RGB')
cx, cy, cw, ch = 1945, 830, 1120, 1032
card.crop((cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2)).save(p('assets', 'plates', 'card.png'), optimize=True)


# ---------- the street behind the glass: the cafe photo thrown far out of focus ----------
def cover(im, w, h, fx=0.5, fy=0.5):
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = round((im.width - w) * fx); y = round((im.height - h) * fy)
    return im.crop((x, y, x + w, y + h))


SW, SH = 4272, 1950
src = Image.open(p('assets', 'chapters', 'originals', 'cafes.jpg')).convert('RGB')
st = cover(src, SW // 4, SH // 4, 0.7, 0.35).filter(ImageFilter.GaussianBlur(18)).resize((SW, SH), Image.BICUBIC)
a = np.asarray(st, np.float32)
# warm it, and let the left half fall to the near-black of the glass
a = a * np.array([1.08, 0.94, 0.72])
ramp = np.clip((np.linspace(0, 1, SW) - 0.30) / 0.45, 0, 1) ** 1.6
a = a * (0.10 + 0.70 * ramp)[None, :, None]
a = a * (1 - 0.35 * (np.linspace(0, 1, SH) ** 2))[:, None, None]
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p('assets', 'plates', 'street.png'), optimize=True)

# ---------- the trade tiles: AI-generated night shopfronts (ImagineArt seedream-v5-lite and Higgsfield z_image,
# 9 Nov 2026, owner approved). No people, blank signs. They show the kind of shop, not a real business. ----------
TW, TH = 1340, 436
for name, fy in (('barbers', 0.32), ('cafes', 0.30), ('gyms', 0.62)):
    im = Image.open(p('assets', 'plates', 'originals', f'shopfront-{name}.jpg')).convert('RGB')
    h = round(im.width / (TW / TH)); y = round((im.height - h) * fy)
    im.crop((0, y, im.width, y + h)).resize((TW, TH), Image.LANCZOS).save(p('assets', 'plates', f'tile-{name}.png'), optimize=True)

# provenance, read by the build checks
json.dump({
    'gold-leaf': 'drawn in code by tools/make-plates.py',
    'hero-crest': 'the KB hallmark (js/logo-mark.js), gilded in code by tools/make-plates.py',
    'card': 'crop of assets/renders/card-hero-2752.jpg (our own render)',
    'street': 'assets/chapters/originals/cafes.jpg (Unsplash, Samiul Islam), blurred and darkened',
    'tile-barbers': 'AI-generated, ImagineArt seedream-v5-lite, 9 Nov 2026 (owner approved); originals/shopfront-barbers.jpg',
    'tile-cafes': 'AI-generated, ImagineArt seedream-v5-lite, 9 Nov 2026 (owner approved); originals/shopfront-cafes.jpg',
    'tile-gyms': 'AI-generated, Higgsfield z_image, 9 Nov 2026 (owner approved); originals/shopfront-gyms.jpg',
}, open(p('assets', 'plates', 'SOURCES.json'), 'w'), indent=1)
print('plates written to', OUT)


# ---------- web versions: AVIF, WebP and JPEG (or PNG for cut-outs) at the widths the page asks for ----------
def web(name, widths, alpha=False):
    src = Image.open(p('assets', 'plates', f'{name}.png'))
    src = src.convert('RGBA' if alpha else 'RGB')
    for w in widths:
        h = round(src.height * w / src.width)
        im = src.resize((w, h), Image.LANCZOS)
        im.save(p('assets', 'plates', f'{name}-{w}.avif'), quality=55)
        im.save(p('assets', 'plates', f'{name}-{w}.webp'), quality=80)
        (im.save(p('assets', 'plates', f'{name}-{w}.png'), optimize=True) if alpha else im.save(p('assets', 'plates', f'{name}-{w}.jpg'), quality=82, progressive=True))


web('street', (1280, 1920, 2752))
web('card', (560, 1120))
web('hero-crest', (180, 360), alpha=True)
for n in ('barbers', 'cafes', 'gyms'):
    web(f'tile-{n}', (670, 1340))
print('web versions written')
