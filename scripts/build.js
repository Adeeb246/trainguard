const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// One self-contained page, so a service worker can never pair a new page with an old script.
const html = read('index.html')
  .replace(/<link rel="stylesheet" href="\.\/(src\/[^"]+)">/g, (_, file) => `<style>${read(file)}</style>`)
  .replace(/<script src="\.\/(src\/[^"]+)"><\/script>/g, (_, file) => `<script>${read(file).replace(/<\/script/gi, '<\\/script')}</script>`);

const copied = ['manifest.json', 'emulator.html', 'data/timetable.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const hash = crypto.createHash('sha256');
hash.update(html);
for (const file of copied) hash.update(fs.readFileSync(path.join(root, file)));
const build = hash.digest('hex').slice(0, 12);

for (const target of ['public', 'www']) {
  const dir = path.join(root, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'icons'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'sw.js'), read('sw.js').replace('__BUILD__', build));
  for (const file of copied) fs.copyFileSync(path.join(root, file), path.join(dir, file));
}

console.log(`Built ${build}: public/ for Vercel and www/ for Capacitor. Page ${(html.length / 1024).toFixed(0)} KB.`);
