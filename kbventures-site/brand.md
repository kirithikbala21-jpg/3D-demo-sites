# KB Ventures: what makes the demo sites feel premium (and what this site reuses)

1. **One dark base and one loud accent.** Near-black pages with warm off-white text and a single accent used only for buttons, small labels and lines. Here: ink-black with one cyan accent.
2. **A tight type pair.** A tall condensed uppercase display face for headlines, a clean sans for body, both self-hosted, on a `clamp()` scale with a 17px body. Here: Barlow Condensed 700 and Inter.
3. **A full-screen hero built in three layers.** A background layer (photo or glow), a 3D stage and the text drift at different speeds on scroll (no more than about 30px), and nothing moves under reduced motion.
4. **3D that never blocks the page.** Three.js loads only after the page is idle, skips Data Saver and weak phones, and a still illustration is always in the markup, so text paints first and nothing breaks without WebGL. Here: floating glass tiles, one per business.
5. **Calm, consistent motion.** Lenis smooth scroll, headlines that rise in word by word, and short reveals (opacity plus a 24px lift, staggered by 60ms) that run once.
6. **A header that gets out of the way.** It starts transparent over the hero and turns into a blurred, slightly opaque bar with a hairline border once you scroll.
7. **Generous spacing and hairlines instead of boxes.** 96 to 160px between sections, thin 14% white borders, small uppercase eyebrows with wide letter-spacing, and one big primary button per area.
8. **Honest detail.** Real screenshots, plain labels, no invented numbers, reviews or prices, and a visible note that the demos are concept demos for made-up businesses.
