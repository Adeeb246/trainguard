const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ttTrainFacts, ttTrainsNear, ttStation } = require('../src/timetable');

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

console.log('timetable: all checks passed');
