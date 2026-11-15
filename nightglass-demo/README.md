# Nightglass Tint Studio (concept)

A made-up car window tinting studio, built as a KB Web Designs concept. Its own look: a car studio at night, black glass, one ice-blue line.

## Adding footage

1. Save each clip into `footage/raw/` with its name from the footage playbook (`opener-1.mp4` to `opener-4.mp4`, `scroll-tint.mp4`, `loop-film.mp4`, `loop-squeegee.mp4`, `loop-heat.mp4`, `loop-driveoff.mp4`).
2. Run `python3 tools/prep-footage.py`.
3. Reload. Each slot with a clip shows it; slots without one keep their stand-in.

Until footage exists, the first screen shows a drawn car, and scrolling tints its windows.

`js/footage.js` and `tools/prep-footage.py` are the shared footage kit: copy both into any other site, add `data-footage="name"` to an element, and it works the same way.

Fonts: Barlow Condensed (SIL Open Font License) and Switzer (Fontshare, licence in `fonts/`). No cookies, no tracking, and the quote form sends nothing.
