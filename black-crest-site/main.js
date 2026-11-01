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
    "onePage": { "name": "One Page", "price": 300 },
    "fullSite": { "name": "Full Website", "price": 700 }
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
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = (n) => '$' + Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
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
    if (v == null) return;
    el.textContent = (el.dataset.prefix ?? '$') + Number(v).toLocaleString('en-AU');
    if (el.dataset.count) el.dataset.count = v; // only the big balance numbers count up
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
      const end = () => { if (!intro.isConnected) return; intro.classList.add('is-done'); setTimeout(() => intro.remove(), 500); };
      intro.addEventListener('click', end);
      document.addEventListener('keydown', end, { once: true });
      setTimeout(end, 1500);
    }
  }

  /* ---------- Menu (phones and tablets) ---------- */
  const menuBtn = $('.menu-btn'), menu = $('#menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      $('.sr-only', menuBtn).textContent = open ? 'Close menu' : 'Open menu';
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      if (open) ($('a', menu) || menu).focus();
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------- Section titles reveal word by word ---------- */
  $$('[data-split]').forEach((h) => {
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span'), s = document.createElement('span');
          w.className = 'w'; s.textContent = part; s.style.setProperty('--i', i++); w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(h);
  });

  /* ---------- Reveal on scroll, number counters ---------- */
  const count = (el) => {
    const to = Number(el.dataset.count), pre = el.dataset.prefix ?? '$';
    if (reduce || !to) return;
    const t0 = performance.now(), dur = 1300;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + Math.round(to * e).toLocaleString('en-AU');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const watched = $$('.reveal, [data-split], .draw-line, .illo-wrap, [data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.matches('[data-count]')) count(en.target);
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    watched.forEach((el) => io.observe(el));
  } else watched.forEach((el) => el.classList.add('is-in'));

  /* ---------- Scroll-driven effects: header, gold progress line, parallax, pinned rail ---------- */
  const header = $('.site-header'), bar = $('.progress span');
  const para = reduce || innerWidth < 1024 ? [] : $$('[data-parallax]'); // parallax only where there is room for it
  const rail = $('[data-rail]');
  let railPinned = false;
  const sizeRail = () => {
    if (!rail) return;
    const pin = $('.rail-pin', rail), track = $('.rail-track', rail);
    railPinned = !reduce && innerWidth >= 1024;
    rail.classList.toggle('is-pinned', railPinned);
    if (railPinned) {
      const dist = Math.max(0, track.scrollWidth - innerWidth);
      pin.style.height = (innerHeight + dist) + 'px'; rail.dataset.dist = dist;
    } else { pin.style.height = ''; track.style.transform = ''; }
  };
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (bar) bar.style.transform = `scaleY(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    para.forEach((el) => {
      const r = el.getBoundingClientRect(), mid = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-mid * Number(el.dataset.parallax || 0.08)).toFixed(1)}px, 0)`;
    });
    if (rail && railPinned) {
      const pin = $('.rail-pin', rail), r = pin.getBoundingClientRect(), dist = Number(rail.dataset.dist || 0);
      const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      $('.rail-track', rail).style.transform = `translate3d(${(-dist * p).toFixed(1)}px, 0, 0)`;
      const n = $$('.rail-item', rail).length, c = $('.rail-count b', rail);
      if (c) c.textContent = String(Math.min(n, Math.round(p * (n - 1)) + 1)).padStart(2, '0');
    }
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', () => { sizeRail(); onScroll(); });
  sizeRail(); onScroll();

  /* ---------- Smooth wheel scrolling (mouse wheels only; keyboard, touch and scrollbars stay native) ---------- */
  if (fine && !reduce) {
    let target = scrollY, current = scrollY, running = false;
    const inScrollable = (el) => { for (; el && el !== document.body; el = el.parentElement) { const s = getComputedStyle(el); if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) return true; } return false; };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || inScrollable(e.target) || document.body.classList.contains('menu-open')) return;
      e.preventDefault();
      if (!running) { target = current = scrollY; }
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      target = clamp(target + dy, 0, document.documentElement.scrollHeight - innerHeight);
      if (!running) { running = true; requestAnimationFrame(function tick() {
        current += (target - current) * 0.12;
        if (Math.abs(target - current) < 0.5) { current = target; running = false; }
        scrollTo(0, current);
        if (running) requestAnimationFrame(tick);
      }); }
    }, { passive: false });
    addEventListener('keydown', () => { running = false; }, { passive: true });
  }

  /* ---------- Hero: keep the crest fully visible, above the headline and the price card ---------- */
  const heroStage = $('.hero-stage');
  if (heroStage) {
    const fitStage = () => {
      // phones and tablets: the crest sits above the text, so the text and the card are in its way; desktop: only the card
      const blockers = $$(innerWidth >= 1200 ? '.hero-card' : '.hero-grid .label, .hero-grid h1, .hero-card');
      heroStage.style.height = '';
      const s = heroStage.getBoundingClientRect();
      let limit = s.bottom;
      blockers.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > s.left && r.left < s.right && r.top < limit) limit = r.top; // only what sits under the crest's column
      });
      heroStage.style.height = Math.max(140, Math.floor(limit - s.top - 16)) + 'px';
    };
    fitStage();
    addEventListener('resize', fitStage);
    if (document.fonts) document.fonts.ready.then(fitStage);
  }

  /* ---------- Hero: soft spotlight that follows the cursor ---------- */
  const hero = $('.hero');
  if (hero && fine && !reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      hero.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      hero.classList.add('has-glow');
    });
    hero.addEventListener('pointerleave', () => hero.classList.remove('has-glow'));
  }

  /* ---------- Micro-interactions: spotlight borders, magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('.tile').forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
    $$('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${(x * 0.18).toFixed(1)}px, ${(y * 0.28).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- How it works: the pinned visual follows the step in view ---------- */
  const story = $('[data-story]');
  if (story) {
    const steps = $$('.story-step', story), stages = $$('.stage', story), num = $('.count b', story), fill = $('.bar i', story);
    const activate = (i) => {
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      stages.forEach((s, j) => s.classList.toggle('is-active', j === i));
      if (num) num.textContent = String(i + 1).padStart(2, '0');
      if (fill) fill.style.transform = `scaleX(${(i + 1) / steps.length})`;
    };
    activate(0);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) activate(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => io.observe(s));
    }
  }

  /* ---------- Rail buttons (when the rail is a swipe row) ---------- */
  if (rail) {
    const track = $('.rail-track', rail), items = $$('.rail-item', rail), c = $('.rail-count b', rail);
    $$('.rail-btn', rail).forEach((b) => b.addEventListener('click', () => {
      const w = items[0] ? items[0].offsetWidth + 18 : 300;
      track.scrollBy({ left: Number(b.dataset.dir) * w, behavior: reduce ? 'auto' : 'smooth' });
    }));
    track.addEventListener('scroll', () => {
      if (railPinned || !c) return;
      const w = items[0] ? items[0].offsetWidth + 18 : 300;
      c.textContent = String(Math.min(items.length, Math.round(track.scrollLeft / w) + 1)).padStart(2, '0');
    }, { passive: true });
  }

  /* ---------- Before/after slider ---------- */
  $$('[data-compare]').forEach((box) => {
    const range = $('input[type=range]', box);
    const set = () => box.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set); set();
  });

  /* ---------- Price calculator: animated total and progress ring ---------- */
  const calc = $('#calc');
  if (calc) {
    const totalEl = $('#calc-total'), monthEl = $('#calc-month'), list = $('#calc-lines'), ringFill = $('.ring .fill', calc), ringN = $('.ring b', calc);
    const optionCount = CONFIG.addOns.length + 1;
    let shown = CONFIG.packages.onePage.price, anim = 0;
    const tween = (to) => {
      cancelAnimationFrame(anim);
      if (reduce) { shown = to; totalEl.textContent = money(to); return; }
      const from = shown, t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3); shown = Math.round(from + (to - from) * e); totalEl.textContent = money(shown); if (p < 1) anim = requestAnimationFrame(step); };
      anim = requestAnimationFrame(step);
    };
    const read = () => {
      const pkgKey = ($('input[name=pkg]:checked', calc) || {}).value || 'onePage';
      const pkg = CONFIG.packages[pkgKey];
      const lines = [`${pkg.name}: ${money(pkg.price)}`];
      let total = pkg.price, picked = 0;
      CONFIG.addOns.forEach((a) => {
        const box = $(`#add-${a.id}`, calc); if (!box || !box.checked) return;
        const qty = a.perUnit ? Number(($(`#qty-${a.id}`, calc) || {}).value || 1) : 1;
        total += a.from * qty; picked++;
        lines.push(`${a.name}${qty > 1 ? ' x ' + qty : ''}: from ${money(a.from * qty)}`);
      });
      const care = $('#add-care', calc).checked;
      if (care) { lines.push(`${CONFIG.carePlan.name}: ${money(CONFIG.carePlan.pricePerMonth)} a month`); picked++; }
      return { pkgKey, total, care, lines, picked };
    };
    const render = () => {
      const q = read();
      tween(q.total);
      monthEl.hidden = !q.care;
      list.replaceChildren(...q.lines.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
      $$('.qty', calc).forEach((s) => { s.disabled = !$(`#add-${s.dataset.for}`, calc).checked; });
      if (ringFill) ringFill.style.strokeDashoffset = String(1 - q.picked / optionCount);
      if (ringN) ringN.textContent = q.picked;
      totalEl.dataset.total = q.total;
    };
    calc.addEventListener('change', render); render();
    $('#calc-send').addEventListener('click', () => {
      const q = read();
      store.set('bc-quote', JSON.stringify({ pkgKey: q.pkgKey, total: q.total, care: q.care, lines: q.lines }));
      location.href = 'contact.html#quote';
    });
  }

  /* ---------- Quiz (nothing is stored or sent) ---------- */
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
      store.set('bc-quiz', score + '/' + qs.length);
    });
    const rv = $('#quiz-review'); if (rv) rv.addEventListener('click', () => store.set('bc-review', '1'));
  }

  /* ---------- Contact page: fill in a calculator quote or a quiz review request ---------- */
  const contact = $('#form-contact');
  if (contact) {
    const msg = $('textarea[name=message]', contact), subject = $('input[name=subject]', contact), quoteField = $('input[name=quote]', contact), note = $('#prefill-note');
    const pick = (v) => { const r = $(`input[name=need][value="${v}"]`, contact); if (r) r.checked = true; };
    let q = null; try { q = JSON.parse(store.get('bc-quote') || 'null'); } catch (_) {}
    if (q && location.hash === '#quote') {
      pick(q.pkgKey === 'fullSite' ? 'Full Website' : 'One Page');
      msg.value = `Please send me a quote for:\n- ${q.lines.join('\n- ')}\nEstimated total from ${money(q.total)}${q.care ? ' plus the care plan' : ''}.`;
      quoteField.value = q.lines.join('; ') + `; total from ${money(q.total)}`;
      subject.value = 'Black Crest: quote request from the price calculator';
      note.hidden = false; note.textContent = 'Your calculator choices are filled in below. Add anything else you need.';
    } else if (store.get('bc-review') && location.hash === '#review') {
      pick('Not sure');
      const s = store.get('bc-quiz');
      msg.value = `I took the website quiz${s ? ' (score ' + s + ')' : ''}. Please send me a free mini review of my website: `;
      subject.value = 'Black Crest: free mini website review request';
      note.hidden = false; note.textContent = 'Add your website address to the message and we will email you a short review.';
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
    // errors clear as the visitor types a fix (checking on blur would move the button away from a click mid-press)
    fields.forEach((f) => f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); }));
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
        store.del('bc-quote'); store.del('bc-review'); store.set('bc-sent', '1');
        location.href = form.dataset.thanks;
      } catch (_) {
        btn.disabled = false; btn.textContent = label;
        status.className = 'form-status is-error';
        status.innerHTML = `Sorry, that did not send. Please try again, or email us at <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>.`;
      }
    });
  });

  /* ---------- Toast on the thank-you page, after a form was sent ---------- */
  const toast = $('#toast');
  if (toast && store.get('bc-sent')) {
    store.del('bc-sent');
    toast.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-on')));
    setTimeout(() => toast.classList.remove('is-on'), 6000);
  }

  /* ---------- Home: the 3D crest (Three.js from cdnjs), only on capable devices, on the visitor's first interaction ---------- */
  const stage = $('.hero-stage[data-three]');
  if (stage && !reduce) {
    const conn = navigator.connection || {};
    const gpuOK = () => {
      try {
        const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
        if (!gl) return false;
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
        return !/swiftshader|llvmpipe|software|basic render/i.test(name); // software rendering: keep the still crest
      } catch (_) { return false; }
    };
    const force = /[?&]3d=on\b/.test(location.search); // for testing: skip the device checks
    if (force || (!conn.saveData && (navigator.hardwareConcurrency || 4) >= 4 && (navigator.deviceMemory || 4) >= 4 && gpuOK())) {
      let started = false;
      const go = () => {
        if (started) return; started = true;
        ['pointermove', 'scroll', 'touchstart', 'keydown'].forEach((t) => removeEventListener(t, go));
        const link = document.createElement('link');
        link.rel = 'modulepreload'; link.href = stage.dataset.three; link.integrity = stage.dataset.sri; link.crossOrigin = 'anonymous';
        document.head.append(link);
        import(stage.dataset.module).then((m) => m.start(stage)).catch(() => {});
      };
      // wait for the page to finish loading, then start on the first sign of a person (mouse, scroll, touch or key)
      const arm = () => ['pointermove', 'scroll', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, go, { passive: true, once: true }));
      if (document.readyState === 'complete') arm(); else addEventListener('load', arm, { once: true });
    }
  }

  /* ---------- Small things ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => print()));
})();
