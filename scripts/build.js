const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const targetDirs = ['public', 'www'];

const filesToCopy = [
  'index.html',
  'manifest.json',
  'sw.js',
  'emulator.html'
];

for (const target of targetDirs) {
  const dirPath = path.join(rootDir, target);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  for (const file of filesToCopy) {
    const src = path.join(rootDir, file);
    const dest = path.join(dirPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} -> ${target}/${file}`);
    }
  }
}

console.log('Build complete! Generated "public/" for Vercel and "www/" for Capacitor.');
