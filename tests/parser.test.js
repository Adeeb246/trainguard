const assert = require('assert');
const { parseTicketText, checkExpectationMismatch, formatTo12Hour, getBerthTypeFromNumber } = require('../src/parser');

const sms = (seat, more = 'DP:20:55,') => `PNR:1234567890,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,${more}Boarding at CAN only,\n${seat}\nFare:985,C Fee:11.8+PG.This rail travel is insured.\n-IRCTC`;

// Email format
const email = parseTicketText(`PNR: 4521369874
Train: 16629 / MALABAR EXPRESS
Date of Journey: 06-11-2026
From: TVC (Thiruvananthapuram) at 18:40
To: MAQ (Mangaluru Central)
Coach: S2, Berth: 35, Mid Berth (MB)
Status: CNF`);
assert.strictEqual(email.trainNo, '16629');
assert.strictEqual(email.trainName, 'MALABAR EXPRESS');
assert.strictEqual(email.time, '18:40');
assert.strictEqual(email.time12, '6:40 PM');
assert.strictEqual(email.fromStn, 'TVC');
assert.strictEqual(email.toStn, 'MAQ');
assert.strictEqual(email.coach, 'S2');
assert.strictEqual(email.berthNo, '35');
assert.strictEqual(email.berthType, 'MB');
assert.strictEqual(email.pnr, '4521369874');
assert.strictEqual(email.status.code, 'CNF');

// Chair car, explicit seat type
const cc = parseTicketText(`PNR: 8821903412
Train: 20634 / VANDE BHARAT EXP
Date: 06-11-2026
From: TVC at 16:05
To: KGQ
Coach: C3, Seat: 42 (WS)
Status: CNF`);
assert.strictEqual(cc.coach, 'C3');
assert.strictEqual(cc.berthNo, '42');
assert.strictEqual(cc.berthType, 'WS');

// Real IRCTC SMS format
const real = parseTicketText(sms('ANU MENON,S2 3,'));
assert.strictEqual(real.trainNo, '16630');
assert.strictEqual(real.trainName, null, 'an SMS has no train name, and the parser must not invent one');
assert.strictEqual(real.time, '20:55');
assert.strictEqual(real.fromStn, 'CAN');
assert.strictEqual(real.toStn, 'KZK');
assert.strictEqual(real.coach, 'S2');
assert.strictEqual(real.berthNo, '3', 'berth must not come from PNR digits');
assert.strictEqual(real.berthType, 'UB');
assert.strictEqual(real.pnr, '1234567890');
assert.strictEqual(real.date, '16-NOV-2026');
assert.strictEqual(real.dateISO, '2026-11-16');
assert.strictEqual(real.classCode, 'SL');
assert.strictEqual(real.className, 'Sleeper');
assert.strictEqual(real.fare, '985');
assert.strictEqual(real.status.code, 'CNF');
assert.strictEqual(real.passengers[0].name, 'ANU MENON');
assert.deepStrictEqual(real.missing, []);
const d = real.departureDate;
assert.deepStrictEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [2026, 10, 16, 20, 55]);

// Waitlisted and RAC tickets must never get an invented seat
for (const token of ['WL 12', 'GNWL 12', 'RLWL 12', 'W/L 12']) {
  const wl = parseTicketText(sms(`ANU MENON,${token},`));
  assert.strictEqual(wl.status.code, 'WL', token);
  assert.strictEqual(wl.status.number, 12, token);
  assert.strictEqual(wl.coach, null, `${token} has no coach`);
  assert.strictEqual(wl.berthNo, null, `${token} has no berth`);
}
const rac = parseTicketText(sms('ANU MENON,RAC 7,'));
assert.strictEqual(rac.status.code, 'RAC');
assert.strictEqual(rac.status.number, 7);
assert.strictEqual(rac.berthNo, null);
const racCoach = parseTicketText(sms('ANU MENON,S5 RAC 7,'));
assert.strictEqual(racCoach.coach, 'S5');
assert.strictEqual(racCoach.status.code, 'RAC');

// Other SMS must not become a train
assert.strictEqual(parseTicketText(''), null);
assert.strictEqual(parseTicketText('Random text without train number'), null);
assert.strictEqual(parseTicketText('Your OTP is 12345 for login. Do not share.'), null);
assert.strictEqual(parseTicketText('Rs 20500 credited to A/c XX1234 on 03-11-26'), null);
assert.strictEqual(parseTicketText('TRN:16630'), null, 'a number alone is not a ticket');

// Unread fields stay empty and are reported
const noTime = parseTicketText('PNR:1234567890,TRN:12625,DOJ:12-12-26,3A,TVC-NDLS,\nANU MENON,B2 33,');
assert.strictEqual(noTime.time, null);
assert.strictEqual(noTime.time12, null);
assert.strictEqual(noTime.departureDate, null);
assert.deepStrictEqual(noTime.missing, ['time']);
const bare = parseTicketText('PNR:1234567890,TRN:16630,CAN-KZK');
assert.strictEqual(bare.date, null);
assert.strictEqual(bare.coach, null);
assert.deepStrictEqual(bare.missing, ['time', 'date', 'seat']);
const noRoute = parseTicketText('PNR:1234567890,TRN:16630,DOJ:16-11-26,DP:20:55,S2 3,');
assert.strictEqual(noRoute.fromStn, null);
assert.strictEqual(noRoute.toStn, null);
assert.deepStrictEqual(noRoute.missing, ['from', 'to']);
const arrivalOnly = parseTicketText('PNR:1234567890,TRN:16630,DOJ:16-11-26,CAN-KZK,ARR 07:25,DP:20:55,S2 3,');
assert.strictEqual(arrivalOnly.time, '20:55', 'departure, not arrival');
const twoTimes = parseTicketText('PNR:1234567890,TRN:16630,DOJ:16-11-26,CAN-KZK,07:25,20:55,S2 3,');
assert.strictEqual(twoTimes.time, null, 'two unlabelled times are ambiguous');

// Every passenger counts
const named = parseTicketText(sms('ANU MENON,S2 3,\nRAVI MENON,S2 4,'));
assert.strictEqual(named.passengers.length, 2);
assert.strictEqual(named.passengers[1].name, 'RAVI MENON');
assert.strictEqual(named.passengers[1].berthNo, '4');
assert.strictEqual(named.passengers[1].berthType, 'LB');
const plus = parseTicketText(sms('ANU MENON+1,S2 3,S2 6,'));
assert.strictEqual(plus.passengers.length, 2);
assert.strictEqual(plus.passengers[0].name, 'ANU MENON');
assert.strictEqual(plus.passengers[1].name, null);
assert.strictEqual(plus.passengers[1].berthNo, '6');

// Berth types follow the class layout, and unknown layouts aren't guessed
assert.strictEqual(parseTicketText(sms('A R,A1 5,').replace(',SL,', ',2A,')).berthType, 'SL', '2AC berth 5 is side lower');
assert.strictEqual(getBerthTypeFromNumber('5', 'A1'), 'SL');
assert.strictEqual(getBerthTypeFromNumber('2', 'A1'), 'UB');
assert.strictEqual(getBerthTypeFromNumber('6', 'A1'), 'SU');
assert.strictEqual(getBerthTypeFromNumber('2', 'H1'), 'UB', '1AC has no middle berth');
assert.strictEqual(getBerthTypeFromNumber('3', 'H1'), 'LB');
assert.strictEqual(getBerthTypeFromNumber('2', 'S4'), 'MB');
assert.strictEqual(getBerthTypeFromNumber('7', 'B2'), 'SL');
assert.strictEqual(getBerthTypeFromNumber('8', 'B2'), 'SU');
assert.strictEqual(getBerthTypeFromNumber('12', 'M1'), null, '3E layout is not guessed');
assert.strictEqual(getBerthTypeFromNumber('12', 'C1'), null);

// Cancellations, without mistaking Kannur's code CAN for one
const cancelled = parseTicketText('PNR:1234567890,TRN:16630,DOJ:16-11-26,CAN-KZK,Your ticket has been cancelled. Refund Rs 400.');
assert.strictEqual(cancelled.status.code, 'CAN');
assert.notStrictEqual(real.status.code, 'CAN');

// Expectation check
assert.strictEqual(checkExpectationMismatch(email, '16604 Maveli').mismatch, true);
assert.strictEqual(checkExpectationMismatch(email, '16629').mismatch, false);
assert.strictEqual(checkExpectationMismatch(email, 'malabar').mismatch, false);
assert.strictEqual(checkExpectationMismatch(email, 'maveli').mismatch, true);
assert.strictEqual(checkExpectationMismatch(email, '').mismatch, false);
assert.strictEqual(checkExpectationMismatch({ trainNo: '16630', trainName: 'MALABAR EXPRESS' }, '16629 Malabar').mismatch, true, 'same name, opposite direction');
assert.strictEqual(checkExpectationMismatch({ trainNo: '16630', trainName: null }, 'Maveli').mismatch, false, "can't compare a name we don't have");

// 12-hour time
assert.strictEqual(formatTo12Hour('00:15'), '12:15 AM');
assert.strictEqual(formatTo12Hour('09:05'), '9:05 AM');
assert.strictEqual(formatTo12Hour('12:00'), '12:00 PM');
assert.strictEqual(formatTo12Hour('18:40'), '6:40 PM');
assert.strictEqual(formatTo12Hour('20:55'), '8:55 PM');
assert.strictEqual(formatTo12Hour(null), null);

console.log('parser: all checks passed');
