#!/usr/bin/env python3
"""Static site builder for the Maison Lune salon concept demo (same small engine as the sibling demos).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   brand, contact, hours, colours, nav, social, voucher amounts, booking settings, page list
  data/*.json        services, stylists, reviews, jobs (before/after), faq, why, photos
  tools/templates/   layout.html, pages/*.html, sections/*.html
Set SITE_ROOT=/some/copy to build a copy of the site (the tests do this to try the page with synthetic photos).
Python 3 standard library only. The generated .html files are committed so GitHub Pages can serve them as-is.
"""
import html
import json
import os
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(os.environ.get("SITE_ROOT") or pathlib.Path(__file__).resolve().parent.parent)
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


def money(n):
    return "${:,}".format(n)


def fmt_hour(h):
    return f"{(h % 12) or 12}{'am' if h < 12 else 'pm'}"


def esc(s):
    return html.escape(str(s), quote=True)


DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]
BY_DAY = {h["day"]: h for h in cfg["hours"]}


def hours_table():
    rows = []
    for d in DAYS_ORDER:
        h = BY_DAY[d]
        txt = "Closed" if h["open"] is None else f'{fmt_hour(h["open"])} to {fmt_hour(h["close"])}'
        rows.append(f'<tr data-day="{d}"><th scope="row">{h["name"]}</th><td>{txt}</td></tr>')
    return ('<table class="hours"><caption class="sr-only">Opening hours</caption>'
            '<thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>'
            '<tbody>\n' + "\n".join(rows) + '\n</tbody></table>')


def hours_groups():
    groups, cur = [], None
    for d in DAYS_ORDER:
        h = BY_DAY[d]
        key = (h["open"], h["close"])
        if cur and cur["key"] == key:
            cur["days"].append(h["name"][:3])
        else:
            cur = {"key": key, "days": [h["name"][:3]]}
            groups.append(cur)
    out = []
    for g in groups:
        days = g["days"][0] if len(g["days"]) == 1 else f'{g["days"][0]} to {g["days"][-1]}'
        if g["key"][0] is None:
            out.append(f"{days} closed")
        else:
            out.append(f'{days} {fmt_hour(g["key"][0])} to {fmt_hour(g["key"][1])}')
    return out


def hours_summary():
    return "<br>".join(hours_groups())


def hours_inline():
    return ", ".join(hours_groups())


def jsonld():
    b, c, s = cfg["brand"], cfg["contact"], cfg["site"]
    spec = []
    for g in _open_groups():
        spec.append({"@type": "OpeningHoursSpecification", "dayOfWeek": g["names"], "opens": g["opens"], "closes": g["closes"]})
    biz = {
        "@context": "https://schema.org", "@type": "HairSalon", "name": b["name"] + " (fictional concept demo)",
        "description": b["description"], "url": s["baseUrl"], "telephone": "+61" + c["phoneHref"][1:], "email": c["email"],
        "priceRange": "$$", "currenciesAccepted": "AUD", "image": s["baseUrl"] + "img/og.png",
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["suburb"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": spec,
    }
    faq = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
    }
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in (biz, faq))


def _open_groups():
    groups = []
    for d in DAYS_ORDER:
        h = BY_DAY[d]
        if h["open"] is None:
            continue
        o, c = f'{h["open"]:02d}:00', f'{h["close"]:02d}:00'
        if groups and groups[-1]["opens"] == o and groups[-1]["closes"] == c:
            groups[-1]["names"].append(h["name"])
        else:
            groups.append({"names": [h["name"]], "opens": o, "closes": c})
    return groups


def manifest():
    b, t = cfg["brand"], cfg["theme"]
    icons = [
        {"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": "img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        {"src": "img/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"},
    ]
    return json.dumps({
        "name": b["name"] + " (concept demo)", "short_name": b["short"], "id": "./index.html", "start_url": "./index.html", "scope": "./",
        "display": "standalone", "orientation": "portrait", "background_color": t["bg"], "theme_color": t["bg"], "lang": cfg["site"]["locale"],
        "description": "Unofficial concept website for a fictional hair and beauty salon in Glen Waverley.",
        "categories": ["business", "lifestyle"], "icons": icons,
    }, indent=1) + "\n"


def photo_slots():
    """Real photos live in img/photos/ and are listed in data/photos.json (see tools/add-photo.py).
    A slot with a file renders an <img>; a slot without one renders a neutral branded panel (crescent watermark, no text);
    its 'PHOTO SLOT: name' label is in the DOM but only shown when the URL has ?slots=1."""
    slots = DATA.get("photos", {}).get("slots", {})
    out, credits, real = {}, {}, {}
    for key, sl in slots.items():
        ok = (ROOT / sl["file"]).exists()
        real[key] = ok
        if ok:
            pos = f' style="object-position:{sl["pos"]}"' if sl.get("pos") else ""
            load = 'fetchpriority="high" decoding="async"' if key == "hero" else 'loading="lazy" decoding="async"'
            out[key] = (f'<span class="photo has-img"><span class="px"><img src="{sl["file"]}" alt="{esc(sl.get("alt") or key)}" '
                        f'width="{sl.get("w", 1600)}" height="{sl.get("h", 1067)}" {load}{pos}></span></span>')
            if sl.get("credit"):
                credits.setdefault(sl["credit"], {})[sl["file"]] = sl.get("label", "")
        else:
            out[key] = (f'<span class="photo slot-empty" data-slot="{key}" style="--ar:{sl.get("ratio", "4/3")}" aria-hidden="true">'
                        '<span class="px"><svg class="wm" viewBox="0 0 64 64" focusable="false"><use href="#crescent"/></svg></span>'
                        f'<span class="slot-label">PHOTO SLOT: {esc(key)}</span></span>')
    return out, real, "; ".join(dict.fromkeys(credits))


def build():
    photos, real, credits = photo_slots()
    slots = DATA["photos"]["slots"]
    # services
    cats = []
    flat = []
    for c in DATA["services"]["categories"]:
        items = []
        for s in DATA["services"]["items"]:
            if s["cat"] == c["id"]:
                s = dict(s)
                s["priceText"] = "from " + money(s["from"])
                s["minText"] = f'{s["min"]} min'
                items.append(s)
                flat.append(s)
        cats.append({**c, "photoHtml": photos[c["photo"]] if c.get("photo") else "", "items": items, "first": "true" if not cats else "false", "tab0": "0" if not cats else "-1", "hid": "" if not cats else " hidden"})
    slugs = {s["slug"] for s in flat}
    assert len(slugs) == len(flat), "duplicate service slug"
    # stylists
    sty = []
    for s in DATA["stylists"]:
        s = dict(s)
        s["photoHtml"] = photos[s["photo"]]
        sty.append(s)
    # before / after: slider only with both real photos; else one "Recent work" photo; else the neutral panel; never an empty tab
    jobs = []
    for i, j in enumerate(DATA["jobs"]):
        j = dict(j)
        b, a = j.get("before"), j.get("after")
        j["slider"] = bool(b and a and real.get(b) and real.get(a))
        if j["slider"]:
            j["beforeHtml"], j["afterHtml"] = photos[b], photos[a]
            j["beforeAlt"], j["afterAlt"] = slots[b]["alt"], slots[a]["alt"]
        else:
            order = [x for x in [a, b] if x] + list(j.get("fallback", []))
            pick = next((k for k in order if real.get(k)), None)
            if pick:
                j["singleHtml"], j["singleSlot"] = photos[pick], pick
            else:
                first = a or b or (j.get("fallback") or [None])[0]
                other = b if first == a else a
                extra = f'<span class="slot-label slot-label-2">PHOTO SLOT: {esc(other)}</span>' if other else ""
                j["singleHtml"], j["singleSlot"] = photos[first][:-len("</span>")] + extra + "</span>", first
                j["empty"] = True
        j["tab0"] = "0" if i == 0 else "-1"
        j["sel"] = "true" if i == 0 else "false"
        j["hid"] = "" if i == 0 else " hidden"
        jobs.append(j)
    # gallery
    gal, gi = [], 0
    for n in range(1, 9):
        k = f"gallery-{n}"
        sl = slots[k]
        if real[k]:
            gal.append({"html": f'<li class="g-item zoom reveal" data-parallax="10"><button type="button" class="g-open" data-index="{gi}" data-src="{sl["file"]}" data-w="{sl.get("w", 1600)}" data-h="{sl.get("h", 1067)}" data-alt="{esc(sl["alt"])}" aria-label="View larger: {esc(sl["alt"])}">{photos[k]}</button></li>'})
            gi += 1
        else:
            gal.append({"html": f'<li class="g-item zoom reveal" data-parallax="10">{photos[k]}</li>'})
    for i, r in enumerate(DATA["reviews"]):
        r["i"] = i
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "timezone": cfg["site"]["timezone"], "locale": cfg["site"]["locale"],
        "hours": cfg["hours"], "booking": cfg["booking"],
        "categories": [{"id": c["id"], "name": c["name"]} for c in DATA["services"]["categories"]],
        "services": [{"slug": s["slug"], "cat": s["cat"], "name": s["name"], "from": s["from"], "min": s["min"]} for s in flat],
        "stylists": [{"slug": s["slug"], "name": s["name"], "first": s["first"], "speciality": s["speciality"]} for s in DATA["stylists"]],
        "vouchers": cfg["vouchers"],
    }
    hero_real = real["hero"]
    base = {
        **cfg, **DATA,
        "svcCats": cats, "stylistCards": sty, "jobList": jobs, "galleryItems": gal,
        "hoursTable": hours_table(), "hoursSummary": hours_summary(), "hoursInline": hours_inline(),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "year": 2026, "photos": photos, "photoCredits": credits, "heroReal": hero_real,
        "heroPreload": f'<link rel="preload" as="image" href="{slots["hero"]["file"]}" fetchpriority="high">' if hero_real else "",
        "vouchers": [{"amount": v, "text": money(v), "checked": i == 1} for i, v in enumerate(cfg["vouchers"])],
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "themeCss": ":root{" + ";".join(f"--{k}:{v}" for k, v in [("ivory", cfg["theme"]["ivory"]), ("cocoa", cfg["theme"]["cocoa"]), ("clay", cfg["theme"]["clay"]), ("sage", cfg["theme"]["sage"]), ("clay-text", cfg["theme"]["clayText"]), ("sage-text", cfg["theme"]["sageText"])]) + "}",
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"]:
        home = page["file"] == "index.html"
        ctx = {**base, "page": {**page, "isHome": home, "isNotFound": page["file"] == "404.html",
                                "homeHref": "#top" if home else "index.html", "navBase": "" if home else "index.html",
                                "canonical": cfg["site"]["baseUrl"] + ("" if home else page["file"]),
                                "fullTitle": cfg["brand"]["name"] + " | " + page["title"] + " (unofficial concept demo)"},
               "currentFile": page["file"]}
        ctx["jsonld"] = jsonld() if page.get("jsonld") else ""
        content = render_nodes(parse((TPL / "pages" / f'{page["template"]}.html').read_text()), [ctx])
        ctx["content"] = content
        out = render_nodes(layout, [ctx])
        (ROOT / page["file"]).write_text(out)
        print("wrote", page["file"], len(out))
    urls = "".join(f'  <url><loc>{cfg["site"]["baseUrl"]}{"" if p["file"] == "index.html" else p["file"]}</loc></url>\n' for p in cfg["pages"] if not p.get("hidden"))
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    (ROOT / "site.webmanifest").write_text(manifest())
    print("wrote sitemap.xml, site.webmanifest")


if __name__ == "__main__":
    sys.exit(build())
