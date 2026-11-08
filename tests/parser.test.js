const assert = require('assert');
const { parseTicketText, checkExpectationMismatch, STATION_NAMES } = require('../src/parser');

console.log('Running TrainGuard Parser Unit Tests...');

// Test 1: Standard IRCTC SMS / Email for Malabar Express 16629
const smsMalabar = `PNR: 4521369874
Train: 16629 / MALABAR EXPRESS
Date of Journey: 06-11-2026
From: TVC (Thiruvananthapuram) at 18:40
To: MAQ (Mangaluru Central)
Coach: S2, Berth: 35, Mid Berth (MB)
Status: CNF`;

const res1 = parseTicketText(smsMalabar);
assert.strictEqual(res1.trainNo, '16629', 'Should extract train number 16629');
assert.strictEqual(res1.trainName, 'MALABAR EXPRESS', 'Should extract Malabar Express name');
assert.strictEqual(res1.time, '18:40', 'Should extract 18:40 departure time');
assert.strictEqual(res1.fromStn, 'TVC', 'Should extract TVC boarding station');
assert.strictEqual(res1.toStn, 'MAQ', 'Should extract MAQ destination');
assert.strictEqual(res1.coach, 'S2', 'Should extract Coach S2');
assert.strictEqual(res1.berthNo, '35', 'Should extract Berth 35');
assert.strictEqual(res1.berthType, '(MB)', 'Should extract Berth Type MB');
assert.strictEqual(res1.pnr, '4521369874', 'Should extract 10-digit PNR');
assert.ok(res1.clash, 'Should flag a clash warning for 16629');
assert.strictEqual(res1.clash.clashNo, '16604', 'Should warn about 16604 Maveli Express');
console.log('✓ Test 1 Passed: Malabar Express parsing & clash detection');

// Test 2: Expectation Mismatch Check (Thought 16604 Maveli, actual 16629 Malabar)
const mismatchCheck = checkExpectationMismatch(res1, '16604 Maveli');
assert.strictEqual(mismatchCheck.mismatch, true, 'Should detect mismatch between 16604 and 16629');
console.log('✓ Test 2 Passed: Expectation mismatch alert triggered accurately');

// Test 3: Matching Expectation Check
const matchCheck = checkExpectationMismatch(res1, '16629');
assert.strictEqual(matchCheck.mismatch, false, 'Should not trigger mismatch when train number matches');
console.log('✓ Test 3 Passed: Matching expectation verified');

// Test 4: Null / Empty input handling
assert.strictEqual(parseTicketText(''), null, 'Empty string should return null');
assert.strictEqual(parseTicketText('Random text without train number'), null, 'Non-ticket text should return null');
console.log('✓ Test 4 Passed: Edge cases handled cleanly');

// Test 5: Vande Bharat Express and Chair Car coach (C3)
const smsVB = `PNR: 8821903412
Train: 20634 / VANDE BHARAT EXP
Date: 06-11-2026
From: TVC at 16:05
To: KGQ
Coach: C3, Seat: 42 (WS)
Status: CNF`;
const res5 = parseTicketText(smsVB);
assert.strictEqual(res5.trainNo, '20634', 'Should extract 20634');
assert.strictEqual(res5.trainName, 'VANDE BHARAT EXP', 'Should extract Vande Bharat');
assert.strictEqual(res5.coach, 'C3', 'Should extract Chair Car C3');
assert.strictEqual(res5.berthNo, '42', 'Should extract Seat 42');
assert.strictEqual(res5.berthType, '(WS)', 'Should extract Window Seat');
assert.ok(res5.clash, 'Should detect clash for 20634');
assert.strictEqual(res5.clash.clashNo, '20632', 'Should flag 20632 clash');
console.log('✓ Test 5 Passed: Vande Bharat & Chair Car parsing');

// Test 6: Real IRCTC SMS Format (User's booking: 16630 Malabar Express, S2 Berth 3, CAN-KZK)
const userSms = `PNR:4147679046,TRN:16630,DOJ:09-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,
ADEEB RASHDHAN,S2 3,
Fare:985,C Fee:11.8+PG.This rail travel is insured.
-IRCTC`;

const resUser = parseTicketText(userSms);
assert.strictEqual(resUser.trainNo, '16630', 'Should extract train number 16630');
assert.strictEqual(resUser.trainName, 'MALABAR EXPRESS', 'Should map 16630 to MALABAR EXPRESS');
assert.strictEqual(resUser.time, '20:55', 'Should extract 20:55 departure time');
assert.strictEqual(resUser.fromStn, 'CAN', 'Should extract CAN boarding station');
assert.strictEqual(resUser.toStn, 'KZK', 'Should extract KZK destination station');
assert.strictEqual(resUser.coach, 'S2', 'Should extract Coach S2');
assert.strictEqual(resUser.berthNo, '3', 'Should extract Berth 3 (not PNR digits)');
assert.strictEqual(resUser.berthType, '(UB)', 'Should accurately calculate Upper Berth (UB) for Berth 3');
assert.strictEqual(resUser.pnr, '4147679046', 'Should extract 10-digit PNR 4147679046');
assert.strictEqual(resUser.date, '09-NOV-2026', 'Should convert 09-11-26 to 09-NOV-2026');
assert.ok(resUser.clash, 'Should flag timing clash for 16630');
assert.strictEqual(resUser.clash.clashNo, '16603', 'Should warn about 16603 Maveli Express');
console.log('✓ Test 6 Passed: Real IRCTC SMS parsed with 100% precision');

// Test 7: Station Name Resolution
assert.strictEqual(STATION_NAMES['CAN'], 'Kannur Main', 'CAN should resolve to Kannur Main');
assert.strictEqual(STATION_NAMES['KZK'], 'Kazhakuttam', 'KZK should resolve to Kazhakuttam');
assert.strictEqual(STATION_NAMES['TVC'], 'Thiruvananthapuram Central', 'TVC should resolve to Thiruvananthapuram Central');
console.log('✓ Test 7 Passed: Station name resolution verified');

console.log('\nAll 7 test suites passed! 🎉');
