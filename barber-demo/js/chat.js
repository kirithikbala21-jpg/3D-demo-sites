// Scripted chat assistant (demo): quick-reply buttons with canned answers, no network, no AI.
import { $, site, cafeNow, hoursFor, fmtHour, reduceMotion, modal } from './util.js';

const toggle = $('#chat-toggle');
const panel = $('#chat-panel');
const log = $('#chat-log');
const quick = $('#chat-quick');

const dayName = (d) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
function hoursText() {
  const order = [1, 2, 3, 4, 5, 6, 0].map((d) => site.hours.find((h) => h.day === d));
  const lines = []; let cur = null;
  for (const h of order) {
    if (cur && cur.open === h.open && cur.close === h.close) cur.days.push(h.name.slice(0, 3));
    else { cur = { open: h.open, close: h.close, days: [h.name.slice(0, 3)] }; lines.push(cur); }
  }
  const { day, hour } = cafeNow(); const t = hoursFor(day);
  const open = t && hour >= t.open && hour < t.close;
  return `${lines.map((l) => `${l.days.length > 1 ? `${l.days[0]} to ${l.days[l.days.length - 1]}` : l.days[0]} ${fmtHour(l.open)} to ${fmtHour(l.close)}`).join('<br>')}<br><br>Right now we are ${open ? `<strong>open</strong> until ${fmtHour(t.close)}` : '<strong>closed</strong>'} (${dayName(day)}, Sydney time).`;
}
const topics = [
  { q: 'Opening hours', a: hoursText },
  { q: 'Book a chair', a: () => 'You can book a haircut, shave or package on our <a href="book.html">booking page</a>, or add services to your visit as you browse the <a href="services.html">price list</a>.' },
  { q: 'Walk-ins', a: () => 'Walk-ins are always welcome until 30 minutes before close. Booked clients go first, so Saturdays can mean a wait, but there is a bench, free tea and water.' },
  { q: 'Prices', a: () => 'Haircuts start at $32 (buzz cut), a skin fade is $52 and a hot towel shave is $58. See every service and its time on the <a href="services.html">services page</a>.' },
  { q: 'Kids and seniors', a: () => 'Kids under 12 are $34, and seniors (65+) are $38 on weekdays before 2pm. The Father &amp; Son package puts two chairs side by side.' },
  { q: 'Talk to a person', a: () => `Of course. Call us on <a href="tel:${site.phoneHref}">${site.phone}</a> and a human will pick up during opening hours.` },
];

function say(who, html) {
  const m = document.createElement('div');
  m.className = `msg ${who}`;
  if (who === 'me') m.textContent = html; else m.innerHTML = html;
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
}
quick.innerHTML = topics.map((t, i) => `<button type="button" data-i="${i}">${t.q}</button>`).join('');
quick.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const t = topics[Number(b.dataset.i)];
  say('me', t.q);
  setTimeout(() => say('bot', t.a()), reduceMotion ? 0 : 450);
});

const dlg = modal(panel, { onOpen() { toggle.setAttribute('aria-expanded', 'true'); if (!log.children.length) say('bot', `Hi, I am the ${site.name} demo assistant. I can only answer a few questions, but I will do my best. What would you like to know?`); }, onClose() { toggle.setAttribute('aria-expanded', 'false'); } });
toggle.addEventListener('click', () => (dlg.isOpen() ? dlg.close() : dlg.open(toggle)));
