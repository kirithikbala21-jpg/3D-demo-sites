#!/usr/bin/env python3
"""Static site builder for the Ember & Oak demo (and any sibling demo that copies this folder).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   brand, contact, hours, colours, nav, page list
  data/*.json        menu, products, journal, careers, press, faq
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


def parse_time(v, where):
    """'09:00', '9:30' or 9 -> minutes since midnight. None stays None."""
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
    if not re.fullmatch(r"0[2-478]\d{8}|1[38]00\d{6}|13\d{4}", digits):
        errs.append(f'contact > phone: "{c["phone"]}" does not look like an Australian number. Use something like "03 5550 0123" or "0412 345 678".')
    else:
        c["phoneHref"] = "+61" + digits[1:] if digits.startswith("0") else digits
        c["phoneIntl"] = c["phoneHref"]
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", c["email"]):
        errs.append(f'contact > email: "{c["email"]}" is not an email address.')
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
    a = cfg.get("announcement", {})
    if a and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", a.get("end", "")):
        errs.append('announcement: add an "end" date like "2026-12-31" so the top bar hides itself when it is old.')
    for key in ("googleReviewUrl", "googleMapsUrl", "instagramUrl", "facebookUrl"):
        v = cfg.get(key, "")
        if v and not re.fullmatch(r"https://\S+", v):
            errs.append(f'{key}: "{v}" must start with https:// (or be empty "" to hide it).')
    if cfg.get("googleRating") not in (None, "", 0):
        if not isinstance(cfg["googleRating"], (int, float)) or not 0 < cfg["googleRating"] <= 5:
            errs.append("googleRating: must be a number between 0 and 5, for example 4.8 (use the business's REAL rating).")
        if not isinstance(cfg.get("googleReviewCount"), int) or cfg["googleReviewCount"] < 1:
            errs.append("googleReviewCount: must be a whole number above 0 (use the business's REAL count).")
    if not isinstance(cfg.get("reminderLeadHours", 24), int) or cfg.get("reminderLeadHours", 24) < 1:
        errs.append("reminderLeadHours: must be a whole number of hours, 1 or more (24 = the day before).")
    for flag in ("remindersEnabled", "waitlistEnabled", "orderingEnabled", "busynessEnabled"):
        if flag in cfg and not isinstance(cfg[flag], bool):
            errs.append(f"{flag}: must be true or false (no quote marks).")
    bz = cfg.get("busyness") or {}
    if bz:
        n = len(bz.get("blocks", []))
        for d, row in (bz.get("week") or {}).items():
            if d not in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
                errs.append(f'busyness > week: "{d}" is not a day. Use mon, tue, wed, thu, fri, sat, sun.')
            elif len(row) != n or any(x not in ("quiet", "medium", "busy", "closed", None) for x in row):
                errs.append(f'busyness > week > {d}: needs exactly {n} entries, each "quiet", "medium", "busy" or "closed".')
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


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", plain(s).lower()).strip("-")


def fmt_hour(mins):
    """Minutes since midnight -> 7:00am, 4:30pm, midnight (same wording as the page scripts)."""
    if mins == 1440:
        return "midnight"
    h, m = divmod(mins % 1440, 60)
    return f"{(h % 12) or 12}:{m:02d}{'am' if h < 12 else 'pm'}"


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
                + (f'<button type="button" class="add-btn" data-add data-id="{iid}" data-name="{html.escape(plain(it["name"]))}" '
                   f'data-price="{it["price"]}" aria-label="Add {html.escape(plain(it["name"]))} to your order"><span aria-hidden="true">+</span></button>' if cfg.get("orderingEnabled", True) else "")
                + f'</div>\n'
                f'              <p>{it["desc"]}</p>{tags}\n            </article>\n'
            )
        hid = "" if i == 0 else " hidden"
        panels.append(
            f'          <div role="tabpanel" id="panel-{cat["id"]}" aria-labelledby="tab-{cat["id"]}" tabindex="0" class="menu-panel" data-label="{cat["label"]}"{hid}>\n'
            f'            <p class="panel-note">{cat["note"]}</p>\n            <div class="menu-grid">\n{"".join(items)}            </div>\n          </div>\n'
        )
    return "".join(tabs), "".join(panels)


def hours_table():
    rows = "".join(
        f'              <tr data-day="{h["day"]}" data-open="{h["openMin"] / 60:g}" data-close="{h["closeMin"] / 60:g}"><th scope="row">{h["name"]}</th>'
        f'<td>{fmt_hour(h["openMin"])} &ndash; {fmt_hour(h["closeMin"])}</td></tr>\n'
        for h in cfg["hours"]
    )
    return (
        '<table class="hours">\n            <caption>Opening hours</caption>\n'
        '            <thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>\n'
        f"            <tbody>\n{rows}            </tbody>\n          </table>"
    )


def hours_phrase():
    """One plain-language line used everywhere: '7 days, from 7am (Sundays 8am)'. Built from the opening hours so it cannot drift."""
    hrs = cfg["hours"]
    opens = [h["openMin"] for h in hrs]
    common = max(set(opens), key=opens.count)
    short = lambda h: fmt_hour(h).replace(":00", "")
    odd = [h for h in sorted(hrs, key=lambda h: (h["day"] or 7)) if h["openMin"] != common]
    extra = ", ".join(f'{h["name"]}s {short(h["openMin"])}' for h in odd)
    return f"{len(hrs)} days, from {short(common)}" + (f" ({extra})" if extra else "")


def hours_summary():
    """Footer / overlay hours: the plain-language line, then the closing times grouped by day."""
    order = [1, 2, 3, 4, 5, 6, 0]
    by = {h["day"]: h for h in cfg["hours"]}
    groups, cur = [], None
    for d in order:
        h = by[d]
        if cur and cur["close"] == h["closeMin"]:
            cur["days"].append(h["name"][:3])
        else:
            cur = {"close": h["closeMin"], "days": [h["name"][:3]]}
            groups.append(cur)
    short = lambda h: fmt_hour(h).replace(":00", "")
    closes = ", ".join(
        f'{short(g["close"])} {g["days"][0] if len(g["days"]) == 1 else g["days"][0] + " &ndash; " + g["days"][-1]}' for g in groups
    )
    return f"{hours_phrase()}<br>Closing {closes}"


DAYNAMES = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}


def jsonld(page):
    b, c, s = cfg["brand"], cfg["contact"], cfg["site"]
    shop = {
        "@context": "https://schema.org",
        "@type": "CafeOrCoffeeShop",
        "name": b["fullName"],
        "description": b["description"] + " Open " + hours_phrase() + ".",
        "url": s["baseUrl"],
        "telephone": c["phoneIntl"],
        "email": c["email"],
        "priceRange": "$$",
        "servesCuisine": ["Coffee", "Brunch", "Bakery"],
        "hasMenu": s["baseUrl"] + "menu.html",
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["city"] if "city" in c else cfg["brand"]["city"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": DAYNAMES[h["day"]], "opens": f'{h["openMin"] // 60:02d}:{h["openMin"] % 60:02d}',
             "closes": f'{(h["closeMin"] % 1440) // 60:02d}:{h["closeMin"] % 60:02d}'}
            for h in cfg["hours"]
        ],
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
        shop["specialOpeningHoursSpecification"] = special
    out = [shop]
    if page["file"] == "visit.html":
        out.append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
        })
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in out)


def search_data():
    pages = {p["file"]: p for p in cfg["pages"]}
    entries = [{"title": p["title"], "text": p["description"], "url": p["file"], "type": "Page"} for p in cfg["pages"] if not (p.get("requires") and not cfg.get(p["requires"]))]  # plain text (no entities)
    for cat in DATA["menu"]:
        for it in cat["items"]:
            tag_words = ", ".join(TAGS[x] for x in it["tags"]) + (", signature, house favourite" if it["sig"] else "")
            entries.append({"title": plain(it["name"]), "text": f'{plain(it["desc"])} {tag_words}. {cat["label"].replace("&amp;", "and")}. ${it["price"]:.2f}', "url": f'menu.html#m-{slug(it["name"])}', "type": "Menu"})
    for p in DATA["products"]:
        entries.append({"title": plain(p["name"]), "text": plain(f'{p["desc"]} ${p["price"]}'), "url": "shop.html#" + p["id"], "type": "Shop"})
    for f in DATA["faq"]:
        entries.append({"title": plain(f["q"]), "text": plain(f["a"]), "url": "visit.html#faq", "type": "FAQ"})
    for j in DATA["journal"]:
        entries.append({"title": plain(j["title"]), "text": plain(j["excerpt"]), "url": "journal.html#" + j["id"], "type": "Journal"})
    for r in DATA["careers"]:
        entries.append({"title": plain(r["title"]), "text": plain(r["text"]), "url": "careers.html", "type": "Careers"})
    for e in cfg["searchExtra"]:
        entries.append({**e, "type": "Experiences"})
    assert pages
    for e in entries:  # nothing in the index may carry HTML entities: the search box escapes text itself
        e["title"], e["text"] = plain(e["title"]), plain(e["text"])
    return "// Generated by tools/build.py. Do not edit by hand.\nexport default " + json.dumps(entries, ensure_ascii=False, indent=0) + ";\n"


# ----------------------------------------------------------------------------- photos
def photos_ctx():
    """Slots from data/photos.json. A slot renders a real <img> only when its file exists on disk; otherwise the template keeps its illustration."""
    slots = DATA.get("photos", {}).get("slots", {})
    out, credits = {}, {}
    for name, s in slots.items():
        exists = (ROOT / s["file"]).is_file()
        if exists and not (s.get("alt", "").strip() and s.get("credit", "").strip()):
            sys.exit(f'photos.json: slot "{name}" has a file ({s["file"]}) but no alt text or credit. Fill both in (see README, "Photos").')
        if not exists:
            out[name] = {"has": False, "html": "", "attr": ' aria-hidden="true"'}
            continue
        load = 'fetchpriority="high" decoding="async"' if s.get("eager") else 'loading="lazy" decoding="async"'
        pos = s.get("pos")
        if pos is not None and not re.fullmatch(r"\d{1,3}% \d{1,3}%", pos):
            sys.exit(f'photos.json: slot "{name}" has an invalid "pos" ({pos!r}); use e.g. "50% 30%" (object-position, x then y).')
        style = f' style="object-position:{pos}"' if pos else ""
        img = (f'<span class="photo" data-photo><img src="{html.escape(s["file"])}" width="{int(s["w"])}" height="{int(s["h"])}" '
               f'{load}{style} alt="{html.escape(s["alt"])}"></span>')
        out[name] = {"has": True, "html": img, "attr": ""}
        credits.setdefault(s["credit"].strip(), {})[s["file"]] = s.get("label") or name.replace("-", " ").capitalize()
    # one line per distinct credit, listing the photos it covers: "Photo: Unsplash (Hero interior, Roastery, ...)"
    text = "; ".join(f'{c} ({", ".join(dict.fromkeys(files.values()))})' for c, files in credits.items())
    return out, text


# ----------------------------------------------------------------------------- build
def time_options():
    lo = min(h["openMin"] for h in cfg["hours"]) // 60
    hi = max(h["closeMin"] for h in cfg["hours"]) // 60
    out = ['<option value="">Any time</option>']
    t = lo * 60
    while t <= hi * 60 - 30:
        h, m = divmod(t, 60)
        label = f"{(h % 12) or 12}:{m:02d}{'am' if h < 12 else 'pm'}"
        out.append(f'<option value="{h:02d}:{m:02d}">{label}</option>')
        t += 30
    return "".join(out)


def file_hash(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def asset_versions():
    """Version tags so a browser never shows a stale stylesheet or script after an update (changes only when the file changes)."""
    return {"css": file_hash("styles.css"), "lenis": file_hash("vendor/lenis-1.1.18.min.js"), "lenisCss": file_hash("vendor/lenis-1.1.18.css"), "main": file_hash("main.js")}


def import_map(home=False):
    """Every module gets ?v=hash so a changed one is fetched fresh while unchanged ones stay cached."""
    m = {f"./js/{p.name}": f"./js/{p.name}?v={file_hash('js/' + p.name)}" for p in sorted((ROOT / "js").glob("*.js"))}
    m["./scene.js"] = f"./scene.js?v={file_hash('scene.js')}"
    m["./search-data.js"] = f"./search-data.js?v={file_hash('search-data.js')}" if (ROOT / "search-data.js").exists() else "./search-data.js"
    m["three"] = "./vendor/three.module.min.js"
    m["three/addons/"] = "./vendor/addons/"
    return json.dumps({"imports": m})


def write_manifest():
    b = cfg["brand"]
    manifest = {
        "name": b["fullName"] + " (concept demo)",
        "short_name": b["name"],
        "description": b["description"],
        "lang": cfg["site"]["locale"],
        "id": "./index.html",
        "start_url": "./index.html",
        "scope": "./",
        "display": "standalone",
        "orientation": "portrait-primary",
        "categories": ["food", "lifestyle", "shopping"],
        "theme_color": cfg["theme"]["cream"],
        "background_color": cfg["theme"]["cream"],
        "icons": [
            {"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            {"src": "img/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"},
        ],
    }
    (ROOT / "site.webmanifest").write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n")
    print("wrote site.webmanifest")


def hero_prices():
    """Real prices straight from data/menu.json for the hero: 'Coffee from $5.00 · Food from $8.00'."""
    out = []
    for cid, label in (("coffee", "Coffee"), ("food", "Food")):
        cat = next((c for c in DATA["menu"] if c["id"] == cid), None)
        if cat and cat["items"]:
            out.append(f'{label} from ${min(i["price"] for i in cat["items"]):.2f}')
    return " \u00b7 ".join(out)


_star_n = [0]


def stars_svg(rating, size=18):
    """Five SVG stars, filled to match the rating (a partly filled last star is clipped)."""
    _star_n[0] += 1
    cid = f"gs{_star_n[0]}"
    star = lambda i: f'<path transform="translate({i * 20} 0)" d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z"/>'
    allp = "".join(star(i) for i in range(5))
    pct = max(0.0, min(5.0, float(rating))) / 5 * 100
    return (f'<svg class="g-stars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 19" width="{round(size * 100 / 19)}" height="{size}" aria-hidden="true" focusable="false">'
            f'<defs><clipPath id="{cid}"><rect width="{pct:.1f}" height="19"/></clipPath></defs><g fill="rgba(243,233,218,.28)">{allp}</g><g fill="#F5B301" clip-path="url(#{cid})">{allp}</g></svg>')


def rating_html():
    """The Google rating badge, or '' unless a rating, a review count and a Maps link are all set in site.config.json."""
    r, n, url = cfg.get("googleRating"), cfg.get("googleReviewCount"), cfg.get("googleMapsUrl")
    if not (r and n and url):
        return ""
    return (f'<a class="g-rating" href="{esc(url)}" target="_blank" rel="noopener" >'
            f'{stars_svg(r)}<span class="g-rating-text">Rated {r} on Google \u00b7 {n} reviews</span><span class="g-rating-demo">Demo number</span><span class="sr-only"> (opens Google Maps in a new tab)</span></a>')


ICON_PATHS = {
    "google": "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z M12 7a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z",
    "instagram": "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17.500 6.500h.01",
    "facebook": "M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.500a.5.5 0 0 1 .5-.5z",
}


def _icon(k):
    return f'<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="{ICON_PATHS[k]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>'


def _social():
    return [(k, label, cfg.get(key)) for k, label, key in (("google", "Find us on Google Maps", "googleMapsUrl"), ("instagram", "Follow us on Instagram", "instagramUrl"), ("facebook", "Find us on Facebook", "facebookUrl")) if cfg.get(key)]


def social_items_html():
    """Icon links (only those with a URL in the config). Opens in a new tab, with an accessible label."""
    return "".join(f'<li><a class="soc-link" href="{esc(u)}" target="_blank" rel="noopener" aria-label="{l} (opens in a new tab)">{_icon(k)}</a></li>' for k, l, u in _social())


def social_buttons_html():
    """Text buttons for the contact page: Google Maps and Instagram (and Facebook when set)."""
    return "".join(f'<a class="btn btn-secondary" href="{esc(u)}" target="_blank" rel="noopener">{_icon(k)} {l}<span class="sr-only"> (opens in a new tab)</span></a>' for k, l, u in _social())


def esc(s):
    return html.escape(str(s), quote=True)


def build():
    for p in DATA["products"]:
        p["isBag"] = p["art"] == "bag"
        p["isBottle"] = p["art"] == "bottle"
        p["isCup"] = p["art"] == "cup"
        p["isDripper"] = p["art"] == "dripper"
    (ROOT / "search-data.js").write_text(search_data())  # first, so its version hash below is the final one
    tabs, panels = menu_html()
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "email": cfg["contact"]["email"], "timezone": cfg["site"]["timezone"], "locale": cfg["site"]["locale"],
        "currency": cfg["site"]["currency"], "city": cfg["brand"]["city"],
        "hours": [{"day": h["day"], "name": h["name"], "open": h["openMin"], "close": h["closeMin"]} for h in cfg["hours"]],
        "holidays": {"mode": cfg["holidays"].get("mode", "closed"), "overrides": {k: {"status": o.get("status"), "open": o.get("openMin"), "close": o.get("closeMin")} for k, o in (cfg["holidays"].get("overrides") or {}).items()}},
        "closures": [{"date": k["date"], "name": k.get("name", ""), "status": k["status"], "open": k.get("openMin"), "close": k.get("closeMin")} for k in cfg.get("closures", [])],
        "notices": cfg.get("notices", []), "booking": cfg["booking"], "forms": {"endpoint": cfg["forms"].get("endpoint", "")},
        "announceEnd": cfg["announcement"].get("end", ""),
        "googleReviewUrl": cfg.get("googleReviewUrl", ""), "googleMapsUrl": cfg.get("googleMapsUrl", ""),
        "instagramUrl": cfg.get("instagramUrl", ""), "facebookUrl": cfg.get("facebookUrl", ""),
        "googleRating": cfg.get("googleRating") or 0, "googleReviewCount": cfg.get("googleReviewCount") or 0,
        "remindersEnabled": bool(cfg.get("remindersEnabled", False)), "reminderLeadHours": cfg.get("reminderLeadHours", 24),
        "waitlistEnabled": bool(cfg.get("waitlistEnabled", False)), "orderingEnabled": bool(cfg.get("orderingEnabled", True)),
        "busynessEnabled": bool(cfg.get("busynessEnabled", False)), "busyness": cfg.get("busyness") or {},
    }
    photo_map, photo_credits = photos_ctx()
    site_data["hoursPhrase"] = hours_phrase()
    base = {
        **cfg, **DATA, "photo": photo_map, "photoCredits": photo_credits, "hoursPhrase": hours_phrase(),
        "menuTabs": tabs, "menuPanels": panels, "hoursTable": hours_table(), "hoursSummary": hours_summary(),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "announce": cfg["announcement"],
        "year": datetime.date.today().year, "formsLive": bool(cfg["forms"].get("endpoint")), "assets": asset_versions(), "importMap": import_map(),
        "timeOptions": time_options(),
        "heroPrices": hero_prices(),
        "ratingOn": bool(cfg.get("googleRating") and cfg.get("googleReviewCount") and cfg.get("googleMapsUrl")),
        "ratingText": f'Rated {cfg.get("googleRating")} on Google \u00b7 {cfg.get("googleReviewCount")} reviews',
        "hasSocial": bool(cfg.get("googleMapsUrl") or cfg.get("instagramUrl") or cfg.get("facebookUrl")),
        "busyOn": bool(cfg.get("busynessEnabled") and (cfg.get("busyness") or {}).get("blocks")),
        "orderingEnabled": bool(cfg.get("orderingEnabled", True)),
        "remindersEnabled": bool(cfg.get("remindersEnabled", False)),
        "ratingHero": rating_html(), "ratingFooter": rating_html(), "socialItems": social_items_html(), "socialButtons": social_buttons_html(),
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "googleEmbed": "https://maps.google.com/maps?q=" + urllib.parse.quote(cfg["contact"]["mapsQuery"], safe="") + "&output=embed",
        "osmEmbed": "https://www.openstreetmap.org/export/embed.html?bbox=%s%%2C%s%%2C%s%%2C%s&layer=mapnik&marker=%s%%2C%s" % (
            cfg["contact"]["lon"] - 0.01, cfg["contact"]["lat"] - 0.006, cfg["contact"]["lon"] + 0.01, cfg["contact"]["lat"] + 0.006, cfg["contact"]["lat"], cfg["contact"]["lon"]),
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"] + [cfg["errorPage"]]:
        if page.get("requires") and not cfg.get(page["requires"]):  # a feature switched off in config: no page at all
            (ROOT / page["file"]).unlink(missing_ok=True)
            continue
        is404 = page is cfg["errorPage"]
        ctx = {**base, "page": {**page, "isHome": page["file"] == "index.html", "is404": is404,
                                "canonical": cfg["site"]["baseUrl"] + ("" if page["file"] == "index.html" else page["file"]),
                                "fullTitle": ("" if page["file"] == "index.html" else page["title"] + " | ") + cfg["brand"]["fullName"] + " (concept demo v2)"},
               "currentFile": page["file"]}
        ctx["jsonld"] = jsonld(page) if page.get("jsonld") else ""
        content = render_nodes(parse((TPL / "pages" / f'{page["template"]}.html').read_text()), [ctx])
        ctx["content"] = content
        out = render_nodes(layout, [ctx])
        (ROOT / page["file"]).write_text(out)
        print("wrote", page["file"], len(out))
    write_manifest()
    (ROOT / "robots.txt").write_text("User-agent: *\nDisallow:\n\nSitemap: " + cfg["site"]["baseUrl"] + "sitemap.xml\n")
    urls = "".join(f'  <url><loc>{cfg["site"]["baseUrl"]}{"" if p["file"] == "index.html" else p["file"]}</loc></url>\n' for p in cfg["pages"] if not (p.get("requires") and not cfg.get(p["requires"])))
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    print("wrote search-data.js, sitemap.xml, robots.txt")


if __name__ == "__main__":
    sys.exit(build())
