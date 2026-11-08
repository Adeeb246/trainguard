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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ttTrainFacts, ttTrainsNear, ttStation, ttRunsOn, ttHHMM, ttMinutes, ttDate };
}
