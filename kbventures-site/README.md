# KB Ventures main site

One page (`index.html`) plus a 404 page, in plain HTML, CSS and JS. No build step, no trackers, no CDNs: the fonts and Lenis smooth scroll are copied into this folder. The design system (colours, type, spacing, rules) and the notes from the reference page are in `brand.md`.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/

## Files
- `site.config.json`: the one file to edit (email, AceGuides shop link, demo list, demo note)
- `index.html`, `styles.css`, `main.js` (smooth scroll, the hero object's parallax, slow fade-ups, the concept-websites carousel, content from the config)
- `hero.js` and `scene.js`: the 3D brushed-metal and glass object in the hero (Three.js). `?3d=off` shows the still image, `?3d=on` forces 3D, `?shine=more` shows the brighter version that was not chosen.
- `img/hero-object.webp`: the still of the same object, used while the 3D loads and whenever it can't run. Rebuild it with `tools/render-hero-still.mjs` after changing `scene.js`.
- `img/grain.png`: the film-grain tile laid over the page at 3.5%
- `404.html`: page-not-found page (works both in this folder and at the root of its own repo)
- `img/`: demo screenshots as one matching set (`<demo>-desktop.webp` 1280x800 from a 1440x900 window, `<demo>-mobile.webp` 480x1039 from a 390x844 phone). The browser and phone frames are drawn in CSS so they are identical for every demo.
- `tools/screenshot-demos.mjs`: rebuilds those screenshots; `tools/render-hero-still.mjs`: rebuilds the hero still (instructions at the top of each file)
- `og.jpg` (1200 x 630 share image), `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
- `fonts/geist-latin.woff2`: Geist, SIL Open Font License (`geist-OFL.txt`)
- `vendor/`: Lenis 1.1.18, Three.js r160 (`three.module.min.js`) and its `RoomEnvironment` add-on

## Add a website demo
1. Open `site.config.json` and add one entry to `demos`:
   `{ "type": "Dentist", "name": "Real name from that demo's site.config.json", "line": "One line from its brand.md or config", "url": "https://.../the-demo/", "desktop": "img/dentist-desktop.webp", "mobile": "img/dentist-mobile.webp" }`
2. Add the demo to `DEMOS` in `tools/screenshot-demos.mjs` and run it to make the two images.
3. Do not invent names or descriptions: copy them from the demo itself. Leave out real businesses and unfinished sites (parts-store-demo and the-one-barber-demo are left out on purpose).
4. Also add the same card to the `track` list in `index.html`. `main.js` rebuilds the list from the config, but the HTML copy is what shows when the config cannot load (for example if you open the file straight from disk).

The carousel builds its dots from however many cards there are, so nothing else needs changing.

## Show the AceGuides shop link
Put the shop address in `aceguidesShopUrl` (must start with `https://`). While it is blank the AceGuides card shows no link.

## Move to its own repo (kbventures.github.io)
1. Create an empty repo called `kbventures.github.io` under the `kbventures` GitHub account or organisation.
2. Copy the contents of this folder (not the folder itself) into the repo root and commit to `main`.
3. In the repo's Settings > Pages, choose "Deploy from a branch", `main`, `/ (root)`. The site appears at https://kbventures.github.io/, and `404.html` is used for missing pages.
4. Update the `canonical`, `og:url` and `og:image` addresses at the top of `index.html` to the new address.
5. Remove `kbventures-site/` from the 3D-demo-sites repo if you no longer want the old address.
