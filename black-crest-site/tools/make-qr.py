"""Makes img/qr-free-concept.svg: a QR code that opens the free concept page. Run once after the address changes
(for example when the site moves to its own domain):

    pip install segno
    python3 black-crest-site/tools/make-qr.py

The SVG is committed, so no QR library is loaded on the site.
"""
import os
import segno

URL = 'https://kirithikbala21-jpg.github.io/3D-demo-sites/black-crest-site/free-concept.html'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'img', 'qr-free-concept.svg')
segno.make(URL, error='m').save(OUT, scale=10, border=2, dark='#0D0E12', light='#ffffff', xmldecl=False, svgns=True, title='QR code: Black Crest free concept page')
print('saved', OUT)
