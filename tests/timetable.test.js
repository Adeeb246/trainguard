const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ttTrainFacts, ttTrainsNear, ttStation, ttFindStations, ttBetween, ttSchedule, ttLocate, ttKind } = require('../src/timetable');

const tt = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'timetable.json'), 'utf8'));
const numbers = list => list.filter(t => !t.you).map(t => t.no);
const monday = { trainNo: '16630', fromStn: 'CAN', toStn: 'KZK', time: '20:55', dateISO: '2026-11-16' };

// The train that started this project, checked against its published times
const facts = ttTrainFacts(tt, monday);
assert.strictEqual(facts.name, 'Malabar Express');
assert.strictEqual(facts.dep, '20:55');
assert.strictEqual(facts.arrHere, '20:52');
assert.strictEqual(facts.arr, '07:25');
assert.strictEqual(facts.durMin, 630);
assert.strictEqual(facts.diffMin, 0);
assert.strictEqual(facts.runs, true);
assert.ok(facts.board.endsWith('Thiruvananthapuram Central'));
assert.strictEqual(ttStation(tt, 'CAN').name, 'Kannur');
assert.strictEqual(ttStation(tt, 'KZK').name, 'Kazhakuttam');
assert.ok(Math.abs(ttStation(tt, 'KZK').lat - 8.5562) < 0.01, 'coordinates power the GPS wake-up');
assert.strictEqual(ttStation(tt, 'ZZZZZ'), null);

// Printed time disagreeing with the timetable is reported, across midnight too
assert.strictEqual(ttTrainFacts(tt, { ...monday, time: '21:05' }).diffMin, 10);
assert.strictEqual(ttTrainFacts(tt, { trainNo: '16630', fromStn: 'SRR', toStn: 'KZK', time: '23:55', dateISO: '2026-11-16' }).diffMin, -45);

// Unknown train or a station it doesn't call at
assert.strictEqual(ttTrainFacts(tt, { ...monday, trainNo: '99999' }), null);
assert.strictEqual(ttTrainFacts(tt, { ...monday, fromStn: 'NDLS' }).callsAtBoarding, false);
assert.strictEqual(ttTrainFacts(tt, { ...monday, toStn: 'NDLS' }).callsAtDestination, false);
assert.strictEqual(ttTrainFacts(tt, { ...monday, toStn: 'NDLS' }).arr, null);

// Look-alikes at Kannur on a Monday
const near = ttTrainsNear(tt, monday);
assert.deepStrictEqual(numbers(near.way), ['12686', '16603', '16566']);
assert.deepStrictEqual(numbers(near.other), ['16611', '56704', '16608', '20159', '20632']);
assert.strictEqual(near.nearest.no, '16603', 'Maveli is the dangerous one');
assert.strictEqual(near.nearest.dep, '20:00');
assert.strictEqual(near.nearest.delta, -55);
assert.strictEqual(near.way.filter(t => t.you).length, 1);
assert.strictEqual(near.other.find(t => t.no === '16608').ends, true);
assert.strictEqual(near.other.find(t => t.no === '20632').ends, false);

// Running days use the origin date: 22654 leaves Nizamuddin on Monday, so it reaches Kannur on Tuesday
assert.ok(!near.way.concat(near.other).some(t => t.no === '22654'), 'not at Kannur on a Monday');
const tuesday = ttTrainsNear(tt, { ...monday, dateISO: '2026-11-17' });
assert.ok(tuesday.way.some(t => t.no === '22654' && t.dep === '19:45'), 'at Kannur on Tuesday evening');
assert.ok(!tuesday.way.some(t => t.no === '16566'), '16566 is Monday-only');

// The return journey on a Saturday
const saturday = ttTrainsNear(tt, { trainNo: '16629', fromStn: 'KZK', toStn: 'CAN', time: '18:56', dateISO: '2026-11-21' });
assert.deepStrictEqual(numbers(saturday.way), ['56706', '16304', '56304', '66305', '12698', '16343']);
assert.deepStrictEqual(numbers(saturday.other), ['56307', '16649', '16730']);
assert.strictEqual(saturday.nearest.no, '66305');

// A window that crosses midnight
const lateNight = ttTrainsNear(tt, { trainNo: '16630', fromStn: 'SRR', toStn: 'KZK', time: '00:40', dateISO: '2026-11-17' });
assert.ok(lateNight.way.length + lateNight.other.length > 1, 'finds trains on both sides of midnight');
assert.ok(lateNight.way.concat(lateNight.other).every(t => Math.abs(t.delta) <= 120));

// A train missing from the data still gets a list, using its destination for direction
const unknown = ttTrainsNear(tt, { ...monday, trainNo: '99999' });
assert.ok(numbers(unknown.way).includes('16630'), 'Malabar calls at Kazhakuttam');
assert.strictEqual(unknown.way.find(t => t.you).no, '99999');

// Nothing to compare against
assert.strictEqual(ttTrainsNear(tt, { ...monday, time: null }), null);
assert.strictEqual(ttTrainsNear(tt, { ...monday, dateISO: null }), null);
assert.strictEqual(ttTrainsNear(tt, { ...monday, fromStn: 'ZZZZZ' }), null);

// Station search ranks the busy station first and lets an exact code win
assert.strictEqual(ttFindStations(tt, 'Kannur')[0].code, 'CAN', 'Kannur before Kannur South');
assert.strictEqual(ttFindStations(tt, 'can')[0].code, 'CAN');
assert.ok(ttFindStations(tt, 'kazha').some(s => s.code === 'KZK'));
assert.deepStrictEqual(ttFindStations(tt, '  '), []);
// The names people actually type, against the timetable's own spellings
for (const [typed, code] of [['Kozhikode', 'CLT'], ['Calicut', 'CLT'], ['Trivandrum', 'TVC'], ['Thrissur', 'TCR'], ['Bangalore', 'SBC'], ['Chennai Central', 'MAS'], ['Mumbai CST', 'CSMT'], ['Cochin', 'ERS'], ['Kolkata', 'HWH']]) {
  assert.strictEqual(ttFindStations(tt, typed)[0]?.code, code, `"${typed}" should find ${code}, got ${JSON.stringify(ttFindStations(tt, typed, 3))}`);
}
assert.strictEqual(ttFindStations(tt, 'Chennai Egmore')[0].code, 'MS', 'a real name still beats a city alias');

// Trains between two stations on a day, the way people plan a trip
const between = ttBetween(tt, 'CAN', 'KZK', '2026-11-16');
const malabar = between.find(t => t.no === '16630');
assert.deepStrictEqual([malabar.dep, malabar.arr, malabar.durMin, malabar.days], ['20:55', '07:25', 630, 1]);
assert.ok(!between.some(t => t.no === '16629'), 'the opposite direction is left out');
assert.ok(between.every((t, i) => !i || between[i - 1].at <= t.at), 'earliest first');
assert.ok(ttBetween(tt, 'KZK', 'CAN', '2026-11-21').some(t => t.no === '16629' && t.dep === '18:56'));
const weeklyEnd = ttSchedule(tt, '22654').stops.at(-1).code;
assert.ok(ttBetween(tt, 'CAN', weeklyEnd, '2026-11-17').some(t => t.no === '22654'), 'a weekly train on its day at Kannur');
assert.ok(!ttBetween(tt, 'CAN', weeklyEnd, '2026-11-16').some(t => t.no === '22654'), 'and not the day before');
assert.strictEqual(ttBetween(tt, 'CAN', 'CAN', '2026-11-16'), null);
assert.strictEqual(ttBetween(tt, 'CAN', 'ZZZZZ', '2026-11-16'), null);

// A train's full schedule
const sched = ttSchedule(tt, '16630');
assert.deepStrictEqual([sched.stops[0].code, sched.stops[0].arr], ['MAQ', null]);
assert.deepStrictEqual([sched.stops.at(-1).code, sched.stops.at(-1).dep], ['TVC', null]);
const canStop = sched.stops.find(s => s.code === 'CAN'), kzkStop = sched.stops.find(s => s.code === 'KZK');
assert.deepStrictEqual([canStop.arr, canStop.dep, canStop.day], ['20:52', '20:55', 1]);
assert.deepStrictEqual([kzkStop.arr, kzkStop.day], ['07:25', 2], 'the next morning is day 2');
assert.strictEqual(sched.days, 127, 'runs daily');
assert.strictEqual(ttSchedule(tt, '99999'), null);

// Where the phone is along the route: halfway between two stops is due halfway between their times
const stn = code => tt.st.find(s => s[0] === code);
const flat = tt.tr['16630'][4], ci = flat.findIndex((v, i) => i % 3 === 0 && tt.st[v][0] === 'CAN');
const kan = stn('CAN'), nextStop = tt.st[flat[ci + 3]], legMin = flat[ci + 4] - flat[ci + 2];
const mid = ttLocate(tt, '16630', 'CAN', (kan[2] + nextStop[2]) / 2, (kan[3] + nextStop[3]) / 2, legMin / 2 + 15);
assert.deepStrictEqual([mid.off, mid.behind, mid.prev, mid.next, mid.at], [false, false, 'Kannur', nextStop[1], null]);
assert.ok(Math.abs(mid.due - legMin / 2) < 1, `due ${mid.due}, expected ${legMin / 2}`);
assert.strictEqual(mid.nextDue, legMin);
assert.strictEqual(ttLocate(tt, '16630', 'CAN', kan[2], kan[3], 0).at, 'Kannur');
assert.strictEqual(ttLocate(tt, '16630', 'CAN', 28.61, 77.21, 60).off, true, 'Delhi is nowhere near the Malabar');
const maq = stn('MAQ');
assert.strictEqual(ttLocate(tt, '16630', 'CAN', maq[2], maq[3], -100).behind, true, 'Mangaluru is before Kannur');
assert.strictEqual(ttLocate(tt, '99999', 'CAN', kan[2], kan[3], 0), null);

// What a general ticket holder needs to know about each train
const kind = no => ttKind(no, tt.tr[no][0]);
const flags = k => [k.reserved, k.superfast, k.allGeneral];
assert.deepStrictEqual(flags(kind('12001')), [true, false, false], 'Shatabdi is reserved only');
assert.deepStrictEqual(flags(kind('12059')), [false, true, false], 'Jan Shatabdi is not reserved only, but it is superfast');
assert.deepStrictEqual(flags(kind('20632')), [true, false, false], 'Vande Bharat is reserved only');
assert.deepStrictEqual(flags(kind('12305')), [true, false, false], 'Rajdhani is reserved only');
assert.deepStrictEqual(flags(kind('16313')), [false, false, true], 'Antyodaya is all unreserved');
assert.deepStrictEqual(flags(kind('16549')), [false, false, true], 'a UR DEMU is all unreserved');
assert.deepStrictEqual(flags(kind('12686')), [false, true, false], 'MAQ MAS Superfast');
assert.deepStrictEqual(flags(kind('16630')), [false, false, false], 'Malabar is an ordinary express');
assert.deepStrictEqual(flags(kind('11115')), [false, false, false], 'a MEMU');

console.log('timetable: all checks passed');
