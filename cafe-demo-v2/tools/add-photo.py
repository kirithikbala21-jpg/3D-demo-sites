#!/usr/bin/env python3
"""Add a real photo to one of the photo slots in data/photos.json.

Usage:
  python3 tools/add-photo.py SOURCE.jpg SLOT --alt "Describe the picture" --credit "Photographer name, Source (licence)"
  python3 tools/add-photo.py --list            show every slot and whether it has a photo

What it does: resizes the picture to at most 1600px wide, saves it as WebP in img/photos/ at the highest quality that keeps the
file under 250 KB, updates the slot in data/photos.json (file, alt, credit, w, h), then rebuilds the pages.
Needs Pillow (pip install pillow). Only use photos you own or that are licensed for this use, and always give the credit.
"""
import argparse
import io
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "data" / "photos.json"
MAX_W = 1600
MAX_BYTES = 250 * 1024


def encode(img, quality):
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


def best_webp(img):
    """Highest quality (1-95) whose WebP stays under MAX_BYTES; shrinks the picture further only if even quality 40 is too big."""
    while True:
        lo, hi, best = 40, 95, None
        while lo <= hi:
            mid = (lo + hi) // 2
            data = encode(img, mid)
            if len(data) <= MAX_BYTES:
                best, lo = (mid, data), mid + 1
            else:
                hi = mid - 1
        if best:
            return best
        img = img.resize((int(img.width * 0.9), int(img.height * 0.9)))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", nargs="?", help="JPG or PNG file")
    ap.add_argument("slot", nargs="?", help="slot name from data/photos.json")
    ap.add_argument("--alt", help="alt text: what the picture shows (for screen readers)")
    ap.add_argument("--credit", help='photographer and source, e.g. "Jane Doe, Unsplash"')
    ap.add_argument("--pos", help='optional focal point as object-position, for example "50% 30%" (x then y), so crops keep the subject')
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--no-build", action="store_true", help="do not run tools/build.py afterwards")
    a = ap.parse_args()

    data = json.loads(PHOTOS.read_text())
    slots = data["slots"]
    if a.list:
        for name, s in slots.items():
            print(f'{"yes" if (ROOT / s["file"]).is_file() else "-  "}  {name:22} {s.get("suggestedAlt", "")}')
        return 0
    if not (a.source and a.slot and a.alt and a.credit):
        ap.error("source, slot, --alt and --credit are all required")
    if a.slot not in slots:
        sys.exit(f'Unknown slot "{a.slot}". Run with --list to see the slots.')
    try:
        from PIL import Image, ImageOps
    except ImportError:
        sys.exit("This tool needs Pillow:  pip install pillow")

    img = ImageOps.exif_transpose(Image.open(a.source))
    img = img.convert("RGBA") if img.mode in ("RGBA", "LA") or "transparency" in img.info else img.convert("RGB")
    if img.width > MAX_W:
        img = img.resize((MAX_W, round(img.height * MAX_W / img.width)), Image.LANCZOS)
    quality, data_bytes = best_webp(img)
    out = ROOT / slots[a.slot]["file"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data_bytes)
    slots[a.slot].update({"alt": a.alt.strip(), "credit": a.credit.strip(), "w": img.width, "h": img.height})
    if a.pos:
        slots[a.slot]["pos"] = a.pos.strip()
    PHOTOS.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"saved {out.relative_to(ROOT)}  {img.width}x{img.height}  quality {quality}  {len(data_bytes) / 1024:.0f} KB")
    if not a.no_build:
        subprocess.run([sys.executable, str(ROOT / "tools" / "build.py")], check=True, stdout=subprocess.DEVNULL)
        print("rebuilt the pages. Commit img/photos/, data/photos.json and the .html files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
