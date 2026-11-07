# 🚂 TrainGuard

**Make your exact train number impossible to miss right when you board.**

When two trains leave the same station within an hour of each other (such as **16629 Malabar Express** at 18:40 and **16604 Maveli Express** at 19:30 from Thiruvananthapuram Central), it is dangerously easy to step onto the wrong train during platform rush.

**TrainGuard** is a zero-dependency, offline-ready Progressive Web App (PWA) and Gmail automation script for Indian Railways passengers.

---

## ✨ Key Features

1. **Glanceable Boarding Guard Card:** Displays your 5-digit train number in huge high-contrast monospace text alongside your Coach (`S2`), Berth (`35 MB`), and departure time.
2. **Same-Station Clash Alert:** Automatically flags known high-confusion train pairs departing from the same station within ~90 minutes (`16629, NOT 16604!`).
3. **Expectation Mismatch Detector:** Lets you enter the train you *thought* you booked and flashes an immediate red warning if your ticket is actually for a different train.
4. **"When to Leave" Calculator:** Calculates the exact clock time you must leave for the station based on your commute time + a 30-minute station buffer.
5. **1-Click Calendar (`.ics`) Export with 3 Alarms:** Generates a standard calendar event titled `16629 MALABAR · Coach S2 / Berth 35 · 18:40 TVC` with automatic notifications at **3 hours**, **1 hour**, and **15 minutes** before departure.
6. **100% Client-Side & Offline Ready:** Persists your parsed ticket in `localStorage` and installs to any Android or iOS home screen with zero backend servers.

---

## 📂 Repository Structure

```text
trainguard/
├── index.html                   # Standalone installable PWA (works offline in any browser)
├── src/
│   └── parser.js                # Shared IRCTC SMS/Email parser & clash detection module
├── tests/
│   └── parser.test.js           # Zero-dependency Node.js unit test suite
├── gmail-addon/
│   └── Code.gs                  # Google Apps Script to auto-parse IRCTC emails into Calendar
├── .github/workflows/
│   └── ci.yml                   # GitHub Actions CI pipeline running tests on every push
├── package.json                 # NPM test runner configuration
└── LICENSE                      # MIT License
```

---

## 🚀 Quick Start

### 1. Run the Web App Locally or Host on GitHub Pages
Simply open `index.html` in any browser, or enable **GitHub Pages** on your repository settings (`Settings -> Pages -> Deploy from branch: main`) to get an instant live HTTPS link for your phone.

### 2. Run the Automated Tests
```bash
npm test
```

### 3. Optional: Enable Gmail Auto-Import (`gmail-addon/Code.gs`)
1. Go to [script.google.com](https://script.google.com) and create a new project.
2. Paste the contents of `src/parser.js` and `gmail-addon/Code.gs`.
3. Set a time-driven trigger to run `processIrctcEmails` every hour.

---

## 📄 License

Released under the [MIT License](./LICENSE).
