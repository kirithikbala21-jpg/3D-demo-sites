# Builds the static copies of the site's pages from site.config.json: Home, Businesses, How we work, FAQ, Partner,
# About, Contact and the 404 page (plus its copy at the repo root). The live pages also read the config in the browser
# (site.js and main.js), so a config edit shows up at once; run this afterwards so the HTML copy that search engines,
# share previews and visitors without JavaScript see (and the FAQ structured data) matches it:
#   python3 kbventures-site/tools/build-pages.py
# The legal pages in legal/ are written by hand and are not touched.
import html
import json
import os
import re

SITE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(SITE_DIR)
cfg = json.load(open(os.path.join(SITE_DIR, 'site.config.json'), encoding='utf-8'))
SITE = cfg['siteUrl']
E = html.escape
C = cfg['company']


def fill(s):
    return s.replace('{name}', C['name']).replace('{location}', C['location']).replace('{email}', C['email'])


def head(title, desc, path, extra='', scripts=(), lenis=True, noindex=False, base_script=False, P=''):
    canon = SITE + path
    ogalt = 'KB Ventures logo. Study guides and websites, made in Melbourne.'
    s = ['<!doctype html>', '<html lang="en-AU">', '<head>', '<meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">']
    late = [f'<link rel="icon" href="{P}img/kb-favicon.svg" type="image/svg+xml">', f'<link rel="icon" href="{P}favicon.ico" sizes="32x32">',
            f'<link rel="icon" href="{P}img/icon-192.png" type="image/png" sizes="192x192">', f'<link rel="icon" href="{P}img/icon-512.png" type="image/png" sizes="512x512">',
            f'<link rel="apple-touch-icon" href="{P}apple-touch-icon.png" sizes="180x180">',
            f'<link rel="preload" href="{P}fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin>', f'<link rel="stylesheet" href="{P}styles.css">']
    if base_script:
        # the 404 page: files are only requested once <base> is set, so nothing is fetched from the wrong folder first
        writes = '\n'.join("    document.write('%s');" % x for x in late)
        s.append('''<script>
  // A 404 page can be shown at any address, so every link and file below is loaded from the site's own folder.
  // On the live site that is basePath in site.config.json; keep BASE equal to it (it becomes "/" on a custom domain).
  (function () {
    var BASE = '%s';
    var m = location.pathname.match(/^(.*\\/kbventures-site\\/)/);
    document.write('<base href="' + (m ? m[1] : BASE) + '">');
%s
  })();
</script>''' % (cfg['basePath'], writes))
    s += [f'<title>{E(title)}</title>', f'<meta name="description" content="{E(desc)}">',
          '<meta name="theme-color" content="#0D0E12">', '<meta name="color-scheme" content="dark">']
    s.append('<meta name="robots" content="noindex">' if noindex else f'<link rel="canonical" href="{canon}">')
    s += ['<meta property="og:type" content="website">', '<meta property="og:site_name" content="KB Ventures">', '<meta property="og:locale" content="en_AU">',
          f'<meta property="og:title" content="{E(title)}">', f'<meta property="og:description" content="{E(desc)}">',
          f'<meta property="og:url" content="{canon}">', f'<meta property="og:image" content="{SITE}og.jpg">',
          '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">', '<meta property="og:image:type" content="image/jpeg">',
          f'<meta property="og:image:alt" content="{ogalt}">', '<meta name="twitter:card" content="summary_large_image">',
          f'<meta name="twitter:title" content="{E(title)}">', f'<meta name="twitter:description" content="{E(desc)}">',
          f'<meta name="twitter:image" content="{SITE}og.jpg">', f'<meta name="twitter:image:alt" content="{ogalt}">']
    if not base_script:
        s += late
    if extra:
        s.append(extra)
    s.append("<script>document.documentElement.classList.add('js');</script>")
    if lenis:
        s.append(f'<script src="{P}vendor/lenis-1.1.18.min.js" defer></script>')
    if not base_script:
        s.append(f'<script src="{P}site.js" defer></script>')
    s += list(scripts)
    s.append('</head>')
    return '\n'.join(s)


def header_fallback(P='', images=True):
    home = P or './'
    brand = (f'<span class="wm brand-word"><img src="{P}img/kb-wordmark.svg" width="360" height="120" alt=""></span><img class="brand-mark" src="{P}img/kb-favicon.svg" width="32" height="32" alt=""><span class="sr-only">KB Ventures home</span>'
             if images else 'KB Ventures')
    return f'''<a class="skip" href="#main">Skip to content</a>
<!-- site.js replaces this with the full top bar from site.config.json (this copy is what shows without JavaScript) -->
<header class="nav" id="site-header"><div class="container nav-inner"><a class="brand{'' if images else ' nav-link'}" href="{home}">{brand}</a><a class="nav-link nav-fallback" href="{P}contact.html">Contact</a></div></header>'''


def footer_fallback(P=''):
    links = [('businesses.html', 'Businesses'), ('about.html', 'About'), ('how-we-work.html', 'How we work'), ('faq.html', 'FAQ'), ('partner.html', 'Partner with us'),
             ('contact.html', 'Contact'), ('legal/privacy.html', 'Privacy'), ('legal/terms.html', 'Terms'), ('legal/refunds.html', 'Refunds')]
    return f'''<!-- site.js replaces this with the full footer from site.config.json -->
<footer class="footer" id="site-footer"><div class="container"><div class="footer-bottom">
  <p>{' &middot; '.join(f'<a href="{P}{h}">{t}</a>' for h, t in links)} &middot; <a href="mailto:{C['email']}">{C['email']}</a></p>
  <p>{E(fill(cfg['footer']['copyright']).replace('{year}', '2026'))}</p>
  <p>{E(cfg['footer']['vceTrademark'])}</p>
</div></div></footer>'''


ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>'
ICONS = {
    'Idea': '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
    'Build': '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 16.5 9 5 9-5"/>',
    'Launch': '<path d="M6 18 18 6"/><path d="M9 6h9v9"/>',
    'Run': '<path d="M20 12a8 8 0 0 1-13.7 5.7"/><path d="M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 2.5v4h-4"/><path d="M6 21.5v-4h4"/>',
    'Clear': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    'Fair': '<path d="M12 4v16M8 20h8M5 7h14"/><path d="m5 7-3 6a3 3 0 0 0 6 0L5 7Z"/><path d="m19 7-3 6a3 3 0 0 0 6 0l-3-6Z"/>',
    'Well made': '<path d="M12 3 4 6.5V12c0 4.4 3.4 8.1 8 9 4.6-.9 8-4.6 8-9V6.5L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    'pin': '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    'tag': '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7-8.3-8.3Z"/><circle cx="8" cy="8" r="1.4"/>',
    'refund': '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4.5h4.5"/><path d="m9 12.5 2 2 4-4.5"/>',
    'cross': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    'chat': '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-9l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
}


def icon(name):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICONS.get(name, ICONS["Well made"])}</svg>'


def text_link(href, path, label):
    return f'<a class="text-link" href="{href}"><span data-c="{path}">{E(label)}</span>{ARROW}</a>'


# ---------- business cards (the same markup main.js builds) ----------
def is_live(b):
    u = str(b.get('url', '')).strip()
    return b.get('status') == 'live' and (u.startswith('https://') or re.match(r'^[\w-]+\.html(#[\w-]+)?$', u) is not None)


def picture(b):
    size = b.get('imageSize') or [None, None]
    wh = f' width="{size[0]}" height="{size[1]}"' if size[0] else ''
    img = lambda src, alt, cls='': f'<img{cls} src="{src}"{wh} loading="lazy" decoding="async" alt="{E(alt or "")}">'
    if isinstance(b.get('image'), list):
        alts = b.get('imageAlt') or []
        imgs = '\n'.join('            ' + img(s, alts[i] if i < len(alts) else '', ' class="cover"') for i, s in enumerate(b['image'][:5]))
        return f'<div class="biz-visual">\n          <div class="cover-stack" data-parallax="14">\n{imgs}\n          </div>\n        </div>'
    if b.get('image'):
        if b.get('imageFrame') == 'browser':
            return f'<div class="biz-visual">\n          <div class="float-shot" data-parallax="18">\n            <div class="browser"><div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i></div>{img(b["image"], b.get("imageAlt"))}</div>\n          </div>\n        </div>'
        return f'<div class="biz-visual biz-plain">{img(b["image"], b.get("imageAlt"))}</div>'
    return '<div class="biz-visual"></div>'


def peek(b):
    """The "See inside" strip: three small previews (study guide covers, or the top of demo websites in a browser frame)."""
    pv = b.get('previews') or {}
    items = [x for x in pv.get('items', []) if x.get('src')][:3]
    if not items:
        return ''
    w, h = (pv.get('size') or [None, None])[:2]
    wh = f' width="{w}" height="{h}"' if w else ''
    browser = pv.get('frame') == 'browser'
    lis = []
    for x in items:
        img = f'<img src="{E(x["src"])}"{wh} loading="lazy" decoding="async" alt="{E(x.get("alt", ""))}">'
        lis.append(f'<li>{"<div class=" + chr(34) + "mini-browser" + chr(34) + "><i aria-hidden=" + chr(34) + "true" + chr(34) + "></i>" + img + "</div>" if browser else img}</li>')
    return f'''
          <div class="peek">
            <p class="peek-label">{E(pv.get('label') or 'See inside')}</p>
            <ul class="peek-row {'peek-browser' if browser else 'peek-cover'}">{''.join(lis)}</ul>
          </div>'''


def card(b, level='h3'):
    n = cfg['nav']
    live = is_live(b)
    tag, cls, href = ('a', 'biz-live', f' href="{E(b["url"])}"') if live else ('article', 'biz-soon', '')
    foot = f'<span class="biz-cta">{E(b.get("ctaLabel") or "Visit")}{ARROW}</span>' if live else f'<p class="quiet">{E(n["comingSoon"])}</p>'
    desc = f'\n            <p class="dim">{E(b["description"])}</p>' if b.get('description') else ''
    return f'''      <{tag} class="card biz {cls}"{href}>
        {picture(b)}
        <div class="biz-content">
          <p class="status"><span class="dot {'dot-live' if live else 'dot-soon'}" aria-hidden="true"></span><span>{E(n['live'] if live else n['comingSoon'])}</span></p>
          <div class="biz-body">
            <{level} class="card-title">{E(b['name'])}</{level}>{desc}
          </div>{peek(b)}
          <div class="biz-foot">{foot}</div>
        </div>
      </{tag}>'''


def more_card(level='h3'):
    t = cfg['home']['businesses']
    return f'''      <article class="card biz biz-soon biz-more">
        <div class="biz-visual"><span class="more-plus" aria-hidden="true"></span></div>
        <div class="biz-content"><div class="biz-body"><{level} class="card-title">{E(t['moreComing'])}</{level}></div></div>
      </article>'''


def biz_grid(always_more=False, level='h3'):
    cards = [card(b, level) for b in cfg['businesses'] if b.get('name')]
    if always_more or cfg.get('showMoreComingCard') is True:
        cards.append(more_card(level))
    more = ' data-more="always"' if always_more else ''
    more += f' data-level="{level}"' if level != 'h3' else ''
    return f'''    <!-- main.js rebuilds these cards from "businesses" in site.config.json; this copy shows when the config cannot load -->
    <div class="container biz-grid" id="biz-grid" data-count="{len(cards)}"{more}>
{chr(10).join(cards)}
    </div>'''


# ---------- FAQ ----------
def answer_html(f):
    rest, out = f['a'], ''
    links = [l for l in f.get('links', []) if l.get('text') and l.get('href')]
    while rest:
        hits = [(rest.find(l['text']), l) for l in links if rest.find(l['text']) >= 0]
        if not hits:
            out += E(rest)
            break
        i, l = min(hits, key=lambda h: h[0])
        out += E(rest[:i]) + f'<a href="{E(l["href"])}">{E(l["text"])}</a>'
        rest = rest[i + len(l['text']):]
    return out


def faq_box(n=0, prefix='f', level='h3'):
    items = cfg['faq'][:n] if n else cfg['faq']
    rows = []
    for i, f in enumerate(items, 1):
        rows.append(f'''        <div class="faq-item">
          <{level} class="faq-h"><button class="faq-q" type="button" id="faq-q-{prefix}{i}"><span>{E(f['q'])}</span><span class="faq-icon" aria-hidden="true"></span></button></{level}>
          <div class="faq-a" id="faq-a-{prefix}{i}" role="region" aria-labelledby="faq-q-{prefix}{i}"><div class="faq-a-inner"><p>{answer_html(f)}</p></div></div>
        </div>''')
    lv = f' data-level="{level}"' if level != 'h3' else ''
    return f'''      <div class="faq" data-faq="{n}"{lv}>
{chr(10).join(rows)}
      </div>'''


def faq_ld():
    return json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage',
                       'mainEntity': [{'@type': 'Question', 'name': f['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': f['a']}} for f in cfg['faq']]},
                      ensure_ascii=False, separators=(',', ':'))


def steps4():
    items = []
    for i, s in enumerate(cfg['process']):
        items.append(f'''        <li class="step-item">
          <span class="step-node" aria-hidden="true">{i + 1:02d}</span>
          <div class="card step-card">
            <span class="step-icon">{icon(s['title'])}</span>
            <h3 class="step-title" data-c="process.{i}.title">{E(s['title'])}</h3>
            <p class="dim"><span data-c="process.{i}.line">{E(s['line'])}</span> <span data-c="process.{i}.line2">{E(s.get('line2', ''))}</span></p>
          </div>
        </li>''')
    return '      <ol class="steps4 steps-big">\n' + '\n'.join(items) + '\n      </ol>'


def std_cards(detail=False):
    items = []
    for i, s in enumerate(cfg['standards']):
        more = f'\n          <p class="std-detail" data-c="standards.{i}.detail">{E(s["detail"])}</p>' if detail else ''
        items.append(f'''        <article class="card std-card">
          <span class="std-icon">{icon(s['title'])}</span>
          <h3 class="card-title" data-c="standards.{i}.title">{E(s['title'])}</h3>
          <p class="dim" data-c="standards.{i}.line">{E(s['line'])}</p>{more}
        </article>''')
    return '      <div class="std-grid">\n' + '\n'.join(items) + '\n      </div>'


def page(name, title, desc, body, data_page, scripts=('<script src="main.js" defer></script>',), extra='', **kw):
    h = head(title, desc, '' if name == 'index.html' else name, extra=extra, scripts=scripts, **kw)
    return f'{h}\n<body data-page="{data_page}">\n{header_fallback()}\n\n{body}\n\n{footer_fallback()}\n</body>\n</html>\n'


DIV = '  <div class="divider" aria-hidden="true"><span></span></div>'


def latest_section():
    lt = cfg['latest']
    cards = []
    for i, x in enumerate(lt['items']):
        link = f'\n          {text_link(E(x["link"]), f"latest.items.{i}.linkLabel", x.get("linkLabel") or "Find out more")}' if x.get('link') else ''
        date = f'<span class="latest-date" data-c="latest.items.{i}.date">{E(x["date"])}</span>' if x.get('date') else ''
        cards.append(f'''        <article class="card latest-card">
          <p class="latest-meta"><span class="label" data-c="latest.items.{i}.label">{E(x['label'])}</span>{date}</p>
          <p class="latest-text" data-c="latest.items.{i}.text">{E(x['text'])}</p>{link}
        </article>''')
    return f'''  <section class="section" id="latest" aria-labelledby="latest-title">
    <div class="container center">
      <h2 class="h2" id="latest-title" data-c="latest.title">{E(lt['title'])}</h2>
    </div>
    <div class="container latest-grid">
{chr(10).join(cards)}
    </div>
  </section>'''


def standard_points():
    items = []
    for i, x in enumerate(cfg['standardPoints']):
        items.append(f'''        <li class="why-item">
          <span class="step-icon">{icon(x.get('icon', ''))}</span>
          <h3 class="why-title" data-c="standardPoints.{i}.title">{E(x['title'])}</h3>
          <p class="dim" data-c="standardPoints.{i}.text">{E(x['text'])}</p>
        </li>''')
    return '      <ul class="why-grid std-points">\n' + '\n'.join(items) + '\n      </ul>'


def who_section():
    """Who's behind it: the founder (photo, or a KB monogram until there is one) with the short About line."""
    fd, wh, ha = cfg['founder'], cfg['who'], cfg['home']['about']
    photo = fd.get('photo') or ''
    # the photo is used once the file exists; until then a KB monogram fills the same round frame (never a broken image)
    if photo and os.path.isfile(os.path.join(SITE_DIR, photo)):
        inner = f'<img src="{E(photo)}" width="480" height="480" loading="lazy" decoding="async" alt="{E(fd.get("photoAlt", ""))}">'
    else:
        inner = '<span class="founder-mono" aria-hidden="true">KB</span>'
    return f'''  <section class="section section-founder" id="who" aria-labelledby="who-title">
    <div class="container center">
      <h2 class="h2" id="who-title" data-c="who.title">{E(wh['title'])}</h2>
    </div>
    <div class="container founder-grid">
      <div class="founder-photo" id="founder-photo">{inner}</div>
      <div class="founder-text">
        <h3 class="founder-name" data-c="founder.name">{E(fd['name'])}</h3>
        <p class="lead" data-c="founder.bio">{E(fd['bio'])}</p>
        <p class="who-about" data-c="home.about.text">{E(ha['text'])}</p>
        <p class="values" data-c="home.about.values">{E(ha['values'])}</p>
        <div class="who-actions">
          <a class="pill pill-secondary" href="about.html" data-c="who.moreLabel">{E(wh['moreLabel'])}</a>
          <a class="pill pill-primary" href="contact.html" data-c="who.contactLabel">{E(wh['contactLabel'])}</a>
        </div>
      </div>
    </div>
  </section>'''


def gallery(title_level='h3', item_level='h4'):
    """Concept sites: a scroll-snap row of the demo websites (made-up businesses), each opening in a new tab."""
    g = cfg['gallery']
    items = []
    for i, x in enumerate(g['items']):
        items.append(f'''        <li class="gallery-item">
          <a class="card gallery-card" href="{E(x['url'])}" target="_blank" rel="noopener">
            <div class="mini-browser"><i aria-hidden="true"></i><img src="{E(x['image'])}" width="640" height="400" loading="lazy" decoding="async" alt="{E(x['alt'])}"></div>
            <div class="gallery-text">
              <p class="label" data-c="gallery.items.{i}.label">{E(x['label'])}</p>
              <{item_level} class="gallery-name" data-c="gallery.items.{i}.name">{E(x['name'])}</{item_level}>
              <span class="gallery-open"><span data-c="gallery.open">{E(g['open'])}</span>{ARROW}<span class="sr-only"> <span data-c="gallery.newTab">{E(g['newTab'])}</span></span></span>
            </div>
          </a>
        </li>''')
    chev = lambda d: f'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="{d}"/></svg>'
    return f'''    <div class="container gallery" data-gallery>
      <div class="gallery-head">
        <{title_level} class="gallery-title" data-c="gallery.title">{E(g['title'])}</{title_level}>
        <p class="dim" data-c="gallery.lead">{E(g['lead'])}</p>
      </div>
      <ul class="gallery-track" tabindex="0" aria-label="{E(g['title'].rstrip('.'))}">
{chr(10).join(items)}
      </ul>
      <div class="gallery-controls">
        <button class="gallery-btn" type="button" data-dir="-1" aria-label="{E(g['prev'])}">{chev('M15 6l-6 6 6 6')}</button>
        <button class="gallery-btn" type="button" data-dir="1" aria-label="{E(g['next'])}">{chev('M9 6l6 6-6 6')}</button>
      </div>
    </div>'''


def signup_section():
    sg = cfg['signup']
    return f'''  <section class="section section-signup" id="updates" aria-labelledby="updates-title">
    <div class="container narrow center">
      <h2 class="h2" id="updates-title" data-c="signup.title">{E(sg['title'])}</h2>
      <p class="lead" data-c="signup.text">{E(sg['text'])}</p>
      <div class="signup-box" id="signup-box">
        <form class="signup-form" id="signup-form" novalidate>
          <div class="hp" aria-hidden="true"><label>Leave this box empty <input type="checkbox" id="s-botcheck" name="botcheck" tabindex="-1" autocomplete="off"></label></div>
          <input type="hidden" id="s-topic" name="topic" value="{E(sg['topic'])}">
          <div class="signup-row">
            <label class="sr-only" for="s-email" data-c="signup.emailLabel">{E(sg['emailLabel'])}</label>
            <input class="input" id="s-email" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" required placeholder="{E(sg['emailLabel'])}" aria-describedby="e-s-email">
            <button class="pill pill-primary send" type="submit" id="s-send"><span class="spinner" aria-hidden="true"></span><span class="btn-label" data-c="signup.button">{E(sg['button'])}</span></button>
          </div>
          <p class="field-error" id="e-s-email" hidden></p>
          <div class="check">
            <input id="s-agree" name="agree" type="checkbox" required aria-describedby="e-s-agree">
            <label for="s-agree"><span data-c="signup.agreeBefore">{E(sg['agreeBefore'])}</span> <a href="legal/privacy.html" target="_blank" rel="noopener"><span data-c="signup.agreeLink">{E(sg['agreeLink'])}</span><span class="sr-only"> (opens in a new tab)</span></a></label>
          </div>
          <p class="field-error" id="e-s-agree" hidden></p>
          <p class="form-status" id="s-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  </section>'''


def milestones():
    ms = cfg['milestones']
    items = ''.join(f'''
        <li><time class="ms-date" data-c="milestones.items.{i}.date">{E(x['date'])}</time><p data-c="milestones.items.{i}.text">{E(x['text'])}</p></li>''' for i, x in enumerate(ms['items']))
    return f'''      <h2 class="h2" data-c="milestones.title">{E(ms['title'])}</h2>
      <ol class="milestones">{items}
      </ol>'''


hm = cfg['home']
ld = {"@context": "https://schema.org", "@type": "Organization", "name": C['name'], "url": SITE, "email": C['email'],
      "logo": SITE + "img/icon-512.png", "description": f"{C['name']} is a Melbourne company that starts and runs businesses.",
      "sameAs": [v for v in cfg['socials'].values() if v]}

home_body = f'''<main id="main">
  <section class="hero" id="top" aria-labelledby="hero-title">
    <div class="container hero-grid">
      <div class="hero-text">
        <h1 class="hero-title" id="hero-title" data-c="company.tagline">{E(C['tagline'])}</h1>
        <p class="hero-intro" data-c="home.hero.intro">{E(hm['hero']['intro'])}</p>
        <p class="hero-sub" data-c="home.hero.line">{E(fill(hm['hero']['line']))}</p>
        <div class="hero-actions">
          <a class="pill pill-primary" href="#businesses" data-c="home.hero.primary">{E(hm['hero']['primary'])}</a>
          <a class="pill pill-secondary" href="contact.html" data-c="home.hero.secondary">{E(hm['hero']['secondary'])}</a>
        </div>
      </div>
      <div class="hero-stage" id="stage">
        <div class="spotlight" aria-hidden="true"></div>
        <img class="hero-still" src="img/hero-object.webp" width="1200" height="958" alt="A thin black glass card with a fine gold edge, carrying the KB Ventures mark" fetchpriority="high" decoding="async">
        <canvas id="scene" aria-hidden="true"></canvas>
      </div>
    </div>
  </section>

  <div class="divider divider-hero" aria-hidden="true"><span></span></div>

  <section class="section section-businesses" id="businesses" aria-labelledby="biz-title">
    <div class="watermark" aria-hidden="true">KB</div>
    <div class="container center">
      <h2 class="h2" id="biz-title" data-c="home.businesses.title">{E(hm['businesses']['title'])}</h2>
    </div>
{biz_grid()}
{gallery('h3', 'h4')}
    <div class="container section-foot">{text_link('businesses.html', 'home.businesses.viewAll', hm['businesses']['viewAll'])}</div>
  </section>

{DIV}

{latest_section()}

{DIV}

  <section class="section" id="how" aria-labelledby="build-title">
    <div class="container center">
      <h2 class="h2" id="build-title" data-c="home.build.title">{E(hm['build']['title'])}</h2>
    </div>
    <div class="container">
{steps4()}
      <div class="section-foot">{text_link('how-we-work.html', 'home.build.link', hm['build']['link'])}</div>
    </div>
  </section>

{DIV}

  <section class="section section-standard" id="standard" aria-labelledby="std-title">
    <div class="container center">
      <h2 class="h2" id="std-title" data-c="home.standard.title">{E(hm['standard']['title'])}</h2>
    </div>
    <div class="container">
{std_cards()}
{standard_points()}
    </div>
  </section>

{DIV}

{who_section()}

{DIV}

  <section class="section" id="questions" aria-labelledby="faq-title">
    <div class="container center">
      <h2 class="h2" id="faq-title" data-c="home.faq.title">{E(hm['faq']['title'])}</h2>
    </div>
    <div class="container narrow">
{faq_box(3, 'h')}
      <div class="section-foot">{text_link('faq.html', 'home.faq.link', hm['faq']['link'])}</div>
    </div>
  </section>

{DIV}

{signup_section()}

{DIV}

  <section class="section section-contact" id="contact" aria-labelledby="contact-title">
    <div class="watermark" aria-hidden="true">KB</div>
    <div class="container center contact-finale">
      <h2 class="h2" id="contact-title" data-c="home.contact.title">{E(hm['contact']['title'])}</h2>
      <p class="lead" data-c="home.contact.lead">{E(hm['contact']['lead'])}</p>
      <a class="email-big" data-email href="mailto:{C['email']}">{C['email']}</a>
      <a class="pill pill-primary" href="contact.html" data-c="home.contact.button">{E(hm['contact']['button'])}</a>
    </div>
  </section>
</main>'''

pages = {}
pages['index.html'] = page('index.html', 'KB Ventures: many businesses, one standard',
                           'KB Ventures is a Melbourne company that starts and runs businesses, including AceGuides and Black Crest Web Designs.', home_body, 'home',
                           extra='<link rel="preload" href="img/hero-object.webp" as="image" type="image/webp" fetchpriority="high">\n<script type="importmap">{"imports": {"three": "./vendor/three.module.min.js"}}</script>\n'
                                 '<script type="application/ld+json" id="org-data">' + json.dumps(ld, separators=(',', ':')) + '</script>',
                           scripts=['<script src="main.js" defer></script>', '<script src="signup.js" defer></script>', '<script type="module" src="hero.js"></script>'])

bp = cfg['businessesPage']
pages['businesses.html'] = page('businesses.html', 'Our businesses: KB Ventures', 'The businesses started and run by KB Ventures. Each business has its own website.', f'''<main id="main" class="page">
  <div class="container page-head">
    <h1 class="page-title" data-c="businessesPage.title">{E(bp['title'])}</h1>
    <p class="lead" data-c="businessesPage.lead">{E(bp['lead'])}</p>
  </div>
{biz_grid(always_more=True, level='h2')}
{gallery('h2', 'h3')}
  <div class="container page-end"><a class="pill pill-primary" href="contact.html" data-c="businessesPage.button">{E(bp['button'])}</a></div>
</main>''', 'businesses')

hw = cfg['howWeWork']
rows = []
for i, s in enumerate(cfg['process']):
    rows.append(f'''      <li class="detail-row">
        <span class="step-num" aria-hidden="true">{i + 1:02d}</span>
        <span class="step-icon">{icon(s['title'])}</span>
        <div class="detail-text">
          <h2 class="detail-title" data-c="process.{i}.title">{E(s['title'])}</h2>
          <p><span data-c="process.{i}.line">{E(s['line'])}</span> <span data-c="process.{i}.detail">{E(s['detail'])}</span></p>
        </div>
      </li>''')
pages['how-we-work.html'] = page('how-we-work.html', 'How we work: KB Ventures', 'Every KB Ventures business is started and run the same way: idea, build, launch and run, to one standard.', f'''<main id="main" class="page">
  <div class="container page-head">
    <h1 class="page-title" data-c="howWeWork.title">{E(hw['title'])}</h1>
    <p class="lead" data-c="howWeWork.lead">{E(hw['lead'])}</p>
  </div>
  <div class="container">
    <ol class="detail-list">
{chr(10).join(rows)}
    </ol>
  </div>
  <div class="container page-sub">
    <h2 class="h2" data-c="howWeWork.standardsTitle">{E(hw['standardsTitle'])}</h2>
{std_cards(detail=True)}
  </div>
  <div class="container page-end"><a class="pill pill-primary" href="contact.html" data-c="howWeWork.button">{E(hw['button'])}</a></div>
</main>''', 'how')

fp = cfg['faqPage']


def faq_none():
    t, l = fp['noMatch'], fp.get('noMatchLink', '')
    if l and l in t:
        i = t.index(l)
        return E(t[:i]) + f'<a href="contact.html">{E(l)}</a>' + E(t[i + len(l):])
    return E(t)


pages['faq.html'] = page('faq.html', 'Questions: KB Ventures', 'Answers to common questions about KB Ventures: which business to contact, replies, refunds, privacy and working with us.', f'''<main id="main" class="page">
  <div class="container narrow page-head">
    <h1 class="page-title" data-c="faqPage.title">{E(fp['title'])}</h1>
  </div>
  <div class="container narrow faq-search">
    <label class="faq-search-label" for="faq-search" data-c="faqPage.searchLabel">{E(fp['searchLabel'])}</label>
    <input class="input" id="faq-search" type="search" autocomplete="off" spellcheck="false" placeholder="{E(fp['searchPlaceholder'])}" aria-controls="faq-list">
    <p class="faq-none" id="faq-none" role="status" hidden>{faq_none()}</p>
  </div>
  <div class="container narrow" id="faq-list">
{faq_box(0, 'p', 'h2')}
  </div>
  <div class="container narrow page-end faq-more">
    <p class="lead" data-c="faqPage.more">{E(fp['more'])}</p>
    <a class="pill pill-primary" href="contact.html" data-c="faqPage.button">{E(fp['button'])}</a>
  </div>
</main>''', 'faq', extra=f'<script type="application/ld+json" id="faq-data">{faq_ld()}</script>')

pt = cfg['partner']
points = ''.join(f'\n        <li><strong data-c="partner.points.{i}.title">{E(x["title"])}</strong>: <span data-c="partner.points.{i}.text">{E(x["text"])}</span></li>' for i, x in enumerate(pt['points']))
pages['partner.html'] = page('partner.html', 'Partner with us: KB Ventures', 'KB Ventures is open to working with people who share our standard: clear, fair and well made.', f'''<main id="main" class="page">
  <div class="container about-page">
    <div class="about-mark"><img src="img/kb-favicon.svg" width="240" height="240" alt=""></div>
    <div class="about-copy">
      <h1 class="page-title" data-c="partner.title">{E(pt['title'])}</h1>
      <p class="lead" data-c="partner.lead">{E(pt['lead'])}</p>
      <ul class="principles">{points}
      </ul>
      <a class="pill pill-primary" href="contact.html?topic=partnership" data-c="partner.button">{E(pt['button'])}</a>
    </div>
  </div>
  <div class="container page-sub">
    <h2 class="h2" data-c="partner.whoTitle">{E(pt['whoTitle'])}</h2>
    <ul class="principles">{''.join(f'{chr(10)}      <li data-c="partner.who.{i}">{E(x)}</li>' for i, x in enumerate(pt['who']))}
    </ul>
  </div>
  <div class="container page-sub">
    <h2 class="h2" data-c="partner.nextTitle">{E(pt['nextTitle'])}</h2>
    <ol class="next-steps">{''.join(f'{chr(10)}      <li><span class="step-node" aria-hidden="true">{i + 1:02d}</span><span data-c="partner.next.{i}">{E(x)}</span></li>' for i, x in enumerate(pt['next']))}
    </ol>
  </div>
  <div class="container page-end"><a class="pill pill-primary" href="contact.html?topic=partnership" data-c="partner.button">{E(pt['button'])}</a></div>
</main>''', 'partner')

ab = cfg['about']
story = ' '.join(f'<span data-c="about.story.{i}">{E(x)}</span>' for i, x in enumerate(ab['story']))
never = ''.join(f'''
      <li><span class="never-icon">{icon('cross')}</span><span data-c="about.never.items.{i}">{E(x)}</span></li>''' for i, x in enumerate(ab['never']['items']))
pages['about.html'] = page('about.html', 'About KB Ventures', ab['text'], f'''<main id="main" class="page">
  <div class="container narrow page-head">
    <h1 class="page-title" data-c="about.title">{E(ab['title'])}</h1>
    <p class="lead about-story">{story}</p>
  </div>
  <div class="container page-sub">
    <h2 class="h2" data-c="about.standardsTitle">{E(ab['standardsTitle'])}</h2>
{std_cards(detail=True)}
  </div>
  <div class="container page-sub">
{milestones()}
  </div>
  <div class="container page-sub">
    <h2 class="h2" data-c="about.never.title">{E(ab['never']['title'])}</h2>
    <ul class="never-list">{never}
    </ul>
  </div>
  <div class="container page-end"><a class="pill pill-primary" href="contact.html" data-c="about.button">{E(ab['button'])}</a></div>
</main>''', 'about')

ag = cfg['aceguides']


def money(x):
    return f'${x:.2f}'


def product_card(x):
    """One guide: cover (or a matching tile for bundles), level, subject, price, and Buy now (or Coming soon)."""
    if x.get('cover'):
        cover = f'<img src="{E(x["cover"])}" width="720" height="960" loading="lazy" decoding="async" alt="{E(x.get("coverAlt", ""))}">'
    else:
        cover = f'<div class="cover-tile" aria-hidden="true"><span class="tile-brand">AceGuides</span><span class="tile-line"></span><span class="tile-title">{E(x["subject"])}</span></div>'
    if x.get('link'):
        price = f'<p class="product-price">{money(x["price"])} <span>{E(ag["currency"])}</span></p>' if x.get('price') else f'<p class="product-price is-tbc">{E(ag["noPrice"])}</p>'
        action = (f'<a class="pill pill-primary product-buy" href="{E(x["link"])}" target="_blank" rel="noopener">{E(ag["buy"])}'
                  f'<span class="sr-only">: {E(x["subject"])}, {E(x["level"])} {E(ag["newTab"])}</span></a>')
    else:
        price = f'<p class="product-price">{money(x["price"])} <span>{E(ag["currency"])}</span></p>' if x.get('price') else f'<p class="product-price is-tbc">{E(ag["noPriceSoon"])}</p>'
        action = (f'<button class="pill pill-secondary product-soon" type="button" disabled>{E(ag["comingSoon"])}</button>'
                  f'<a class="text-link product-notify" href="{E(ag["notifyHref"])}">{E(ag["notify"])}<span class="sr-only">: {E(x["subject"])}, {E(x["level"])}</span></a>')
    return f'''        <li class="card product{'' if x.get('link') else ' is-soon'}" id="{E(x['key'])}">
          <div class="product-cover">{cover}</div>
          <div class="product-body">
            <p class="label">{E(x['level'])}</p>
            <h3 class="product-name">{E(x['subject'])}</h3>
            {price}
            <div class="product-actions">{action}</div>
          </div>
        </li>'''


def products_ld():
    """Product structured data for every guide that can be bought now with a known price."""
    items = []
    for g in ag['groups']:
        for x in g['products']:
            if not (x.get('link') and x.get('price')):
                continue
            name = f'AceGuides {x["subject"]} ({x["level"]})'
            items.append({'@type': 'Product', 'name': name, 'brand': {'@type': 'Brand', 'name': 'AceGuides'},
                          'description': f'{x["subject"]} study guide for {x["level"]} students: ' + ', '.join(i.lower() for i in ag['inside'][:-1]) + ' and ' + ag['inside'][-1].lower() + '.',
                          'image': SITE + x['cover'] if x.get('cover') else SITE + 'og.jpg',
                          'offers': {'@type': 'Offer', 'price': f'{x["price"]:.2f}', 'priceCurrency': ag['currency'], 'availability': 'https://schema.org/InStock', 'url': x['link']}})
    return json.dumps({'@context': 'https://schema.org', '@graph': items}, ensure_ascii=False, separators=(',', ':'))


groups_html = []
for gi, g in enumerate(ag['groups']):
    gid = re.sub(r'[^a-z0-9]+', '-', g['title'].lower()).strip('-')
    groups_html.append(f'''  <section class="container shop-group" id="{gid}" aria-labelledby="{gid}-h">
    <h2 class="h2" id="{gid}-h" data-c="aceguides.groups.{gi}.title">{E(g['title'])}</h2>
    <ul class="product-grid">
{chr(10).join(product_card(x) for x in g['products'])}
    </ul>
  </section>''')
inside = ''.join(f'<li data-c="aceguides.inside.{i}">{E(t)}</li>' for i, t in enumerate(ag['inside']))
chooser = ''.join(f'''
      <li><strong data-c="aceguides.chooser.items.{i}.title">{E(x['title'])}</strong>: <span data-c="aceguides.chooser.items.{i}.text">{E(x['text'])}</span></li>''' for i, x in enumerate(ag['chooser']['items']))
policies = ' &middot; '.join(f'<a href="{E(x["href"])}">{E(x["text"])}</a>' for x in ag['policies'])
pages['aceguides.html'] = page('aceguides.html', ag['meta']['title'], ag['meta']['description'], f'''<main id="main" class="page shop">
  <div class="container page-head shop-head">
    <h1 class="page-title" data-c="aceguides.title">{E(ag['title'])}</h1>
    <p class="lead" data-c="aceguides.lead">{E(ag['lead'])}</p>
    <p class="label shop-inside-label" data-c="aceguides.insideTitle">{E(ag['insideTitle'])}</p>
    <ul class="shop-inside">{inside}</ul>
  </div>
  <div class="container shop-chooser">
    <h2 class="shop-chooser-title" data-c="aceguides.chooser.title">{E(ag['chooser']['title'])}</h2>
    <ul class="principles">{chooser}
    </ul>
  </div>
{chr(10).join(groups_html)}
  <div class="container shop-foot">
    <p class="shop-delivery" data-c="aceguides.delivery">{E(ag['delivery'])}</p>
    <p>{text_link(E(ag['questionsLink']), 'aceguides.questions', ag['questions'])}</p>
    <p class="shop-policies">{policies}</p>
    <p class="shop-vcaa" data-c="aceguides.vcaa">{E(ag['vcaa'])}</p>
  </div>
</main>''', 'aceguides', extra=f'<script type="application/ld+json" id="products-data">{products_ld()}</script>')

cp = cfg['contactPage']
opts = ''.join(f'<option>{E(t)}</option>' for t in cp['topics'])
pages['contact.html'] = page('contact.html', 'Contact KB Ventures', f"Questions, orders or ideas? Send KB Ventures a message, or email {C['email']}.", f'''<main id="main" class="page">
  <div class="container">
    <div class="page-head">
      <h1 class="page-title" data-c="contactPage.title">{E(cp['title'])}</h1>
      <p class="lead" data-c="contactPage.lead">{E(cp['lead'])}</p>
    </div>
    <div class="contact-grid">
      <div class="contact-main">
      <div class="card form-card" id="form-box">
        <form id="contact-form" novalidate>
          <div class="hp" aria-hidden="true"><label>Leave this box empty <input type="checkbox" id="f-botcheck" name="botcheck" tabindex="-1" autocomplete="off"></label></div>
          <div class="row-2">
            <div class="field">
              <label for="f-name" data-c="contactPage.name">{E(cp['name'])}</label>
              <input class="input" id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="e-name">
              <p class="field-error" id="e-name" hidden></p>
            </div>
            <div class="field">
              <label for="f-email" data-c="contactPage.email">{E(cp['email'])}</label>
              <input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" required aria-describedby="e-email">
              <p class="field-error" id="e-email" hidden></p>
            </div>
          </div>
          <div class="row-2">
            <div class="field">
              <label for="f-phone"><span data-c="contactPage.phone">{E(cp['phone'])}</span> <span class="opt" data-c="contactPage.optional">{E(cp['optional'])}</span></label>
              <input class="input" id="f-phone" name="phone" type="tel" autocomplete="tel">
            </div>
            <div class="field">
              <label for="f-business"><span data-c="contactPage.business">{E(cp['business'])}</span> <span class="opt" data-c="contactPage.optional">{E(cp['optional'])}</span></label>
              <input class="input" id="f-business" name="business" type="text" autocomplete="organization">
            </div>
          </div>
          <div class="field">
            <label for="f-topic" data-c="contactPage.topic">{E(cp['topic'])}</label>
            <select class="input" id="f-topic" name="topic">{opts}</select>
          </div>
          <div class="field">
            <label for="f-message" data-c="contactPage.message">{E(cp['message'])}</label>
            <textarea class="input" id="f-message" name="message" rows="6" required minlength="10" aria-describedby="e-message"></textarea>
            <p class="field-error" id="e-message" hidden></p>
          </div>
          <div class="field">
            <div class="check">
              <input id="f-agree" name="agree" type="checkbox" required aria-describedby="e-agree">
              <label for="f-agree"><span data-c="contactPage.agreeBefore">{E(cp['agreeBefore'])}</span> <a href="legal/privacy.html" target="_blank" rel="noopener"><span data-c="contactPage.agreeLink">{E(cp['agreeLink'])}</span><span class="sr-only"> (opens in a new tab)</span></a></label>
            </div>
            <p class="field-error" id="e-agree" hidden></p>
          </div>
          <div class="form-actions">
            <button class="pill pill-primary send" type="submit" id="f-send"><span class="spinner" aria-hidden="true"></span><span class="btn-label">{E(cp['send'])}</span></button>
          </div>
          <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
        </form>
      </div>
      <section class="quick" aria-labelledby="quick-title">
        <h2 class="quick-title" id="quick-title" data-c="contactPage.quickTitle">{E(cp['quickTitle'])}</h2>
{faq_box(3, 'c')}
        <div class="section-foot section-foot-start">{text_link('faq.html', 'contactPage.quickLink', cp['quickLink'])}</div>
      </section>
      </div>
      <aside class="card contact-aside" aria-label="Other ways to reach us">
        <h2 class="label" data-c="contactPage.emailLabel">{E(cp['emailLabel'])}</h2>
        <a class="email-big" data-email href="mailto:{C['email']}">{C['email']}</a>
        <h2 class="label" data-c="contactPage.socialLabel">{E(cp['socialLabel'])}</h2>
        <ul class="socials" data-socials></ul>
        <p class="quiet reply-note" data-c="contactPage.replyNote">{E(cp['replyNote'])}</p>
      </aside>
    </div>
  </div>
</main>''', 'contact', scripts=['<script src="main.js" defer></script>', '<script src="contact.js" defer></script>'])

nf = cfg['notFound']
nf_html = head('Page not found: KB Ventures', f"{nf['title']} {nf['text']}", '404.html', noindex=True, base_script=True, lenis=False) + f'''
<body data-page="notfound">
{header_fallback(images=False)}

<main id="main" class="nf">
  <div class="container center">
    <p class="nf-code" data-c="notFound.code">{E(nf['code'])}</p>
    <h1 class="h2 nf-title" data-c="notFound.title">{E(nf['title'])}</h1>
    <p class="lead" data-c="notFound.text">{E(nf['text'])}</p>
    <div class="nf-actions">
      <a class="pill pill-primary" href="./" data-c="notFound.home">{E(nf['home'])}</a>
      <a class="pill pill-secondary" href="contact.html" data-c="notFound.contact">{E(nf['contact'])}</a>
    </div>
  </div>
</main>

{footer_fallback()}
<script>(function () {{ var s = document.createElement('script'); s.src = 'site.js'; document.body.appendChild(s); }})();</script>
</body>
</html>
'''
pages['404.html'] = nf_html

for name, content in pages.items():
    with open(os.path.join(SITE_DIR, name), 'w', encoding='utf-8') as fh:
        fh.write(content)
# GitHub Pages serves the repo's root 404.html for every missing address under /3D-demo-sites/; the same file works there
with open(os.path.join(REPO, '404.html'), 'w', encoding='utf-8') as fh:
    fh.write(nf_html)
print('built', ', '.join(pages), '+ ../404.html')
