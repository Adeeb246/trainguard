# TrainGuard design system

Tokens live in `src/app.css`. This file records the rules and why they exist. If the two disagree, the CSS is what ships, so fix this file.

## The one job

A passenger on a crowded platform must read the right train number at a glance. Every design choice serves that.

## Liquid Glass

- **Glass is for controls only:** the tab bar, top buttons, sheets and toasts. Apple's guidance: "Don't use Liquid Glass in the content layer."
- **The pass stays solid.** It has to be readable on a bright platform and with blur turned off.
- **No glass on glass.** Groups inside a sheet use a plain tint.
- **The web can't refract.** Safari accepts `backdrop-filter: url()` and draws nothing, and `@supports` can't detect that. Web glass is blur, saturation, an edge highlight and spring motion.
- **Home Screen web apps get an empty strip at the bottom on iOS 26.** iOS draws it, about as tall as the status bar, in the page's background colour, and no page element can reach it (WebKit bug 301994). The page's background matches the canvas so it doesn't stand out. Don't stretch the layout into it: the tab bar could end up underneath. The iPhone app doesn't have the strip.
- **The iPhone app uses web glass too.** A native `UIGlassEffect` tab bar was tried and removed: real glass bends what's behind it, so over this app's dark background it showed as a flat dark pill, and it looked worse than the web bar on a real iPhone. Trying it again needs the app's own icons and a background that gives it something to bend.
- **Text on glass must pass contrast with no blur at all.** That's why the tints are 66-72% opaque. Reduced Transparency falls back to the solid tint.

## Colour

| Role | Dark | Light |
|---|---|---|
| Canvas | `#111111` | `#F2F2F7` |
| Pass | `#1A1A1A` | `#FFFFFF` |
| Your train, confirmed | `#4ADE80` | `#1A8A42` |
| Not your train, waitlist, cancelled | `#FF6B6B` | `#D42620` |
| Unknown or needs checking | `#FBBF24` | `#B45309` |

Colour always carries meaning and never stands alone: every state also has words. Amber means "we don't know, so check". Green never appears on something unconfirmed.

## Type

System fonts only: SF on iPhone, Roboto on Android, Segoe UI on Windows. Malayalam, Hindi and Tamil come from the system too. Nothing loads from the network, so the app looks the same offline. Nothing is smaller than 12px, and digits are tabular wherever they line up.

## Touch and motion

- Tap targets are at least 44pt. A smaller visual gets a larger hit area.
- Only `transform` and `opacity` animate, so motion runs on the compositor. Press states never shift layout.
- Springs come from CSS `linear()`, generated in `src/app.js`, with `cubic-bezier` as a fallback.
- Blur never moves: sheets add it once they stop. No `filter` sits above moving content.
- Views stay mounted, so switching tabs rebuilds nothing. Inactive views have `pointer-events: none`.
- `prefers-reduced-motion` turns all of this off.

## Honesty rules

These matter more than anything visual, because a wrong fact here can cost someone a train.

- Never show a value the ticket or timetable didn't provide. Unread fields say "Couldn't read, tap to add".
- No label may claim something the app can't know: no "Verified", "Live", or official-looking railway branding.
- The ticket's printed time always wins over the timetable. If they differ, say so.
- Show the timetable's date wherever its data appears.
- Don't draw a coach order, because we have no real source for it. Send people to the platform display.
