#!/usr/bin/env python3
"""Test helper: copy the site to DEST and fill photo slots with SYNTHETIC test images (plain colour gradients, never committed)
by running the real tools/add-photo.py, then rebuild the copy. Usage: make-photo-copy.py SRC DEST full|partial|none"""
import pathlib, random, shutil, subprocess, sys
from PIL import Image, ImageDraw

src, dest, mode = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
if dest.exists():
    shutil.rmtree(dest)
shutil.copytree(src, dest, ignore=shutil.ignore_patterns("tests", "node_modules", "photos", "source", ".git"))
slots = {
    "full": ["hero"] + [f"stylist-{i}" for i in range(1, 5)] + [f"gallery-{i}" for i in range(1, 9)] + ["cut-1", "stylist-wash", "stylist-scissors", "treatment-1", "interior-1", "interior-2", "products-1"],
    "none": [],
    "partial": ["gallery-1", "stylist-1", "cut-1"],
}[mode]
tmp = dest / "_tmp"; tmp.mkdir()
random.seed(3)
for n, s in enumerate(slots):
    w, h = (2600, 1700) if s == "hero" else (1800, 1200) if s.startswith("interior-2") else (1500, 1900)
    img = Image.new("RGB", (w, h)); d = ImageDraw.Draw(img)
    base = (random.randint(150, 230), random.randint(120, 200), random.randint(110, 190))
    for y in range(0, h, 4):
        t = y / h
        d.rectangle([0, y, w, y + 4], fill=tuple(int(c * (0.7 + 0.3 * t)) for c in base))
    for _ in range(6):
        x, y, r = random.randint(0, w), random.randint(0, h), random.randint(100, 400)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tuple(random.randint(90, 240) for _ in range(3)))
    f = tmp / f"{s}.jpg"; img.save(f, quality=90)
    subprocess.run([sys.executable, str(dest / "tools/add-photo.py"), str(f), s, "--alt", f"Test photo for {s}", "--credit", "Synthetic test image"], check=True, stdout=subprocess.DEVNULL)
shutil.rmtree(tmp)
subprocess.run([sys.executable, str(dest / "tools/build.py")], check=True, stdout=subprocess.DEVNULL)
