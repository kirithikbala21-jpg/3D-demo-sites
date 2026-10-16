#!/usr/bin/env python3
"""Static site builder for the Ember & Oak demo (and any sibling demo that copies this folder).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   brand, contact, hours, colours, nav, page list
  data/*.json        menu, products, journal, careers, press, faq
  tools/templates/   layout.html, pages/*.html, partials/*.html, sections/*.html
Python 3 standard library only. The generated .html files are committed so GitHub Pages can serve them as-is.
"""
import html
import json
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "tools" / "templates"
cfg = json.loads((ROOT / "site.config.json").read_text())
DATA = {p.stem: json.loads(p.read_text()) for p in (ROOT / "data").glob("*.json")}

# ----------------------------------------------------------------------------- tiny template engine
TOKEN = re.compile(r"\{\{\{(.+?)\}\}\}|\{\{(.+?)\}\}", re.S)


def parse(src):
    root, cur, frames, pos = [], None, [], 0
    cur = root
    for m in TOKEN.finditer(src):
        if m.start() > pos:
            cur.append(("text", src[pos:m.start()]))
        pos = m.end()
        raw = m.group(1) is not None
        tag = (m.group(1) if raw else m.group(2)).strip()
        if raw:
            cur.append(("var", tag, True))
        elif tag.startswith(">"):
            cur.append(("partial", tag[1:].strip()))
        elif tag.startswith("#each "):
            node = ["each", tag[6:].strip(), []]
            cur.append(node)
            frames.append((node, cur))
            cur = node[2]
        elif tag.startswith("#if "):
            node = ["if", tag[4:].strip(), [], []]
            cur.append(node)
            frames.append((node, cur))
            cur = node[2]
        elif tag == "else":
            cur = frames[-1][0][3]
        elif tag in ("/each", "/if"):
            _, cur = frames.pop()
        else:
            cur.append(("var", tag, False))
    if pos < len(src):
        cur.append(("text", src[pos:]))
    assert not frames, "unclosed block in template"
    return root


def lookup(expr, stack):
    if expr == "this":
        return stack[-1]
    if expr == "@index":
        return stack[-1].get("@index") if isinstance(stack[-1], dict) else None
    head, *rest = expr.split(".")
    val, found = None, False
    for ctx in reversed(stack):
        if isinstance(ctx, dict) and head in ctx:
            val, found = ctx[head], True
            break
    if not found:
        return None
    for key in rest:
        val = val.get(key) if isinstance(val, dict) else None
    return val


def render_nodes(nodes, stack):
    out = []
    for n in nodes:
        kind = n[0]
        if kind == "text":
            out.append(n[1])
        elif kind == "var":
            v = lookup(n[1], stack)
            v = "" if v is None else v
            out.append(str(v) if n[2] else html.escape(str(v), quote=True))
        elif kind == "partial":
            out.append(render_nodes(parse(load_partial(n[1])), stack))
        elif kind == "each":
            for i, item in enumerate(lookup(n[1], stack) or []):
                ctx = dict(item) if isinstance(item, dict) else {"value": item}
                ctx["@index"] = i
                ctx["n"] = i + 1
                ctx["this"] = item
                out.append(render_nodes(n[2], stack + [ctx]))
        elif kind == "if":
            out.append(render_nodes(n[2] if lookup(n[1], stack) else n[3], stack))
    return "".join(out)


def load_partial(name):
    for sub in ("partials", "sections"):
        p = TPL / sub / f"{name}.html"
        if p.exists():
            return p.read_text()
    raise FileNotFoundError(name)


# ----------------------------------------------------------------------------- generators
def plain(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", plain(s).lower()).strip("-")


def fmt_hour(h):
    return f"{(h % 12) or 12}:00{'am' if h < 12 else 'pm'}"


TAGS = {"V": "Vegetarian", "VG": "Vegan", "GF": "Gluten free", "DF": "Dairy free"}


def menu_html():
    tabs, panels = [], []
    for i, cat in enumerate(DATA["menu"]):
        sel = "true" if i == 0 else "false"
        tabs.append(
            f'            <button role="tab" id="tab-{cat["id"]}" aria-controls="panel-{cat["id"]}" aria-selected="{sel}" '
            f'tabindex="{0 if i == 0 else -1}" type="button">{cat["label"]}</button>\n'
        )
        items = []
        for it in cat["items"]:
            iid = f'm-{slug(it["name"])}'
            t = ""
            if it["sig"]:
                t += '<span class="sig"><span aria-hidden="true">&#9733;</span> Signature</span>'
            t += "".join(f'<abbr title="{TAGS[x]}" class="tag">{x}</abbr>' for x in it["tags"])
            tags = f'\n              <p class="tags">{t}</p>' if t else ""
            thumb = (f'<img class="menu-thumb" src="{it["img"]}" alt="{html.escape(it.get("imgAlt", ""))}" width="88" height="88" loading="lazy">' if it.get("img") else "")
            items.append(
                f'            <article class="menu-item{" has-img" if thumb else ""}" id="{iid}">{thumb}\n'
                f'              <div class="menu-line"><h3>{it["name"]}</h3><span class="leader" aria-hidden="true"></span>'
                f'<span class="price">${it["price"]:.2f}</span>'
                f'<button type="button" class="add-btn" data-add data-id="{iid}" data-name="{html.escape(plain(it["name"]))}" '
                f'data-price="{it["price"]}" aria-label="Add {html.escape(plain(it["name"]))} to your order"><span aria-hidden="true">+</span></button></div>\n'
                f'              <p>{it["desc"]}</p>{tags}\n            </article>\n'
            )
        hid = "" if i == 0 else " hidden"
        panels.append(
            f'          <div role="tabpanel" id="panel-{cat["id"]}" aria-labelledby="tab-{cat["id"]}" tabindex="0" class="menu-panel"{hid}>\n'
            f'            <p class="panel-note">{cat["note"]}</p>\n            <div class="menu-grid">\n{"".join(items)}            </div>\n          </div>\n'
        )
    return "".join(tabs), "".join(panels)


def hours_table():
    rows = "".join(
        f'              <tr data-day="{h["day"]}" data-open="{h["open"]}" data-close="{h["close"]}"><th scope="row">{h["name"]}</th>'
        f'<td>{fmt_hour(h["open"])} &ndash; {fmt_hour(h["close"])}</td></tr>\n'
        for h in cfg["hours"]
    )
    return (
        '<table class="hours">\n            <caption>Opening hours</caption>\n'
        '            <thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>\n'
        f"            <tbody>\n{rows}            </tbody>\n          </table>"
    )


def hours_summary():
    """Compact grouped hours for the footer / overlay (Mon - Wed 7am - 4pm ...)."""
    order = [1, 2, 3, 4, 5, 6, 0]
    by = {h["day"]: h for h in cfg["hours"]}
    groups, cur = [], None
    for d in order:
        h = by[d]
        key = (h["open"], h["close"])
        if cur and cur["key"] == key:
            cur["days"].append(h["name"][:3])
        else:
            cur = {"key": key, "days": [h["name"][:3]]}
            groups.append(cur)
    lines = []
    for g in groups:
        days = g["days"][0] if len(g["days"]) == 1 else f'{g["days"][0]} &ndash; {g["days"][-1]}'
        lines.append(f'{days} {fmt_hour(g["key"][0]).replace(":00", "")} &ndash; {fmt_hour(g["key"][1]).replace(":00", "")}')
    return "<br>".join(lines)


DAYNAMES = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}


def jsonld(page):
    b, c, s = cfg["brand"], cfg["contact"], cfg["site"]
    shop = {
        "@context": "https://schema.org",
        "@type": "CafeOrCoffeeShop",
        "name": b["fullName"],
        "description": b["description"],
        "url": s["baseUrl"],
        "telephone": c["phone"],
        "email": c["email"],
        "priceRange": "$$",
        "servesCuisine": ["Coffee", "Brunch", "Bakery"],
        "hasMenu": s["baseUrl"] + "menu.html",
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["city"] if "city" in c else cfg["brand"]["city"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": DAYNAMES[h["day"]], "opens": f'{h["open"]:02d}:00', "closes": f'{h["close"]:02d}:00'}
            for h in cfg["hours"]
        ],
    }
    out = [shop]
    if page["file"] == "visit.html":
        out.append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
        })
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in out)


def search_data():
    pages = {p["file"]: p for p in cfg["pages"]}
    entries = [{"title": p["title"], "text": p["description"], "url": p["file"], "type": "Page"} for p in cfg["pages"]]
    for cat in DATA["menu"]:
        for it in cat["items"]:
            tag_words = ", ".join(TAGS[x] for x in it["tags"]) + (", signature, house favourite" if it["sig"] else "")
            entries.append({"title": plain(it["name"]), "text": f'{plain(it["desc"])} {tag_words}. {cat["label"].replace("&amp;", "and")}. ${it["price"]:.2f}', "url": f'menu.html#m-{slug(it["name"])}', "type": "Menu"})
    for p in DATA["products"]:
        entries.append({"title": plain(p["name"]), "text": f'{p["desc"]} ${p["price"]}', "url": "shop.html#" + p["id"], "type": "Shop"})
    for f in DATA["faq"]:
        entries.append({"title": plain(f["q"]), "text": plain(f["a"]), "url": "visit.html#faq", "type": "FAQ"})
    for j in DATA["journal"]:
        entries.append({"title": j["title"], "text": j["excerpt"], "url": "journal.html#" + j["id"], "type": "Journal"})
    for r in DATA["careers"]:
        entries.append({"title": r["title"], "text": r["text"], "url": "careers.html", "type": "Careers"})
    for e in cfg["searchExtra"]:
        entries.append({**e, "type": "Experiences"})
    assert pages
    return "// Generated by tools/build.py. Do not edit by hand.\nexport default " + json.dumps(entries, ensure_ascii=False, indent=0) + ";\n"


VENUES = [
    ("Café", "menu.html", '<svg width="14" height="14" aria-hidden="true" focusable="false"><use href="#logo-mark"/></svg>'),
    ("Roastery", "story.html", '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16"/></svg>'),
    ("Oak room", "experiences.html", '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14z"/></svg>'),
    ("Visit", "visit.html", '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 11h12v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/></svg>'),
]


# ----------------------------------------------------------------------------- build
def time_options():
    lo = min(h["open"] for h in cfg["hours"])
    hi = max(h["close"] for h in cfg["hours"])
    out = ['<option value="">Any time</option>']
    t = lo * 60
    while t <= hi * 60 - 30:
        h, m = divmod(t, 60)
        label = f"{(h % 12) or 12}:{m:02d}{'am' if h < 12 else 'pm'}"
        out.append(f'<option value="{h:02d}:{m:02d}">{label}</option>')
        t += 30
    return "".join(out)


def build():
    for p in DATA["products"]:
        p["isBag"] = p["art"] == "bag"
        p["isBottle"] = p["art"] == "bottle"
        p["isCup"] = p["art"] == "cup"
        p["isDripper"] = p["art"] == "dripper"
    tabs, panels = menu_html()
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "email": cfg["contact"]["email"], "timezone": cfg["site"]["timezone"], "locale": cfg["site"]["locale"],
        "currency": cfg["site"]["currency"], "hours": cfg["hours"],
    }
    base = {
        **cfg, **DATA,
        "menuTabs": tabs, "menuPanels": panels, "hoursTable": hours_table(), "hoursSummary": hours_summary(),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "newsLoop": cfg["news"] + cfg["news"],
        "newsText": ". ".join(cfg["news"]) + ".",
        "year": 2026,
        "timeOptions": time_options(),
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "osmEmbed": "https://www.openstreetmap.org/export/embed.html?bbox=%s%%2C%s%%2C%s%%2C%s&layer=mapnik&marker=%s%%2C%s" % (
            cfg["contact"]["lon"] - 0.01, cfg["contact"]["lat"] - 0.006, cfg["contact"]["lon"] + 0.01, cfg["contact"]["lat"] + 0.006, cfg["contact"]["lat"], cfg["contact"]["lon"]),
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"]:
        ctx = {**base, "page": {**page, "isHome": page["file"] == "index.html",
                                "canonical": cfg["site"]["baseUrl"] + ("" if page["file"] == "index.html" else page["file"]),
                                "fullTitle": ("" if page["file"] == "index.html" else page["title"] + " | ") + cfg["brand"]["fullName"] + " (concept demo v2)"},
               "currentFile": page["file"]}
        ctx["venues"] = [{"label": l, "href": h, "icon": i, "current": h == page["file"]} for l, h, i in VENUES]
        ctx["jsonld"] = jsonld(page) if page.get("jsonld") else ""
        content = render_nodes(parse((TPL / "pages" / f'{page["template"]}.html').read_text()), [ctx])
        ctx["content"] = content
        out = render_nodes(layout, [ctx])
        (ROOT / page["file"]).write_text(out)
        print("wrote", page["file"], len(out))
    (ROOT / "search-data.js").write_text(search_data())
    urls = "".join(f'  <url><loc>{cfg["site"]["baseUrl"]}{"" if p["file"] == "index.html" else p["file"]}</loc></url>\n' for p in cfg["pages"])
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    print("wrote search-data.js, sitemap.xml")


if __name__ == "__main__":
    sys.exit(build())
