"""Makes assets/crest-3d.svg and js/crest-shape.js: the logo shield (x10, in a 480 x 560 box) with a rim, a recessed
plate and a fine inlay, plus the "BC" monogram as real letter outlines from Cormorant Garamond at weight 600.
The 3D hero extrudes these paths with Three.js SVGLoader.

    pip install fonttools brotli
    python3 black-crest-site/tools/make-crest-svg.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
font = TTFont(os.path.join(SITE, 'fonts', 'cormorant-garamond.woff2'))
if 'fvar' in font:
    font = instantiateVariableFont(font, {'wght': 600})
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()

# the two letters side by side (a little tighter than their advance widths), y flipped for SVG
parts, x, bounds = [], 0, [1e9, 1e9, -1e9, -1e9]
for ch in 'BC':
    g = cmap[ord(ch)]
    pen, bpen = SVGPathPen(glyphs), BoundsPen(glyphs)
    glyphs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
    glyphs[g].draw(TransformPen(bpen, (1, 0, 0, -1, x, 0)))
    a, b, c, d = bpen.bounds
    bounds = [min(bounds[0], a), min(bounds[1], b), max(bounds[2], c), max(bounds[3], d)]
    parts.append(pen.getCommands())
    x += glyphs[g].width - 20
s = 212 / (bounds[2] - bounds[0])            # letters about 212 units wide, centred at (240, 300), clear of the inlay
tx = 240 - (bounds[0] + bounds[2]) / 2 * s
ty = 300 - (bounds[1] + bounds[3]) / 2 * s


def shield(scale, reverse=False):
    """The logo shield scaled about (240, 280). reverse=True draws it the other way round, for a hole."""
    k = lambda x, y: (240 + (x - 240) * scale, 280 + (y - 280) * scale)
    f = lambda *xy: ' '.join(f'{a:.1f} {b:.1f}' for a, b in (k(xy[i], xy[i + 1]) for i in range(0, len(xy), 2)))
    if not reverse:
        return f'M {f(240, 25)} L {f(435, 92)} L {f(435, 260)} C {f(435, 386, 354, 476, 240, 535)} C {f(126, 476, 45, 386, 45, 260)} L {f(45, 92)} Z'
    return f'M {f(240, 25)} L {f(45, 92)} L {f(45, 260)} C {f(45, 386, 126, 476, 240, 535)} C {f(354, 476, 435, 386, 435, 260)} L {f(435, 92)} Z'


svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560">
<path id="rim" fill-rule="evenodd" d="{shield(1)} {shield(0.8, True)}"/>
<path id="plate" d="{shield(0.82)}"/>
<path id="inlay" fill-rule="evenodd" d="{shield(0.72)} {shield(0.695, True)}"/>
<path id="mono" fill-rule="nonzero" transform="matrix({s:.5f} 0 0 {s:.5f} {tx:.2f} {ty:.2f})" d="{' '.join(parts)}"/>
</svg>'''
with open(os.path.join(SITE, 'assets', 'crest-3d.svg'), 'w') as fh:
    fh.write(svg)
with open(os.path.join(SITE, 'js', 'crest-shape.js'), 'w') as fh:
    fh.write('// The crest for the 3D hero: the logo shield (x10) with a rim, a plate and an inlay, and the "BC" monogram as real\n'
             '// letter outlines from Cormorant Garamond 600. Made by tools/make-crest-svg.py (also saved as assets/crest-3d.svg).\n'
             'export const CREST_SVG = ' + repr(svg.replace('\n', '')) + ';\n')
print('saved', len(svg), 'bytes')
