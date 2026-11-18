# Google Play listing for TrainGuard

Draft text and form answers to paste into Play Console. Check each against the app before you submit.

## Store listing

**App name:** TrainGuard

**Short description** (80 characters at most):

> Never board the wrong train. Offline pass, look-alike warnings, wake-up alarm.

**Full description:**

> TrainGuard turns your IRCTC ticket SMS into a clear pass and helps you board the right train, find your coach and wake up before your stop. It works offline, and your tickets never leave your phone.
>
> IS THIS YOUR TRAIN?
> Paste your IRCTC SMS or email. TrainGuard reads it back and asks you to confirm. If the ticket is for a different train than the one you meant, it tells you straight away. It never guesses: a waitlisted ticket shows no seat, and it asks about anything it can't read.
>
> NOT YOUR TRAIN
> See every train at your station within two hours of yours, with the ones going your way first, so a look-alike train can't catch you out.
>
> FIND TRAINS
> Every train between two stations on any date, and any train's full schedule, from the timetable on your phone. No internet needed.
>
> WHERE IS MY TRAIN
> On board, TrainGuard uses your phone's location and the timetable to estimate where you are, your next stop and how late you're running. Your location stays on your phone.
>
> WAKE-UP ALARM
> An alarm 30 minutes before your stop that rings even on silent, so you don't sleep past your station.
>
> AND MORE
> • Leave-by time, platform, coach board and boarding steps that follow your journey
> • Add the journey and a wake-up alert to your calendar
> • Several trips, and every passenger's berth
> • Share a trip with family without your PNR
> • English, Malayalam, Hindi and Tamil
> • Buttons that open the official NTES live status and PNR pages
>
> PRIVACY
> No accounts, no ads, no tracking. Your tickets are read and stored only on your phone.
>
> NOT AN OFFICIAL APP
> TrainGuard is independent and isn't affiliated with or endorsed by Indian Railways, CRIS or IRCTC. Train times come from a community-maintained timetable of Indian Railways and may be out of date. Official sources: Indian Railways enquiry (https://enquiry.indianrail.gov.in) and IRCTC (https://www.irctc.co.in). Your ticket and the station displays always come first.

**Category:** Travel & Local

**Privacy policy URL:** https://trainguard-cyan.vercel.app/privacy.html

**Graphics still to make:** icon 512 × 512 (from `icons/icon-512.png`), feature graphic 1024 × 500, and 2 to 8 phone screenshots.

## App content forms

- **App access:** everything works without signing in.
- **Ads:** none.
- **Data safety:** no data is collected or shared. Tickets and location are processed only on the phone, which Play doesn't count as collection.
- **Government apps:** not a government app. The "Not an official app" paragraph above names the sources, as Play's policy for apps that show government information asks.
- **Target audience:** adults. The app isn't designed for children.
- **Content rating:** fill in the questionnaire honestly. Nothing in the app needs a rating above Everyone.

## Permissions Play asks about

- **USE_EXACT_ALARM:** the wake-up alarm before your stop is a core feature, and it has to ring at an exact time even when the phone is idle.
- **USE_FULL_SCREEN_INTENT:** the wake-up alarm shows a full-screen Stop button over the lock screen, like an alarm clock.
- **Location (while the app is open):** Where is my train. No background location, so no background location declaration.
- **Notifications:** the wake-up alarm.

## Before production access

- New personal developer accounts must run a closed test with at least 12 testers, opted in for 14 days in a row, before applying for production.
- The timetable comes from a volunteer's GitHub project (Neo2308/indianrailways-gtfs) that states no licence. Get the author's permission, or switch to another source, before publishing.
