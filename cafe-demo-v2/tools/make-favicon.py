#!/usr/bin/env python3
"""Builds favicon.ico (16, 32 and 48 px) from img/icon-512.png. Needs Pillow (pip install pillow).
Run automatically by `node tools/make-assets.mjs`."""
import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("This tool needs Pillow:  pip install pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = Image.open(ROOT / "img" / "icon-512.png").convert("RGBA")
src.save(ROOT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote favicon.ico (16, 32, 48 px)")
