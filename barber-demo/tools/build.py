#!/usr/bin/env python3
"""Static site builder for the Brass & Blade barbershop concept demo.

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)
Set SITE_ROOT=/some/copy to build a copy of the site (the tests do this).

Content lives in:
  site.config.json   THE file the owner edits: business details, phone, address, hours, holidays, closures, notices, services and
                     prices, shop products, staff, social links, colours, booking and form settings, page list
  data/*.json        journal, careers, faq, photos (written by tools/add-photo.py)
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
DATA["menu"], DATA["products"] = cfg["services"], cfg["products"]  # services and shop products live in the one owner file


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
    if not re.fullmatch(r"0[2-478]\d{8}|1[38]00\d{6}|13\d{4}", digits):
        errs.append(f'contact > phone: "{c["phone"]}" does not look like an Australian number. Use something like "02 5550 0144" or "0412 345 678".')
    else:
        c["phoneHref"] = "+61" + digits[1:] if digits.startswith("0") else digits  # what tel: links use (international format)
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", c["email"]):
        errs.append(f'contact > email: "{c["email"]}" is not an email address.')
    if cfg.get("region") not in ("NSW", "VIC"):
        errs.append('region: must be "NSW" or "VIC" (decides which public holidays are calculated).')
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
    ids = {cat["id"] for cat in cfg["services"]}
    names = [it["name"] for cat in cfg["services"] for it in cat["items"]]
    if len(names) != len(set(names)):
        errs.append("services: two services have the same name. Make each one different.")
    for cat in cfg["services"]:
        for it in cat["items"]:
            if not isinstance(it["price"], (int, float)) or it["price"] <= 0:
                errs.append(f'services > {it["name"]}: price must be a number like 48 (no $ sign).')
    for pr in cfg["products"]:
        if not isinstance(pr["price"], (int, float)) or pr["price"] <= 0:
            errs.append(f'products > {pr.get("name")}: price must be a number like 24 (no $ sign).')
    slugs = [x["slug"] for x in cfg["staff"]]
    if len(slugs) != len(set(slugs)):
        errs.append("staff: two people share the same slug (the short name used in links). Make each one different.")
    if not cfg["staff"]:
        errs.append("staff: add at least one person.")
    for k in ("googleReviewUrl", "googleMapsUrl", "instagramUrl", "facebookUrl"):
        v = cfg.get(k, "")
        if v and not re.fullmatch(r"https://\S+", v):
            errs.append(f'{k}: must start with https:// (or be empty "" to hide it). Found "{v}".')
    r, n = cfg.get("googleRating"), cfg.get("googleReviewCount")
    if r not in (None, "") and not (isinstance(r, (int, float)) and 0 < r <= 5):
        errs.append("googleRating: must be a number from 0 to 5 (use the business's REAL rating), or empty to hide the badge.")
    if n not in (None, "") and not (isinstance(n, int) and n > 0):
        errs.append("googleReviewCount: must be a whole number above 0 (use the REAL count), or empty to hide the badge.")
    if not isinstance(cfg.get("reminderLeadHours", 24), (int, float)) or cfg.get("reminderLeadHours", 24) < 1:
        errs.append("reminderLeadHours: must be a number of hours, 1 or more (24 = the day before).")
    for flag in ("remindersEnabled", "waitlistEnabled", "busynessEnabled", "openBannerEnabled"):
        if flag in cfg and not isinstance(cfg[flag], bool):
            errs.append(f"{flag}: must be true or false (no quote marks).")
    bz = cfg.get("busyness") or {}
    if bz.get("blocks"):
        nb = len(bz["blocks"])
        for day, row in (bz.get("week") or {}).items():
            if day not in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
                errs.append(f'busyness > week: "{day}" is not a day. Use mon, tue, wed, thu, fri, sat, sun.')
            elif len(row) != nb:
                errs.append(f"busyness > week > {day}: needs exactly {nb} entries (one per block).")
            else:
                for lv in row:
                    if lv not in ("quiet", "medium", "busy", "closed", None):
                        errs.append(f'busyness > week > {day}: "{lv}" must be quiet, medium, busy or closed.')
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
PRICES = {}


def resolve_tokens(text):
    """[[price:Skin Fade]] -> $52, [[memberFrom]] -> $79, [[deliveryFee]] / [[freeOver]]: so a price is only ever typed once, in site.config.json."""
    def one(m):
        key = m.group(1)
        if key.startswith("price:"):
            return "$" + format(PRICES[html.unescape(key[6:])], "g")
        return {"memberFrom": "$" + format(min(x["price"] for x in cfg["memberships"]), "g"), "deliveryFee": "$" + format(cfg["shop"]["deliveryFee"], "g"),
                "freeOver": "$" + format(cfg["shop"]["freeOver"], "g")}[key]
    return re.sub(r"\[\[([^\]]+)\]\]", one, text)


def plain(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", plain(s).lower()).strip("-")


def fmt_hour(mins, short=False):
    """Minutes since midnight -> 9:00am, 9:30am (short: 9am), midnight (same wording as js/clock.js)."""
    t = mins % 1440
    h, m = divmod(t, 60)
    if short:
        return f"{(h % 12) or 12}{':%02d' % m if m else ''}{'am' if h < 12 else 'pm'}"
    return f"{(h % 12) or 12}:{m:02d}{'am' if h < 12 else 'pm'}"


TAGS = {}  # service tags are free text such as "45 min" (see data/menu.json)


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
                t += '<span class="sig"><span aria-hidden="true">&#9733;</span> Popular</span>'
            t += "".join(f'<abbr title="Takes about {x}" class="tag">{x}</abbr>' for x in it["tags"])
            tags = f'\n              <p class="tags">{t}</p>' if t else ""
            thumb = (f'<img class="menu-thumb" src="{it["img"]}" alt="{html.escape(it.get("imgAlt", ""))}" width="88" height="88" loading="lazy">' if it.get("img") else "")
            items.append(
                f'            <article class="menu-item{" has-img" if thumb else ""}" id="{iid}">{thumb}\n'
                f'              <div class="menu-line"><h3>{it["name"]}</h3><span class="leader" aria-hidden="true"></span>'
                f'<span class="price">${it["price"]:.2f}</span>'
                f'<button type="button" class="add-btn" data-add data-id="{iid}" data-name="{html.escape(plain(it["name"]))}" '
                f'data-price="{it["price"]}" data-mins="{it.get("mins", 0)}" aria-label="Add {html.escape(plain(it["name"]))} to your visit"><span aria-hidden="true">+</span></button></div>\n'
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
        f'              <tr data-day="{h["day"]}"><th scope="row">{h["name"]}</th>'
        f'<td>{"Closed" if h["openMin"] is None else fmt_hour(h["openMin"]) + " &ndash; " + fmt_hour(h["closeMin"])}</td></tr>\n'
        for h in cfg["hours"]
    )
    return (
        '<table class="hours">\n            <caption>Opening hours</caption>\n'
        '            <thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>\n'
        f"            <tbody>\n{rows}            </tbody>\n          </table>"
    )


def hours_inline():
    """One-line hours for the hero (Mon 10am - 6pm, Tue - Fri 9am - 7pm ...), plain text."""
    return re.sub(r"\s+", " ", html.unescape(hours_summary().replace("<br>", ", ")))


def hours_summary():
    """Compact grouped hours for the footer / overlay (Mon - Wed 7am - 4pm ...)."""
    order = [1, 2, 3, 4, 5, 6, 0]
    by = {h["day"]: h for h in cfg["hours"]}
    groups, cur = [], None
    for d in order:
        h = by[d]
        key = (h["openMin"], h["closeMin"])
        if cur and cur["key"] == key:
            cur["days"].append(h["name"][:3])
        else:
            cur = {"key": key, "days": [h["name"][:3]]}
            groups.append(cur)
    lines = []
    for g in groups:
        days = g["days"][0] if len(g["days"]) == 1 else f'{g["days"][0]} &ndash; {g["days"][-1]}'
        lines.append(f'{days} closed' if g["key"][0] is None else f'{days} {fmt_hour(g["key"][0], True)} &ndash; {fmt_hour(g["key"][1], True)}')
    return "<br>".join(lines)


DAYNAMES = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}


def jsonld(page):
    b, c, s = cfg["brand"], cfg["contact"], cfg["site"]
    shop = {
        "@context": "https://schema.org",
        "@type": "BarberShop",
        "name": b["fullName"],
        "description": b["description"],
        "url": s["baseUrl"],
        "telephone": "+61" + c["phoneHref"][3:],
        "email": c["email"],
        "priceRange": "$$",
        "makesOffer": [{"@type": "Offer", "name": "Haircuts, shaves and beard grooming", "url": s["baseUrl"] + "services.html"}],
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": c["city"] if "city" in c else cfg["brand"]["city"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": DAYNAMES[h["day"]], "opens": f'{h["openMin"] // 60:02d}:{h["openMin"] % 60:02d}',
             "closes": f'{(h["closeMin"] % 1440) // 60:02d}:{h["closeMin"] % 60:02d}'}
            for h in cfg["hours"] if h["openMin"] is not None
        ],
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
    same = [x["href"] for x in cfg.get("social", []) if urllib.parse.urlparse(x["href"]).path.strip("/")]
    if same:
        shop["sameAs"] = same
    out = [shop]
    if page["file"] == "visit.html":
        out.append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
        })
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in out)


def search_data():
    pages = {p["file"]: p for p in cfg["pages"]}
    entries = [{"title": p["title"], "text": p["description"], "url": p["file"], "type": "Page"} for p in cfg["pages"] if not p.get("hidden")]
    for cat in DATA["menu"]:
        for it in cat["items"]:
            tag_words = ", ".join(it["tags"]) + (", popular" if it["sig"] else "")
            entries.append({"title": plain(it["name"]), "text": f'{plain(it["desc"])} {tag_words}. {cat["label"].replace("&amp;", "and")}. ${it["price"]:.2f}', "url": f'services.html#m-{slug(it["name"])}', "type": "Services"})
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
    for st in cfg["staff"]:
        entries.append({"title": f'{st["name"]}, {st["role"].lower()}', "text": st["blurb"], "url": "barbers.html", "type": "Experiences"})
    for m in cfg["memberships"]:
        entries.append({"title": f'{m["name"]} membership', "text": f'{m["headline"]}. ${m["price"]} per month', "url": "membership.html", "type": "Experiences"})
    return "// Generated by tools/build.py. Do not edit by hand.\nexport default " + resolve_tokens(json.dumps(entries, ensure_ascii=False, indent=0)) + ";\n"


VENUES = [
    ("Barbershop", "services.html", '<svg width="14" height="14" aria-hidden="true" focusable="false"><use href="#logo-mark"/></svg>'),
    ("The crew", "barbers.html", '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-8 8-8s8 3 8 8"/></svg>'),
    ("Shop", "shop.html", '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 8h14l-1.500 12h-11zM9 8a3 3 0 0 1 6 0"/></svg>'),
    ("Visit", "visit.html", '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.500"/></svg>'),
]


# ----------------------------------------------------------------------------- build
def time_options():
    opens = [h for h in cfg["hours"] if h["openMin"] is not None]
    lo = min(h["openMin"] for h in opens)
    hi = max(h["closeMin"] for h in opens)
    out = ['<option value="">Any time</option>']
    t = lo
    while t <= min(hi, 1440) - 30:
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


def import_map():
    """One import map for every page: Three.js plus every module with ?v=hash, so a changed module is fetched fresh while unchanged ones stay cached."""
    m = {"three": "./vendor/three.module.min.js?v=" + file_hash("vendor/three.module.min.js"), "three/addons/": "./vendor/addons/"}
    for rel in sorted([f"js/{p.name}" for p in (ROOT / "js").glob("*.js")] + ["scene.js", "search-data.js"]):
        m["./" + rel] = f"./{rel}?v={file_hash(rel)}"
    return json.dumps({"imports": m})


def photo_slots():
    """Real photos live in img/photos/ and are listed in data/photos.json (see tools/add-photo.py). A slot renders only when its file exists."""
    slots = DATA.get("photos", {}).get("slots", {})
    html_by_slot, credits = {}, {}
    for key, sl in slots.items():
        if (ROOT / sl["file"]).exists():
            pos = f' style="object-position:{sl["pos"]}"' if sl.get("pos") else ""
            load = 'fetchpriority="high" decoding="async"' if sl.get("eager") else 'loading="lazy" decoding="async"'
            html_by_slot[key] = (f'<span class="photo"><img src="{sl["file"]}" alt="{html.escape(sl["alt"], quote=True)}" '
                                 f'width="{sl["w"]}" height="{sl["h"]}" {load}{pos}></span>')
            if sl.get("credit"):
                credits.setdefault(sl["credit"], {})[sl["file"]] = sl.get("label", "")
        else:
            html_by_slot[key] = ""
    # one line per distinct credit, listing the photos it covers: "Photo: Unsplash (Hero chair, Skin fade, ...)"
    text = "; ".join(f'{c} ({", ".join(l for l in dict.fromkeys(files.values()) if l)})' if any(files.values()) else c for c, files in credits.items())
    return html_by_slot, text


def esc(s):
    return html.escape(str(s), quote=True)


def stars_svg(rating):
    """Five SVG stars, filled to the rating (static markup, no JavaScript needed)."""
    pct = round(max(0, min(5, float(rating))) / 5 * 100, 2)
    star = "".join(f'<path transform="translate({i * 20} 0)" d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z"/>' for i in range(5))
    uid = "rs%d" % abs(hash(str(rating) + str(len(_STARS)))); _STARS.append(uid)
    return (f'<svg class="g-stars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 19" width="95" height="18" aria-hidden="true" focusable="false">'
            f'<defs><clipPath id="{uid}"><rect width="{pct:g}" height="19"/></clipPath></defs><g fill="rgba(242,235,221,.3)">{star}</g><g fill="#E4C77A" clip-path="url(#{uid})">{star}</g></svg>')


_STARS = []


def rating_badge(where):
    """"Rated 4.9 on Google · 120 reviews" badge, or "" when the rating, count or Maps link is missing. The numbers are DEMO numbers."""
    r, n, u = cfg.get("googleRating"), cfg.get("googleReviewCount"), cfg.get("googleMapsUrl")
    if not (r and n and u):
        return ""
    demo = '<span class="g-rating-demo">Demo number</span>'
    return (f'<a class="g-rating g-rating-{where}" href="{esc(u)}" target="_blank" rel="noopener" '
            f'aria-label="Rated {r} on Google · {n} reviews Demo number (opens Google Maps in a new tab)">{stars_svg(r)}'
            f'<span class="g-rating-text">Rated {r} on Google · {n} reviews</span> {demo}</a>')


ICON_PATHS = {
    "google": "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z M12 7a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z",
    "instagram": "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17.500 6.500h.01",
    "facebook": "M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.500a.5.5 0 0 1 .5-.5z",
    "star": "M12 3l2.800 5.800 6.200.9-4.500 4.400 1.100 6.200L12 17.300 6.400 20.300l1.100-6.200L3 9.700l6.200-.9z",
}


def _icon(k):
    return (f'<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="{ICON_PATHS[k]}" fill="none" '
            'stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>')


def _social_items():
    return [(k, lab, cfg.get(key)) for k, lab, key in (("google", "Find us on Google Maps", "googleMapsUrl"), ("instagram", "Follow us on Instagram", "instagramUrl"), ("facebook", "Find us on Facebook", "facebookUrl")) if cfg.get(key)]


def social_icons():
    """Icon links for the footer and contact page; a link appears only when its URL is set in site.config.json."""
    return "".join(f'<li><a class="soc-link" href="{esc(u)}" target="_blank" rel="noopener" aria-label="{lab} (opens in a new tab)">{_icon(k)}</a></li>' for k, lab, u in _social_items())


def social_buttons():
    return "".join(f'<a class="btn btn-secondary" href="{esc(u)}" target="_blank" rel="noopener">{_icon(k)} {lab}</a>' for k, lab, u in _social_items() if k != "facebook") + \
        "".join(f'<a class="btn btn-secondary" href="{esc(u)}" target="_blank" rel="noopener">{_icon(k)} {lab}</a>' for k, lab, u in _social_items() if k == "facebook")


def build():
    for p in DATA["products"]:
        p["isJar"] = p["art"] == "jar"
        p["isBottle"] = p["art"] == "bottle"
        p["isComb"] = p["art"] == "comb"
        p["isRazor"] = p["art"] == "razor"
    for cat in DATA["menu"]:
        for it in cat["items"]:
            it["plainName"] = plain(it["name"])
            it["slug"] = slug(it["name"])
    for cat in DATA["menu"]:
        for it in cat["items"]:
            PRICES[html.unescape(it["name"])] = it["price"]
    for pg in cfg["pages"]:
        pg["description"] = resolve_tokens(pg["description"])
    cfg["announcement"]["text"] = resolve_tokens(cfg["announcement"]["text"])
    tabs, panels = menu_html()
    (ROOT / "search-data.js").write_text(search_data())  # written before the import map hashes it
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "email": cfg["contact"]["email"], "timezone": cfg["site"]["timezone"], "locale": cfg["site"]["locale"],
        "currency": cfg["site"]["currency"], "region": cfg["region"],
        "hours": [{"day": h["day"], "name": h["name"], "open": h["openMin"], "close": h["closeMin"]} for h in cfg["hours"]],
        "holidays": {"mode": cfg["holidays"].get("mode", "closed"), "overrides": {k: {"status": o.get("status"), "open": o.get("openMin"), "close": o.get("closeMin")} for k, o in (cfg["holidays"].get("overrides") or {}).items()}},
        "closures": [{"date": k["date"], "name": k.get("name", ""), "status": k["status"], "open": k.get("openMin"), "close": k.get("closeMin")} for k in cfg.get("closures", [])],
        "notices": cfg.get("notices", []), "booking": cfg["booking"], "forms": {"endpoint": cfg["forms"].get("endpoint", "")},
        "growth": {k: cfg.get(k) for k in ("googleReviewUrl", "googleMapsUrl", "instagramUrl", "facebookUrl", "googleRating", "googleReviewCount", "remindersEnabled",
                                           "reminderLeadHours", "waitlistEnabled", "busynessEnabled", "openBannerEnabled", "busyness")},
    }
    staff = []
    for st in cfg["staff"]:
        st = dict(st)
        st["initial"] = st["name"][:1].upper()
        st["isApprentice"] = "apprentice" in st["role"].lower()
        st["photoHtml"] = photo_slots()[0].get(st.get("photo", ""), "")
        staff.append(st)
    base = {
        **cfg, **DATA,
        "menuTabs": tabs, "menuPanels": panels, "hoursTable": hours_table(), "hoursSummary": hours_summary(),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "year": datetime.date.today().year, "years": datetime.date.today().year - cfg["brand"]["established"],
        "giftAmounts": [{"amount": a, "checked": a == cfg["giftCards"]["default"]} for a in cfg["giftCards"]["amounts"]],
        "staffList": staff, "formsLive": bool(cfg["forms"].get("endpoint")), "assets": asset_versions(), "importMap": import_map(),
        "timeOptions": time_options(),
        "ratingHero": rating_badge("hero"), "ratingFooter": rating_badge("footer"), "socialIcons": social_icons(), "socialButtons": social_buttons(),
        "hasBusyness": bool(cfg.get("busynessEnabled", True) and (cfg.get("busyness") or {}).get("blocks")),
        "hasOpenBanner": cfg.get("openBannerEnabled", True),
        "hasReviewLink": bool(cfg.get("googleReviewUrl")),
        "suburb": re.split(r"\s+(?:NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b", cfg["contact"]["locality"])[0],
        "hoursInline": hours_inline(),
        "minPrice": int(min(it["price"] for cat in cfg["services"] for it in cat["items"])),
        "photos": photo_slots()[0], "photoCredits": photo_slots()[1],
        "gmapEmbed": "https://maps.google.com/maps?q=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]) + "&output=embed",
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
        "osmEmbed": "https://www.openstreetmap.org/export/embed.html?bbox=%s%%2C%s%%2C%s%%2C%s&layer=mapnik&marker=%s%%2C%s" % (
            cfg["contact"]["lon"] - 0.01, cfg["contact"]["lat"] - 0.006, cfg["contact"]["lon"] + 0.01, cfg["contact"]["lat"] + 0.006, cfg["contact"]["lat"], cfg["contact"]["lon"]),
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"]:
        if page.get("requires") and not cfg.get(page["requires"]):  # a page whose config value is empty is not built at all
            page["hidden"] = True
            if (ROOT / page["file"]).exists():
                (ROOT / page["file"]).unlink()
            continue
        page["description"] = page["description"].replace("{phone}", cfg["contact"]["phone"])
        ctx = {**base, "page": {**page, "isHome": page["file"] == "index.html", "isNotFound": page["file"] == "404.html",
                                "canonical": cfg["site"]["baseUrl"] + ("" if page["file"] == "index.html" else page["file"]),
                                "fullTitle": ("" if page["file"] == "index.html" else page["title"] + " | ") + cfg["brand"]["fullName"] + " (concept demo)"},
               "currentFile": page["file"]}
        ctx["jsonld"] = jsonld(page) if page.get("jsonld") else ""
        content = render_nodes(parse((TPL / "pages" / f'{page["template"]}.html').read_text()), [ctx])
        ctx["content"] = content
        out = resolve_tokens(render_nodes(layout, [ctx]))
        (ROOT / page["file"]).write_text(out)
        print("wrote", page["file"], len(out))
    (ROOT / "robots.txt").write_text("User-agent: *\nDisallow:\n\nSitemap: " + cfg["site"]["baseUrl"] + "sitemap.xml\n")
    urls = "".join(f'  <url><loc>{cfg["site"]["baseUrl"]}{"" if p["file"] == "index.html" else p["file"]}</loc></url>\n' for p in cfg["pages"] if not p.get("hidden"))
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    print("wrote search-data.js, sitemap.xml")


if __name__ == "__main__":
    sys.exit(build())
