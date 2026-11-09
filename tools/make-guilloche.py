# Draws the engraving for the KB Ventures "engraved certificate" look as SVG files in img/engraving/:
# guilloche rosettes (the interlaced line patterns on banknotes and share certificates), a border band and a
# fine line field. They are mathematical curves (sums of circles), drawn in code: nothing is copied or generated.
#   python3 tools/make-guilloche.py
import math
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'img', 'engraving')
os.makedirs(OUT, exist_ok=True)
GOLD = '#D4AF37'


def path(points):
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in points) + ' Z'


def rosette(R, r, d, turns, steps, cx, cy, scale, phase=0.0, wobble=0.0, k=7):
    """A hypotrochoid with a slow radial wobble: the classic guilloche rosette line."""
    pts = []
    for i in range(steps + 1):
        t = turns * 2 * math.pi * i / steps
        x = (R - r) * math.cos(t) + d * math.cos((R - r) / r * t + phase)
        y = (R - r) * math.sin(t) - d * math.sin((R - r) / r * t + phase)
        m = 1 + wobble * math.sin(k * t)
        pts.append((cx + x * scale * m, cy + y * scale * m))
    return path(pts)


def svg(w, h, body, name):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" fill="none" stroke="{GOLD}" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'
    open(os.path.join(OUT, name), 'w').write(s)
    print(name, len(s) // 1024, 'KB')


# 1. the big rosette (the "portrait" frame on a note): many phase-shifted lines laid over each other
lines = []
# three concentric bands, each one line pair, so every engraved line stays visible
for (R, r, d, turns, steps, sc, ph, sw, op) in ((96, 37, 50, 37, 7400, 3.2, 0, 1.1, .9), (96, 37, 50, 37, 7400, 3.2, .05, .8, .5),
                                                (70, 27, 22, 27, 4300, 2.6, 0, .9, .7)):
    lines.append(f'<path d="{rosette(R, r, d, turns, steps, 600, 600, sc, ph, 0.0, 8)}" stroke-width="{sw}" opacity="{op}"/>')
svg(1200, 1200, ''.join(lines), 'rosette.svg')

# 2. a small seal rosette (behind a business number)
lines = [f'<path d="{rosette(48, 19, 22, 19, 2600, 160, 160, 2.6, j * .06, 0.0, 6)}" stroke-width=".9" opacity="{.9 - j * .35}"/>' for j in range(2)]
svg(320, 320, ''.join(lines), 'seal.svg')


# 3. a border band: two sets of sine waves woven along a strip, the edge of a certificate (tiles horizontally)
def wave(w, y0, amp, period, phase, steps=600):
    return 'M' + ' L'.join(f'{w * i / steps:.2f} {y0 + amp * math.sin(2 * math.pi * (w * i / steps) / period + phase):.2f}' for i in range(steps + 1))


band = []
for j in range(4):
    band.append(f'<path d="{wave(480, 20, 13, 60, j * math.pi / 4)}" stroke-width=".6" opacity=".85"/>')
    band.append(f'<path d="{wave(480, 20, 13, 60, math.pi + j * math.pi / 4)}" stroke-width=".6" opacity=".85"/>')
band.append('<path d="M0 3.5H480M0 36.5H480" stroke-width=".8"/>')
svg(480, 40, ''.join(band), 'band.svg')

# 4. a fine line field: the engraved background of a note, very faint (tiles)
field = []
for j in range(24):
    field.append(f'<path d="{wave(400, j * 10 + 5, 3, 200, j * 0.35, 120)}" stroke-width=".5"/>')
svg(400, 240, ''.join(field), 'field.svg')
