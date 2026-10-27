# KB Ventures main site

One page (`index.html`), plain HTML, CSS and JS. No build step, no trackers, no CDNs: the fonts (Barlow Condensed, Inter), Lenis smooth scroll and Three.js are all copied into this folder. Dark theme with one cyan accent. Every link is relative or absolute, so this folder is self-contained.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/

## Files
- `site.config.json`: the one file to edit (email, AceGuides shop link, demo list, demo note)
- `index.html`, `styles.css`, `main.js` (smooth scroll, header blur, reveals, parallax, content from the config)
- `hero.js` and `scene.js`: the 3D glass tiles in the hero. A still CSS version is always in the page and is used with JavaScript off, without WebGL, on Data Saver, on low-powered phones and with reduced motion. Add `?3d=off` to the address to see it.
- `img/`: demo previews (`<demo>-desktop.webp` at 1440px, `<demo>-mobile.webp` at 390px)
- `tools/screenshot-demos.mjs`: rebuilds those previews (instructions at the top of the file)
- `brand.md`: what makes the demo sites feel premium and how this site reuses it
- `fonts/`, `vendor/`: self-hosted fonts (with their OFL licences), Lenis 1.1.18 and Three.js r160

## Add a website demo
1. Open `site.config.json` and add one entry to `demos`:
   `{ "type": "Dentist", "name": "Real name from that demo's site.config.json", "line": "One line from its brand.md or config", "url": "https://.../the-demo/", "desktop": "img/dentist-desktop.webp", "mobile": "img/dentist-mobile.webp" }`
2. Add the demo to `DEMOS` in `tools/screenshot-demos.mjs` and run it to make the two images.
3. Do not invent names or descriptions: copy them from the demo itself. Leave out real businesses and unfinished sites (parts-store-demo and the-one-barber-demo are left out on purpose).
4. Also add the same row to the `demo-list` block in `index.html`. `main.js` rebuilds the rows from the config, but the HTML copy is what shows when the config cannot load (for example if you open the file straight from disk).

## Show the AceGuides shop button
Put the shop address in `aceguidesShopUrl` (must start with `https://`). While it is blank the button is hidden.

## Move to its own repo (kbventures.github.io)
1. Create an empty repo called `kbventures.github.io` under the `kbventures` GitHub account or organisation.
2. Copy the contents of this folder (not the folder itself) into the repo root and commit to `main`.
3. In the repo's Settings > Pages, choose "Deploy from a branch", `main`, `/ (root)`. The site appears at https://kbventures.github.io/.
4. Remove `kbventures-site/` from the 3D-demo-sites repo if you no longer want the old address.
