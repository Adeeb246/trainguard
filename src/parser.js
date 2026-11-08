/**
 * TrainGuard - Shared IRCTC SMS / Email Ticket Parser & Clash Detector
 * Works in Node.js, Browser, and Google Apps Script environments.
 */

const CONFUSION_PAIRS = {
  '16629': { clashNo: '16604', clashName: 'Maveli Express', clashTime: '19:30' },
  '16604': { clashNo: '16629', clashName: 'Malabar Express', clashTime: '18:40' },
  '16630': { clashNo: '16603', clashName: 'Maveli Express', clashTime: '17:30' },
  '16603': { clashNo: '16630', clashName: 'Malabar Express', clashTime: '18:15' },
  '12625': { clashNo: '12623', clashName: 'Trivandrum Mail', clashTime: '14:50' },
  '12623': { clashNo: '12625', clashName: 'Kerala Express', clashTime: '12:30' },
  '16347': { clashNo: '16349', clashName: 'Rajya Rani Express', clashTime: '20:30' },
  '16349': { clashNo: '16347', clashName: 'Mangaluru Express', clashTime: '20:50' },
  '12076': { clashNo: '12082', clashName: 'Jan Shatabdi Exp', clashTime: '14:30' },
  '12082': { clashNo: '12076', clashName: 'Jan Shatabdi Exp', clashTime: '14:50' },
  '20634': { clashNo: '20632', clashName: 'Vande Bharat Exp', clashTime: '16:05' },
  '20632': { clashNo: '20634', clashName: 'Vande Bharat Exp', clashTime: '15:15' }
};

const TRAIN_NAMES = {
  '16629': 'MALABAR EXPRESS',
  '16630': 'MALABAR EXPRESS',
  '16603': 'MAVELI EXPRESS',
  '16604': 'MAVELI EXPRESS',
  '20633': 'VANDE BHARAT EXP',
  '20634': 'VANDE BHARAT EXP',
  '20631': 'VANDE BHARAT EXP',
  '20632': 'VANDE BHARAT EXP',
  '12623': 'TRIVANDRUM MAIL',
  '12624': 'CHENNAI MAIL',
  '12625': 'KERALA EXPRESS',
  '12626': 'KERALA EXPRESS',
  '12075': 'JAN SHATABDI EXP',
  '12076': 'JAN SHATABDI EXP',
  '12081': 'JAN SHATABDI EXP',
  '12082': 'JAN SHATABDI EXP',
  '16347': 'MANGALURU EXPRESS',
  '16348': 'TRIVANDRUM EXPRESS',
  '16349': 'RAJYA RANI EXP',
  '16350': 'RAJYA RANI EXP'
};

const STATION_NAMES = {
  'TVC': 'Thiruvananthapuram Central',
  'CAN': 'Kannur Main',
  'KZK': 'Kazhakuttam',
  'MAQ': 'Mangaluru Central',
  'MAJN': 'Mangaluru Junction',
  'CLT': 'Kozhikode',
  'ERS': 'Ernakulam South',
  'ERN': 'Ernakulam Town',
  'AWY': 'Aluva',
  'TCR': 'Thrissur',
  'SRR': 'Shoranur Junction',
  'TIR': 'Tirur',
  'BDJ': 'Vadakara',
  'TLY': 'Thalassery',
  'PAY': 'Payyanur',
  'KGQ': 'Kasaragod',
  'QLN': 'Kollam Junction',
  'KYJ': 'Kayamkulam Junction',
  'ALLP': 'Alappuzha',
  'KTYM': 'Kottayam',
  'NDLS': 'New Delhi',
  'MAS': 'Chennai Central',
  'SBC': 'Bengaluru City',
  'CSMT': 'Mumbai CSMT',
  'HWH': 'Howrah Junction'
};

function formatTo12Hour(timeStr, includeAmPm = true, isHtml = false) {
  if (!timeStr) return '';
  const parts = String(timeStr).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!parts) return timeStr;
  let hours = parseInt(parts[1], 10);
  const minutes = parts[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeFormatted = `${hours}:${minutes}`;
  if (!includeAmPm) return timeFormatted;
  if (isHtml) {
    return `${timeFormatted} <span class="text-xs sm:text-sm font-semibold tracking-normal" style="color: var(--text-secondary);">${ampm}</span>`;
  }
  return `${timeFormatted} ${ampm}`;
}

function getBerthTypeFromNumber(berthNo, coach) {
  const num = parseInt(berthNo, 10);
  if (isNaN(num) || num <= 0) return '(BERTH)';
  const c = (coach || '').toUpperCase();
  if (c.startsWith('C') || c.startsWith('D') || c.startsWith('E') || c === 'CC' || c === 'EC' || c === '2S') {
    return '(SEAT)';
  }
  const mod8 = num % 8;
  if (mod8 === 1 || mod8 === 4) return '(LB)';
  if (mod8 === 2 || mod8 === 5) return '(MB)';
  if (mod8 === 3 || mod8 === 6) return '(UB)';
  if (mod8 === 7) return '(SL)';
  if (mod8 === 0) return '(SU)';
  return '(BERTH)';
}

function parseTicketText(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;

  const text = raw.replace(/[\r\n]+/g, ' ');

  // 1. Train Number (TRN:16630, TRAIN: 16629, or 5-digit number)
  const trnMatch = text.match(/(?:TRN|TRAIN|TRAIN NO|TRAIN NUMBER)\s*[:=\s]*([0-9]{5})\b/i);
  const generalTrainMatch = text.match(/\b([012]\d{4})\b/);
  const trainNo = trnMatch ? trnMatch[1] : (generalTrainMatch ? generalTrainMatch[1] : null);
  if (!trainNo) return null;

  // 2. Train Name (dictionary lookup first, then keyword recognition, then regex)
  let trainName = TRAIN_NAMES[trainNo] || null;
  if (!trainName) {
    if (text.toUpperCase().includes('MALABAR')) trainName = 'MALABAR EXPRESS';
    else if (text.toUpperCase().includes('MAVELI')) trainName = 'MAVELI EXPRESS';
    else if (text.toUpperCase().includes('KERALA')) trainName = 'KERALA EXPRESS';
    else if (text.toUpperCase().includes('VANDE BHARAT')) trainName = 'VANDE BHARAT EXP';
    else if (text.toUpperCase().includes('JAN SHATABDI')) trainName = 'JAN SHATABDI EXP';
    else {
      const nameMatch = text.match(/(?:Train\s*:?\s*(?:[012]\d{4})?\s*[\/-]?\s*)([A-Za-z\s]+?)(?:Express|Exp)?(?:\b|,|\d|\()/i);
      if (nameMatch && nameMatch[1].trim().length > 2) trainName = nameMatch[1].trim().toUpperCase() + ' EXP';
      else trainName = 'EXPRESS';
    }
  }

  // 3. Departure Time (DP:20:55, DEP: 18:40, at 18:40, 20:55)
  const dpMatch = text.match(/(?:DP|DEP|DEPARTURE|TIME|AT)\s*[:=\s]*([01]?\d|2[0-3]):([0-5]\d)\b/i);
  const generalTimeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const time = dpMatch ? (dpMatch[1].padStart(2, '0') + ':' + dpMatch[2]) : (generalTimeMatch ? generalTimeMatch[0] : '18:40');
  const time12 = formatTo12Hour(time);

  // 4. Stations / Route (CAN-KZK, CAN to KZK, From/To, Boarding at CAN)
  let fromStn = null;
  let toStn = null;

  const bkgAtMatch = text.match(/Boarding\s+at\s+([A-Z]{2,5})\b/i);
  const hyphenRouteMatch = text.match(/\b([A-Z]{2,5})\s*[-–➔\/]\s*([A-Z]{2,5})\b/);
  if (hyphenRouteMatch && !['DOJ', 'TRN', 'PNR', 'DEP', 'ARR'].includes(hyphenRouteMatch[1]) && !['DOJ', 'TRN', 'PNR', 'DEP', 'ARR'].includes(hyphenRouteMatch[2])) {
    fromStn = hyphenRouteMatch[1].toUpperCase();
    toStn = hyphenRouteMatch[2].toUpperCase();
  }

  if (!fromStn || !toStn) {
    const toRouteMatch = text.match(/\b([A-Z]{2,5})\s+to\s+([A-Z]{2,5})\b/i);
    if (toRouteMatch) {
      if (!fromStn) fromStn = toRouteMatch[1].toUpperCase();
      if (!toStn) toStn = toRouteMatch[2].toUpperCase();
    }
  }

  if (!fromStn) {
    const fromMatch = text.match(/(?:From\s*:?\s*)([A-Z]{2,5})\b/i);
    if (fromMatch) fromStn = fromMatch[1].toUpperCase();
  }
  if (!toStn) {
    const toMatch = text.match(/(?:To\s*:?\s*)([A-Z]{2,5})\b/i);
    if (toMatch) toStn = toMatch[1].toUpperCase();
  }

  if (bkgAtMatch) {
    fromStn = bkgAtMatch[1].toUpperCase();
  }

  if (!fromStn) fromStn = 'TVC';
  if (!toStn) toStn = 'CAN';

  // 5. Coach & Berth
  let coach = null;
  let berthNo = null;
  let berthType = null;
  const BERTH_CODES = '(?:LB|MB|UB|SL|SU|SM|WS|AS)';

  // Explicit labels: Coach: S2, Berth: 35
  const explicitCoach = text.match(/(?:Coach|Cch)\s*[:=\s]*([A-Z0-9]{1,4})\b/i);
  const explicitBerth = text.match(/(?:Berth|Seat|Bth)\s*[:=\s]*(\d{1,3})(?:\s*,?\s*(?:Mid Berth|Lower|Upper|Side Lower|Side Upper)?\s*(?:\(([A-Za-z]+)\)|([A-Za-z]{2})))?/i);

  if (explicitCoach) coach = explicitCoach[1].toUpperCase();
  if (explicitBerth) {
    berthNo = explicitBerth[1];
    const bType = explicitBerth[2] || explicitBerth[3];
    if (bType) berthType = '(' + bType.toUpperCase() + ')';
  }

  // IRCTC SMS Passenger line: ADEEB RASHDHAN,S2 3, or S2 3 (UB) or S2 3 MB or S2, 3
  if (!coach || !berthNo) {
    const passengerRegex = new RegExp('(?:^|[,;\\n\\r])\\s*(?:[A-Za-z\\s]+,\\s*)?([A-Z]\\d{1,2}|HA\\d|B\\d{1,2}|A\\d{1,2}|S\\d{1,2}|C\\d{1,2}|D\\d{1,2}|E\\d{1,2}|EC|CC)\\s*[, ]\\s*(\\d{1,3})(?:\\s*(?:,\\s*)?(?:\\((' + BERTH_CODES + ')\\)|\\b(' + BERTH_CODES + ')\\b|(?:Mid Berth|Lower|Upper|Side Lower|Side Upper)))?', 'i');
    const pMatch = text.match(passengerRegex);
    if (pMatch) {
      if (!coach) coach = pMatch[1].toUpperCase();
      if (!berthNo) berthNo = pMatch[2];
      const bType = pMatch[3] || pMatch[4];
      if (!berthType && bType) berthType = '(' + bType.toUpperCase() + ')';
    }
  }

  if (!coach) {
    const coachMatch = text.match(/\b([A-Z]\d{1,2}|HA\d|B\d{1,2}|A\d{1,2}|S\d{1,2}|C\d{1,2}|D\d{1,2}|E\d{1,2}|EC|CC|GEN)\b/i);
    coach = coachMatch ? coachMatch[1].toUpperCase() : 'S2';
  }

  if (!berthNo) berthNo = '3';
  if (!berthType) berthType = getBerthTypeFromNumber(berthNo, coach);

  // 6. PNR (10 digits)
  const pnrMatch = text.match(/(?:PNR\s*[:=\s]*|\b)([0-9]{10})\b/i);
  const pnr = pnrMatch ? pnrMatch[1] : '0000000000';

  // 7. Date of Journey (DOJ:09-11-26, 09-11-2026, 06-NOV-2026)
  const dateMatch = text.match(/\b(?:DOJ\s*[:=\s]*|Date\s*[:=\s]*|Date of Journey\s*[:=\s]*)?(\d{1,2})[-\/]([A-Za-z]{3}|\d{1,2})[-\/](\d{2,4})\b/i);
  let date = '09-NOV-2026';
  let year = 2026, month = 10, day = 9;

  if (dateMatch) {
    day = parseInt(dateMatch[1], 10);
    const mStr = dateMatch[2];
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mIdx = months.indexOf(mStr.toUpperCase());
    if (mIdx !== -1) {
      month = mIdx;
    } else {
      month = parseInt(mStr, 10) - 1;
    }
    let y = parseInt(dateMatch[3], 10);
    year = y < 100 ? 2000 + y : y;
    date = `${day < 10 ? '0' + day : day}-${months[month]}-${year}`;
  }

  const [hours, mins] = time.split(':').map(n => parseInt(n, 10));
  const departureDate = new Date(year, month, day, hours, mins, 0);
  const clash = CONFUSION_PAIRS[trainNo] || null;

  return {
    trainNo,
    trainName,
    time,
    time12,
    fromStn,
    toStn,
    coach,
    berthNo,
    berthType,
    pnr,
    date,
    departureDate,
    clash
  };
}

function checkExpectationMismatch(parsedTicket, expectedInput) {
  if (!parsedTicket || !expectedInput || expectedInput.trim().length < 3) {
    return { mismatch: false };
  }
  const exp = expectedInput.trim().toUpperCase();
  const matchesNo = parsedTicket.trainNo.includes(exp) || exp.includes(parsedTicket.trainNo);
  const matchesName = parsedTicket.trainName.toUpperCase().includes(exp) || exp.includes(parsedTicket.trainName.split(' ')[0]);
  if (!matchesNo && !matchesName) {
    return {
      mismatch: true,
      expected: exp,
      actualTrainNo: parsedTicket.trainNo,
      actualTrainName: parsedTicket.trainName
    };
  }
  return { mismatch: false };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseTicketText,
    checkExpectationMismatch,
    CONFUSION_PAIRS,
    TRAIN_NAMES,
    STATION_NAMES,
    getBerthTypeFromNumber,
    formatTo12Hour
  };
}
