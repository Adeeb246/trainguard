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
  '12076': { clashNo: '12082', clashName: 'Jan Shatabdi Exp', clashTime: '14:50' },
  '12082': { clashNo: '12076', clashName: 'Jan Shatabdi Exp', clashTime: '14:30' },
  '20634': { clashNo: '20632', clashName: 'Vande Bharat Exp', clashTime: '16:05' },
  '20632': { clashNo: '20634', clashName: 'Vande Bharat Exp', clashTime: '15:15' }
};

function parseTicketText(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;

  const text = raw.replace(/[\r\n]+/g, ' ');

  // 1. Train Number (5 digits starting with 1, 2, or 0)
  const trainMatch = text.match(/\b([012]\d{4})\b/);
  const trainNo = trainMatch ? trainMatch[1] : null;
  if (!trainNo) return null;

  // 2. Train Name
  let trainName = 'EXPRESS';
  const nameMatch = text.match(/(?:Train\s*:?\s*(?:[012]\d{4})?\s*[\/-]?\s*)([A-Za-z\s]+?)(?:Express|Exp)?(?:\b|,|\d|\()/i);
  if (text.toUpperCase().includes('MALABAR')) trainName = 'MALABAR EXPRESS';
  else if (text.toUpperCase().includes('MAVELI')) trainName = 'MAVELI EXPRESS';
  else if (text.toUpperCase().includes('KERALA')) trainName = 'KERALA EXPRESS';
  else if (text.toUpperCase().includes('VANDE BHARAT')) trainName = 'VANDE BHARAT EXP';
  else if (text.toUpperCase().includes('JAN SHATABDI')) trainName = 'JAN SHATABDI EXP';
  else if (nameMatch && nameMatch[1].trim().length > 2) {
    trainName = nameMatch[1].trim().toUpperCase() + ' EXP';
  }

  // 3. Departure Time (HH:MM)
  const timeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const time = timeMatch ? timeMatch[0] : '18:40';

  // 4. Boarding & Destination Stations
  const fromMatch = text.match(/(?:From\s*:?\s*|Dep\s*:?\s*)([A-Z]{2,4})\b/i);
  const fromStn = fromMatch ? fromMatch[1].toUpperCase() : 'TVC';

  const toMatch = text.match(/(?:To\s*:?\s*)([A-Z]{2,4})\b/i);
  const toStn = toMatch ? toMatch[1].toUpperCase() : 'MAQ';

  // 5. Coach (e.g., S2, B1, A1, HA1, C1, D1, E1, EC, CC, GEN)
  const coachMatch = text.match(/(?:Coach\s*:?\s*|\b)([A-Z]\d{1,2}|HA\d|B\d{1,2}|A\d{1,2}|S\d{1,2}|C\d{1,2}|D\d{1,2}|E\d{1,2}|EC|CC|GEN)\b/i);
  const coach = coachMatch ? coachMatch[1].toUpperCase() : 'S2';

  // 6. Berth / Seat
  const berthMatch = text.match(/(?:Berth|Seat|Bth)\s*:?\s*(\d{1,3})(?:\s*,?\s*(?:Mid Berth|Lower|Upper|Side Lower|Side Upper)?\s*\(?([A-Za-z]{2})\)?)?/i);
  const berthNo = berthMatch ? berthMatch[1] : '35';
  const berthType = berthMatch && berthMatch[2] ? `(${berthMatch[2].toUpperCase()})` : '(MB)';

  // 7. PNR (10 digits)
  const pnrMatch = text.match(/\b(\d{10})\b/);
  const pnr = pnrMatch ? pnrMatch[1] : '0000000000';

  // 8. Date (DD-MM-YYYY or DD-Mon-YYYY)
  const dateMatch = text.match(/\b(\d{1,2})[-\/]([A-Za-z]{3}|\d{1,2})[-\/](\d{2,4})\b/);
  let date = '06-NOV-2026';
  let year = 2026, month = 10, day = 6;

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

  const clash = CONFUSION_PAIRS[trainNo] || null;

  return {
    trainNo,
    trainName,
    time,
    fromStn,
    toStn,
    coach,
    berthNo,
    berthType,
    pnr,
    date,
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
  module.exports = { parseTicketText, checkExpectationMismatch, CONFUSION_PAIRS };
}
