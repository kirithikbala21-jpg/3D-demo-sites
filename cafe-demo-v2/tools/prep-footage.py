#!/usr/bin/env python3
"""Make raw clips ready for the site. Works for any footage site that uses js/footage.js.

  1. Save each clip from the video tool into footage/raw/ with the name from the playbook
     (opener-1.mp4 ... opener-4.mp4, scroll-tint.mp4, loop-film.mp4, ...).
  2. Run:  python3 tools/prep-footage.py
  3. Reload the page. Every slot whose clip now exists shows it.

What it writes into footage/:
  name.mp4      1920 wide, no sound, quick to start
  name-m.mp4    960 wide, for phones
  name.jpg      the first frame, shown while the clip loads and for reduced motion
  manifest.json the list of clips the page may use
opener-1, opener-2 ... are joined in order into one opener. scroll-* clips are saved with every frame a key frame,
so they can be moved by scrolling.
"""
import json, re, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent / 'footage'; RAW = ROOT / 'raw'

def ff(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *map(str, a)], check=True)
def enc(src, out, w, scrub=False):
    extra = ['-g', '1', '-crf', '24'] if scrub else ['-crf', '25']
    ff('-i', src, '-an', '-vf', f'scale={w}:-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', *extra, out)

raws = sorted(p for p in RAW.iterdir() if p.suffix.lower() in ('.mp4', '.mov', '.webm', '.mkv'))
if not raws: sys.exit('No clips in footage/raw/ yet.')
groups = {}
for p in raws:
    m = re.fullmatch(r'(.+?)-(\d+)', p.stem)
    groups.setdefault(m.group(1) if m and m.group(1) == 'opener' else p.stem, []).append(p)
for name, parts in groups.items():
    src = parts[0]
    if len(parts) > 1:  # join opener-1..n at one size and frame rate
        tmp = Path(tempfile.mkdtemp()); normed = []
        for i, p in enumerate(parts):
            o = tmp / f'{i}.mp4'; ff('-i', p, '-an', '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', o); normed.append(o)
        lst = tmp / 'list.txt'; lst.write_text(''.join(f"file '{o}'\n" for o in normed)); src = tmp / 'joined.mp4'
        ff('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', src)
    scrub = name.startswith('scroll-')
    enc(src, ROOT / f'{name}.mp4', 1280 if scrub else 1920, scrub)
    if not scrub: enc(src, ROOT / f'{name}-m.mp4', 960)
    ff('-i', src, '-frames:v', '1', '-q:v', '3', '-vf', 'scale=1600:-2', ROOT / f'{name}.jpg')
    print('ready:', name)
(ROOT / 'manifest.json').write_text(json.dumps({'clips': sorted(groups)}))
print('manifest:', ', '.join(sorted(groups)))
