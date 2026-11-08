"""Builds data/timetable.json from the community Indian Railways GTFS feed. Run by hand to refresh it:

    python scripts/build_timetable.py [feed.zip url] [snapshot date]

Feed: https://mobilitydatabase.org/feeds/gtfs/mdb-2867 (produced by github.com/Neo2308/indianrailways-gtfs).
It is unofficial and states no licence, so check that before any store listing.

Output, kept compact because phones store it for offline use:
  {"asOf": "YYYY-MM-DD",
   "st": [[code, name, lat, lon], ...],
   "tr": {number: [name, dayMask (Monday = bit 0), firstDay, lastDay, [stationIndex, arrive, depart, ...]]}}
Arrive and depart are minutes from midnight on the day the train leaves its origin, so they can pass 1440.
"""
import csv
import datetime
import io
import json
import pathlib
import re
import sys
import urllib.request
import zipfile

URL = sys.argv[1] if len(sys.argv) > 1 else "https://files.mobilitydatabase.org/mdb-2867/mdb-2867-202608310026/mdb-2867-202608310026.zip"
AS_OF = sys.argv[2] if len(sys.argv) > 2 else "2026-08-31"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "timetable.json"
TODAY = int(datetime.date.today().strftime("%Y%m%d"))

TRAIN_WORDS = {"EXP": "Express", "EXPRESS": "Express", "SPL": "Special", "SPECIAL": "Special", "PASS": "Passenger", "PASSENGER": "Passenger", "SF": "Superfast", "VB": "Vande Bharat"}
STATION_WORDS = {"JN": "Jn", "JN.": "Jn", "CTL": "Central", "MGR": "MGR"}


def train_name(raw):
    out = []
    for word in re.split(r"(\s+|-)", raw.strip()):
        if word.upper() in TRAIN_WORDS:
            out.append(TRAIN_WORDS[word.upper()])
        elif word.isalpha() and len(word) > 4:
            out.append(word.title())
        else:
            out.append(word)  # short words here are station codes: MAQ, TVC, CBE
    return re.sub(r"\s+", " ", "".join(out)).strip()


def station_name(raw):
    return " ".join(STATION_WORDS.get(w, w.title()) for w in raw.split())


def minutes(hms):
    h, m, *_ = hms.split(":")
    return int(h) * 60 + int(m)


request = urllib.request.Request(URL, headers={"User-Agent": "trainguard-timetable-build"})
archive = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(request, timeout=180).read()))


def rows(name):
    with archive.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))


stops = list(rows("stops.txt"))
index = {s["stop_id"]: i for i, s in enumerate(stops)}
stations = [[(s.get("stop_code") or s["stop_id"]).upper(), station_name(s["stop_name"]), round(float(s["stop_lat"]), 4) if s["stop_lat"] else None, round(float(s["stop_lon"]), 4) if s["stop_lon"] else None] for s in stops]

routes = {r["route_id"]: r for r in rows("routes.txt")}
calendar = {c["service_id"]: c for c in rows("calendar.txt")}
days = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")

times = {}
for r in rows("stop_times.txt"):
    if r["stop_id"] in index:
        times.setdefault(r["trip_id"], []).append((int(r["stop_sequence"]), index[r["stop_id"]], minutes(r["arrival_time"]), minutes(r["departure_time"])))

trains = {}
skipped = 0
for t in rows("trips.txt"):
    service = calendar.get(t["service_id"])
    calls = sorted(times.get(t["trip_id"], []))
    if not service or len(calls) < 2:
        skipped += 1
        continue
    if int(service["end_date"]) < TODAY:  # specials that have already finished
        skipped += 1
        continue
    mask = sum(1 << i for i, d in enumerate(days) if service[d] == "1")
    flat = [v for call in calls for v in call[1:]]
    trains[t["trip_id"]] = [train_name(routes[t["route_id"]]["route_long_name"]), mask, int(service["start_date"]), int(service["end_date"]), flat]

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps({"asOf": AS_OF, "st": stations, "tr": trains}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(trains)} trains, {len(stations)} stations, skipped {skipped}, {OUT.stat().st_size / 1e6:.2f} MB -> {OUT}")
