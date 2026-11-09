"""Makes the home page hero loop from the hero card render: a slow, seamless camera push in and back, 10 seconds at 30 fps.

Reads   assets/renders/originals/card-hero.png
Writes  assets/video/bc-hero-1080.{mp4,webm}      1920 x 1080
        assets/video/bc-hero-mobile.{mp4,webm}    864 x 1080 (4:5 crop on the card)
    pip install pillow numpy      (needs ffmpeg)
The first and last frame are identical, so the loop has no jump.
"""
import math
import os
import subprocess
import numpy as np
from PIL import Image

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(SITE, 'assets', 'renders', 'originals', 'card-hero.png')
OUT = os.path.join(SITE, 'assets', 'video')
FPS, SECS, PUSH = 30, 10, 0.065
src = Image.open(SRC).convert('RGB')
W, H = src.size


def render(name, size, base_box, focus):
    """base_box: the framed area at rest (x0, y0, x1, y1) in source pixels; focus: the point the push goes toward."""
    ow, oh = size
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{ow}x{oh}', '-r', str(FPS), '-i', '-',
                             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
                             os.path.join(OUT, name + '.mp4')], stdin=subprocess.PIPE)
    x0, y0, x1, y1 = base_box
    for i in range(FPS * SECS):
        t = i / (FPS * SECS)
        e = (1 - math.cos(2 * math.pi * t)) / 2            # 0 -> 1 -> 0, smooth, loops
        z = 1 + PUSH * e
        w, h = (x1 - x0) / z, (y1 - y0) / z
        cx = x0 + (focus[0] - x0) * (1 - 1 / z) / (1 - 1 / z if z != 1 else 1) * 0 + (x0 + x1) / 2 + (focus[0] - (x0 + x1) / 2) * (1 - 1 / z) * 1.0
        cy = (y0 + y1) / 2 + (focus[1] - (y0 + y1) / 2) * (1 - 1 / z) * 1.0
        cx, cy = min(max(cx, w / 2), W - w / 2), min(max(cy, h / 2), H - h / 2)
        frame = src.resize((ow, oh), Image.LANCZOS, box=(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2))
        proc.stdin.write(frame.tobytes())
    proc.stdin.close(); proc.wait()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(OUT, name + '.mp4'), '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
                    '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', os.path.join(OUT, name + '.webm')], check=True)


bw = H * 16 / 9
render('bc-hero-1080', (1920, 1080), (W - bw, 0, W, H) if False else ((W - bw) / 2, 0, (W + bw) / 2, H), (1960, 800))
mw = H * 864 / 1080
render('bc-hero-mobile', (864, 1080), (1960 - mw / 2, 0, 1960 + mw / 2, H), (1960, 800))
print('wrote hero loops')
