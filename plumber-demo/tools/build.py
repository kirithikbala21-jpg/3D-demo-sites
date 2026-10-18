#!/usr/bin/env python3
"""Static site builder for the Waverley Plumbing & Gas demo (same small engine as the sibling demos).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   brand, contact, hours, colours, nav, page list, form settings
  data/*.json        services, pricing, suburbs, reviews, team, jobs, steps, badges, faq, photos
  tools/templates/   layout.html, pages/*.html, partials/*.html, sections/*.html
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


DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]


def hours_table():
    rows = "".join(
        f'<tr data-day="{h["day"]}" data-open="{h["open"]}" data-close="{h["close"]}"><th scope="row">{h["name"]}</th>'
        f'<td>{fmt_hour(h["open"])} to {fmt_hour(h["close"])}</td></tr>\n'
        for h in sorted(cfg["hours"], key=lambda h: DAYS_ORDER.index(h["day"]))
    )
    return ('<table class="hours"><caption class="sr-only">Office and booking hours</caption>'
            '<thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>'
            f'<tbody>\n{rows}</tbody></table>')


def hours_groups():
    by = {h["day"]: h for h in cfg["hours"]}
    groups, cur = [], None
    for d in DAYS_ORDER:
        h = by[d]
        key = (h["open"], h["close"])
        if cur and cur["key"] == key:
            cur["days"].append(h["name"][:3])
        else:
            cur = {"key": key, "days": [h["name"][:3]]}
            groups.append(cur)
    out = []
    for g in groups:
        days = g["days"][0] if len(g["days"]) == 1 else f'{g["days"][0]} to {g["days"][-1]}'
        out.append({"days": days, "open": fmt_hour(g["key"][0]), "close": fmt_hour(g["key"][1])})
    return out


def hours_summary():
    return "<br>".join(f'{g["days"]} {g["open"]} to {g["close"]}' for g in hours_groups())


def hours_inline():
    """Plain-text hours for the callback sentence and meta, e.g. 'Mon to Fri 7am to 8pm, Sat to Sun 8am to 5pm'."""
    return ", ".join(f'{g["days"]} {g["open"]} to {g["close"]}' for g in hours_groups())


def jsonld(page):
    b, c, s = cfg["brand"], cfg["contact"], cfg["site"]
    biz = {
        "@context": "https://schema.org", "@type": "Plumber", "name": b["name"], "description": b["description"],
        "url": s["baseUrl"], "telephone": "+61" + c["phoneHref"][1:], "email": c["email"], "priceRange": "$$",
        "foundingDate": str(b["established"]), "areaServed": [x["name"] for x in DATA["suburbs"]],
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["suburb"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": h["name"], "opens": f'{h["open"]:02d}:00', "closes": f'{h["close"]:02d}:00'}
            for h in cfg["hours"]
        ],
    }
    out = [biz]
    out.append({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
    })
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in out)


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
        "description": "Concept website for a fictional family plumbing business in south-east Melbourne.",
        "categories": ["business", "utilities"], "icons": icons,
    }, indent=1) + "\n"


def photo_slots():
    """Real photos live in img/photos/ and are listed in data/photos.json (see tools/add-photo.py).
    A slot with a file renders an <img>; a slot without one renders a clearly labelled placeholder showing its `needs` text."""
    slots = DATA.get("photos", {}).get("slots", {})
    html_by_slot, credits = {}, {}
    for key, sl in slots.items():
        if (ROOT / sl["file"]).exists():
            pos = f' style="object-position:{sl["pos"]}"' if sl.get("pos") else ""
            load = 'fetchpriority="high" decoding="async"' if sl.get("eager") else 'loading="lazy" decoding="async"'
            html_by_slot[key] = (f'<span class="photo"><img src="{sl["file"]}" alt="{html.escape(sl["alt"], quote=True)}" '
                                 f'width="{sl.get("w", 1600)}" height="{sl.get("h", 1067)}" {load}{pos}></span>')
            if sl.get("credit"):
                credits.setdefault(sl["credit"], {})[sl["file"]] = sl.get("label", "")
        else:
            short, _, rest = sl.get("needs", key).partition(" - ")
            html_by_slot[key] = (f'<span class="photo slot-empty" data-slot="{key}"><span class="slot-label"><strong>PHOTO SLOT: {html.escape(short)}</strong>'
                                 f'<span class="slot-needs"> - {html.escape(rest)}</span></span></span>')
    # emergency strip: night van wins if supplied, otherwise the tool wall, otherwise the night-van placeholder
    html_by_slot["emergency-bg"] = html_by_slot["emergency-night-van"] if "slot-empty" not in html_by_slot["emergency-night-van"] else (html_by_slot["emergency-tools-wall"] if "slot-empty" not in html_by_slot["emergency-tools-wall"] else html_by_slot["emergency-night-van"])
    text = "; ".join(dict.fromkeys(credits))
    return html_by_slot, text


def build():
    photos, credits = photo_slots()
    svc = {s["id"]: s for s in DATA["services"]}
    for s in DATA["services"]:
        s["priceText"] = "Free quote" if s["from"] is None else s["label"] + " " + money(s["from"])
        s["priceBig"] = "Free" if s["from"] is None else money(s["from"])
        s["photoHtml"] = photos[s["photo"]]
    for r in DATA["pricing"]:
        if "ref" in r:
            sv = svc[r["ref"]]
            r["price"] = sv["from"]
            r["serviceName"] = sv["name"]
        r["priceText"] = "Free quote" if r["price"] is None else "from " + money(r["price"])
        r["priceAttr"] = "" if r["price"] is None else str(r["price"])
    for t in DATA["team"]:
        t["photoHtml"] = photos[t["photo"]]
        t["first"] = t["name"].split()[0]
    real = lambda k: "slot-empty" not in photos[k]
    jobs_ok = []
    for j in DATA["jobs"]:
        j["beforeHtml"] = photos[j["before"]]
        j["afterHtml"] = photos[j["after"]]
        # a slider only when both real photos exist; otherwise one "Recent job" photo; never an empty grid
        j["slider"] = real(j["before"]) and real(j["after"])
        if not j["slider"]:
            pick = j["after"] if real(j["after"]) else j.get("single")
            if not pick or not real(pick):
                continue
            j["singleHtml"] = photos[pick]
        jobs_ok.append(j)
    DATA["jobs"] = jobs_ok
    for j in DATA["jobs"]:
        j["priceText"] = money(j["price"])
        j["sel"] = "true" if j["id"] == DATA["jobs"][0]["id"] else "false"
        j["tab0"] = "0" if j["id"] == DATA["jobs"][0]["id"] else "-1"
        j["hid"] = "" if j["id"] == DATA["jobs"][0]["id"] else " hidden"
    for s in DATA["suburbs"]:
        pass
    star = '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1.5l2.6 5.5 6 .8-4.400 4.200 1.100 6-5.300-2.900-5.300 2.900 1.100-6L1.400 7.800l6-.8z" fill="currentColor"/></svg>'
    for r in DATA["reviews"]:
        r["stars"] = star * 5
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "timezone": cfg["site"]["timezone"], "timezoneLabel": cfg["site"]["timezoneLabel"], "locale": cfg["site"]["locale"],
        "hours": cfg["hours"], "suburbs": DATA["suburbs"],
        "services": [{"id": s["id"], "name": s["name"], "urgency": s["urgency"]} for s in DATA["services"]],
        "callbackMinutes": cfg["service"]["callbackMinutes"], "arriveMinutes": cfg["service"]["arriveMinutes"],
        "callbackWindow": "between " + fmt_hour(min(h["open"] for h in cfg["hours"])) + " and " + fmt_hour(max(h["close"] for h in cfg["hours"])),
        "weekendLine": "Weekends: " + " to ".join(fmt_hour(x) for x in [next(h for h in cfg["hours"] if h["day"] == 6)["open"], next(h for h in cfg["hours"] if h["day"] == 6)["close"]]) + ".",
        "formEndpoint": cfg["form"]["endpoint"],
    }
    base = {
        **cfg, **DATA,
        "hoursTable": hours_table(), "hoursSummary": hours_summary(), "hoursInline": hours_inline(),
        "suburbCount": len(DATA["suburbs"]), "suburbList": ", ".join(s["name"] for s in DATA["suburbs"]),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "year": 2026, "starsRow": star * 5,
        "photos": photos, "photoCredits": credits,
        "gmapEmbed": "https://maps.google.com/maps?q=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]) + "&output=embed",
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "themeCss": ":root{" + ";".join(f"--{k}:{v}" for k, v in [("navy", cfg["theme"]["navy"]), ("orange", cfg["theme"]["orange"]), ("grey", cfg["theme"]["grey"]), ("ink", cfg["theme"]["text"]), ("green", cfg["theme"]["green"]), ("green-text", cfg["theme"]["greenText"]), ("copper", cfg["theme"]["copper"])]) + "}",
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"]:
        home = page["file"] == "index.html"
        ctx = {**base, "page": {**page, "isHome": home, "isNotFound": page["file"] == "404.html",
                                "homeHref": "#top" if home else "index.html", "navBase": "" if home else "index.html",
                                "canonical": cfg["site"]["baseUrl"] + ("" if home else page["file"]),
                                "fullTitle": (cfg["brand"]["name"] + " | " + page["title"] if home else page["title"] + " | " + cfg["brand"]["name"]) + " (concept demo)"},
               "currentFile": page["file"]}
        ctx["jsonld"] = jsonld(page) if page.get("jsonld") else ""
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
