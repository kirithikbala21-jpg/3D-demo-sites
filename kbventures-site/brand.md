# KB Ventures: design brief (dark, premium)

Inspired by the *feel* of a premium dark product page (Revolut's Ultra plan page, studied on 27 October 2026). Nothing is copied: no layout, text, logo, icon, font or image from Revolut or any other company.

## Eight techniques noted from the reference
1. **One lit object in the dark.** The hero has a single product shot on near-black, lit by a cool blue-silver light from one side, so only its edges catch light. The rest of the page stays unlit.
2. **Calm, left-aligned hero text.** A short label line, a big headline and one sentence sit on the left, with the lit object on the right. Only one pill button.
3. **Centred sections after the hero.** Every section below is centred: headline, one or two lines of grey text, one small pill, then the visual.
4. **Headlines large but not shouting.** A geometric grotesk, medium weight, tight leading and slightly negative tracking. Section headlines are about two-thirds of the hero size.
5. **Small pill buttons.** Light pill with dark text for the main action, and very little padding. No shadows, icons or gradients.
6. **Dark cards with dimmed text.** A grid of near-black cards with soft rounded corners and a hairline edge. The title is bright and the body text grey, so the page reads in two levels.
7. **A sideways image row.** Large framed photos sit in a row that scrolls sideways, with small tabs/dots to show where you are.
8. **A lot of black space and slow motion.** 150–200px between sections. Content fades up gently on scroll and nothing bounces or flashes.

## Design system (the CSS variables in `styles.css`)
```
--bg-obsidian:    #0D0E12   page
--bg-graphite:    #1A1C23   cards, frames
--text-platinum:  #E4E6ED   headings, primary pill (13.6:1 on graphite)
--silver-brushed: #8A8F9E   labels, secondary text (6.0:1 on obsidian, 5.3:1 on graphite)
--gold-champagne: #D4AF37   accent, under 5% of the page
--border-premium: 1px solid rgba(138,143,158,.2)
--radius-card:    20px
--radius-pill:    9999px
```
- **Type:** Geist (SIL Open Font License, self-hosted), weight 500 for headings, tight line height, slightly negative letter-spacing. Hero h1 `clamp(40px, 5.2vw, 76px)` (four lines beside the hero object), section h2 `clamp(34px, 6vw, 80px)`, body 17–18px at 1.6, small labels in uppercase with wide tracking in silver.
- **Light and shine (replaces the earlier "nothing glows, no metallic fills" rule, 27 October 2026):** the page should look like a lit product photo of brushed metal and piano-black glass, restrained but visible.
  - Background: a layered deep blue-black surface (`#090B11` base) that reads like lit glass: a faint light from the top of the screen, three cool silver-blue light pools (behind the hero object, the demo row and the contact section), a slightly lighter band at the horizon of each section that fades out on both sides of the edge, a vignette at the screen edges, and 3.5% film grain so gradients don't band.
  - Hero: a Three.js (r160, self-hosted) card, not a framed screen. It has the proportions of a thin card with corners at 6% of its width, deep black glass over fine brushing with a subtle vertical gradient, and a slim bevelled metal edge that catches a bright line along the top and falls dark at the bottom. One fine brushed-gold line runs around the outer bevel only, and the KB mark is raised polished metal with a soft shadow, with VENTURES in metallic foil. It is lit by a small studio built into the environment map (three bright light strips plus a soft panel above the viewer), so it carries real specular highlights. It is tilted about 15 degrees on two axes, drifts slowly, leans toward the pointer or phone tilt, and a wide soft reflection sweeps the face every 7 seconds. A contact shadow and a faint mirror image sit beneath it, fading into the page. A pre-rendered still (`img/hero-object.webp`) stands in while it loads, without WebGL, on weak phones, on Data Saver and with reduced motion.
  - Cards and frames: dark glossy panels with a 1px bright top edge fading to the sides, a faint diagonal sheen, a slightly lighter inner border, a soft shadow underneath, and one slow light sweep on hover. Screenshot frames are polished dark-metal bezels with a bright edge and a soft reflection on the glass.
  - Headlines: platinum with a light-to-silver vertical fall-off of about 10%, repeated per line. Primary pills: polished platinum with a fine top highlight, and a highlight that slides across once on hover.
  - Never rainbow or gold gradients, never neon, never pulsing or blinking. New hero objects are compared with the previous one, and only the one that looks more like a real expensive object ships.
- **Buttons:** small pills. Primary is polished platinum (light to slightly darker platinum, fine top highlight, a small soft drop shadow) with obsidian text. Secondary is dark glass with a 1px silver border that turns gold on hover.
- **Gold, used only for:** the short hairline under the hero label, secondary-button borders on hover, links on hover, the Live/Starting dots, and the single fine brushed-gold line on the hero card's outer bevel.
- **Cards:** glossy graphite panels (see Light and shine), 1px silver border, 20px radius. Secondary text starts dimmed and brightens to platinum on hover or focus. (The brief asked for silver at about 60% opacity, but that measures 2.75:1 on graphite, under the 4.5:1 minimum. So the dimmed state is full silver at 5.3:1 and the hover state is platinum: the same effect, still readable.)
- **Layout:** on desktop the hero has two columns, text on the left (about 57%) and the lit object on the right, overlapping the column edge a little; on phones they stack. Every later section is centred (headline, one paragraph, one pill, then the visual). 140px or more between sections on desktop, 80px on phones.
- **Nav:** slim and sticky. Wordmark on the left; Businesses, Websites, Contact and a small "Get in touch" pill on the right. On phones the text links fold away and the pill stays.
- **Motion:** slow and quiet. Fade-up on scroll, a gentle parallax on the hero object, its slow idle turn and reflection sweep, Lenis smooth scrolling. All off with `prefers-reduced-motion`.
- **Contrast:** at least 4.5:1 for all text.
