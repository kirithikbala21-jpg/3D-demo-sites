# Changes: the 27 October hero card is back (28 October 2026)

- **Why:** round 2 did not change the hero card. Its code, materials, lights and still image were byte-for-byte the same as before round 2, and screenshots matched. The brighter look you remembered is the first metal-and-glass card from 27 October (commit 305977f). It was replaced on 28 October by the darker "piano-black glass" card.
- **Restored from 305977f, unchanged:**
  - `scene.js`: a brushed-silver metal slab with a piano-black glass face, a bright white "KB" with "VENTURES" and a short gold rule under it, and a fine brushed-gold edge line;
  - its lighting: a studio environment, key and rim lights, ACES tone mapping at exposure 1.0, the "less" shine level and the soft reflection sweep;
  - its matching still image, `img/hero-object.webp`.
- **Small fixes so it runs and shows in full:**
  - the import map has `three/addons/` again (the restored card uses `RoomEnvironment`, still in `vendor/addons/`);
  - the fade-out mask at the bottom of the hero stage is removed, as on 27 October, so the frame's lower edge isn't faded.
- **Kept from round 2:**
  - the smaller card size;
  - the taller hero, text, buttons, glowing grid and light, and everything below the hero;
  - reduced motion, Data Saver, weak phones and software-only graphics still get the still image, and `?3d=on` / `?3d=off` still work.
  - The grid didn't make the restored card look darker, so its brightness is unchanged.
- **Tool fix:** `tools/render-hero-still.mjs` now also hides the hero glow and the light specks, so a future still has a clean transparent background.
- **Checked:**
  - hero screenshots at 1440 (3D and still) and 390, compared against the 27 October page;
  - no console errors;
  - the full test suite passed again at 1440, 768 and 390.

---

# Earlier: round 2, a fuller home page and four new pages (28 October 2026)

## Home
- **Hero:** almost a full screen tall on desktop, with the text and the smaller 3D card on one centreline. A faint glowing grid and a soft light sit behind the card. They're CSS only, drift very slowly and stay still with reduced motion.
- **New order:** Our businesses (the same two coming-soon cards, plus "View all businesses"), How we build (four steps), Our standard (three cards), About, Quick questions (the first three FAQ items), Get in touch, footer.
- **How we build:** Idea, Build, Launch and Run, each with a number, a thin line icon, a title and one line. Four in a row on desktop, 2 x 2 on phones, with a "How we work" link.
- **Our standard:** Clear, Fair and Well made cards. Only these tilt slightly and catch a soft light under the pointer; the business cards do not.
- **Spacing:** one scale. The gap between sections is about 105px on desktop, 81px on tablets and 65px on phones, with the gold-dot dividers kept. Sections and cards rise in once as they appear (not with reduced motion).

## New pages
- **Businesses** (`businesses.html`): "Our businesses.", "Each business has its own website.", the cards from the config, and always the faded "More coming" card. A live business becomes a link automatically.
- **How we work** (`how-we-work.html`): the four steps, each in two or three plain sentences, then the three standards with a short paragraph each, then Get in touch.
- **FAQ** (`faq.html`): the six questions as an accordion. It works by mouse and keyboard (Enter, Space, and the arrow keys between questions), opens and closes smoothly, and opens instantly with reduced motion. The answers stay open without JavaScript. It includes FAQPage structured data that matches the visible text word for word.
- **Partner with us** (`partner.html`): the intro, the three points, and "Tell us about it", which opens the contact form with Partnership chosen.
- **Contact:** `?topic=` preselects "What's it about?". Quick answers (the first three FAQ items) sit under the form.

## Header, menu and footer
- **Top bar:** "Businesses" is now a link to the Businesses page, with a small arrow button beside it for the dropdown (which still opens on hover too).
- **Phone menu:** Businesses, About, How we work, FAQ, Partner with us, Contact, and the pill.
- **Footer:** the logo, email and social icons, then three link columns. Businesses (from the config); Company: About, How we work, FAQ, Partner with us, Contact; Legal: Privacy, Terms, Refunds. The bottom row is unchanged.

## Under the hood
- **One FAQ source:** the questions live in one list, `faq` in `site.config.json`, used by Home, Contact and the FAQ page. The steps are in `process`, the standards in `standards`, and the new page text is in the config too.
- **New `tools/build-pages.py`:** it rebuilds the HTML copy of every page except the legal pages from the config, including the FAQ structured data and the root 404 copy.
- **Page structure:** card titles and questions are H2 on pages where they come straight after the H1, so headings stay in order.
- **Spacing fix:** the legal pages now leave room under the fixed top bar.
- `sitemap.xml` lists all 10 pages.

## Checked
At 1440, 768 and 390px on all 11 pages:
- one H1;
- no sideways scroll;
- no console errors or failed requests;
- contrast at least 4.5:1.

Also checked:
- every internal link works;
- the accordions work by mouse and keyboard;
- the FAQ structured data matches the visible text;
- `?topic=partnership`, `aceguides`, `kb-websites` and no topic all preselect correctly;
- the dropdown works, and the Businesses label is a link;
- the phone menu works, including focus and Escape;
- the bar hides and returns on scroll;
- coming-soon cards are not links, and live ones become links;
- the form works (with the sending step faked);
- the 404 works at deep addresses;
- reduced motion and JavaScript-off both work.

Lighthouse scored 95–100 for performance and 100 for accessibility, best practices and SEO, with layout shift 0 to 0.002.

---

# Earlier: the company lobby (28 October 2026)

The site is now a clean "lobby" for a company with several businesses. The look is unchanged: the same colours, type, 20px cards, pill buttons, Lenis smooth scrolling and 3D hero with its still fallback. The logo files are used as supplied.

## Pages
- **Home:**
  - hero: "Many businesses. One standard.", "Based in Melbourne, Australia.", and the buttons "Our businesses" and "Get in touch". The 3D card is smaller and sits to the right on desktop, above the text on phones. The empty space under the buttons is gone;
  - a business card for each business in the config;
  - a short About section with the KB mark;
  - a "Get in touch." section with the email shown large.
  - The concept-website slider, "How it works", "Guides launching soon" and the stats or testimonials areas are gone.
- **About** (`about.html`): the company text, then Clear, Fair and Well made, then a Get in touch button.
- **Contact** (`contact.html`): a form on the left; on the right, the email, social icons and "We usually reply within 2 business days." Stacked on phones.
- **404:** a big 404, "This page doesn't exist.", and the buttons Back to home and Get in touch. It works at any address depth. A copy is at the repo root, because GitHub Pages uses that one for missing addresses on this project site. Before, the root file was empty.
- The **legal pages** now use the shared top bar and footer.

## One header and footer
- `site.js` draws the top bar, the phone menu and the footer on every page from `site.config.json`.
- **Top bar:**
  - the wordmark on desktop and the KB mark on phones;
  - Businesses (a dropdown with each business, its one-line description and "Coming soon"), About, Contact, and Get in touch;
  - see-through at the top, frosted glass with a hairline once you scroll;
  - hides as you scroll down and comes back as you scroll up.
- **Phone menu:** full screen, with big links and the pill at the bottom. Escape closes it and focus stays inside while it's open.
- **Footer:**
  - three columns: the wordmark, email and social icons; Businesses; and Company (About, Contact, Privacy, Terms, Refunds);
  - a bottom row with © year, ABN (only when filled in) and the VCE trademark line.

## Config
- New: `company`, `socials`, `businesses` (a list), `showMoreComingCard`, `formAccessKey`, `basePath` and `siteUrl`, plus the text for every page.
- A business becomes live when it has a `url` and `status: "live"`. Its card then becomes one big link with a LIVE badge and its `ctaLabel`, and its footer and dropdown entries become links.
- The ABN moved to `company.abn`.
- Removed with the old sections: `demos`, `how`, `testimonials`, `aceguidesShopUrl`, `instagram` and `linkedin`.

## Contact form
- The fields are Name, Email, Phone (optional), Business name (optional), "What's it about?", Message, and a required Privacy Policy tick box. A hidden spam trap catches simple bots.
- The form checks each field with inline messages and moves to the first problem. While sending, the button shows "Sending…". On success, "Thanks, we'll reply soon." replaces the form. If sending fails, an error message gives the email address as a backup. The page never reloads.
- Messages go to Web3Forms with the key from `formAccessKey`. While the key is empty, Send opens the visitor's email app with the message filled in, and the page says so.

## SEO
- Every page has its own title, description, canonical address, Open Graph and Twitter tags (using `og.jpg`), favicon and theme colour `#0D0E12`.
- Home has Organization structured data: name, url, email, logo and `sameAs` with the three social links.
- New `sitemap.xml` and `robots.txt` list every page.

## Checked
At 1440, 768 and 390px on every page:
- one H1;
- no sideways scroll;
- no console errors or failed requests;
- contrast at least 4.5:1;
- every image has alt text and a size.

Also checked:
- every internal link and anchor works;
- the dropdown works by keyboard and mouse;
- the phone menu works, including keeping focus inside and closing on Escape;
- the bar hides and returns on scroll;
- coming-soon cards are not links and don't lift;
- a live business, tried with a test config, becomes a link everywhere;
- the form: validation, loading, success, error, the email fallback and the spam trap, with the sending step faked;
- the 404 page at deep wrong addresses, both the folder copy and the root copy;
- reduced motion;
- JavaScript off.

---

# Earlier: legal pages (28 October 2026)

## New pages
- `legal/privacy.html`, `legal/terms.html` and `legal/refunds.html`, in the same dark style. Each has the same nav and footer, a 720px reading column, a title, a "Last updated" date, a short "In plain English" box, numbered sections, and a Contact section. They have no smooth scrolling and no 3D, so they stay fast. Gold appears only in the thin divider above Contact.
- The wording follows your brief and adds no extra facts or claims:
  - **Privacy:** what we collect (name and email at checkout, messages); Stripe handles payments; no selling; GitHub Pages hosting logs; access, correction or deletion by email with a reply within 30 days; a light mention of the Australian Privacy Principles (no claim of formal compliance); complaints go to oaic.gov.au.
  - **Terms:** personal study use only; no guarantee of marks; not a replacement for school; the VCE trademark and that we are not affiliated with the VCAA or any school; original work; prices in AUD; a website services section; Australian Consumer Law; Victorian law; the update date.
  - **Refunds:** instant digital delivery; a fix or full refund for faulty, won't-open or not-as-described files; a reply within 3 business days; no change-of-mind refunds after download; Australian Consumer Law rights; how to ask.

## Config
- New `legal` block (exactly as given), plus `legalBaseUrl` so the AceGuides and KB Websites sites can link to these same pages. The labels (Privacy, Terms, Refunds, Last updated, In plain English) are in `footer`.
- The ABN now lives in `legal.abn` (the old top-level `abn` field is gone). While it is empty, no ABN line appears anywhere.
- `legal/legal.js` fills the trading name, brands, email, state, ABN and date from the config.

## Footer
- Every page (home, the three legal pages and the 404) now has Privacy · Terms · Refunds and © year KB Ventures. The VCE trademark line is on every footer that mentions VCE: home and the legal pages.
- There is no sitemap.xml, so none was added.

## Checked
- At 1440 and 390px on all five pages: no sideways scroll, no console errors, no failed requests, and all body text at least 4.5:1.
- Every internal link and in-page anchor works. The Stripe, GitHub and OAIC links all return 200.
- A test with a filled-in ABN shows it; with the ABN empty, nothing is shown.

---

# Earlier: richer without clutter (28 October 2026)

The logo work (nav mark, footer logo, favicons, share image) is untouched. No facts, prices, reviews or numbers were invented.

## AceGuides covers
- New `tools/make-covers.py` (the supplied script) makes 21 study-guide covers in `img/aceguides/`: Year 10, VCE Units 1 & 2 and VCE Units 3 & 4. Each is 720x960 WebP at quality 82, 256 KB for all 21. The full-size PNGs go to a temporary folder and are never saved in the repo.
- The covers use the site's own font (Geist, embedded in the script) instead of Inter, so they match the page.
- The footer now says: "VCE® is a registered trademark of the VCAA."

## Easier to read
- Lead paragraphs and card text are now `#B3B8C4`; small labels are `#9CA2B0`.
- The contact paragraph and the email button are always fully visible.
- Fade-ins are fail-safe: everything shows without JavaScript, every fade ends fully visible, each plays only once, and anything still hidden after 2.5 seconds is shown anyway.

## Visuals
- **What we run:** each card has a picture panel above its text.
  - AceGuides: a fanned 3D stack of five covers (Year 10 Maths, Year 10 Science, VCE Biology 3&4, VCE English 3&4, VCE Maths Methods 3&4). They spread a little on hover and move slightly as you scroll. The alt text says what each cover is.
  - KB Websites: a floating framed screenshot of the Brass & Blade concept site.
  - No prices, ratings or labels are added to either.
- **How it works:** three steps (Preview, Feedback, Go live), each with a thin line icon and the existing wording. A hairline joins them and draws itself as you scroll (side by side on desktop, top to bottom on phones).
- **Concept websites:** the browser frame is about 30% bigger. All screenshots were retaken with the clock frozen, plus a new tall 1440x2200 shot of each demo. When you hover over a card or tab to it, the tall shot scrolls slowly down inside the frame, then back again.

## Depth
- Section padding is 96px on desktop and 56px on phones.
- Between sections there is a faint light band and a hairline with a small gold diamond in the middle.
- A huge outlined "KB" at about 3.5% opacity sits behind What we run and Contact, and drifts slightly with scroll.
- Sections rise 16px over 700ms as they appear. The nav hairline appears once you scroll. One easing curve is used everywhere.

## Hero
- The 3D card is about 15% bigger and tilts gently as you scroll down. VENTURES is bigger and brighter. The still image was re-rendered to match.
- Two or three slow light specks drift near the card.

## Contact finale
- A larger centred heading, a bigger email button with a slow light sweep, and a faint spotlight behind them.

## Reduced motion
- Parallax, the light specks, the slow screenshot scroll and the line drawing are all off; the line simply shows in full.

## Checked
- **Full page** at 360, 390, 768, 1024, 1280, 1440 and 1920px, at 125% zoom, with reduced motion and with WebGL off:
  - no sideways scroll, overlaps or text under 11px;
  - contrast at least 4.5:1 and tap targets at least 44px;
  - no broken images, layout shift 0, no errors and no outside requests.
- **Keyboard only:** every link and button can be reached in order with a visible focus ring, the phone menu traps focus and closes on Escape, and focusing a demo card starts its slow scroll.
- **JavaScript off:** everything is visible; the covers have width, height, alt text and lazy loading.
- **Screenshots** of every section at 1440 and 390px were looked at. The cover fan was too small at first and was clipped at 360px; both are fixed.
- **Lighthouse:** desktop 100 / 100 / 100 / 100, mobile 97 / 100 / 100 / 100.

---

# Earlier: KB Ventures logo (28 October 2026)

Everything else is unchanged.

## Logo files (in `img/`)
- `kb-wordmark.svg` and `kb-favicon.svg` were created exactly as supplied.
- `kb-wordmark-white.svg` and `kb-wordmark-black.svg` were made from `kb-wordmark.svg` by a script that only removes the gradients and sets every fill to `#FFFFFF` or `#0D0E12`. The script confirmed that the shape data is byte-for-byte identical to the original.

## Where the logo is used
- **Nav:** the 32px KB mark (already rounded in the file) followed by "KB Ventures" in the nav type, on every page including the 404. At the narrowest width tested (360px) the full name still fits with 147px to spare, so it is never shortened.
  - The mark's alt text is empty because the name sits right beside it. Otherwise screen readers would say "KB Ventures KB Ventures".
- **Footer:** `kb-wordmark.svg`, centred above the footer links and the existing hairline. The big "KB Ventures" text wordmark was removed, because next to the logo it read as a duplicate.
  - The logo's artwork fills only the middle third of its file. So the image is up to 440px wide, which makes the letters themselves about 160px wide. At an image width of 160px, VENTURES was unreadable.
  - Alt text is "KB Ventures", and width and height are set.
- **Browser tab:** `kb-favicon.svg` is the main icon (`type="image/svg+xml"`). Playwright rendered it straight from the SVG, with transparent corners, to make:
  - `favicon.ico` (16, 32 and 48px);
  - `favicon-32.png`;
  - `apple-touch-icon.png` (180px);
  - `img/icon-192.png` and `img/icon-512.png`.

  These are all linked in the head of the home page and the 404 page. The Organization data's logo now points to `icon-512.png`.
- **Share image:** `og.jpg` was regenerated at 1200 x 630 (26 KB): the dark lit background, the full wordmark centred and large, and "Study guides and websites, made in Melbourne" in small spaced capitals below. The Open Graph and Twitter tags now include the image type, width, height, alt text, title, description and image.

## Checked
- **Nav and footer** at 360, 390, 768, 1024 and 1440px:
  - the mark is always 32x32;
  - the name stays on one line and is never cut off;
  - the menu button and links never collide with it;
  - the footer logo is fully visible.
- **Full page** at 360, 390, 768, 1024, 1280, 1440 and 1920px, at 125% zoom, with reduced motion and with WebGL off: no sideways scroll, no overlaps, contrast at least 4.5:1, tap targets at least 44px, layout shift 0, and no errors.
- **Lighthouse:** desktop 100 / 100 / 100 / 100, mobile 97 / 100 / 100 / 100.

---

# Earlier: final polish (28 October 2026)

Structure, copy, colours, the 3D hero card, the glossy cards and the demo row are unchanged. Everything is calmer, lighter and tighter.

## Type: smaller and lighter
- **Headings:** weight 300 (Geist), letter-spacing -0.025em, line-height 1.08–1.12. I checked that 300 is a real weight in the font file (300, 400 and 500 measure differently with faux styles turned off), and that it stays crisp on a standard (1x) screen.
- **Hero headline:** `clamp(32px, 4.2vw, 60px)`, 3 lines at 1024–1920px (4 on phones).
- **Section headlines:** `clamp(26px, 3.2vw, 46px)`.
- **Card titles:** `clamp(22px, 2.2vw, 32px)` at weight 400.
- **Labels:** 11px, uppercase, 0.22em tracking, weight 500.
- **Lead paragraphs:** 16–17px, line-height 1.65, at most 56 characters wide. They stay full silver: 85% silver measured under 4.5:1 where the light pools brighten the page.
- **Headline gradient:** about 6% light-to-silver now, instead of 10%.
- **Footer wordmark:** weight 300, `clamp(48px, 11vw, 168px)`, a very soft silver gradient, and still shown in full at every width.
- **Font loading:** one variable font file, preloaded, with `font-display: swap`. Numbers use tabular figures.

## Spacing and rhythm
- **One container everywhere:** 1120px of content, 24px gutters on phones and 32px from 720px. The nav, hero, cards and footer share the same edges.
- **Section spacing:** 112px between sections on desktop, 64px on phones.
- **Hero:** about 88% of the screen height. The text block and the 3D card sit on one centreline, and the dead space under the button is gone.
  - Fitting the headline into 3 lines at 1440 needs about 740px. So the text column is about two-thirds wide, and the card's stage overlaps back toward it without touching the words.
- **"What we run" cards:** equal height, with the status at the top, name and text in the middle, and one quiet line at the bottom. The AceGuides card shows "Guides launching soon" while `aceguidesShopUrl` is empty, and a "See the guides" button once it is filled in.

## Hero card
- **Light streak:** a narrow, bright, soft-edged streak (bright core, soft shoulders, faint halo) now crosses the face diagonally every 7 seconds, replacing the grey patch.
- **Size:** the card is drawn about 10% smaller. Its floor reflection is fainter. The slow drift and the mouse response are unchanged.
- **Still image:** re-rendered to match.
- **Software WebGL:** devices running WebGL in software (no graphics card, e.g. SwiftShader or llvmpipe) now get the still image. There the 3D would be slow, and it was costing Lighthouse 27 seconds of blocking time.

## Nav and buttons
- **Nav:** 64px, smoked glass (with a solid fallback where `backdrop-filter` isn't supported), a hairline once you scroll, and the current section's link underlined.
- **Phone menu:** a menu button opens a full-screen menu with large links. It closes on link tap and Escape, and keeps keyboard focus inside while open.
- **Fewer repeated buttons:** "See the websites" in the hero, and "Get in touch" in the nav and the contact section. The extra pills in the middle sections are gone.
- **Pills:** 40px to the eye with a 44px tap area, 14px text, a 200ms hover, and a platinum focus ring.

## Cards and demo row
- All cards share the same radius, border, top highlight, sheen and shadow.
- **Demo cards:** smaller titles, identical browser and phone frames, and text that wraps instead of overflowing.
- **Scrolling:** the row now aligns cards to the left, with the next card peeking about 40px.
- **Controls:** arrows and dots are aligned at the same 44px height. The arrows' stray default grey background is fixed. Keyboard, swipe and the dots all work and stay in sync.

## Background and motion
- The same lit blue-black background, vignette and light pools, with the grain at 4% to keep gradients from banding.
- One easing curve everywhere. Scroll reveals are 700ms with a 16px rise. The headline rises without fading, so it paints at once.

## Details
- Anchor links stop just below the sticky nav (`scroll-margin-top` plus the smooth-scroll offset).
- **New favicon set and share image** (`og.jpg`): dark, with the metal KB mark and the KB Ventures wordmark.
- **Head tags:** title, description, theme-color, a commented canonical, and Organization structured data using only facts on the page (name, email, Melbourne/AU, description, logo). `main.js` keeps the structured data in step with the config.
- **Footer:** links, a quiet "Back to top", "© 2026 KB Ventures · Melbourne, Australia" (the year updates itself), and the concept-demo line.
- **Missing images** leave a quiet empty frame instead of a broken-image icon. Every image has a width and height, and layout shift measured 0.
- **All page text now lives in `site.config.json`,** including optional `aceguidesShopUrl`, `instagram`, `linkedin`, `abn` and `testimonials` fields. Every optional field is empty and hidden. Nothing was invented. I tested this by feeding the page a filled-in config: every optional field appeared, and an entry without a quote was skipped.
- Lenis' tiny stylesheet is folded into `styles.css` (one fewer request). The carousel's ARIA was corrected: the region role is now on its wrapper, so the list stays a list.

## Tested
- 360, 390, 768, 1024, 1280, 1440 and 1920px, 125% zoom, reduced motion, and WebGL fully disabled: no sideways scroll, no overlaps, all text at least 4.5:1, all tap targets at least 44px, layout shift 0, no console errors, no outside requests, and the footer wordmark always in full.
- **Keyboard only:** a visible platinum ring on every stop in a logical order. Anchors land below the nav, and the phone menu traps focus and closes on Escape.
- **Lighthouse** (local server, uncompressed):

  | | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | Mobile | 97–98 (varies run to run) | 100 | 100 | 100 |
  | Desktop | 100 | 100 | 100 | 100 |

  The first desktop run scored 60 for performance (software 3D) and the robots.txt check failed. The robots.txt check came from the repo's top-level file on the local server, which GitHub Pages doesn't use for this site.

## Still open
- The 3D card was only seen in headless Chromium, not on a physical phone or GPU.
- Unused files remain because this session may not run `rm`:
  - the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts;
  - `vendor/addons/`;
  - `vendor/lenis-1.1.18.css`.
- The repo's top-level `404.html` is still empty.

---

# Earlier: a real metal-and-glass card (28 October 2026)

The layout, copy, footer, buttons and demo row are unchanged. This round fixes the three things that still looked flat.

## 1. Hero object: a card, not a framed screen
- **Shape:** rebuilt as a thin card with corners rounded to 6% of its width. The front is deep black glass all the way to a slim bevelled metal edge, so the thick silver border and the gold inner outline are gone.
- **Edge lighting:** the bevel catches a bright highlight along the top and falls darker at the bottom. One fine brushed-gold line runs around the outer bevel only.
- **Face:** deep black glass with a subtle vertical gradient over fine horizontal brushing, under a clear coat. A wide, soft reflection band sweeps across it every 7 seconds.
- **Mark:** "KB" is raised polished metal, built as real 3D letters with a bevelled top edge that catches the light and a soft shadow in the glass beneath. "VENTURES" sits below in metallic foil.
- **Lighting:** a small studio built into the environment map, with three bright light strips (overhead, left, back-right) and a soft panel above the viewer. The glass and bevels show real specular highlights instead of plain grey.
- **Pose and motion:** tilted about 15 degrees back and 16 degrees sideways, in real perspective. It drifts slowly, leans gently toward the mouse (or the phone's tilt on Android), and has a soft contact shadow and a faint mirror image beneath it that fades into the page.
- **Still fallback:** `img/hero-object.webp` was re-rendered from the same scene, so it matches the live 3D. It shows while the 3D loads, without WebGL, on Data Saver, on low-powered phones and with reduced motion.
- **Compared with the old object:** side by side, the old one read as a TV in a silver frame and the new one as a real metal card, so the new one ships. It took three lighting passes before the raised mark read as polished metal rather than dark grey.

## 2. Background with depth
- A deep blue-black base with a faint light from the top of the screen.
- Three soft cool light pools, behind the hero object, behind the demo row and behind the contact section.
- A slightly lighter band at the horizon of each section. It straddles the section edge and fades out on both sides, so there is no seam.
- A vignette at the screen edges and a 3.5% film grain over everything.

## 3. Glossier cards
The "What we run" and demo cards now have a brighter 1px top edge fading to the sides, a stronger diagonal sheen, a lighter inner border and a soft shadow underneath. On hover, one slow light sweep passes across once, with no pulsing or blinking.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, all tap targets at least 44px, all text at least 4.5:1, no broken images, no console errors, and no requests outside the site.
- The footer wordmark fits in full at every one of those widths.
- Carousel keys, dots and buttons, card brightening on hover and gold pill borders all still work.
- Fixed along the way:
  - a dark "floor" rectangle that showed under the object (replaced by a soft CSS fade);
  - a hard seam where each section's horizon band ended;
  - a syntax slip that briefly broke the 3D before release.
- **Banding:** with the contrast stretched 14x, the darkest gradients show faint contour steps under the grain. At normal brightness, or on a bright phone, they are far below visible.
- **Weight:** about 40–110 KB without the 3D, and about 0.7–0.8 MB with it from the local server (mostly Three.js, which GitHub Pages compresses). The 3D loads only after the page is ready.

## Left as they were
- The 3D was checked in headless Chromium with software rendering, not on a physical phone or GPU.
- iPhones need a permission prompt for tilt, so there the card only drifts.
- Unused files still in the folder, because this session may not run `rm`: the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts, and `vendor/addons/` (RoomEnvironment, replaced by the custom studio).
- The repo's top-level `404.html` is still empty, and the AceGuides shop link is still blank.

---

# Earlier: brushed metal and piano-black glass (27 October 2026)

This builds on the dark redesign from earlier the same day. The palette, copy, demo list and section order are unchanged. The owner replaced the earlier "no glow, no shiny metallic fills" rule with a shine brief; the new rules are in `brand.md` under "Light and shine".

## What changed
- **Background:** the flat black is now a layered surface:
  - a deep blue-black base (`#090B11`);
  - a soft cool silver-blue light pool behind the hero object, and a fainter one behind the demo row;
  - a vignette toward the screen edges;
  - a very fine film grain (a 96px tile, 3.5% opacity) laid over the page.

  With the contrast stretched 10x there is no visible banding; the grain breaks the gradient steps up.
- **Hero, two columns on desktop:** the headline, line and buttons sit on the left (about 57%). On the right is a large 3D object that overlaps the column edge slightly, under the spotlight. On phones the text comes first and the object below it.
- **Headline size:** your `clamp(40px, 6vw, 84px)` still wrapped to five or six lines beside the object at 1024–1440px, because four lines at 84px need an 840px column. So it is `clamp(40px, 5.2vw, 76px)`, which gives four lines at 1024, 1280, 1440 and 1920px and the same 40px on phones.
- **The 3D object** (Three.js r160, self-hosted and pinned):
  - a thin slab of brushed metal (anisotropic, clear-coated, high metalness, low roughness) with a piano-black glass face, a thin brushed-gold edge and the KB Ventures mark set into the glass;
  - lit by a studio environment (soft light strips) plus a key and a cool rim light, with a soft shadow beneath;
  - it turns and tilts slowly, leans gently toward the mouse or the phone's tilt, and a soft reflection sweeps across the glass every 9 seconds;
  - the pixel ratio is capped at 2, and it pauses when off screen.
- **Hero fallback:** a still render of the same object (`img/hero-object.webp`, 38 KB, transparent background, made with Playwright by `tools/render-hero-still.mjs`). It shows while the 3D loads, and instead of it without WebGL, on Data Saver, on low-powered phones and with reduced motion.
- **No demo screenshot on the object:** the Iron & Ember screenshot left the hero as asked, and now appears only in the first card of the demo row. The object's face is plain piano-black glass with the mark, instead of carrying a screenshot.
- **Shine level, compared:** I rendered two shine levels side by side. "More" pushed the metal edge to near-white chrome and started to look like a toy, so the quieter "less" version ships. `?shine=more` still shows the other one.
- **Cards (What we run and the demo cards):** dark glossy panels with:
  - a 1px bright top edge fading to the sides;
  - a faint diagonal sheen;
  - a slightly lighter inner border and a soft drop shadow;
  - one slow light sweep across the card on hover. It does not repeat or pulse.

  Card text still brightens from silver to platinum on hover or focus.
- **Screenshot frames:** polished dark-metal bezels with a bright top edge, metal window dots and a soft reflection across the glass, the same for the browser and the phone frames.
- **Headlines:** platinum with a light-to-silver vertical fall-off of about 10%, repeated on every line. No coloured gradients.
- **Primary pills:** polished platinum with a fine top highlight and a highlight that slides across once on hover. Secondary pills and the carousel arrows are dark glass with a faint highlight; their borders still turn gold on hover.
- **Gold** stays rare: the hairline under the hero label, the Live/Starting dots (now with a slight polished-metal look), hover borders and links, and the thin edge and hairline on the 3D object.
- **Nav:** smoked glass (dark and slightly blurred) instead of flat black. On desktop the nav, hero and footer now share one grid, so their left edges line up.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, all tap targets at least 44px, and every text colour at least 4.5:1.
  - Gradient headlines were checked at their darkest stop, `#C3C7D0`.
  - Primary pill text was checked against the pill's darkest platinum, `#CBCED6`.
- No broken images, every in-page link has a target, no console errors, and no requests outside the site.
- The footer wordmark fits in full at every one of those widths.
- One bug found and fixed: the second light pool made the page scroll sideways by up to 388px.
- Weight: about 50–190 KB without the 3D. With it, about 760–790 KB from the local server, mostly Three.js, which GitHub Pages compresses. The 3D only loads after the page has finished loading and the browser is idle, so the text and still image appear first.

## Left as they were, and uncertain points
- The 3D was checked in headless Chromium with software rendering. Real GPUs render it more smoothly, but it has not been looked at on a physical phone.
- Phone tilt works on Android. iPhones ask for permission before a site can read motion, so on an iPhone the object only does its idle movement.
- Files no page uses any more were not deleted, because this session was asked not to run `rm`: the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts. (`hero.js`, `scene.js`, Three.js and `RoomEnvironment` are in use again.)
- The repo's top-level `404.html` is still empty, and the AceGuides shop link is still blank.
