// "Manage my booking": find a demo booking by its reference and phone number, then change or cancel it.
// DEMO ONLY: bookings live in this browser (localStorage key "tob-bookings"). A real shop would look the booking up in its booking system here,
// and "cancel" would tell the shop (and free the time for the waitlist).
import { $, site } from './util.js';
import { auPhone, PHONE_ERR } from './formkit.js';

const form = $('#manage-form');
if (form) {
  const out = $('#manage-result');
  const all = () => { try { return JSON.parse(localStorage.getItem('tob-bookings') || '[]'); } catch (_) { return []; } };
  const save = (list) => { try { localStorage.setItem('tob-bookings', JSON.stringify(list)); } catch (_) { /* ignore */ } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const err = (id, msg, el) => { $(id).textContent = msg; if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); return !msg; };
  const show = (html) => { out.innerHTML = html; out.hidden = false; out.focus(); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = form.elements.ref, ph = form.elements.phone;
    const refOk = err('#e-m-ref', /^TOB-[A-Z0-9]{4,8}$/i.test(ref.value.trim()) ? '' : 'Please enter the reference from your confirmation, like TOB-AB12CD.', ref);
    const phone = auPhone(ph.value);
    const phOk = err('#e-m-phone', phone ? '' : PHONE_ERR, ph);
    if (!refOk) { ref.focus(); return; } if (!phOk) { ph.focus(); return; }
    const rec = all().find((b) => b.ref.toUpperCase() === ref.value.trim().toUpperCase() && b.phone === phone);
    if (!rec) { show(`<p><strong>We could not find that booking.</strong> Check the reference and phone number, or call us on <a href="tel:${esc(site.phoneHref)}">${esc(site.phone)}</a>. (Demo: only bookings made in this browser can be found.)</p>`); return; }
    show(`<h3>Your booking</h3><dl class="ok-summary"><dt>Reference</dt><dd>${esc(rec.ref)}</dd><dt>Service</dt><dd>${esc(rec.service)}</dd><dt>Barber</dt><dd>${esc(rec.barber)}</dd><dt>When</dt><dd>${esc(rec.date)} at ${esc(rec.time)}</dd></dl>
      <p class="manage-actions"><button type="button" class="btn btn-primary" data-change>Change time</button> <button type="button" class="btn btn-secondary" data-cancel>Cancel booking</button></p>`);
    $('[data-change]', out).addEventListener('click', () => { try { sessionStorage.setItem('tob-change', rec.ref); } catch (_) { /* ignore */ } location.href = 'book.html#book'; });
    $('[data-cancel]', out).addEventListener('click', () => {
      out.innerHTML = `<p><strong>Cancel booking ${esc(rec.ref)}?</strong> This is a demo: only the copy saved in this browser is removed, and nothing is sent to the shop.</p><p class="manage-actions"><button type="button" class="btn btn-primary" data-yes>Yes, cancel it</button> <button type="button" class="btn btn-secondary" data-no>Keep it</button></p>`;
      $('[data-yes]', out).addEventListener('click', () => { save(all().filter((b) => b.ref !== rec.ref)); show(`<p><strong>Booking ${esc(rec.ref)} is cancelled</strong> (demo). The shop was not contacted. You can book again any time.</p>`); });
      $('[data-no]', out).addEventListener('click', () => show('<p>Your booking is unchanged.</p>'));
      out.focus();
    });
  });
}
