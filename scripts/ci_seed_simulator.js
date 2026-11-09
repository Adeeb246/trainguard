// CI only: gives the simulator build a sample trip and walks through the tabs, so its screenshots show real screens.
const fs = require('fs');

const page = process.argv[2];
const d = new Date(Date.now() + 864e5);
const pad = n => String(n).padStart(2, '0');
const sms = `PNR:1234567890,TRN:16630,DOJ:${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)},SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970\n-IRCTC`;
const seed = `<script>
localStorage.setItem('trainguard_trips_v2', JSON.stringify([{ id: 'ci', raw: ${JSON.stringify(sms)} }]));
setTimeout(() => document.querySelector('#tab-journey').click(), 25000);
setTimeout(() => document.querySelector('#tab-safety').click(), 45000);
</script>`;
fs.writeFileSync(page, fs.readFileSync(page, 'utf8').replace('<head>', `<head>${seed}`));
