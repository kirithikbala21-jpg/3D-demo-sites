---
name: design-taste-frontend
description: >-
  tasteskill v2.5, the anti-slop frontend skill. Art direction for websites from a study of 247
  gallery sites and 65 professional sites. A script deals the whole direction at random (idea,
  composition, type pairing, palette, frame, scroll scenes) so no two pages look alike, a strict
  no-slop house style is checked in a real browser, and a look-and-fix loop runs on screenshots. Use
  this whenever you build, design, redesign, restyle, polish or review a landing page, marketing site,
  portfolio, product page, one-pager, hero or any public-facing web page, in any stack (HTML/CSS, React,
  Next.js, Vue, Svelte, Astro, Tailwind) — also when the user says a page looks generic, templated,
  "AI-made", sloppy, or asks to make it look designed, premium, award-level or less like every other
  site. Also for app screens: dashboards, admin and analytics views, settings, inboxes and other screens
  people work in, with their own run and rules.
---

# tasteskill v2.5

A page built by a model usually looks like the average of every page the model has seen: a centred
headline over three lines, a little label above it, a row of icon cards, a soft gradient, a few thin
rules and a monospace caption. Nothing in it is wrong and nothing in it was decided. And every model
has favourites of its own: left to choose, it builds the same page every time, whatever the brief.

This skill replaces those defaults with decisions, in four ways:

1. **A script deals the direction; you build it.** `scripts/draw.mjs` deals, at random and away from
   recent builds, the direction, a type pairing from 169 faces with its own scale, a restrained
   palette, the navigation, the footer, corners, spacing, how pictures are treated, whether the page
   has an interactive piece or a video, and its scroll scenes. You do not choose among options: your
   own choice is the bias this skill exists to remove.
2. **The idea comes from the subject.** In the study, what separated the best sites from the forgettable
   ones was a concept taken from the thing itself, not the styling.
3. **A house style with no ornaments,** measured in a real browser by `scripts/inspect.mjs`, so the
   rules are checked rather than hoped for.
4. **You look at what you made.** Screenshots at three widths, a juror's rubric, fix, look again.

What professional sites do, measured (October 2026, 65 tech companies and shops against 30 pages built
with the previous version of this skill): their largest type is about 3.8vw (the builds: 14vw), body
text 14-16px (17-19), pictures cover about 30% of every screen (10%), almost no page area stands on a
coloured ground (20%), none has a giant name in the footer (53%), and they have half as many blank
stretches. A good page is not louder; it is clearer: the full content in few words, sharp pictures of
the subject large enough to see, a real navigation and footer, and one or two moments of motion that
earn their place.

In the commands below `<skill>` is this skill's folder. Run them from the project's root, so the
working files land in `.taste-skill/` there. The scripts need Node 22+ and an installed Chrome, Edge
or Chromium, and install nothing. `assets.mjs` also needs network access; it uses no API keys.

## Page or app screen

Decide first which of two kinds of work this is.

- **A page** is read and scrolled: a landing page, a marketing or product site, a portfolio, an
  event, a restaurant, a one-pager. It follows **the run** below.
- **An app screen** is worked in: a dashboard, an admin or analytics view, settings, billing, an inbox
  or queue to work through, a wallet, a list with filters, an editor or builder. It follows
  **`references/app-screens.md`**: its own run, its own draw (`draw.mjs --app`), its own house rules
  (quiet borders, small labels and repeated panels are normal there; gradients, glows, icons in tinted
  squares, rainbow charts and invented vanity numbers are not) and `inspect.mjs --app`. Read that file
  whole before you start; the page run below does not apply.

A product site that shows its app is a page; the interface fragments on it follow the app-screen
rules for their insides. Deal the product's app style once, in its own folder, with the page's colours
and type kept:

```bash
node <skill>/scripts/draw.mjs --app --kind <kind> --brief "<the product>" --keep palette,type --out .taste-skill/app
```

and build every fragment the page shows (the hero's live screen, a feature's crop, a chart) as a real
piece of that app: `assets/app.css` for its panels, tables and controls, `assets/charts.js` for its
charts, real data that adds up, one finding stated, cropped and scaled the way the page's blueprint
treats a picture. A fragment that looks like a working product is the strongest picture a software page
has; grey bars and lorem numbers are the weakest. When a request mixes both (a landing page and the
dashboard behind it), build each with its own run and one shared palette and typeface.

## The run

Do these in order. Steps 1–5 take a few minutes and decide whether the page is any good.

### 1. Read the brief and the project

Find out what is real: the subject, the audience, the one thing the page must get someone to do, the
stack, any existing brand (colours, fonts, logo), and above all **what imagery truly exists**: the
project's own photographs or product shots, a real interface that can be shown, an image generation
tool you can call, or nothing. Do not plan around pictures you do not have. Without pictures of its
own, the page uses fewer, sharper pictures of the subject's world (step 6) and lets type and space
carry the rest; it never fills slots with whatever a search returns.

Name the pictures a visitor needs before deciding: for a place to stay, the rooms, the house and the
table; for food, the plates and the room; for a product, the product; for a practice, its work. When
the project has none of them, say in the report that they are missing (or ask, when the user is there
to answer) and choose a direction that does not promise them. Their slots are then drawn from the
subject (the room's plan at a size that can be read, the product in its normal pose;
`references/imagery.md` §8), never filled with the place's birds or weather.

If the request is vague, decide and state your reading in one line instead of asking. Ask only when a
missing fact blocks the work (for example, no product name).

Then **inventory the subject** in your notes: eight to twelve things that belong to this client and to
no competitor. Look for its name and what the name means; its address, door number, street and
neighbourhood, and what that place looks like (its tiles, signs, paint colours, typefaces on its shop
fronts, its light, its weather); the numbers in the brief (seats, rooms, minutes to the sea, the
price, the year); the constraint it lives with (only one batch a month, closed in winter, by
appointment); its materials and colours; its rituals and hours (the oven lit at five, the ferry at
seven); the printed things of its world (a timetable, a label, a ticket, a sign). This list is where
the idea comes from in step 4. In blind tests, the page that won each brief was built from an item on
such a list (the client's name and what it means, the street it stands in, the one constraint that
makes it what it is), and the pages that lost had a good composition with a category idea. The list
is also your picture search: each place, material and printed thing on it is a query for step 6.

### 2. Write the argument

Before any design, list the page as claims with their proof, one line per section, the way
`references/copy.md` §1 shows. The claims decide which sections exist and in what order. Delete any
section that has no claim. This is how you avoid the stock sequence of hero, logos, three features,
testimonial, pricing, call to action.

### 3. Draw the direction

```bash
node <skill>/scripts/draw.mjs --sector <sector> --brief "<one line about the subject>" \
  --sections <roles in the order of your argument> [--tone <tone>] [--have <assets>] [--keep palette,type]
```

This deals the whole sheet. Do not ask for options and do not pick a direction yourself (`--options`
and `--direction` exist for a person choosing, not for you): models given a choice took the same five
directions for 19 of 25 pages. If the dealt direction truly cannot carry this subject (it needs
photographs that cannot exist, or contradicts a stated brand), redraw it once with `--redraw direction`
and say why in the report.

- `--sector`: `node <skill>/scripts/draw.mjs --list sectors`. Pick the closest.
- `--sections`: roles from `--list roles` (features, showcase, how-it-works, testimonial, proof, stats,
  pricing, faq, cta, footer, intro, about, work, gallery, list, contact). The hero is implied.
- `--tone` (optional): quiet, bold, warm, technical, playful, luxury, editorial. Only pass it when the
  brief clearly asks for one.
- `--have`: assets that really exist, comma-separated: `photography` (the project's own photographs of
  the place, people or work), `product-photo` (photographs of the specific product, or an image tool
  that can make them), `product-ui` (real screenshots), `illustration`, `video`. Leave it out if you
  have none: the draw then avoids compositions that depend on them and the sheet says how to fill
  picture slots honestly (software shows its own interface built in HTML; a product with no photographs
  is drawn and set among real pictures of its world, never a fake product shot). Pictures you will
  find in the open collections are not the project's own; leave them out of `--have`.
- `--keep palette,type`: when the brand already fixes colours or typefaces. The draw then deals only
  the composition, and you map the brand's values onto the roles.

The command prints a **direction sheet**. It is the art direction for this build:

- **Adopt it.** Do not blend it with the layout you would have made anyway. If it feels unfamiliar,
  good: the familiar layout is the one this skill exists to prevent.
- Redraw one slot (`--redraw hero | type | palette | photos | scenes | section:<role> | direction`) only for a
  reason you can state: it contradicts a stated brand constraint, needs an asset that does not exist,
  or is a section that cannot hold the real content (next point). Never redraw to get something more
  comfortable. Record every redraw in your report.
- When a dealt section cannot hold the real content (it compares three plans and there is one price;
  it wants five quotations and there are none), do not bend the content to fit. List the others with
  `--alternatives <role>`, pick the one whose assumptions match the content, and take it with
  `--redraw section:<role>=<id>`.
- **Check the palette against the subject.** A dealt palette is a set of proportions (one ground, one
  ink, one accent, fields) as much as a set of colours. If its colours fight the subject's own material
  (candy pastels for a peat whisky, neon for a mountain hut), redraw the palette once; if the subject
  has unmistakable colours of its own (its material, the paint of its street, the landscape outside
  its windows), keep the dealt proportions and take the colours from the subject instead, and say so
  in the report.
- Reprint it any time with `node <skill>/scripts/draw.mjs --show`. In a long session, re-read it before each
  section you build.

### 4. Find the idea

The direction is a way of composing. The idea is what makes the page belong to this subject and no
other. Write this sentence in your notes and do not start building until both blanks are filled from
the subject itself:

> On this page, **[something that belongs to the subject]** becomes **[the device the direction calls for]**.

Places to look for the first blank:

- **Its output.** What does the thing produce? Put the real output on the page as material. (A camera
  that prints poems delivered its copy as paper slips.)
- **Its object or shape.** What does it physically look like, in cross-section, in silhouette?
  Enlarge it, crop it, make it the frame or the one motif.
- **Its name.** What does it mean, and what does that meaning look like? (Never a picture inside the
  letters or between the words: that is a generated-page tell now.)
- **Its place.** Is there one view that makes someone want to be there?
- **Its ritual.** Is there a sequence the page can perform as it scrolls?
- **Its artefact.** What printed thing already exists in its world: ticket, menu, label, receipt,
  invitation, folder, manual?
- **Its opposite.** Which other category owns the feeling this one lacks?

Fill the first blank from your inventory (step 1), not from the category. **The competitor test:** put
the nearest real competitor in the sentence (the bakery two streets away, another oak furniture maker,
another hut on the same mountain). If the sentence still works, the idea belongs to the category: a
loaf of bread is every bakery; the seven doors of the street this one is named after are only this one.
"Clean and modern" is not an idea. The sites the study's panel scored lowest were the ones whose idea
was recorded as "none beyond the standard formula".

**The interactive piece, only when the sheet deals one** (section 0). Most pages get none: when every
page had a live widget, it became the kit (33 of 34 reviewed pages), and half of them were toys.
When one is dealt, it is a tool the visitor would really use, made from the subject's real content: set
the loan and read the real monthly figure; pick the dates and see the free rooms; choose a size and see
it against the room. Rules: it works on a phone with a thumb, it has a plain fallback without script,
it never blocks reading, and it is one thing, not a playground. Its result stays in view while the
visitor works the controls, at every width, and every heading beside it is true for every state it can
reach. Build it in step 6, then drive every control to its extremes and look at the widest result at
1440, 768 and 390, since the inspector only sees the default state.

**The scenes carry the idea too.** The scroll scenes on the sheet are devices waiting for a subject.
Decide what each one shows from your inventory before building: the fly-through passes through this
studio's own title cards, the route is the road this shipment really takes, the picture that opens to
the whole screen is the room the guest will wake up in. A scene filled with pictures that could belong
to anyone is a screensaver, and one still filled with its demo's town, photographs or words is not
started.

### 5. Write the words

Write the whole page as a copy deck (plain text) before markup, following `references/copy.md`:

- **Every headline fits in two lines or fewer at every width.** Do the arithmetic in copy.md §2 before
  committing to a sentence: about 32 characters is safe everywhere at a confident size. The studied
  gallery heroes have a median of 5 words and 32 characters.
- One supporting sentence, directly under the headline (32–48px below it) and shown with it, never
  docked at the foot of the first screen or held back by an animation. When the headline is a name or
  a figure of speech, this sentence says plainly what the thing is. One primary action, named for what
  it does, as a real button on the first screen.
- **The first screen answers the visitor's first question in large type.** For an event: what it is,
  when and where (the dates belong in the headline or at the second size, never only in small text).
  For a product: what it is and what it costs or does. For a person: who and what they do. Every
  section the visitor came for (the line-up, the menu, the rooms, the price) has its own heading and
  its own place in the navigation.
- **The full content, in few words.** Every section the brief asks for delivers its information
  completely (the whole menu with prices, each room with its details, every speaker, the price with
  what it includes, an answer for each real question), as facts: lists, tables, names and numbers, not
  paragraphs about them. Budgets: a section heading of two to eight words; one or two sentences under
  it; card or item text of one sentence; no paragraph over about 50 words. Plain words that say what
  the thing is and does, never jargon the visitor has to decode ("Folgezettel spine", "0.8 ms at 90k
  cards"). If a sentence could be cut without losing a fact, cut it.
- **No labels that carry nothing.** No timestamps, "connected source", status chips, tags, kickers or
  captions on cards unless the visitor needs that fact. A caption under a picture says what a visitor
  needs to know about it, or is not there.
- **The sections that convert are complete.** The price says what it includes and the terms (trial,
  billing, cancelling) as a short list; booking asks for what a booking needs (dates, guests, room);
  proof is facts the page can stand behind (what the file format is, how many rooms face the fjord,
  the warranty), never invented customers or quotes.
- **Nothing on the page talks to the client.** No "drawn until the rooms are photographed", no "sample
  content", no `.example` addresses: what is missing goes in the report (the inspector fails notes and
  warns on placeholder contacts).
- Sample details are expected where the brief leaves gaps (dish names, room names and rates, project
  titles) so the design is seen at full density; list them in the report for the client to confirm.
  Proof is never invented: no customers, quotes, reviews, press, logos or business statistics.

### 6. Build it, still

Build the page with motion switched off in your head; a page that needs animation to look finished is
not finished. Order of work:

1. **Tokens.** Colour and type roles from the sheet as CSS custom properties. Everything downstream
   references tokens only. `<skill>/assets/base.css` is a neutral foundation you may start from (reset, token
   names, fluid type steps, grid, focus and selection styles, the motion helpers); it has no look of
   its own.
2. **The hero, in the shape its blueprint describes,** set in the dealt type, colour and frame, at
   desktop and at phone width. The headline takes the dealt display step, not a size the blueprint
   names. Get the main thing clear before anything else exists.
3. **Each section in the shape of its blueprint,** with this project's content. A blueprint is one
   example of a shape (what is large, what sits beside what), not a drawing to trace: let the real
   content decide the details, and leave its props behind (a café blueprint's opening-hours bar stays
   with cafés). Neighbouring sections must not share a layout. **Carry the idea into every section,**
   pricing and FAQ included: the commonest failure in the study is a distinctive first screen followed
   by stock blocks.
4. **Pictures: fewer, better, larger.** Professional sites give about 30% of every screen to pictures;
   the builds this skill used to make gave 10%, mostly small, soft or random. Order of sources:
   1. the project's own;
   2. generated, if you have an image tool: the best way to show this exact subject;
   3. the photographs dealt on the sheet and the rest of the library (`draw.mjs --photos <words>`):
      sharp, modern, no credit needed; atmosphere, never a stand-in for the product or the client;
   4. sharp modern photographs of the subject's world from the open collections
      (`node <skill>/scripts/assets.mjs "<query>"`, 1800px or wider by default). Look at each one at
      full size before using it;
   5. drawn in code, large and precise, for the subject's own things that no picture shows;
   6. type and space alone. An empty slot is better than a bad picture.

   Rules: every picture shows this subject's world and is requested at least 1.5 times the size it is
   shown (twice for the hero); one treatment for all (section 0); three to eight good pictures beat
   twelve weak ones. Archive photographs, old maps and engravings only when they are the idea itself
   (the history this subject continues, like the slip boxes behind a notes app), sharp, large and of
   one family; never as filler or a random old picture of the place. Never a picture inside a headline
   or a thumbnail inside a sentence. Software shows itself large on the first screen, at a size a
   visitor can read, and at least one other large picture that is not an interface card; never more
   than two sections in a row made of interface cards. Credits a licence requires go in one "Image credits" dialog opened from a small footer link
   (`assets.mjs --credits` prints it), never as a list across the footer, never as a sentence on the
   page. When the project has footage or a real picture of its own product, the first screen shows it,
   large. A portfolio whose work is invented for the brief shows each piece as a finished still of that
   work (its title card, an end frame, a poster), with real detail.

   `references/imagery.md` covers searching, licences, video, drawing, crops and treatments.
5. **The navigation and the footer** as section 0 deals them: a real header with the page's sections
   as links and the one action, on every page; a footer that works (links, contact, legal), never a
   giant name or email. **The interactive piece,** only if dealt, in the section where it proves the
   claim, with real content, a thumb-sized phone version and a plain fallback.
6. **The scroll scenes,** when the sheet deals them (section 9), each with the section it carries: the page's big
   moments, the camera that flies through the work, the picture that opens to the whole screen, the
   word that buckles under the scroll. Copy the shared stage and the scene's files from
   `<skill>/assets/scenes/`, fill the scene with this project's own pictures and words, and set the
   page's tokens so it takes the page's look. `assets/scenes/demo/<id>.html` is a working example of
   each, and its content is a placeholder: every picture, word and drawn thing in your scene comes from
   this subject, and a route map shows the real route, coast and relief. A scene whose pictures or
   drawings are still the demo's, or the stand-in a script draws when it is given nothing (the route's
   bare ground with only the road), is unfinished. A scene is composition: it decides how long the page is and what
   each screen shows, so it is built now and seen in every look round, not added at the end. It
   replaces the content of the section it carries, never adds screens of nothing in front of it, and a
   page with scenes still has a length budget: about 12-16 screens at 1440 in all, of which the scenes
   hold about six. `references/scenes.md` says how to put one on a page, fill it, fit it and check it.
7. **Fullness.** Look at each desktop screen as a poster: one dominant thing and the content it
   carries. A screen that is mostly empty ground is an underbuilt section, not a rest; one deliberate
   rest per page is the limit, and the inspector fails a page with two or more near-empty screens.
   Running text is in the full ink at 16px or more; grey is for secondary notes.
8. **The frame.** The page has one pair of equal outer margins at every width, and every section uses
   the width the page has set up: when its text sits in the left half, the right half holds its
   picture, its second column, its list or its figure, never nothing. Asymmetry lives inside the grid,
   never in the frame: a void is placed only when something closes it on the far side. No stretch of
   the page taller than about half a screen holds nothing at all; sections are 120–240px apart on
   desktop. Every section the visitor came for opens with a heading that names it, and the first
   screen carries the page's title in an `h1`. These are what readers name first when a page looks
   wrong ("no clear title", "random empty space", "everything is pushed to one side"), and the
   inspector measures each of them. On a page longer than about ten screens at 1440 (a page with
   scenes always is), the navigation stays in reach after the hero: the plain bar hides while the
   visitor scrolls down and comes back on the first scroll up, on a solid band of the ground where it
   passes pictures, or at least the one action stays fixed in a corner. A hero that animates its bar
   away hands it on to that bar (`references/layout.md` §7).
9. **States and semantics.** Real links and buttons, visible focus, alt text, a phone layout that is
   its own composition. Every navigation and skip link lands on the section that holds what it names,
   never on a scene that only introduces it. Every control, any tool included, works from the
   keyboard alone in reading order and has an accessible name: its visible label, or `aria-label` when
   it shows only an icon.

Read `references/type.md`, `references/colour.md` and `references/layout.md` when you need the detail
behind a decision; the laws below are the short form.

### 7. Gate

```bash
node <skill>/scripts/lint.mjs <source files or folder>
node <skill>/scripts/inspect.mjs <url or path/to/index.html>
node <skill>/scripts/scenes.mjs <url or path/to/index.html>     # when the page has scroll scenes
```

`scenes.mjs` photographs every scroll scene at 0, 10 … 100% of its hold, on desktop and on a phone,
and the reduced-motion page; with scenes on the sheet, `inspect.mjs` also films the whole scroll
(`desktop-film-NN.jpg`). A scene that never started or rests on desktop is a `FAIL`.

`lint.mjs` scans source for banned patterns and stock phrases. `inspect.mjs` opens the page in a real
browser at 1440, 768 and 390 pixels, measures it (headline line counts, type sizes, fonts actually
loaded, colours, rules, shadows, gradients, contrast, overflow, and the frame: equal margins, sections
huddled on one side, blank stretches, the title, untitled sections, text against the screen edge) and
saves screenshots to `.taste-skill/inspect/`. Fix every `FAIL`. Treat each `WARN` as wrong unless you can defend it to a
designer in one sentence. Re-run until there are no `FAIL`s. Do not argue with the meter and do not
hide things from it. The inspector serves local files over a throwaway local server; if the page must
also open straight from the file system, open `index.html` that way once before you finish.

Inspect what the visitor receives. With a build step, run the last gate on the production build
(`vite build && vite preview`, `next build && next start`, or the built `index.html`), not only on the
dev server: minifiers and bundlers change what ships (one dropped a `backdrop-filter` that the dev
server showed). The inspector warns when it is looking at a dev server.

### 8. Look

Passing the gate means nothing banned was measured. It does not mean the page is good. Open the
screenshots the inspector lists (every viewport, with your image viewer or Read tool) and critique them
with `references/critique.md`: the fourteen passes, the Awwwards-weighted score, the caps. Write the critique
down in its format, fix the top three problems, run the inspector again, look again. Three rounds at
most.

Judge only the pictures. If a problem is visible in a screenshot, it is real, whatever the code says.

### 9. Move

Now build the motion layer. It is required, and it is more than one fade: the inspector counts the
elements that really move while the page loads and is scrolled, and fails a page under eight (it warns
under sixteen). Any scroll scenes are already built (step 6); around them the layer has four parts:

1. **The signature move** named on the sheet: one, done well (a dealt scene can be it).
2. **An entrance for the parts of every section:** the heading, then the text, then the picture,
   staggered by 60–90ms, rising 16–32px with opacity, triggered once as the section enters. Not one
   fade for the whole block, and never content that stays hidden if the script fails.
3. **Feedback on every control:** press, hover and focus on buttons, links, cards and any tool.
4. **Video or a moving picture only as section 0 deals it.** Most pages get none; motion comes from
   the page itself.

Transform and opacity only; every move has a `prefers-reduced-motion` fallback that keeps the content
and drops the travel. A move that changes the colour or the layout of whole screens (colour by
chapter, a pinned story) is part of the composition, so build it in step 6 and let every look round see
it. `references/motion.md` has the tokens and tested recipes. Then run the inspector once more and check
every screenshot for content that failed to appear.

### 10. Report

Do not report until all of these are true; each one was skipped in a test run that came out badly:

- `inspect.mjs` shows **0 FAIL** at 1440, 768 and 390, on the final version of the page.
- You opened every screenshot it listed after the last change, not only the first screen.
- With scroll scenes: `scenes.mjs` ran on the final page with no problems, and you read every sheet
  (desktop, phone, reduced motion).
- A stranger reading the first screen for five seconds can say what this is and what to do.
- Every section has a heading; the margins match on both sides; no stretch of the page is empty.
- The page is about 16 screens or fewer at 1440 (the inspector's header counts them), and the
  navigation or the one action can be reached from every screen.
- The critique of your last round is written down in the shape of `references/critique.md` §4.

Tell the user, briefly: the direction dealt (name and seed) and any redraws with reasons; the idea
sentence and the interactive piece, if one was dealt; the final scores from your last critique round
and what still falls short; every picture and clip with its source (and, where a licence asks, its
credit in the Image credits dialog); which bundled photographs and which drawings stand in for
photography (so they can be replaced); and any sample content that must be swapped before launch. Do
not claim a check you did not run.

## House rules

These hold on every build, whatever the direction. `inspect.mjs` measures them.

| Rule | Instead |
| --- | --- |
| **Headlines: two lines or fewer, at every width.** Every `h1`–`h6`, and the main line of the first screen whatever its tag. | Cut words. Then widen the measure. Size last. |
| **A clear title on the first screen**, in the page's one `h1`, and a heading on every section. | Say what this is: the name with what it does, the product with what it is for, the event with its date and place. |
| **Equal outer margins; no section huddled on one side** with the other half of the screen empty. | Close every void with something on its far side: the section's picture, a second column, a list, a figure. |
| **No blank stretches** taller than about half a screen. | The normal section gap. A deliberate rest is a placed picture or a field of colour, once per page. |
| **Statements are paragraphs.** An intro sentence or a quotation set large is marked up as `<p>` or `<blockquote>`, stays at statement size (36px or less on desktop, 24px on a phone) and runs to about 25 words, three lines. | Larger than that it is a headline and the two-line rule applies. In blind tests jurors read a 42px sentence over four lines as a four-line headline. |
| **No eyebrows.** No small label above a heading, no pill badge above the headline, no "New ·" chip. | Put the information in the heading or the first sentence, or drop it. |
| **No monospace** outside real code blocks. | The text face. Tabular figures where numbers align. |
| **No index numbering.** No 01 / 02 / 03, no (001), no "Step 2". | Order shown by position, size, or the words. A real `<ol>` if order matters. |
| **No thin rules.** No hairline dividers, no 1px outlined boxes, no grid lines, crosshairs or crop marks. | Space. A step in background tone. A change of scale. A filled shape. |
| **No gradients.** Not as backgrounds, not on buttons, not in text. | Flat colour, or a real photograph. A neutral scrim under text on a photo is the one exception. |
| **No shadows on things at rest.** No glows. | A tone step between surfaces. Shadows only on what truly floats: a menu, a dialog. |
| **No assistant palette.** No yellow-cream ground with terracotta or rust; no violet or indigo. | The dealt palette. |
| **No tiny uppercase letter-spaced labels.** | Sentence case at a readable size. |
| **No icon-topped feature cards, no rows of identical cards.** | The dealt section blueprint. |
| **No glass.** No backdrop blur panels, no floating pill navigation. | A plain bar: wordmark, a few links, one action. |
| **No emoji, no gradient blobs, no decorative shapes, no fake dashboards of grey bars.** | A real picture, a real interface fragment, or nothing. |
| **No styled accent word** in a headline (italic, serif, coloured, underlined). | One face, one colour. The words carry the emphasis. |
| **The dealt type system:** its faces, its weights, its six steps. Two families at most. | Map every other size onto the nearest step. |
| **No pictures in headlines or sentences.** No photograph between the words of a headline, no picture inside the letters, no thumbnails inside running text. | The picture gets its own place, beside, above or behind the words, at a size that shows what it is. |
| **One ground, one ink, one accent.** No page on a coloured ground with a second hue on it, no third hue anywhere, no tinted cards, chips or badges. | Neutral ground (white, off-white, near-black); colour from the pictures; the accent on the action. |
| **No giant name or email in the footer, no credit walls.** | The dealt footer: links, contact, legal at text sizes; picture credits behind one small "Image credits" link. |
| **No drag rails or progress bars** outside a working tool; no sideways scrollers on desktop. | A list or grid that fits the width. |
| **No page built from boxes,** no staggered folder tabs, no empty half-rows (nothing on the left, text on the right). | Text straight on the page, separated by space and size; tabs, if needed, as one working row that opens on click. |
| **No labels that carry nothing**, no walls of text. | Facts, few words; see step 5. |

Three places keep their own conventions and are left alone by the inspector: real code in
`<pre>`/`<code>` (monospace is correct there), real tables and form fields (they may have lines), and
a real interface fragment whose root carries the attribute `data-ui` (the product's own borders and
menus; see `references/imagery.md` §7).

Why these, honestly. Some are what the study measured: among the 247 sites, those the panel scored
7.5 or higher used icon feature cards 1% of the time against 28% for sites under 6.5, pill badges 14%
against 34%, gradients 22% against 52%, shadows 24% against 48%, tiny tracked caps 16% against 57%.
Others are the owner's taste and go against current gallery fashion: monospace labels, index numbers
and hairline grids are actually *more* common on award sites than on weak ones, which is exactly why
generators imitate them and why they now read as costume. They are banned here without exception.
`references/tells.md` keeps the dated registry.

Removing ornament leaves space. Never fill it with another ornament. Fill it with the full content,
with a good picture of this subject, or close the gap (tighter sections). Leave it empty on purpose
once per page at most.

## Laws of the craft

Short form. Numbers are from the study unless marked as house style.

**Type**
- The dealt six steps are the scale. The hero takes the display step the sheet deals: on professional
  sites the largest type is about 3.8vw (55px at 1440); a giant headline is a dealt event, not a habit.
- Display type: tracking and leading as dealt. Text: 16–18px, leading 1.45–1.6, 45–75 characters a line.
- Weights: only those the sheet loads. A weight the face lacks is faked by the browser (the inspector
  fails it).
- Left-aligned by default. Centre at most one moment.

**Space**
- One grid, one pair of tight margins (16–32px), used everywhere; large things run to the edges. Text
  blocks share two or three left edges on the whole page.
- Asymmetry inside the grid, never in the frame: the two outer margins are equal, and an off-centre
  heading is answered by something at the far side of the grid.
- The gap between sections is clearly larger than any gap inside one: 120–240px on desktop (the study's median is about 240).
- Each section has a different composition from its neighbours; none is a card grid.

**Colour**
- One ground, one ink, one accent. The accent appears on the action and perhaps one other thing.
  Professional sites put almost no page area on coloured grounds; colour comes from their pictures.
- Running text in the full ink. A page set in soft grey reads unfinished.
- Surfaces are separated by a small step in tone, never by a line or a shadow.
- At most one section changes to a field colour (the sheet deals it). Nothing fades into anything.

**Imagery**
- One dominant, sharp picture beats six small ones. On the top-scored sites the hero media covers at
  least half the first screen 68% of the time.
- Same crop ratios, same treatment, the dealt corners.
- No image is better than a placeholder, an icon, an abstract shape, or a blurry or random picture.
- Every picture is in the project, listed in the report; none is presented as the client's own.
- Nothing ever lies on top of a headline or a statement (the inspector fails it).

**Components**
- Buttons: flat, one fill colour, the dealt corner, decided once. Most strong heroes have one button,
  or two (the action and a quieter second).
- Navigation: the dealt kind, on every page, with the real sections as links and the one action. On a
  long page it stays in reach: the plain bar returns on scroll up, or the one action stays fixed.
- A control explains how to use it by its form, its label and its place. When it seems to need a
  sentence on how to operate it, redesign the control instead of adding the sentence. What a field
  accepts is different. First remove the limit where you can: a date picker, or a parser that takes
  any common format. A limit that remains, such as password rules or file type and size, stays visible
  beside the field and is tied to it with `aria-describedby`.
- The footer is the dealt kind: it works (links, contact, legal) at text sizes. None of the 65
  professional sites studied sets a giant name or email there.

## Special cases

**An existing brand or design system.** Pass `--keep palette,type`, map the brand's colours and faces
onto the roles, and take only composition from the draw. The house rules still apply; if the brand
itself requires a banned device (its logo sits in a gradient, its accent is violet), keep the brand
asset, say so in the report, and pass `--allow <rule>` to the inspector for that rule only.

**Redesign, restyle or review of an existing page or app screen.**

1. **Record the before.** Run the project as it is and inspect it into its own folder
   (`inspect.mjs <url> --out .taste-skill/before`, with `--app` for an app screen) and lint its
   source. Read the code: the framework, the styling method (Tailwind v3 or v4, CSS modules,
   styled-components, plain CSS), the components, and what must survive: routes, forms, data,
   behaviour, the brand's own assets.
2. **A review stops here.** Critique the before screenshots with `references/critique.md`, list the
   findings with the inspector's measurements, and name the three changes that would move the page
   most.
3. **Keep the stack, the content and what works.** No framework or styling-library migration; check the
   dependency file before adding anything. A restyle keeps the layout and takes type, colour and
   components from a dealt direction (`--keep` whatever the brand fixes); a redesign deals a full
   direction and rebuilds the sections from its blueprints inside the existing components. Either way
   proceed from step 2 of the run with the page's real content.
4. **Order of work, biggest effect for least risk:** type (faces and scale), colour (one ground, one
   ink, one accent), the frame (margins, section rhythm, a title on the first screen and a heading on
   every section), states (hover, focus, loading, empty, error), then the stock components (icon
   cards, pill badges, gradient blobs, card grids) replaced by the dealt blueprints.
5. **Prove it.** Inspect again into `.taste-skill/after`, compare before and after at every width,
   click through every link, form and menu that worked before, and report the before and after
   measurements side by side.

**A component or a single section, not a page.** Skip the draw unless there is no direction to follow.
Match the surrounding design, apply the house rules and the laws, and still inspect the result.

**No checkout, no form backend.** The primary button goes to the real destination when the brief names
one. Otherwise it opens an email to the client's real address with a written subject and body (`mailto:`
with the visitor's choices filled in); with no real address, it points at the page's own contact or
`#checkout` section and the report says it must be wired before launch. Never a made-up `.example`
address, never a fake payment form.

**No Chrome or Node 22.** Run `lint.mjs` (Node 18+), take screenshots with whatever browser tool you
have, and critique those. Say in the report that the inspector could not run.

**No network.** If `assets.mjs` reaches no source, draw the pictures and say in the report that the
open collections could not be searched.

## Files

| File | Read it when |
| --- | --- |
| `references/app-screens.md` | Any dashboard, admin, settings or other app screen: its own run, rules, tokens and checks. |
| `references/copy.md` | Writing the argument and the copy deck (steps 2 and 5). The two-line arithmetic. |
| `references/type.md` | Setting type: scales, tracking, measure, loading fonts, pairing. |
| `references/colour.md` | Applying the palette: roles, proportions, tone steps, dark pages, contrast. |
| `references/layout.md` | Grid, margins, rhythm, section variety, navigation, footer, the phone composition. |
| `references/imagery.md` | Choosing, finding, crediting, cropping and treating pictures; what to do with none. |
| `references/motion.md` | Step 9. Budget, tokens, recipes, reduced motion. |
| `references/scenes.md` | Step 6, when the sheet deals scroll scenes: putting one on a page, filling, fitting, the phone, checking, the catalogue. |
| `references/critique.md` | Step 8. How to look, how to score, what to fix first. |
| `references/tells.md` | The dated registry of generated-page tells and what each is replaced by. |
| `references/research.md` | The study: method, numbers, what the best and worst sites do. Cite it, do not guess. |
| `scripts/draw.mjs` | Deals and reprints the direction; `--photos`, `--site <id>` for more references; `--app` deals an app style instead. |
| `scripts/assets.mjs` | Step 6: searches open collections for real pictures of the subject's world; `--get` downloads with the credit, `--credits` prints them. |
| `scripts/lint.mjs` · `scripts/inspect.mjs` | The gate. |
| `scripts/scenes.mjs` | The gate for scroll scenes: each scene at 0-100% of its hold, desktop, phone, reduced motion. |
| `assets/base.css` · `assets/base.js` | An optional neutral foundation to build on. |
| `assets/scenes/` | The scroll scenes: the shared stage (`stage.js`, `stage.css`) and, for each scene in the library, its `.js`, `.css` and a working demo page in `demo/`. |
| `assets/app.css` · `assets/charts.js` | For app screens: a neutral shell, panels, tables and controls, and small SVG charts drawn to the app rules. |
| `library/` | The data the draw reads: directions, heroes, sections, type systems, palettes, photographs, studied sites, motions, scroll scenes (`scenes.json`), and the app styles, shells and screen patterns (`app.json`). Do not read it whole; use the script. |
