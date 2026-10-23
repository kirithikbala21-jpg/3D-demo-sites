// Australian phone numbers: 04xx xxx xxx mobiles, 02/03/07/08 landlines, 13xx xxxx and 1300/1800 numbers; +61 is accepted.
export const normPhone = (v) => { let d = String(v).replace(/[\s().-]/g, ''); if (/^\+?61/.test(d)) d = '0' + d.replace(/^\+?61/, '').replace(/^0/, ''); return d; };
export const phoneOk = (v) => { const d = normPhone(v); return /^0[2-478]\d{8}$/.test(d) || /^13\d{4}$/.test(d) || /^1[38]00\d{6}$/.test(d); };
export const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
/** Australian MOBILE only (for text reminders): 04xx xxx xxx or +61 4xx xxx xxx. Returns the 04 form, or null. */
export const auMobile = (v) => { const d = normPhone(v); return /^04\d{8}$/.test(d) ? d : null; };
