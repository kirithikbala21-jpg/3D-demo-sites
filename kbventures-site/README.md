# KB Ventures main site

One page (`index.html`), plain HTML, CSS and JS. No build step, no trackers, no external fonts or CDNs. Light and dark mode follow the visitor's device. Every link is relative or absolute, so this folder is self-contained.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/

## Files
- `site.config.json`: the one file to edit (email, AceGuides shop link, demo list, demo note)
- `index.html`, `styles.css`, `main.js`

## Add a website demo
1. Open `site.config.json` and add one entry to `demos`:
   `{ "type": "Dentist", "name": "Real name from that demo's site.config.json", "line": "One line from its brand.md or config", "url": "https://.../the-demo/" }`
2. Do not invent names or descriptions: copy them from the demo itself. Leave out real businesses and unfinished sites.
3. Also add the same card to the `demo-grid` block in `index.html`. `main.js` rebuilds the cards from the config, but the HTML copy is what shows when the config cannot load (for example if you open the file straight from disk).

## Show the AceGuides shop button
Put the shop address in `aceguidesShopUrl` (must start with `https://`). While it is blank the button is hidden.

## Move to its own repo (kbventures.github.io)
1. Create an empty repo called `kbventures.github.io` under the `kbventures` GitHub account or organisation.
2. Copy the contents of this folder (not the folder itself) into the repo root and commit to `main`.
3. In the repo's Settings > Pages, choose "Deploy from a branch", `main`, `/ (root)`. The site appears at https://kbventures.github.io/.
4. Remove `kbventures-site/` from the 3D-demo-sites repo if you no longer want the old address.
