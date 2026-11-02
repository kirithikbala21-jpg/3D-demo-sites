"""Makes the Black Crest hallmark: one slim crest outline with a small engraved "BC" inside, like a jeweller's
hallmark. The letters are real outlines from Cormorant Garamond (weight 500), so the mark looks the same everywhere,
with or without fonts.

Writes:
  tools/logo.json   the two paths, read by tools/build.py (header, footer, preloader) and the 3D card
  js/logo-mark.js   the same paths for js/hero3d.js, which engraves them on the card
  img/favicon.svg   the browser tab icon

    pip install fonttools brotli
    python3 black-crest-site/tools/make-logo.py
"""
import json
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the crest, in a 40 x 48 box: a gently arched top, straight sides and a long, fine point
CREST = 'M6 8.2Q20 3.4 34 8.2L34 23.4C34 33.6 27.8 40.6 20 44.8C12.2 40.6 6 33.6 6 23.4Z'

font = TTFont(os.path.join(SITE, 'fonts', 'cormorant-garamond.woff2'))
if 'fvar' in font:
    font = instantiateVariableFont(font, {'wght': 500})
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
# measure first, then draw scaled: letters 15 units wide, centred at (20, 24.4)
x, b = 0, [1e9, 1e9, -1e9, -1e9]
for ch in 'BC':
    g = cmap[ord(ch)]; bp = BoundsPen(glyphs); glyphs[g].draw(TransformPen(bp, (1, 0, 0, -1, x, 0)))
    a1, a2, a3, a4 = bp.bounds; b = [min(b[0], a1), min(b[1], a2), max(b[2], a3), max(b[3], a4)]
    x += glyphs[g].width + 30
s = 15 / (b[2] - b[0]); tx = 20 - (b[0] + b[2]) / 2 * s; ty = 24.4 - (b[1] + b[3]) / 2 * s
pen, x = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.')), 0
for ch in 'BC':
    g = cmap[ord(ch)]; glyphs[g].draw(TransformPen(pen, (s, 0, 0, -s, tx + x * s, ty))); x += glyphs[g].width + 30
LETTERS = pen.getCommands()

with open(os.path.join(SITE, 'tools', 'logo.json'), 'w') as fh:
    json.dump({'viewBox': '0 0 40 48', 'crest': CREST, 'letters': LETTERS}, fh)
with open(os.path.join(SITE, 'js', 'logo-mark.js'), 'w') as fh:
    fh.write('// The Black Crest hallmark in a 40 x 48 box: the crest outline and the "BC" letters (Cormorant Garamond 500 outlines).\n'
             '// Made by tools/make-logo.py.\n'
             f'export const CREST = {json.dumps(CREST)};\nexport const LETTERS = {json.dumps(LETTERS)};\n')
with open(os.path.join(SITE, 'img', 'favicon.svg'), 'w') as fh:
    fh.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#0D0E12"/>'
             f'<g transform="translate(4 0)"><path d="{CREST}" fill="none" stroke="#D4AF37" stroke-width="1.6" stroke-linejoin="round"/>'
             f'<path d="{LETTERS}" fill="#E4E6ED"/></g></svg>\n')
print('logo: letters', len(LETTERS), 'chars')
