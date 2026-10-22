// Google rating badge: "Rated 4.9 on Google · 120 reviews" with five SVG stars filled to the rating.
// USE THE BUSINESS'S REAL RATING AND REVIEW COUNT. NEVER INVENT ONE. (The demo numbers are labelled "Demo number".)
// Returns '' (so nothing is shown) when the rating, the count or the Maps link is missing in site.config.json.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let n = 0;
export function starsSvg(rating, { size = 18, fill = '#f5b301', empty = 'rgba(128,128,128,.4)' } = {}) {
  const id = 'rs' + (++n), pct = Math.max(0, Math.min(5, Number(rating))) / 5 * 100;
  const star = (i) => `<path transform="translate(${i * 20} 0)" d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z"/>`;
  const all = [0, 1, 2, 3, 4].map(star).join('');
  return `<svg class="g-stars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 19" width="${size * 100 / 19}" height="${size}" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><rect width="${pct}" height="19"/></clipPath></defs><g fill="${empty}">${all}</g><g fill="${fill}" clip-path="url(#${id})">${all}</g></svg>`;
}
export function ratingBadge(cfg, { demo = true, cls = 'g-rating' } = {}) {
  const r = Number(cfg.googleRating), c = Number(cfg.googleReviewCount), url = cfg.googleMapsUrl;
  if (!(r > 0 && r <= 5) || !(c > 0) || !url) return '';
  return `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Rated ${r} out of 5 on Google from ${c} reviews (opens Google Maps in a new tab)">${starsSvg(r)}<span class="g-rating-text">Rated ${r} on Google · ${c} reviews</span>${demo ? '<span class="g-rating-demo">Demo number</span>' : ''}</a>`;
}
