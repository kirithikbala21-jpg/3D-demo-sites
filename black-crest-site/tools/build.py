"""Writes every page of the Black Crest Web Designs site as plain HTML.

The site itself has no build step: these are static files. This script only exists so the header, footer,
phone bar and prices stay the same on every page. Run it after changing any text or price:

    python3 black-crest-site/tools/build.py

Prices come from the CONFIG object in js/config.js. The Web3Forms access key is read from the
KB Ventures config (kbventures-site/site.config.json), so both sites use the same key.
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.dirname(HERE)
REPO = os.path.dirname(SITE_DIR)
SITE = 'https://blackcrest.kbventures.com.au/'  # its own domain; pages use clean addresses (/pricing, not /pricing.html)
KB_SITE = 'https://kbventures.com.au/'  # KB Ventures has its own site and domain now
LASTMOD = '2026-11-01'
E = html.escape

with open(os.path.join(SITE_DIR, 'js', 'config.js'), encoding='utf-8') as fh:
    CONFIG = json.loads(re.search(r'/\* CONFIG-START \*/(.*?)/\* CONFIG-END \*/', fh.read(), re.S).group(1))
with open(os.path.join(REPO, 'kbventures-site', 'site.config.json'), encoding='utf-8') as fh:
    FORM_KEY = json.load(fh)['formAccessKey'].strip()
assert FORM_KEY, 'no Web3Forms key in kbventures-site/site.config.json'

EMAIL = CONFIG['email']
PKG = CONFIG['packages']
ONE, FULL, CARE = PKG['onePage']['price'], PKG['fullSite']['price'], CONFIG['carePlan']['pricePerMonth']
ADDONS = CONFIG['addOns']


def money(n):
    return f'${n:,}'


# ---------------------------------------------------------------- icons
ICON = {
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    'call': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'ne': '<path d="M7 17 17 7M8 7h9v9"/>',
    'ext': '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    'left': '<path d="M15 6l-6 6 6 6"/>',
    'right': '<path d="M9 6l6 6-6 6"/>',
}


def icon(name):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICON[name]}</svg>'


LOGO = json.load(open(os.path.join(HERE, 'logo.json'), encoding='utf-8'))


def crest(cls='crest'):
    """The Black Crest hallmark: one fine crest outline with an engraved "BC" (letter outlines, made by tools/make-logo.py)."""
    return (f'<svg class="{cls}" viewBox="0 0 40 48" aria-hidden="true" focusable="false">'
            f'<path class="crest-outline" pathLength="1" d="{LOGO['crest']}"/><path class="crest-letters" d="{LOGO['letters']}"/></svg>')


ILLO = {
    'fast': '''<circle class="s" cx="128" cy="100" r="66"/><path class="g" d="M70 128a60 60 0 0 1 116 0"/><path class="g" d="M78 104l8 3M92 80l6 6M118 66v9M146 70l-4 8M170 86l-7 5M182 108l-8 2"/>
      <path class="g" d="M128 128 160 86"/><circle class="d" cx="128" cy="128" r="3.5"/><path class="g" d="M18 70h40M8 90h48M24 110h28"/><path class="s" d="M60 146h136"/>''',
    'phone': '''<rect class="g" x="86" y="18" width="68" height="144" rx="14"/><path class="s" d="M98 40h44M98 52h30M98 64h38"/><rect class="s" x="98" y="78" width="44" height="26" rx="4"/>
      <rect class="g" x="100" y="120" width="40" height="18" rx="9"/><circle class="g" cx="120" cy="129" r="26"/><circle class="s" cx="120" cy="129" r="40"/><circle class="d" cx="120" cy="129" r="2.5"/><path class="g" d="M112 26h16"/>''',
    'find': '''<path class="s" d="M20 40h200M20 80h200M20 120h200M20 160h200M60 20v150M110 20v150M160 20v150M210 20v150"/>
      <path class="g" d="M162 36c-14 0-24 10-24 23 0 17 24 40 24 40s24-23 24-40c0-13-10-23-24-23Z"/><circle class="g" cx="162" cy="59" r="8"/>
      <circle class="g" cx="96" cy="104" r="36"/><circle class="s" cx="96" cy="104" r="26"/><path class="g" d="M122 130l34 34"/><circle class="d" cx="162" cy="59" r="2.5"/>''',
    'own': '''<path class="s" d="M120 14 182 36v52c0 42-26 71-62 90-36-19-62-48-62-90V36Z"/><path class="g" d="M120 30 168 47v41c0 33-20 56-48 71-28-15-48-38-48-71V47Z"/>
      <circle class="g" cx="96" cy="96" r="18"/><circle class="s" cx="96" cy="96" r="8"/><path class="g" d="M114 96h52M150 96v14M160 96v10"/><circle class="d" cx="166" cy="96" r="2.5"/>''',
    'chat': '''<path class="g" d="M38 40h112a12 12 0 0 1 12 12v44a12 12 0 0 1-12 12H84l-24 20v-20H38a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12Z"/>
      <path class="s" d="M98 92h98a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10h-16v18l-22-18H98a10 10 0 0 1-10-10v-36a10 10 0 0 1 10-10Z"/>
      <circle class="d" cx="70" cy="74" r="3"/><circle class="d" cx="88" cy="74" r="3"/><circle class="d" cx="106" cy="74" r="3"/><path class="g" d="M110 120h70M110 132h46"/>''',
    'concept': '''<rect class="g" x="34" y="26" width="172" height="128" rx="8"/><path class="g" d="M34 44h172"/><circle class="d" cx="46" cy="35" r="2.2"/><circle class="s" cx="56" cy="35" r="2.2"/><circle class="s" cx="66" cy="35" r="2.2"/>
      <path class="g" d="M52 70h72M52 84h52"/><path class="s" d="M52 104h40M52 114h56"/><rect class="g" x="52" y="126" width="44" height="14" rx="7"/>
      <path class="s" d="M140 60 186 60 186 140 140 140Z"/><path class="g" d="M146 132l14-24 10 14 8-10 6 20"/><circle class="g" cx="170" cy="78" r="6"/>''',
    'build': '''<path class="s" d="M30 156h180"/><rect class="g" x="48" y="96" width="70" height="52" rx="6"/><rect class="g" x="126" y="96" width="70" height="52" rx="6"/>
      <rect class="g" x="48" y="40" width="148" height="48" rx="6"/><path class="s" d="M60 56h60M60 68h90M60 112h40M60 124h28M138 112h44M138 124h30"/><circle class="d" cx="180" cy="58" r="3"/>
      <path class="g" d="M196 26l14-14M200 12h10v10"/>''',
    'launch': '''<path class="s" d="M20 150h200"/><path class="s" d="M40 150a80 80 0 0 1 160 0"/><path class="g" d="M44 146C76 120 112 70 186 34"/>
      <path class="g" d="M186 34l-14 2M186 34l-4 13"/><circle class="d" cx="186" cy="34" r="3.5"/><circle class="g" cx="186" cy="34" r="12"/><path class="g" d="M120 150v-8M80 150v-5M160 150v-5"/>''',
    'barber': '''<circle class="g" cx="70" cy="128" r="16"/><circle class="g" cx="110" cy="138" r="16"/><path class="g" d="M80 115 170 30M98 124 182 42"/><circle class="d" cx="94" cy="111" r="2.5"/>
      <rect class="g" x="138" y="96" width="70" height="16" rx="3"/><path class="s" d="M146 112v18M154 112v18M162 112v18M170 112v18M178 112v18M186 112v18M194 112v18M202 112v18"/><path class="s" d="M30 160h180"/>''',
    'cafe': '''<path class="g" d="M66 84h96v34c0 22-18 38-48 38S66 140 66 118Z"/><path class="g" d="M162 94h10a14 14 0 0 1 0 28h-12"/><path class="s" d="M44 160h152"/><ellipse class="g" cx="114" cy="160" rx="66" ry="7"/>
      <path class="g" d="M96 70c-8-10 8-16 0-28M116 70c-8-10 8-16 0-28M136 70c-8-10 8-16 0-28"/><circle class="d" cx="114" cy="100" r="2.5"/>''',
    'gym': '''<path class="g" d="M58 92h124"/><rect class="g" x="36" y="64" width="16" height="56" rx="4"/><rect class="g" x="188" y="64" width="16" height="56" rx="4"/><rect class="g" x="22" y="74" width="12" height="36" rx="3"/><rect class="g" x="206" y="74" width="12" height="36" rx="3"/>
      <path class="s" d="M20 150h200"/><path class="s" d="M80 150l20-40M160 150l-20-40"/><circle class="d" cx="120" cy="92" r="2.5"/>''',
    'tradie': '''<path class="g" d="M52 156 120 88"/><path class="g" d="M120 88a26 26 0 1 0 34-36l-16 16-14-4-4-14 16-16a26 26 0 0 0-36 34"/>
      <path class="s" d="M150 160v-48a16 16 0 0 1 16-16h40"/><path class="s" d="M168 160v-44a6 6 0 0 1 6-6h32"/><circle class="d" cx="52" cy="156" r="3"/><path class="s" d="M24 168h196"/>''',
    'salon': '''<ellipse class="g" cx="96" cy="70" rx="40" ry="48"/><ellipse class="s" cx="96" cy="70" rx="30" ry="38"/><path class="g" d="M96 118v42"/><path class="g" d="M84 160h24"/>
      <path class="g" d="M150 40l40 100"/><path class="s" d="M156 54l10-4M160 64l10-4M164 74l10-4M168 84l10-4M172 94l10-4M176 104l10-4"/><circle class="d" cx="84" cy="54" r="2.5"/>''',
}


def illo(name):
    body = re.sub(r'class="g"', 'class="g" pathLength="1"', ILLO[name])
    return f'<svg class="illo" viewBox="0 0 240 180" aria-hidden="true" focusable="false">{body}</svg>'


# ---------------------------------------------------------------- devices (the six concept demos, read-only)
DEMOS = [
    ('barber', 'barber-demo', 'Brass &amp; Blade', 'Barbershop', 'Prices, online booking and a gallery of cuts, under a spinning 3D barber pole.', ['Online booking', 'Price list', 'Gallery', '3D hero'], 'for-barbers.html'),
    ('cafe', 'cafe-demo-v2', 'Ember &amp; Oak', 'Cafe', 'A full menu, opening hours, a map and pick-up ordering, with a steaming 3D cup.', ['Menu', 'Pick-up ordering', 'Opening hours', 'Map'], 'for-cafes.html'),
    ('gym', 'gym-demo', 'Iron &amp; Ember', 'Gym', 'Class timetable, memberships and a free-trial form that turns interest into a first session.', ['Timetable', 'Memberships', 'Free trial', 'Coaches'], 'for-gyms.html'),
    ('plumber', 'plumber-demo', 'Waverley Plumbing', 'Plumber', 'A big call button, the suburbs covered, a price guide and a quote form.', ['Call button', 'Quote form', 'Service areas', 'Price guide'], 'for-tradies.html'),
    ('salon', 'salon-demo', 'Maison Lune', 'Salon', 'A calm service menu with prices, stylists and a booking widget.', ['Service menu', 'Booking', 'Stylists', 'Gift vouchers'], 'for-salons.html'),
    ('parts', 'parts-store-demo', 'Torque &amp; Co.', 'Auto parts', 'A home page that helps drivers find the part that fits their car.', ['Car finder', 'Shop by job', 'Oil finder', 'Phone first'], None),
]
DEMO = {d[0]: d for d in DEMOS}


def laptop(slug, name, P, lazy=True):
    ld = 'loading="lazy" ' if lazy else 'fetchpriority="low" '
    return (f'<div class="laptop"><div class="laptop-screen"><img src="{P}img/work/{slug}-desktop-1600.webp" '
            f'srcset="{P}img/work/{slug}-desktop-800.webp 800w, {P}img/work/{slug}-desktop-1600.webp 1600w" sizes="(min-width: 1024px) 60vw, 92vw" '
            f'width="1600" height="1000" {ld}decoding="async" alt="The {name} concept site on a laptop"></div><div class="laptop-base" aria-hidden="true"></div></div>')


def phone(slug, name, P, lazy=True):
    return (f'<div class="phone"><img src="{P}img/work/{slug}-phone.webp" width="600" height="1300" '
            f'{"loading=" + chr(34) + "lazy" + chr(34) + " " if lazy else ""}decoding="async" alt="The {name} concept site on a phone"></div>')


def duo(slug, P, parallax='0.06', lazy=True, phone_slug=None):
    d, p = DEMO[slug], DEMO[phone_slug or slug]
    return f'<div class="devices duo" data-parallax="{parallax}">{laptop(slug, d[2], P, lazy)}{phone(p[0], p[2], P, lazy)}</div>'


# the six concept demos live in their own folders of the repo, outside this site's own folder, so link to their full addresses
DEMO_HOST = 'https://kirithikbala21-jpg.github.io/3D-demo-sites/'


def open_demo(d, P, cls='btn btn-ghost'):
    return f'<a class="{cls}" href="{DEMO_HOST}{d[1]}/" target="_blank" rel="noopener">Open the concept {icon("ext")}<span class="sr-only"> {d[2]} (opens in a new tab)</span></a>'


# ---------------------------------------------------------------- page parts
NAV = [('work', 'Work'), ('process', 'Process'), ('pricing', 'Pricing'), ('about', 'About'), ('faq', 'FAQ'), ('contact', 'Contact')]
TRADES = [('for-barbers', 'Barbers', 'barber', 'Bookings, prices and the cuts that sell the chair.'),
          ('for-cafes', 'Cafes', 'cafe', 'Menu, hours and a map, before they leave the house.'),
          ('for-gyms', 'Gyms', 'gym', 'Timetables, memberships and an easy first class.'),
          ('for-tradies', 'Tradies', 'tradie', 'The call, the quote and the suburbs you cover.'),
          ('for-salons', 'Salons', 'salon', 'Services, prices and bookings at any hour.')]
FOOTER = [
    ('Services', [('pricing', 'Pricing'), ('care-plan', 'Care plan'), ('process', 'Process'), ('work', 'Work'), ('lab', 'Concept Lab'), ('start', 'Start your project')]),
    ('Trades', [(h, t) for h, t, _, _ in TRADES]),
    ('Resources', [('faq', 'FAQ'), ('guides/', 'Guides'), ('quiz', 'Website quiz'), ('free-concept', 'Free concept'), ('qr', 'Printable QR code')]),
    ('Company', [('about', 'About'), ('standard', 'The Standard'), ('contact', 'Contact'), ('credits', 'Credits'), ('privacy', 'Privacy'), ('terms', 'Terms')]),
]


def brand(P):
    return (f'<a class="brand" href="/">{crest()}'
            '<span class="brand-name"><b>Black Crest</b> <small>Web Designs</small></span><span class="sr-only"> home</span></a>')


def cur(name, here):
    return ' aria-current="page"' if name == here else ''


# the full-screen menu: label, page, preview image shown on desktop hover
MENU = [('Work', 'work', 'barber'), ('Concept Lab', 'lab', 'salon'), ('Process', 'process', 'cafe'), ('Pricing', 'pricing', 'plumber'),
        ('Standard', 'standard', 'gym'), ('About', 'about', 'parts'), ('FAQ', 'faq', 'cafe'), ('Contact', 'contact', 'barber')]
INLINE_NAV = [('work', 'Work'), ('pricing', 'Pricing'), ('contact', 'Contact')]


def header(P, here):
    links = ''.join(f'<li><a href="{P}{h}"{cur(h, here)}>{t}</a></li>' for h, t in INLINE_NAV)
    mlinks = ''.join(f'<li><a href="{P}{h}"{cur(h, here)} data-preview="{P}img/work/{img}-desktop-800.webp"><span class="n" aria-hidden="true">0{i + 1}</span>{t}</a></li>' for i, (t, h, img) in enumerate(MENU))
    sub = ''.join(f'<a href="{P}{h}">{t}</a>' for h, t in [('care-plan', 'Care plan'), ('start', 'Start your project'), ('guides/', 'Guides'), ('quiz', 'Website quiz')] + [(h, t) for h, t, _, _ in TRADES])
    return f'''<header class="site-header">
  <div class="container header-inner">
    {brand(P)}
    <nav aria-label="Main"><ul class="nav-links">{links}</ul></nav>
    <a class="btn btn-gold btn-sm header-cta" href="{P}free-concept">Get a free concept</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-label" aria-hidden="true">Menu</span><span class="menu-icon" aria-hidden="true"></span><span class="sr-only">Open menu</span></button>
  </div>
</header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" hidden>
  <div class="container menu-inner">
    <nav aria-label="Menu"><ol class="menu-links">{mlinks}</ol><div class="menu-sub">{sub}</div></nav>
    <aside class="menu-aside">
      <div class="menu-preview" aria-hidden="true"><img data-nopic src="{P}img/work/barber-desktop-800.webp" width="800" height="500" alt="" loading="lazy" decoding="async"></div>
      <a class="link" data-email href="mailto:{EMAIL}">{EMAIL}</a>
      <p class="tiny" data-clock>Melbourne</p>
      <p class="tiny"><span class="avail-dot" aria-hidden="true"></span><span data-availability>{E(CONFIG['availability'])}</span></p>
      <a class="btn btn-gold" href="{P}free-concept">Get a free concept</a>
    </aside>
  </div>
</div>'''


def footer(P, here):
    cols = ''.join(f'''
        <nav class="footer-col" aria-labelledby="f-{i}"><h2 id="f-{i}">{t}</h2><ul>{"".join(f'<li><a href="{P}{h}"{cur(h, here)}>{x}</a></li>' for h, x in items)}</ul></nav>''' for i, (t, items) in enumerate(FOOTER))
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        {brand(P)}
        <p>Premium sites for local businesses. A KB Ventures company, based in Melbourne, Australia.</p>
        <a class="mail link" data-email href="mailto:{EMAIL}">{EMAIL}</a>
        <p class="tiny" data-clock>Melbourne</p>
        <p class="tiny"><span class="avail-dot" aria-hidden="true"></span><span data-availability>{E(CONFIG['availability'])}</span></p>
      </div>
      <div class="footer-cols">{cols}
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>2026</span> Black Crest Web Designs, a <a href="{KB_SITE}">KB Ventures</a> company.</p>
      <p>No cookies. No tracking. Prices in AUD.</p>
      <button class="to-top" type="button" data-top>Back to top <span aria-hidden="true">&uarr;</span></button>
    </div>
  </div>
  <p class="footer-word" aria-hidden="true" data-word="BLACK CREST"></p>
</footer>'''


def mobile_bar(P):
    return f'''<div class="mobile-bar" role="region" aria-label="Quick actions">
  <a class="btn btn-gold" href="{P}free-concept">Get a free concept</a>
  <a class="btn btn-ghost icon-btn" data-call href="#" hidden aria-label="Call us">{icon('call')}</a>
  <a class="btn btn-ghost icon-btn" data-email href="mailto:{EMAIL}" aria-label="Email us">{icon('mail')}</a>
</div>'''


PRELOADER = f'''<div class="preloader" id="preloader" aria-hidden="true">
  <div class="pre-half pre-top"></div><div class="pre-half pre-bot"></div>
  <div class="pre-mid">
    <svg class="pre-crest" viewBox="0 0 40 48" focusable="false"><path pathLength="1" d="{LOGO['crest']}"/><path class="pre-letters" d="{LOGO['letters']}"/></svg>
    <p class="pre-count"><span data-pre-count>000</span></p>
    <p class="pre-name">Black Crest Web Designs</p>
  </div>
</div>'''


def scripts_after_hero(P, vendor=()):
    """The motion libraries and js/core.js start once the hero render has painted (or at once on pages without one),
    so they never hold back the first view. They run in the same order as before; everything is readable without them."""
    files = [f'{P}vendor/gsap/gsap.min.js', f'{P}vendor/gsap/ScrollTrigger.min.js', f'{P}vendor/gsap/SplitText.min.js', f'{P}vendor/lenis/lenis.min.js'] + [f'{P}vendor/{v}' for v in vendor]
    return ('<script>(function(){var L=' + json.dumps(files) + ',C=' + json.dumps(P + 'js/core.js') + ',d=document,done=0;'
            'function go(){if(done)return;done=1;var n=L.length,i;function core(){var m=d.createElement("script");m.type="module";m.src=C;d.head.appendChild(m)}'
            'if(!n)return core();for(i=0;i<n;i++){var s=d.createElement("script");s.src=L[i];s.async=false;if(i===n-1)s.onload=s.onerror=core;d.head.appendChild(s)}}'
            'function after(){requestAnimationFrame(function(){setTimeout(go,0)})}'
            'function ready(){var h=d.querySelector(".hero-img");if(h&&!h.complete){h.addEventListener("load",after,{once:true});h.addEventListener("error",go,{once:true});setTimeout(go,3000)}else after()}'
            'if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",ready,{once:true});else ready()})();</script>')


def clean(p):
    """The address a page is served at: /about for about.html, / for index.html, /guides/ for guides/index.html."""
    if p in ('', 'index.html'):
        return ''
    return p[:-10] if p.endswith('/index.html') else p[:-5] if p.endswith('.html') else p


def head(title, desc, path, P, noindex=False, ld=(), base_script=False, extra='', vendor=(), first=''):
    canon = SITE + clean(path)
    og = SITE + 'img/og.jpg'
    lds = ''.join(f'\n<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",", ":"))}</script>' for x in ld)
    base = ('<script>(function(){var m=location.pathname.match(/^(.*\\/black-crest-site\\/)/);'
            'document.write(\'<base href="\'+(m?m[1]:\'/\')+\'">\');})();</script>\n') if base_script else ''
    return f'''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<script>if(/github\\.io$/.test(location.hostname))location.replace("{canon}"+location.search+location.hash)</script>
<script>(function(d){{d.classList.add('js');try{{if(!sessionStorage.getItem('bc-pre')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('preload')}}catch(e){{}}}})(document.documentElement)</script>
{base}<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">{chr(10) + first if first else ''}
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
{'<meta name="robots" content="noindex,follow">' if noindex else ''}
<link rel="canonical" href="{canon}">
<meta name="theme-color" content="#0D0E12">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Black Crest Web Designs">
<meta property="og:locale" content="en_AU">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A digital render of the Black Crest card, black brushed metal with a gold crest on a basalt plinth, beside the line: Premium sites for local businesses.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{E(title)}">
<meta name="twitter:description" content="{E(desc)}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="{P}img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{P}favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="{P}img/apple-touch-icon.png">
<link rel="manifest" href="{P}manifest.webmanifest">
<link rel="preload" href="{P}fonts/cormorant-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{P}fonts/switzer-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{P}style.min.css">{extra}
{scripts_after_hero(P, vendor)}{lds}
</head>'''


def picturise(html, P):
    """Wrap each <img> of a .webp in img/ (that also has .avif and .jpg copies) in <picture>: AVIF, then WebP, then a JPEG fallback."""
    def one(m):
        tag = m.group(0)
        if 'data-nopic' in tag:
            return tag
        src = re.search(r'src="([^"]+)\.webp"', tag).group(1)
        disk = os.path.join(SITE_DIR, src[len(P):] if P and src.startswith(P) else src)
        if not (os.path.exists(disk + '.avif') and os.path.exists(disk + '.jpg')):
            return tag
        ss = re.search(r'srcset="([^"]+)"', tag)
        sizes = re.search(r'sizes="([^"]+)"', tag)
        set_ = ss.group(1) if ss else src + '.webp'
        sz = f' sizes="{sizes.group(1)}"' if sizes else ''
        img = tag.replace(src + '.webp"', src + '.jpg"', 1)
        if ss:
            img = img.replace(ss.group(0), 'srcset="' + set_.replace('.webp', '.jpg') + '"')
        return (f'<picture><source type="image/avif" srcset="{set_.replace(".webp", ".avif")}"{sz}>'
                f'<source type="image/webp" srcset="{set_}"{sz}>{img}</picture>')
    return re.sub(r'<img\b[^>]*\bsrc="[^"]*img/[^"]+\.webp"[^>]*>', one, html)


pages = {}


def page(path, title, desc, body, noindex=False, ld=(), bare=False, base_script=False, extra='', toast=False, vendor=(), pre=False, first=''):
    P = '../' * path.count('/')
    top = '' if bare else header(P, path)
    bottom = '' if bare else f'{footer(P, path)}\n{mobile_bar(P)}'
    t = '\n<div class="toast" id="toast" role="status" hidden><i aria-hidden="true"></i>Message sent. We reply within 1 business day.</div>' if toast else ''
    if path != 'index.html':
        body = re.sub(r'<p class="label">(?!<span class="idx">)([^<]+)</p>', r'<p class="label"><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>\1</p>', body, count=1)
    body = picturise(body, P)
    pages[path] = f'''{head(title, desc, path if path != 'index.html' else '', P, noindex, ld, base_script, extra, vendor, first)}
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>
<div class="progress" aria-hidden="true"><span></span></div>
{PRELOADER if pre else ''}
{top}
{body}
{bottom}{t}
</body>
</html>
'''


def head_block(label, title, lead='', split=False, level='h2', cls='h2', center=False, idx=''):
    i = f'<span class="idx">{idx}</span><span class="slash" aria-hidden="true">/</span>' if idx else ''
    return f'''<div class="section-head{' split' if split else ''}{' center' if center else ''}">
      <div><p class="label" data-reveal>{i}{label}</p><{level} class="{cls}" data-split>{title}</{level}></div>
      {f'<p class="lead" data-reveal>{lead}</p>' if lead else ''}
    </div>'''


def cta_final(title, text, primary=('free-concept', 'Get a free concept'), secondary=None, P=''):
    sec = f'<a class="btn btn-ghost" href="{P}{secondary[0]}">{secondary[1]}</a>' if secondary else ''
    card = (f'<div class="cta-media">{pic(VIDEO + "-poster-mobile", 864, 1080, "", P, sizes="360px")}'
            f'<video class="cta-video" muted loop playsinline disablepictureinpicture preload="none" aria-hidden="true" tabindex="-1" data-video="{P}{VIDEO}-mobile"></video></div>')
    return f'''<section class="cta-final" aria-labelledby="cta-h">
    <div class="container cta-split">
      <div class="cta-copy">
        <p class="label" data-reveal>Next step</p>
        <h2 id="cta-h" class="display" data-split>{title}</h2>
        <p data-reveal>{text}</p>
        <div class="btn-row" data-reveal><a class="btn btn-gold" href="{P}{primary[0]}">{primary[1]}</a>{sec}</div>
      </div>
      <div class="cta-visual" aria-hidden="true" data-reveal>{card}</div>
    </div>
  </section>'''


STATEMENT = [
    ('onePage', 'One Page', 'one-off', 'contact?need=one-page', 'Choose One Page', False,
     'One polished page with everything a local business needs.', ['Writing help', 'Designed for phones first', 'Contact form', 'Google Map of your location', 'Google basics set up', 'Fast and secure (HTTPS)', '2 rounds of changes']),
    ('fullSite', 'Full Website', 'one-off', 'contact?need=full-website', 'Choose Full Website', True,
     'Up to about 5 pages, for a business with more to show.', ['Everything in One Page, Google Map included', 'Up to 5 pages', 'Room for a menu, timetable, services or gallery', '2 rounds of changes']),
]


def statement(P, level='h3'):
    """The packages set like a private-bank statement: hairline rules, tabular figures, plain lines, calm text buttons."""
    def row(key, name, per, href, cta, featured, sub, items, amount, cls=''):
        flag = '<span class="st-flag">Better value</span>' if featured else ''
        return f'''<tr class="st-row{cls}">
            <th scope="row" class="st-name"><{level} class="st-title">{name}</{level}>{flag}<p>{sub}</p>{'<p class="st-note">Need more than one page? The Full Website covers up to 5.</p>' if key == 'onePage' else ''}</th>
            <td class="st-inc"><ul>{''.join(f'<li>{x}</li>' for x in items)}</ul></td>
            <td class="st-amt"><span class="odo" data-price="{key}" data-odometer="{money(amount)}">{money(amount)}</span><small>{per}</small></td>
            <td class="st-go"><a class="text-btn" href="{P}{href}">{cta}</a></td>
          </tr>'''
    rows = ''.join(row(k, n, per, h, c, f, sub, items, PKG[k]['price']) for k, n, per, h, c, f, sub, items in STATEMENT)
    care = row('carePlan', 'Care plan', 'a month', 'care-plan', 'What it covers', False, 'Optional. We look after your site once it is live.',
               ['Hosting upkeep', 'Small text and photo changes', 'Security checks and backups', 'Priority replies'], CARE, ' st-after')
    return f'''<div class="statement-wrap" data-reveal>
      <table class="st-table">
        <caption class="sr-only">Black Crest packages and prices, in Australian dollars</caption>
        <thead><tr><th scope="col">Package</th><th scope="col">Includes</th><th scope="col">Price, AUD</th><th scope="col"><span class="sr-only">Choose</span></th></tr></thead>
        <tbody>{rows}</tbody>
        <tbody class="st-optional">{care}</tbody>
      </table>
      <p class="st-honest">We&rsquo;re new and building our first portfolio, so prices start low. The work doesn&rsquo;t.</p>
      <p class="st-foot"><span>Custom work, bigger or unusual projects, is by quote.</span> <a class="text-btn" href="{P}contact?need=not-sure">Ask for a quote</a></p>
    </div>'''


def faq_list(items, P):
    return '<div class="faq">' + ''.join(f'<details><summary>{q}</summary><div class="answer"><p>{a.replace("{P}", P)}</p></div></details>' for q, a in items) + '</div>'


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).replace('&amp;', '&').replace('{P}', '')


# ---------------------------------------------------------------- forms
NEEDS = [('One Page', f'One Page ({money(ONE)})'), ('Full Website', f'Full Website ({money(FULL)})'), ('Something custom', 'Something custom'), ('Not sure yet', 'Not sure yet')]


def need_fields(prefix='n', care=False):
    """What do you need (choose one), and a separate care plan box. forms.js sends both and puts both in the subject."""
    radios = ''.join(f'''<label class="choice"><input type="radio" name="need" value="{v}"{" checked" if v == "Not sure yet" else ""}><span>{label}</span></label>''' for v, label in NEEDS)
    return f'''<fieldset class="choice-grid" data-need><legend>What do you need?</legend>{radios}</fieldset>
        <label class="care-check" for="{prefix}-care"><input type="checkbox" id="{prefix}-care" name="care_plan" value="Yes"{" checked" if care else ""}><span class="care-box" aria-hidden="true"></span><span class="care-text"><b>Add the care plan</b>: we look after your site after launch (<span data-price="carePlan">{money(CARE)}</span> a month, optional)</span></label>'''



def form_open(name, subject, P):
    return f'''<form class="form" id="form-{name}" data-form="{name}" action="https://api.web3forms.com/submit" method="POST" data-thanks="{P}thank-you" novalidate>
        <input type="hidden" name="access_key" value="{FORM_KEY}">
        <input type="hidden" name="subject" value="{E(subject)}">
        <input type="hidden" name="from_name" value="Black Crest Website">
        <input type="hidden" name="form" value="{E(name)}">
        <input type="hidden" name="redirect" value="{SITE}thank-you">
        <div class="hp" aria-hidden="true"><label>Leave this box empty <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label></div>'''


def field(fid, label, kind='text', required=False, hint='', auto='', textarea=False, placeholder='', contact=False, empty=''):
    req = ' required' if required else ''
    desc = f'e-{fid}' + (f' h-{fid}' if hint else '')
    extra = (f' autocomplete="{auto}"' if auto else '') + (f' placeholder="{E(placeholder)}"' if placeholder else '') + (' data-contact="1"' if contact else '') + (f' data-empty="{E(empty)}"' if empty else '')
    ctrl = (f'<textarea id="{fid}" name="{fid}"{req} aria-describedby="{desc}"{extra}></textarea>' if textarea
            else f'<input id="{fid}" name="{fid}" type="{kind}"{req} aria-describedby="{desc}"{extra}>')
    return f'''<div class="field">
          <label for="{fid}">{label}{'' if required else ' <span class="hint">(optional)</span>'}</label>
          {f'<p class="hint" id="h-{fid}">{hint}</p>' if hint else ''}
          {ctrl}
          <p class="field-error" id="e-{fid}" hidden></p>
        </div>'''


def form_close(button, P):
    return f'''<p class="privacy-line">We only use your details to reply to you. See our <a href="{P}privacy">privacy policy</a>.</p>
        <button class="btn btn-gold" type="submit">{button}</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>'''


# ================================================================= shared content
ORG = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': SITE + '#business',
    'name': 'Black Crest Web Designs', 'slogan': 'Premium sites for local businesses',
    'description': 'Fast, good-looking websites for local businesses in Melbourne. A free concept homepage first, clear prices, and you own your site.',
    'url': SITE, 'email': EMAIL, 'image': SITE + 'img/og.jpg', 'logo': SITE + 'img/icon-512.png',
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Melbourne', 'addressRegion': 'VIC', 'addressCountry': 'AU'},
    'areaServed': {'@type': 'City', 'name': 'Melbourne'},
    'parentOrganization': {'@type': 'Organization', 'name': 'KB Ventures', 'url': KB_SITE},
    'makesOffer': [
        {'@type': 'Offer', 'name': 'One Page website', 'price': f'{ONE:.2f}', 'priceCurrency': CONFIG['currency'], 'url': SITE + 'pricing'},
        {'@type': 'Offer', 'name': 'Full Website (up to about 5 pages)', 'price': f'{FULL:.2f}', 'priceCurrency': CONFIG['currency'], 'url': SITE + 'pricing'},
        {'@type': 'Offer', 'name': 'Care plan', 'price': f'{CARE:.2f}', 'priceCurrency': CONFIG['currency'], 'url': SITE + 'care-plan',
         'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': f'{CARE:.2f}', 'priceCurrency': CONFIG['currency'], 'unitText': 'month'}},
    ],
}
STEPS = [
    ('Chat', 'chat', 'Usually the same or next day', 'Tell us what you do, where you are and what people should do on your site: call, book or visit. A short message is enough. Send links to your logo, photos or old site if you have them.'),
    ('Free concept', 'concept', 'Usually within 5 business days', 'We design your homepage around your name, your trade and your suburb. It costs nothing and commits you to nothing. Not for you? Walk away and owe nothing.'),
    ('Build', 'build', 'Usually 1 to 2 weeks after the deposit', 'Like it? We email a quote and the payment details, and a 50% deposit starts the build. We write the words with you, add your photos, the contact form and the Google basics, then share a private preview. Two rounds of changes are included.'),
    ('Launch', 'launch', 'Usually 1 to 2 days after you approve it', 'You pay the balance. We connect your domain, switch on HTTPS and check every page on phones and computers. Then we hand it over: the site, the domain and the logins are yours.'),
]
FAQS = [
    ('How much does a website cost?', f'A One Page site is {money(ONE)}. A Full Website, up to about 5 pages, is {money(FULL)}. The care plan is optional at {money(CARE)} a month, and bigger projects are quoted. The only other cost is your own domain name, about $20 a year. See <a href="{{P}}pricing">pricing</a>.'),
    ('How long does it take?', 'Your free concept homepage is usually ready within 5 business days of our first chat. The build usually takes 1 to 2 weeks after the deposit, and launch takes 1 to 2 days once you approve the preview.'),
    ('Who owns the website?', 'You do. Once the balance is paid, the finished site is yours. Your domain name is registered in your name, so it is always yours too.'),
    ('Can I ask for changes?', 'Yes. Two rounds of changes are included while we build. After launch, small text and photo changes are part of the care plan. Anything bigger is quoted fairly before we start it.'),
    ('What about the domain name and hosting?', 'You pay for your own domain name (your web address), about $20 a year, registered in your name. Hosting setup is included in the price. If anything about hosting would cost you extra, we tell you before you say yes.'),
    ('What do I need to give you?', 'Your business name, what you do, where you are, how people should reach you, your hours, your services and prices, and your logo and photos if you have them. We help with the writing.'),
    ("What if I don't like the concept?", "Then you pay nothing. Tell us what isn't right and we can adjust it before you decide, or simply walk away. There is no deposit until you choose to go ahead."),
    ('How do payment and the deposit work?', 'The concept is free. If you go ahead, a 50% deposit starts the build and the balance is due at launch. We email an invoice with the payment details. We never take payments on this website.'),
    ('Can I change things on my site myself?', 'Small changes are part of the care plan. You can also email us anything, any time. Bigger changes are quoted first.'),
    ('How do I pay?', 'By bank transfer, from an invoice we email you. We never take payment on this website.'),
    ('Do you charge GST?', 'We are not registered for GST, so there is no GST on our prices.'),
    ('What if I change my mind after the deposit?', 'You can stop at any time. The deposit covers the work already done, so it is not refunded, unless no work has started yet. If we cannot finish the work, we refund your deposit in full. See our <a href="{P}terms">terms</a>.'),
    ('Where is my site hosted?', 'On a fast, reputable host we set up for you. Hosting setup is included, and if anything would cost extra, we tell you before you say yes.'),
    ('How long does the care plan last?', 'Month to month, for as long as it is useful to you. There is no lock-in contract.'),
    ('How do I cancel the care plan?', 'Email us before your next month starts. Your site stays yours, and we hand over your files and logins.'),
]


def faq_ld():
    return {'@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [{'@type': 'Question', 'name': strip_tags(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip_tags(a)}} for q, a in FAQS]}


def story(P, page_mode=False):
    stages = ''.join(f'<div class="stage{" is-active" if i == 0 else ""}">{illo(k)}</div>' for i, (_, k, _, _) in enumerate(STEPS))
    steps = ''.join(f'''<li class="story-step{" is-active" if i == 0 else ""}">
          <span class="step-n" aria-hidden="true">0{i + 1}</span>
          <div class="step-illo illo-wrap">{illo(k)}</div>
          <h3>{t}</h3>
          <p>{x}</p>
          <span class="chip chip-plain when">{w}</span>
        </li>''' for i, (t, k, w, x) in enumerate(STEPS))
    return f'''<div class="story" data-story>
      <div class="story-visual" aria-hidden="true"><div class="story-frame">{stages}<div class="bar"><i></i></div><p class="count"><b>01</b> / 04</p></div></div>
      <ol class="story-steps">{steps}</ol>
    </div>'''


def rail(P, title_html, lead):
    items = ''.join(f'''<li class="rail-item"><article class="tile rail-card">
          <p class="tile-label"><span>{d[3]}</span><span class="chip">Concept site</span></p>
          {duo(d[0], P, parallax='0')}
          <h3>{d[2]}</h3>
          <p>{d[4]}</p>
          {open_demo(d, P)}
        </article></li>''' for d in DEMOS)
    return f'''<section class="rail section" data-rail aria-labelledby="rail-h">
    <div class="container">{head_block('Concept sites', f'<span id="rail-h">{title_html}</span>', lead, split=True)}</div>
    <div class="rail-pin"><div class="rail-sticky">
      <ul class="rail-track" aria-label="Six concept sites">{items}</ul>
      <div class="container rail-controls"><p class="rail-count"><b>01</b> / 0{len(DEMOS)}</p><div class="rail-btns"><button class="rail-btn" type="button" data-dir="-1" aria-label="Previous concept">{icon('left')}</button><button class="rail-btn" type="button" data-dir="1" aria-label="Next concept">{icon('right')}</button></div></div>
    </div></div>
  </section>'''


MARQUEE = ['Barbers', 'Cafes', 'Gyms', 'Salons', 'Plumbers', 'Electricians', 'Bakeries', 'Florists', 'Mechanics', 'Restaurants']


# ================================================================= Home
PLACES = ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Mornington Peninsula', 'Yarra Valley', 'Dandenong Ranges', 'Bellarine', 'Gippsland', 'Macedon Ranges', 'Shepparton', 'Warrnambool']


def marquee(items=MARQUEE, label='Local businesses we build for'):
    ul = lambda hidden: f'<ul{" aria-hidden=" + chr(34) + "true" + chr(34) if hidden else ""}>' + ''.join(f'<li>{t}</li>' for t in items) + '</ul>'
    return f'<div class="marquee" data-marquee role="region" aria-label="{label}"><div class="marquee-track">{ul(False)}{ul(True)}</div></div>'


def pic(stem, w, h, alt, P='', lazy=True, sizes='100vw', small=None, cls='', high=False):
    """<picture> with AVIF, WebP and a JPEG fallback. small = (stem, width) of a smaller copy, if one exists."""
    def ss(ext):
        return f'{P}{small[0]}.{ext} {small[1]}w, {P}{stem}.{ext} {w}w' if small else f'{P}{stem}.{ext}'
    load = 'fetchpriority="high"' if high else ('loading="lazy"' if lazy else '')
    return (f'<picture{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img src="{P}{stem}.jpg" width="{w}" height="{h}" {load} decoding="async" alt="{alt}"></picture>')


# The hero render (a digital render of the brand card, made by tools/make-renders.py). Phones and portrait screens
# get the 4:5 crop with the words below it; wider screens get the 16:9 render with the words in its dark left side.
STACK = '(max-width: 719px), (max-aspect-ratio: 1/1)'
WIDE = '(min-width: 720px) and (min-aspect-ratio: 1001/1000)'
HERO = 'assets/renders/card-hero'


def hero_set(ext, P='', phone=False):
    return ', '.join(f'{P}{HERO}-4x5-{w}.{ext} {w}w' for w in (720, 1080)) if phone else ', '.join(f'{P}{HERO}-{w}.{ext} {w}w' for w in (800, 1280, 1920, 2752))


def hero_picture(P=''):
    ph = f'media="{STACK}" sizes="100vw" width="1080" height="1350"'
    return (f'<picture>'
            f'<source {ph} type="image/avif" srcset="{hero_set("avif", P, True)}">'
            f'<source {ph} type="image/webp" srcset="{hero_set("webp", P, True)}">'
            f'<source {ph} srcset="{hero_set("jpg", P, True)}">'
            f'<source type="image/avif" srcset="{hero_set("avif", P)}" sizes="100vw" width="2752" height="1536">'
            f'<source type="image/webp" srcset="{hero_set("webp", P)}" sizes="100vw" width="2752" height="1536">'
            f'<img class="hero-img" src="{P}{HERO}-1920.jpg" srcset="{hero_set("jpg", P)}" sizes="100vw" width="2752" height="1536" '
            f'fetchpriority="high" decoding="async" alt="Digital render of the Black Crest card: black brushed metal with a gold crest, on a basalt plinth under one light"></picture>')


VIDEO = 'assets/video/bc-hero'


def hero_video(P=''):
    """The looping hero video (10 s, silent). It has no files in the HTML: js/core.js picks the phone (4:5) or wide
    (16:9) files and poster, and skips the video for reduced motion, Save-Data and 2G. Until it plays, the still shows."""
    return (f'<video class="hero-video" autoplay muted loop playsinline disablepictureinpicture preload="none" aria-hidden="true" tabindex="-1" '
            f'data-video="{P}{VIDEO}" data-poster="{P}{VIDEO}-poster"></video>')


HERO_PRELOAD = (f'<link rel="preload" as="image" type="image/avif" media="{STACK}" imagesrcset="{hero_set("avif", "", True)}" imagesizes="100vw" fetchpriority="high">\n'
                f'<link rel="preload" as="image" type="image/avif" media="{WIDE}" imagesrcset="{hero_set("avif")}" imagesizes="100vw" fetchpriority="high">')


# per-photo exposure trims, so the set reads as one: dark, warm, one light source (see the CSS grade)
GRADE = {'barbers': 1, 'cafes': .95, 'gyms': .95, 'trades': .82, 'salons': .68}
CHAPTERS = [
    ('Barbers', 'barber', 'barbers', (900, 623), None, 'Book a chair in two taps, from the footpath.', 'A red barber’s chair under a wall of framed paintings'),
    ('Cafés', 'cafe', 'cafes', (900, 600), None, 'The menu, the hours and the map, before the coffee is poured.', 'Two espresso shots on a chrome coffee machine'),
    ('Gyms', 'gym', 'gyms', (900, 600), None, 'A free-trial form that turns a maybe into a first session.', 'A dumbbell under a single light'),
    ('Trades', 'plumber', 'trades', (1800, 1200), 1200, 'One big call button, for the day a pipe bursts.', 'A workshop tool wall lit by a lamp'),
    ('Salons', 'salon', 'salons', (2000, 1333), 1200, 'A calm service menu, with every price in plain sight.', 'Salon mirrors framed in soft light'),
]


_CJ = os.path.join(HERE, 'chapters.json')
NEW_PHOTOS = json.load(open(_CJ, encoding='utf-8')) if os.path.exists(_CJ) else {}


def chapters(P):
    n = len(CHAPTERS)
    out = []
    for i, (title, slug, stem, (w, h), small, cap, alt) in enumerate(CHAPTERS):
        np = NEW_PHOTOS.get(stem)
        if np:
            (w, h), small = np['size'], np['small']
        d = DEMO[slug]
        img = pic(f'assets/chapters/{stem}-l', w, h, alt, P, sizes='100vw', small=(f'assets/chapters/{stem}-s', small) if small else None)
        out.append(f'''<article class="chapter" style="--i:{i};--exposure:{1 if np else GRADE.get(stem, 1)}{';--focus:' + np['focus'] if np else ''}" aria-labelledby="ch-{i}">
        <div class="chapter-media">{img}</div>
        <div class="container chapter-copy">
          <p class="chapter-idx"><b>0{i + 1}</b> / 0{n}</p>
          <h3 id="ch-{i}" class="chapter-title">{title}</h3>
          <i class="chapter-rule" aria-hidden="true"></i>
          <p class="chapter-cap">{cap}</p>
          <p class="chapter-meta"><span class="chip chip-plain">Concept site</span> {d[2]}</p>
          <a class="link" href="{P}work/{slug}">See the concept {icon('arrow')}<span class="sr-only">: {d[2]}</span></a>
        </div>
      </article>''')
    return f'''<section class="chapters" aria-labelledby="chapters-h" data-chapters>
    <div class="container chapters-intro">
      <p class="label" data-reveal><span class="idx">02</span><span class="slash" aria-hidden="true">/</span>Trades</p>
      <h2 id="chapters-h" class="h2" data-split>Five trades, <em>five first impressions.</em></h2>
    </div>
    <div class="chapters-stage">
      {''.join(out)}
      <div class="chapters-hud" aria-hidden="true"><span class="chapters-count"><b>01</b> / 0{n}</span><span class="chapters-bar"><i></i></span></div>
    </div>
  </section>'''


LAB_TRADES = [('barber', 'Barber'), ('cafe', 'Café'), ('gym', 'Gym'), ('trades', 'Trades'), ('salon', 'Salon')]
LAB_MOODS = [('obsidian', 'Obsidian &amp; Gold', '#0D0E12', '#D4AF37'), ('espresso', 'Espresso &amp; Cream', '#2B1E17', '#E9D9C2'), ('stone', 'Stone &amp; Sage', '#E7E4DC', '#6F7F63')]
LAB_FEATURES = [('booking', 'Online booking'), ('menu', 'Menu or price list'), ('gallery', 'Gallery'), ('reviews', 'Reviews section'), ('map', 'Map and hours')]


def lab(P, idx='03', level='h2', heading=True):
    trades = ''.join(f'<label class="pill"><input type="radio" name="lab-trade" value="{k}"{" checked" if i == 0 else ""}><span>{t}</span></label>' for i, (k, t) in enumerate(LAB_TRADES))
    moods = ''.join(f'<label class="pill mood"><input type="radio" name="lab-mood" value="{k}"{" checked" if i == 0 else ""}><span><i style="--a:{a};--b:{b}" aria-hidden="true"></i>{t}</span></label>' for i, (k, t, a, b) in enumerate(LAB_MOODS))
    feats = ''.join(f'<label class="pill"><input type="checkbox" name="lab-feature" value="{k}"{" checked" if k in ("booking", "menu") else ""}><span>{t}</span></label>' for k, t in LAB_FEATURES)
    head_html = head_block('Concept Lab', '<span id="lab-h">Sketch your homepage <em>in a minute.</em></span>', 'Pick a trade, a mood and the features you need. The preview changes as you go.', split=True, idx=idx, level=level) if heading else ''
    return f'''{head_html}
      <div class="lab" data-lab data-base="{P}">
        <form class="lab-controls" data-lab-form>
          <fieldset><legend>Trade</legend><div class="pills">{trades}</div></fieldset>
          <div class="field"><label for="lab-name">Business name</label><input id="lab-name" name="lab-name" type="text" maxlength="32" autocomplete="organization" placeholder="Your business name"></div>
          <fieldset><legend>Mood</legend><div class="pills">{moods}</div></fieldset>
          <fieldset><legend>Features</legend><div class="pills">{feats}</div></fieldset>
          <p class="lab-note">This is a quick preview. Your real free concept is designed properly, by hand, for your business.</p>
          <button class="btn btn-gold" type="button" data-lab-send>Send me this concept</button>
          <p class="sr-only" role="status" aria-live="polite" data-lab-status></p>
        </form>
        <div class="lab-stage" aria-hidden="true">
          <div class="lab-laptop"><div class="lab-screen" data-lab-screen></div><div class="laptop-base"></div></div>
          <div class="lab-phone"><div class="lab-screen" data-lab-screen></div></div>
        </div>
        <noscript><p class="lab-nojs">The Concept Lab needs JavaScript to draw its preview. You can still <a href="{P}free-concept">ask for a free concept</a>.</p></noscript>
      </div>'''


ANATOMY = [
    (3.5, 72, 'Tap to call', 'The call button sits where a thumb lands, at the top and again in a bar along the bottom.'),
    (17, 25, 'The job, in one tap', 'Customers pick what is wrong first, so the next screen already speaks to them.'),
    (45, 40, 'Google-ready titles', 'The trade and the suburb are in the main heading, the way people search for them.'),
    (70, 73, 'Book or quote in two taps', 'A short form with a clear button, not a maze of pages.'),
    (79, 50, 'Open now, and the hours', 'Whether you are available today is the first thing many people want to know.'),
    (89, 82, 'Loads fast on a weak signal', 'Small images and no page-builder bloat, so the page opens on one bar of 4G.'),
]


def anatomy(P):
    dots = ''.join(f'<span class="hot" style="--y:{y}%;--x:{x}%" data-hot="{i}" aria-hidden="true">{i + 1}</span>' for i, (y, x, _, _) in enumerate(ANATOMY))
    points = ''.join(f'<li class="hot-card" data-hot-card="{i}"><span class="n" aria-hidden="true">{i + 1}</span><div><h3>{t}</h3><p>{x}</p></div></li>' for i, (_, _, t, x) in enumerate(ANATOMY))
    return f'''<section class="section anatomy-sec" aria-labelledby="anat-h">
    <div class="container">
      <div class="section-head split">
        <div>
          <p class="label" data-reveal><span class="idx">04</span><span class="slash" aria-hidden="true">/</span>Anatomy</p>
          <h2 id="anat-h" class="h2" data-split>Every detail <em>earns its place.</em></h2>
        </div>
        <p class="lead" data-reveal>A concept homepage, taken apart. Each numbered spot turns a visit into a call or a booking.</p>
      </div>
      <div class="anatomy" data-anatomy>
        <figure class="anatomy-shot" data-reveal>
          <div class="anat-devices">
            {laptop('plumber', 'Waverley Plumbing', P)}
            <div class="phone anat-phone"><div class="hot-wrap"><img src="{P}img/work/plumber-phone.webp" width="600" height="1300" loading="lazy" decoding="async" alt="The Waverley Plumbing concept homepage on a phone, with six numbered spots">{dots}</div></div>
          </div>
          <figcaption class="tiny">Concept site. Waverley Plumbing is a made-up business.</figcaption>
        </figure>
        <ol class="anatomy-list">{points}</ol>
      </div>
    </div>
  </section>'''


def browser(img_html, url, live=False):
    """a quiet browser window: address bar (with a Live tag for a launched site) and the page inside"""
    tag = '<span class="bw-live"><i aria-hidden="true"></i>Live</span>' if live else ''
    return f'<div class="bw"><div class="bw-bar"><span class="bw-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="bw-url">{url}</span>{tag}</div><div class="bw-page">{img_html}</div></div>'


STEP_NOTES = {'chat': 'Shown: an example first message.', 'concept': 'Shown: Brass &amp; Blade, a made-up barbershop.',
              'build': 'Shown: Iron &amp; Ember, a made-up gym.', 'launch': 'Shown: Maison Lune, a made-up salon, live on its own domain.'}


def step_visual(k, P):
    """the moment each step is about, shown as it really looks (each is labelled in the step's text)"""
    if k == 'chat':
        return '''<div class="step-visual chat" role="img" aria-label="An example first message from a barbershop owner, and our reply">
              <p class="chat-head"><b>New message</b><span>Black Crest Web Designs</span></p>
              <p class="chat-msg">Hi, I run a barbershop in Box Hill. Walk-ins and bookings, open six days. Can you make us a site?</p>
              <p class="chat-msg chat-us">Thanks! Your free concept homepage is usually ready within 5 business days. Any photos or links you like?</p>
            </div>'''
    if k == 'concept':
        return f'<div class="step-visual">{laptop("barber", "Brass &amp; Blade", P)}</div>'
    if k == 'build':
        return f'<div class="step-visual">{duo("gym", P, parallax="0")}</div>'
    shot = (f'<img src="{P}img/work/salon-desktop-1600.webp" srcset="{P}img/work/salon-desktop-800.webp 800w, {P}img/work/salon-desktop-1600.webp 1600w" '
            f'sizes="(min-width: 1024px) 540px, 92vw" width="1600" height="1000" loading="lazy" decoding="async" alt="The Maison Lune concept site open in a browser, marked Live">')
    return f'<div class="step-visual">{browser(shot, "yourbusiness.com.au", live=True)}</div>'


def stack_cards(P=''):
    return '<ol class="stack">' + ''.join(f'''<li class="stack-card" style="--i:{i}">
          <div class="stack-inner">
            <div class="stack-copy"><span class="stack-n" aria-hidden="true">0{i + 1}</span><span class="chip chip-plain">{w}</span><h3 class="h3">{t}</h3><p>{x}</p><p class="tiny step-note">{STEP_NOTES[k]}</p></div>
            {step_visual(k, P)}
          </div>
        </li>''' for i, (t, k, w, x) in enumerate(STEPS)) + '</ol>'


def process_stack(P):
    return f'''<section class="section-tight process-sec has-grid" aria-labelledby="how-h">
    <div class="container">
      <div class="section-head split process-head">
        <div>
          <p class="label" data-reveal><span class="idx">06</span><span class="slash" aria-hidden="true">/</span>Process</p>
          <h2 id="how-h" class="h2" data-split>Four steps. <em>No surprises.</em></h2>
        </div>
        <div><p class="lead" data-reveal>You see your homepage before you pay anything. This is everything that happens after that.</p>
        <a class="link" data-reveal href="{P}process">The full process {icon('arrow')}</a></div>
      </div>
      {stack_cards(P)}
    </div>
  </section>'''


STANDARD_NUMS = [('onePage', None, 'Starting price, written down before any work begins.'), (None, '5', 'Up to 5 pages in a Full Website.'),
                 (None, '2', 'Rounds of changes, included in every build.'), (None, '0', 'Lock-in contracts. The care plan is month to month.'),
                 (None, '100%', 'Yours. The finished site, the files and the logins.')]


def standard_band(P):
    items = ''.join(f'''<li data-reveal><b class="odo" {f'data-price="{k}" data-odometer="{money(ONE)}"' if k else f'data-odometer="{v}"'}>{money(ONE) if k else v}</b><span>{x}</span></li>''' for k, v, x in STANDARD_NUMS)
    return f'''<section class="section-tight standard-band" aria-labelledby="std-h">
    <div class="container">
      <div class="standard-head">
        <p class="label" data-reveal><span class="idx">07</span><span class="slash" aria-hidden="true">/</span>The Black Crest Standard</p>
        <h2 id="std-h" class="h2" data-split>Promises you can <em>hold us to.</em></h2>
      </div>
      <ul class="standard-nums">{items}</ul>
      <a class="link" data-reveal href="{P}standard">Read the full standard {icon('arrow')}</a>
    </div>
  </section>'''


GALLERY = json.load(open(os.path.join(HERE, 'gallery.json'), encoding='utf-8'))


def collection(P):
    items = ''.join(f'''<li style="--l:{g['left']}%;--t:{g['top']}%;--w:{g['right'] - g['left']}%;--h:{g['bottom'] - g['top']}%">
          <a class="niche" data-niche="{i}" href="{P}work/{d[0]}">
            {pic(f'assets/gallery/niche-{d[0]}', 840, 1120, '', P, sizes='(min-width: 900px) 1px, 46vw', cls='niche-still')}
            <span class="niche-label"><b>{d[2]}</b><small>Concept site &middot; {d[3]}</small></span>
          </a></li>''' for i, (d, g) in enumerate(zip(DEMOS, GALLERY)))
    return f'''<section class="collection" aria-labelledby="work-h">
    <div class="container collection-head">
      <p class="label" data-reveal><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>Work</p>
      <h2 id="work-h" class="h2" data-split>The <em>concept</em> collection</h2>
      <p class="lead" data-reveal>Six made-up local businesses. Real code. Open any of them.</p>
    </div>
    <div class="gallery" data-gallery data-base="{P}">
      {pic('assets/gallery/wall', 2400, 1022, 'Six lit niches in a dark stone wall, each holding a phone that shows one of the concept sites', P, sizes='100vw', cls='gallery-still')}
      <ol class="niches">{items}</ol>
    </div>
    <div class="container reel-row">
      <div class="reel-copy">
        <div><p class="label" data-reveal>Showreel</p>
        <p class="h2" data-reveal>See them <em>move.</em></p></div>
        <div><p data-reveal>Twenty-three silent seconds across all six concepts.</p>
        <p data-reveal><button class="text-btn" type="button" data-reel-play>Play reel</button></p></div>
      </div>
      <figure class="reel" data-reveal>
        <div class="laptop"><div class="laptop-screen">
          <video data-reel muted loop playsinline preload="none" width="1280" height="800" data-poster="{P}assets/reel-poster.webp" aria-label="A short silent reel scrolling through the six concept sites">
            <source src="{P}assets/reel.webm" type="video/webm"><source src="{P}assets/reel.mp4" type="video/mp4">
          </video>
        </div><div class="laptop-base" aria-hidden="true"></div></div>
        <figcaption class="reel-cap">Concept sites. Real code. Not real clients, yet.</figcaption>
      </figure>
    </div>
  </section>'''


MEL_TRADES = ['Barbers', 'Cafés', 'Gyms', 'Plumbers', 'Electricians', 'Salons', 'Mechanics']


def melbourne(P):
    ul = lambda hidden: f'<ul{" aria-hidden=" + chr(34) + "true" + chr(34) if hidden else ""}>' + ''.join(f'<li>{t}</li>' for t in MEL_TRADES) + '</ul>'
    return f'''<section class="melbourne" aria-labelledby="mel-h">
    <div class="container">
      <p class="label" data-reveal><span class="idx">09</span><span class="slash" aria-hidden="true">/</span>Where</p>
      <h2 id="mel-h" class="mel-title" data-split>Made in <em>Melbourne.</em></h2>
      <p class="mel-time" data-reveal><span data-clock>Melbourne</span></p>
      <p class="lead" data-reveal>Building for local businesses across Victoria.</p>
    </div>
    <div class="marquee marquee-outline" data-marquee role="region" aria-label="Trades we build for"><div class="marquee-track">{ul(False)}{ul(True)}</div></div>
  </section>'''


P = ''
page('index.html', 'Black Crest Web Designs: premium sites for local businesses', f'Premium websites for Melbourne barbers, cafes, gyms, salons and trades. We design your homepage first, free. One Page {money(ONE)}, Full Website {money(FULL)}.', f'''<main id="main">
  <section class="hero hero-render" aria-labelledby="hero-h">
    <div class="hero-media" data-hero-media>
      <div class="hero-zoom">{hero_picture(P)}<span class="hero-sweep" aria-hidden="true"></span></div>
      {hero_video(P)}
    </div>
    <div class="container hero-copy">
      <p class="label">Black Crest Web Designs &middot; Melbourne</p>
      <h1 id="hero-h">Premium sites for <em>local</em> businesses</h1>
      <p class="lead">We design your homepage first, free. You decide after.</p>
      <div class="btn-row">
        <a class="btn btn-gold" href="free-concept">Get a free concept</a>
        <a class="btn btn-ghost" href="work">See the work</a>
      </div>
      <p class="hero-statement">One page from <span data-price="onePage">{money(ONE)}</span> <i aria-hidden="true">&middot;</i> Full website <span data-price="fullSite">{money(FULL)}</span> <i aria-hidden="true">&middot;</i> Concept free</p>
    </div>
    <p class="scroll-cue" aria-hidden="true"><i></i>Scroll</p>
  </section>

  {collection(P)}

  {chapters(P)}

  <section class="section lab-sec" id="lab" aria-labelledby="lab-h">
    <div class="container">
      {lab(P)}
    </div>
  </section>

  {anatomy(P)}

  <section class="section-tight ba-sec" aria-labelledby="ba-h">
    <div class="container ba-split">
      <div class="section-head split">
        <div>
          <p class="label" data-reveal><span class="idx">05</span><span class="slash" aria-hidden="true">/</span>Before and after</p>
          <h2 id="ba-h" class="h2" data-split>From dated <em>to sharp.</em></h2>
        </div>
        <div>
          <p class="lead" data-reveal>Same business, two first impressions. Drag the handle, or use the arrow keys.</p>
          <div class="compare-meta" data-reveal><span class="chip">Example, not a real customer</span><span class="tiny">Both sides are mock-ups made for this comparison.</span></div>
        </div>
      </div>
      <div class="compare" data-reveal data-compare>
        <img src="img/compare-before.webp" width="1600" height="1000" loading="lazy" decoding="async" alt="Before: a dated, cluttered barbershop homepage with small text and no clear booking button">
        <img class="after" src="img/compare-after.webp" width="1600" height="1000" loading="lazy" decoding="async" alt="After: the Brass and Blade concept homepage, dark and clean with a clear Book a chair button">
        <span class="compare-tag l" aria-hidden="true">Before</span><span class="compare-tag r" aria-hidden="true">After</span>
        <span class="handle" aria-hidden="true"><span class="disc"><i></i><i></i></span><span class="drag-hint">Drag</span></span>
        <label class="sr-only" for="compare-range">Compare before and after</label>
        <input id="compare-range" type="range" min="0" max="100" value="50">
      </div>
    </div>
  </section>

  {process_stack(P)}

  {standard_band(P)}

  <section class="section has-grid pricing-sec" aria-labelledby="price-h">
    <div class="container">
      {head_block('Pricing', '<span id="price-h">Clear prices. <em>Set before we start.</em></span>', 'One price per package, agreed in writing before any work begins. Bigger projects are quoted.', split=True, idx='08')}
      {statement(P)}
      <p class="pricing-more" data-reveal><a class="text-btn" href="pricing">Pricing, add-ons and the calculator</a></p>
    </div>
  </section>

  {melbourne(P)}

  <section class="section offer-sec" aria-labelledby="case-h">
    <div class="container offer-split">
      <div class="offer-copy">
        <p class="label" data-reveal><span class="idx">10</span><span class="slash" aria-hidden="true">/</span>An honest offer</p>
        <h2 id="case-h" class="h2" data-split>Be our first <em>case study.</em></h2>
        <p class="lead" data-reveal>We are new, so there are no customer reviews to show yet, and we will never invent any. The first few local shops we work with get a discount, in return for an honest quote about the experience and permission to show their site here.</p>
        <p data-reveal><a class="btn btn-ghost" href="contact">Ask about the offer</a></p>
      </div>
      <figure class="offer-visual" data-reveal>{duo('barber', P, parallax='0.04')}<figcaption class="tiny">Your site could sit here. Shown: Brass &amp; Blade, a made-up barbershop concept.</figcaption></figure>
    </div>
  </section>

  <section class="section-tight band" aria-labelledby="faq-h">
    <div class="container faq-split">
      {head_block('FAQ', '<span id="faq-h">Straight <em>answers.</em></span>', 'The questions everyone asks before they start.', idx='11')}
      <div data-reveal>{faq_list(FAQS[:5], P)}<p style="margin-top:22px"><a class="link" href="faq">All questions {icon('arrow')}</a></p></div>
    </div>
  </section>

  {cta_final('See it <em>before</em> you pay.', 'Tell us about your business. We reply within 1 business day and design your homepage for free.', secondary=('contact', 'Ask a question'))}
</main>''', ld=[ORG], vendor=('gsap/Flip.min.js',), pre=True, first=HERO_PRELOAD)


# ================================================================= Concept Lab
P = ''
page('lab.html', 'Concept Lab: Black Crest Web Designs', 'Sketch a homepage for your business in a minute: pick your trade, a mood and the features you need, then send it to us as the start of your free concept.', f'''<main id="main">
  <div class="container page-head">
      <p class="label"><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>Concept Lab</p>
      <h1 class="h1" data-split>Sketch it <em>yourself.</em></h1>
      <p class="lead" data-reveal>Pick your trade, a mood and the features you need. When it looks close, send it to us and we design the real thing, free.</p>
  </div>
  <section class="section-tight lab-sec" aria-label="Concept Lab">
    <div class="container">
      {lab(P, heading=False)}
    </div>
  </section>
  {cta_final('Rather <em>just talk?</em>', 'Tell us about your business in a few lines. We reply within 1 business day.', secondary=('contact', 'Ask a question'))}
</main>''', vendor=('gsap/Flip.min.js',))


# ================================================================= The Black Crest Standard
STANDARD = [
    ('A free concept, first', 'We design your homepage before you pay anything. If it is not right for you, you walk away and owe nothing.'),
    ('One price, in writing', f'Every price is agreed in writing before work starts. One Page is {money(ONE)}, a Full Website is {money(FULL)}, bigger projects are quoted.'),
    ('Half now, half at launch', 'A 50% deposit starts the build. The balance is due when your site goes live, never before.'),
    ('Two rounds of changes', 'Two rounds of changes are included in every build, so the site ends up the way you want it.'),
    ('You own it', 'Once the balance is paid, the finished site is yours: the files, the logins and the right to take it anywhere.'),
    ('Your domain, in your name', 'Your web address is registered in your name and paid for by you, about $20 a year. Nobody can hold it back from you.'),
    ('No lock-in', f'The care plan is {money(CARE)} a month, month to month. Cancel by email before the next month starts.'),
    ('Built for phones', 'Every page is designed for phones first and checked on phones and computers before launch.'),
    ('No tracking we did not discuss', 'We do not add analytics, cookies or trackers to your site unless you ask for them. This site has none.'),
    ('Honest words only', 'No made-up reviews, invented numbers or borrowed logos, on your site or on ours.'),
]
P = ''
page('standard.html', 'The Black Crest Standard: Black Crest Web Designs', 'Ten commitments we make on every website: a free concept first, one written price, half at launch, two rounds of changes, and you own the finished site.', f'''<main id="main">
  <div class="container page-head">
      <p class="label"><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>The Black Crest Standard</p>
      <h1 class="h1" data-split>Ten promises, <em>in writing.</em></h1>
      <p class="lead" data-reveal>These hold for every project, whatever the size. If we ever fall short of one, tell us at <a class="link" data-email href="mailto:{EMAIL}">{EMAIL}</a>.</p>
  </div>
  <section class="section-tight has-grid" aria-label="The ten commitments">
    <div class="container">
      <ol class="standard-list">{''.join(f'<li data-reveal><span class="n" aria-hidden="true">{i + 1:02d}</span><div><h2 class="h3">{t}</h2><p>{x}</p></div></li>' for i, (t, x) in enumerate(STANDARD))}</ol>
    </div>
  </section>
  {cta_final('See it <em>before</em> you pay.', 'Tell us about your business. We reply within 1 business day and design your homepage for free.', secondary=('pricing', 'See pricing'))}
</main>''')


# ================================================================= Work
# Case studies: facts read from each concept's own files (title, description, address, pages, CSS colours and fonts).
LH_DATE = '30 October 2026'
CASES = {
    'barber': {
        'place': 'Box Hill VIC', 'line': 'A dark, brass-lit barbershop site where booking a chair is never more than a thumb away.',
        'brief': 'A neighbourhood barbershop that lives on walk-ins and regulars. People find it on their phones, often a block away, and decide in seconds. The site had to feel like the shop and make booking the obvious next step.',
        'built': ['A home page with a slowly turning 3D barber pole and a sticky "Book a chair" bar', 'Services and a full price list, also as a printable PDF', 'Online booking, a barbers page and a membership page', 'A gallery of cuts, a journal and a reviews page', 'A visit page with the map, hours and directions'],
        'swatches': [('#0B0B0C', 'Page'), ('#161617', 'Cards'), ('#F2EBDD', 'Text'), ('#C9A24B', 'Brass'), ('#E4C77A', 'Brass, light')],
        'fonts': [('Oswald', 'Headings, set in capitals like shop signage'), ('Montserrat', 'Body text and buttons')],
        'decisions': 'Near-black with one brass accent, so prices and the booking button are the brightest things on screen. Tall condensed headings echo old shopfront lettering.',
        'lh': (89, 100, 100, 69)},
    'cafe': {
        'place': 'Melbourne VIC', 'line': 'Warm espresso tones, a steaming 3D cup and a menu you can read standing at the counter.',
        'brief': 'An all-day café with small-batch coffee and long tables. Customers want the menu, the hours and how to order ahead, and they want to feel the room before they walk in.',
        'built': ['A home page with a steaming 3D coffee cup', 'A full menu page, plus the menu as a PDF', 'Pick-up ordering and table reservations', 'Story, sustainability, experiences and press pages', 'Opening hours, a map and a reviews page'],
        'swatches': [('#120D0A', 'Page'), ('#1C1511', 'Cards'), ('#F3E9DA', 'Text'), ('#E0782B', 'Ember'), ('#CFC3B1', 'Body text')],
        'fonts': [('Montserrat', 'Headings and body text'), ('Mrs Saint Delafield', 'A handwritten accent, used sparingly')],
        'decisions': 'Espresso browns instead of black, so the page feels warm. One ember orange marks every action. A single handwritten flourish gives it a signature without hurting legibility.',
        'lh': (82, 100, 100, 69)},
    'gym': {
        'place': 'Clayton VIC', 'line': 'A loud, confident gym site built around one goal: getting someone to a free first session.',
        'brief': 'A strength and conditioning gym competing with big chains. Its edge is coaching. The site needed to show the timetable and the coaches, and turn a maybe into a booked free trial.',
        'built': ['A home page with a slowly rotating 3D barbell', 'A weekly class timetable', 'Coaches, memberships and a 7-day free trial form', 'A visit page, a journal and a reviews page', 'A careers page'],
        'swatches': [('#0B0B0C', 'Page'), ('#161618', 'Cards'), ('#F5F1EA', 'Text'), ('#FFE000', 'Accent'), ('#D2CCC2', 'Body text')],
        'fonts': [('Barlow Condensed', 'Headings, tight and athletic'), ('Montserrat', 'Body text and buttons')],
        'decisions': 'One electric yellow on near-black, used only where a visitor can act. Condensed headings fit long class names on a phone without wrapping.',
        'lh': (89, 100, 100, 69)},
    'plumber': {
        'place': 'Glen Waverley VIC', 'line': 'A plumber’s site for the worst day of someone’s week: one big call button and straight answers.',
        'brief': 'A local plumbing and gas business. Most visitors arrive mid-emergency on a phone. They need to call in one tap, see that the business covers their suburb, and get a sense of the price.',
        'built': ['A "What’s happening?" picker that leads with the problem', 'A call button at the top and a call bar along the bottom', 'Service areas, a price guide and a before-and-after', 'A quote form and straight-answer FAQs', 'A reviews page and a privacy page'],
        'swatches': [('#0B2545', 'Navy'), ('#FF6A13', 'Safety orange'), ('#F2F4F7', 'Grey'), ('#1A2433', 'Ink'), ('#C47A3D', 'Copper')],
        'fonts': [('Barlow Condensed', 'Headings, in capitals'), ('Inter', 'Body text and forms')],
        'decisions': 'A light page for reading in daylight, a trustworthy navy, and one safety orange reserved for calling. Nothing decorative competes with the phone number.',
        'lh': (72, 100, 100, 69)},
    'salon': {
        'place': 'Glen Waverley VIC', 'line': 'A calm, light salon site where every price is visible and booking takes under a minute.',
        'brief': 'A hair and beauty salon whose clients hate surprises at the counter. The site had to feel unhurried, show clear prices for every service, and make booking simple.',
        'built': ['A service menu with clear prices', 'Online booking, designed to take under a minute', 'Stylists, a gallery of recent work and FAQs', 'Gift vouchers', 'A map, contact details and a reviews page'],
        'swatches': [('#FAF6F0', 'Ivory'), ('#2B211C', 'Cocoa'), ('#C9A38C', 'Clay'), ('#8A9A86', 'Sage'), ('#F3EBE1', 'Sand')],
        'fonts': [('Cormorant Garamond', 'Headings, soft and editorial'), ('Inter', 'Body text and prices')],
        'decisions': 'Warm ivory and cocoa instead of stark white and black, with clay and sage accents. An elegant serif for headings, and a plain sans for prices so they read at a glance.',
        'lh': (90, 100, 100, 69)},
    'parts': {
        'place': None, 'line': 'An auto parts home page that starts with your car, not with a catalogue.',
        'brief': 'An auto parts store home page, redesigned as a concept with a made-up brand. Drivers often know the job but not the part. The page had to help them find parts that fit their car quickly, on a phone.',
        'built': ['A car finder that starts from a number plate', 'Shop by job, with steps for common jobs', 'An oil finder and featured products', 'Shop by category and a cart', 'Rego and service reminders, and a rewards sign-up'],
        'swatches': [('#0E5A5C', 'Teal'), ('#0A4648', 'Buttons'), ('#E39B2D', 'Amber'), ('#009546', 'In stock'), ('#1A1A1A', 'Charcoal')],
        'fonts': [('Lato', 'Headings and body text')],
        'decisions': 'Deep teal for the brand and buttons, amber for deals, and green only for good news like stock. Its own identity, a bolt-head mark and plain category names, so it never echoes a real parts chain.',
        'lh': (99, 100, 100, 63)},
}
YEAR = '2026'


def italic_last(name):
    """One italic word per headline: the last word of the concept's name."""
    head, _, last = name.rpartition(' ')
    return f'{head} <em>{last}</em>' if head else f'<em>{name}</em>'


def case_page(i, d):
    slug, folder, name, trade = d[0], d[1], d[2], d[3]
    c = CASES[slug]
    P = '../'
    nxt = DEMOS[(i + 1) % len(DEMOS)]
    sw = ''.join(f'<li><span class="sw" style="background:{h}"></span><b>{label}</b><code>{h}</code></li>' for h, label in c['swatches'])
    fonts = ''.join(f'<li><b>{f}</b><span>{use}</span></li>' for f, use in c['fonts'])
    built = ''.join(f'<li>{x}</li>' for x in c['built'])
    perf, a11y, bp, seo = c['lh']
    place = c['place'] or 'No location: an online store concept'
    return f'''<main id="main" class="case">
  <section class="detail" aria-labelledby="case-name">
    <div class="container detail-grid">
      <div class="detail-object" data-wipe>{pic(f'assets/gallery/detail-{slug}', 1040, 1280, f'The {name} concept on a laptop and a phone, standing in a lit stone niche', P, lazy=False, sizes='(min-width: 1024px) 46vw, 92vw', high=True)}</div>
      <div class="detail-copy">
        <p class="crumbs"><a href="{P}work">Work</a><span aria-hidden="true">/</span>{trade}</p>
        <h1 id="case-name" class="display" data-split>{italic_last(name)}</h1>
        <p class="lead" data-reveal>{c['line']}</p>
        <dl class="facts" data-reveal>
          <div><dt>Project</dt><dd>Concept, not a real client</dd></div>
          <div><dt>Trade</dt><dd>{trade}</dd></div>
          <div><dt>Location</dt><dd>{place}</dd></div>
          <div><dt>Year</dt><dd class="num">{YEAR}</dd></div>
        </dl>
        <div class="detail-actions" data-reveal><a class="btn btn-gold" href="{DEMO_HOST}{folder}/" target="_blank" rel="noopener">Visit the live concept<span class="sr-only"> (opens in a new tab)</span></a>
        <a class="text-btn" href="/#work-h">Back to the collection</a></div>
      </div>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="brief-h">
    <div class="container case-split">
      <div><p class="label" data-reveal><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>The brief</p><h2 id="brief-h" class="h3" data-reveal>What it had to do</h2></div>
      <p class="lead case-text" data-reveal>{c['brief']}</p>
    </div>
  </section>

  <section class="section-tight band" aria-labelledby="built-h">
    <div class="container case-split">
      <div><p class="label" data-reveal><span class="idx">02</span><span class="slash" aria-hidden="true">/</span>What we built</p><h2 id="built-h" class="h3" data-reveal>Inside the concept</h2></div>
      <ul class="ticks case-built" data-reveal>{built}</ul>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="design-h">
    <div class="container">
      <div class="case-split">
        <div><p class="label" data-reveal><span class="idx">03</span><span class="slash" aria-hidden="true">/</span>Design decisions</p><h2 id="design-h" class="h3" data-reveal>Colour and type</h2></div>
        <p class="lead case-text" data-reveal>{c['decisions']}</p>
      </div>
      <div class="case-design">
        <ul class="swatches" data-reveal aria-label="Colours from the concept's stylesheet">{sw}</ul>
        <ul class="typefaces" data-reveal aria-label="Typefaces">{fonts}</ul>
      </div>
    </div>
  </section>

  <section class="section-tight case-screens" aria-label="Screens">
    <div class="container case-gallery">
      <div class="g-wide" data-parallax="0.06"><img src="{P}img/work/{slug}-desktop-1600.webp" srcset="{P}img/work/{slug}-desktop-800.webp 800w, {P}img/work/{slug}-desktop-1600.webp 1600w" sizes="(min-width: 1024px) 66vw, 92vw" width="1600" height="1000" loading="lazy" decoding="async" alt="The {name} concept home page on a desktop screen"></div>
      <div class="g-phone" data-parallax="0.14">{phone(slug, name, P)}</div>
    </div>
  </section>

  <section class="section-tight band" aria-labelledby="speed-h">
    <div class="container case-split">
      <div><p class="label" data-reveal><span class="idx">04</span><span class="slash" aria-hidden="true">/</span>Speed</p><h2 id="speed-h" class="h3" data-reveal>Measured, not promised</h2></div>
      <div data-reveal>
        <ul class="scores">
          <li><b>{perf}</b><span>Performance</span></li><li><b>{a11y}</b><span>Accessibility</span></li><li><b>{bp}</b><span>Best practices</span></li><li><b>{seo}</b><span>SEO</span></li>
        </ul>
        <p class="tiny">Lighthouse 12.8.2, mobile preset, measured on {LH_DATE} against a copy of the concept served locally. SEO is held back on purpose: every concept is set to "noindex" so it never competes with real businesses in search.</p>
      </div>
    </div>
  </section>

  <nav class="case-next" aria-label="Next concept">
    <a class="container next-link" href="{P}work/{nxt[0]}" data-hover-img="{P}img/work/{nxt[0]}-desktop-800.webp">
      <span class="label">Next concept</span>
      <span class="next-name">{nxt[2]} <span class="arrow">{icon('arrow')}</span></span>
      <span class="tiny">{nxt[3]} &middot; concept site</span>
    </a>
  </nav>
  {cta_final('Want one like <em>this?</em>', 'We design your homepage concept for free, so you can see it before you decide.', secondary=('lab', 'Try the Concept Lab'), P=P)}
</main>'''


for i, d in enumerate(DEMOS):
    page(f'work/{d[0]}.html', f'{strip_tags(d[2])}: concept case study by Black Crest Web Designs',
         f'{strip_tags(d[2])} is a concept {d[3].lower()} website by Black Crest Web Designs, for a made-up business. The brief, what we built, colours, type and measured speed.',
         case_page(i, d), ld=[{'@context': 'https://schema.org', '@type': 'CreativeWork', 'name': f'{strip_tags(d[2])} (concept site)',
                                'description': f'A concept website for a made-up {d[3].lower()}, designed and built by Black Crest Web Designs. Not a real client.',
                                'url': SITE + f'work/{d[0]}', 'image': SITE + f'img/work/{d[0]}-desktop-1600.jpg', 'dateCreated': YEAR,
                                'creator': {'@id': SITE + '#business'}, 'isPartOf': {'@type': 'WebSite', 'name': 'Black Crest Web Designs', 'url': SITE}}])

P = ''
rows = ''.join(f'''<li><a class="work-line" href="work/{d[0]}" data-hover-img="img/work/{d[0]}-desktop-800.webp">
          <span class="n" aria-hidden="true">0{i + 1}</span>
          <span class="w-name">{d[2]}</span>
          <span class="w-meta"><span>{d[3]}</span><span>{CASES[d[0]]['place'] or 'Online store'}</span></span>
          <img class="w-thumb" src="img/work/{d[0]}-desktop-800.webp" width="800" height="500" loading="lazy" decoding="async" alt="">
          <span class="w-go" aria-hidden="true">{icon('arrow')}</span>
        </a></li>''' for i, d in enumerate(DEMOS))
page('work.html', 'Work: concept sites by Black Crest Web Designs', 'Six concept websites for made-up local businesses: a barbershop, café, gym, plumber, salon and auto parts store. Each has a case study.', f'''<main id="main">
  <div class="container page-head">
    <p class="label"><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>Work</p>
    <h1 class="h1" data-split>Six concepts. <em>No templates.</em></h1>
    <p class="lead" data-reveal>Made-up local businesses, designed and coded like real ones. None of them are clients: they show what we build. Each has a short case study.</p>
  </div>
  <section class="container work-list-wrap" aria-label="Concept case studies">
    <ol class="work-list">{rows}</ol>
    <p class="tiny work-note" data-reveal>All six are concepts for fictional businesses. Names, prices, reviews and photos inside them are made up or stock images.</p>
  </section>
  <section class="section-tight band" aria-labelledby="try-h">
    <div class="container offer-split">
      <div><p class="label" data-reveal><span class="idx">02</span><span class="slash" aria-hidden="true">/</span>Concept Lab</p><h2 id="try-h" class="h2" data-split>Try the <em>Concept Lab.</em></h2></div>
      <div data-reveal><p class="lead">Pick your trade, a mood and the features you need, and watch a homepage sketch itself. Then send it to us as the start of your free concept.</p><a class="btn btn-gold" href="lab">Open the Concept Lab</a></div>
    </div>
  </section>
  {cta_final('Want one like <em>this?</em>', 'We design your homepage concept for free, so you can see it first.', secondary=('pricing', 'See pricing'))}
</main>''')

# ================================================================= Credits
P = ''
_NEW_CREDIT = ', '.join(f'<a class="link" href="{v["credit"][1]}" rel="noopener">{v["credit"][0]}</a> ({k.capitalize().replace("Cafes", "Cafés")})' for k, v in NEW_PHOTOS.items())
CREDIT_ROWS = [
    ('Trade chapter photos (home page)', 'All five are from Unsplash, under the Unsplash License. '
     + (f'Photographers: {_NEW_CREDIT}.' if NEW_PHOTOS else '')
     + ('' if 'barbers' in NEW_PHOTOS else ' The Barbers photo comes from the barber concept site; its photographer was not recorded when it was first collected and will be added here when found.')),
    ('Hero imagery', 'Hero imagery: digital render made for Black Crest Web Designs. The card and the KB Ventures plaque are renders of the brand marks, not photographs of real objects.'),
    ('Concept site screenshots and the showreel', 'Captured by Black Crest from our own six concept sites.'),
    ('The 3D card, the concept collection and their stills', 'Made by Black Crest with Three.js: the card from the Black Crest hallmark, the stone and brushed metal drawn in code, and the phones showing screenshots of our own concepts.'),
    ('Typefaces', 'Cormorant Garamond, under the SIL Open Font License, and Switzer by the Indian Type Foundry, under the ITF Free Font License (Fontshare). Both are served from this site.'),
    ('Code libraries', 'GSAP 3.14.2 (ScrollTrigger, SplitText, Flip) under the GSAP standard licence, Lenis 1.3.27 (MIT) and Three.js 0.170.0 (MIT), all served from this site.'),
]
page('credits.html', 'Credits: Black Crest Web Designs', 'Where the photos, data, typefaces and code libraries on the Black Crest Web Designs site come from.', f'''<main id="main">
  <div class="container page-head">
    <p class="label"><span class="idx">01</span><span class="slash" aria-hidden="true">/</span>Credits</p>
    <h1 class="h1" data-split>Credit where <em>it’s due.</em></h1>
    <p class="lead" data-reveal>Where everything on this site comes from. If something of yours is here without the right credit, email <a class="link" data-email href="mailto:{EMAIL}">{EMAIL}</a> and we will fix it.</p>
  </div>
  <section class="section-tight" aria-label="Credits">
    <div class="container"><ol class="standard-list">{''.join(f'<li data-reveal><span class="n" aria-hidden="true">{i + 1:02d}</span><div><h2 class="h3">{t}</h2><p>{x}</p></div></li>' for i, (t, x) in enumerate(CREDIT_ROWS))}</ol></div>
  </section>
</main>''')

# ================================================================= Pricing
P = ''
INCLUDED = ['Writing help', 'Mobile design', 'Contact form', 'Google Map of your location', 'Google basics (SEO setup)', 'Speed', 'Secure HTTPS', 'Handover of your site and logins', '2 rounds of changes']
inc_rows = ''.join(f'<tr><th scope="row">{x}</th><td class="yes" data-label="One Page">Included</td><td class="yes" data-label="Full Website">Included</td></tr>' for x in INCLUDED)
addon_rows = ''.join(f'''<li><span><b>{a['name']}</b><span class="tiny">{a['note']}</span></span><span class="amt"><small>from</small><span data-price="{a['id']}">{money(a['from'])}</span>{' <small>each</small>' if a.get('perUnit') else ''}</span></li>''' for a in ADDONS)
CMP = [
    ('Cost', 'A monthly subscription, plus your time', 'Often $3,000 or more*', f'One Page {money(ONE)}, Full Website {money(FULL)}'),
    ('Time', 'Your own evenings and weekends', 'Often several weeks or longer', 'Free concept first, then usually 1 to 2 weeks'),
    ('Effort', 'You do the design, writing and setup yourself', 'Briefs, meetings and sign-offs', 'A short chat and your details. We write, design and build'),
    ('Ownership', 'Your site lives on their platform. Leaving usually means rebuilding', 'Depends on the contract. Check who owns the files', 'You own the finished site and your domain'),
]
cmp_rows = ''.join(f'<tr><th scope="row">{r}</th><td data-label="DIY builder">{a}</td><td data-label="Typical agency">{b}</td><td class="col-us" data-label="Black Crest">{c}</td></tr>' for r, a, b, c in CMP)
calc_addons = ''.join(f'''<label class="opt" for="add-{a['id']}"><input type="checkbox" id="add-{a['id']}" value="{a['id']}"><span class="opt-text"><b>{a['name']}</b><span class="tiny">{a['note']}</span></span>{f'<select class="qty" data-for="{a["id"]}" id="qty-{a["id"]}" aria-label="How many extra pages">' + ''.join(f'<option value="{n}">{n}</option>' for n in range(1, 6)) + '</select>' if a.get('perUnit') else ''}<span class="amt">from <span data-price="{a['id']}">{money(a['from'])}</span></span></label>''' for a in ADDONS)
PRICE_LD = {'@context': 'https://schema.org', '@type': 'OfferCatalog', 'name': 'Black Crest Web Designs pricing', 'url': SITE + 'pricing',
            'itemListElement': ORG['makesOffer'] + [{'@type': 'Offer', 'name': a['name'], 'priceCurrency': CONFIG['currency'],
                                                     'priceSpecification': {'@type': 'PriceSpecification', 'minPrice': f"{a['from']:.2f}", 'priceCurrency': CONFIG['currency']}} for a in ADDONS]}
page('pricing.html', 'Pricing: Black Crest Web Designs', f'One Page website {money(ONE)}. Full Website (up to about 5 pages) {money(FULL)}. Optional care plan {money(CARE)} a month. No hidden costs, and a price calculator.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">Pricing</p>
    <h1 class="h1" data-split>Clear prices. <em>No hidden costs.</em></h1>
    <p class="lead" data-reveal>Every price is set before we start, your concept homepage is free, and everything is in Australian dollars.</p>
  </div>
  <section class="container has-grid" aria-label="Packages">
    {statement(P, level='h2')}
  </section>

  <section class="section" aria-labelledby="inc-h">
    <div class="container">
      <div class="grid grid-2" style="gap:48px;align-items:start">
        {head_block("What's included", '<span id="inc-h">Everything listed <em>is included.</em></span>', 'No hidden extras. All of this comes with both the One Page and the Full Website.')}
        <div class="table-wrap" data-reveal><table class="stack-table"><caption>Included in each package</caption>
          <thead><tr><th scope="col">Item</th><th scope="col">One Page</th><th scope="col">Full Website</th></tr></thead>
          <tbody>{inc_rows}</tbody></table></div>
      </div>
    </div>
  </section>

  <section class="section band band-gold" aria-labelledby="promise-h">
    <div class="container">
      <div class="grid grid-2" style="gap:48px;align-items:start">
        <div><p class="label" data-reveal>Our promise</p><h2 id="promise-h" class="h2" data-split>No hidden <em>costs.</em></h2><p class="lead" data-reveal style="margin-top:24px">The price we quote is the price you pay.</p></div>
        <ol class="numbered" data-reveal style="align-self:end">
          <li>You pay for your own domain name (your web address, like yourbusiness.com.au), about $20 a year. It is registered in your name, so it is always yours.</li>
          <li>Hosting setup is included. If anything about hosting would cost you extra, we tell you before you say yes.</li>
          <li>Add-ons are optional, and their price is confirmed before any work begins.</li>
          <li>Changes beyond the 2 included rounds are quoted fairly first. Nothing lands on your bill without your OK.</li>
        </ol>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="addons-h">
    <div class="container">
      <div class="grid grid-2" style="gap:48px;align-items:start">
        {head_block('Add-ons', '<span id="addons-h">Add what <em>you need.</em></span>', 'Optional extras, priced from these amounts. We confirm the exact price with you first.')}
        <ul class="addon-list" data-reveal>{addon_rows}</ul>
      </div>
    </div>
  </section>

  <section class="section band" aria-labelledby="cmp-h">
    <div class="container">
      {head_block('Compare', '<span id="cmp-h">Your options, <em>side by side.</em></span>', 'Laid out like a statement: what each route costs you in money, time, effort and ownership.', split=True)}
      <div class="statement" data-reveal>
        <div class="statement-head"><span>Statement &middot; <b>Website options</b></span><span>Melbourne &middot; AUD</span></div>
        <div class="table-wrap"><table class="stack-table">
          <caption class="sr-only">A DIY builder, a typical Melbourne agency and Black Crest</caption>
          <thead><tr><th scope="col"><span class="sr-only">Compared on</span></th><th scope="col">DIY builder (Wix or Squarespace)</th><th scope="col">Typical Melbourne agency</th><th scope="col" class="col-us">Black Crest</th></tr></thead>
          <tbody>{cmp_rows}</tbody></table></div>
        <div class="statement-foot"><span>*Typical market range; prices vary.</span><span>Black Crest prices are fixed before work begins.</span></div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="calc-h">
    <div class="container">
      {head_block('Price calculator', '<span id="calc-h">Build your <em>quote.</em></span>', 'Tick what you want and watch the total. Send it to us and we confirm it by email.', split=True)}
      <form class="calc" id="calc" onsubmit="return false">
        <div data-reveal>
          <fieldset><legend>Package</legend>
            <label class="opt" for="pkg-one"><input type="radio" name="pkg" id="pkg-one" value="onePage" checked><span class="opt-text"><b>One Page</b><span class="tiny">One polished page</span></span><span class="amt" data-price="onePage">{money(ONE)}</span></label>
            <label class="opt" for="pkg-full"><input type="radio" name="pkg" id="pkg-full" value="fullSite"><span class="opt-text"><b>Full Website</b><span class="tiny">Up to about 5 pages</span></span><span class="amt" data-price="fullSite">{money(FULL)}</span></label>
          </fieldset>
          <fieldset><legend>Add-ons</legend>{calc_addons}</fieldset>
          <fieldset><legend>After launch</legend>
            <label class="opt" for="add-care"><input type="checkbox" id="add-care" value="care"><span class="opt-text"><b>Care plan</b><span class="tiny">Optional, cancel any time</span></span><span class="amt"><span data-price="carePlan">{money(CARE)}</span> a month</span></label>
          </fieldset>
        </div>
        <div class="tile calc-total" data-reveal>
          <div class="calc-head">
            <div><p class="tile-label" style="margin:0 0 6px"><span>Estimated total</span></p><p class="tiny" style="margin:0">One-off, in AUD</p></div>
            <div class="ring" aria-hidden="true"><svg viewBox="0 0 40 40"><circle class="track" cx="20" cy="20" r="17"/><circle class="fill" cx="20" cy="20" r="17" pathLength="1"/></svg><span><b>0</b>extras</span></div>
          </div>
          <p class="calc-count tiny" id="calc-count" aria-live="polite">No extras</p>
          <div hidden>
          </div>
          <p class="balance" aria-live="polite"><span class="from">from</span> <span id="calc-total">{money(ONE)}</span></p>
          <p class="muted small" id="calc-month" hidden>plus the care plan, <span data-price="carePlan">{money(CARE)}</span> a month</p>
          <ul id="calc-lines"><li>One Page: {money(ONE)}</li></ul>
          <button class="btn btn-gold" type="button" id="calc-send">Send me this quote</button>
          <p class="tiny" style="margin:12px 0 0">Opens the contact form with your choices filled in. Nothing is sent until you press Send there.</p>
        </div>
      </form>
    </div>
  </section>

  {cta_final('Start with a <em>free</em> concept.', 'See your new homepage first. Decide after.', secondary=('process', 'How it works'))}
</main>''', ld=[PRICE_LD])

# ================================================================= Process
P = ''
page('process.html', 'Process: how Black Crest Web Designs works', 'Four steps: chat, free concept homepage, build and launch. Free concept first, 50% deposit to start, balance at launch, 2 rounds of changes included.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">Process</p>
    <h1 class="h1" data-split>Four steps. <em>No surprises.</em></h1>
    <p class="lead" data-reveal>From the first message to your site going live: what happens, who does what, and how long each step usually takes.</p>
  </div>
  <section class="section-tight has-grid" aria-labelledby="steps-h">
    <div class="container process-split">
      <div class="process-head"><p class="label" data-reveal><span class="idx">02</span><span class="slash" aria-hidden="true">/</span>Step by step</p><h2 id="steps-h" class="h2" data-split>From hello <em>to live.</em></h2><p class="lead" data-reveal>Each step has a usual timeframe. If anything will take longer, we tell you before it does.</p></div>
      {stack_cards()}
    </div>
  </section>
  <section class="section band band-gold" aria-labelledby="promise-h">
    <div class="container">
      <div class="grid grid-2" style="gap:48px;align-items:end">
        <div><p class="label" data-reveal><span class="idx">03</span><span class="slash" aria-hidden="true">/</span>Paying</p><h2 id="promise-h" class="h2" data-split>How paying <em>works.</em></h2></div>
        <div data-reveal>
          <ul class="ticks">
            <li><strong>Free concept first.</strong> You see your homepage before you pay anything.</li>
            <li><strong>50% deposit to start the build.</strong> Only once you choose to go ahead.</li>
            <li><strong>Balance at launch.</strong> When your site is ready to go live.</li>
            <li><strong>2 rounds of changes included.</strong> Extra changes are quoted fairly, before we do them.</li>
          </ul>
          <p class="muted small" style="margin-top:20px">We email an invoice with the payment details. We never take payments on this website.</p>
        </div>
      </div>
    </div>
  </section>
  {cta_final('Ready for <em>step one?</em>', 'Send a short message. We reply within 1 business day.', secondary=('start', 'Start your project'))}
</main>''')

# ================================================================= Free concept (landing page for DMs: no site menu)
P = ''
page('free-concept.html', 'Get a free website concept: Black Crest Web Designs', 'We design your new homepage for free. No deposit, no obligation. Reply within 1 business day.', f'''<main id="main" class="landing">
  <div class="container">
    <div class="landing-head">{brand(P)}</div>
    <h1>See it <em>before you pay.</em></h1>
    <ul class="ticks">
      <li>We design your homepage for free.</li>
      <li>No deposit and no obligation.</li>
      <li>We reply within 1 business day.</li>
    </ul>
    <div class="tile">
      {form_open('free-concept', 'Black Crest: free concept request', P)}
        {field('business', 'Business name', required=True, auto='organization', empty='Please tell us your business name.')}
        {field('trade', 'What you do', required=True, placeholder='For example: barbershop in Brunswick', empty='Please tell us what your business does.')}
        {field('contact', 'Email or phone', required=True, auto='email', contact=True, empty='Please add an email address or phone number so we can reply.')}
        {need_fields('fc')}
        {form_close('Get my free concept', P)}
    </div>
    <p class="back"><a class="link" href="/">Visit the main Black Crest site {icon('arrow')}</a></p>
  </div>
</main>''', noindex=True, bare=True)

# ================================================================= Start your project
P = ''
page('start.html', 'Start your project: Black Crest Web Designs', 'Tell us about your business so we can design your free concept homepage: your trade, suburb, hours, services, colours and links.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="label">Start your project</p>
    <h1 class="h1" data-split>Tell us about <em>your business.</em></h1>
    <p class="lead" data-reveal>The more you share, the closer your free concept will be. Only the first four boxes are needed. We reply within 1 business day.</p>
  </div>
  <section class="container narrow" aria-label="Project details" style="padding-bottom:120px">
    <div class="tile" data-reveal>
      {form_open('start', 'Black Crest: new project details (start form)', P)}
        <div class="form-row">
          {field('business', 'Business name', required=True, auto='organization', empty='Please tell us your business name.')}
          {field('trade', 'Trade or type of business', required=True, placeholder='For example: cafe', empty='Please tell us what kind of business it is.')}
        </div>
        <div class="form-row">
          {field('suburb', 'Suburb', required=True, auto='address-level2', empty='Please tell us your suburb.')}
          {field('email', 'Email', 'email', required=True, auto='email', empty='Please enter your email address.')}
        </div>
        {field('phone', 'Phone', 'tel', auto='tel')}
        {field('hours', 'Opening hours', textarea=True, placeholder='For example: Mon to Fri 7am to 3pm, Sat 8am to 1pm')}
        {field('services', 'Services and prices', textarea=True, hint='List what you offer. Prices help if you have them.')}
        <div class="form-row">
          {field('colours', 'Preferred colours')}
          {field('domain', 'Domain name, if you have one', placeholder='yourbusiness.com.au')}
        </div>
        {field('socials', 'Links to your social pages', textarea=True, hint='Instagram, Facebook, Google listing, or an old website.')}
        {field('photos', 'Photos you have', textarea=True, hint='Describe them: for example, shopfront, team, 20 photos of our work. We will ask you to send them later.')}
        {need_fields('start')}
        {field('message', 'Anything else', textarea=True)}
        {form_close('Send my details', P)}
    </div>
  </section>
</main>''')

# ================================================================= Care plan
P = ''
COVER = [
    ('Hosting upkeep', 'We keep your site online and keep its hosting settings and HTTPS certificate up to date.'),
    ('Small changes', 'Up to 3 small text or photo changes a month, like new prices, new hours or swapping a photo.'),
    ('Security checks', 'We check your site and its settings each month and fix anything that needs it.'),
    ('Backups', 'We keep a copy of your site, so it can be put back quickly if anything goes wrong.'),
    ('Priority replies', 'Care plan requests go to the front of the queue.'),
]
NOT_COVER = ['New pages or new sections (we quote these first)', 'Redesigns or a new look', 'Writing large amounts of new content from scratch', 'Your domain name renewal, which you pay directly (about $20 a year)', 'Other services you sign up to, like booking apps or email accounts', 'Unused changes do not roll over to the next month']
page('care-plan.html', f'Care plan, {money(CARE)} a month: Black Crest Web Designs', f'Our optional care plan is {money(CARE)} a month: hosting upkeep, small text and photo changes, security checks, backups and priority replies. Cancel any time.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">Care plan</p>
    <h1 class="h1" data-split>Looked after, <em>every month.</em></h1>
    <p class="lead" data-reveal>Optional, month to month, cancel any time.</p>
  </div>
  <section class="container" aria-labelledby="cover-h">
    <div class="grid grid-2">
      <div class="tile" data-reveal>
        <p class="tile-label"><span>Care plan</span><span class="chip">Optional</span></p>
        <p class="balance"><span data-price="carePlan" data-count="{CARE}">{money(CARE)}</span> <span class="per">a month</span></p>
        <h2 id="cover-h" class="sr-only">What it covers</h2>
        <ul class="ticks" style="margin-top:22px">{''.join(f'<li><strong>{t}.</strong> {x}</li>' for t, x in COVER)}</ul>
        <a class="btn btn-gold" style="margin-top:24px" href="contact?need=care-plan">Get the care plan</a>
      </div>
      <div class="tile" data-reveal>
        <h2 class="h3">What it does not cover</h2>
        <ul style="margin-top:18px;color:var(--silver-2)">{''.join(f'<li>{x}</li>' for x in NOT_COVER)}</ul>
        <p class="muted small" style="margin-top:18px">Not on the care plan? You can still ask for changes any time. We quote them fairly first.</p>
      </div>
    </div>
  </section>
  <section class="section" aria-labelledby="req-h">
    <div class="container narrow">
      {head_block('Request a change', '<span id="req-h">Need something <em>updated?</em></span>', 'Tell us what to change. We confirm by email before we do it.')}
      <div class="tile" data-reveal>
        {form_open('care-change', 'Black Crest: care plan change request', P)}
          <div class="form-row">
            {field('name', 'Your name', required=True, auto='name', empty='Please enter your name.')}
            {field('email', 'Email', 'email', required=True, auto='email', empty='Please enter your email address.')}
          </div>
          {field('website', 'Your website address', placeholder='yourbusiness.com.au')}
          {field('message', 'What would you like changed?', required=True, textarea=True, empty='Please tell us what to change.')}
          {form_close('Send change request', P)}
      </div>
    </div>
  </section>
</main>''')

# ================================================================= Trade pages
TRADE_PAGES = {
    'for-barbers.html': ('barber', 'barber', 'Barbers', 'Websites for <em>barbers.</em>', 'A sharp site that turns a quick search into a booked chair.', [
        ('People decide on their phone', 'Most people choose a barber on their phone, often minutes before they want a cut. Clear prices and a booking button make the choice easy.'),
        ('Instagram is not enough', 'Your feed shows your work, but not your prices, hours or where to park. A website puts all of it in one place.'),
        ('Fewer calls mid-cut', 'A booking link on your own site means fewer calls and DMs while you are with a client.')],
        ['Booking button for the app you already use', 'Price list for every cut and shave', 'Gallery of your cuts', 'Opening hours, address and a map', 'One-tap call and directions']),
    'for-cafes.html': ('cafe', 'cafe', 'Cafes', 'Websites for <em>cafes.</em>', 'Your menu, hours and location: easy to find, quick to load.', [
        ('People check before they come', 'Before a visit, people look up your hours and menu. If they cannot find them, they often go somewhere else.'),
        ('A menu that stays current', 'A menu on your own site is easy to update and easy to read on a phone. No blurry photo of a board.'),
        ('Works with Google', 'Your website and your free Google Business Profile work together, so the right details show in Search and Maps.')],
        ['Menu that is easy to update', 'Opening hours, including public holidays', 'Map and directions', 'Link to online ordering, if you use it', 'Photos of your food and space']),
    'for-gyms.html': ('gym', 'gym', 'Gyms', 'Websites for <em>gyms.</em>', 'Timetables, memberships and an easy way to try a class.', [
        ('Answer the first questions', 'New members want the classes, the times and the cost. A good site answers all three before they ask.'),
        ('Make trying easy', 'A simple free-trial or visit form turns interest into a first session.'),
        ('Show the space', 'Photos of your floor, equipment and coaches help people picture themselves training with you.')],
        ['Class timetable', 'Membership options and prices', 'Free-trial or visit form', 'Coach profiles', 'Location, parking and hours']),
    'for-tradies.html': ('tradie', 'plumber', 'Tradies', 'Websites for <em>tradies.</em>', 'Get the call, win the quote, look like the professional you are.', [
        ('Customers check you first', 'Before they call, most people look you up. A clean site with your services and areas builds trust fast.'),
        ('Make calling easy', 'A big call button and a short quote form mean more enquiries from people on the move.'),
        ('Show where you work', 'Listing the suburbs you cover brings the right customers and saves you calls from outside your area.')],
        ['Quote request form', 'One-tap call button', 'Services and the suburbs you cover', 'Gallery of your jobs', 'Licence and insurance details']),
    'for-salons.html': ('salon', 'salon', 'Salons', 'Websites for <em>salons.</em>', 'A calm, beautiful site with your services, prices and bookings.', [
        ('Clients want to see prices', 'A clear service menu with prices helps clients choose and cuts down on questions.'),
        ('Booking at any hour', 'A booking button linked to your booking app lets clients book at night, while you are closed.'),
        ('Your work sells itself', 'A gallery of your work and your stylists shows clients what to expect before they walk in.')],
        ['Service menu with prices', 'Booking button for your booking app', 'Gallery of your work', 'Stylist profiles', 'Gift vouchers, if you sell them']),
}
for path, (art, slug, trade, h1, lead, reasons, feats) in TRADE_PAGES.items():
    P = ''
    d = DEMO[slug]
    rs = ''.join(f'<li data-reveal><span class="n">0{i + 1}</span><h3>{t}</h3><p>{x}</p></li>' for i, (t, x) in enumerate(reasons))
    plain = re.sub(r'<[^>]+>', '', h1).rstrip('.')
    page(path, f'{plain} in Melbourne: Black Crest Web Designs', f'{lead} Websites for {trade.lower()} in Melbourne and its suburbs. One Page {money(ONE)}, Full Website {money(FULL)}, free concept first.', f'''<main id="main">
  <div class="container page-head">
    <div class="trade-hero">
      <div>
        <p class="label">For {trade.lower()}</p>
        <h1 class="h1" data-split>{h1}</h1>
        <p class="lead" data-reveal>{lead} We work with {trade.lower()} across Melbourne and its suburbs.</p>
        <div class="btn-row" data-reveal style="margin-top:32px"><a class="btn btn-gold" href="free-concept">Get a free concept</a><a class="btn btn-ghost" href="pricing">See pricing</a></div>
      </div>
      <div class="illo-wrap" data-reveal>{illo(art)}</div>
    </div>
  </div>
  <section class="section band" aria-labelledby="why-h">
    <div class="container">
      {head_block('Why it matters', f'<span id="why-h">Why {trade.lower()} need <em>a good site.</em></span>', split=True)}
      <ol class="reason-list">{rs}</ol>
    </div>
  </section>
  <section class="section" aria-labelledby="feat-h">
    <div class="container showcase">
      <div>
        <p class="label" data-reveal>What you usually need</p>
        <h2 id="feat-h" class="h2" data-split>The features <em>that matter.</em></h2>
        <ul class="ticks" data-reveal style="margin:30px 0">{''.join(f'<li>{x}</li>' for x in feats)}</ul>
        <p class="muted" data-reveal>Every site also comes with writing help, a contact form, Google basics and HTTPS.</p>
        <p data-reveal><span class="chip">Concept site: {d[2]}</span></p>
        <div data-reveal>{open_demo(d, P)}</div>
      </div>
      <div data-reveal>{duo(slug, P, '0.06')}</div>
    </div>
  </section>
  {cta_final('See your site <em>before</em> you pay.', 'We design a free concept homepage for your business. No deposit, no obligation.', secondary=('work', 'See all concept sites'))}
</main>''')

# ================================================================= FAQ
P = ''
page('faq.html', 'FAQ: Black Crest Web Designs', 'Answers about cost, timing, who owns the site, changes, domain and hosting, deposits, the free concept and the care plan.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">FAQ</p>
    <h1 class="h1" data-split>Straight <em>answers.</em></h1>
    <p class="lead" data-reveal>Cost, timing, ownership and how we work. Something else? <a class="inline-link" href="contact">Ask us</a>.</p>
  </div>
  <section class="container faq-split" aria-label="Questions" style="padding-bottom:40px">
    <div class="section-head"><p class="label" data-reveal>{len(FAQS)} questions</p><p class="lead" data-reveal>Tap a question to open it. Every answer uses the same prices and promises as the rest of the site.</p></div>
    <div data-reveal>{faq_list(FAQS, P)}</div>
  </section>
  {cta_final('Still <em>deciding?</em>', 'A free concept is the easiest way to see if we are the right fit.', secondary=('contact', 'Ask a question'))}
</main>''', ld=[faq_ld()])

# ================================================================= About
P = ''
page('about.html', 'About: Black Crest Web Designs', 'Black Crest Web Designs makes premium websites for local businesses in Melbourne. Plain English, clear prices, and you own your site. A KB Ventures company.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">About</p>
    <h1 class="h1" data-split>Studio quality. <em>Local prices.</em></h1>
    <p class="lead" data-reveal>Black Crest Web Designs makes fast, good-looking websites for the local businesses that keep a suburb going: barbers, cafes, gyms, salons and tradies.</p>
  </div>
  <section class="section band" aria-labelledby="stand-h">
    <div class="container">
      {head_block('What we stand for', '<span id="stand-h">Three things we <em>never trade away.</em></span>', split=True)}
      <ol class="reason-list">
        <li data-reveal><span class="n">01</span><h3>Plain English</h3><p>No jargon and no hard sell. You always know what you are paying for and why.</p></li>
        <li data-reveal><span class="n">02</span><h3>Well made</h3><p>Fast, secure, easy to use on a phone, and built to last. We sweat the details so your customers never notice them.</p></li>
        <li data-reveal><span class="n">03</span><h3>Yours</h3><p>You own the finished site and your domain. No lock-in contracts, ever.</p></li>
      </ol>
    </div>
  </section>
  <section class="section" aria-labelledby="how-h">
    <div class="container showcase">
      <div>{head_block('How we work', '<span id="how-h">See it first. <em>Decide after.</em></span>', 'We design your homepage for free before you pay anything. If you like it, a 50% deposit starts the build and the balance is due at launch. Two rounds of changes are included.')}
        <a class="link" data-reveal href="process">The full process {icon('arrow')}</a></div>
      <div class="illo-wrap" data-reveal>{illo('concept')}</div>
    </div>
  </section>
  <section class="section band band-gold" aria-labelledby="prom-h">
    <div class="container">
      <div class="grid grid-2" style="gap:48px;align-items:end">
        <div><p class="label" data-reveal>Our promises</p><h2 id="prom-h" class="h2" data-split>What you can <em>hold us to.</em></h2></div>
        <ul class="ticks" data-reveal>
          <li>A free concept homepage before you pay anything.</li>
          <li>Clear prices, set before we start. No hidden costs.</li>
          <li>A reply within 1 business day.</li>
          <li>No lock-in contracts.</li>
          <li>You own your site and your domain.</li>
          <li>No fake reviews or made-up numbers. We show concept sites, and we will earn real reviews.</li>
        </ul>
      </div>
    </div>
  </section>
  <section class="section" aria-labelledby="kb-h">
    <div class="container narrow">
      <div class="tile kb-tile" data-reveal>
        <div class="kb-tile-copy">
          <p class="label">A KB Ventures company</p>
          <h2 id="kb-h" class="h3">Part of something bigger.</h2>
          <p class="muted" style="margin-top:14px">Black Crest Web Designs is a brand of KB Ventures, a Melbourne company that starts and runs small businesses to one standard: clear, fair and well made.</p>
          <a class="link" href="{KB_SITE}">Visit KB Ventures {icon('arrow')}</a>
        </div>
        <div class="kb-tile-mark">{pic('assets/renders/kb-plaque-small', 640, 560, 'Digital render of the KB Ventures plaque: champagne-gold KB engraved in smoked glass, in a brushed platinum frame', P, sizes='(min-width: 720px) 280px, 80vw')}</div>
      </div>
    </div>
  </section>
</main>''', ld=[ORG])

# ================================================================= Quiz
P = ''
QUIZ = [
    ('Do you have your own website, not just social media pages?', 'Get your own website. Social pages are useful, but you do not control them, and they rarely show prices or hours clearly.'),
    ('Does your website load in a few seconds on your phone?', 'Make it faster. Smaller images and a lighter site fix most slow pages, and people leave slow pages quickly.'),
    ('Can someone call, book or get directions with one tap from your homepage?', 'Add one-tap buttons to call, book and get directions near the top of your homepage.'),
    ('Are your prices, or a price guide, on your website?', 'Show your prices, or at least a guide. It answers the first question most people have.'),
    ('Are your opening hours and address correct everywhere online, including Google?', 'Check your hours and address on your site and your Google Business Profile, including public holidays.'),
    ('Does your website show recent photos of your work, shop or team?', 'Add recent, real photos. They build trust faster than stock images.'),
]
qs = ''.join(f'''<fieldset data-tip="{E(tip)}"><legend><span>Question {i + 1} of {len(QUIZ)}</span>{q}</legend>
          <div class="yn"><label class="choice"><input type="radio" name="q{i}" value="good"> Yes</label><label class="choice"><input type="radio" name="q{i}" value="bad"> No</label></div></fieldset>''' for i, (q, tip) in enumerate(QUIZ))
page('quiz.html', 'Is your website costing you customers? A 1-minute quiz', 'Six quick yes or no questions to check if your website is costing you customers, with simple advice. Nothing is stored or sent.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="label">Website quiz</p>
    <h1 class="h1" data-split>Is your website <em>costing you customers?</em></h1>
    <p class="lead" data-reveal>Six quick yes or no questions. Your answers stay on this page: nothing is stored or sent.</p>
  </div>
  <section class="container narrow" aria-label="Quiz" style="padding-bottom:120px">
    <form class="quiz" data-reveal id="quiz" novalidate>
      {qs}
      <p class="field-error" id="quiz-error" role="alert" hidden></p>
      <button class="btn btn-gold" type="submit">See my score</button>
    </form>
    <div class="tile quiz-result" id="quiz-result" tabindex="-1" hidden style="margin-top:28px" aria-live="polite">
      <p class="tile-label"><span>Your score</span><span class="chip">Result</span></p>
      <p class="balance" id="quiz-score">0 out of 6</p>
      <p data-band="high">Your website is doing its job. A few small tweaks could still help.</p>
      <p data-band="mid">Your website is probably costing you some customers. The fixes below are usually quick.</p>
      <p data-band="low">Your website is likely costing you customers. The good news: all of this can be fixed.</p>
      <ul class="ticks" id="quiz-tips" style="margin:18px 0 24px"></ul>
      <p class="muted">Want a second opinion? We will look at your site and email you a free mini review.</p>
      <a class="btn btn-gold" id="quiz-review" href="contact#review">Get a free mini review</a>
    </div>
  </section>
</main>''')

# ================================================================= Guides
GUIDE_H1 = {  # headlines stay at 2 to 6 words; the full title is still the page title
    'Why your cafe needs a Google Business Profile': 'Why cafés need <em>a Google profile</em>',
    'How much should a small business website cost?': 'What a small business <em>site costs</em>',
    '5 things every barber website needs': '5 things every <em>barber site</em> needs',
}
GUIDES = [
    ('barber-website-checklist', '5 things every barber website needs', 'Five simple things that turn a barber website into booked chairs: booking, prices, real photos, hours and speed.', '''
      <p>A barber website has one job: help someone who wants a cut today pick you and book. Most people find a barber on their phone, so every one of these is about making that quick.</p>
      <h2>1. A booking button you cannot miss</h2>
      <p>Put a <strong>Book now</strong> button at the top of every page, linking to the booking app you already use. On a phone, keep it within easy reach of the thumb. If you take walk-ins, say so clearly too.</p>
      <h2>2. Prices, clearly</h2>
      <p>List your cuts, fades, beard trims and shaves with prices, even if some are "from" prices. People compare barbers on price and style. If they have to message you to ask, many will not.</p>
      <h2>3. Photos of real cuts</h2>
      <p>Show your own recent work: fades, tapers, beard shapes. Real photos of your chairs, your team and your shopfront build more trust than stock images. Link your Instagram, but keep the best photos on your site too.</p>
      <h2>4. Hours, address and parking</h2>
      <p>Make your opening hours, address, a map and parking tips easy to find. Keep them the same as your Google Business Profile, and update both for public holidays.</p>
      <h2>5. Fast on a phone</h2>
      <p>If your site takes too long to load, people go back and tap the next barber. Keep images compressed, avoid heavy page builders, and test your site on your own phone using mobile data, not just Wi-Fi.</p>
      <h2>A quick checklist</h2>
      <ul><li>Book now button near the top</li><li>Prices for every service</li><li>Recent photos of your work</li><li>Hours, address, map and parking</li><li>Loads quickly on mobile data</li></ul>'''),
    ('cafe-google-business-profile', 'Why your cafe needs a Google Business Profile', 'What a Google Business Profile is, why it matters for cafes, and how to set one up and keep it useful.', '''
      <p>When someone searches for a cafe near them, Google often shows a map with a short list of places before any websites. Those listings come from <strong>Google Business Profiles</strong>. If your cafe does not have one, or it is out of date, you may be missing people who are already looking for coffee nearby.</p>
      <h2>What it is</h2>
      <p>A Google Business Profile is a free listing for your business that can appear in Google Search and Google Maps. It can show your name, address, opening hours, phone number, website, photos, a link to your menu, and reviews from customers.</p>
      <h2>Why it matters for a cafe</h2>
      <ul><li><strong>People check hours before they leave.</strong> Wrong hours on Google means people turn up to a closed door, or do not come at all.</li><li><strong>Directions in one tap.</strong> Your listing links straight to directions in Maps.</li><li><strong>Photos sell coffee.</strong> Good photos of your food, drinks and space help people choose.</li><li><strong>Reviews in one place.</strong> You can read and reply to reviews from your listing.</li></ul>
      <h2>How to set one up</h2>
      <p>Go to Google Business Profile (business.google.com) and sign in with a Google account. Search for your cafe: if a listing already exists, you can claim it. Add your details, then verify that you own the business. Google offers different ways to verify, depending on the business, so follow the steps it shows you.</p>
      <h2>Keep it useful</h2>
      <ul><li>Set <strong>special hours</strong> for public holidays and closures.</li><li>Add a link to your menu on your own website.</li><li>Upload new photos every few months.</li><li>Reply to reviews politely, good and bad.</li><li>Make sure your name, address and phone number match your website exactly.</li></ul>
      <h2>Your website and your profile work together</h2>
      <p>Your profile gets you seen. Your website answers the next questions: the full menu, what makes you different, and how to order or book. Link them to each other, and keep the details the same in both places.</p>'''),
    ('small-business-website-cost', 'How much should a small business website cost?', 'An honest look at what a small business website costs in Australia: DIY builders, freelancers and agencies, what changes the price, and the ongoing costs.', '''
      <p>The honest answer: it depends on what you need. A one-page site for a local barber is a very different job to an online shop with hundreds of products. Here is how the main options compare, and what to ask before you pay anyone.</p>
      <h2>Your three main options</h2>
      <h3>Do it yourself with a website builder</h3>
      <p>Builders like Wix and Squarespace charge a monthly subscription. The real cost is your time: you do the design, the writing and the setup. Your site also lives on their platform, so leaving usually means rebuilding.</p>
      <h3>A freelancer or small studio</h3>
      <p>Prices vary widely, from a few hundred dollars to several thousand. Ask exactly what is included, how many changes you get, and who owns the site at the end.</p>
      <h3>An agency</h3>
      <p>Agencies often charge $3,000 or more for a small business site. This is a typical market range and prices vary. You usually get a team, a longer process and more meetings.</p>
      <h2>What changes the price</h2>
      <ul><li><strong>Number of pages.</strong> One page costs less than ten.</li><li><strong>Features.</strong> Booking, online ordering or a shop add work.</li><li><strong>Writing and photos.</strong> Someone has to write the words and supply good images.</li><li><strong>Changes.</strong> More rounds of changes means more time.</li></ul>
      <h2>Ongoing costs</h2>
      <ul><li><strong>Domain name:</strong> about $20 a year for most addresses. It should be registered in your name.</li><li><strong>Hosting:</strong> anything from free to a monthly fee, depending on the site and the host.</li><li><strong>Updates:</strong> either your own time, or a care plan with whoever built the site.</li></ul>
      <h2>Questions to ask before you pay</h2>
      <ul><li>Who owns the finished site and the domain?</li><li>What exactly is included, and what costs extra?</li><li>How many rounds of changes do I get?</li><li>Are there ongoing fees, and can I cancel?</li><li>Can I see the design before I pay?</li></ul>
      <h2>Where Black Crest sits</h2>
      <p>Our One Page sites are {ONE_P}, a Full Website (up to about 5 pages) is {FULL_P}, and the care plan is optional at {CARE_P} a month. You see a free concept homepage before you pay anything, and you own the finished site. See our <a href="../pricing">pricing</a> for the details.</p>'''),
]
for slug, title, desc, body in GUIDES:
    P = '../'
    body = body.replace('{ONE_P}', money(ONE)).replace('{FULL_P}', money(FULL)).replace('{CARE_P}', money(CARE))
    art = {'@context': 'https://schema.org', '@type': 'Article', 'headline': title, 'description': desc, 'url': SITE + 'guides/' + slug, 'image': SITE + 'img/og.jpg',
           'publisher': {'@id': SITE + '#business', '@type': 'ProfessionalService', 'name': 'Black Crest Web Designs'}, 'author': {'@type': 'Organization', 'name': 'Black Crest Web Designs'}}
    page('guides/' + slug + '.html', f'{title}: Black Crest guides', desc, f'''<main id="main">
  <article class="container prose" style="padding-bottom:120px">
    <header class="page-head" style="padding-bottom:20px">
      <p class="label"><a class="crumb" href="./">Guides</a></p>
      <h1 class="h1" style="font-size:clamp(42px,7vw,76px)">{GUIDE_H1.get(title, title)}</h1>
      <p class="byline">Black Crest Web Designs</p>
    </header>
    {body}
    <div class="tile callout">
      <h2 class="h3" style="margin:0 0 12px">Want a hand with yours?</h2>
      <p>We design a free concept homepage for your business, so you can see it before you pay.</p>
      <div class="btn-row"><a class="btn btn-gold" href="../free-concept">Get a free concept</a><a class="btn btn-ghost" href="./">More guides</a></div>
    </div>
  </article>
</main>''', ld=[art])
P = '../'
gcards = ''.join(f'''<li><a href="{s}"><span class="n">0{i + 1}</span><span class="t">{t}</span><span class="x">{d}</span><span class="ic">{icon("ne")}</span></a></li>''' for i, (s, t, d, _) in enumerate(GUIDES))
page('guides/index.html', 'Guides for local business websites: Black Crest', 'Short, practical guides for local businesses: what a barber website needs, Google Business Profiles for cafes, and what a website should cost.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">Guides</p>
    <h1 class="h1" data-split>Short, <em>useful</em> guides.</h1>
    <p class="lead" data-reveal>Plain-English advice for local businesses. No jargon, no made-up numbers.</p>
  </div>
  <section class="container" aria-label="Guides" style="padding-bottom:120px">
    <ol class="trade-list guide-list" data-reveal style="--t:clamp(28px,4vw,48px)">{gcards}</ol>
  </section>
</main>''')

# ================================================================= Contact
P = ''
page('contact.html', 'Contact: Black Crest Web Designs', 'Ask a question or request a quote. We reply within 1 business day. Based in Melbourne, Australia.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">Contact</p>
    <h1 class="h1" data-split>Let's talk <em>about your site.</em></h1>
    <p class="lead" data-reveal>Tell us what you need. We reply within 1 business day.</p>
    <div class="btn-row" data-reveal style="margin-top:28px">
      <a class="btn btn-ghost" data-email href="mailto:{EMAIL}">{icon('mail')} Email {EMAIL}</a>
      <a class="btn btn-ghost" data-call href="#" hidden>{icon('call')} Call us</a>
    </div>
  </div>
  <section class="container narrow" aria-label="Contact form" style="padding-bottom:120px">
    <div class="tile" data-reveal>
      {form_open('contact', 'Black Crest: contact form message', P)}
        <input type="hidden" name="quote" value="">
        <p class="prefill" id="prefill-note" hidden></p>
        {need_fields('contact')}
        <div class="form-row">
          {field('name', 'Your name', required=True, auto='name', empty='Please enter your name.')}
          {field('email', 'Email', 'email', required=True, auto='email', empty='Please enter your email address.')}
        </div>
        {field('message', 'Message', required=True, textarea=True, empty='Please write a short message.')}
        {form_close('Send message', P)}
    </div>
    <p class="muted small" style="margin-top:20px">Based in Melbourne, Australia. We work with businesses across Melbourne and its suburbs.</p>
  </section>
</main>''')

# ================================================================= Thank you
P = ''
page('thank-you.html', 'Thank you: Black Crest Web Designs', 'Thanks for your message. Here is what happens next.', f'''<main id="main">
  <div class="container page-head">
    <p class="label">Message received</p>
    <h1 class="h1" data-split>Thank you. <em>It's with us.</em></h1>
    <p class="lead" data-reveal>Here is what happens next.</p>
  </div>
  <section class="container" aria-label="What happens next" style="padding-bottom:120px">
    <ol class="reason-list">
      <li data-reveal><span class="n">01</span><h2 class="h3">We reply within 1 business day</h2><p>By email, or by phone if you asked us to call.</p></li>
      <li data-reveal><span class="n">02</span><h2 class="h3">We ask a few questions</h2><p>Only what we need to design your free concept or answer your question.</p></li>
      <li data-reveal><span class="n">03</span><h2 class="h3">You see it, then decide</h2><p>No deposit and no obligation until you say yes.</p></li>
    </ol>
    <div class="btn-row" style="margin-top:40px"><a class="btn btn-gold" href="work">See the concept sites</a><a class="btn btn-ghost" href="/">Back to home</a></div>
  </section>
</main>''', noindex=True, toast=True)

# ================================================================= QR (printable)
P = ''
page('qr.html', 'Printable QR code: Black Crest Web Designs', 'A printable QR code that opens the Black Crest free concept page.', f'''<main id="main">
  <div class="container page-head">
    <div class="qr-sheet">
      <div style="display:flex;justify-content:center">{brand(P)}</div>
      <h1 class="h1" style="font-size:clamp(40px,7vw,64px);margin-top:30px">Scan for a free <em>website concept.</em></h1>
      <div class="qr-code"><img src="img/qr-free-concept.svg" width="320" height="320" alt="QR code that opens the Black Crest free concept page"></div>
      <p class="muted">Or visit:<br><span style="word-break:break-all">{SITE}free-concept</span></p>
      <div class="btn-row no-print" style="justify-content:center;margin-top:24px"><button class="btn btn-gold" type="button" data-print>Print this page</button></div>
    </div>
  </div>
</main>''', noindex=True)

# ================================================================= Privacy and terms
P = ''
page('privacy.html', 'Privacy policy: Black Crest Web Designs', 'How Black Crest Web Designs (a KB Ventures company) handles your information. No cookies, no tracking, no analytics.', f'''<main id="main">
  <article class="container prose" style="padding-bottom:120px">
    <header class="page-head" style="padding-bottom:8px"><p class="label">Legal</p><h1 class="h1">Privacy policy</h1><p class="byline">Last updated 1 November 2026</p></header>
    <p>Black Crest Web Designs is a brand of KB Ventures, based in Melbourne, Australia. This policy explains, in plain English, what we collect and what we do with it. "We" and "us" mean Black Crest Web Designs and KB Ventures.</p>
    <h2>What we collect</h2>
    <p>Only what you choose to send us through a form or by email: for example your name, business name, email address, phone number and the details of your project.</p>
    <h2>How we use it</h2>
    <ul><li>To reply to you and prepare your free concept or quote.</li><li>To build and look after your website if you become a customer.</li><li>To send invoices and keep the business records the law requires.</li></ul>
    <p>We do not sell your information, and we do not add you to a mailing list.</p>
    <h2>No cookies, no tracking</h2>
    <p>This website does not use cookies, analytics or advertising trackers. It uses your browser's session storage for small things that never leave your device: remembering that you have seen the opening animation, carrying your price-calculator or quiz choices to the contact form, and showing a confirmation after you send a form. All of it is cleared when you close the tab.</p>
    <h2>Services we use</h2>
    <ul><li><strong>Web3Forms</strong> delivers our website forms to our email inbox.</li><li><strong>GitHub Pages</strong> hosts this website. Like most hosts, it may record basic technical information such as your IP address to keep the service secure.</li><li><strong>cdnjs</strong> (Cloudflare) serves the 3D graphics library used on the home page. Like any web server, it receives your IP address when your browser requests the file.</li></ul>
    <p>Some of these services may store information outside Australia.</p>
    <h2>Seeing, correcting or deleting your information</h2>
    <p>Email <a data-email href="mailto:{EMAIL}">{EMAIL}</a> to ask what we hold about you, or to correct or delete it. We reply within 30 days.</p>
    <h2>The Australian Privacy Principles</h2>
    <p>We aim to follow the Australian Privacy Principles in the <em>Privacy Act 1988</em> (Cth). If you are unhappy with how we handled your information, email us first. If we cannot fix it, you can contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au/" rel="noopener">oaic.gov.au</a>.</p>
  </article>
</main>''')
page('terms.html', 'Terms: Black Crest Web Designs', 'The plain-English terms for working with Black Crest Web Designs: free concept first, 50% deposit, balance at launch, 2 rounds of changes, and you own your site.', f'''<main id="main">
  <article class="container prose" style="padding-bottom:120px">
    <header class="page-head" style="padding-bottom:8px"><p class="label">Legal</p><h1 class="h1">Terms</h1><p class="byline">Last updated 3 November 2026</p></header>
    <p>These are the terms for websites made by Black Crest Web Designs, a brand of KB Ventures, Melbourne, Australia. We have kept them short and plain. Your written quote sets out the exact price and what is included for your project. Our current packages are One Page ({money(ONE)}) and Full Website ({money(FULL)}).</p>
    <h2>1. The free concept</h2>
    <p>We design a concept homepage for you free of charge. You are under no obligation to go ahead, and you owe nothing if you do not.</p>
    <h2>2. Quote and deposit</h2>
    <p>If you want to go ahead, we email you a written quote. A <strong>50% deposit</strong> starts the build. We send an invoice with the payment details by email. We do not take payments on this website.</p>
    <p>If you stop after paying the deposit, the deposit covers the work already done and is not refunded, unless no work has started. If we cannot finish the work, we refund your deposit in full.</p>
    <h2>3. Changes</h2>
    <p><strong>Two rounds of changes</strong> are included during the build. Extra changes, or new work outside the quote, are quoted fairly before we do them.</p>
    <h2>4. Balance and launch</h2>
    <p>The <strong>balance is due at launch</strong>, once you have approved the finished site. We put the site live after the balance is paid.</p>
    <h2>5. You own your site</h2>
    <p>Once the balance is paid, <strong>you own the finished site</strong>: its design, its text and the files. We may show it as an example of our work only if you agree.</p>
    <h2>6. Your domain name</h2>
    <p><strong>You pay for your own domain name</strong> (about $20 a year), and it is registered in your name. Hosting setup is included in the price.</p>
    <h2>7. What you provide</h2>
    <p>You confirm that you have the right to use the text, logos and photos you send us.</p>
    <h2>8. Care plan</h2>
    <p>The care plan is optional and billed monthly at {money(CARE)} a month. It is month to month with no lock-in: email us before your next month starts to cancel. What it covers is listed on the <a href="care-plan">care plan page</a>.</p>
    <h2>9. Your rights</h2>
    <p>Nothing in these terms limits your rights under the Australian Consumer Law.</p>
    <h2>Questions</h2>
    <p>Email <a data-email href="mailto:{EMAIL}">{EMAIL}</a>.</p>
  </article>
</main>''')

# ================================================================= 404
P = ''
page('404.html', 'Page not found: Black Crest Web Designs', 'This page could not be found.', f'''<main id="main" class="nf">
  <div class="container nf-split">
    <div>
      <p class="label"><span class="idx">404</span><span class="slash" aria-hidden="true">/</span>Not found</p>
      <h1 class="h1" data-split>This page isn’t <em>on the map.</em></h1>
      <p class="lead" data-reveal>The address may be mistyped, or the page may have moved. These will get you back on track.</p>
      <div class="btn-row" data-reveal><a class="btn btn-gold" href="/">Go to the home page</a><a class="btn btn-ghost" href="work">See the work</a></div>
    </div>
    <div class="nf-card" aria-hidden="true">{pic('assets/renders/card-tight', 1120, 1200, '', '', sizes='(min-width: 1024px) 34vw, 80vw')}</div>
  </div>
</main>''', noindex=True, base_script=True)

# ================================================================= style.min.css
# style.css is the readable source, edited by hand. Pages load style.min.css: the same rules without comments and
# spare whitespace, so the page plus its CSS stays inside the size budget. Rebuild after editing style.css.
with open(os.path.join(SITE_DIR, 'style.css'), encoding='utf-8') as fh:
    _css = fh.read()
_css = re.sub(r'/\*.*?\*/', '', _css, flags=re.S)
_css = re.sub(r'\s+', ' ', _css)
_css = re.sub(r'\s*([{};,>])\s*', r'\1', _css).replace(';}', '}').strip()
with open(os.path.join(SITE_DIR, 'style.min.css'), 'w', encoding='utf-8') as fh:
    fh.write('/* Black Crest Web Designs. Built from style.css by tools/build.py: edit style.css, not this file. */\n' + _css + '\n')

# ================================================================= write files
for path, content in pages.items():
    out = os.path.join(SITE_DIR, path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write(content)

SKIP = {'free-concept.html', 'thank-you.html', '404.html', 'qr.html'}
with open(os.path.join(SITE_DIR, 'sitemap.xml'), 'w', encoding='utf-8') as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for p in pages:
        if p in SKIP:
            continue
        fh.write(f'  <url><loc>{SITE + clean(p)}</loc><lastmod>{LASTMOD}</lastmod></url>\n')
    fh.write('</urlset>\n')
with open(os.path.join(SITE_DIR, 'robots.txt'), 'w', encoding='utf-8') as fh:
    fh.write(f'# free-concept, thank-you, qr and 404 carry a noindex tag instead of a Disallow,\n# so search engines can read it.\nUser-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n')
with open(os.path.join(SITE_DIR, 'manifest.webmanifest'), 'w', encoding='utf-8') as fh:
    json.dump({'name': 'Black Crest Web Designs', 'short_name': 'Black Crest', 'description': 'Premium sites for local businesses.', 'lang': 'en-AU',
               'start_url': './', 'scope': './', 'display': 'standalone', 'background_color': '#0D0E12', 'theme_color': '#0D0E12',
               'icons': [{'src': 'img/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                         {'src': 'img/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                         {'src': 'img/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}, fh, indent=2)
print('built', len(pages), 'pages')
