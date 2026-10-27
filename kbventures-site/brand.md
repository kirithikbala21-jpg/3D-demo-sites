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
- **Type:** Geist (SIL Open Font License, self-hosted), weight 500 for headings, tight line height, slightly negative letter-spacing. Hero h1 `clamp(44px, 8vw, 96px)`, section h2 `clamp(34px, 6vw, 80px)`, body 17–18px at 1.6, small labels in uppercase with wide tracking in silver.
- **Light:** one soft, wide, cool silver-blue radial light behind the hero frame at very low opacity, plus a hairline highlight on the frame's top edge. Nothing else glows: no glowing buttons or text, no gradient text, no glass.
- **Buttons:** small pills. Primary is a platinum background with obsidian text and no shadow. Secondary is transparent with a 1px silver border that turns gold on hover.
- **Gold, used only for:** the short hairline under the hero label, secondary-button borders on hover, links on hover, and the Live/Starting dots.
- **Cards:** graphite, 1px silver border, 20px radius. Secondary text starts dimmed and brightens to platinum on hover or focus. (The brief asked for silver at about 60% opacity, but that measures 2.75:1 on graphite, under the 4.5:1 minimum. So the dimmed state is full silver at 5.3:1 and the hover state is platinum: the same effect, still readable.)
- **Layout:** the hero text is left-aligned over the lit frame, and every later section is centred (headline, one paragraph, one pill, then the visual). 140px or more between sections on desktop, 80px on phones.
- **Nav:** slim and sticky. Wordmark on the left; Businesses, Websites, Contact and a small "Get in touch" pill on the right. On phones the text links fold away and the pill stays.
- **Motion:** slow and quiet. Fade-up on scroll, a gentle parallax on the hero frame, Lenis smooth scrolling. All off with `prefers-reduced-motion`.
- **Contrast:** at least 4.5:1 for all text.
