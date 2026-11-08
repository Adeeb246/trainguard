/**
 * TrainGuard ticket reader for IRCTC SMS and email text.
 * Runs in Node, browsers and Google Apps Script.
 * It never guesses: anything it can't read comes back null and is listed in `missing`.
 */

const CLASS_NAMES = {
  SL: 'Sleeper',
  '3A': '3 AC',
  '2A': '2 AC',
  '1A': '1 AC',
  '3E': '3 AC Economy',
  CC: 'Chair Car',
  EC: 'Executive Chair',
  EA: 'Anubhuti',
  '2S': 'Second Sitting',
  FC: 'First Class'
};
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const COACH = '(?:HA\\d{1,2}|[ABCDEGHJMS]\\d{1,2}|EC\\d?|CC\\d?)';
const BERTH_CODE = '(?:LB|MB|UB|SL|SU|SM|WS|AS|MS)';
const SEAT_PART = new RegExp(`^(${COACH})\\s+(\\d{1,3})(?:\\s*\\(?(${BERTH_CODE})\\)?)?$`);
const COACH_PART = new RegExp(`^${COACH}$`);
const RAC_PART = new RegExp(`^(?:(${COACH})\\s+)?RAC\\s*[:#-]?\\s*(\\d+)$`, 'i');
const WL_PART = /^(?:[A-Z]{2,3}\s*)?W\/?L\s*[:#-]?\s*(\d+)$/i;
const NAME_PART = /^([A-Z][A-Z .']{1,40}?)(?:\+\d+)?$/;
const NOT_A_STATION = /^(DOJ|TRN|PNR|DEP|ARR|CNF|RAC|WL|RL|GN|IRCTC|OTP|SMS|DP)$/;

function formatTo12Hour(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!parts) return timeStr;
  const hours = parseInt(parts[1], 10);
  return `${hours % 12 || 12}:${parts[2]} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function classFromCoach(coach) {
  const c = (coach || '').toUpperCase();
  if (/^S\d/.test(c)) return 'SL';
  if (/^B\d/.test(c)) return '3A';
  if (/^A\d/.test(c)) return '2A';
  if (/^H\d/.test(c)) return '1A';
  return null;
}

// Seat classes, 3E and composite coaches have layouts that differ too much to guess.
function getBerthTypeFromNumber(berthNo, coach, classCode) {
  const num = parseInt(berthNo, 10);
  if (isNaN(num) || num <= 0) return null;
  const cls = classCode || classFromCoach(coach);
  if (cls === 'SL' || cls === '3A') return ['SU', 'LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL'][num % 8];
  if (cls === '2A') return ['SU', 'LB', 'UB', 'LB', 'UB', 'SL'][num % 6];
  if (cls === '1A') return num % 2 ? 'LB' : 'UB';
  return null;
}

function readRoute(text) {
  let from = null;
  let to = null;
  for (const m of text.matchAll(/\b([A-Z]{2,5})\s*[-–➔→\/]\s*([A-Z]{2,5})\b/g)) {
    if (!NOT_A_STATION.test(m[1]) && !NOT_A_STATION.test(m[2])) {
      from = m[1];
      to = m[2];
      break;
    }
  }
  if (!from || !to) {
    const words = text.match(/\b([A-Z]{2,5})\s+(?:to|TO)\s+([A-Z]{2,5})\b/);
    if (words) {
      from = words[1];
      to = words[2];
    }
  }
  if (!from) from = (text.match(/\b(?:From|FROM)\s*:?\s*([A-Z]{2,5})\b/) || [])[1] || null;
  if (!to) to = (text.match(/\b(?:To|TO)\s*:?\s*([A-Z]{2,5})\b/) || [])[1] || null;
  const boarding = text.match(/[Bb]oarding\s+[Aa][Tt]\s+([A-Z]{2,5})\b/);
  if (boarding) from = boarding[1];
  return { from, to };
}

function readTime(text) {
  const hhmm = (h, m) => `${h.padStart(2, '0')}:${m}`;
  const labelled = text.match(/\b(?:DP|DEPT?|DEPARTURE|DEPARTS?|TIME|AT)\.?\s*(?:TIME\s*)?[:=\s]\s*([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (labelled) return hhmm(labelled[1], labelled[2]);
  const all = [...text.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)];
  return all.length === 1 ? hhmm(all[0][1], all[0][2]) : null;
}

function readDate(text) {
  const shape = '(\\d{1,2})[-\\/.]([A-Za-z]{3}|\\d{1,2})[-\\/.](\\d{2,4})\\b';
  const found = text.match(new RegExp(`\\b(?:DOJ|DATE OF JOURNEY|JOURNEY DATE|DATE)\\s*[:=\\s]\\s*${shape}`, 'i'));
  const all = found ? [found] : [...text.matchAll(new RegExp(`\\b${shape}`, 'g'))];
  if (all.length !== 1) return null;
  const [, dd, mm, yy] = all[0];
  const named = MONTHS.indexOf(mm.toUpperCase());
  const month = named !== -1 ? named : parseInt(mm, 10) - 1;
  const year = parseInt(yy, 10) < 100 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  const day = parseInt(dd, 10);
  const check = new Date(year, month, day);
  if (check.getMonth() !== month || check.getDate() !== day) return null;
  const pad = n => String(n).padStart(2, '0');
  return { year, month, day, label: `${pad(day)}-${MONTHS[month]}-${year}`, iso: `${year}-${pad(month + 1)}-${pad(day)}` };
}

function readPassengers(raw, text, classCode) {
  const parts = raw.split(/[,;\r\n]+/).map(s => s.trim()).filter(Boolean);
  const isSeat = p => !!p && (SEAT_PART.test(p) || RAC_PART.test(p) || WL_PART.test(p) || COACH_PART.test(p));
  const out = [];
  let name = null;
  const add = fields => {
    out.push({ name, coach: null, berthNo: null, berthType: null, status: { code: 'CNF', number: null }, ...fields });
    name = null;
  };
  const seat = (coach, berthNo, type) => add({ coach, berthNo, berthType: type || getBerthTypeFromNumber(berthNo, coach, classCode) });
  parts.forEach((part, i) => {
    let m;
    if ((m = part.match(SEAT_PART))) seat(m[1], m[2], m[3]);
    else if ((m = part.match(RAC_PART))) add({ coach: m[1] || null, status: { code: 'RAC', number: parseInt(m[2], 10) } });
    else if ((m = part.match(WL_PART))) add({ status: { code: 'WL', number: parseInt(m[1], 10) } });
    else if (COACH_PART.test(part) && /^\d{1,3}$/.test(parts[i + 1] || '')) seat(part, parts[i + 1]);
    else if ((m = part.match(NAME_PART)) && !CLASS_NAMES[part] && isSeat(parts[i + 1])) name = m[1].trim();
  });
  if (out.length) return out;

  // Email style: labelled coach and berth
  const labelledCoach = text.match(/\b(?:Coach|Cch)\s*[:=]\s*([A-Z0-9]{1,4})\b/i);
  const labelledSeat = text.match(new RegExp(`\\b(?:Berth|Seat|Bth)\\s*(?:No\\.?)?\\s*[:=]\\s*(\\d{1,3})(?:\\s*,?\\s*(?:Mid Berth|Middle|Lower|Upper|Side Lower|Side Upper)?\\s*\\(?\\b(${BERTH_CODE})\\b\\)?)?`, 'i'));
  if (labelledCoach && labelledSeat) {
    seat(labelledCoach[1].toUpperCase(), labelledSeat[1], labelledSeat[2] && labelledSeat[2].toUpperCase());
    return out;
  }

  // Status written in a sentence: "Current Status: WL 12"
  const wl = text.match(/\b(?:[A-Z]{2,3}\s*)?W\/?L\s*[:#-]?\s*(\d+)\b/);
  if (wl) add({ status: { code: 'WL', number: parseInt(wl[1], 10) } });
  const rac = !wl && text.match(/\bRAC\s*[:#-]?\s*(\d+)\b/);
  if (rac) add({ status: { code: 'RAC', number: parseInt(rac[1], 10) } });
  if (out.length) return out;

  // Unlabelled and unseparated: "C3 42"
  const loose = text.match(new RegExp(`\\b(${COACH})\\s+(\\d{1,3})\\b`));
  if (loose) seat(loose[1], loose[2]);
  return out;
}

function parseTicketText(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  const text = raw.replace(/\s+/g, ' ').trim();

  const labelledTrain = text.match(/\b(?:TRN|TRAIN)(?:\s*(?:NO\.?|NUMBER))?\s*[:=#\-]?\s*(\d{5})\b/i);
  const labelledPnr = text.match(/\bPNR\s*(?:NO\.?|NUMBER)?\s*[:=\-]?\s*(\d{10})\b/i);
  const { from, to } = readRoute(text);
  const hasRoute = !!(from && to);

  // A five-digit number alone appears in OTPs and bank texts, so a ticket needs a second signal.
  const trainNo = labelledTrain ? labelledTrain[1] : hasRoute || labelledPnr ? (text.match(/\b[012]\d{4}\b/) || [])[0] : null;
  if (!trainNo || (!labelledPnr && !hasRoute)) return null;
  const pnr = labelledPnr ? labelledPnr[1] : (text.match(/\b\d{10}\b/) || [])[0] || null;

  const named = text.match(/\b\d{5}\s*[\/\-]\s*([A-Za-z][A-Za-z .]*?)\s*(?=$|[,;]|\b(?:Date|DOJ|From|To|Class|Dep|Coach|PNR)\b)/);
  const trainName = named ? named[1].trim().toUpperCase() : null;

  const time = readTime(text);
  const date = readDate(text);

  const classMatch = raw.match(/(?:^|[,\s])(SL|3A|2A|1A|3E|CC|EC|EA|2S|FC)\s*(?=[,;\n\r])/) || text.match(/\bClass\s*[:=]\s*(SL|3A|2A|1A|3E|CC|EC|EA|2S|FC)\b/i);
  const passengers = readPassengers(raw, text, classMatch ? classMatch[1].toUpperCase() : null);
  const first = passengers[0] || null;
  const classCode = classMatch ? classMatch[1].toUpperCase() : first ? classFromCoach(first.coach) : null;

  let status = null;
  if (/\bCANCEL+(?:ED|ATION)\b/i.test(text)) status = { code: 'CAN', number: null };
  else if (first) status = first.status;
  else if (/\b(?:CNF|CONFIRMED)\b/i.test(text)) status = { code: 'CNF', number: null };

  const fare = (text.match(/\bFare\s*[:=]?\s*(?:Rs\.?\s*|₹\s*|INR\s*)?(\d+(?:,\d{2,3})*(?:\.\d+)?)/i) || [])[1] || null;

  const missing = [];
  if (!time) missing.push('time');
  if (!date) missing.push('date');
  if (!from) missing.push('from');
  if (!to) missing.push('to');
  if (!first && !status) missing.push('seat');
  if (!pnr) missing.push('pnr');

  let departureDate = null;
  if (date && time) {
    const [hours, mins] = time.split(':').map(n => parseInt(n, 10));
    departureDate = new Date(date.year, date.month, date.day, hours, mins, 0);
  }

  return {
    trainNo,
    trainName,
    time,
    time12: formatTo12Hour(time),
    fromStn: from,
    toStn: to,
    coach: first ? first.coach : null,
    berthNo: first ? first.berthNo : null,
    berthType: first ? first.berthType : null,
    pnr,
    date: date ? date.label : null,
    dateISO: date ? date.iso : null,
    departureDate,
    status,
    passengers,
    classCode,
    className: classCode ? CLASS_NAMES[classCode] || null : null,
    fare,
    missing
  };
}

function checkExpectationMismatch(parsedTicket, expectedInput) {
  if (!parsedTicket || !expectedInput || expectedInput.trim().length < 3) return { mismatch: false };
  const exp = expectedInput.trim().toUpperCase();
  const digits = (exp.match(/\d{3,5}/) || [])[0];
  // A number decides on its own: 16629 and 16630 are both "Malabar" but run in opposite directions.
  const same = digits
    ? digits.length === 5 ? digits === parsedTicket.trainNo : parsedTicket.trainNo.includes(digits)
    : !parsedTicket.trainName || parsedTicket.trainName.toUpperCase().includes(exp) || exp.includes(parsedTicket.trainName.split(' ')[0].toUpperCase());
  if (same) return { mismatch: false };
  return { mismatch: true, expected: expectedInput.trim(), actualTrainNo: parsedTicket.trainNo, actualTrainName: parsedTicket.trainName };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseTicketText, checkExpectationMismatch, getBerthTypeFromNumber, formatTo12Hour, CLASS_NAMES };
}
