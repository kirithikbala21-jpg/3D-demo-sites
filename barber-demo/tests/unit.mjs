// Unit tests for js/clock.js (no browser needed): node tests/unit.mjs
import * as C from '../js/clock.js';
let n = 0, bad = 0;
const eq = (name, got, want) => { n++; const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { bad++; console.log('FAIL', name, 'got', JSON.stringify(got), 'want', JSON.stringify(want)); } else console.log('PASS', name); };
// Easter Sundays (published dates)
for (const [y, d] of [[2024, '2024-03-31'], [2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2028, '2028-04-16'], [2030, '2030-04-21'], [2038, '2038-04-25'], [2049, '2049-04-18']]) eq('easter ' + y, C.easterSunday(y), d);
const hol = (y) => Object.fromEntries(C.vicHolidays(y).map((h) => [h.name, h.date]));
// Victorian public holidays checked against the published Victorian government lists
eq('2024 VIC', hol(2024), { "New Year's Day": '2024-01-01', 'Australia Day': '2024-01-26', 'Labour Day': '2024-03-11', 'Good Friday': '2024-03-29', 'Easter Saturday': '2024-03-30', 'Easter Sunday': '2024-03-31', 'Easter Monday': '2024-04-01', 'Anzac Day': '2024-04-25', "King's Birthday": '2024-06-10', 'Melbourne Cup Day': '2024-11-05', 'Christmas Day': '2024-12-25', 'Boxing Day': '2024-12-26' });
const h26 = hol(2026);
eq('2026 Labour Day', h26['Labour Day'], '2026-03-09'); eq('2026 Good Friday', h26['Good Friday'], '2026-04-03'); eq('2026 Easter Monday', h26['Easter Monday'], '2026-04-06');
eq("2026 King's Birthday", h26["King's Birthday"], '2026-06-08'); eq('2026 Melbourne Cup', h26['Melbourne Cup Day'], '2026-11-03');
eq('2026 Australia Day (Mon)', h26['Australia Day'], '2026-01-26'); eq('2026 Boxing Day moves to Mon 28', h26['Boxing Day'], '2026-12-28'); eq('2026 Christmas Fri', h26['Christmas Day'], '2026-12-25');
eq('2027 Christmas Sat -> Mon 27', hol(2027)['Christmas Day'], '2027-12-27'); eq('2027 Boxing Sun -> Tue 28', hol(2027)['Boxing Day'], '2027-12-28');
eq('2022 Christmas Sun -> Tue 27', hol(2022)['Christmas Day'], '2022-12-27'); eq('2022 Boxing Mon 26', hol(2022)['Boxing Day'], '2022-12-26');
eq("2022 New Year's Day Sat -> Mon 3 Jan", hol(2022)["New Year's Day"], '2022-01-03'); eq("2023 New Year's Day Sun -> Mon 2 Jan", hol(2023)["New Year's Day"], '2023-01-02');
eq('2030 Labour Day', hol(2030)['Labour Day'], '2030-03-11'); eq('2045 King\'s Birthday', hol(2045)["King's Birthday"], '2045-06-12');
// time zone: Melbourne is UTC+11 in daylight saving and UTC+10 otherwise, whatever the device's zone
eq('DST on (UTC+11)', C.nowIn('Australia/Melbourne', new Date('2026-12-31T13:30:00Z')), { y: 2027, m: 1, d: 1, dow: 5, mins: 30, key: '2027-01-01' });
eq('DST off (UTC+10)', C.nowIn('Australia/Melbourne', new Date('2026-06-30T14:30:00Z')), { y: 2026, m: 7, d: 1, dow: 3, mins: 30, key: '2026-07-01' });
eq('DST starts 4 Oct 2026 (2am -> 3am)', [C.nowIn('Australia/Melbourne', new Date('2026-10-03T15:59:00Z')).mins, C.nowIn('Australia/Melbourne', new Date('2026-10-03T16:00:00Z')).mins], [119, 180]);
eq('DST ends 5 Apr 2026 (3am -> 2am)', [C.nowIn('Australia/Melbourne', new Date('2026-04-04T15:59:00Z')).mins, C.nowIn('Australia/Melbourne', new Date('2026-04-04T16:00:00Z')).mins], [179, 120]);
eq('addDays across month and year', [C.addDays('2026-12-31', 1), C.addDays('2028-02-28', 1), C.addDays('2026-03-01', -1)], ['2027-01-01', '2028-02-29', '2026-02-28']);
eq('addDays across the October DST change keeps dates', C.addDays('2026-10-03', 2), '2026-10-05');
// hours
const cfg = { region: 'VIC', hours: [{ day: 0, open: 600, close: 960 }, { day: 1, open: null, close: null }, ...[2, 3, 4, 5].map((d) => ({ day: d, open: 540, close: 1140 })), { day: 6, open: 480, close: 1020 }], closures: [{ date: '2026-12-24', name: 'Staff party', status: 'closed' }, { date: '2026-12-23', name: 'Late night', status: 'open', open: 540, close: 1260 }], holidays: { mode: 'closed', overrides: { "King's Birthday": { status: 'open', open: 600, close: 960 } } } };
const at = (key, hh, mm = 0) => C.statusAt({ key, mins: hh * 60 + mm }, cfg).text;
eq('open now', at('2026-10-21', 11), 'Open now, closes at 7pm');
eq('before opening', at('2026-10-21', 7), 'Opens today at 9am');
eq('after close -> tomorrow', at('2026-10-21', 19, 0), 'Closed now. Opens tomorrow at 9am');
eq('Saturday night -> Sunday', at('2026-10-24', 17), 'Closed now. Opens tomorrow at 10am');
eq('Sunday night -> Tuesday (Monday closed)', at('2026-10-25', 16), 'Closed now. Opens Tuesday at 9am');
eq('closed Monday', at('2026-10-26', 12), 'Closed today. Opens tomorrow at 9am');
eq('holiday closes the day', at('2026-03-09', 12), 'Closed today for Labour Day. Opens tomorrow at 9am');
eq('holiday override gives special hours', at('2026-06-08', 12), 'Open now, closes at 4pm');
eq('closure beats normal hours', at('2026-12-24', 12), 'Closed today for Staff party. Opens Saturday at 8am');
eq('special late hours', at('2026-12-23', 20), 'Open now, closes at 9pm');
const late = { region: 'VIC', hours: [{ day: 5, open: 1080, close: 1560 }, { day: 6, open: 1080, close: 1560 }], closures: [], holidays: false }; // Fri and Sat 6pm to 2am
eq('late night spills past midnight', C.statusAt({ key: '2026-10-24', mins: 90 }, late).text, 'Open now, closes at 2am');
eq('after the late close it is waiting for the evening', C.statusAt({ key: '2026-10-24', mins: 150 }, late).text, 'Opens today at 6pm');
// booking: today disappears once the last start has passed
eq('hasFutureSlot mid-day', C.hasFutureSlot('2026-10-21', { key: '2026-10-21', mins: 600 }, cfg, 60, 30), true);
eq('hasFutureSlot after last start (60 min service)', C.hasFutureSlot('2026-10-21', { key: '2026-10-21', mins: 1080 }, cfg, 60, 30), false);
eq('hasFutureSlot tomorrow is still fine', C.hasFutureSlot('2026-10-22', { key: '2026-10-21', mins: 1080 }, cfg, 60, 30), true);
eq('hasFutureSlot closed day', C.hasFutureSlot('2026-10-26', { key: '2026-10-21', mins: 0 }, cfg, 60, 30), false);
// banner
const ch = C.upcomingChanges({ key: '2026-12-21', mins: 600 }, cfg, 7).map(C.changeText);
eq('banner for closure and special hours', ch, ['Open Wednesday for Late night, 9am to 9pm.', 'Closed Thursday for Staff party.', 'Closed Friday for Christmas Day.']);
eq('no banner for a holiday on a day already closed (Monday)', C.upcomingChanges({ key: '2026-03-04', mins: 600 }, { ...cfg, closures: [] }, 7).filter((c) => c.name === 'Labour Day').length, 0);
eq('banner for a weekday holiday', C.upcomingChanges({ key: '2026-04-01', mins: 600 }, { ...cfg, closures: [] }, 7).map(C.changeText), ['Closed Friday for Good Friday.', 'Closed Saturday for Easter Saturday.', 'Closed Sunday for Easter Sunday.']);
eq('notices expire', [C.liveNotices([{ text: 'x', start: '2026-10-01', end: '2026-10-31' }], '2026-10-31').length, C.liveNotices([{ text: 'x', start: '2026-10-01', end: '2026-10-31' }], '2026-11-01').length, C.liveNotices([{ text: 'x' }], '2026-10-01').length], [1, 0, 0]);
eq('clock format', [C.fmtClock(540), C.fmtClock(570), C.fmtClock(1140), C.fmtClock(1560), C.fmtClock(1440), C.fmtClock(720), C.fmtClock(0)], ['9am', '9:30am', '7pm', '2am', 'midnight', '12pm', '12am']);
const nsw = (y) => Object.fromEntries(C.holidays(y, 'NSW').map((h) => [h.name, h.date]));
eq('NSW Labour Day 2026 (first Monday of October)', nsw(2026)['Labour Day'], '2026-10-05'); eq('NSW Labour Day 2025', nsw(2025)['Labour Day'], '2025-10-06'); eq('NSW Labour Day 2027', nsw(2027)['Labour Day'], '2027-10-04');
eq('NSW has no Melbourne Cup', 'Melbourne Cup Day' in nsw(2026), false); eq('NSW has no March Labour Day', C.holidays(2026, 'NSW').filter((h) => h.name === 'Labour Day').length, 1);
eq("NSW King's Birthday 2026", nsw(2026)["King's Birthday"], '2026-06-08'); eq('NSW Anzac Day 2026 (Saturday, no substitute)', nsw(2026)['Anzac Day'], '2026-04-25');
const nswCfg = { region: 'NSW', hours: cfg.hours, closures: [], holidays: { mode: 'closed' } };
eq('NSW: Labour Day closes the shop', C.statusAt({ key: '2026-10-05', mins: 12 * 60 }, nswCfg).text, 'Closed today for Labour Day. Opens tomorrow at 9am');
eq('NSW: first Monday of March is a normal day', C.statusAt({ key: '2026-03-09', mins: 12 * 60 }, nswCfg).state, 'closed');
console.log(`${n - bad}/${n} unit checks passed`); process.exit(bad ? 1 : 0);
