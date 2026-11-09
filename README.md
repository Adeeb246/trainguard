# TrainGuard

**Never board the wrong train.**

TrainGuard started with a lost ticket. 16629 Malabar Express and 16604 Maveli Express leave the same station about an hour apart, and it's easy to book one believing it's the other. On a confirmed Tatkal ticket, that mistake isn't refundable.

Paste your IRCTC SMS and TrainGuard turns it into a clear pass, warns you about the trains you could board by mistake, and works with no signal at the station.

**Live app:** https://trainguard-cyan.vercel.app/

## What it does

- **Is this your train?** It reads your ticket back and asks. If you say you meant a different train, it tells you straight away.
- **Before you pay.** Type the train number from the booking page and check it before you spend money you can't get back.
- **Not your train.** Every train at your station within two hours of yours on that date, with the ones going your way first.
- **It never guesses.** A waitlisted ticket shows no seat. Anything it can't read says so and asks you. Other SMS, like OTPs, are rejected.
- **The screen follows your journey:** leave-by time, finding your platform, checking the coach board, waking up before your stop.
- **Multiple trips and family.** Keep return journeys, see every passenger's berth, and share a trip without exposing your PNR.
- **English, Malayalam, Hindi and Tamil** across the whole app. Train and station names stay in English, as they do on your ticket.
- **Offline.** Everything, including the timetable, works after one visit. Your tickets stay on your phone and nothing is uploaded.

The iPhone app adds a Live Activity and Dynamic Island with a real countdown, and a GPS wake-up that still works when the train runs late.

TrainGuard isn't a ticket and isn't affiliated with Indian Railways or IRCTC. The TTE checks your SMS and ID.

## Development

```bash
npm test                     # parser, timetable, and app checks
npm run build                # one self-contained page in public/ (Vercel) and www/ (Capacitor)
python -m http.server 3300   # run from the repo root, then open http://localhost:3300/emulator.html
```

| Path | What it is |
|---|---|
| `index.html`, `src/app.js`, `src/app.css` | The app |
| `src/parser.js` | Reads tickets. It runs in Node, browsers and Apps Script |
| `src/timetable.js`, `data/timetable.json` | Offline timetable lookups and data |
| `src/i18n.js` | All text, in all four languages |
| `design-system/trainguard/MASTER.md` | Design rules and the reasons for them |
| `scripts/build_timetable.py` | Refreshes the timetable from the community feed |
| `scripts/render_icons.py` | Renders `icons/icon.svg` into every icon and splash screen |
| `ios/`, `android/` | Native apps, built by GitHub Actions |
| `gmail-addon/Code.gs` | Optional: turns IRCTC emails into calendar events |

`launch_iphone_webkit.py` opens the app in WebKit on Windows, but that build doesn't paint `backdrop-filter`, so it can't show the glass. Check the glass on a real iPhone.

**Deploying:** pushing to `main` deploys to Vercel and builds the iOS IPA and the Android APK as GitHub Actions artifacts.

**Installing:** download the artifact from the latest Actions run, signed in to GitHub.
- **iPhone:** sideload `TrainGuard.ipa` with Sideloadly. With a free Apple ID the app stops opening after 7 days until you sideload it again, so re-sign it before a trip.
- **Android:** open `TrainGuard.apk` and allow installs from that app. Each CI build has its own signing key, so a newer APK only installs after you remove the old one, and that clears saved trips.

## Timetable data

The timetable comes from a [community GTFS feed](https://mobilitydatabase.org/feeds/gtfs/mdb-2867). It's unofficial, it states no licence, and Indian Railways has asserted copyright over its database. Check that before any store listing. The app shows the snapshot's date, and the time printed on your ticket always wins.

## License

[MIT](./LICENSE), for the code. The licence doesn't cover the timetable data.
