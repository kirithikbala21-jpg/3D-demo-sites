#!/usr/bin/env python3
"""Static site builder for the Maison Lune salon concept demo (same small engine as the sibling demos).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   THE file the owner edits: business details, phone, address, hours, holidays, closures, notices, services and
                     prices, stylists, social links, colours, booking and form settings, page list
  data/*.json        reviews, jobs (recent work), faq, why, photos (written by tools/add-photo.py)
  tools/templates/   layout.html, pages/*.html, sections/*.html
Set SITE_ROOT=/some/copy to build a copy of the site (the tests do this to try the page with synthetic photos).
Python 3 standard library only. The generated .html files are committed so GitHub Pages can serve them as-is.
"""
import datetime
import hashlib
import html
import json
import os
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(os.environ.get("SITE_ROOT") or pathlib.Path(__file__).resolve().parent.parent)
TPL = ROOT / "tools" / "templates"
try:
    cfg = json.loads((ROOT / "site.config.json").read_text())
except json.JSONDecodeError as e:
    sys.exit(f"PROBLEM in site.config.json: a comma, quote mark or bracket is wrong near line {e.lineno}, column {e.colno} ({e.msg}). "
             "Compare that line with the ones around it. Every item in a list needs a comma after it except the last one.")
DATA = {p.stem: json.loads(p.read_text()) for p in (ROOT / "data").glob("*.json")}
DATA["services"], DATA["stylists"] = cfg["services"], cfg["stylists"]  # services and stylists live in the one owner file


def parse_time(v, where):
    """'09:00', '9:30', '17.5' or 9 -> minutes since midnight. None stays None."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return int(round(float(v) * 60))
    m = re.fullmatch(r"\s*(\d{1,2})[:.](\d{2})\s*", str(v))
    if not m or int(m.group(1)) > 24 or int(m.group(2)) > 59:
        raise ValueError(f'{where}: "{v}" is not a time. Write times like "09:00" or "17:30" (24 hour clock).')
    return int(m.group(1)) * 60 + int(m.group(2))


def normalise_hours(entry, where):
    o, c = parse_time(entry.get("open"), where + " open"), parse_time(entry.get("close"), where + " close")
    if (o is None) != (c is None):
        raise ValueError(f"{where}: give both an open and a close time, or neither (closed).")
    if o is not None and c <= o:
        c += 1440  # closes after midnight, for example 18:00 to 02:00
    return o, c


def prepare_config():
    """Check site.config.json with plain-English messages and add the values that are worked out from it."""
    errs = []
    c = cfg["contact"]
    digits = re.sub(r"\D", "", c["phone"])
    if digits.startswith("61"):
        digits = "0" + digits[2:]
    if not re.fullmatch(r"0[2-478]\d{8}|04\d{8}|1[38]00\d{6}|13\d{4}", digits):
        errs.append(f'contact > phone: "{c["phone"]}" does not look like an Australian number. Use something like "03 5550 0188" or "0412 345 678".')
    else:
        c["phoneHref"] = "+61" + digits[1:] if digits.startswith("0") else digits  # what tel: links use (international format)
        c["phoneIntl"] = "+61" + digits[1:] if digits.startswith("0") else digits
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", c["email"]):
        errs.append(f'contact > email: "{c["email"]}" is not an email address.')
    c["mapsQuery"] = f'{c["street"]}, {c["locality"]}'
    c["locality"] = c["locality"]
    for h in cfg["hours"]:
        try:
            h["openMin"], h["closeMin"] = normalise_hours(h, f'hours > {h.get("name")}')
        except ValueError as e:
            errs.append(str(e))
    if sorted(h["day"] for h in cfg["hours"]) != list(range(7)):
        errs.append('hours: there must be one line for each of the 7 days (day 0 = Sunday ... 6 = Saturday).')
    for k in cfg.get("closures", []):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", k.get("date", "")):
            errs.append(f'closures: date "{k.get("date")}" must look like 2026-12-24 (year-month-day).')
        if k.get("status") not in ("closed", "open"):
            errs.append(f'closures > {k.get("date")}: status must be "closed" or "open".')
        try:
            k["openMin"], k["closeMin"] = normalise_hours(k, f'closures > {k.get("date")}')
        except ValueError as e:
            errs.append(str(e))
    for k, o in (cfg.get("holidays", {}).get("overrides") or {}).items():
        try:
            o["openMin"], o["closeMin"] = normalise_hours(o, f"holidays > overrides > {k}")
        except ValueError as e:
            errs.append(str(e))
    for n in cfg.get("notices", []):
        if not n.get("end"):
            errs.append(f'notices > "{n.get("text", "")[:30]}": add an "end" date (2026-12-31) so the notice hides itself when it is old.')
    slugs = [x["slug"] for x in cfg["services"]["items"]]
    if len(slugs) != len(set(slugs)):
        errs.append("services: two services share the same slug (the short name used in links). Make each one different.")
    cats = {x["id"] for x in cfg["services"]["categories"]}
    for it in cfg["services"]["items"]:
        if it["cat"] not in cats:
            errs.append(f'services > {it["name"]}: category "{it["cat"]}" does not exist.')
        if not isinstance(it["from"], (int, float)) or it["from"] <= 0:
            errs.append(f'services > {it["name"]}: price must be a number like 85 (no $ sign).')
    for st in cfg["stylists"]:
        if not st.get("name") or not st.get("slug"):
            errs.append("stylists: every person needs a name and a slug.")
    if errs:
        sys.exit("PROBLEMS in site.config.json (fix these and save again):\n - " + "\n - ".join(errs))


prepare_config()

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


def fmt_hour(mins):
    """Minutes since midnight -> 9am, 9:30am, 7pm, midnight (same wording as js/clock.js)."""
    if mins == 1440:
        return "midnight"
    t = mins % 1440
    h, m = divmod(t, 60)
    return f"{(h % 12) or 12}{':%02d' % m if m else ''}{'am' if h < 12 else 'pm'}"


def esc(s):
    return html.escape(str(s), quote=True)


DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]
BY_DAY = {h["day"]: h for h in cfg["hours"]}


def hours_table():
    rows = []
    for d in DAYS_ORDER:
        h = BY_DAY[d]
        txt = "Closed" if h["openMin"] is None else f'{fmt_hour(h["openMin"])} to {fmt_hour(h["closeMin"])}'
        rows.append(f'<tr data-day="{d}"><th scope="row">{h["name"]}</th><td>{txt}</td></tr>')
    return ('<table class="hours"><caption class="sr-only">Opening hours</caption>'
            '<thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>'
            '<tbody>\n' + "\n".join(rows) + '\n</tbody></table>')


def hours_groups():
    groups, cur = [], None
    for d in DAYS_ORDER:
        h = BY_DAY[d]
        key = (h["openMin"], h["closeMin"])
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
        "description": b["description"], "url": s["baseUrl"], "telephone": c["phoneIntl"], "email": c["email"],
        "priceRange": "$$", "currenciesAccepted": "AUD", "image": s["baseUrl"] + "img/og.png",
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["suburb"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": spec,
        "hasMap": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(c["mapsQuery"]),
    }
    today = datetime.date.today().isoformat()
    special = []
    for k in cfg.get("closures", []):  # dated closures and special hours still to come (public holidays are worked out live in the browser)
        if k["date"] >= today:
            o, cl = (k["openMin"], k["closeMin"]) if k["status"] == "open" and k.get("openMin") is not None else (0, 0)
            special.append({"@type": "OpeningHoursSpecification", "validFrom": k["date"], "validThrough": k["date"],
                            "opens": f"{o // 60:02d}:{o % 60:02d}", "closes": f"{(cl % 1440) // 60:02d}:{cl % 60:02d}", "name": k.get("name", "")})
    if special:
        biz["specialOpeningHoursSpecification"] = special
    same = [x["href"] for x in cfg.get("social", []) if urllib.parse.urlparse(x["href"]).path.strip("/")]
    if same:
        biz["sameAs"] = same
    faq = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
    }
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in (biz, faq))


def _open_groups():
    groups = []
    for d in DAYS_ORDER:
        h = BY_DAY[d]
        if h["openMin"] is None:
            continue
        o, c = f'{h["openMin"] // 60:02d}:{h["openMin"] % 60:02d}', f'{(h["closeMin"] % 1440) // 60:02d}:{h["closeMin"] % 60:02d}'
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


def hero_preload(sl):
    small = pathlib.Path(sl["file"]).with_name(pathlib.Path(sl["file"]).stem + "-800.webp")
    if (ROOT / small).exists() and sl.get("w", 0) > 900:
        return f'<link rel="preload" as="image" href="{sl["file"]}" imagesrcset="{small} 800w, {sl["file"]} {sl["w"]}w" imagesizes="100vw" fetchpriority="high">'
    return f'<link rel="preload" as="image" href="{sl["file"]}" fetchpriority="high">'


def brand_html():
    """'Maison Lune' -> 'Maison <em>Lune</em>' (the last word is set in italics)."""
    words = cfg["brand"]["name"].split()
    return esc(" ".join(words[:-1])) + (" " if len(words) > 1 else "") + f"<em>{esc(words[-1])}</em>"


def file_hash(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def asset_versions():
    """Version tags so a browser never shows a stale stylesheet or script after an update (changes only when the file changes)."""
    return {"css": file_hash("styles.css"), "lenis": file_hash("vendor/lenis-1.1.18.min.js"), "lenisCss": file_hash("vendor/lenis-1.1.18.css"), "main": file_hash("js/main.js")}


def import_map():
    """Every module under js/ gets ?v=hash, so a changed module is fetched fresh while unchanged ones stay cached."""
    m = {f"./js/{p.name}": f"./js/{p.name}?v={file_hash('js/' + p.name)}" for p in sorted((ROOT / "js").glob("*.js"))}
    return json.dumps({"imports": m})


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
            small = pathlib.Path(sl["file"]).with_name(pathlib.Path(sl["file"]).stem + "-800.webp")
            srcset = ""
            if (ROOT / small).exists() and sl.get("w", 0) > 900 and (ROOT / small).stat().st_size < (ROOT / sl["file"]).stat().st_size:
                sizes = "100vw" if key == "hero" else "(min-width: 900px) 50vw, 100vw"
                srcset = f' srcset="{small} 800w, {sl["file"]} {sl["w"]}w" sizes="{sizes}"'  # phones fetch the smaller copy
            out[key] = (f'<span class="photo has-img"><span class="px"><img src="{sl["file"]}"{srcset} alt="{esc(sl.get("alt") or key)}" '
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
        "hours": [{"day": h["day"], "name": h["name"], "open": h["openMin"], "close": h["closeMin"]} for h in cfg["hours"]],
        "holidays": {"mode": cfg["holidays"].get("mode", "closed"), "overrides": {k: {"status": o.get("status"), "open": o.get("openMin"), "close": o.get("closeMin")} for k, o in (cfg["holidays"].get("overrides") or {}).items()}},
        "closures": [{"date": k["date"], "name": k.get("name", ""), "status": k["status"], "open": k.get("openMin"), "close": k.get("closeMin")} for k in cfg.get("closures", [])],
        "notices": cfg.get("notices", []), "booking": cfg["booking"], "forms": {"endpoint": cfg["forms"].get("endpoint", "")},
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
        "year": datetime.date.today().year, "photos": photos, "photoCredits": credits, "heroReal": hero_real,
        "heroPreload": hero_preload(slots["hero"]) if hero_real else "",
        "vouchers": [{"amount": v, "text": money(v), "checked": i == 1} for i, v in enumerate(cfg["vouchers"])],
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "brandHtml": brand_html(), "formsLive": bool(cfg["forms"].get("endpoint")), "assets": asset_versions(),
        "importMap": import_map(), "lenisCssInline": (ROOT / "vendor/lenis-1.1.18.css").read_text().strip(),
        "themeCss": ":root{" + ";".join(f"--{k}:{v}" for k, v in [("ivory", cfg["theme"]["ivory"]), ("cocoa", cfg["theme"]["cocoa"]), ("clay", cfg["theme"]["clay"]), ("sage", cfg["theme"]["sage"]), ("clay-text", cfg["theme"]["clayText"]), ("sage-text", cfg["theme"]["sageText"])]) + "}",
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"]:
        page["description"] = page["description"].replace("{phone}", cfg["contact"]["phone"])
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
    robots = "User-agent: *\nDisallow:\n" + f"\nSitemap: {cfg['site']['baseUrl']}sitemap.xml\n"
    (ROOT / "robots.txt").write_text(robots)
    print("wrote sitemap.xml, site.webmanifest, robots.txt")


if __name__ == "__main__":
    sys.exit(build())
