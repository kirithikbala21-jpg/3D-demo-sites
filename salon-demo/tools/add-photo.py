#!/usr/bin/env python3
"""Add a real photo to a slot in data/photos.json.

  python3 tools/add-photo.py ~/Downloads/van.jpg hero --alt "Stylist blow-drying long brown hair in a bright salon" --credit "Jane Doe / Unsplash"

Resizes to at most 1600px wide (900px for the stylist-* portraits), saves WebP in img/photos/ at the highest quality that stays under 250 KB,
also saves a 800px-wide copy (name-800.webp) that phones download instead of the big one, records the alt text and photographer credit
(shown in the footer), then run tools/build.py.
Only use photos you are licensed to use (Unsplash and Pexels licences are fine for this) and credit the photographer.
Needs Pillow:  pip install pillow
"""
import argparse, io, json, pathlib, sys
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIMIT = 250 * 1024

ap = argparse.ArgumentParser()
ap.add_argument("source"); ap.add_argument("slot")
ap.add_argument("--alt", required=True, help="short description for screen readers")
ap.add_argument("--credit", required=True, help='e.g. "Jane Doe / Unsplash"')
a = ap.parse_args()

meta_path = ROOT / "data/photos.json"
meta = json.loads(meta_path.read_text())
if a.slot not in meta["slots"]:
    sys.exit(f"Unknown slot {a.slot!r}. Slots: {', '.join(meta['slots'])}")
slot = meta["slots"][a.slot]
img = ImageOps.exif_transpose(Image.open(a.source)).convert("RGB")
MAXW = 900 if a.slot.startswith("stylist-") else 1600
if img.width > MAXW:
    img = img.resize((MAXW, round(img.height * MAXW / img.width)), Image.LANCZOS)
for q in range(88, 30, -4):
    buf = io.BytesIO(); img.save(buf, "WEBP", quality=q, method=6)
    if buf.tell() <= LIMIT: break
out = ROOT / slot["file"]; out.parent.mkdir(parents=True, exist_ok=True); out.write_bytes(buf.getvalue())
SMALL = 800  # phones get this copy through srcset (see tools/build.py)
if img.width > SMALL + 100:
    sm = img.resize((SMALL, round(img.height * SMALL / img.width)), Image.LANCZOS)
    for q2 in range(82, 30, -4):
        b2 = io.BytesIO(); sm.save(b2, "WEBP", quality=q2, method=6)
        if b2.tell() <= LIMIT * 0.6: break
    out.with_name(out.stem + "-800.webp").write_bytes(b2.getvalue())
slot.update(alt=a.alt, credit=a.credit, w=img.width, h=img.height)
meta_path.write_text(json.dumps(meta, indent=1) + "\n")
print(f"{out.relative_to(ROOT)}: {img.width}x{img.height}, quality {q}, {buf.tell() // 1024} KB. Now run: python3 tools/build.py")
