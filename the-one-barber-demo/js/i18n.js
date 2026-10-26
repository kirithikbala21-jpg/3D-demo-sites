// English / 中文 switch. Static text carries its Chinese in a data-zh attribute (see tools/templates/*). Pressing the button swaps
// the text and remembers the choice (localStorage key "tob-lang"). Text that JavaScript writes later (the booking calendar and its
// messages, form errors) stays in English; the "Open now / Closed, opens ..." banner is translated by zhStatus() below.
import { $, $$, store } from './util.js';

const KEY = 'tob-lang';
export const lang = () => (store(KEY) === 'zh' ? 'zh' : 'en');
const DAY_ZH = { Monday: '周一', Tuesday: '周二', Wednesday: '周三', Thursday: '周四', Friday: '周五', Saturday: '周六', Sunday: '周日', tomorrow: '明天', today: '今天' };
const time = (t) => t.replace(/(\d{1,2})(?::(\d{2}))?(am|pm)/i, (_, h, m, ap) => `${ap.toLowerCase() === 'am' ? '上午' : '下午'}${h}${m ? ':' + m : ''}点`.replace(/点$/, m ? '' : '点'));
/** Chinese for the opening-hours banner text, e.g. "Open now, closes at 6pm" -> "营业中，下午6点打烊". */
export function zhStatus(text) {
  let m;
  if ((m = text.match(/^Open now, closes at (.+)$/))) return `营业中，${time(m[1])}打烊`;
  if ((m = text.match(/^Opens today at (.+)$/))) return `今天${time(m[1])}开门`;
  if ((m = text.match(/^Closed (?:now|today)(?: for (.+))?\. Opens (tomorrow|\w+day) at (.+)$/))) return `已打烊${m[1] ? '（' + m[1] + '）' : ''}，${DAY_ZH[m[2]] || m[2]}${time(m[3])}开门`;
  if ((m = text.match(/^Closed, opens (tomorrow|\w+day) at (.+)$/))) return `已打烊，${DAY_ZH[m[1]] || m[1]}${time(m[2])}开门`;
  return text;
}
export const tr = (text) => (lang() === 'zh' ? zhStatus(text) : text);

function apply() {
  const zh = lang() === 'zh';
  document.documentElement.lang = zh ? 'zh-Hans' : 'en-AU';
  $$('[data-zh]').forEach((el) => {
    if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
    el.innerHTML = zh ? el.dataset.zh : el.dataset.en;
  });
  const btn = $('#lang-toggle');
  if (btn) { btn.setAttribute('aria-pressed', String(zh)); btn.setAttribute('aria-label', zh ? 'EN (English)' : '中文 (Chinese)'); $('.lang-en', btn).hidden = zh; $('.lang-zh', btn).hidden = !zh; }
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: zh ? 'zh' : 'en' } }));
}
const btn = $('#lang-toggle');
if (btn) btn.addEventListener('click', () => { store(KEY, lang() === 'zh' ? 'en' : 'zh'); apply(); });
if (lang() === 'zh') apply();
