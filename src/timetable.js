/**
 * Offline lookups over data/timetable.json (format described in scripts/build_timetable.py).
 * The ticket's own printed time always wins; this data only fills gaps and finds look-alike trains.
 */

const NEAR_MINUTES = 120;

function ttDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function ttHHMM(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function ttMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function ttStationId(tt, code) {
  if (!tt.ids) tt.ids = new Map(tt.st.map((s, i) => [s[0], i]));
  return tt.ids.get(code);
}

function ttStopIndex(flat, stationId) {
  for (let i = 0; i < flat.length; i += 3) if (flat[i] === stationId) return i;
  return -1;
}

// Days are counted from the train's origin, so a call after midnight belongs to the service that left the day before.
function ttRunsOn(rec, stopMinutes, date) {
  const origin = new Date(date.getFullYear(), date.getMonth(), date.getDate() - Math.floor(stopMinutes / 1440));
  const day = origin.getFullYear() * 10000 + (origin.getMonth() + 1) * 100 + origin.getDate();
  return ((rec[1] >> ((origin.getDay() + 6) % 7)) & 1) === 1 && day >= rec[2] && day <= rec[3];
}

function ttStation(tt, code) {
  const id = ttStationId(tt, code);
  if (id === undefined) return null;
  const [, name, lat, lon] = tt.st[id];
  return { code, name, lat, lon };
}

/** What the timetable says about the ticket's train. Null if the train isn't in the data. */
function ttTrainFacts(tt, ticket) {
  const rec = tt.tr[ticket.trainNo];
  if (!rec) return null;
  const flat = rec[4];
  const facts = {
    name: rec[0],
    board: `${tt.st[flat[0]][1]} – ${tt.st[flat[flat.length - 3]][1]}`,
    dep: null, arrHere: null, arr: null, durMin: null, diffMin: null, runs: null, callsAtBoarding: false, callsAtDestination: false
  };
  const fromId = ttStationId(tt, ticket.fromStn);
  const f = fromId === undefined ? -1 : ttStopIndex(flat, fromId);
  if (f === -1) return facts;
  facts.callsAtBoarding = true;
  facts.dep = ttHHMM(flat[f + 2]);
  facts.arrHere = ttHHMM(flat[f + 1]);
  if (ticket.time) facts.diffMin = ((ttMinutes(ticket.time) - flat[f + 2] + 720) % 1440 + 1440) % 1440 - 720;
  if (ticket.dateISO) facts.runs = ttRunsOn(rec, flat[f + 2], ttDate(ticket.dateISO));
  const toId = ttStationId(tt, ticket.toStn);
  const t = toId === undefined ? -1 : ttStopIndex(flat, toId);
  if (t > f) {
    facts.callsAtDestination = true;
    facts.arr = ttHHMM(flat[t + 1]);
    facts.durMin = flat[t + 1] - flat[f + 2];
  }
  return facts;
}

/**
 * Every train at the boarding station within two hours of the ticket's time on that day.
 * `way` shares stops ahead of the passenger, so it's the one they could board by mistake.
 */
function ttTrainsNear(tt, ticket) {
  const fromId = ttStationId(tt, ticket.fromStn);
  if (fromId === undefined || !ticket.time || !ticket.dateISO) return null;
  const date = ttDate(ticket.dateISO);
  const at = ttMinutes(ticket.time);

  const mine = tt.tr[ticket.trainNo];
  const ahead = new Set();
  if (mine) {
    const from = ttStopIndex(mine[4], fromId);
    if (from !== -1) for (let i = from + 3; i < mine[4].length; i += 3) ahead.add(mine[4][i]);
  }
  if (!ahead.size) {
    const toId = ttStationId(tt, ticket.toStn);
    if (toId !== undefined) ahead.add(toId);
  }

  const way = [{ no: ticket.trainNo, name: ticket.trainName || (mine && mine[0]) || null, dep: ticket.time, delta: 0, you: true, to: ticket.toStn ? (ttStation(tt, ticket.toStn) || {}).name || ticket.toStn : null }];
  const other = [];
  for (const no of Object.keys(tt.tr)) {
    if (no === ticket.trainNo) continue;
    const rec = tt.tr[no];
    const flat = rec[4];
    const i = ttStopIndex(flat, fromId);
    if (i === -1) continue;
    const last = i === flat.length - 3;
    const stop = last ? flat[i + 1] : flat[i + 2];
    const delta = ((stop - at + 720) % 1440 + 1440) % 1440 - 720;
    if (Math.abs(delta) > NEAR_MINUTES) continue;
    const localDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + Math.floor((at + delta) / 1440));
    if (!ttRunsOn(rec, stop, localDay)) continue;
    let shared = 0;
    for (let j = i + 3; j < flat.length; j += 3) if (ahead.has(flat[j])) shared++;
    const item = { no, name: rec[0], dep: ttHHMM(stop), delta, ends: last, to: tt.st[flat[flat.length - 3]][1] };
    (shared > 0 ? way : other).push(item);
  }
  way.sort((a, b) => a.delta - b.delta);
  other.sort((a, b) => a.delta - b.delta);
  const nearest = way.filter(t => !t.you).sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0] || null;
  return { way, other, nearest };
}

// Names people type that the timetable spells differently: old names, new names and its own official ones.
const TT_ALIASES = {
  CALICUT: 'CLT', TRIVANDRUM: 'TVC', COCHIN: 'ERS', KOCHI: 'ERS', ALLEPPEY: 'ALLP', QUILON: 'QLN', TRICHUR: 'TCR', PALGHAT: 'PGT',
  CANNANORE: 'CAN', TELLICHERRY: 'TLY', BADAGARA: 'BDJ', MANGALURU: 'MAQ', BANGALORE: 'SBC', BENGALURU: 'SBC', MYSURU: 'MYS',
  CHENNAI: 'MAS', 'CHENNAI CENTRAL': 'MAS', MADRAS: 'MAS', MUMBAI: 'CSMT', 'MUMBAI CST': 'CSMT', BOMBAY: 'CSMT', CALCUTTA: 'HWH', KOLKATA: 'HWH', BARODA: 'BRC',
  BENARES: 'BSB', BANARAS: 'BSB', TRICHY: 'TPJ', TIRUCHIRAPPALLI: 'TPJ', POONA: 'PUNE', VIZAG: 'VSKP'
};
// Letters only, with doubled letters made single, so "Kozhikode" finds the timetable's "Kozhikkode".
const ttLoose = s => String(s).toUpperCase().replace(/[^A-Z]/g, '').replace(/(.)\1+/g, '$1');

/** Stations matching typed text, best first. Busier stations rank higher within each kind of match. */
function ttFindStations(tt, text, limit = 6) {
  const q = String(text || '').trim().toUpperCase(), lq = ttLoose(q);
  if (!q) return [];
  if (!tt.calls) {
    tt.calls = new Uint16Array(tt.st.length);
    for (const no in tt.tr) { const flat = tt.tr[no][4]; for (let i = 0; i < flat.length; i += 3) tt.calls[flat[i]]++; }
    tt.loose = tt.st.map(s => ttLoose(s[1]));
  }
  // A common name typed in full ("chennai"), its start ("trivan"), or it plus more words ("mumbai central").
  const aliasExact = new Set(), aliasStart = new Set(), aliasWhole = new Set();
  if (lq.length >= 3) for (const [k, code] of Object.entries(TT_ALIASES)) {
    const lk = ttLoose(k);
    if (lk === lq) aliasExact.add(code); else if (lk.startsWith(lq)) aliasStart.add(code); else if (lq.startsWith(lk)) aliasWhole.add(code);
  }
  const out = [];
  tt.st.forEach((s, i) => {
    const name = s[1].toUpperCase();
    const rank = s[0] === q || name === q || aliasExact.has(s[0]) ? 0 : name.startsWith(q) || aliasStart.has(s[0]) ? 1 : s[0].startsWith(q) || aliasWhole.has(s[0]) ? 2
      : name.includes(q) ? 3 : lq.length >= 3 && tt.loose[i].includes(lq) ? 4 : -1;
    if (rank !== -1) out.push({ rank, calls: tt.calls[i], code: s[0], name: s[1] });
  });
  return out.sort((a, b) => a.rank - b.rank || b.calls - a.calls).slice(0, limit).map(({ code, name }) => ({ code, name }));
}

/** Every train that calls at `fromCode` and later at `toCode`, leaving `fromCode` on the given date, earliest first. */
function ttBetween(tt, fromCode, toCode, dateISO) {
  const a = ttStationId(tt, fromCode), b = ttStationId(tt, toCode);
  if (a === undefined || b === undefined || a === b || !dateISO) return null;
  const date = ttDate(dateISO), out = [];
  for (const no of Object.keys(tt.tr)) {
    const rec = tt.tr[no], flat = rec[4], i = ttStopIndex(flat, a);
    if (i === -1) continue;
    let j = -1;
    for (let k = i + 3; k < flat.length; k += 3) if (flat[k] === b) { j = k; break; }
    if (j === -1 || !ttRunsOn(rec, flat[i + 2], date)) continue;
    const dep = flat[i + 2], arr = flat[j + 1];
    out.push({ no, name: rec[0], dep: ttHHMM(dep), arr: ttHHMM(arr), durMin: arr - dep, days: Math.floor(arr / 1440) - Math.floor(dep / 1440), at: dep % 1440 });
  }
  return out.sort((x, y) => x.at - y.at);
}

/** A train's stops in order, with times and the day of the journey each one falls on. */
function ttSchedule(tt, trainNo) {
  const rec = tt.tr[trainNo];
  if (!rec) return null;
  const flat = rec[4], last = flat.length - 3, stops = [];
  for (let i = 0; i < flat.length; i += 3) {
    const [code, name] = tt.st[flat[i]];
    stops.push({ code, name, arr: i ? ttHHMM(flat[i + 1]) : null, dep: i < last ? ttHHMM(flat[i + 2]) : null, day: Math.floor((i ? flat[i + 1] : flat[i + 2]) / 1440) + 1 });
  }
  return { no: trainNo, name: rec[0], days: rec[1], stops };
}

/**
 * Where a phone is along a train's route. Finds the pair of stops the position fits between, using straight
 * lines, so curves make it an estimate. All times are minutes after the scheduled departure from `fromCode`,
 * and `nowMin` is the current time on that scale.
 */
function ttLocate(tt, trainNo, fromCode, lat, lon, nowMin) {
  const rec = tt.tr[trainNo];
  if (!rec || rec[4].length < 6) return null;
  const flat = rec[4], cos = Math.cos(lat * Math.PI / 180);
  const km = (s, y, x) => Math.hypot((s[3] - x) * 111.32 * cos, (s[2] - y) * 110.57);
  const fromId = ttStationId(tt, fromCode), f0 = fromId === undefined ? -1 : ttStopIndex(flat, fromId), f = Math.max(f0, 0), base = flat[f + 2];
  const legs = [];
  for (let i = 0; i + 3 < flat.length; i += 3) {
    const A = tt.st[flat[i]], B = tt.st[flat[i + 3]], da = km(A, lat, lon), db = km(B, lat, lon), ab = km(A, B[2], B[3]);
    const frac = da + db ? da / (da + db) : 0;
    legs.push({ i, da, db, ab, extra: da + db - ab, due: flat[i + 2] + frac * (flat[i + 4] - flat[i + 2]) - base });
  }
  const min = Math.min(...legs.map(l => l.extra));
  // Close fits happen at a stop (the legs in and out) and where a route passes a place twice, so the clock decides.
  const best = legs.filter(l => l.extra <= min + 0.5).sort((x, y) => Math.abs(x.due - nowMin) - Math.abs(y.due - nowMin))[0];
  if (best.extra > 8 + best.ab * 0.1) return { off: true };
  const { i, da, db } = best, near = da < 1.5 ? i : db < 1.5 ? i + 3 : -1;
  return { off: false, behind: i < f, due: best.due, prev: tt.st[flat[i]][1], next: tt.st[flat[i + 3]][1], nextDue: flat[i + 4] - base, at: near === -1 ? null : tt.st[flat[near]][1] };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ttTrainFacts, ttTrainsNear, ttStation, ttRunsOn, ttHHMM, ttMinutes, ttDate, ttFindStations, ttBetween, ttSchedule, ttLocate };
}
