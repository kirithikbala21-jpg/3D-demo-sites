# KB Ventures main site

One page (`index.html`) plus a 404 page, in plain HTML, CSS and JS. No build step, no trackers, no CDNs: the fonts and Lenis smooth scroll are copied into this folder. The design brief, the palette and the studio-site notes are in `brand.md`.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/

## Files
- `site.config.json`: the one file to edit (email, AceGuides shop link, demo list, demo note)
- `index.html`, `styles.css`, `main.js` (smooth scroll, the hero's load sequence, small scroll reveals, today's date in the dateline, content from the config)
- `404.html`: page-not-found page (works both in this folder and at the root of its own repo)
- `img/`: demo screenshots (`<demo>-desktop.webp` at 1440px, `<demo>-mobile.webp` at 390px)
- `tools/screenshot-demos.mjs`: rebuilds those screenshots (instructions at the top of the file)
- `og.jpg` (1200 x 630 share image), `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
- `fonts/`: Instrument Serif and Schibsted Grotesk, both SIL Open Font License (licence files next to them)
- `vendor/`: Lenis 1.1.18

## Add a website demo
1. Open `site.config.json` and add one entry to `demos`:
   `{ "type": "Dentist", "name": "Real name from that demo's site.config.json", "line": "One line from its brand.md or config", "url": "https://.../the-demo/", "desktop": "img/dentist-desktop.webp", "mobile": "img/dentist-mobile.webp" }`
   - Optional: `"phone": true` shows the phone screenshot in a phone frame over the desktop one. Use it only when the phone view is the point of the demo (it is on for the plumber).
   - Optional: `"aside": "..."` adds one extra italic line under the description.
2. Add the demo to `DEMOS` in `tools/screenshot-demos.mjs` and run it to make the two images.
3. Do not invent names or descriptions: copy them from the demo itself. Leave out real businesses and unfinished sites (parts-store-demo and the-one-barber-demo are left out on purpose).
4. Also add the same item to the `demo-list` block in `index.html`. `main.js` rebuilds the list from the config, but the HTML copy is what shows when the config cannot load (for example if you open the file straight from disk).

The layout alternates image left and right automatically. Each of the first five positions has its own width and crop in `styles.css` (search for `.piece:nth-child`).

## Show the AceGuides shop link
Put the shop address in `aceguidesShopUrl` (must start with `https://`). While it is blank the link is hidden.

## Move to its own repo (kbventures.github.io)
1. Create an empty repo called `kbventures.github.io` under the `kbventures` GitHub account or organisation.
2. Copy the contents of this folder (not the folder itself) into the repo root and commit to `main`.
3. In the repo's Settings > Pages, choose "Deploy from a branch", `main`, `/ (root)`. The site appears at https://kbventures.github.io/, and `404.html` is used for missing pages.
4. Update the `canonical`, `og:url` and `og:image` addresses at the top of `index.html` to the new address.
5. Remove `kbventures-site/` from the 3D-demo-sites repo if you no longer want the old address.
