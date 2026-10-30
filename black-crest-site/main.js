/* Black Crest Web Designs: one small script for every page. No libraries, no tracking, no cookies. */

/* ==========================================================================
   CONFIG: edit prices and contact details here.
   Everything between CONFIG-START and CONFIG-END must stay valid JSON
   (double quotes, no trailing commas), because tools/build.py reads it too
   and writes the same numbers into the pages, so they show without JavaScript.
   After changing a price, run:  python3 black-crest-site/tools/build.py
   ========================================================================== */
const CONFIG = /* CONFIG-START */ {
  "currency": "AUD",
  "email": "kb.ventures@outlook.com",
  "phone": "",
  "packages": {
    "onePage": { "name": "One Page", "price": 490 },
    "fullSite": { "name": "Full Website", "price": 990 }
  },
  "carePlan": { "name": "Care plan", "pricePerMonth": 30 },
  "addOns": [
    { "id": "extraPage", "name": "Extra page", "from": 80, "perUnit": true, "note": "Each page beyond what your package includes." },
    { "id": "booking", "name": "Booking button", "from": 50, "note": "Links to the booking app you already use." },
    { "id": "map", "name": "Google Map", "from": 30, "note": "A map of your location on your contact section." },
    { "id": "logo", "name": "Logo tidy-up", "from": 60, "note": "We clean up the logo you have so it looks sharp on screens." },
    { "id": "gbp", "name": "Google Business Profile setup", "from": 80, "note": "We set up or tidy your free Google listing with you." }
  ]
} /* CONFIG-END */;
/* The add-on prices above are PLACEHOLDERS: change them to your real "from" prices.
   "phone": leave empty to hide every call button; add a number like "0400 000 000" to show them. */

(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = (n) => '$' + Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (_) {} }
  };
  document.documentElement.classList.add('js');

  /* ---------- Prices from CONFIG (the pages already hold the same numbers; this keeps them in step) ---------- */
  const addOn = Object.fromEntries(CONFIG.addOns.map((a) => [a.id, a]));
  $$('[data-price]').forEach((el) => {
    const k = el.dataset.price;
    const v = k === 'onePage' || k === 'fullSite' ? CONFIG.packages[k].price : k === 'carePlan' ? CONFIG.carePlan.pricePerMonth : addOn[k] && addOn[k].from;
    if (v != null) { el.textContent = (el.dataset.prefix ?? '$') + Number(v).toLocaleString('en-AU'); if (el.dataset.count) el.dataset.count = v; } // only the big balance numbers count up
  });

  /* ---------- Contact links: email always, call only when a phone number is set ---------- */
  $$('[data-email]').forEach((a) => { a.href = 'mailto:' + CONFIG.email; });
  $$('[data-call]').forEach((a) => {
    if (CONFIG.phone) { a.href = 'tel:' + CONFIG.phone.replace(/[^\d+]/g, ''); a.hidden = false; } else a.hidden = true;
  });

  /* ---------- First-visit intro: dark and gold, once per session, skippable ---------- */
  const intro = $('#intro');
  if (intro) {
    if (reduce || store.get('bc-intro')) intro.remove();
    else {
      store.set('bc-intro', '1');
      intro.hidden = false;
      const end = () => { if (!intro.isConnected) return; intro.classList.add('is-done'); setTimeout(() => intro.remove(), 450); };
      $('.intro-skip', intro).addEventListener('click', end);
      intro.addEventListener('click', end);
      document.addEventListener('keydown', end, { once: true });
      setTimeout(end, 1700);
    }
  }

  /* ---------- Menu (phones and tablets) ---------- */
  const menuBtn = $('.menu-btn'), menu = $('#menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      if (open) ($('a', menu) || menu).focus();
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------- Header shadow, and the gold line that draws as you scroll ---------- */
  const header = $('.site-header'), line = $('.scroll-line');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (line) line.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Fade/slide in on scroll, and number counters ---------- */
  const count = (el) => {
    const to = Number(el.dataset.count), pre = el.dataset.prefix ?? '$';
    if (reduce || !to) return;
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(to * e).toLocaleString('en-AU');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(count);
      if (en.target.matches('[data-count]')) count(en.target);
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.reveal, .draw').forEach((el) => io.observe(el));
  } else $$('.reveal, .draw').forEach((el) => el.classList.add('is-in'));

  /* ---------- Hero: a faint glow that follows the mouse ---------- */
  const hero = $('.hero');
  if (hero && finePointer && !reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      hero.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      hero.classList.add('has-glow');
    });
    hero.addEventListener('pointerleave', () => hero.classList.remove('has-glow'));
  }

  /* ---------- Slight card tilt on hover ---------- */
  if (finePointer && !reduce) {
    $$('.tilt').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-2px)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  /* ---------- Concept carousel: arrow buttons for the scroll-snap row ---------- */
  $$('[data-carousel]').forEach((wrap) => {
    const track = $('.carousel-track', wrap);
    $$('.carousel-btn', wrap).forEach((b) => b.addEventListener('click', () => {
      const card = $('li', track), gap = 16;
      track.scrollBy({ left: Number(b.dataset.dir) * ((card ? card.offsetWidth : 300) + gap), behavior: reduce ? 'auto' : 'smooth' });
    }));
  });

  /* ---------- Before/after slider ---------- */
  $$('[data-compare]').forEach((box) => {
    const range = $('input[type=range]', box);
    const set = () => box.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set); set();
  });

  /* ---------- Price calculator ---------- */
  const calc = $('#calc');
  if (calc) {
    const totalEl = $('#calc-total'), monthEl = $('#calc-month'), list = $('#calc-lines');
    const read = () => {
      const pkgKey = ($('input[name=pkg]:checked', calc) || {}).value || 'onePage';
      const pkg = CONFIG.packages[pkgKey];
      const lines = [`${pkg.name}: ${money(pkg.price)}`];
      let total = pkg.price;
      CONFIG.addOns.forEach((a) => {
        const box = $(`#add-${a.id}`, calc); if (!box || !box.checked) return;
        const qty = a.perUnit ? Number(($(`#qty-${a.id}`, calc) || {}).value || 1) : 1;
        total += a.from * qty;
        lines.push(`${a.name}${qty > 1 ? ' x ' + qty : ''}: from ${money(a.from * qty)}`);
      });
      const care = $('#add-care', calc).checked;
      if (care) lines.push(`${CONFIG.carePlan.name}: ${money(CONFIG.carePlan.pricePerMonth)} a month`);
      return { pkgKey, pkgName: pkg.name, total, care, lines };
    };
    const render = () => {
      const q = read();
      totalEl.textContent = money(q.total);
      monthEl.hidden = !q.care;
      list.replaceChildren(...q.lines.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
      $$('.qty', calc).forEach((s) => { const box = $(`#add-${s.dataset.for}`, calc); s.disabled = !box.checked; });
    };
    calc.addEventListener('input', render); calc.addEventListener('change', render); render();
    $('#calc-send').addEventListener('click', () => {
      const q = read();
      // only the chosen options travel to the contact page, kept in this tab's sessionStorage (never in the address)
      store.set('bc-quote', JSON.stringify({ pkgKey: q.pkgKey, total: q.total, care: q.care, lines: q.lines }));
      location.href = 'contact.html#quote';
    });
  }

  /* ---------- Quiz: "Is your website costing you customers?" (nothing is stored or sent) ---------- */
  const quiz = $('#quiz');
  if (quiz) {
    quiz.addEventListener('submit', (e) => {
      e.preventDefault();
      const qs = $$('fieldset', quiz), err = $('#quiz-error');
      const missing = qs.filter((f) => !$('input:checked', f));
      if (missing.length) { err.hidden = false; err.textContent = `Please answer all ${qs.length} questions (${missing.length} left).`; $('input', missing[0]).focus(); return; }
      err.hidden = true;
      const score = qs.filter((f) => $('input:checked', f).value === 'good').length;
      const out = $('#quiz-result'), band = score >= 5 ? 'high' : score >= 3 ? 'mid' : 'low';
      $$('[data-band]', out).forEach((p) => { p.hidden = p.dataset.band !== band; });
      $('#quiz-score', out).textContent = `${score} out of ${qs.length}`;
      const tips = $('#quiz-tips', out);
      tips.replaceChildren(...qs.filter((f) => $('input:checked', f).value !== 'good').map((f) => Object.assign(document.createElement('li'), { textContent: f.dataset.tip })));
      tips.hidden = !tips.children.length;
      out.hidden = false; out.focus();
      store.set('bc-quiz', String(score) + '/' + qs.length);
    });
    $('#quiz-review') && $('#quiz-review').addEventListener('click', () => { store.set('bc-review', '1'); });
  }

  /* ---------- Contact page: fill in a calculator quote or a quiz review request ---------- */
  const contact = $('#form-contact');
  if (contact) {
    const msg = $('textarea[name=message]', contact), subject = $('input[name=subject]', contact), quoteField = $('input[name=quote]', contact);
    const pick = (v) => { const r = $(`input[name=need][value="${v}"]`, contact); if (r) r.checked = true; };
    let q = null; try { q = JSON.parse(store.get('bc-quote') || 'null'); } catch (_) {}
    if (q && location.hash === '#quote') {
      pick(q.pkgKey === 'fullSite' ? 'Full Website' : 'One Page');
      const text = `Please send me a quote for:\n- ${q.lines.join('\n- ')}\nEstimated total from ${money(q.total)}${q.care ? ' plus the care plan' : ''}.`;
      msg.value = text; quoteField.value = q.lines.join('; ') + `; total from ${money(q.total)}`;
      subject.value = 'Black Crest: quote request from the price calculator';
      const note = $('#prefill-note'); note.hidden = false; note.textContent = 'We filled in the options you chose in the price calculator. Add anything else below.';
    } else if (store.get('bc-review') && location.hash === '#review') {
      pick('Not sure');
      const s = store.get('bc-quiz');
      msg.value = `I took the website quiz${s ? ' (score ' + s + ')' : ''}. Please send me a free mini review of my website: `;
      subject.value = 'Black Crest: free mini website review request';
      const note = $('#prefill-note'); note.hidden = false; note.textContent = 'Add your website address to the message and we will email you a short review.';
    } else {
      const need = new URLSearchParams(location.search).get('need');
      if (need) pick({ 'one-page': 'One Page', 'full-website': 'Full Website', 'care-plan': 'Care plan' }[need] || 'Not sure');
    }
  }

  /* ---------- Forms: Web3Forms, the same service as the KB Ventures site ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $$('form[data-form]').forEach((form) => {
    const status = $('.form-status', form), btn = $('button[type=submit]', form), label = btn.textContent;
    const showErr = (field, text) => {
      const out = $('#' + field.getAttribute('aria-describedby').split(' ')[0]);
      field.setAttribute('aria-invalid', text ? 'true' : 'false'); out.textContent = text; out.hidden = !text;
    };
    const check = (field) => {
      const v = field.value.trim();
      if (field.required && !v) return showErr(field, field.dataset.empty || 'Please fill this in.'), false;
      if (v && field.type === 'email' && !EMAIL_RE.test(v)) return showErr(field, 'Please enter a valid email address, like name@example.com.'), false;
      if (v && field.dataset.contact && !EMAIL_RE.test(v) && v.replace(/\D/g, '').length < 8) return showErr(field, 'Please enter an email address or a phone number.'), false;
      showErr(field, ''); return true;
    };
    const fields = $$('[aria-describedby][required], [aria-describedby][type=email], [data-contact]', form).filter((f) => f.id);
    fields.forEach((f) => f.addEventListener('blur', () => { if (f.value) check(f); }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = fields.filter((f) => !check(f));
      if (bad.length) { bad[0].focus(); return; }
      if ($('input[name=botcheck]', form).checked) { location.href = form.dataset.thanks; return; }
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.redirect; data.botcheck = false;
      btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = ''; status.className = 'form-status';
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || res.status);
        store.del('bc-quote'); store.del('bc-review');
        location.href = form.dataset.thanks;
      } catch (_) {
        btn.disabled = false; btn.textContent = label;
        status.className = 'form-status is-error';
        status.innerHTML = `Sorry, that did not send. Please try again, or email us at <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>.`;
      }
    });
  });

  /* ---------- Small things ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
})();
