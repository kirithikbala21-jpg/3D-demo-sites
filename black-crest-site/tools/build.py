"""Writes every page of the Black Crest Web Designs site as plain HTML.

The site itself has no build step: these are static files. This script only exists so the header, footer,
phone bar and prices stay the same on every page. Run it after changing any text or price:

    python3 black-crest-site/tools/build.py

Prices come from the CONFIG object at the top of main.js. The Web3Forms access key is read from the
KB Ventures config (kbventures-site/site.config.json), so both sites use the same key.
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.dirname(HERE)
REPO = os.path.dirname(SITE_DIR)
SITE = 'https://kirithikbala21-jpg.github.io/3D-demo-sites/black-crest-site/'
KB_SITE = '../kbventures-site/'
E = html.escape

with open(os.path.join(SITE_DIR, 'main.js'), encoding='utf-8') as fh:
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


# ---------------------------------------------------------------- icons and the crest
ICON = {
    'bolt': '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    'phone': '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    'search': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
    'key': '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    'unlock': '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 7.6-1.7"/>',
    'lock': '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    'call': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'ext': '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    'left': '<path d="M15 6l-6 6 6 6"/>',
    'right': '<path d="M9 6l6 6-6 6"/>',
    'pen': '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    'chat': '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z"/>',
    'shield': '<path d="M12 3 4.5 6v6c0 4.5 3.2 8 7.5 9 4.3-1 7.5-4.5 7.5-9V6L12 3Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    'map': '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    'spark': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
}


def icon(name, cls=''):
    c = f' class="{cls}"' if cls else ''
    return f'<svg{c} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICON[name]}</svg>'


def tile_icon(name):
    return f'<span class="icon">{icon(name)}</span>'


def crest(cls='crest'):
    return (f'<svg class="{cls}" viewBox="0 0 48 56" aria-hidden="true" focusable="false">'
            '<path class="crest-outline" pathLength="1" d="M24 2.5 43.5 9.2V26c0 12.6-8.1 21.6-19.5 27.5C12.6 47.6 4.5 38.6 4.5 26V9.2Z"/>'
            '<path class="crest-inner" d="M24 7.6 38.6 12.6V26c0 9.6-6 16.6-14.6 21.4C15.4 42.6 9.4 35.6 9.4 26V12.6Z"/>'
            '<text class="crest-text" x="24" y="32.6" text-anchor="middle">BC</text></svg>')


# ---------------------------------------------------------------- page parts
NAV = [('work.html', 'Work'), ('pricing.html', 'Pricing'), ('process.html', 'Process'), ('about.html', 'About'), ('faq.html', 'FAQ'), ('contact.html', 'Contact')]
TRADES = [('for-barbers.html', 'Barbers'), ('for-cafes.html', 'Cafes'), ('for-gyms.html', 'Gyms'), ('for-tradies.html', 'Tradies'), ('for-salons.html', 'Salons')]
FOOTER = [
    ('Services', [('pricing.html', 'Pricing'), ('care-plan.html', 'Care plan'), ('process.html', 'How it works'), ('work.html', 'Concept sites'), ('start.html', 'Start your project')]),
    ('Trades', [(h, t) for h, t in TRADES]),
    ('Resources', [('faq.html', 'FAQ'), ('guides/', 'Guides'), ('quiz.html', 'Website quiz'), ('free-concept.html', 'Free concept'), ('qr.html', 'Printable QR code')]),
    ('Company', [('about.html', 'About'), ('contact.html', 'Contact'), ('privacy.html', 'Privacy'), ('terms.html', 'Terms')]),
]


def brand(P):
    return (f'<a class="brand" href="{P}index.html" aria-label="Black Crest Web Designs home">{crest()}'
            '<span class="brand-name" aria-hidden="true"><b>Black Crest</b><small>Web Designs</small></span></a>')


def cur(name, here):
    return ' aria-current="page"' if name == here else ''


def header(P, here):
    links = ''.join(f'<li><a href="{P}{h}"{cur(h, here)}>{t}</a></li>' for h, t in NAV)
    mlinks = ''.join(f'<li><a href="{P}{h}"{cur(h, here)}>{t}</a></li>' for h, t in [('index.html', 'Home')] + NAV)
    sub = ''.join(f'<a href="{P}{h}">{t}</a>' for h, t in [('care-plan.html', 'Care plan'), ('start.html', 'Start your project'), ('guides/', 'Guides'), ('quiz.html', 'Website quiz')] + TRADES)
    return f'''<header class="site-header">
  <div class="container header-inner">
    {brand(P)}
    <nav aria-label="Main"><ul class="nav-links">{links}</ul></nav>
    <a class="btn btn-gold btn-sm header-cta" href="{P}free-concept.html">Get a free concept</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-icon" aria-hidden="true"></span><span class="sr-only">Open menu</span></button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Menu"><ul>{mlinks}</ul><div class="menu-sub">{sub}</div></nav>
  <a class="btn btn-gold" href="{P}free-concept.html">Get a free concept</a>
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
        <a class="mail" data-email href="mailto:{EMAIL}">{EMAIL}</a>
      </div>
      <div class="footer-cols">{cols}
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>2026</span> Black Crest Web Designs, a <a href="{P}{KB_SITE}">KB Ventures</a> company.</p>
      <p>No cookies. No tracking. Prices in AUD.</p>
    </div>
  </div>
</footer>'''


def mobile_bar(P):
    return f'''<div class="mobile-bar" role="region" aria-label="Quick actions">
  <a class="btn btn-gold" href="{P}free-concept.html">Get a free concept</a>
  <a class="btn btn-ghost icon-btn" data-call href="#" hidden aria-label="Call us">{icon('call')}</a>
  <a class="btn btn-ghost icon-btn" data-email href="mailto:{EMAIL}" aria-label="Email us">{icon('mail')}</a>
</div>'''


INTRO = f'''<div class="intro" id="intro" hidden aria-hidden="true">
  {crest('intro-mark')}
  <button class="intro-skip" type="button" tabindex="-1">Skip</button>
</div>'''


def head(title, desc, path, P, noindex=False, ld=(), base_script=False):
    canon = SITE + path
    og = SITE + 'img/og.jpg'
    lds = ''.join(f'\n<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",", ":"))}</script>' for x in ld)
    base = ('<script>(function(){var m=location.pathname.match(/^(.*\\/black-crest-site\\/)/);'
            'document.write(\'<base href="\'+(m?m[1]:\'/\')+\'">\');})();</script>\n') if base_script else ''
    return f'''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
{base}<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
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
<meta property="og:image:alt" content="The Black Crest Web Designs crest and the line: Premium sites for local businesses.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{E(title)}">
<meta name="twitter:description" content="{E(desc)}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="{P}img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{P}favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="{P}img/apple-touch-icon.png">
<link rel="manifest" href="{P}manifest.webmanifest">
<link rel="preload" href="{P}fonts/cormorant-garamond.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{P}fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{P}style.css">
<script src="{P}main.js" defer></script>{lds}
</head>'''


pages = {}


def page(path, title, desc, body, noindex=False, ld=(), bare=False, base_script=False):
    depth = path.count('/')
    P = '../' * depth
    here = path
    top = '' if bare else header(P, here)
    bottom = '' if bare else f'{footer(P, here)}\n{mobile_bar(P)}'
    pages[path] = f'''{head(title, desc, path if path != 'index.html' else '', P, noindex, ld, base_script)}
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="scroll-line" aria-hidden="true"></div>
{'' if bare else INTRO}
{top}
{body}
{bottom}
</body>
</html>
'''


def section_head(eyebrow, title, text='', center=False, level='h2'):
    return f'''<div class="section-head{' center' if center else ''} reveal">
      <p class="eyebrow">{eyebrow}</p>
      <{level}>{title}</{level}>
      {f'<p>{text}</p>' if text else ''}
    </div>'''


# ---------------------------------------------------------------- shared content
DEMOS = [
    ('barber', 'barber-demo', 'Brass &amp; Blade', 'Barbershop', 'Prices, online booking and a gallery of cuts, with a spinning 3D barber pole.', 'for-barbers.html'),
    ('cafe', 'cafe-demo-v2', 'Ember &amp; Oak', 'Cafe', 'A full menu, opening hours, a map and pick-up ordering.', 'for-cafes.html'),
    ('gym', 'gym-demo', 'Iron &amp; Ember Athletic Club', 'Gym', 'Class timetable, memberships and a free-trial form.', 'for-gyms.html'),
    ('plumber', 'plumber-demo', 'Waverley Plumbing &amp; Gas', 'Plumber', 'A big call button, service areas, a price guide and a quote form.', 'for-tradies.html'),
    ('salon', 'salon-demo', 'Maison Lune', 'Hair and beauty salon', 'A service menu with prices, a booking widget and a gallery.', 'for-salons.html'),
    ('parts', 'parts-store-demo', 'Torque &amp; Co.', 'Auto parts store', 'A home page that helps drivers find parts that fit their car.', None),
]
DEMO = {d[0]: d for d in DEMOS}


def phone_img(slug, name, P, lazy=True):
    return (f'<div class="phone"><img src="{P}img/work/{slug}.webp" width="540" height="1170" '
            f'{"loading=lazy " if lazy else ""}decoding="async" alt="The {name} concept site on a phone"></div>').replace('loading=lazy', 'loading="lazy"')


def demo_card(d, P, level='h3', lazy=True):
    slug, folder, name, trade, text, _ = d
    return f'''<article class="tile work-card">
        <p class="tile-label"><span>{trade}</span><span class="chip">Concept site</span></p>
        {phone_img(slug, name, P, lazy)}
        <{level}>{name}</{level}>
        <p>{text}</p>
        <a class="btn btn-ghost" href="{P}../{folder}/" target="_blank" rel="noopener">Open concept site {icon('ext')}<span class="sr-only"> (opens in a new tab)</span></a>
      </article>'''


def price_tile(kind, P, featured=False, long=False):
    if kind == 'one':
        name, amt, key, per, chip = 'One Page', ONE, 'onePage', 'one-off', 'Simple'
        lead = 'One polished page with everything a local business needs.'
        items = ['Writing help', 'Designed for phones first', 'Contact form', 'Google basics set up', 'Fast and secure (HTTPS)', '2 rounds of changes']
        href, cta = f'{P}contact.html?need=one-page', 'Choose One Page'
    elif kind == 'full':
        name, amt, key, per, chip = 'Full Website', FULL, 'fullSite', 'one-off', 'Better value'
        lead = 'Up to about 5 pages, for businesses with more to show.'
        items = ['Everything in One Page', 'Up to about 5 pages', 'Room for a menu, timetable, services or gallery', '2 rounds of changes']
        href, cta = f'{P}contact.html?need=full-website', 'Choose Full Website'
    elif kind == 'care':
        name, amt, key, per, chip = 'Care plan', CARE, 'carePlan', 'a month', 'Optional'
        lead = 'We look after your site after launch.'
        items = ['Hosting upkeep', 'Small text and photo changes', 'Security checks and backups', 'Priority replies']
        href, cta = f'{P}care-plan.html', 'What the care plan covers'
    else:
        name, amt, key, per, chip = 'Custom', None, None, '', 'By quote'
        lead = 'Bigger or special projects, like many pages or special features.'
        items = ['Scoped with you first', 'A fixed quote before any work', 'Same promises: free concept first']
        href, cta = f'{P}contact.html?need=not-sure', 'Ask for a quote'
    bal = (f'<p class="balance"><span data-price="{key}" data-count="{amt}">{money(amt)}</span> <span class="per">{per}</span></p>'
           if amt else '<p class="balance balance-quote">By quote</p>')
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f'''<article class="tile price-tile tilt{' is-featured' if featured else ''}">
        <p class="tile-label"><span>{name}</span><span class="chip{'' if featured else ' chip-plain'}">{chip}</span></p>
        {bal}
        <p class="muted small">{lead}</p>
        <ul>{lis}</ul>
        <a class="btn {'btn-gold' if featured else 'btn-ghost'}" href="{href}">{cta}</a>
      </article>'''


def faq_list(items, P):
    out = []
    for q, a in items:
        out.append(f'<details><summary>{q}</summary><div class="answer"><p>{a.replace("{P}", P)}</p></div></details>')
    return '<div class="faq">' + ''.join(out) + '</div>'


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).replace('&amp;', '&').replace('{P}', '')


# ---------------------------------------------------------------- forms
def form_open(name, subject, P, extra_class=''):
    return f'''<form class="form{extra_class}" id="form-{name}" data-form="{name}" action="https://api.web3forms.com/submit" method="POST" data-thanks="{P}thank-you.html" novalidate>
        <input type="hidden" name="access_key" value="{FORM_KEY}">
        <input type="hidden" name="subject" value="{E(subject)}">
        <input type="hidden" name="from_name" value="Black Crest Website">
        <input type="hidden" name="form" value="{E(name)}">
        <input type="hidden" name="redirect" value="{SITE}thank-you.html">
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
    return f'''<p class="privacy-line">We only use your details to reply to you. See our <a href="{P}privacy.html">privacy policy</a>.</p>
        <button class="btn btn-gold" type="submit">{button}</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>'''


# ================================================================= PAGES
ORG = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': SITE + '#business',
    'name': 'Black Crest Web Designs', 'slogan': 'Premium sites for local businesses',
    'description': 'Fast, good-looking websites for local businesses in Melbourne. Free concept homepage first, clear prices, and you own your site.',
    'url': SITE, 'email': EMAIL, 'image': SITE + 'img/og.jpg', 'logo': SITE + 'img/icon-512.png',
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Melbourne', 'addressRegion': 'VIC', 'addressCountry': 'AU'},
    'areaServed': {'@type': 'City', 'name': 'Melbourne'},
    'parentOrganization': {'@type': 'Organization', 'name': 'KB Ventures', 'url': 'https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/'},
    'makesOffer': [
        {'@type': 'Offer', 'name': 'One Page website', 'price': f'{ONE:.2f}', 'priceCurrency': CONFIG['currency'], 'url': SITE + 'pricing.html'},
        {'@type': 'Offer', 'name': 'Full Website (up to about 5 pages)', 'price': f'{FULL:.2f}', 'priceCurrency': CONFIG['currency'], 'url': SITE + 'pricing.html'},
        {'@type': 'Offer', 'name': 'Care plan', 'price': f'{CARE:.2f}', 'priceCurrency': CONFIG['currency'], 'url': SITE + 'care-plan.html',
         'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': f'{CARE:.2f}', 'priceCurrency': CONFIG['currency'], 'unitText': 'month'}},
    ],
}

TRUST = [('key', 'You own your site'), ('unlock', 'No lock-in contracts'), ('lock', 'Secure HTTPS'), ('clock', 'Reply within 24 hours')]
STEPS = [
    ('Chat', 'Tell us about your business. A short message is enough.', 'Day 1'),
    ('Free concept', 'We design your homepage for free. No deposit, no obligation.', 'Usually within 5 business days'),
    ('Build', 'Like it? Pay a 50% deposit and we build the rest with you.', 'Usually 1 to 2 weeks'),
    ('Launch', 'You check everything, pay the balance and go live.', 'Usually 1 to 2 days'),
]
FAQS = [
    ('How much does a website cost?', f'A One Page site is {money(ONE)}. A Full Website, up to about 5 pages, is {money(FULL)}. The care plan is optional and costs {money(CARE)} a month. Bigger or special projects are quoted. The only other cost is your own domain name, about $20 a year. See <a href="{{P}}pricing.html">pricing</a>.'),
    ('How long does it take?', 'Your free concept homepage is usually ready within 5 business days of our first chat. The build usually takes 1 to 2 weeks after the deposit, and launch takes 1 to 2 days once you approve the preview.'),
    ('Who owns the website?', 'You do. Once the balance is paid, the finished site is yours. Your domain name is registered in your name, so it is always yours too.'),
    ('Can I ask for changes?', 'Yes. Two rounds of changes are included while we build. After launch, small text and photo changes are included in the care plan. Anything bigger is quoted fairly before we do it.'),
    ('What about the domain name and hosting?', 'You pay for your own domain name (your web address), about $20 a year, and it is registered in your name. Hosting setup is included in the price. If anything about hosting would cost you extra, we tell you before you say yes.'),
    ('What do I need to give you?', 'Your business name, what you do, where you are, how people should contact you, your opening hours, your services and prices, and your logo and photos if you have them. We help with the writing.'),
    ("What if I don't like the concept?", "Then you don't pay anything. Tell us what isn't right and we can adjust it before you decide, or you can simply walk away. There is no deposit until you're happy to go ahead."),
    ('How do payment and the deposit work?', 'The concept is free. If you go ahead, a 50% deposit starts the build and the balance is due at launch. We email you an invoice with the payment details. We never take payments on this website.'),
    ('How long does the care plan last?', 'Month to month, for as long as it is useful to you. There is no lock-in contract.'),
    ('How do I cancel the care plan?', 'Email us before your next month starts and that is it. Your site stays yours, and we hand over your files and logins.'),
]


def faq_ld():
    return {'@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [{'@type': 'Question', 'name': strip_tags(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip_tags(a)}} for q, a in FAQS]}


# ---------------------------------------------------------------- Home
P = ''
carousel = ''.join(f'<li>{demo_card(d, P)}</li>' for d in DEMOS)
steps = ''.join(f'''<li class="tile reveal d{i % 4}"><span class="num">0{i + 1}</span><h3>{t}</h3><p class="muted">{x}</p><span class="when">{w}</span></li>''' for i, (t, x, w) in enumerate(STEPS))
trust = ''.join(f'<li>{icon(i)}<span>{t}</span></li>' for i, t in TRUST)
page('index.html', 'Black Crest Web Designs: premium sites for local businesses', f'Fast, good-looking websites for Melbourne barbers, cafes, gyms, salons and tradies. Free concept homepage first. One Page {money(ONE)}, Full Website {money(FULL)}.', f'''<main id="main">
  <section class="hero" aria-labelledby="hero-h">
    <div class="container hero-grid">
      <div>
        <p class="eyebrow">Black Crest Web Designs &middot; Melbourne</p>
        <h1 id="hero-h">Premium sites for <em>local businesses</em></h1>
        <p class="lead">Fast, good-looking websites for barbers, cafes, gyms, salons and tradies. We design your new homepage for free first, so you can see it before you pay a cent.</p>
        <p class="from-line">From <strong><span>$</span><span data-price="onePage" data-count="{ONE}" data-prefix="">{ONE}</span></strong> one-off</p>
        <div class="btn-row">
          <a class="btn btn-gold" href="free-concept.html">Get a free concept</a>
          <a class="btn btn-ghost" href="pricing.html">See pricing</a>
        </div>
      </div>
      <aside class="tile hero-card tilt reveal d2" aria-label="How paying works">
        <p class="tile-label"><span>Your new website</span><span class="chip">Concept first</span></p>
        <p class="balance"><span data-price="onePage" data-count="{ONE}">{money(ONE)}</span> <span class="per">from, one-off</span></p>
        <ul class="rows">
          <li><span>Free concept homepage</span><b>$0</b></li>
          <li><span>Deposit to start the build</span><b>50%</b></li>
          <li><span>Balance</span><b>At launch</b></li>
          <li><span>Rounds of changes</span><b>2 included</b></li>
        </ul>
        <p class="acct"><span>Black Crest Web Designs</span><span>AUD</span></p>
      </aside>
    </div>
  </section>

  <section class="trust" aria-label="Our promises"><div class="container"><ul>{trust}</ul></div></section>

  <section class="section" aria-labelledby="why-h">
    <div class="container">
      {section_head('Why it matters', '<span id="why-h">A website that works as hard as you do.</span>', 'Most people will find you on their phone, often minutes before they need you. Your site should make it easy to say yes.')}
      <div class="grid grid-3">
        <article class="tile tilt reveal">{tile_icon('bolt')}<h3>Fast</h3><p class="muted">Pages load quickly, even on a phone with a weak signal. We keep them light: no heavy page builders, no slow add-ons.</p></article>
        <article class="tile tilt reveal d1">{tile_icon('phone')}<h3>Great on phones</h3><p class="muted">Designed for the small screen first, with big buttons to call, book or get directions in one tap.</p></article>
        <article class="tile tilt reveal d2">{tile_icon('search')}<h3>Easy to find on Google</h3><p class="muted">Clear page titles, descriptions and structure from day one, plus help with your free Google Business Profile.</p></article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="ba-h">
    <div class="container narrow">
      {section_head('Before and after', '<span id="ba-h">From dated to sharp.</span>', 'Drag the handle to compare a tired old homepage with a concept redesign.', center=True)}
      <div class="compare reveal" data-compare>
        <img src="img/compare-before.webp" width="1200" height="750" loading="lazy" decoding="async" alt="Before: a dated, cluttered barbershop homepage with small text and no clear booking button">
        <img class="after" src="img/compare-after.webp" width="1200" height="750" loading="lazy" decoding="async" alt="After: the Brass and Blade concept homepage, dark and clean with a clear Book now button">
        <span class="compare-tag l" aria-hidden="true">Before</span><span class="compare-tag r" aria-hidden="true">After</span>
        <span class="handle" aria-hidden="true"></span>
        <label class="sr-only" for="compare-range">Compare before and after</label>
        <input id="compare-range" type="range" min="0" max="100" value="50">
      </div>
      <p class="compare-note"><span class="chip">Example, not a real customer</span></p>
    </div>
  </section>

  <section class="section" aria-labelledby="how-h">
    <div class="container">
      {section_head('How it works', '<span id="how-h">Four simple steps.</span>', 'You see your new homepage before you pay anything.')}
      <ol class="steps">{steps}</ol>
      <p class="reveal"><a class="text-link" href="process.html">See the full process {icon('arrow', 'ic')}</a></p>
    </div>
  </section>

  <section class="section" aria-labelledby="work-h">
    <div class="container" data-carousel>
      {section_head('Concept sites', '<span id="work-h">See what we build.</span>', 'Six concept websites for made-up local businesses. They are examples, not real customers. Swipe to look, and open any of them on your phone.')}
      <ul class="carousel-track" aria-label="Concept sites">{carousel}</ul>
      <div class="carousel-controls">
        <button class="carousel-btn" type="button" data-dir="-1" aria-label="Previous concept">{icon('left')}</button>
        <button class="carousel-btn" type="button" data-dir="1" aria-label="Next concept">{icon('right')}</button>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="price-h">
    <div class="container">
      {section_head('Pricing', '<span id="price-h">Clear prices. No surprises.</span>', 'Pick a package, see the price, and know exactly what is included.')}
      <div class="grid grid-3">
        {price_tile('one', P)}
        {price_tile('full', P, featured=True)}
        {price_tile('care', P)}
      </div>
      <p class="reveal" style="margin-top:24px">Need something bigger? Custom projects are quoted. <a class="text-link" href="pricing.html">Full pricing and the price calculator {icon('arrow')}</a></p>
    </div>
  </section>

  <section class="section" aria-labelledby="who-h">
    <div class="container">
      {section_head('Who it is for', '<span id="who-h">Built for local businesses.</span>', 'If people find you nearby and then call, book or walk in, a good website helps. We work with businesses across Melbourne and its suburbs.')}
      <ul class="trade-links reveal">{''.join(f'<li><a href="{h}">{t} {icon("arrow")}</a></li>' for h, t in TRADES)}</ul>
    </div>
  </section>

  <section class="section" aria-labelledby="case-h">
    <div class="container">
      <div class="tile offer reveal">
        <div>
          <p class="eyebrow">An honest offer</p>
          <h2 id="case-h">Be our first case study.</h2>
          <p>We are new, so there are no customer reviews to show you yet, and we will never make any up. The first few local shops we work with get a discount, in return for an honest quote about the experience and permission to show their site here.</p>
        </div>
        <a class="btn btn-ghost" href="contact.html">Ask about it</a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="faq-h">
    <div class="container narrow">
      {section_head('Questions', '<span id="faq-h">Quick answers.</span>')}
      <div class="reveal">{faq_list(FAQS[:3], P)}</div>
      <p class="reveal"><a class="text-link" href="faq.html">All questions {icon('arrow')}</a></p>
    </div>
  </section>

  <section class="section cta-final" aria-labelledby="cta-h">
    <div class="container">
      <hr class="rule draw" style="max-width:240px;margin:0 auto 40px">
      <h2 id="cta-h" class="reveal">See your new homepage before you pay.</h2>
      <p class="reveal">Tell us about your business. We reply within 24 hours and design your concept for free.</p>
      <div class="btn-row reveal"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="contact.html">Ask a question</a></div>
    </div>
  </section>
</main>''', ld=[ORG])

# ---------------------------------------------------------------- Work
P = ''
page('work.html', 'Concept sites: Black Crest Web Designs', 'Six concept websites for made-up local businesses: a barbershop, cafe, gym, plumber, salon and auto parts store. Open each one on your phone.', f'''<main id="main">
  <div class="container page-head">
    <p class="eyebrow reveal">Our work</p>
    <h1 class="reveal d1">Concept sites.</h1>
    <p class="lead reveal d2">Six concept websites for made-up local businesses, built to show what we do. They are not real customers. Open any of them and try it on your phone.</p>
  </div>
  <section class="container" aria-label="Concept sites">
    <div class="work-grid">{''.join(f'<div class="reveal d{i % 3}">{demo_card(d, P, "h2", lazy=i > 2)}</div>' for i, d in enumerate(DEMOS))}</div>
    <p class="tiny" style="margin-top:28px">All six are concepts for fictional businesses. The names, prices, reviews and photos inside them are made up or stock images.</p>
  </section>
  <section class="section cta-final" aria-labelledby="cta-h">
    <div class="container">
      <h2 id="cta-h" class="reveal">Want one like this for your business?</h2>
      <p class="reveal">We design your homepage concept for free, so you can see it first.</p>
      <div class="btn-row reveal"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="pricing.html">See pricing</a></div>
    </div>
  </section>
</main>''')

# ---------------------------------------------------------------- Pricing
P = ''
INCLUDED = ['Writing help', 'Mobile design', 'Contact form', 'Google basics (SEO setup)', 'Speed', 'Secure HTTPS', 'Handover of your site and logins', '2 rounds of changes']
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
PRICE_LD = {'@context': 'https://schema.org', '@type': 'OfferCatalog', 'name': 'Black Crest Web Designs pricing', 'url': SITE + 'pricing.html',
            'itemListElement': ORG['makesOffer'] + [{'@type': 'Offer', 'name': a['name'], 'priceCurrency': CONFIG['currency'],
                                                     'priceSpecification': {'@type': 'PriceSpecification', 'minPrice': f"{a['from']:.2f}", 'priceCurrency': CONFIG['currency']}} for a in ADDONS]}
page('pricing.html', 'Pricing: Black Crest Web Designs', f'One Page website {money(ONE)}. Full Website (up to about 5 pages) {money(FULL)}. Optional care plan {money(CARE)} a month. No hidden costs, and a price calculator.', f'''<main id="main">
  <div class="container page-head">
    <p class="eyebrow reveal">Pricing</p>
    <h1 class="reveal d1">Clear prices. No hidden costs.</h1>
    <p class="lead reveal d2">Every price is set before we start, and your concept homepage is free. All prices are in Australian dollars.</p>
  </div>
  <section class="container" aria-label="Packages">
    <div class="grid grid-4">
      {price_tile('one', P)}
      {price_tile('full', P, featured=True)}
      {price_tile('care', P)}
      {price_tile('custom', P)}
    </div>
  </section>

  <section class="section" aria-labelledby="inc-h">
    <div class="container narrow">
      {section_head('What is included', '<span id="inc-h">Everything listed is included.</span>', 'No hidden extras. These come with both the One Page and the Full Website.')}
      <div class="table-wrap reveal"><table class="stack-table"><caption>What is included in each package</caption>
        <thead><tr><th scope="col">Item</th><th scope="col">One Page</th><th scope="col">Full Website</th></tr></thead>
        <tbody>{inc_rows}</tbody></table></div>
    </div>
  </section>

  <section class="section" aria-labelledby="promise-h">
    <div class="container narrow">
      <div class="tile reveal">
        <p class="eyebrow">Our promise</p>
        <h2 id="promise-h">No hidden costs.</h2>
        <p class="lead" style="margin-top:16px">The price we quote is the price you pay.</p>
        <ul class="ticks">
          <li>You pay for your own domain name (your web address, like yourbusiness.com.au), about $20 a year. It is registered in your name, so it is always yours.</li>
          <li>Hosting setup is included. If anything about hosting would cost you extra, we tell you before you say yes.</li>
          <li>Add-ons are optional, and their price is confirmed before any work begins.</li>
          <li>Extra changes beyond the 2 included rounds are quoted fairly first. Nothing is added to your bill without your OK.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="addons-h">
    <div class="container narrow">
      {section_head('Add-ons', '<span id="addons-h">Add what you need.</span>', 'Optional extras, priced from these amounts. We confirm the exact price with you first.')}
      <ul class="addon-list reveal">{addon_rows}</ul>
    </div>
  </section>

  <section class="section" aria-labelledby="cmp-h">
    <div class="container">
      {section_head('Compare', '<span id="cmp-h">Your options, side by side.</span>')}
      <div class="table-wrap reveal"><table class="stack-table">
        <caption>A DIY builder, a typical Melbourne agency and Black Crest</caption>
        <thead><tr><th scope="col"><span class="sr-only">Compared on</span></th><th scope="col">DIY builder (Wix or Squarespace)</th><th scope="col">Typical Melbourne agency</th><th scope="col" class="col-us">Black Crest</th></tr></thead>
        <tbody>{cmp_rows}</tbody></table></div>
      <p class="tiny reveal" style="margin-top:12px">*Typical market range; prices vary.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="calc-h">
    <div class="container">
      {section_head('Price calculator', '<span id="calc-h">Build your quote.</span>', 'Tick what you want and see the total. Then send it to us and we confirm it by email.')}
      <form class="calc" id="calc" onsubmit="return false">
        <div class="reveal">
          <fieldset><legend>Package</legend>
            <label class="opt" for="pkg-one"><input type="radio" name="pkg" id="pkg-one" value="onePage" checked><span class="opt-text"><b>One Page</b><span class="tiny">One polished page</span></span><span class="amt" data-price="onePage">{money(ONE)}</span></label>
            <label class="opt" for="pkg-full"><input type="radio" name="pkg" id="pkg-full" value="fullSite"><span class="opt-text"><b>Full Website</b><span class="tiny">Up to about 5 pages</span></span><span class="amt" data-price="fullSite">{money(FULL)}</span></label>
          </fieldset>
          <fieldset><legend>Add-ons</legend>{calc_addons}</fieldset>
          <fieldset><legend>After launch</legend>
            <label class="opt" for="add-care"><input type="checkbox" id="add-care" value="care"><span class="opt-text"><b>Care plan</b><span class="tiny">Optional, cancel any time</span></span><span class="amt"><span data-price="carePlan">{money(CARE)}</span> a month</span></label>
          </fieldset>
        </div>
        <div class="tile calc-total reveal d1" aria-live="polite">
          <p class="tile-label"><span>Estimated total</span><span class="chip">AUD</span></p>
          <p class="balance"><span class="from">from</span> <span id="calc-total">{money(ONE)}</span></p>
          <p class="muted small" id="calc-month" hidden>plus the care plan, <span data-price="carePlan">{money(CARE)}</span> a month</p>
          <ul id="calc-lines"><li>One Page: {money(ONE)}</li></ul>
          <button class="btn btn-gold" type="button" id="calc-send">Send me this quote</button>
          <p class="tiny" style="margin-top:12px">This opens the contact form with your choices filled in. Nothing is sent until you press Send there.</p>
        </div>
      </form>
    </div>
  </section>

  <section class="section cta-final" aria-labelledby="cta-h">
    <div class="container">
      <h2 id="cta-h" class="reveal">Start with a free concept.</h2>
      <p class="reveal">See your new homepage first. Decide after.</p>
      <div class="btn-row reveal"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="process.html">How it works</a></div>
    </div>
  </section>
</main>''', ld=[PRICE_LD])

# ---------------------------------------------------------------- Process
P = ''
TIMELINE = [
    ('Chat', 'Usually the same or next day. We reply within 24 hours.', ['Send us a message through the site or by email. Tell us what you do, where you are, and what you want people to do on your site: call, book or visit.', 'If you have a logo, photos or an old website, send links. No long forms unless you want to.']),
    ('Free concept homepage', 'Usually within 5 business days.', ['We design your homepage using your name, your trade and your area. For a One Page site, that is most of your site.', 'It is free, with no deposit and no obligation. If it is not for you, you walk away and owe nothing.']),
    ('Build', 'Usually 1 to 2 weeks after the deposit. A One Page site is often quicker.', ['Like the concept? We email you a quote and the payment details. A 50% deposit starts the build.', 'We write the text with you, add your photos and details, set up your contact form and Google basics, and send you a private preview link. Two rounds of changes are included.']),
    ('Launch', 'Usually 1 to 2 days after you approve the preview.', ['You pay the balance. We connect your domain, switch on HTTPS and check everything on phones and computers.', 'Then we hand over. Your site, your domain and your logins are yours.']),
]
tl = ''.join(f'''<li class="reveal"><span class="node">0{i + 1}</span><h2>{t}</h2><span class="chip chip-plain when">{w}</span>{''.join(f'<p>{p}</p>' for p in ps)}</li>''' for i, (t, w, ps) in enumerate(TIMELINE))
page('process.html', 'How it works: Black Crest Web Designs', 'Four steps: chat, free concept homepage, build and launch. Free concept first, 50% deposit to start, balance at launch, 2 rounds of changes included.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow reveal">How it works</p>
    <h1 class="reveal d1">Four steps. No surprises.</h1>
    <p class="lead reveal d2">From the first message to your site going live, here is what happens and how long each step usually takes.</p>
  </div>
  <section class="container narrow" aria-label="The four steps"><ol class="timeline">{tl}</ol></section>
  <section class="section" aria-labelledby="promise-h">
    <div class="container narrow">
      <div class="tile reveal">
        <p class="eyebrow">Our promise</p>
        <h2 id="promise-h">How paying works.</h2>
        <ul class="ticks" style="margin-top:20px">
          <li><strong>Free concept first.</strong> You see your homepage before you pay anything.</li>
          <li><strong>50% deposit to start the build.</strong> Only once you are happy to go ahead.</li>
          <li><strong>Balance at launch.</strong> When your site is ready to go live.</li>
          <li><strong>2 rounds of changes included.</strong> Extra changes are quoted fairly, before we do them.</li>
        </ul>
        <p class="muted small" style="margin-top:18px">We email you an invoice with the payment details. We never take payments on this website.</p>
      </div>
    </div>
  </section>
  <section class="section cta-final" aria-labelledby="cta-h">
    <div class="container">
      <h2 id="cta-h" class="reveal">Ready for step one?</h2>
      <p class="reveal">Send a short message. We reply within 24 hours.</p>
      <div class="btn-row reveal"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="start.html">Start your project</a></div>
    </div>
  </section>
</main>''')

# ---------------------------------------------------------------- Free concept (landing page for DMs: no site menu)
P = ''
page('free-concept.html', 'Get a free website concept: Black Crest Web Designs', 'We design your new homepage for free. No deposit, no obligation. Reply within 24 hours.', f'''<main id="main" class="landing">
  <div class="container">
    <div class="landing-head">{brand(P)}</div>
    <h1 class="reveal">Get a free concept for your website.</h1>
    <ul class="ticks reveal d1">
      <li>We design your new homepage for free.</li>
      <li>No deposit and no obligation.</li>
      <li>We reply within 24 hours.</li>
    </ul>
    <div class="tile reveal d2">
      {form_open('free-concept', 'Black Crest: free concept request', P)}
        {field('business', 'Business name', required=True, auto='organization', empty='Please tell us your business name.')}
        {field('trade', 'What you do', required=True, placeholder='For example: barbershop in Brunswick', empty='Please tell us what your business does.')}
        {field('contact', 'Email or phone', required=True, auto='email', contact=True, empty='Please add an email address or phone number so we can reply.')}
        {form_close('Get my free concept', P)}
    </div>
    <p class="back"><a class="text-link" href="index.html">Visit the main Black Crest site {icon('arrow')}</a></p>
  </div>
</main>''', noindex=True, bare=True)

# ---------------------------------------------------------------- Start your project
P = ''
page('start.html', 'Start your project: Black Crest Web Designs', 'Tell us about your business so we can design your free concept homepage: your trade, suburb, hours, services, colours and links.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow reveal">Start your project</p>
    <h1 class="reveal d1">Tell us about your business.</h1>
    <p class="lead reveal d2">The more you share, the closer your free concept will be. Only the first four boxes are needed. We reply within 24 hours.</p>
  </div>
  <section class="container narrow" aria-label="Project details">
    <div class="tile reveal">
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
        <div class="field">
          <label for="package">Which package are you thinking of? <span class="hint">(optional)</span></label>
          <select id="package" name="package"><option>Not sure yet</option><option>One Page ({money(ONE)})</option><option>Full Website ({money(FULL)})</option><option>Custom (by quote)</option></select>
        </div>
        {field('message', 'Anything else', textarea=True)}
        {form_close('Send my details', P)}
    </div>
  </section>
  <div style="height:80px"></div>
</main>''')

# ---------------------------------------------------------------- Care plan
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
    <p class="eyebrow reveal">Care plan</p>
    <h1 class="reveal d1">We look after it. You run your business.</h1>
    <p class="lead reveal d2">Optional, month to month, and you can cancel any time.</p>
  </div>
  <section class="container" aria-labelledby="cover-h">
    <div class="grid grid-2">
      <div class="tile reveal">
        <p class="tile-label"><span>Care plan</span><span class="chip">Optional</span></p>
        <p class="balance"><span data-price="carePlan" data-count="{CARE}">{money(CARE)}</span> <span class="per">a month</span></p>
        <h2 id="cover-h" class="sr-only">What it covers</h2>
        <ul class="ticks" style="margin-top:20px">{''.join(f'<li><strong>{t}.</strong> {x}</li>' for t, x in COVER)}</ul>
      </div>
      <div class="tile reveal d1">
        <h2 style="font-size:30px">What it does not cover</h2>
        <ul style="margin-top:16px;color:var(--silver-2)">{''.join(f'<li>{x}</li>' for x in NOT_COVER)}</ul>
        <p class="muted small" style="margin-top:16px">Not on the care plan? You can still ask for changes at any time. We quote them fairly first.</p>
      </div>
    </div>
  </section>
  <section class="section" aria-labelledby="req-h">
    <div class="container narrow">
      {section_head('Request a change', '<span id="req-h">Need something updated?</span>', 'Tell us what to change. We confirm by email before we do it.')}
      <div class="tile reveal">
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

# ---------------------------------------------------------------- Trade pages
TRADE_PAGES = {
    'for-barbers.html': ('barber', 'Barbers', 'Websites for barbers.', 'A sharp site that turns a quick search into a booked chair.', [
        ('People decide on their phone', 'Most people pick a barber on their phone, often minutes before they want a cut. Clear prices and a booking button make the choice easy.'),
        ('Instagram is not enough', 'Your feed shows your work, but not your prices, hours or where to park. A website puts it all in one place.'),
        ('Fewer calls while you cut', 'A booking link on your own site means fewer calls and DMs while you are with a client.')],
        ['Booking button that links to the app you already use', 'Price list for every cut and shave', 'Gallery of your cuts', 'Opening hours, address and a map', 'One-tap call and directions']),
    'for-cafes.html': ('cafe', 'Cafes', 'Websites for cafes.', 'Your menu, hours and location, easy to find and quick to load.', [
        ('People check before they come', 'Before a visit, people look up your hours and menu. If they cannot find them, they often go somewhere else.'),
        ('Your menu, always current', 'A menu on your own site is easy to update, and easy to read on a phone. No blurry photo of a board.'),
        ('Works with Google', 'Your website and your free Google Business Profile work together, so the right details show in Search and Maps.')],
        ['Menu that is easy to update', 'Opening hours, including public holidays', 'Map and directions', 'Link to online ordering, if you use it', 'Photos of your food and space']),
    'for-gyms.html': ('gym', 'Gyms', 'Websites for gyms.', 'Timetables, memberships and a clear way to try a class.', [
        ('Answer the first questions', 'New members want to know the classes, the times and the cost. A good site answers all three before they ask.'),
        ('Make trying easy', 'A simple free-trial or visit form turns interest into a first session.'),
        ('Show the space', 'Photos of your floor, equipment and coaches help people picture themselves training with you.')],
        ['Class timetable', 'Membership options and prices', 'Free-trial or visit form', 'Coach profiles', 'Location, parking and hours']),
    'for-tradies.html': ('plumber', 'Tradies', 'Websites for tradies.', 'Get the call, win the quote, look like the professional you are.', [
        ('Customers check you out first', 'Before they call, most people look you up. A clean site with your services and areas builds trust fast.'),
        ('Make calling easy', 'A big call button and a short quote form mean more enquiries from people on the go.'),
        ('Show where you work', 'Listing the suburbs you cover helps the right customers find you, and saves you from calls outside your area.')],
        ['Quote request form', 'One-tap call button', 'Services and the suburbs you cover', 'Gallery of your jobs', 'Licence and insurance details']),
    'for-salons.html': ('salon', 'Salons', 'Websites for salons.', 'A calm, beautiful site with your services, prices and bookings.', [
        ('Clients want to see prices', 'A clear service menu with prices helps clients choose, and cuts down on questions.'),
        ('Booking at any hour', 'A booking button that links to your booking app lets clients book at night, when you are closed.'),
        ('Your work sells itself', 'A gallery of your work and your stylists shows clients what to expect before they walk in.')],
        ['Service menu with prices', 'Booking button that links to your booking app', 'Gallery of your work', 'Stylist profiles', 'Gift vouchers, if you sell them']),
}
for path, (slug, trade, h1, lead, reasons, feats) in TRADE_PAGES.items():
    P = ''
    d = DEMO[slug]
    rs = ''.join(f'<article class="tile tilt reveal d{i}"><h3>{t}</h3><p class="muted">{x}</p></article>' for i, (t, x) in enumerate(reasons))
    page(path, f'{h1[:-1]} in Melbourne: Black Crest Web Designs', f'{lead} Websites for {trade.lower()} in Melbourne and its suburbs. One Page {money(ONE)}, Full Website {money(FULL)}, free concept first.', f'''<main id="main">
  <div class="container page-head">
    <p class="eyebrow reveal">For {trade.lower()}</p>
    <h1 class="reveal d1">{h1}</h1>
    <p class="lead reveal d2">{lead} We work with {trade.lower()} across Melbourne and its suburbs.</p>
    <div class="btn-row reveal d3" style="margin-top:28px"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="pricing.html">See pricing</a></div>
  </div>
  <section class="section" aria-labelledby="why-h">
    <div class="container">
      {section_head('Why it matters', f'<span id="why-h">Why {trade.lower()} need a good website.</span>')}
      <div class="grid grid-3">{rs}</div>
    </div>
  </section>
  <section class="section" aria-labelledby="feat-h">
    <div class="container">
      <div class="grid grid-2" style="align-items:center">
        <div class="reveal">
          <p class="eyebrow">What you usually need</p>
          <h2 id="feat-h">The features that matter.</h2>
          <ul class="ticks" style="margin-top:24px">{''.join(f'<li>{x}</li>' for x in feats)}</ul>
          <p class="muted" style="margin-top:22px">Every site also comes with writing help, a contact form, Google basics and HTTPS.</p>
        </div>
        <div class="reveal d1" style="max-width:360px;justify-self:center;width:100%">{demo_card(d, P)}</div>
      </div>
    </div>
  </section>
  <section class="section cta-final" aria-labelledby="cta-h">
    <div class="container">
      <h2 id="cta-h" class="reveal">See your site before you pay.</h2>
      <p class="reveal">We design a free concept homepage for your business. No deposit, no obligation.</p>
      <div class="btn-row reveal"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="work.html">See all concept sites</a></div>
    </div>
  </section>
</main>''')

# ---------------------------------------------------------------- FAQ
P = ''
page('faq.html', 'Questions: Black Crest Web Designs', 'Answers about cost, timing, who owns the site, changes, domain and hosting, deposits, the free concept and the care plan.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow reveal">FAQ</p>
    <h1 class="reveal d1">Questions, answered.</h1>
    <p class="lead reveal d2">Plain answers about cost, timing and how we work. Something else? <a class="text-link" href="contact.html">Ask us</a>.</p>
  </div>
  <section class="container narrow reveal" aria-label="Questions">{faq_list(FAQS, P)}</section>
  <section class="section cta-final" aria-labelledby="cta-h">
    <div class="container">
      <h2 id="cta-h" class="reveal">Still deciding?</h2>
      <p class="reveal">A free concept is the easiest way to see if we are a good fit.</p>
      <div class="btn-row reveal"><a class="btn btn-gold" href="free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="contact.html">Ask a question</a></div>
    </div>
  </section>
</main>''', ld=[faq_ld()])

# ---------------------------------------------------------------- About
P = ''
page('about.html', 'About: Black Crest Web Designs', 'Black Crest Web Designs makes premium websites for local businesses in Melbourne. Plain English, clear prices, and you own your site. A KB Ventures company.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow reveal">About</p>
    <h1 class="reveal d1">Quality websites, without the agency price.</h1>
    <p class="lead reveal d2">Black Crest Web Designs makes fast, good-looking websites for local businesses in Melbourne: the barbers, cafes, gyms, salons and tradies that keep a suburb going.</p>
  </div>
  <section class="section" aria-labelledby="stand-h">
    <div class="container">
      {section_head('What we stand for', '<span id="stand-h">Three things we do not compromise on.</span>')}
      <div class="grid grid-3">
        <article class="tile tilt reveal">{tile_icon('chat')}<h3>Plain English</h3><p class="muted">No jargon and no hard sell. You always know what you are paying for and why.</p></article>
        <article class="tile tilt reveal d1">{tile_icon('spark')}<h3>Well made</h3><p class="muted">Fast, secure, easy to use on a phone, and built to last. We sweat the details so your customers do not notice them.</p></article>
        <article class="tile tilt reveal d2">{tile_icon('key')}<h3>Yours</h3><p class="muted">You own the finished site and your domain. No lock-in contracts, ever.</p></article>
      </div>
    </div>
  </section>
  <section class="section" aria-labelledby="how-h">
    <div class="container narrow">
      {section_head('How we work', '<span id="how-h">See it first. Decide after.</span>', 'We design your homepage for free before you pay anything. If you like it, a 50% deposit starts the build and the balance is due at launch. Two rounds of changes are included.')}
      <p class="reveal"><a class="text-link" href="process.html">The full process {icon('arrow')}</a></p>
    </div>
  </section>
  <section class="section" aria-labelledby="prom-h">
    <div class="container narrow">
      {section_head('Our promises', '<span id="prom-h">What you can hold us to.</span>')}
      <ul class="ticks reveal">
        <li>A free concept homepage before you pay anything.</li>
        <li>Clear prices, set before we start. No hidden costs.</li>
        <li>A reply within 24 hours.</li>
        <li>No lock-in contracts.</li>
        <li>You own your site and your domain.</li>
        <li>No fake reviews or made-up numbers. We show concept sites and will earn real reviews.</li>
      </ul>
    </div>
  </section>
  <section class="section" aria-labelledby="kb-h">
    <div class="container narrow">
      <div class="tile reveal">
        <p class="eyebrow">A KB Ventures company</p>
        <h2 id="kb-h">Part of something bigger.</h2>
        <p class="muted" style="margin-top:14px">Black Crest Web Designs is a brand of KB Ventures, a Melbourne company that starts and runs small businesses to one standard: clear, fair and well made.</p>
        <a class="text-link" href="{KB_SITE}">Visit KB Ventures {icon('arrow')}</a>
      </div>
    </div>
  </section>
</main>''', ld=[ORG])

# ---------------------------------------------------------------- Quiz
P = ''
QUIZ = [
    ('Do you have your own website, not just social media pages?', 'yes', 'Get your own website. Social pages are useful, but you do not control them, and they rarely show your prices or hours clearly.'),
    ('Does your website load in a few seconds on your phone?', 'yes', 'Make it faster. Smaller images and a lighter site fix most slow pages, and people leave slow pages quickly.'),
    ('Can someone call, book or get directions with one tap from your homepage?', 'yes', 'Add one-tap buttons to call, book and get directions near the top of your homepage.'),
    ('Are your prices, or a price guide, on your website?', 'yes', 'Show your prices, or at least a guide. It answers the first question most people have.'),
    ('Are your opening hours and address correct everywhere online, including Google?', 'yes', 'Check your hours and address on your site and your Google Business Profile, including public holidays.'),
    ('Does your website show recent photos of your work, shop or team?', 'yes', 'Add recent, real photos. They build trust faster than stock images.'),
]
qs = ''.join(f'''<fieldset data-tip="{E(tip)}"><legend><span>Question {i + 1} of {len(QUIZ)}</span>{q}</legend>
          <div class="yn"><label class="choice"><input type="radio" name="q{i}" value="{'good' if good == 'yes' else 'bad'}"> Yes</label><label class="choice"><input type="radio" name="q{i}" value="{'good' if good == 'no' else 'bad'}"> No</label></div></fieldset>''' for i, (q, good, tip) in enumerate(QUIZ))
page('quiz.html', 'Is your website costing you customers? A 1-minute quiz', 'Six quick yes or no questions to check if your website is costing you customers, with simple advice. Nothing is stored or sent.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow reveal">Website quiz</p>
    <h1 class="reveal d1">Is your website costing you customers?</h1>
    <p class="lead reveal d2">Six quick yes or no questions. Your answers stay on this page: nothing is stored or sent.</p>
  </div>
  <section class="container narrow" aria-label="Quiz">
    <form class="quiz reveal" id="quiz" novalidate>
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
      <a class="btn btn-gold" id="quiz-review" href="contact.html#review">Get a free mini review</a>
    </div>
  </section>
  <div style="height:96px"></div>
</main>''')

# ---------------------------------------------------------------- Guides
GUIDES = [
    ('barber-website-checklist.html', '5 things every barber website needs', 'Five simple things that turn a barber website into booked chairs: booking, prices, real photos, hours and speed.', '''
      <p>A barber website has one job: help someone who wants a cut today pick you and book. Most people find a barber on their phone, so every one of these is about making that quick.</p>
      <h2>1. A booking button you cannot miss</h2>
      <p>Put a <strong>Book now</strong> button at the top of every page, linking to the booking app you already use. On a phone, keep it in easy reach of the thumb. If you take walk-ins, say so clearly too.</p>
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
    ('cafe-google-business-profile.html', 'Why your cafe needs a Google Business Profile', 'What a Google Business Profile is, why it matters for cafes, and how to set one up and keep it useful.', '''
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
    ('small-business-website-cost.html', 'How much should a small business website cost?', 'An honest look at what a small business website costs in Australia: DIY builders, freelancers and agencies, what changes the price, and the ongoing costs.', '''
      <p>The honest answer is: it depends on what you need. A one-page site for a local barber is a very different job to an online shop with hundreds of products. Here is how the main options compare, and what to ask before you pay anyone.</p>
      <h2>Your three main options</h2>
      <h3>Do it yourself with a website builder</h3>
      <p>Builders like Wix and Squarespace charge a monthly subscription. The real cost is your time: you do the design, the writing and the setup. Your site also lives on their platform, so leaving usually means rebuilding.</p>
      <h3>A freelancer or small studio</h3>
      <p>Prices vary widely, from a few hundred dollars to several thousand. Ask exactly what is included, how many changes you get, and who owns the site at the end.</p>
      <h3>An agency</h3>
      <p>Agencies often charge $3,000 or more for a small business site. This is a typical market range and prices vary. You usually get a team, a longer process, and more meetings.</p>
      <h2>What changes the price</h2>
      <ul><li><strong>Number of pages.</strong> One page costs less than ten.</li><li><strong>Features.</strong> Booking, online ordering or a shop add work.</li><li><strong>Writing and photos.</strong> Someone has to write the words and supply good images.</li><li><strong>Changes.</strong> More rounds of changes means more time.</li></ul>
      <h2>Ongoing costs</h2>
      <ul><li><strong>Domain name:</strong> about $20 a year for most addresses. It should be registered in your name.</li><li><strong>Hosting:</strong> anything from free to a monthly fee, depending on the site and the host.</li><li><strong>Updates:</strong> either your own time, or a care plan with whoever built the site.</li></ul>
      <h2>Questions to ask before you pay</h2>
      <ul><li>Who owns the finished site and the domain?</li><li>What exactly is included, and what costs extra?</li><li>How many rounds of changes do I get?</li><li>Are there ongoing fees, and can I cancel?</li><li>Can I see the design before I pay?</li></ul>
      <h2>Where Black Crest sits</h2>
      <p>Our One Page sites are {ONE_P}, a Full Website (up to about 5 pages) is {FULL_P}, and the care plan is optional at {CARE_P} a month. You see a free concept homepage before you pay anything, and you own the finished site. See our <a href="../pricing.html">pricing</a> for the details.</p>'''),
]
for slug, title, desc, body in GUIDES:
    P = '../'
    body = body.replace('{ONE_P}', money(ONE)).replace('{FULL_P}', money(FULL)).replace('{CARE_P}', money(CARE))
    art = {'@context': 'https://schema.org', '@type': 'Article', 'headline': title, 'description': desc, 'url': SITE + 'guides/' + slug, 'image': SITE + 'img/og.jpg',
           'publisher': {'@id': SITE + '#business', '@type': 'ProfessionalService', 'name': 'Black Crest Web Designs'}, 'author': {'@type': 'Organization', 'name': 'Black Crest Web Designs'}}
    page('guides/' + slug, f'{title}: Black Crest guides', desc, f'''<main id="main">
  <article class="container prose">
    <header class="page-head" style="padding-bottom:16px">
      <p class="eyebrow"><a class="crumb" href="./">Guides</a></p>
      <h1 style="font-size:clamp(38px,7vw,62px)">{title}</h1>
      <p class="byline">Black Crest Web Designs</p>
    </header>
    {body}
    <div class="tile callout">
      <h2 style="margin:0 0 10px;font-size:30px">Want a hand with yours?</h2>
      <p>We design a free concept homepage for your business, so you can see it before you pay.</p>
      <div class="btn-row"><a class="btn btn-gold" href="../free-concept.html">Get a free concept</a><a class="btn btn-ghost" href="./">More guides</a></div>
    </div>
  </article>
</main>''', ld=[art])
P = '../'
page('guides/index.html', 'Guides for local business websites: Black Crest', 'Short, practical guides for local businesses: what a barber website needs, Google Business Profiles for cafes, and what a website should cost.', f'''<main id="main">
  <div class="container page-head">
    <p class="eyebrow reveal">Guides</p>
    <h1 class="reveal d1">Short, useful guides.</h1>
    <p class="lead reveal d2">Plain-English advice for local businesses. No jargon, no made-up numbers.</p>
  </div>
  <section class="container" aria-label="Guides">
    <div class="grid grid-3">{''.join(f'<article class="tile tilt reveal d{i}"><p class="tile-label"><span>Guide</span></p><h2 style="font-size:28px">{t}</h2><p class="muted" style="margin-top:12px">{d}</p><a class="text-link" href="{s}">Read the guide {icon("arrow")}<span class="sr-only">: {t}</span></a></article>' for i, (s, t, d, _) in enumerate(GUIDES))}</div>
  </section>
  <div style="height:96px"></div>
</main>''')

# ---------------------------------------------------------------- Contact
P = ''
needs = ''.join(f'<label class="choice"><input type="radio" name="need" value="{v}"{" checked" if v == "Not sure" else ""}> {v}</label>' for v in ['One Page', 'Full Website', 'Care plan', 'Not sure'])
page('contact.html', 'Contact: Black Crest Web Designs', 'Ask a question or request a quote. We reply within 24 hours. Based in Melbourne, Australia.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow reveal">Contact</p>
    <h1 class="reveal d1">Get in touch.</h1>
    <p class="lead reveal d2">Tell us what you need. We reply within 24 hours.</p>
    <div class="btn-row reveal d3" style="margin-top:24px">
      <a class="btn btn-ghost" data-email href="mailto:{EMAIL}">{icon('mail')} Email {EMAIL}</a>
      <a class="btn btn-ghost" data-call href="#" hidden>{icon('call')} Call us</a>
    </div>
  </div>
  <section class="container narrow" aria-label="Contact form">
    <div class="tile reveal">
      {form_open('contact', 'Black Crest: contact form message', P)}
        <input type="hidden" name="quote" value="">
        <p class="prefill" id="prefill-note" hidden></p>
        <fieldset class="choice-grid"><legend>What do you need?</legend>{needs}</fieldset>
        <div class="form-row">
          {field('name', 'Your name', required=True, auto='name', empty='Please enter your name.')}
          {field('email', 'Email', 'email', required=True, auto='email', empty='Please enter your email address.')}
        </div>
        {field('message', 'Message', required=True, textarea=True, empty='Please write a short message.')}
        {form_close('Send message', P)}
    </div>
    <p class="muted small" style="margin-top:20px">Based in Melbourne, Australia. We work with businesses across Melbourne and its suburbs.</p>
  </section>
  <div style="height:80px"></div>
</main>''')

# ---------------------------------------------------------------- Thank you
P = ''
page('thank-you.html', 'Thank you: Black Crest Web Designs', 'Thanks for your message. Here is what happens next.', f'''<main id="main">
  <div class="container page-head narrow">
    <p class="eyebrow">Message sent</p>
    <h1>Thank you. We have your message.</h1>
    <p class="lead">Here is what happens next.</p>
  </div>
  <section class="container" aria-label="What happens next">
    <ol class="steps">
      <li class="tile"><span class="num">01</span><h2 style="font-size:26px">We reply within 24 hours</h2><p class="muted">By email, or by phone if you asked us to call.</p></li>
      <li class="tile"><span class="num">02</span><h2 style="font-size:26px">We ask a few questions</h2><p class="muted">Only what we need to design your free concept or answer your question.</p></li>
      <li class="tile"><span class="num">03</span><h2 style="font-size:26px">You see it, then decide</h2><p class="muted">No deposit and no obligation until you say yes.</p></li>
    </ol>
    <div class="btn-row" style="margin:36px 0 96px"><a class="btn btn-gold" href="work.html">See our concept sites</a><a class="btn btn-ghost" href="index.html">Back to home</a></div>
  </section>
</main>''', noindex=True)

# ---------------------------------------------------------------- QR (printable)
P = ''
page('qr.html', 'Printable QR code: Black Crest Web Designs', 'A printable QR code that opens the Black Crest free concept page.', f'''<main id="main">
  <div class="container page-head">
    <div class="qr-sheet">
      <div style="display:flex;justify-content:center">{brand(P)}</div>
      <h1 style="font-size:clamp(36px,7vw,56px);margin-top:28px">Scan for a free website concept.</h1>
      <div class="qr-code"><img src="img/qr-free-concept.svg" width="320" height="320" alt="QR code that opens the Black Crest free concept page"></div>
      <p class="muted">Or visit:<br><span style="word-break:break-all">{SITE}free-concept.html</span></p>
      <div class="btn-row no-print" style="justify-content:center;margin-top:24px"><button class="btn btn-gold" type="button" data-print>Print this page</button></div>
    </div>
  </div>
</main>''', noindex=True)

# ---------------------------------------------------------------- Privacy and terms
P = ''
page('privacy.html', 'Privacy policy: Black Crest Web Designs', 'How Black Crest Web Designs (a KB Ventures company) handles your information. No cookies, no tracking, no analytics.', f'''<main id="main">
  <article class="container prose">
    <header class="page-head" style="padding-bottom:8px"><p class="eyebrow">Legal</p><h1>Privacy policy</h1><p class="byline">Last updated 30 October 2026</p></header>
    <p>Black Crest Web Designs is a brand of KB Ventures, based in Melbourne, Australia. This policy explains, in plain English, what we collect and what we do with it. "We" and "us" mean Black Crest Web Designs and KB Ventures.</p>
    <h2>What we collect</h2>
    <p>Only what you choose to send us through a form or by email: for example your name, business name, email address, phone number and the details of your project.</p>
    <h2>How we use it</h2>
    <ul><li>To reply to you and prepare your free concept or quote.</li><li>To build and look after your website if you become a customer.</li><li>To send invoices and keep the business records the law requires.</li></ul>
    <p>We do not sell your information, and we do not add you to a mailing list.</p>
    <h2>No cookies, no tracking</h2>
    <p>This website does not use cookies, analytics or advertising trackers. It uses your browser's session storage for two small things that never leave your device: remembering that you have seen the opening animation, and carrying your price-calculator choices to the contact form. Both are cleared when you close the tab.</p>
    <h2>Services we use</h2>
    <ul><li><strong>Web3Forms</strong> delivers our website forms to our email inbox.</li><li><strong>GitHub Pages</strong> hosts this website. Like most hosts, it may record basic technical information such as your IP address to keep the service secure.</li></ul>
    <p>Some of these services may store information outside Australia.</p>
    <h2>Seeing, correcting or deleting your information</h2>
    <p>Email <a data-email href="mailto:{EMAIL}">{EMAIL}</a> to ask what we hold about you, or to correct or delete it. We reply within 30 days.</p>
    <h2>The Australian Privacy Principles</h2>
    <p>We aim to follow the Australian Privacy Principles in the <em>Privacy Act 1988</em> (Cth). If you are unhappy with how we handled your information, email us first. If we cannot fix it, you can contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au/" rel="noopener">oaic.gov.au</a>.</p>
    <div style="height:96px"></div>
  </article>
</main>''')
page('terms.html', 'Terms: Black Crest Web Designs', 'The plain-English terms for working with Black Crest Web Designs: free concept first, 50% deposit, balance at launch, 2 rounds of changes, and you own your site.', f'''<main id="main">
  <article class="container prose">
    <header class="page-head" style="padding-bottom:8px"><p class="eyebrow">Legal</p><h1>Terms</h1><p class="byline">Last updated 30 October 2026</p></header>
    <p>These are the terms for websites made by Black Crest Web Designs, a brand of KB Ventures, Melbourne, Australia. We have kept them short and plain. Your written quote sets out the exact price and what is included for your project.</p>
    <h2>1. The free concept</h2>
    <p>We design a concept homepage for you free of charge. You are under no obligation to go ahead, and you owe nothing if you do not.</p>
    <h2>2. Quote and deposit</h2>
    <p>If you want to go ahead, we email you a written quote. A <strong>50% deposit</strong> starts the build. We send an invoice with the payment details by email. We do not take payments on this website.</p>
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
    <p>The care plan is optional and billed monthly at {money(CARE)} a month. It is month to month with no lock-in: email us before your next month starts to cancel. What it covers is listed on the <a href="care-plan.html">care plan page</a>.</p>
    <h2>9. Your rights</h2>
    <p>Nothing in these terms limits your rights under the Australian Consumer Law.</p>
    <h2>Questions</h2>
    <p>Email <a data-email href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    <div style="height:96px"></div>
  </article>
</main>''')

# ---------------------------------------------------------------- 404
P = ''
page('404.html', 'Page not found: Black Crest Web Designs', 'This page could not be found.', f'''<main id="main" class="nf">
  <div class="container">
    <p class="code">4<span>0</span>4</p>
    <h1 style="font-size:clamp(34px,6vw,52px);margin-top:16px">This page could not be found.</h1>
    <p class="lead" style="margin-top:14px">It may have moved. These will get you back on track.</p>
    <div class="btn-row"><a class="btn btn-gold" href="index.html">Go to the home page</a><a class="btn btn-ghost" href="pricing.html">See pricing</a></div>
  </div>
</main>''', noindex=True, base_script=True)

# ================================================================= write files
for path, content in pages.items():
    out = os.path.join(SITE_DIR, path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write(content)

SKIP = {'free-concept.html', 'thank-you.html', '404.html', 'qr.html'}
urls = [p for p in pages if p not in SKIP]
with open(os.path.join(SITE_DIR, 'sitemap.xml'), 'w', encoding='utf-8') as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for p in urls:
        loc = SITE + ('' if p == 'index.html' else p.replace('index.html', ''))
        fh.write(f'  <url><loc>{loc}</loc><lastmod>2026-10-30</lastmod></url>\n')
    fh.write('</urlset>\n')
with open(os.path.join(SITE_DIR, 'robots.txt'), 'w', encoding='utf-8') as fh:
    fh.write(f'User-agent: *\nDisallow: /3D-demo-sites/black-crest-site/free-concept.html\nDisallow: /3D-demo-sites/black-crest-site/thank-you.html\n\nSitemap: {SITE}sitemap.xml\n')
with open(os.path.join(SITE_DIR, 'manifest.webmanifest'), 'w', encoding='utf-8') as fh:
    json.dump({'name': 'Black Crest Web Designs', 'short_name': 'Black Crest', 'description': 'Premium sites for local businesses.', 'lang': 'en-AU',
               'start_url': './', 'scope': './', 'display': 'standalone', 'background_color': '#0D0E12', 'theme_color': '#0D0E12',
               'icons': [{'src': 'img/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                         {'src': 'img/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                         {'src': 'img/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}, fh, indent=2)
print('built', len(pages), 'pages:', ', '.join(pages))
