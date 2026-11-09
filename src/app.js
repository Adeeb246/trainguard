/* TrainGuard app. Parsing lives in parser.js, timetable lookups in timetable.js, all text in i18n.js. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const APP_URL = 'https://trainguard-cyan.vercel.app/';
const PNR_URL = 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en';
const KEY = { trips: 'trainguard_trips_v2', legacy: 'trainguard_saved_ticket_v1', theme: 'trainguard_theme_v2', lang: 'trainguard_lang', sound: 'trainguard_sound_enabled', haptic: 'trainguard_haptic_enabled', commute: 'trainguard_commute_min', gps: 'trainguard_gps_wake', backup: 'trainguard_backup_alarm' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

const ICONS = {
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/>',
  share: '<path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  flip: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>'
};
const ico = (n, s = 22, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const LOGO = '<svg class="logo" viewBox="0 0 120 120" role="img" aria-label="TrainGuard"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2C2B"/><stop offset="1" stop-color="#0C0D0C"/></linearGradient></defs><rect width="120" height="120" fill="url(#lg)"/><g stroke="#4ADE80" stroke-linecap="round" fill="none"><path d="M34 102 54 36" stroke-width="7"/><path d="M86 102 66 36" stroke-width="7"/><path d="M38 88h44" stroke-width="5.5"/><path d="M44 69h32" stroke-width="5"/><path d="M49 52h22" stroke-width="4.5"/></g><circle cx="60" cy="23" r="7.5" fill="#4ADE80"/><circle cx="60" cy="23" r="13" fill="#4ADE80" opacity=".18"/></svg>';

const LANGS = [['en', 'English'], ['ml', 'മലയാളം'], ['hi', 'हिंदी'], ['ta', 'தமிழ்']];
const LOCALES = { en: 'en-GB', ml: 'ml-IN', hi: 'hi-IN', ta: 'ta-IN' };
const TAB_ORDER = ['pass', 'journey', 'safety'];
const COMMUTES = [15, 30, 45, 60, 90];
const STATION_BUFFER = 30;

const state = {
  tab: 'pass', tripId: null, flipped: false, big: false, sun: false, sheet: null,
  lang: store.get(KEY.lang, 'en'), theme: store.get(KEY.theme, 'dark'),
  sound: store.get(KEY.sound, 'true') === 'true', haptics: store.get(KEY.haptic, 'true') === 'true',
  commute: parseInt(store.get(KEY.commute, '30'), 10) || 30,
  gps: store.get(KEY.gps, 'false') === 'true', backup: store.get(KEY.backup, 'false') === 'true', // off until asked for, because each one triggers a permission prompt
  add: {}, pay: {}, share: { seat: true, pnr: false }
};
if (!I18N[state.lang]) state.lang = 'en';
const L = (k, v) => tr(state.lang, k, v);

const isNative = () => !!window.Capacitor?.isNativePlatform?.();
const isIOSNative = () => isNative() && window.Capacitor.getPlatform?.() === 'ios';
const REDUCED = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
const pad = n => String(n).padStart(2, '0');
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmt = formatTo12Hour;
const atTime = d => fmt(hhmm(d));
const spaced = p => p ? p.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') : L('pnrUnknown');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function fmtDate(iso) {
  if (!iso) return L('dateUnknown');
  try { return new Intl.DateTimeFormat(LOCALES[state.lang], { weekday: 'short', day: 'numeric', month: 'short' }).format(ttDate(iso)); } catch (e) { return iso; }
}
function durText(ms) {
  const mins = Math.max(0, Math.round(ms / 60000)), h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h}h ${pad(m)}m` : `${m}m`;
}
const BERTH_KEYS = { LB: 'bLower', MB: 'bMiddle', UB: 'bUpper', SL: 'bSideLower', SU: 'bSideUpper', SM: 'bSideMiddle', WS: 'bWindow', MS: 'bMiddleSeat', AS: 'bAisle' };
const berthWord = code => code && BERTH_KEYS[code] ? L(BERTH_KEYS[code]) : '';
const seatText = p => p.status?.code === 'RAC' ? `RAC ${p.status.number}` : p.status?.code === 'WL' ? `WL ${p.status.number}` : (p.berthNo ?? '—');
const firstName = n => n ? n.trim().split(/\s+/)[0].replace(/^(\w)(\w*)$/, (_, a, b) => a + b.toLowerCase()) : '';
const titleName = n => n ? n.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()) : '';

/* ---------- Trips: records hold the raw ticket, everything else is derived ---------- */
function loadRecords() {
  let out = [];
  try { out = JSON.parse(store.get(KEY.trips, '[]')) || []; } catch (e) {}
  const legacy = store.get(KEY.legacy, null);
  if (legacy && !out.length && parseTicketText(legacy)) {
    out = [{ id: uid(), raw: legacy }];
    if (store.set(KEY.trips, JSON.stringify(out))) store.del(KEY.legacy);
  }
  return out;
}
let recs = loadRecords();
let sharedRec = readSharedLink();
let TT = null;
let cache = new WeakMap();

function saveRecords() { if (!store.set(KEY.trips, JSON.stringify(recs))) toast(L('saveFail')); }

/* Shared links are untrusted input: every field is checked before it can reach a trip. */
function validShared(s) {
  if (!s || !/^\d{5}$/.test(s.trainNo || '')) return null;
  const ok = (v, re) => typeof v === 'string' && re.test(v) ? v : null;
  const dateISO = ok(s.dateISO, /^\d{4}-\d{2}-\d{2}$/);
  const time = ok(s.time, /^([01]\d|2[0-3]):[0-5]\d$/);
  const coach = ok(s.coach, /^[A-Z0-9]{1,4}$/);
  const berthNo = ok(s.berthNo, /^\d{1,3}$/);
  const name = typeof s.name === 'string' ? s.name.replace(/[^\p{L} .']/gu, '').slice(0, 40) : null;
  const passenger = { name, coach, berthNo, berthType: coach && berthNo ? getBerthTypeFromNumber(berthNo, coach) : null, status: coach ? { code: 'CNF', number: null } : null };
  return { trainNo: s.trainNo, trainName: typeof s.trainName === 'string' ? s.trainName.replace(/[^\p{L}\d .\-]/gu, '').slice(0, 50).toUpperCase() : null, time, time12: fmt(time), fromStn: ok(s.fromStn, /^[A-Z]{2,5}$/), toStn: ok(s.toStn, /^[A-Z]{2,5}$/), date: dateISO, dateISO, departureDate: null, coach, berthNo, berthType: passenger.berthType, pnr: ok(s.pnr, /^\d{10}$/), status: passenger.status, passengers: coach || name ? [passenger] : [], classCode: null, className: null, fare: null, missing: [] };
}
function readSharedLink() {
  try {
    const m = location.hash.match(/^#trip=([A-Za-z0-9_-]+)$/);
    if (m) {
      const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))));
      const shared = validShared(JSON.parse(json));
      return shared ? { id: 'shared', shared } : null;
    }
    // Links shared before the redesign used query parameters
    const p = new URLSearchParams(location.search), train = p.get('train');
    if (train) {
      const d = (p.get('date') || '').match(/^(\d{2})-([A-Z]{3})-(\d{4})$/);
      const month = d ? ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(d[2]) + 1 : 0;
      const shared = validShared({ trainNo: train, trainName: p.get('name'), fromStn: p.get('from'), toStn: p.get('to'), time: p.get('time'), dateISO: month ? `${d[3]}-${pad(month)}-${d[1]}` : null, coach: p.get('coach'), berthNo: p.get('berth'), pnr: p.get('pnr') });
      return shared ? { id: 'shared', shared } : null;
    }
  } catch (e) {}
  return null;
}
function shareLink(t, opts) {
  const p = t.passengers[0] || {};
  const body = { trainNo: t.trainNo, trainName: t.name, fromStn: t.fromStn, toStn: t.toStn, dateISO: t.dateISO, time: t.time, name: firstName(p.name) || undefined };
  if (opts.seat && p.coach) { body.coach = p.coach; body.berthNo = p.berthNo; }
  if (opts.pnr && t.pnr) body.pnr = t.pnr;
  const enc = btoa(unescape(encodeURIComponent(JSON.stringify(body)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${APP_URL}#trip=${enc}`;
}

function buildTrip(rec) {
  const base = rec.raw ? parseTicketText(rec.raw) : rec.shared;
  if (!base) return null;
  const t = { ...base, rec, id: rec.id, platform: rec.platform || null, isShared: !rec.raw, sample: !!rec.sample, missing: [...(base.missing || [])] };
  if (!t.time && rec.time) { t.time = rec.time; t.time12 = fmt(rec.time); t.missing = t.missing.filter(m => m !== 'time'); }
  t.departureDate = null;
  if (t.time && t.dateISO) { const d = ttDate(t.dateISO), [h, m] = t.time.split(':').map(Number); d.setHours(h, m, 0, 0); t.departureDate = d; }
  t.facts = TT ? ttTrainFacts(TT, t) : null;
  t.name = t.trainName ? titleName(t.trainName) : t.facts?.name || null;
  const from = TT && t.fromStn ? ttStation(TT, t.fromStn) : null, to = TT && t.toStn ? ttStation(TT, t.toStn) : null;
  t.fromName = from?.name || t.fromStn || '?';
  t.toName = to?.name || t.toStn || '?';
  t.toCoords = to && to.lat != null ? { lat: to.lat, lon: to.lon } : null;
  t.arrivalDate = t.facts?.durMin != null && t.departureDate ? new Date(+t.departureDate + t.facts.durMin * 60000) : null;
  t.near = TT ? ttTrainsNear(TT, t) : null;
  t.not = t.near?.nearest || null;
  return t;
}
function tripOf(rec) {
  if (!cache.has(rec)) cache.set(rec, buildTrip(rec));
  return cache.get(rec);
}
function refreshTrip(rec) { cache.delete(rec); }
const isPast = (t, now = Date.now()) => t.departureDate ? +(t.arrivalDate || new Date(+t.departureDate + 864e5)) + 6 * 36e5 < now : false;
function tripLists() {
  const all = recs.map(tripOf).filter(Boolean), byDep = (a, b) => (+a.departureDate || Infinity) - (+b.departureDate || Infinity);
  return { upcoming: all.filter(t => !isPast(t)).sort(byDep), past: all.filter(t => isPast(t)).sort((a, b) => byDep(b, a)) };
}
function current() {
  if (sharedRec && state.tripId === sharedRec.id) return tripOf(sharedRec);
  const picked = recs.find(r => r.id === state.tripId);
  if (picked && tripOf(picked)) return tripOf(picked);
  const { upcoming, past } = tripLists();
  return upcoming[0] || past[0] || null;
}
function sampleSms() {
  const d = new Date(Date.now() + 864e5);
  return `PNR:1234567890,TRN:16630,DOJ:${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)},SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970,C Fee:11.8+PG\n-IRCTC`;
}

/* ---------- Stages follow the clock ---------- */
const leaveAt = t => t.departureDate ? new Date(+t.departureDate - (state.commute + STATION_BUFFER) * 60000) : null;
const reachAt = t => t.departureDate ? new Date(+t.departureDate - STATION_BUFFER * 60000) : null;
const wakeAt = t => t.arrivalDate ? new Date(+t.arrivalDate - 30 * 60000) : null;
function stageOf(t, now = Date.now()) {
  if (!t.departureDate) return 'plan';
  const dep = +t.departureDate;
  if (now < +leaveAt(t)) return 'plan';
  if (now < +reachAt(t)) return 'leave';
  if (now < dep - 10 * 60000) return 'station';
  if (now < dep) return 'boarding';
  if (t.arrivalDate) {
    if (now < +wakeAt(t)) return 'onboard';
    return now < +t.arrivalDate ? 'wake' : 'arrived';
  }
  return now < dep + 864e5 ? 'onboard' : 'arrived';
}
function stageChip(t, stage, now = Date.now()) {
  if (stage === 'plan') {
    const ms = +leaveAt(t) - now, days = Math.floor((ttDate(t.dateISO) - new Date(new Date(now).toDateString())) / 864e5);
    return days >= 2 ? L('inDays', { n: days }) : L('inDur', { d: durText(ms) });
  }
  if (stage === 'leave') return L('now');
  if (stage === 'station' || stage === 'boarding') return L('leavesIn', { d: durText(+t.departureDate - now) });
  if (stage === 'wake') return L('inDur', { d: durText(+t.arrivalDate - now) });
  return '';
}
function stageInfo(t) {
  const p = t.passengers[0] || {}, code = t.status?.code;
  if (code === 'CAN') return { tone: 'bad', title: L('canTitle'), sub: L('canBody') };
  if (code === 'WL') return { tone: 'bad', title: L('wlTitle'), sub: L('wlBody'), href: PNR_URL };
  if (!t.time) return { tone: 'warn', title: L('addTimeT'), sub: L('addTimeS'), act: 'editTime' };
  if (!t.dateISO) return { tone: 'warn', title: L('dateMissT'), sub: L('dateMissS') };
  const stage = stageOf(t);
  const v = { time: atTime(leaveAt(t)), min: state.commute, from: t.fromName, to: t.toName, no: t.trainNo, coach: p.coach || '—', berth: seatText(p), dep: fmt(t.time), arr: t.arrivalDate ? atTime(t.arrivalDate) : '' };
  const chip = stageChip(t, stage);
  if (stage === 'station' && t.platform) return { title: L('stationPfT', { pf: t.platform }), sub: L('stationPfS', v), chip, act: 'tabJourney' };
  const sub = stage === 'onboard' && !t.arrivalDate ? L('onboardNoArrS') : L(`${stage}S`, v);
  return { title: L(`${stage}T`, v), sub, chip, act: stage === 'station' ? 'openPlatform' : 'tabJourney' };
}

/* ---------- Views ---------- */
function statusChip(t) {
  const s = t.status;
  const [tone, text] = t.isShared ? ['ok', L('sharedChip')] : !s ? ['warn', L('statusUnknown')] : s.code === 'CNF' ? ['ok', L('statusCnf')] : s.code === 'RAC' ? ['warn', L('statusRac', { n: s.number })] : s.code === 'WL' ? ['bad', L('statusWl', { n: s.number })] : ['bad', L('statusCan')];
  return `<span class="chip ${tone}"><span class="dot"></span>${esc(text)}</span>`;
}
function timetableBanner(t) {
  const f = t.facts;
  if (!f || t.status?.code === 'CAN') return '';
  let text = '';
  if (!f.callsAtBoarding && t.fromStn) text = L('ttNoStop', { station: t.fromName });
  else if (f.runs === false) text = L('ttNoRun');
  else if (f.diffMin !== null && Math.abs(f.diffMin) >= 5) text = L('ttDiff', { time: fmt(f.dep), station: t.fromName, ticket: fmt(t.time) });
  return text ? `<div class="banner warn">${ico('alert', 20)}<span>${esc(text)}</span></div>` : '';
}
// A sideloaded app stops opening when its signature expires, so it must not wait until the platform to say so.
let signExpiry = 0;
function signingBanner(t) {
  const end = +(t.arrivalDate || t.departureDate || (t.dateISO && ttDate(t.dateISO))) || 0;
  if (!signExpiry || !end || signExpiry >= end) return '';
  const d = new Date(signExpiry), date = fmtDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  return `<div class="banner warn">${ico('alert', 20)}<span>${esc(L('signExpires', { date }))}</span></div>`;
}
function viewEmpty() {
  return `<div class="welcome">${LOGO}
    <h1>${esc(L('firstT'))}</h1><p>${esc(L('firstS'))}</p>
    <ul>
      <li>${ico('shield')}<div><b>${esc(L('f1T'))}</b><span>${esc(L('f1S'))}</span></div></li>
      <li>${ico('alert')}<div><b>${esc(L('f2T'))}</b><span>${esc(L('f2S'))}</span></div></li>
      <li>${ico('alarm')}<div><b>${esc(L('f3T'))}</b><span>${esc(L('f3S'))}</span></div></li>
    </ul>
    <button class="btn primary" data-act="add">${esc(L('addYourTicket'))}</button>
    <button class="btn ghost" data-act="trySample">${esc(L('trySample'))}</button>
    <p class="fine">${esc(L('privacy'))}</p></div>`;
}
function viewPass() {
  const t = current();
  if (!t) return viewEmpty();
  const p = t.passengers[0] || {}, si = stageInfo(t), code = t.status?.code, not = t.not;
  const boardingNow = t.departureDate && stageOf(t) === 'boarding' && code !== 'WL' && code !== 'CAN';
  const eyebrow = code === 'WL' || code === 'CAN' ? L('ticketFor') : boardingNow ? L('boardCheck') : L('boardOnly');
  const seatSub = code === 'RAC' ? L('racShared') : code === 'WL' ? L('noSeat') : p.berthNo ? berthWord(p.berthType) : L('seatUnknown');
  const others = tripLists().upcoming.filter(x => x.id !== t.id);
  const pax = t.passengers;
  const front = `<div class="face front"><div class="flare"><i></i></div>
    <div class="pt">
      <div class="row">${statusChip(t)}<span class="date">${esc(fmtDate(t.dateISO))}</span></div>
      <div class="eyebrow" style="margin-top:12px">${esc(eyebrow)}${t.sample ? ` · ${esc(L('sample'))}` : ''}</div>
      <div class="hero-no ${boardingNow ? 'check' : ''}">${esc(t.trainNo)}</div>
      <div class="hero-name">${esc(t.name || (TT ? L('nameUnknown') : ''))}</div>
      ${t.facts?.board ? `<div class="hero-board">${esc(L('coachBoards', { route: t.facts.board }))}</div>` : ''}
      ${not ? `<button class="notrow" data-act="tabSafety">${ico('x', 18, 2.6)}<span><b>${esc(L('notTrain', { no: not.no, name: not.name }))}</b><small>${esc(L('leavesHere', { time: fmt(not.dep) }))}</small></span><span class="cv">${ico('chevron', 16)}</span></button>` : ''}
    </div>
    <div class="pb">
      <div class="route">
        <div class="stn"><b>${esc(t.fromStn || '?')}</b><span>${t.time ? esc(fmt(t.time)) : `<button class="readfix" data-act="editTime">${esc(L('unreadTap'))}</button>`}</span></div>
        <div class="line">${t.facts?.durMin != null ? `<em>${esc(durText(t.facts.durMin * 60000))}</em>` : ''}</div>
        <div class="stn r"><b>${esc(t.toStn || '?')}</b><span>${t.arrivalDate ? esc(atTime(t.arrivalDate)) : esc(L('timeUnknown'))}</span></div>
      </div>
      <div class="tiles">
        <div class="tile"><span class="k">${esc(L('coach'))}</span><span class="v">${esc(p.coach || '—')}</span><span class="s">${esc(p.coach ? t.className || '' : code === 'RAC' ? L('seatUnknown') : L('noSeat'))}</span></div>
        <div class="tile"><span class="k">${esc(L('berth'))}</span><span class="v">${esc(seatText(p))}</span><span class="s">${esc(seatSub)}</span></div>
        <button class="tile tap ${t.platform ? 'set' : ''}" data-act="openPlatform"><span class="k">${esc(L('platform'))}</span><span class="v">${esc(t.platform || '—')}</span><span class="s">${esc(t.platform ? L('setByYou') : L('notAnnounced'))}</span></button>
      </div>
      <div class="foot"><span><b>${esc(titleName(p.name) || L('passengerN', { n: 1 }))}</b>${pax.length > 1 ? ` +${pax.length - 1}` : ''}</span>
        <button class="flipbtn" data-act="flip">${ico('flip', 16)}<span>${esc(L('flip'))}</span></button></div>
    </div></div>`;
  const back = `<div class="face back"><div class="backtop">
      <div class="pnr"><div><span>PNR</span><b>${esc(spaced(t.pnr))}</b></div>${t.pnr ? `<button data-act="copyPnr" aria-label="${esc(L('aCopyPnr'))}">${ico('copy', 20)}</button>` : ''}</div>
      ${pax.length ? `<div>${pax.map((x, i) => `<div class="paxrow"><span>${esc(titleName(x.name) || L('passengerN', { n: i + 1 }))}</span><b>${esc(x.coach ? `${x.coach}/` : '')}${esc(seatText(x))}${x.berthType ? ` ${esc(berthWord(x.berthType))}` : ''}</b></div>`).join('')}</div>` : ''}
      ${t.rec.raw ? `<div class="smsl">${esc(L('smsTitle'))}</div><pre class="sms">${esc(t.rec.raw)}</pre>` : ''}
      <p class="legal">${esc(L('legal'))}</p>
      <button class="flipbtn" style="align-self:flex-end;margin-top:auto" data-act="flip">${ico('flip', 16)}<span>${esc(L('flipBack'))}</span></button>
    </div></div>`;
  const tag = si.href ? 'a' : si.act ? 'button' : 'div';
  const attrs = si.href ? `href="${si.href}" target="_blank" rel="noopener"` : si.act ? `data-act="${si.act}"` : '';
  return `${t.isShared ? `<div class="banner ok"><span style="flex:1">${esc(L('sharedNote'))}<button class="btn primary" data-act="saveShared">${esc(L('saveTrip'))}</button></span></div>` : ''}
    <div class="pass-3d ${state.flipped ? 'is-flipped' : ''}" id="pass3d"><div class="pass-tilt" id="passTilt"><div class="pass-flip">${front}${back}</div></div></div>
    ${code === 'RAC' ? `<div class="banner warn">${ico('alert', 20)}<span>${esc(L('racBody'))}</span></div>` : ''}
    ${timetableBanner(t)}
    ${signingBanner(t)}
    <${tag} class="next ${si.tone || ''}" ${attrs}>
      <div class="row"><span class="eyebrow">${esc(L('next'))}</span>${si.chip ? `<span class="tchip" id="nextChip">${esc(si.chip)}</span>` : ''}</div>
      <div class="next-title">${esc(si.title)}</div><div class="next-sub">${esc(si.sub)}</div>
    </${tag}>
    <div class="quick">
      <button data-act="openCalendar">${ico('calendar')}${esc(L('qCalendar'))}</button>
      <button data-act="wakeJump">${ico('alarm')}${esc(L('qWake'))}</button>
      <button data-act="openShare">${ico('share')}${esc(L('qShare'))}</button>
      <button data-act="bigOpen">${ico('expand')}${esc(L('qBig'))}</button>
    </div>
    ${others.length ? `<button class="mini" data-act="pickTrip" data-v="${esc(others[0].id)}"><span class="no">${esc(others[0].trainNo)}</span><span class="tx"><b>${esc(fmtDate(others[0].dateISO))}</b>${esc(L('routeTo', { from: others[0].fromName, to: others[0].toName }))}</span>${ico('chevron', 18)}</button>` : ''}`;
}
function timeline(t) {
  const dep = t.departureDate; if (!dep) return [];
  const p = t.passengers[0] || {};
  const ev = [
    { k: 'leave', at: leaveAt(t), b: L('tlLeave'), s: L('tlLeaveS', { min: state.commute }), mins: true },
    { k: 'reach', at: reachAt(t), b: L('tlReach', { station: t.fromName }), s: L('tlReachS', { min: STATION_BUFFER }) },
    { k: 'dep', at: dep, b: L('tlDep'), s: t.platform ? L('tlDepPf', { pf: t.platform }) : L('tlDepNoPf') }
  ];
  if (t.facts?.arrHere && t.facts.diffMin === 0 && t.facts.arrHere !== t.facts.dep) ev.push({ k: 'arrive', at: new Date(+dep - (ttMinutes(t.facts.dep) - ttMinutes(t.facts.arrHere) + 1440) % 1440 * 60000), b: L('tlArrive'), s: L('tlArriveS', { no: t.trainNo }) });
  if (t.not && t.not.delta < 0) ev.push({ k: 'not', at: new Date(+dep + t.not.delta * 60000), b: L('tlNot', { no: t.not.no, name: t.not.name }), s: L('tlNotS'), alert: true });
  if (t.arrivalDate) {
    const sleep = new Date(dep); sleep.setHours(22, 0, 0, 0);
    if (['SL', '3A'].includes(t.classCode) && sleep > dep && sleep < t.arrivalDate) ev.push({ k: 'sleep', at: sleep, b: L('tlSleep'), s: L('tlSleepS') });
    ev.push({ k: 'wake', at: wakeAt(t), b: L('tlWake'), s: L('tlWakeS') });
    ev.push({ k: 'end', at: t.arrivalDate, b: L('tlEnd', { station: t.toName }), s: L('tlEndS') });
  }
  ev.sort((a, b) => a.at - b.at);
  const now = Date.now();
  let ci = -1; ev.forEach((e, i) => { if (+e.at <= now) ci = i; });
  return ev.map((e, i) => ({ ...e, cls: [i < ci ? 'done' : '', i === ci ? 'now' : '', e.alert && i >= ci ? 'alert' : ''].join(' ').trim() }));
}
const noTrip = () => `<h1 class="ltitle">${esc(L('noTripT'))}</h1><p class="lsub">${esc(L('noTripS'))}</p><button class="btn primary" data-act="add">${esc(L('addYourTicket'))}</button>`;
function berthMap(t) {
  const p = t.passengers[0] || {};
  const n = parseInt(p.berthNo, 10);
  if (!n || !['SL', '3A', '2A'].includes(t.classCode)) return '';
  const size = t.classCode === '2A' ? 6 : 8, bay = Math.ceil(n / size), start = (bay - 1) * size + 1;
  const cell = off => {
    const no = start + off, mine = t.passengers.find(x => parseInt(x.berthNo, 10) === no && x.coach === p.coach);
    const type = getBerthTypeFromNumber(no, p.coach, t.classCode);
    return `<div class="b ${mine ? 'me' : ''}"><strong>${no}</strong>${esc(mine ? firstName(mine.name) || berthWord(type) : berthWord(type))}</div>`;
  };
  const gap = '<div class="gap"></div>';
  const grid = size === 8
    ? `${cell(2)}${cell(5)}${gap}${cell(7)}${cell(1)}${cell(4)}<div></div>${cell(0)}${cell(3)}${cell(6)}`
    : `${cell(1)}${cell(3)}${gap}${cell(5)}${cell(0)}${cell(2)}${cell(4)}`;
  return `<div class="card"><h3>${esc(L('insideT'))}</h3><p class="dim">${esc(L('insideS', { bay }))}</p><div class="bay b${size}">${grid}</div></div>`;
}
function viewJourney() {
  const t = current();
  if (!t) return noTrip();
  const p = t.passengers[0] || {};
  const list = timeline(t);
  const wake = wakeAt(t);
  const hasWakeUp = !!wakePlugin();
  return `<h1 class="ltitle">${esc(L('tabJourney'))}</h1><p class="lsub">${esc(t.trainNo)} · ${esc(L('routeTo', { from: t.fromName, to: t.toName }))} · ${esc(fmtDate(t.dateISO))}</p>
    <div class="card">${list.length ? `<ol class="track">${list.map(e => `<li class="${e.cls}"><div class="tm">${esc(atTime(e.at))}</div><div class="rail"><span class="pin"></span></div><div class="ti"><b>${esc(e.b)}</b><span>${esc(e.s)}</span>${e.mins ? `<div class="mins" role="group" aria-label="${esc(L('commuteT'))}">${COMMUTES.map(m => `<button data-act="commute" data-v="${m}" aria-pressed="${state.commute === m}">${m}</button>`).join('')}</div>` : ''}</div></li>`).join('')}</ol>` : `<p class="dim" style="margin:0">${esc(L('noTimeline'))}</p>${t.time ? '' : `<button class="btn ghost" style="margin-top:8px" data-act="editTime">${esc(L('addTimeBtn'))}</button>`}`}</div>
    ${p.coach ? `<div class="card"><h3>${esc(L('findCoachT', { coach: p.coach }))}</h3><p class="dim" style="margin:0">${esc(L('findCoachS'))}</p></div>` : ''}
    ${berthMap(t)}
    <div class="card" id="alerts"><h3>${esc(L('alertsT'))}</h3>
      ${hasWakeUp ? `<div class="tog first"><div class="tx"><b>${esc(L('gpsT'))}</b>${esc(L('gpsS', { to: t.toName }))}</div><button class="sw" role="switch" aria-checked="${state.gps}" aria-label="${esc(L('gpsT'))}" data-act="toggle" data-k="gps"></button></div>
      <div class="tog"><div class="tx"><b>${esc(wake ? L('backupT', { time: atTime(wake) }) : L('backupNoTime'))}</b>${esc(L('backupS'))}</div><button class="sw" role="switch" aria-checked="${state.backup}" aria-label="${esc(L('backupNoTime'))}" data-act="toggle" data-k="backup"></button></div>`
      : `<p class="dim" style="margin:0 0 10px;color:var(--ink-2);font-size:13px">${esc(wake ? L('wakeWebS', { time: atTime(wake), to: t.toName }) : L('wakeNoArr'))}</p>`}
      <button class="btn ghost" data-act="openCalendar">${ico('calendar', 18)}${esc(L('addCal'))}</button>
    </div>`;
}
function viewSafety() {
  const t = current();
  if (!t) return noTrip();
  const n = t.not;
  const row = (x, isOther) => {
    const when = x.you ? L('yourTrain') : x.ends ? L('endsHere', { station: t.fromName }) : isOther ? L('otherDir') : x.delta === 0 ? L('sameTime') : L(x.delta < 0 ? 'durBefore' : 'durAfter', { d: durText(Math.abs(x.delta) * 60000) });
    const place = x.you || x.ends ? '' : `${L('toPlace', { place: x.to })} · `;
    return `<div class="t ${x.you ? 'you' : ''} ${n && x.no === n.no ? 'hot' : ''}"><span class="h">${esc(fmt(x.dep))}</span><div><b>${esc(x.no)}</b><span class="n">${esc(x.name || '')}</span><span class="d">${esc(place + when)}</span></div></div>`;
  };
  const near = t.near;
  const asOf = TT ? new Intl.DateTimeFormat(LOCALES[state.lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(ttDate(TT.asOf)) : '';
  return `<h1 class="ltitle">${esc(L('safetyT'))}</h1>
    <p class="lsub">${esc(near ? L('safetyS', { station: t.fromName, date: fmtDate(t.dateISO) }) : L('safetyGeneric'))}</p>
    ${n ? `<div class="banner bad">${ico('alert', 20)}<span>${esc(L('warnNear', { no: n.no, name: n.name, station: t.fromName, time: fmt(n.dep), dep: fmt(t.time) }))}</span></div>` : ''}
    <div class="langs" role="group" aria-label="${esc(L('langLabel'))}">${LANGS.map(([v, l]) => `<button data-act="setLang" data-v="${v}" aria-pressed="${state.lang === v}" lang="${v}">${l}</button>`).join('')}</div>
    ${near ? `<div class="sect">${esc(L('goingYourWay'))}</div><div class="tlist">${near.way.map(x => row(x, false)).join('')}</div>
      ${near.other.length ? `<details class="also"><summary>${esc(L('alsoAt', { station: t.fromName, n: near.other.length }))}${ico('chevron', 16)}</summary><div class="tlist">${near.other.map(x => row(x, true)).join('')}</div></details>` : ''}
      <p class="fine">${esc(L('ttAsOf', { date: asOf }))}</p>`
      : `<div class="card"><h3>${esc(TT ? L('listNeedsT') : L('ttLoadingT'))}</h3><p class="dim" style="margin:0">${esc(TT ? L('listNeedsS') : L('ttLoadingS'))}</p></div>`}
    <button class="mini" data-act="addPay"><span class="tx"><b>${esc(L('payRowT'))}</b>${esc(L('payRowS'))}</span>${ico('chevron', 18)}</button>
    <div class="card"><h3>${esc(L('helpT'))}</h3><p class="dim">${esc(L('helpS'))}</p>
      <div class="help"><a href="tel:139"><b>139</b><span>${esc(L('h139'))}</span></a><a href="tel:112"><b>112</b><span>${esc(L('h112'))}</span></a>
      <a class="w" href="${PNR_URL}" target="_blank" rel="noopener">${esc(L('hPnr'))} ${ico('external', 16)}</a>
      <a class="w" href="https://enquiry.indianrail.gov.in" target="_blank" rel="noopener">${esc(L('hNtes'))} ${ico('external', 16)}</a>
      <a class="w" href="https://railmadad.indianrailways.gov.in" target="_blank" rel="noopener">${esc(L('hRail'))} ${ico('external', 16)}</a>
      <a class="w" href="https://www.ecatering.irctc.co.in" target="_blank" rel="noopener">${esc(L('hFood'))} ${ico('external', 16)}</a></div></div>`;
}

/* ---------- Calendar ---------- */
const icsDate = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsText = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function calEvent(t, kind) {
  const p = t.passengers[0] || {};
  if (kind === 'wake') {
    const wake = wakeAt(t);
    return { title: L('calWakeTitle', { to: t.toName, no: t.trainNo }), location: `${t.toName} railway station`, notes: L('calWakeNotes', { to: t.toName, coach: p.coach || '—', berth: seatText(p) }), start: wake, end: t.arrivalDate, alarms: [0] };
  }
  const notes = [L('calBoard', { no: t.trainNo }), p.coach ? `${L('coach')} ${p.coach}, ${L('berth')} ${seatText(p)}` : '', t.pnr ? `PNR ${t.pnr}` : '', t.not ? L('calNot', { no: t.not.no, name: t.not.name, station: t.fromName, time: fmt(t.not.dep) }) : ''].filter(Boolean).join('\n');
  const end = t.arrivalDate || new Date(+t.departureDate + 36e5);
  return { title: `${t.trainNo} ${t.name || ''} ${t.fromStn || ''}-${t.toStn || ''}`.replace(/\s+/g, ' ').trim(), location: `${t.fromName} railway station`, notes, start: t.departureDate, end, alarms: [180, state.commute + STATION_BUFFER, 20] };
}
function buildIcs(ev) {
  const alarm = m => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(ev.title)}`, `TRIGGER:${m ? `-PT${m}M` : 'PT0S'}`, 'END:VALARM'];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TrainGuard//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${uid()}@trainguard`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`, `DTSTART:${icsDate(ev.start)}`, `DTEND:${icsDate(ev.end)}`, `SUMMARY:${icsText(ev.title)}`, `DESCRIPTION:${icsText(ev.notes)}`, `LOCATION:${icsText(ev.location)}`, ...ev.alarms.flatMap(alarm), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function googleUrl(ev) {
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${icsDate(ev.start)}/${icsDate(ev.end)}&ctz=Asia/Kolkata&details=${encodeURIComponent(ev.notes)}&location=${encodeURIComponent(ev.location)}`;
}
async function addToPhoneCalendar(ev) {
  const plugin = liveActivityPlugin();
  if (plugin?.addToCalendar) {
    try {
      await plugin.addToCalendar({ title: ev.title, location: ev.location, notes: ev.notes, startDate: +ev.start, endDate: +ev.end, alarmMinutes: ev.alarms });
      toast(L('calAdded')); return;
    } catch (e) { /* no permission: fall through to the file */ }
  }
  const file = new File([buildIcs(ev)], 'TrainGuard.ics', { type: 'text/calendar' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: ev.title }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = 'TrainGuard.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(L('calDownloaded'));
}

/* ---------- Sheets ---------- */
function readbackBody(a) {
  const t = a.trip, pay = a.mode === 'pay';
  const mm = checkExpectationMismatch({ trainNo: t.trainNo, trainName: t.name }, a.expected);
  const p = t.passengers[0] || {}, code = t.status?.code;
  const seatLine = code === 'WL' ? L('seatWl', { n: t.status.number }) : code === 'RAC' ? (p.coach ? L('seatRac', { coach: p.coach, n: t.status.number }) : L('seatRacNoCoach', { n: t.status.number })) : p.coach ? t.passengers.map(x => `${x.coach}/${x.berthNo}${x.berthType ? ` ${berthWord(x.berthType)}` : ''}`).join(', ') : L('notRead');
  return `${mm.mismatch ? `<div class="banner bad">${ico('alert', 20)}<span><b>${esc(L('mismatchT'))}</b> ${esc(L('mismatchS', { said: mm.expected, train: `${t.trainNo}${t.name ? ` ${t.name}` : ''}` }))}</span></div>` : ''}
    ${code === 'WL' ? `<div class="banner bad">${ico('alert', 20)}<span>${esc(L('wlBody'))}</span></div>` : ''}
    ${code === 'CAN' ? `<div class="banner bad">${ico('alert', 20)}<span>${esc(L('canTitle'))}</span></div>` : ''}
    <div class="group rb"><div class="eyebrow">${esc(L('yourTrainCap'))}</div><div class="no">${esc(t.trainNo)}</div><div class="nm">${esc(t.name || L('nameUnknown'))}</div>
      <dl><dt>${esc(L('rbDate'))}</dt><dd class="${t.dateISO ? '' : 'miss'}">${esc(t.dateISO ? fmtDate(t.dateISO) : L('notRead'))}</dd>
      <dt>${esc(L('rbLeaves'))}</dt><dd class="${t.time ? '' : 'miss'}">${esc(t.time ? fmt(t.time) : L('notReadTime'))}</dd>
      <dt>${esc(L('rbRoute'))}</dt><dd class="${t.fromStn && t.toStn ? '' : 'miss'}">${esc(L('routeTo', { from: t.fromName, to: t.toName }))}</dd>
      <dt>${esc(L('rbSeat'))}</dt><dd class="${p.coach || t.status ? '' : 'miss'}">${esc(seatLine)}</dd>
      <dt>PNR</dt><dd class="${t.pnr ? '' : 'miss'}">${esc(spaced(t.pnr))}</dd></dl></div>
    ${t.not ? `<div class="banner bad">${ico('alert', 20)}<span>${esc(L('warnNear', { no: t.not.no, name: t.not.name, station: t.fromName, time: fmt(t.not.dep), dep: fmt(t.time) }))}</span></div>` : ''}
    ${timetableBanner(t)}
    <p class="ask">${esc(L('ask'))}</p>
    <button class="btn primary" data-act="readYes">${esc(L('yesSave'))}</button>
    <button class="btn ghost" data-act="readNo">${esc(L('noWrong'))}</button>
    <button class="btn ghost" data-act="readBack">${esc(L('goBack'))}</button>`;
}
function payResultBody(r) {
  if (r.error) return `<div class="banner bad">${ico('alert', 20)}<span>${esc(r.error)}</span></div><button class="btn ghost" data-act="payBack">${esc(L('goBack'))}</button>`;
  const mm = checkExpectationMismatch({ trainNo: r.no, trainName: r.facts.name }, r.meant);
  return `${mm.mismatch ? `<div class="banner bad">${ico('alert', 20)}<span><b>${esc(L('mismatchT'))}</b> ${esc(L('mismatchS', { said: mm.expected, train: `${r.no} ${r.facts.name}` }))}</span></div>` : ''}
    <div class="group rb"><div class="eyebrow">${esc(L('payBooking'))}</div><div class="no">${esc(r.no)}</div><div class="nm">${esc(r.facts.name)}</div>
      <dl><dt>${esc(L('rbRoute'))}</dt><dd>${esc(r.facts.board)}</dd>
      ${r.stationName ? `<dt>${esc(L('rbLeaves'))}</dt><dd class="${r.facts.dep ? '' : 'miss'}">${esc(r.facts.dep ? L('payAt', { station: r.stationName, time: fmt(r.facts.dep) }) : L('payNotCalling', { station: r.stationName }))}</dd>` : ''}
      ${r.facts.runs === false ? `<dt>${esc(L('rbDate'))}</dt><dd class="miss">${esc(L('payNotRunning'))}</dd>` : ''}</dl></div>
    ${r.others?.length ? `<div class="banner warn">${ico('alert', 20)}<span><b>${esc(L('payOthers'))}</b> ${esc(r.others.map(x => `${x.no} ${x.name} (${fmt(x.dep)})`).join(', '))}</span></div>` : ''}
    <p class="ask">${esc(L('ask'))}</p>
    <button class="btn primary" data-act="payYes">${esc(L('yesPay'))}</button>
    <button class="btn ghost" data-act="payNo">${esc(L('noWrong'))}</button>`;
}
function sheetHTML() {
  const s = state.sheet; if (!s) return '';
  const t = current();
  const frame = (title, body) => `<div class="scrim" data-act="closeSheet"></div><section class="sheet glass" role="dialog" aria-modal="true" aria-label="${esc(title)}" id="sheet"><div class="grabber" id="grabber"><i></i></div><div class="shead"><h2>${esc(title)}</h2><button class="xbtn" data-act="closeSheet" aria-label="${esc(L('aClose'))}">${ico('x', 20)}</button></div><div class="sbody">${body}</div></section>`;
  if (s === 'add') {
    const a = state.add;
    if (a.step === 'read') return a.refused
      ? frame(L('notSavedT'), `<div class="banner bad">${ico('alert', 20)}<span>${esc(L('notSavedS'))}</span></div><button class="btn ghost" data-act="closeSheet">${esc(L('aClose'))}</button>`)
      : frame(L('rbT'), readbackBody(a));
    return frame(L('addT'), `<div class="group"><label class="flabel" for="tkt">${esc(L('pasteLabel'))}</label>
        <textarea class="field" id="tkt" rows="5" placeholder="PNR:…,TRN:…,DOJ:…">${esc(a.text)}</textarea>
        ${a.error ? `<div class="ferr" role="alert">${ico('alert', 16)}<span>${esc(a.error)}</span></div>` : ''}
        <button class="pastebtn" data-act="pasteClip">${esc(L('pasteBtn'))}</button></div>
      <div class="group"><label class="flabel" for="exp">${esc(L('expLabel'))}</label>
        <input class="field" id="exp" value="${esc(a.expected)}" placeholder="${esc(L('expPh'))}" autocomplete="off">
        <p class="fhelp">${esc(L('expHelp'))}</p></div>
      <button class="btn primary" data-act="readTicket">${esc(L('readBtn'))}</button>`);
  }
  if (s === 'pay') {
    const a = state.pay;
    if (a.refused) return frame(L('dontPayT'), `<div class="banner bad">${ico('alert', 20)}<span>${esc(L('dontPayS'))}</span></div><button class="btn ghost" data-act="closeSheet">${esc(L('aClose'))}</button>`);
    if (a.result) return frame(L('payT'), payResultBody(a.result));
    return frame(L('payT'), `<p class="fhelp" style="margin:0 2px">${esc(L('payIntro'))}</p>
      <div class="group"><label class="flabel" for="payNo">${esc(L('payNo'))}</label><input class="field" id="payNo" inputmode="numeric" maxlength="5" autocomplete="off" value="${esc(a.no || '')}">
        ${a.error ? `<div class="ferr" role="alert">${ico('alert', 16)}<span>${esc(a.error)}</span></div>` : ''}</div>
      <div class="group"><label class="flabel" for="payMeant">${esc(L('payMeant'))}</label><input class="field" id="payMeant" placeholder="${esc(L('expPh'))}" autocomplete="off" value="${esc(a.meant || '')}"></div>
      <div class="group"><label class="flabel" for="payStation">${esc(L('payStation'))}</label><input class="field" id="payStation" placeholder="${esc(L('payStationPh'))}" autocomplete="off" value="${esc(a.station || '')}">
        <label class="flabel" for="payDate" style="margin-top:10px">${esc(L('payDate'))}</label><input class="field" id="payDate" type="date" value="${esc(a.date)}"></div>
      <button class="btn primary" data-act="payCheck">${esc(L('payCheck'))}</button>`);
  }
  if (s === 'platform') return frame(L('pfT'), `<p class="fhelp" style="margin:0 2px">${esc(L('pfS'))}</p>
      <div class="pfgrid">${Array.from({ length: 12 }, (_, i) => String(i + 1)).map(n => `<button data-act="setPf" data-v="${n}" aria-pressed="${t?.platform === n}">${n}</button>`).join('')}</div>
      <button class="btn ghost" data-act="setPf" data-v="">${esc(L('pfNone'))}</button>`);
  if (s === 'time') return frame(L('timeT'), `<div class="group"><label class="flabel" for="dpt">${esc(L('timeLabel'))}</label><input class="field" id="dpt" type="time"><p class="fhelp">${esc(L('timeHelp'))}</p></div><button class="btn primary" data-act="saveTime">${esc(L('timeSave'))}</button>`);
  if (s === 'trips') {
    const { upcoming, past } = tripLists();
    const row = x => `<div class="trowwrap"><button class="trow" data-act="pickTrip" data-v="${esc(x.id)}"><span class="no">${esc(x.trainNo)}</span><span class="tx"><b>${esc(fmtDate(x.dateISO))}</b>${esc(L('routeTo', { from: x.fromName, to: x.toName }))}${x.passengers.length > 1 ? ` · ${esc(L('passengersN', { n: x.passengers.length }))}` : ''}</span>${t && x.id === t.id ? ico('check', 18) : ''}</button><button class="iconbtn" data-act="removeTrip" data-v="${esc(x.id)}" aria-label="${esc(L('removeTrip'))} ${esc(x.trainNo)}">${ico('trash', 18)}</button></div>`;
    return frame(L('tripsT'), `${upcoming.length ? `<div class="group"><div class="eyebrow" style="margin-bottom:2px">${esc(L('upcoming'))}</div>${upcoming.map(row).join('')}</div>` : ''}
      ${past.length ? `<div class="group"><div class="eyebrow" style="margin-bottom:2px">${esc(L('past'))}</div>${past.map(row).join('')}</div>` : ''}
      <button class="btn primary" data-act="add">${ico('plus', 18)}${esc(L('addT'))}</button>`);
  }
  if (s === 'share' && t) {
    const p = t.passengers[0] || {};
    const parts = [L(firstName(p.name) ? 'msgBase' : 'msgBaseNoName', { name: firstName(p.name), no: t.trainNo, train: t.name || '', date: fmtDate(t.dateISO), from: t.fromName, dep: fmt(t.time) || '—' })];
    if (t.arrivalDate) parts.push(L('msgArr', { to: t.toName, arr: atTime(t.arrivalDate) }));
    if (state.share.seat && p.coach) parts.push(p.berthNo ? L('msgSeat', { coach: p.coach, berth: p.berthNo }) : L('msgCoach', { coach: p.coach }));
    if (state.share.pnr && t.pnr) parts.push(`PNR ${t.pnr}.`);
    const msg = `${parts.join(' ')}\n${shareLink(t, state.share)}`;
    return frame(L('shareT'), `<div class="group"><p class="sharemsg" id="shareMsg">${esc(parts.join(' '))}</p></div>
      <div class="group"><div class="tog first"><div class="tx"><b>${esc(L('shareSeatT'))}</b>${esc(L('shareSeatS'))}</div><button class="sw" role="switch" aria-checked="${state.share.seat}" aria-label="${esc(L('shareSeatT'))}" data-act="shareOpt" data-k="seat"></button></div>
      <div class="tog"><div class="tx"><b>${esc(L('sharePnrT'))}</b>${esc(L('sharePnrS'))}</div><button class="sw" role="switch" aria-checked="${state.share.pnr}" aria-label="${esc(L('sharePnrT'))}" data-act="shareOpt" data-k="pnr"></button></div></div>
      <a class="btn primary" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${esc(L('sendWa'))}</a>
      <button class="btn ghost" data-act="copyMsg" data-msg="${esc(msg)}">${ico('copy', 18)}${esc(L('copyMsg'))}</button>`);
  }
  if (s === 'calendar' && t) {
    if (!t.departureDate) return frame(L('calT'), `<div class="banner warn">${ico('alert', 20)}<span>${esc(L('calNeedsTime'))}</span></div>${t.time ? '' : `<button class="btn primary" data-act="editTime">${esc(L('addTimeBtn'))}</button>`}`);
    const wake = wakeAt(t);
    const buttons = kind => `${window.Capacitor?.getPlatform?.() === 'android' ? '' : `<button class="btn ghost" data-act="calPhone" data-k="${kind}">${esc(L('calPhone'))}</button>`}<a class="btn ghost" href="${esc(googleUrl(calEvent(t, kind)))}" target="_blank" rel="noopener">${esc(L('calGoogle'))}</a>`;
    return frame(L('calT'), `<div class="group"><p class="gtitle">${esc(L('calJourneyT'))}</p><p class="fhelp" style="margin:0 0 10px">${esc(L('calJourneyS'))}</p>${buttons('trip')}</div>
      ${wake ? `<div class="group"><p class="gtitle">${esc(L('calWakeT'))}</p><p class="fhelp" style="margin:0 0 10px">${esc(L('calWakeS', { time: atTime(wake), to: t.toName }))}</p>${buttons('wake')}</div>` : ''}`);
  }
  if (s === 'settings') {
    const standalone = matchMedia('(display-mode:standalone)').matches || navigator.standalone || isNative();
    return frame(L('settingsT'), `<div class="group"><div class="flabel">${esc(L('langLabel'))}</div><div class="langs">${LANGS.map(([v, l]) => `<button data-act="setLang" data-v="${v}" aria-pressed="${state.lang === v}" lang="${v}">${l}</button>`).join('')}</div></div>
      <div class="group"><div class="flabel">${esc(L('appearance'))}</div><div class="langs">${[['dark', L('dark')], ['light', L('light')]].map(([v, l]) => `<button data-act="setTheme" data-v="${v}" aria-pressed="${state.theme === v}">${esc(l)}</button>`).join('')}</div></div>
      <div class="group"><div class="flabel">${esc(L('commuteT'))}</div><div class="mins" style="margin-top:0">${COMMUTES.map(m => `<button data-act="commute" data-v="${m}" aria-pressed="${state.commute === m}">${m}</button>`).join('')}</div><p class="fhelp">${esc(L('commuteS', { min: STATION_BUFFER }))}</p></div>
      <div class="group"><div class="tog first"><div class="tx"><b>${esc(L('soundsT'))}</b>${esc(L('soundsS'))}</div><button class="sw" role="switch" aria-checked="${state.sound}" aria-label="${esc(L('soundsT'))}" data-act="toggle" data-k="sound"></button></div>
      <div class="tog"><div class="tx"><b>${esc(L('hapticsT'))}</b>${esc(L(matchMedia('(pointer:coarse)').matches ? 'hapticsS' : 'hapticsDesk'))}</div><button class="sw" role="switch" aria-checked="${state.haptics}" aria-label="${esc(L('hapticsT'))}" data-act="toggle" data-k="haptics"></button></div></div>
      ${standalone ? '' : `<button class="mini" data-act="installApp">${ico('phone')}<span class="tx"><b>${esc(L('installT'))}</b>${esc(L('installS'))}</span>${ico('chevron', 18)}</button>`}
      <p class="fine">${esc(L('aboutS'))} ${TT ? esc(L('aboutTT', { date: TT.asOf })) : ''}</p>`);
  }
  if (s === 'install') return frame(L('installT'), `<div class="group"><p class="gtitle">iPhone</p><p class="fhelp" style="margin:0">${esc(L('installIos'))}</p></div><div class="group"><p class="gtitle">Android</p><p class="fhelp" style="margin:0">${esc(L('installAndroid'))}</p></div>`);
  return '';
}

/* ---------- Overlay ---------- */
function bigHTML() {
  const t = state.big ? current() : null;
  if (!t) return '';
  const p = t.passengers[0] || {};
  const num = s => state.sun ? esc(s) : `<span class="ledwrap"><span class="led">${esc(s)}</span></span>`;
  const seatBig = p.status?.code === 'RAC' ? 'RAC' : p.status?.code === 'WL' ? 'WL' : (p.berthNo ?? '—');
  const sub = p.status?.code === 'RAC' || p.status?.code === 'WL' ? seatText(p) : berthWord(p.berthType);
  return `<div class="big ${state.sun ? 'sun' : ''}" role="dialog" aria-label="${esc(L('qBig'))}"><div class="bigtop"><button data-act="toggleSun">${ico('sun', 18)}${esc(L(state.sun ? 'night' : 'sunlight'))}</button><button data-act="bigClose">${ico('x', 18)}${esc(L('aClose'))}</button></div>
    <div class="bigmain"><div class="biglab">${esc(L('bigTrain'))}</div><div class="bignum">${num(t.trainNo)}</div>
      <div class="bigrow"><div><div class="biglab">${esc(L('coach'))}</div><div class="bigsub">${num(p.coach || '—')}</div></div><div><div class="biglab">${esc(L('berth'))}</div><div class="bigsub">${num(seatBig)}<small>${esc(sub)}</small></div></div></div>
      ${t.not ? `<div class="bignot">${esc(L('notTrain', { no: t.not.no, name: t.not.name }))}</div>` : ''}</div></div>`;
}

/* ---------- Sound and haptics ---------- */
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let sharedAudioCtx = null;
function getSharedAudioContext() {
  if (!sharedAudioCtx) { const AudioCtx = window.AudioContext || window.webkitAudioContext; if (AudioCtx) sharedAudioCtx = new AudioCtx(); }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
  return sharedAudioCtx;
}
function tone(ctx, type, f0, f1, at, dur, vol, attack) {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, at);
  if (f1) osc.frequency.exponentialRampToValueAtTime(f1, at + dur);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(vol, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(at); osc.stop(at + dur);
}
function playBellHarmonic(ctx, freq, at, duration, volume) {
  tone(ctx, 'sine', freq, 0, at, duration, volume, 0.008);
  tone(ctx, 'sine', freq * 2.76, 0, at, duration * 0.45, volume * 0.38, 0.005);
  tone(ctx, 'sine', freq * 5.4, 0, at, duration * 0.22, volume * 0.12, 0.003);
}
function playRailwayChime() {
  if (!state.sound) return;
  try { const ctx = getSharedAudioContext(); if (!ctx) return; const n = ctx.currentTime;
    playBellHarmonic(ctx, 349.23, n, 0.70, 0.16); playBellHarmonic(ctx, 440, n + 0.22, 0.75, 0.17); playBellHarmonic(ctx, 523.25, n + 0.44, 1.20, 0.20);
  } catch (e) {}
}
function playMismatchAlertSound() {
  if (!state.sound) return;
  try { const ctx = getSharedAudioContext(); if (!ctx) return; const n = ctx.currentTime;
    [0, 0.18].forEach(t => tone(ctx, 'triangle', 280, 140, n + t, 0.14, 0.18, 0.01));
  } catch (e) {}
}
const CLICK = { selection: [480, .012, .14], light: [360, .016, .16], medium: [280, .022, .20], warning: [220, .035, .22], error: [220, .035, .22] };
function playMicroTactileClick(style) {
  try { const ctx = getSharedAudioContext(); if (!ctx) return; const n = ctx.currentTime;
    if (style === 'success') { [0, .07].forEach((t, i) => tone(ctx, 'triangle', i ? 680 : 520, 80, n + t, .018, .18, .002)); return; }
    const [f, d, v] = CLICK[style] || CLICK.light; tone(ctx, 'triangle', f, 60, n, d, v, .002);
  } catch (e) {}
}
// iOS has no navigator.vibrate, but WebKit ticks the Taptic Engine when a switch control toggles.
function iosTick(times) {
  const tick = () => { const l = document.createElement('label'), i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); l.style.display = 'none'; l.appendChild(i); document.body.appendChild(l); l.click(); l.remove(); };
  tick(); for (let n = 1; n < times; n++) setTimeout(tick, n * 120);
}
const VIBE = { selection: 8, light: 14, medium: 26, success: [15, 30, 20], warning: [35, 45, 35], error: [50, 40, 50, 40] };
let lastHapticTs = 0;
function triggerHaptic(style = 'light') {
  if (!state.haptics) return;
  const now = performance.now(); if (now - lastHapticTs < 60) return; lastHapticTs = now;
  const cap = window.Capacitor?.Plugins?.Haptics;
  if (cap) {
    try {
      if (style === 'selection') cap.selectionChanged();
      else if (style === 'light' || style === 'medium') cap.impact({ style: style.toUpperCase() });
      else cap.notification({ type: style === 'success' ? 'SUCCESS' : style === 'error' ? 'ERROR' : 'WARNING' });
      return;
    } catch (e) {}
  }
  let felt = false;
  if (IOS) { iosTick(['success', 'warning', 'error'].includes(style) ? 2 : 1); felt = true; }
  // Desktop Chrome returns true from vibrate() with no motor, so only trust it on touch devices.
  else if (matchMedia('(pointer:coarse)').matches && navigator.vibrate) { try { felt = navigator.vibrate(VIBE[style] || 14); } catch (e) {} }
  if (!felt) playMicroTactileClick(style);
  // Inside emulator.html, make the phone frame shake so haptics can be seen on a computer.
  try {
    const frame = window.parent !== window && window.parent.document.getElementById('chassis');
    if (frame && !REDUCED()) frame.animate([{ translate: '0 0' }, { translate: '1.2px 0' }, { translate: '-1.2px 0' }, { translate: '.6px 0' }, { translate: '0 0' }], { duration: ['light', 'selection'].includes(style) ? 90 : 170 });
  } catch (e) {}
}
function hapticStyle(b) {
  if (['readTicket', 'readYes', 'add', 'addPay', 'flip', 'bigOpen', 'payCheck', 'payYes', 'saveShared'].includes(b.dataset.act)) return 'medium';
  if (['readNo', 'payNo', 'removeTrip'].includes(b.dataset.act)) return 'warning';
  if (b.matches('.sw,.langs button,.mins button,.pfgrid button')) return 'selection';
  return 'light';
}
document.addEventListener(IOS ? 'click' : 'pointerdown', e => {
  const b = e.target.closest?.('button,a');
  if (b && !b.matches('.tab')) triggerHaptic(hapticStyle(b));
}, { passive: true });
document.addEventListener('touchstart', () => {}, { passive: true }); // lets :active press states run on iOS

/* ---------- Motion ---------- */
function spring(stiffness, damping) {
  const w0 = Math.sqrt(stiffness), z = damping / (2 * w0), wd = w0 * Math.sqrt(1 - z * z), T = 7 / (z * w0), pts = [];
  for (let i = 0; i <= 48; i++) { const t = T * i / 48; pts.push(+(1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t))).toFixed(4)); }
  return `linear(${pts.join(',')})`;
}
if (window.CSS?.supports?.('animation-timing-function', 'linear(0,1)')) {
  const r = document.documentElement.style;
  r.setProperty('--sp-snap', spring(190, 19)); r.setProperty('--sp-sheet', spring(130, 21)); r.setProperty('--sp-flip', spring(70, 12));
}
const pop = sel => { const el = $(sel); if (el && !REDUCED()) el.animate([{ opacity: 0, transform: 'translateY(8px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); };

/* ---------- Native bridge ---------- */
const liveActivityPlugin = () => window.Capacitor?.Plugins?.LiveActivity || null;
let liveKey = null;
function syncLiveActivity() {
  const plugin = isIOSNative() ? liveActivityPlugin() : null;
  if (!plugin) return;
  const t = current();
  const code = t?.status?.code, mins = t?.departureDate ? Math.round((+t.departureDate - Date.now()) / 60000) : null;
  // ActivityKit keeps an activity for about 8 hours, so start it once the journey is that close.
  const on = t && mins > 0 && mins <= 480 && code !== 'WL' && code !== 'CAN' && !t.isShared;
  const key = on ? [t.id, t.platform, +t.departureDate, state.lang].join('|') : 'off';
  if (key === liveKey) return;
  liveKey = key;
  if (!on) { plugin.stopActivity?.().catch(() => {}); return; }
  const p = t.passengers[0] || {};
  plugin.startActivity({ trainNumber: t.trainNo, trainName: t.name || '', coach: p.coach || '—', seat: `${seatText(p)}${p.berthType ? ` (${p.berthType})` : ''}`, platform: t.platform ? `PF ${t.platform}` : 'PF ?', departureTime: fmt(t.time), etaMinutes: mins, hasClash: !!t.not, clashDetails: t.not ? L('notTrain', { no: t.not.no, name: t.not.name }) : '', coachLabel: L('coach'), berthLabel: L('berth'), leavesLabel: L('rbLeaves'), checkCoach: L('tlArriveS', { no: t.trainNo }) }).catch(() => {});
}
function wakePlugin() { return isIOSNative() ? window.Capacitor.Plugins?.WakeUp || null : null; }
let wakeKey = null;
function syncWakeUp() {
  const plugin = wakePlugin();
  if (!plugin) return;
  const t = state.gps || state.backup ? tripLists().upcoming.find(x => x.arrivalDate && !['WL', 'CAN'].includes(x.status?.code)) : null;
  const key = t ? [t.id, +t.arrivalDate, state.gps, state.backup, state.lang].join('|') : 'off';
  if (key === wakeKey) return;
  wakeKey = key;
  if (!t) { plugin.cancel().catch(() => {}); return; }
  plugin.schedule({ title: L('calWakeTitle', { to: t.toName, no: t.trainNo }), stopLabel: L('alarmStop'), gps: state.gps && !!t.toCoords, latitude: t.toCoords?.lat ?? 0, longitude: t.toCoords?.lon ?? 0, backup: state.backup, backupDate: +wakeAt(t), notBefore: +t.departureDate, expires: +t.arrivalDate + 2 * 36e5 })
    .then(r => { if (state.backup && r?.alarm === false) toast(L('alarmDenied')); else if (state.gps && ['denied', 'whenInUse'].includes(r?.location)) toast(L('locationDenied')); })
    .catch(() => {});
}

/* ---------- Chrome ---------- */
function applyTheme() {
  $('#app').dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = state.theme === 'light' ? '#F2F2F7' : '#111111';
  window.Capacitor?.Plugins?.SystemBars?.setStyle({ style: state.theme === 'light' ? 'LIGHT' : 'DARK' }).catch(() => {});
}
function chrome() {
  applyTheme();
  const count = recs.length;
  $('#topbar').innerHTML = `<button class="gbtn glass" data-act="openTrips" aria-label="${esc(L('tripsT'))}">${ico('layers')}${count ? `<span class="badge">${count}</span>` : ''}</button>
    <div class="gcap glass"><button data-act="bigOpen" aria-label="${esc(L('qBig'))}">${ico('expand')}</button><button data-act="openSettings" aria-label="${esc(L('settingsT'))}">${ico('sliders')}</button></div>`;
  if (!$('#tabbar')) {
    $('#dock').innerHTML = `<div class="tabbar glass" id="tabbar" role="tablist">
      <span class="lens" id="lens" aria-hidden="true"></span>
      ${[['pass', 'ticket', 'tabPass'], ['journey', 'route', 'tabJourney'], ['safety', 'shield', 'tabSafety']].map(([k, i, l]) => `<button class="tab" role="tab" id="tab-${k}" data-tab="${k}">${ico(i, 24)}<span data-l="${l}"></span></button>`).join('')}
    </div><button class="gbtn add glass" data-act="add" aria-label="${esc(L('addT'))}">${ico('plus', 28, 2.4)}</button>`;
    bindTabbar();
  }
  document.querySelectorAll('.tab span').forEach(l => { l.textContent = L(l.dataset.l); });
}
function placeLens() {
  const bar = $('#tabbar'), lens = $('#lens'); if (!bar) return;
  const tab = bar.querySelector(`[data-tab="${state.tab}"]`);
  lens.style.width = tab.offsetWidth + 'px';
  lens.style.setProperty('--lx', tab.offsetLeft + 'px');
}
function syncTabs() {
  const ai = TAB_ORDER.indexOf(state.tab);
  TAB_ORDER.forEach((k, i) => { const v = $('#view-' + k); v.style.setProperty('--dir', i < ai ? -1 : 1); v.classList.toggle('on', i === ai); });
  document.querySelectorAll('.tab').forEach(b => { const on = b.dataset.tab === state.tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; b.classList.remove('near'); });
  placeLens();
  syncGlass();
}
/* Real Liquid Glass on iOS 26: the native bar sits exactly over the web one, which stays as the fallback. */
let glassSent = '', glassTimer = 0;
function syncGlass() {
  const plugin = isIOSNative() && window.Capacitor.Plugins?.GlassTabBar;
  if (!plugin || glassTimer) return;
  // Waits a tick because closing one sheet and opening the next arrive together.
  glassTimer = setTimeout(() => {
    glassTimer = 0;
    const box = s => { const r = $(s).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
    const msg = { hidden: !!state.sheet || !!state.big, tab: state.tab, dark: state.theme !== 'light', labels: [...document.querySelectorAll('.tab span')].map(l => l.textContent), addLabel: L('addT'), bar: box('#tabbar'), add: box('.add') };
    const key = JSON.stringify(msg);
    if (key === glassSent) return;
    glassSent = key;
    plugin.update(msg).then(() => $('#dock').classList.add('native')).catch(() => {});
  });
}
function setTab(k) {
  if (state.tab === k) { placeLens(); return; }
  state.tab = k;
  if (!REDUCED()) $('#lens').animate([{ scale: '1 1' }, { scale: '1.16 .9', offset: .3 }, { scale: '1 1' }], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' });
  syncTabs();
}
function bindTabbar() {
  const bar = $('#tabbar'), lens = $('#lens');
  let drag = null;
  const tabs = () => [...bar.querySelectorAll('.tab')];
  const nearest = x => { let best = 0, bd = 1e9; tabs().forEach((t, i) => { const dd = Math.abs(t.offsetLeft + t.offsetWidth / 2 - x); if (dd < bd) { bd = dd; best = i; } }); return best; };
  const localX = e => { const r = bar.getBoundingClientRect(); return (e.clientX - r.left) * (bar.offsetWidth / r.width); };
  bar.addEventListener('pointerdown', e => {
    drag = { id: e.pointerId, x0: localX(e), moved: false };
    try { bar.setPointerCapture(e.pointerId); } catch (err) {}
  });
  bar.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const x = localX(e);
    if (!drag.moved && Math.abs(x - drag.x0) > 6) { drag.moved = true; lens.classList.add('drag'); }
    if (!drag.moved) return;
    const w = lens.offsetWidth;
    lens.style.setProperty('--lx', Math.max(4, Math.min(bar.offsetWidth - w - 4, x - w / 2)) + 'px');
    const n = nearest(x); if (n !== drag.n) { drag.n = n; triggerHaptic('selection'); } tabs().forEach((t, i) => t.classList.toggle('near', i === n));
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    lens.classList.remove('drag');
    const idx = nearest(drag.moved ? localX(e) : drag.x0);
    drag = null;
    triggerHaptic('selection');
    setTab(tabs()[idx].dataset.tab);
    syncTabs();
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', () => { drag = null; lens.classList.remove('drag'); placeLens(); });
  bar.addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); } });
  bar.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const list = tabs(), i = list.findIndex(t => t.dataset.tab === state.tab), n = (i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
    setTab(list[n].dataset.tab); list[n].focus();
  });
}

/* ---------- Render: only what changed ---------- */
const VIEWS = { pass: viewPass, journey: viewJourney, safety: viewSafety };
let lastStage = null;
function renderViews(enter) {
  for (const k of TAB_ORDER) {
    const v = $('#view-' + k), st = v.scrollTop;
    v.innerHTML = `<div class="view-inner ${enter && k === state.tab ? 'enter' : ''}">${VIEWS[k]()}</div>`;
    v.scrollTop = enter ? 0 : st;
  }
  syncTabs();
  syncLiveActivity();
  syncWakeUp();
  const t = current(); lastStage = t ? `${t.id}:${stageOf(t)}` : null;
}
function renderOverlay() { $('#bigHost').innerHTML = bigHTML(); syncGlass(); }
function render(enter) { chrome(); renderViews(enter); renderSheet(); renderOverlay(); }
function renderSheet() {
  const h = $('#sheetHost'), body = $('.sbody', h), st = body ? body.scrollTop : 0, had = !!$('#sheet', h);
  h.innerHTML = sheetHTML();
  const sh = $('#sheet', h);
  if (sh) {
    if (had) { sh.style.animation = 'none'; $('.scrim', h).style.animation = 'none'; sh.classList.add('settled'); }
    else sh.addEventListener('animationend', () => sh.classList.add('settled'), { once: true });
    const b = $('.sbody', sh); if (b) b.scrollTop = st;
    bindGrabber(sh);
  }
  syncGlass();
}
function openSheet(n) { state.sheet = n; renderSheet(); const x = $('#sheet .xbtn'); if (x) x.focus({ preventScroll: true }); }
function closeSheet() {
  const sh = $('#sheet'), sc = $('#sheetHost .scrim');
  state.sheet = null;
  syncGlass();
  if (!sh) return;
  sh.classList.remove('settled'); sh.classList.add('closing'); if (sc) sc.classList.add('closing');
  setTimeout(() => { if (!state.sheet) $('#sheetHost').innerHTML = ''; }, 270);
}
function closeNow() { state.sheet = null; $('#sheetHost').innerHTML = ''; syncGlass(); }
function bindGrabber(sh) {
  const g = $('#grabber', sh); let y0 = null, dy = 0;
  g.addEventListener('pointerdown', e => { y0 = e.clientY; dy = 0; sh.style.animation = 'none'; try { g.setPointerCapture(e.pointerId); } catch (err) {} });
  g.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
  const up = () => { if (y0 == null) return; y0 = null; if (dy > 90) { sh.style.transform = ''; closeSheet(); } else { sh.style.transition = 'transform .5s var(--sp-sheet)'; sh.style.transform = ''; setTimeout(() => { sh.style.transition = ''; }, 520); } };
  g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
}
function toast(msg, action) {
  const h = $('#toastHost');
  h.innerHTML = `<div class="toast glass"><span>${esc(msg)}</span>${action ? `<button data-act="${action.act}">${esc(action.label)}</button>` : ''}</div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => { const el = h.firstChild; if (el) el.classList.add('out'); toast.t = setTimeout(() => { h.innerHTML = ''; }, 230); }, action ? 5000 : 2800);
}
function copyText(text, ok) {
  try { navigator.clipboard.writeText(text).then(() => toast(ok)).catch(() => toast(L('copyBlocked'))); }
  catch (e) { toast(L('copyBlocked')); }
}
function syncAddFields() { const a = $('#tkt'), b = $('#exp'); if (a) state.add.text = a.value; if (b) state.add.expected = b.value; }
function syncPayFields() { for (const [id, k] of [['payNo', 'no'], ['payMeant', 'meant'], ['payStation', 'station'], ['payDate', 'date']]) { const el = $('#' + id); if (el) state.pay[k] = el.value; } }
function openAdd() { state.add = { text: '', expected: '', error: '', step: 'paste', refused: false, trip: null, rec: null }; openSheet('add'); }

/* ---------- Actions ---------- */
let undoRemoved = null;
const ACT = {
  setLang(b) { state.lang = b.dataset.v; store.set(KEY.lang, state.lang); chrome(); renderViews(); renderSheet(); renderOverlay(); },
  setTheme(b) { state.theme = b.dataset.v; store.set(KEY.theme, state.theme); applyTheme(); renderSheet(); },
  toggle(b) {
    const k = b.dataset.k; state[k] = !state[k];
    b.setAttribute('aria-checked', state[k]); // keeps the thumb's spring; a re-render would make it jump
    if (k === 'sound') { store.set(KEY.sound, state.sound); playRailwayChime(); }
    if (k === 'haptics') { store.set(KEY.haptic, state.haptics); triggerHaptic('success'); }
    // GPS can be late or held back by iOS, so it never runs without the timed alarm behind it.
    if (k === 'gps' && state.gps && !state.backup) { state.backup = true; store.set(KEY.backup, true); $('[data-k=backup]')?.setAttribute('aria-checked', true); }
    if (k === 'gps' || k === 'backup') { store.set(KEY[k], state[k]); syncWakeUp(); }
  },
  flip() { state.flipped = !state.flipped; const p = $('#pass3d'); if (p) p.classList.toggle('is-flipped', state.flipped); },
  tabSafety() { setTab('safety'); },
  tabJourney() { setTab('journey'); },
  wakeJump() { setTab('journey'); const a = $('#alerts'); if (a) $('#view-journey').scrollTo({ top: a.offsetTop - 70, behavior: REDUCED() ? 'auto' : 'smooth' }); },
  add() { closeNow(); openAdd(); },
  addPay() { state.pay = { no: '', meant: '', station: '', date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), result: null, error: '', refused: false }; openSheet('pay'); },
  trySample() { const rec = { id: uid(), raw: sampleSms(), sample: true }; recs.push(rec); saveRecords(); state.tripId = rec.id; state.tab = 'pass'; chrome(); renderViews(true); playRailwayChime(); },
  async pasteClip() {
    syncAddFields();
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) { state.add.text = text; state.add.error = ''; renderSheet(); }
      else toast(L('clipEmpty'));
    } catch (e) { toast(L('clipBlocked')); const a = $('#tkt'); if (a) a.focus(); }
  },
  readTicket() {
    syncAddFields();
    const a = state.add;
    if (!a.text.trim()) { a.error = L('errEmpty'); renderSheet(); return; }
    const rec = { id: uid(), raw: a.text.trim() }, t = tripOf(rec);
    if (!t) { a.error = L('errNotTicket'); playMismatchAlertSound(); triggerHaptic('error'); renderSheet(); return; }
    a.rec = rec; a.trip = t; a.step = 'read'; a.error = ''; a.refused = false; renderSheet();
    if (checkExpectationMismatch({ trainNo: t.trainNo, trainName: t.name }, a.expected).mismatch || t.status?.code === 'WL' || t.status?.code === 'CAN') { playMismatchAlertSound(); triggerHaptic('warning'); }
    const b = $('#sheet .sbody'); if (b) b.scrollTop = 0;
  },
  readYes() {
    const rec = state.add.rec; recs.push(rec); saveRecords();
    state.tripId = rec.id; state.tab = 'pass'; state.flipped = false;
    chrome(); renderViews(true); closeSheet(); playRailwayChime(); triggerHaptic('success'); toast(L('savedToast'));
  },
  readNo() { state.add.refused = true; renderSheet(); },
  readBack() { state.add.step = 'paste'; renderSheet(); },
  saveShared() { const rec = { id: uid(), shared: sharedRec.shared }; recs.push(rec); saveRecords(); sharedRec = null; state.tripId = rec.id; try { history.replaceState(null, '', location.pathname); } catch (e) {} chrome(); renderViews(true); playRailwayChime(); toast(L('savedToast')); },
  payCheck() {
    syncPayFields();
    const a = state.pay;
    if (!/^\d{5}$/.test(a.no.trim())) { a.error = L('payErrNo'); renderSheet(); return; }
    a.error = '';
    if (!TT) { a.result = { error: L('ttLoadingS') }; renderSheet(); return; }
    const no = a.no.trim();
    if (!TT.tr[no]) { a.result = { error: L('payUnknown') }; playMismatchAlertSound(); triggerHaptic('warning'); renderSheet(); return; }
    const typed = a.station.trim().toUpperCase();
    const station = !typed ? null : ttStation(TT, typed) || (() => { const s = TT.st.find(x => x[1].toUpperCase().startsWith(typed)); return s ? ttStation(TT, s[0]) : null; })();
    const facts = ttTrainFacts(TT, { trainNo: no, fromStn: station?.code, toStn: null, time: null, dateISO: a.date || null });
    let others = null;
    if (station && facts.dep && a.date) others = ttTrainsNear(TT, { trainNo: no, fromStn: station.code, toStn: null, time: facts.dep, dateISO: a.date })?.way.filter(x => !x.you).sort((x, y) => Math.abs(x.delta) - Math.abs(y.delta)).slice(0, 3);
    a.result = { no, facts, meant: a.meant, stationName: station?.name || (typed || null), others };
    if (checkExpectationMismatch({ trainNo: no, trainName: facts.name }, a.meant).mismatch) { playMismatchAlertSound(); triggerHaptic('warning'); }
    renderSheet();
  },
  payBack() { state.pay.result = null; renderSheet(); },
  payYes() { closeSheet(); toast(L('payOk')); },
  payNo() { state.pay.refused = true; renderSheet(); },
  closeSheet() { closeSheet(); },
  openPlatform() { openSheet('platform'); },
  setPf(b) {
    const t = current(); if (!t) return;
    t.rec.platform = b.dataset.v || null; refreshTrip(t.rec); saveRecords(); renderViews(); closeSheet();
    toast(t.rec.platform ? L('pfSaved', { pf: t.rec.platform }) : L('pfCleared'));
  },
  editTime() { closeNow(); openSheet('time'); },
  saveTime() { const t = current(), v = $('#dpt').value; if (t && v) { t.rec.time = v; refreshTrip(t.rec); saveRecords(); renderViews(); } closeSheet(); },
  commute(b) { state.commute = +b.dataset.v; store.set(KEY.commute, state.commute); renderViews(); if (state.sheet) renderSheet(); },
  openTrips() { openSheet('trips'); },
  openSettings() { openSheet('settings'); },
  openShare() { openSheet('share'); },
  openCalendar() { openSheet('calendar'); },
  installApp() { if (ACT.installPrompt) { ACT.installPrompt.prompt(); ACT.installPrompt = null; closeSheet(); } else { closeNow(); openSheet('install'); } },
  shareOpt(b) { const k = b.dataset.k; state.share[k] = !state.share[k]; b.setAttribute('aria-checked', state.share[k]); setTimeout(renderSheet, 300); },
  calPhone(b) { const t = current(); if (t) addToPhoneCalendar(calEvent(t, b.dataset.k)); },
  pickTrip(b) { state.tripId = b.dataset.v; state.flipped = false; state.tab = 'pass'; chrome(); renderViews(true); closeSheet(); },
  removeTrip(b) {
    const i = recs.findIndex(r => r.id === b.dataset.v); if (i === -1) return;
    undoRemoved = { rec: recs[i], i }; recs.splice(i, 1); saveRecords();
    if (state.tripId === undoRemoved.rec.id) state.tripId = null;
    chrome(); renderViews(); renderSheet(); toast(L('removed'), { act: 'undoRemove', label: L('undo') });
  },
  undoRemove() { if (!undoRemoved) return; recs.splice(undoRemoved.i, 0, undoRemoved.rec); undoRemoved = null; saveRecords(); chrome(); renderViews(); if (state.sheet) renderSheet(); $('#toastHost').innerHTML = ''; },
  copyPnr() { const t = current(); if (t?.pnr) copyText(t.pnr, L('copied')); },
  copyMsg(b) { copyText(b.dataset.msg, L('msgCopied')); },
  bigOpen() { closeNow(); if (!current()) { toast(L('addFirst')); return; } state.big = true; renderOverlay(); try { navigator.wakeLock?.request('screen').then(l => { ACT.wl = l; }).catch(() => {}); } catch (e) {} },
  bigClose() { $('.big')?.classList.add('out'); try { ACT.wl?.release(); } catch (e) {} setTimeout(() => { state.big = false; renderOverlay(); }, 180); },
  toggleSun() { state.sun = !state.sun; renderOverlay(); $('.big').style.animation = 'none'; }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const fn = ACT[b.dataset.act];
  if (fn) { e.preventDefault(); fn(b, e); }
});
const back = () => { if (state.sheet) closeSheet(); else if (state.big) ACT.bigClose(); else return false; return true; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') back(); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); ACT.installPrompt = e; });

/* ---------- Pass tilt: one eased loop instead of restarting a transition on every mouse event ---------- */
const tilt = { tx: 0, ty: 0, x: 0, y: 0, w: 0, h: 0, raf: 0 };
function tiltFrame() {
  tilt.x += (tilt.tx - tilt.x) * .14; tilt.y += (tilt.ty - tilt.y) * .14;
  const el = $('#passTilt');
  if (!el) { tilt.raf = 0; return; }
  el.style.transform = `rotateX(${(-tilt.y * 5).toFixed(3)}deg) rotateY(${(tilt.x * 6).toFixed(3)}deg)`;
  const f = $('.flare i', el); if (f) f.style.transform = `translate(${((tilt.x + .5) * tilt.w).toFixed(1)}px,${((tilt.y + .5) * tilt.h).toFixed(1)}px)`;
  tilt.raf = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) < .0008 ? 0 : requestAnimationFrame(tiltFrame);
}
const aim = (x, y) => { tilt.tx = x; tilt.ty = y; if (!tilt.raf) tilt.raf = requestAnimationFrame(tiltFrame); };
$('#views').addEventListener('pointermove', e => {
  if (REDUCED() || e.pointerType !== 'mouse') return;
  const el = e.target.closest('#passTilt'); if (!el) return;
  const r = el.getBoundingClientRect(); tilt.w = el.offsetWidth; tilt.h = el.offsetHeight;
  $('.flare', el).style.opacity = 1;
  aim((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5);
});
$('#views').addEventListener('pointerout', e => { const el = e.target.closest('#passTilt'); if (el && !el.contains(e.relatedTarget)) { $('.flare', el).style.opacity = 0; aim(0, 0); } });

/* A mouse can't swipe, so dragging scrolls the way a finger would. */
(() => {
  let d = null, raf = 0;
  $('#app').addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button || e.target.closest('input,textarea,summary,.dock,#grabber,.sms')) return;
    const el = e.target.closest('.sbody,.view'); if (!el) return;
    cancelAnimationFrame(raf);
    d = { el, start: e.clientY, top: el.scrollTop, moved: false, v: 0, last: e.clientY, t: e.timeStamp };
  });
  addEventListener('pointermove', e => {
    if (!d) return;
    if (!e.buttons) { d = null; return; }
    const delta = e.clientY - d.start;
    if (!d.moved && Math.abs(delta) > 6) d.moved = true;
    if (!d.moved) return;
    d.el.scrollTop = d.top - delta;
    const dt = Math.max(1, e.timeStamp - d.t); d.v = .7 * ((e.clientY - d.last) / dt) + .3 * d.v; d.last = e.clientY; d.t = e.timeStamp;
  });
  addEventListener('pointerup', () => {
    if (!d) return;
    const { el, moved } = d; let v = d.v; d = null;
    if (!moved) return;
    const stop = e => { e.stopPropagation(); e.preventDefault(); };
    addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => removeEventListener('click', stop, { capture: true }), 60);
    if (REDUCED()) return;
    let last = performance.now();
    const glide = t => { const dt = t - last; last = t; el.scrollTop -= v * dt; v *= Math.pow(.995, dt); if (Math.abs(v) > .02) raf = requestAnimationFrame(glide); };
    raf = requestAnimationFrame(glide);
  });
})();

/* ---------- Clock: the screen follows the journey ---------- */
function tick() {
  syncGlass();
  const t = current(); if (!t) return;
  const key = `${t.id}:${stageOf(t)}`;
  if (key !== lastStage) {
    const stage = stageOf(t), sameTrip = lastStage && lastStage.startsWith(t.id + ':');
    renderViews();
    pop('.view.on .next');
    if (sameTrip && !document.hidden && ['leave', 'boarding', 'wake'].includes(stage)) { playRailwayChime(); triggerHaptic('medium'); }
    return;
  }
  const chip = $('#nextChip');
  if (chip && t.departureDate) { const c = stageChip(t, stageOf(t)); if (c) chip.textContent = c; }
  syncLiveActivity();
}
setInterval(tick, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
addEventListener('resize', () => { placeLens(); syncGlass(); });

/* ---------- Timetable: loaded once, cached by the service worker for offline use ---------- */
fetch('./data/timetable.json').then(r => r.ok ? r.json() : null).then(data => {
  if (!data) return;
  TT = data; cache = new WeakMap();
  if (state.sheet === 'add' && state.add.rec) state.add.trip = tripOf(state.add.rec);
  renderViews(); renderSheet();
}).catch(() => {});

if ('serviceWorker' in navigator && !isNative() && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
if (sharedRec) state.tripId = sharedRec.id;
render(true);
// The native plugin ignores selectionChanged until this has run once.
window.Capacitor?.Plugins?.Haptics?.selectionStart().catch(() => {});
window.Capacitor?.Plugins?.Signing?.expiry().then(r => { if (r?.date) { signExpiry = r.date; renderViews(); } }).catch(() => {});
if (document.fonts?.ready) document.fonts.ready.then(placeLens);
// Used by the native apps, and by tests.
window.__tg = { state, render, ACT, tripOf, back, tab(k) { triggerHaptic('selection'); setTab(k); }, add() { triggerHaptic('medium'); ACT.add(); }, get recs() { return recs; } };
})();
