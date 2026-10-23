#!/usr/bin/env python3
"""Static site builder for the Waverley Plumbing & Gas demo (same small engine as the sibling demos).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   THE file the owner edits: business details, phone, address, hours, holidays, closures, notices, services and prices,
                     suburbs, team, colours, form settings, page list
  data/*.json        reviews, jobs, steps, badges, faq, happening, photos (written by tools/add-photo.py)
  tools/templates/   layout.html, pages/*.html, partials/*.html, sections/*.html
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
for _k in ("services", "pricing", "suburbs", "team"):  # these live in the one owner file
    DATA[_k] = cfg[_k]
TODAY = datetime.date.today()


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
        c += 1440  # closes after midnight
    return o, c


def prepare_config():
    """Check site.config.json with plain-English messages and add the values that are worked out from it."""
    errs = []
    c = cfg["contact"]
    digits = re.sub(r"\D", "", c["phone"])
    if digits.startswith("61"):
        digits = "0" + digits[2:]
    if not re.fullmatch(r"0[2-478]\d{8}|1[38]00\d{6}|13\d{4}", digits):
        errs.append(f'contact > phone: "{c["phone"]}" does not look like an Australian number. Use something like "03 5550 0142" or "0412 345 678".')
    else:
        c["phoneHref"] = "+61" + digits[1:] if digits.startswith("0") else digits
        c["phoneIntl"] = "+61" + digits[1:] if digits.startswith("0") else digits
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", c["email"]):
        errs.append(f'contact > email: "{c["email"]}" is not an email address.')
    c["mapsQuery"] = f'{c["street"]}, {c["locality"]}'
    for h in cfg["hours"]:
        try:
            h["openMin"], h["closeMin"] = normalise_hours(h, f'hours > {h.get("name")}')
        except ValueError as e:
            errs.append(str(e))
    if sorted(h["day"] for h in cfg["hours"]) != list(range(7)):
        errs.append("hours: there must be one line for each of the 7 days (day 0 = Sunday ... 6 = Saturday).")
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
    try:
        cfg["service"]["dayStartMin"], cfg["service"]["dayEndMin"] = parse_time(cfg["service"]["dayStart"], "service > dayStart"), parse_time(cfg["service"]["dayEnd"], "service > dayEnd")
    except ValueError as e:
        errs.append(str(e))
    ids = [x["id"] for x in cfg["services"]]
    if len(ids) != len(set(ids)):
        errs.append("services: two services share the same id (the short name used in links). Make each one different.")
    for it in cfg["services"]:
        if it["from"] is not None and (not isinstance(it["from"], (int, float)) or it["from"] <= 0):
            errs.append(f'services > {it["name"]}: price must be a number like 149 (no $ sign), or null for "free quote".')
    for sb in cfg["suburbs"]:
        if not re.fullmatch(r"\d{4}", str(sb["postcode"])):
            errs.append(f'suburbs > {sb["name"]}: postcode must be 4 digits.')
    for t in cfg["team"]:
        if not isinstance(t.get("since"), int) or t["since"] > TODAY.year:
            errs.append(f'team > {t.get("name")}: "since" must be the year they started, like 2015.')
    for key in ("googleReviewUrl", "googleMapsUrl", "instagramUrl", "facebookUrl"):
        v = cfg.get(key, "")
        if v and not re.fullmatch(r"https://\S+", v):
            errs.append(f'{key}: "{v}" must start with https:// (or be empty to hide it).')
    if cfg.get("googleRating") not in (None, "") and not (isinstance(cfg["googleRating"], (int, float)) and 0 < cfg["googleRating"] <= 5):
        errs.append(f'googleRating: "{cfg["googleRating"]}" must be a number between 0 and 5, like 4.9. Use the business\'s REAL rating.')
    if cfg.get("googleReviewCount") not in (None, "") and not (isinstance(cfg["googleReviewCount"], int) and cfg["googleReviewCount"] > 0):
        errs.append(f'googleReviewCount: "{cfg["googleReviewCount"]}" must be a whole number above 0. Use the business\'s REAL review count.')
    if not isinstance(cfg.get("reminderLeadHours", 24), int) or cfg.get("reminderLeadHours", 24) < 1:
        errs.append("reminderLeadHours: must be a whole number of hours, 1 or more (24 = the day before).")
    for flag in ("remindersEnabled", "waitlistEnabled", "openBannerEnabled"):
        if not isinstance(cfg.get(flag, True), bool):
            errs.append(f"{flag}: must be true or false (no quote marks).")
    if errs:
        sys.exit("PROBLEMS in site.config.json (fix these and save again):\n - " + "\n - ".join(errs))
    cfg["announcement"]["link"] = "Call " + c["phone"]
    cfg["announcement"]["href"] = "tel:" + c["phoneHref"]


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
    h, m = divmod(mins % 1440, 60)
    return f"{(h % 12) or 12}{':%02d' % m if m else ''}{'am' if h < 12 else 'pm'}"


DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]


def hours_table():
    rows = "".join(
        f'<tr data-day="{h["day"]}" data-open="{h["openMin"]}" data-close="{h["closeMin"]}"><th scope="row">{h["name"]}</th>'
        f'<td>{fmt_hour(h["openMin"])} to {fmt_hour(h["closeMin"])}</td></tr>\n'
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
        key = (h["openMin"], h["closeMin"])
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
        "url": s["baseUrl"], "telephone": c["phoneIntl"], "email": c["email"], "priceRange": "$$",
        "foundingDate": str(b["established"]), "areaServed": [x["name"] for x in DATA["suburbs"]],
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["suburb"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": h["name"], "opens": f'{h["openMin"] // 60:02d}:{h["openMin"] % 60:02d}', "closes": f'{(h["closeMin"] % 1440) // 60:02d}:{h["closeMin"] % 60:02d}'}
            for h in cfg["hours"]
        ],
        "hasMap": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(c["mapsQuery"]),
    }
    special = []
    for k in cfg.get("closures", []):  # dated closures and special hours still to come
        if k["date"] >= TODAY.isoformat():
            o, cl = (k["openMin"], k["closeMin"]) if k["status"] == "open" and k.get("openMin") is not None else (0, 0)
            special.append({"@type": "OpeningHoursSpecification", "validFrom": k["date"], "validThrough": k["date"], "name": k.get("name", ""),
                            "opens": f"{o // 60:02d}:{o % 60:02d}", "closes": f"{(cl % 1440) // 60:02d}:{cl % 60:02d}"})
    if special:
        biz["specialOpeningHoursSpecification"] = special
    same = [x["href"] for x in cfg.get("social", []) if urllib.parse.urlparse(x["href"]).path.strip("/")]
    if same:
        biz["sameAs"] = same
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


def file_hash(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def asset_versions():
    """Version tags so a browser never shows a stale stylesheet or script after an update (changes only when the file changes)."""
    return {"css": file_hash("styles.css"), "lenis": file_hash("vendor/lenis-1.1.18.min.js"), "main": file_hash("js/main.js")}


def import_map():
    """Every module under js/ gets ?v=hash, so a changed module is fetched fresh while unchanged ones stay cached."""
    m = {f"./js/{p.name}": f"./js/{p.name}?v={file_hash('js/' + p.name)}" for p in sorted((ROOT / "js").glob("*.js"))}
    return json.dumps({"imports": m})


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


def esc(s):
    return html.escape(str(s), quote=True)


ICONS = {
    "google": "M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z M12 7a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z",
    "instagram": "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17.500 6.500h.01",
    "facebook": "M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.500a.5.5 0 0 1 .5-.5z",
}
_STAR_N = [0]


def icon_svg(key):
    return (f'<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="{ICONS[key]}" fill="none" '
            'stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>')


def social_links():
    """(icon list, plain buttons) for Google Maps, Instagram and Facebook. A link with an empty URL in site.config.json is left out."""
    items = [("google", "Find us on Google Maps", cfg.get("googleMapsUrl")), ("instagram", "Follow us on Instagram", cfg.get("instagramUrl")),
             ("facebook", "Find us on Facebook", cfg.get("facebookUrl"))]
    items = [i for i in items if i[2]]
    lis = "".join(f'<li><a class="soc-link" href="{esc(u)}" target="_blank" rel="noopener" aria-label="{l} (opens in a new tab)">{icon_svg(k)}</a></li>' for k, l, u in items)
    btns = "".join(f'<a class="btn btn-outline soc-btn" href="{esc(u)}" target="_blank" rel="noopener">{icon_svg(k)}<span>{l}<span class="sr-only"> (opens in a new tab)</span></span></a>'
                   for k, l, u in items if k in ("google", "instagram"))
    return (f'<ul class="soc" role="list">{lis}</ul>' if lis else ""), btns


def stars_svg(rating, size=18):
    _STAR_N[0] += 1
    cid = f"rs{_STAR_N[0]}"
    pct = max(0.0, min(5.0, float(rating))) / 5 * 100
    star = lambda i: f'<path transform="translate({i * 20} 0)" d="M10 1.500l2.600 5.500 6 .8-4.400 4.100 1.100 5.900L10 15l-5.300 2.800 1.100-5.900L1.400 7.800l6-.8z"/>'
    allp = "".join(star(i) for i in range(5))
    return (f'<svg class="g-stars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 19" width="{round(size * 100 / 19)}" height="{size}" aria-hidden="true" focusable="false">'
            f'<defs><clipPath id="{cid}"><rect width="{round(pct, 2)}" height="19"/></clipPath></defs><g fill="#c9ced6">{allp}</g><g fill="#f5b301" clip-path="url(#{cid})">{allp}</g></svg>')


def rating_badge():
    """'Rated 4.9 on Google · 212 reviews' with SVG stars. Empty (nothing shown) unless the rating, the count and the Maps link are all set.
    USE THE BUSINESS'S REAL NUMBERS. The demo numbers carry a 'Demo number' note."""
    r, n, u = cfg.get("googleRating"), cfg.get("googleReviewCount"), cfg.get("googleMapsUrl")
    if not (isinstance(r, (int, float)) and 0 < r <= 5 and isinstance(n, int) and n > 0 and u):
        return ""
    return (f'<a class="g-rating" href="{esc(u)}" target="_blank" rel="noopener">'
            f'{stars_svg(r)}<span class="g-rating-text">Rated {r} on Google · {n} reviews</span> <span class="g-rating-demo">Demo number</span><span class="sr-only"> (opens Google Maps in a new tab)</span></a>')


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
        t["years"] = TODAY.year - t["since"]
        t["photoHtml"] = photos[t["photo"]]
        t["first"] = t["name"].split()[0]
    real = lambda k: "slot-empty" not in photos[k]
    jobs_ok = []
    # Photos inside the job tabs are loaded straight away (never lazy): the other tabs are hidden, and a lazy image in a hidden tab can stay empty
    eager = {k: v.replace('loading="lazy"', 'loading="eager"') for k, v in photos.items()}
    for j in DATA["jobs"]:
        j["beforeHtml"] = eager[j["before"]]
        j["afterHtml"] = eager[j["after"]]
        # a slider only when both real photos exist; otherwise one "Recent job" photo; never an empty grid
        j["slider"] = real(j["before"]) and real(j["after"])
        if not j["slider"]:
            pick = j["after"] if real(j["after"]) else j.get("single")
            if not pick or not real(pick):
                continue
            j["singleHtml"] = eager[pick]
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
    sat = next(h for h in cfg["hours"] if h["day"] == 6)
    tokens = {"{phone}": cfg["contact"]["phone"], "{callout}": money(next(x for x in cfg["services"] if x["id"] == "emergency")["from"]),
              "{gasFrom}": money(next(x for x in cfg["services"] if x["id"] == "gas")["from"]),
              "{weekendHours}": f'{fmt_hour(sat["openMin"])} to {fmt_hour(sat["closeMin"])}', "{arrive}": str(cfg["service"]["arriveMinutes"])}
    for f in DATA["faq"]:
        for key in ("q", "a"):
            for t, v in tokens.items():
                f[key] = f[key].replace(t, v)
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "timezone": cfg["site"]["timezone"], "timezoneLabel": cfg["site"]["timezoneLabel"], "locale": cfg["site"]["locale"],
        "hours": [{"day": h["day"], "name": h["name"], "open": h["openMin"], "close": h["closeMin"]} for h in cfg["hours"]],
        "holidays": {"mode": cfg["holidays"].get("mode", "normal"), "overrides": {k: {"status": o.get("status"), "open": o.get("openMin"), "close": o.get("closeMin")} for k, o in (cfg["holidays"].get("overrides") or {}).items()}},
        "closures": [{"date": k["date"], "name": k.get("name", ""), "status": k["status"], "open": k.get("openMin"), "close": k.get("closeMin")} for k in cfg.get("closures", [])],
        "notices": cfg.get("notices", []), "dayStart": cfg["service"]["dayStartMin"], "dayEnd": cfg["service"]["dayEndMin"],
        "forms": {"endpoint": cfg["form"].get("endpoint", "")}, "suburbs": DATA["suburbs"],
        "services": [{"id": s["id"], "name": s["name"], "urgency": s["urgency"]} for s in DATA["services"]],
        "callbackMinutes": cfg["service"]["callbackMinutes"], "arriveMinutes": cfg["service"]["arriveMinutes"],
        "callbackWindow": "between " + fmt_hour(min(h["openMin"] for h in cfg["hours"])) + " and " + fmt_hour(max(h["closeMin"] for h in cfg["hours"])),
        "weekendLine": "Weekends: " + " to ".join(fmt_hour(x) for x in [next(h for h in cfg["hours"] if h["day"] == 6)["openMin"], next(h for h in cfg["hours"] if h["day"] == 6)["closeMin"]]) + ".",
        "formEndpoint": cfg["form"]["endpoint"],
        "remindersEnabled": bool(cfg.get("remindersEnabled")), "reminderLeadHours": cfg.get("reminderLeadHours", 24),
        "waitlistEnabled": bool(cfg.get("waitlistEnabled")), "openBannerEnabled": bool(cfg.get("openBannerEnabled", True)),
        "googleReviewUrl": cfg.get("googleReviewUrl", ""),
    }
    soc_list, soc_btns = social_links()
    base = {
        **cfg, **DATA,
        "socialList": soc_list, "socialButtons": soc_btns, "ratingBadge": rating_badge(), "ratingBadgeFooter": rating_badge(),
        "hasReviewPage": bool(cfg.get("googleReviewUrl")), "waitlistOn": bool(cfg.get("waitlistEnabled")),
        "openBannerOn": bool(cfg.get("openBannerEnabled", True)),
        "hoursTable": hours_table(), "hoursSummary": hours_summary(), "hoursInline": hours_inline(),
        "suburbCount": len(DATA["suburbs"]), "suburbList": ", ".join(s["name"] for s in DATA["suburbs"]),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "year": TODAY.year, "brandYears": TODAY.year - cfg["brand"]["established"], "callbackWindowText": fmt_hour(min(h["openMin"] for h in cfg["hours"])) + " to " + fmt_hour(max(h["closeMin"] for h in cfg["hours"])), "assets": asset_versions(), "importMap": import_map(), "lenisCssInline": (ROOT / "vendor/lenis-1.1.18.css").read_text().strip(), "formsLive": bool(cfg["form"].get("endpoint")), "starsRow": star * 5,
        "photos": photos, "photoCredits": credits,
        "gmapEmbed": "https://maps.google.com/maps?q=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]) + "&output=embed",
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "themeCss": ":root{" + ";".join(f"--{k}:{v}" for k, v in [("navy", cfg["theme"]["navy"]), ("orange", cfg["theme"]["orange"]), ("grey", cfg["theme"]["grey"]), ("ink", cfg["theme"]["text"]), ("green", cfg["theme"]["green"]), ("green-text", cfg["theme"]["greenText"]), ("copper", cfg["theme"]["copper"])]) + "}",
    }
    layout = parse((TPL / "layout.html").read_text())
    live_pages = []
    for page in cfg["pages"]:
        if page["template"] == "reviews" and not cfg.get("googleReviewUrl"):  # no review link set: no reviews page at all
            stale = ROOT / page["file"]
            if stale.exists():
                stale.unlink()
            continue
        live_pages.append(page)
        page["description"] = page["description"].replace("{phone}", cfg["contact"]["phone"]).replace("{name}", cfg["brand"]["name"])
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
    urls = "".join(f'  <url><loc>{cfg["site"]["baseUrl"]}{"" if p["file"] == "index.html" else p["file"]}</loc></url>\n' for p in live_pages if not p.get("hidden"))
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    (ROOT / "site.webmanifest").write_text(manifest())
    (ROOT / "robots.txt").write_text(f"User-agent: *\nDisallow:\n\nSitemap: {cfg['site']['baseUrl']}sitemap.xml\n")
    print("wrote sitemap.xml, site.webmanifest, robots.txt")


if __name__ == "__main__":
    sys.exit(build())
