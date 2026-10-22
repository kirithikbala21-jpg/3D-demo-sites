// Footer / contact icon links and plain buttons. A link is only output when its URL is set in site.config.json; an empty URL shows nothing.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ICONS = {
  google: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z M12 7a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17.500 6.500h.01',
  facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.500a.5.5 0 0 1 .5-.5z',
  star: 'M12 3l2.800 5.800 6.200.9-4.500 4.400 1.100 6.200L12 17.300 6.400 20.300l1.100-6.200L3 9.700l6.200-.9z',
};
const icon = (k) => `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[k]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
/** <li> items for an icon list: Google Maps, Instagram, Facebook (only those with a URL). */
export function socialItems(cfg) {
  const items = [['google', 'Find us on Google Maps', cfg.googleMapsUrl], ['instagram', 'Follow us on Instagram', cfg.instagramUrl], ['facebook', 'Find us on Facebook', cfg.facebookUrl]];
  return items.filter(([, , u]) => u).map(([k, l, u]) => `<li><a class="soc-link" href="${esc(u)}" target="_blank" rel="noopener" aria-label="${l} (opens in a new tab)">${icon(k)}</a></li>`).join('');
}
/** Plain buttons for the contact page. */
export function socialButtons(cfg, btnClass = 'btn') {
  const items = [['google', 'Find us on Google Maps', cfg.googleMapsUrl], ['instagram', 'Follow us on Instagram', cfg.instagramUrl], ['facebook', 'Find us on Facebook', cfg.facebookUrl]];
  return items.filter(([, , u]) => u).map(([k, l, u]) => `<a class="${btnClass}" href="${esc(u)}" target="_blank" rel="noopener">${icon(k)} ${l}</a>`).join(' ');
}
