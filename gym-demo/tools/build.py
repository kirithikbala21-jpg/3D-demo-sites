#!/usr/bin/env python3
"""Static site builder for the Volt Athletic Club demo (a sibling of barber-demo, same engine).

Usage:  python3 tools/build.py          (run from anywhere; writes the HTML pages next to site.config.json)

Content lives in:
  site.config.json   THE file the owner edits: business details, phone, address, hours, holidays, closures, notices, plans and prices,
                     coaches, class timetable, colours, nav, booking and form settings, page list
  data/*.json        journal, careers, faq, plan faq, photos (written by tools/add-photo.py)
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
DATA["plans"], DATA["coaches"], DATA["classes"] = cfg["plans"], cfg["coaches"], cfg["classes"]  # these live in the one owner file


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
        errs.append(f'contact > phone: "{c["phone"]}" does not look like an Australian number. Use something like "07 5550 0188" or "0412 345 678".')
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
    if cfg["holidays"].get("region", "QLD") not in ("QLD", "VIC"):
        errs.append('holidays > region must be "QLD" or "VIC".')
    for k in cfg.get("closures", []):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", k.get("date", "")):
            errs.append(f'closures: date "{k.get("date")}" must look like 2026-12-24 (year-month-day).')
        if k.get("status") not in ("closed", "open"):
            errs.append(f'closures > {k.get("date")}: status must be "closed" or "open".')
        try:
            k["openMin"], k["closeMin"] = normalise_hours(k, f'closures > {k.get("date")}')
        except ValueError as e:
            errs.append(str(e))
    for k, o in (cfg["holidays"].get("overrides") or {}).items():
        try:
            o["openMin"], o["closeMin"] = normalise_hours(o, f"holidays > overrides > {k}")
        except ValueError as e:
            errs.append(str(e))
    for n in cfg.get("notices", []):
        if not n.get("end"):
            errs.append(f'notices > "{n.get("text", "")[:30]}": add an "end" date (2026-12-31) so the notice hides itself when it is old.')
    for pl in cfg["plans"]:
        for key in ("monthly", "annual"):
            if not isinstance(pl[key], (int, float)) or pl[key] <= 0:
                errs.append(f'plans > {pl["name"]}: {key} must be a number like 89 (no $ sign).')
    ids = [x["id"] for x in cfg["classes"]]
    if len(ids) != len(set(ids)):
        errs.append("classes: two classes share the same id. Make each one different (for example tue-1730-power-hour).")
    coach_ids = {x["id"] for x in cfg["coaches"]}
    for cl in cfg["classes"]:
        if cl["coach"] not in coach_ids:
            errs.append(f'classes > {cl["id"]}: coach "{cl["coach"]}" is not in the coaches list.')
    if cfg["booking"].get("daysAhead", 90) < 90:
        errs.append("booking > daysAhead must be at least 90.")
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
    """Minutes since midnight -> 5:00am, 7:30am, 10:00pm (same wording the pages always used)."""
    t = mins % 1440
    h, m = divmod(t, 60)
    return f"{(h % 12) or 12}:{m:02d}{'am' if h < 12 else 'pm'}"


def hrs(mins):
    """Minutes -> hours as a plain number for the page data (5 or 7.5)."""
    v = mins / 60
    return int(v) if v == int(v) else round(v, 2)


def fmt_clock(hhmm):
    h, m = (int(x) for x in hhmm.split(":"))
    return f"{(h % 12) or 12}:{m:02d}{'am' if h < 12 else 'pm'}"


DAYS = [("mon", "Monday", 1), ("tue", "Tuesday", 2), ("wed", "Wednesday", 3), ("thu", "Thursday", 4), ("fri", "Friday", 5), ("sat", "Saturday", 6), ("sun", "Sunday", 0)]
DAYNAMES = {d[2]: d[1] for d in DAYS}
TYPES = ["Strength", "HIIT", "Yoga", "Mobility", "Boxing"]


def coach_by_id():
    return {c["id"]: c for c in DATA["coaches"]}


def spots_for(c):
    """Deterministic demo availability: the same class always shows the same number (about 1 in 13 classes is full)."""
    h = 7
    for ch in c["id"]:
        h = (h * 31 + ord(ch)) % 1009
    return 0 if h % 13 == 0 else 1 + h % c["capacity"]


def classes_html(compact=False):
    coaches = coach_by_id()
    chips = [f'<button type="button" class="filter-chip" data-filter="all" aria-pressed="true">All</button>']
    chips += [f'<button type="button" class="filter-chip" data-filter="{t}" aria-pressed="false">{t}</button>' for t in TYPES]
    tabs, panels = [], []
    for i, (key, name, _) in enumerate(DAYS):
        rows = sorted((c for c in DATA["classes"] if c["day"] == key), key=lambda c: c["start"])
        sel = "true" if i == 0 else "false"
        tabs.append(
            f'            <button role="tab" id="tab-{key}" aria-controls="day-{key}" aria-selected="{sel}" tabindex="{0 if i == 0 else -1}" type="button" data-n="{len(rows)}">'
            f'<span class="tab-day">{name[:3]}<span class="sr-only">{name[3:]}</span></span></button>\n'
        )
        items = []
        for c in rows:
            coach = coaches[c["coach"]]
            sp = spots_for(c)
            if sp == 0:
                spot_html, btn = '<span class="spots is-full">Full</span>', "Waitlist"
            elif sp <= 3:
                spot_html, btn = f'<span class="spots is-low">{sp} spot{"s" if sp != 1 else ""} left</span>', "Book"
            else:
                spot_html, btn = f'<span class="spots">{sp} spots left</span>', "Book"
            end_min = int(c["start"][:2]) * 60 + int(c["start"][3:]) + c["mins"]
            end = f"{end_min // 60:02d}:{end_min % 60:02d}"
            items.append(
                f'            <li class="class-row" id="c-{c["id"]}" data-type="{c["type"]}">\n'
                f'              <div class="cr-time"><strong>{fmt_clock(c["start"])}</strong><span>{c["mins"]} min</span></div>\n'
                f'              <div class="cr-main"><h3>{html.escape(c["name"])}</h3>'
                f'<p class="cr-meta"><span class="type-pill">{c["type"]}</span><span>with {coach["name"]}</span><span>{c["level"]}</span></p>'
                f'<p class="cr-desc">{c["desc"]}</p></div>\n'
                f'              <div class="cr-book">{spot_html}'
                f'<a class="btn btn-primary btn-sm" href="trial.html?class={c["id"]}">{btn}<span class="sr-only"> {html.escape(c["name"])}, {name} {fmt_clock(c["start"])}</span></a></div>\n'
                f'            </li>\n'
            )
        hid = "" if i == 0 else " hidden"
        panels.append(
            f'          <div role="tabpanel" id="day-{key}" aria-labelledby="tab-{key}" tabindex="0" class="day-panel" data-label="{name}" data-day="{key}"{hid}>\n'
            f'            <p class="panel-note">{name}: {len(rows)} classes, from {fmt_clock(rows[0]["start"])}</p>\n'
            f'            <ul class="class-list">\n{"".join(items)}            </ul>\n'
            f'            <p class="empty-note" hidden>No classes of that type on {name}. Try another day or clear the filter.</p>\n'
            f'          </div>\n'
        )
    return "".join(chips), "".join(tabs), "".join(panels)


def session_options():
    out = ['<option value="trial" data-mins="45">Free trial session (45 min)</option>']
    for key, name, dnum in DAYS:
        opts = []
        for c in sorted((c for c in DATA["classes"] if c["day"] == key), key=lambda c: c["start"]):
            opts.append(
                f'<option value="{c["id"]}" data-mins="{c["mins"]}" data-day="{dnum}" data-start="{c["start"]}" data-coach="{c["coach"]}">'
                f'{fmt_clock(c["start"])} {html.escape(c["name"])} ({c["mins"]} min)</option>'
            )
        out.append(f'<optgroup label="{name} classes">{"".join(opts)}</optgroup>')
    return "".join(out)


def hours_table():
    rows = "".join(
        f'              <tr data-day="{h["day"]}" data-open="{hrs(h["openMin"])}" data-close="{hrs(h["closeMin"])}"><th scope="row">{h["name"]}</th>'
        f'<td>{fmt_hour(h["openMin"])} &ndash; {fmt_hour(h["closeMin"])}</td></tr>\n'
        for h in cfg["hours"]
    )
    return (
        '<table class="hours">\n            <caption>Opening hours</caption>\n'
        '            <thead class="sr-only"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead>\n'
        f"            <tbody>\n{rows}            </tbody>\n          </table>"
    )


def hours_summary():
    """Compact grouped hours for the footer / overlay (Mon - Fri 5am - 10pm ...)."""
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
        lines.append(f'{days} {fmt_hour(g["key"][0]).replace(":00", "")} &ndash; {fmt_hour(g["key"][1]).replace(":00", "")}')
    return "<br>".join(lines)


def jsonld(page):
    b, c, s = cfg["brand"], cfg["contact"], cfg["site"]
    gym = {
        "@context": "https://schema.org",
        "@type": "ExerciseGym",
        "name": b["fullName"],
        "description": b["description"],
        "url": s["baseUrl"],
        "telephone": c["phoneIntl"],
        "email": c["email"],
        "priceRange": "$$",
        "makesOffer": [{"@type": "Offer", "name": "Memberships, group classes and coaching", "url": s["baseUrl"] + "membership.html"}],
        "address": {"@type": "PostalAddress", "streetAddress": c["street"], "addressLocality": b["city"],
                    "addressRegion": c["region"], "postalCode": c["postcode"], "addressCountry": c["country"]},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": DAYNAMES[h["day"]], "opens": f'{h["openMin"] // 60:02d}:{h["openMin"] % 60:02d}', "closes": f'{(h["closeMin"] % 1440) // 60:02d}:{h["closeMin"] % 60:02d}'}
            for h in cfg["hours"]
        ],
    }
    out = [gym]
    if page["file"] == "visit.html":
        out.append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in DATA["faq"]],
        })
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n  ' for o in out)


def search_data():
    coaches = coach_by_id()
    entries = [{"title": p["title"], "text": p["description"], "url": p["file"], "type": "Page"} for p in cfg["pages"] if not p.get("hidden")]
    for c in DATA["classes"]:
        day = DAYNAMES[{d[0]: d[2] for d in DAYS}[c["day"]]]
        entries.append({"title": f'{c["name"]} ({day} {fmt_clock(c["start"])})', "text": f'{c["type"]} class with {coaches[c["coach"]]["name"]}, {c["mins"]} min, {c["level"]}. {c["desc"]}', "url": f'classes.html#c-{c["id"]}', "type": "Classes"})
    for c in DATA["coaches"]:
        entries.append({"title": c["name"], "text": f'{plain(c["role"])}. {plain(c["bio"])}', "url": "coaches.html#coach-" + c["id"], "type": "Coaches"})
    for p in DATA["plans"]:
        entries.append({"title": p["name"] + " membership", "text": f'${p["monthly"]} a month, or ${p["annual"]} a month on annual billing. ' + ", ".join(p["features"]), "url": "membership.html#plan-" + p["id"], "type": "Membership"})
    for f in DATA["faq"]:
        entries.append({"title": plain(f["q"]), "text": plain(f["a"]), "url": "visit.html#faq", "type": "FAQ"})
    for f in DATA["planfaq"]:
        entries.append({"title": plain(f["q"]), "text": plain(f["a"]), "url": "membership.html#plan-faq", "type": "FAQ"})
    for j in DATA["journal"]:
        entries.append({"title": j["title"], "text": j["excerpt"], "url": "journal.html#" + j["id"], "type": "Journal"})
    for r in DATA["careers"]:
        entries.append({"title": plain(r["title"]), "text": r["text"], "url": "careers.html", "type": "Careers"})
    for e in cfg["searchExtra"]:
        entries.append({**e, "type": "Gym"})
    return "// Generated by tools/build.py. Do not edit by hand.\nexport default " + json.dumps(entries, ensure_ascii=False, indent=0) + ";\n"


def manifest():
    b, t = cfg["brand"], cfg["theme"]
    icons = [
        {"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": "img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        {"src": "img/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"},
    ]
    return json.dumps({
        "name": b["fullName"] + " (concept demo)", "short_name": b["short"], "id": "./index.html", "start_url": "./index.html", "scope": "./",
        "display": "standalone", "orientation": "portrait", "background_color": t["bg"], "theme_color": t["bg"], "lang": cfg["site"]["locale"],
        "description": "Concept website for a fictional gym: strength coaching, group classes, open gym and a free trial booking.",
        "categories": ["fitness", "health", "lifestyle"], "icons": icons,
    }, indent=1) + "\n"


# ----------------------------------------------------------------------------- build
def time_options():
    lo = min(h["openMin"] for h in cfg["hours"])
    hi = max(h["closeMin"] for h in cfg["hours"])
    out = ['<option value="">Any time</option>']
    t = lo
    while t <= hi - 30:
        h, m = divmod(t, 60)
        out.append(f'<option value="{h:02d}:{m:02d}">{(h % 12) or 12}:{m:02d}{"am" if h < 12 else "pm"}</option>')
        t += 30
    return "".join(out)


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
                                 f'width="{sl["w"]}" height="{sl["h"]}" {load}{pos}></span>')
            if sl.get("credit"):
                credits.setdefault(sl["credit"], {})[sl["file"]] = sl.get("label", "")
        else:
            html_by_slot[key] = (f'<span class="photo slot-empty" data-slot="{key}"><span class="slot-label"><strong>PHOTO SLOT: {key}</strong> - '
                                 f'{html.escape(sl.get("needs", sl.get("label", "")))}</span></span>')
    text = "; ".join(f'{c} ({", ".join(l for l in dict.fromkeys(files.values()) if l)})' if any(files.values()) else c for c, files in credits.items())
    return html_by_slot, text


def file_hash(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def asset_versions():
    """Version tags so a browser never shows a stale stylesheet or script after an update (they change only when the file changes)."""
    return {"css": file_hash("styles.css"), "lenisCss": file_hash("vendor/lenis-1.1.18.css"), "lenis": file_hash("vendor/lenis-1.1.18.min.js"), "main": file_hash("main.js")}


def import_map():
    """Every module gets ?v=hash through the import map (merged with the three.js entries the 3D hero needs)."""
    m = {"three": "./vendor/three.module.min.js", "three/addons/": "./vendor/addons/"}
    for rel in sorted([f"js/{p.name}" for p in (ROOT / "js").glob("*.js")] + ["scene.js", "search-data.js"]):
        m[f"./{rel}"] = f"./{rel}?v={file_hash(rel)}"
    return json.dumps({"imports": m})


def build():
    photos, credits = photo_slots()
    classes = DATA["classes"]
    for c in DATA["coaches"]:
        mine = [x for x in classes if x["coach"] == c["id"]]
        c["classNames"] = ", ".join(dict.fromkeys(x["name"] for x in sorted(mine, key=lambda x: x["name"])))
        c["weekly"] = len(mine)
        c["first"] = c["name"].split()[0]
        c["photoHtml"] = photos.get(c["photo"], "")
        c["tagsLine"] = " &middot; ".join(c["tags"])
    for p in DATA["plans"]:
        p["annualTotal"] = p["annual"] * 12
        p["save"] = round(100 * (p["monthly"] - p["annual"]) / p["monthly"])
        p["featuredClass"] = " plan-featured" if p["featured"] else ""
    chips, tabs, panels = classes_html()
    site_data = {
        "name": cfg["brand"]["name"], "phone": cfg["contact"]["phone"], "phoneHref": cfg["contact"]["phoneHref"],
        "email": cfg["contact"]["email"], "timezone": cfg["site"]["timezone"], "timezoneLabel": cfg["site"]["timezoneLabel"],
        "locale": cfg["site"]["locale"], "currency": cfg["site"]["currency"],
        "hours": [{"day": h["day"], "name": h["name"], "open": hrs(h["openMin"]), "close": hrs(h["closeMin"])} for h in cfg["hours"]],
        "holidays": {"region": cfg["holidays"].get("region", "QLD"), "mode": cfg["holidays"].get("mode", "normal"), "overrides": {k: {"status": o.get("status"), "open": o.get("openMin"), "close": o.get("closeMin")} for k, o in (cfg["holidays"].get("overrides") or {}).items()}},
        "closures": [{"date": k["date"], "name": k.get("name", ""), "status": k["status"], "open": k.get("openMin"), "close": k.get("closeMin")} for k in cfg.get("closures", [])],
        "notices": cfg.get("notices", []), "booking": cfg["booking"], "forms": {"endpoint": cfg["forms"].get("endpoint", "")},
        "coaches": {c["id"]: c["name"] for c in DATA["coaches"]},
    }
    base = {
        **cfg, **DATA,
        "classChips": chips, "classTabs": tabs, "classPanels": panels, "sessionOptions": session_options(),
        "classCount": len(classes), "maxSave": max(round(100 * (p["monthly"] - p["annual"]) / p["monthly"]) for p in DATA["plans"]), "hoursTable": hours_table(), "hoursSummary": hours_summary(),
        "siteData": json.dumps(site_data, ensure_ascii=False).replace("</", "<\\/"),
        "year": datetime.date.today().year, "assets": asset_versions(), "importMap": import_map(), "formsLive": bool(cfg["forms"].get("endpoint")),
        "photos": photos, "photoCredits": credits,
        "gmapEmbed": "https://maps.google.com/maps?q=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]) + "&output=embed",
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(cfg["contact"]["mapsQuery"]),
    }
    layout = parse((TPL / "layout.html").read_text())
    for page in cfg["pages"]:
        page["description"] = page["description"].replace("{phone}", cfg["contact"]["phone"])
        ctx = {**base, "page": {**page, "isHome": page["file"] == "index.html", "isNotFound": page["file"] == "404.html", "hasVisitModal": page["file"] in ("index.html", "visit.html"),
                                "canonical": cfg["site"]["baseUrl"] + ("" if page["file"] == "index.html" else page["file"]),
                                "fullTitle": ("" if page["file"] == "index.html" else page["title"] + " | ") + cfg["brand"]["fullName"] + " (concept demo)"},
               "currentFile": page["file"]}
        ctx["jsonld"] = jsonld(page) if page.get("jsonld") else ""
        content = render_nodes(parse((TPL / "pages" / f'{page["template"]}.html').read_text()), [ctx])
        ctx["content"] = content
        out = render_nodes(layout, [ctx])
        (ROOT / page["file"]).write_text(out)
        print("wrote", page["file"], len(out))
    (ROOT / "search-data.js").write_text(search_data())
    urls = "".join(f'  <url><loc>{cfg["site"]["baseUrl"]}{"" if p["file"] == "index.html" else p["file"]}</loc></url>\n' for p in cfg["pages"] if not p.get("hidden"))
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    (ROOT / "site.webmanifest").write_text(manifest())
    (ROOT / "robots.txt").write_text(f"User-agent: *\nDisallow:\n\nSitemap: {cfg['site']['baseUrl']}sitemap.xml\n")
    print("wrote search-data.js, sitemap.xml, site.webmanifest, robots.txt")


if __name__ == "__main__":
    sys.exit(build())
