const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { I18N, tr } = require('../src/i18n');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const placeholders = text => (text.match(/\{\w+\}/g) || []).sort().join();

// Every language has every key, with the same placeholders, so a value can never go missing from safety text
for (const lang of Object.keys(I18N)) {
  for (const key of Object.keys(I18N.en)) {
    assert.ok(I18N[lang][key], `${lang} is missing "${key}"`);
    assert.strictEqual(placeholders(I18N[lang][key]), placeholders(I18N.en[key]), `${lang}.${key} placeholders differ`);
  }
  for (const key of Object.keys(I18N[lang])) assert.ok(key in I18N.en, `${lang} has an unknown key "${key}"`);
}
assert.strictEqual(tr('en', 'notTrain', { no: '16603', name: 'Maveli' }), 'Not 16603 Maveli');
assert.strictEqual(tr('xx', 'tabPass'), 'Pass', 'unknown languages fall back to English');

// Every key the app asks for exists
const app = read('src/app.js');
const asked = [...app.matchAll(/\bL\('(\w+)'/g)].map(m => m[1]);
const stages = ['plan', 'leave', 'station', 'boarding', 'onboard', 'wake', 'arrived'].flatMap(s => [`${s}T`, `${s}S`]);
for (const key of [...asked, ...stages]) assert.ok(I18N.en[key], `app.js asks for missing key "${key}"`);

// The page must work offline and carry nobody's real data
const shipped = ['index.html', 'src/app.js', 'src/app.css', 'src/parser.js', 'src/i18n.js', 'sw.js'].map(read).join('\n');
assert.ok(!/cdn\.tailwindcss|fonts\.googleapis|<script[^>]+src="https?:/.test(shipped), 'no remote code or styles: the app must load with no network');
const browserTests = fs.readdirSync(path.join(root, 'tests/browser')).map(f => read(`tests/browser/${f}`)).join('\n');
assert.ok(!/RASHDHAN|4147679046/.test(shipped + read('tests/parser.test.js') + browserTests), 'no real passenger data in the repo');
assert.ok(!/function parseTicketText/.test(read('index.html') + app), 'parser.js is the only parser');

// Everything the service worker precaches must be built
const build = read('scripts/build.js');
for (const m of read('sw.js').matchAll(/'\.\/([^']+)'/g)) assert.ok(m[1] === 'index.html' || build.includes(m[1]), `sw.js precaches ${m[1]}, which build.js doesn't copy`);

// Every native plugin the page calls must exist, or a renamed one would silently switch a feature off
const swiftDir = path.join(root, 'ios/App/App');
const swift = fs.readdirSync(swiftDir).filter(f => f.endsWith('.swift')).map(f => fs.readFileSync(path.join(swiftDir, f), 'utf8')).join('\n');
const javaDir = path.join(root, 'android/app/src/main/java/com/trainguard/app');
const java = fs.readdirSync(javaDir).map(f => fs.readFileSync(path.join(javaDir, f), 'utf8')).join('\n');
const native = new Set(['Haptics', 'SystemBars', ...[...(swift + java).matchAll(/(?:jsName = |@CapacitorPlugin\(name = )"(\w+)"/g)].map(m => m[1])]); // The first two ship with Capacitor
for (const m of app.matchAll(/\.Plugins\??\.(\w+)/g)) assert.ok(native.has(m[1]), `app.js calls a native plugin that doesn't exist: ${m[1]}`);

console.log('app: all checks passed');
