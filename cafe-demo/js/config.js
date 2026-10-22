// Loads site.config.json (the ONE file the owner edits) and falls back to built-in defaults if it cannot be read.
// Hours are converted from "HH:MM" to minutes since midnight; a close time earlier than the open time means "after midnight".
const DEFAULTS = {
 "name": "Ember & Oak Coffee",
 "phone": "03 5550 0123",
 "email": "hello@example.com",
 "street": "12 Example Street",
 "locality": "Melbourne VIC 3000",
 "timezone": "Australia/Melbourne",
 "hours": [
  {
   "day": 1,
   "name": "Monday",
   "open": "07:00",
   "close": "16:00"
  },
  {
   "day": 2,
   "name": "Tuesday",
   "open": "07:00",
   "close": "16:00"
  },
  {
   "day": 3,
   "name": "Wednesday",
   "open": "07:00",
   "close": "16:00"
  },
  {
   "day": 4,
   "name": "Thursday",
   "open": "07:00",
   "close": "22:00"
  },
  {
   "day": 5,
   "name": "Friday",
   "open": "07:00",
   "close": "22:00"
  },
  {
   "day": 6,
   "name": "Saturday",
   "open": "07:00",
   "close": "22:00"
  },
  {
   "day": 0,
   "name": "Sunday",
   "open": "08:00",
   "close": "16:00"
  }
 ],
 "closures": [],
 "googleReviewUrl": "https://g.page/r/DEMO/review",
 "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=12%20Example%20Street%2C%20Melbourne%20VIC%203000",
 "instagramUrl": "https://www.instagram.com/demo_ember_and_oak/",
 "facebookUrl": "",
 "googleRating": 4.9,
 "googleReviewCount": 120,
 "remindersEnabled": true,
 "reminderLeadHours": 24,
 "waitlistEnabled": true,
 "orderingEnabled": true,
 "busynessEnabled": true,
 "busyness": {
  "blocks": [
   {
    "label": "Morning",
    "from": "07:00",
    "to": "11:00"
   },
   {
    "label": "Lunch",
    "from": "11:00",
    "to": "14:00"
   },
   {
    "label": "Afternoon",
    "from": "14:00",
    "to": "17:00"
   },
   {
    "label": "Evening",
    "from": "17:00",
    "to": "22:00"
   }
  ],
  "week": {
   "mon": [
    "quiet",
    "medium",
    "quiet",
    "closed"
   ],
   "tue": [
    "quiet",
    "medium",
    "quiet",
    "closed"
   ],
   "wed": [
    "quiet",
    "medium",
    "quiet",
    "closed"
   ],
   "thu": [
    "medium",
    "busy",
    "medium",
    "medium"
   ],
   "fri": [
    "medium",
    "busy",
    "medium",
    "busy"
   ],
   "sat": [
    "busy",
    "busy",
    "medium",
    "busy"
   ],
   "sun": [
    "medium",
    "busy",
    "quiet",
    "closed"
   ]
  }
 }
};

const toMin = (v) => { if (v === null || v === undefined || v === '') return null; const m = /^(\d{1,2}):(\d{2})$/.exec(String(v)); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const isUrl = (u) => typeof u === 'string' && /^https:\/\//.test(u.trim());

export function normalise(raw) {
  const c = { ...DEFAULTS, ...(raw || {}) };
  c.hours = (c.hours || []).map((h) => { const o = toMin(h.open); let cl = toMin(h.close); if (o !== null && cl !== null && cl <= o) cl += 1440; return { day: h.day, name: h.name, open: o, close: o === null ? null : cl }; });
  // links: anything that is not an https:// URL counts as "not set", so the feature that needs it is hidden (never a broken link)
  ['googleReviewUrl', 'googleMapsUrl', 'instagramUrl', 'facebookUrl'].forEach((k) => { c[k] = isUrl(c[k]) ? c[k].trim() : ''; });
  const r = Number(c.googleRating), n = Number(c.googleReviewCount);
  c.googleRating = r > 0 && r <= 5 ? r : 0; c.googleReviewCount = n > 0 ? Math.round(n) : 0;
  c.reminderLeadHours = Number(c.reminderLeadHours) >= 1 ? Number(c.reminderLeadHours) : 24;
  c.closures = Array.isArray(c.closures) ? c.closures : [];
  return c;
}

export async function loadConfig() {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch('site.config.json', { cache: 'no-cache', signal: ctl.signal }); clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return normalise(await res.json());
  } catch (err) { console.info('site.config.json could not be read, using built-in defaults.', err && err.message); return normalise(DEFAULTS); }
}
