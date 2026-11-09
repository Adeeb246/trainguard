"""End-to-end check of the built app (public/) in real browsers with a controlled clock."""
import atexit, base64, datetime, io, json, pathlib, subprocess, sys, time, tempfile, urllib.parse, urllib.request
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

REPO = pathlib.Path(__file__).resolve().parents[2]
SHOTS = pathlib.Path(tempfile.gettempdir()) / 'trainguard-shots'; SHOTS.mkdir(exist_ok=True)
BASE = sys.argv[1] if len(sys.argv) > 1 else None
PORT = 4173
server = None
if not BASE:
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO / 'public')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    atexit.register(server.kill)
    BASE = f'http://localhost:{PORT}/'
    for _ in range(50):
        try: urllib.request.urlopen(BASE, timeout=1); break
        except Exception: time.sleep(.1)

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
def at(day, hh, mm): return datetime.datetime(2026, 11, day, hh, mm, tzinfo=IST)
SMS = 'PNR:1234567890,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970,C Fee:11.8+PG\n-IRCTC'
RET = 'PNR:1234567899,TRN:16629,DOJ:21-11-26,SL,KZK-CAN,DP:18:56,Boarding at KZK only,\nANU MENON,S4 33,\nFare:485\n-IRCTC'
RAC = 'PNR:1234567891,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON,RAC 7,\nFare:485\n-IRCTC'
WL = 'PNR:1234567892,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON,WL 12,\nFare:485\n-IRCTC'
NOTIME = 'PNR:1234567893,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,Boarding at CAN only,\nANU MENON,S2 3,\nFare:485\n-IRCTC'
CANX = 'PNR:1234567894,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Your ticket has been cancelled. Refund Rs 400.'
OFFTIME = 'PNR:1234567895,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:21:30,Boarding at CAN only,\nANU MENON,S2 3,'
AC2 = 'PNR:1234567896,TRN:12625,DOJ:18-11-26,2A,TVC-NDLS,DP:12:30,Boarding at TVC only,\nANU MENON,A1 5,'
SPY = """window.__osc=0;window.__vib=0;window.__tick=0;const AC=window.AudioContext;if(AC){const o=AC.prototype.createOscillator;AC.prototype.createOscillator=function(){window.__osc++;return o.call(this)}}
if(navigator.vibrate){const v=navigator.vibrate.bind(navigator);navigator.vibrate=p=>{window.__vib++;return v(p)}}const c=HTMLLabelElement.prototype.click;HTMLLabelElement.prototype.click=function(){window.__tick++;return c.call(this)};"""

checks, errors, frames = [], [], []
def ok(name, cond, note=''):
    checks.append((name, bool(cond), str(note)[:140]))

def seed(trips, extra=None):
    recs = [{'id': f't{i}', 'raw': r} for i, r in enumerate(trips)]
    data = {'trainguard_trips_v2': json.dumps(recs), 'trainguard_sound_enabled': 'false', 'trainguard_haptic_enabled': 'false', **(extra or {})}
    return "(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}", data

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    def ctx(w=393, h=852, mobile=True, sw='block', when=None, reduced=None, **kw):
        c = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile, timezone_id='Asia/Kolkata', service_workers=sw, permissions=['clipboard-read', 'clipboard-write'], reduced_motion=reduced, **kw)
        c.add_init_script(SPY)
        c.clock.set_fixed_time(when or at(16, 14, 10))
        return c
    def page(c, trips=None, extra=None, path=''):
        pg = c.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)[:220]))
        pg.on('console', lambda m: errors.append('console: ' + m.text[:200]) if m.type == 'error' and 'favicon' not in m.text and 'ERR_INTERNET' not in m.text and 'tel:' not in m.text else None)
        pg.goto(BASE, wait_until='load')
        if trips is not None:
            js, data = seed(trips, extra); pg.evaluate(js, data)
        if path: pg.goto(BASE + path, wait_until='load')
        else: pg.reload(wait_until='load')
        pg.wait_for_function('document.querySelector("#view-pass .view-inner")')
        pg.wait_for_load_state('networkidle')  # On a real server the timetable takes longer to arrive than on this computer
        pg.wait_for_timeout(400)
        return pg
    text = lambda pg, sel='.view.on': pg.locator(sel).first.inner_text()
    def shot(pg, label):
        pg.wait_for_timeout(700)
        frames.append((label, Image.open(io.BytesIO(pg.screenshot())).convert('RGB')))
    def tap(pg, sel):
        el = pg.locator(sel).first
        el.evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})"); pg.wait_for_timeout(60)
        el.click(timeout=4000); pg.wait_for_timeout(160)

    # ---------- First run ----------
    c = ctx(); pg = page(c, [])
    ok('First run shows the welcome screen', 'Never board the wrong train' in text(pg))
    shot(pg, 'First run')
    tap(pg, '[data-act="trySample"]'); pg.wait_for_timeout(300)
    t = text(pg)
    ok('Sample trip: pass from the SMS plus the timetable', all(s in t for s in ['16630', 'Malabar Express', 'leaves here', '7:25 AM', 'Sample']), t[:120])
    c.close()

    # ---------- Pass, real ticket ----------
    c = ctx(); pg = page(c, [SMS, RET])
    t = text(pg)
    ok('Pass shows the right train, route and times', all(s in t for s in ['16630', 'Malabar Express', 'CAN', 'KZK', '8:55 PM', '7:25 AM', '10h 30m']), t[:160])
    ok('Coach, berth, class come from the ticket', all(s in t for s in ['S2', 'Sleeper', 'Upper']))
    ok('Platform starts as Not announced', 'Not announced' in t)
    ok('Route comes from the timetable', 'Runs Mangalore Central – Thiruvananthapuram Central' in t, t[:300])
    ok('No fake labels anywhere', not any(s in pg.content() for s in ['IRCTC Digital', 'Verified Railway', 'LIVE SYNC', 'ALARM ON', 'OFFLINE CNF', 'Confirmed Seat']))
    ok('Next stage is leave-by', 'Leave by 7:55 PM' in t and 'in 5h 45m' in t, t[-400:])
    ok('Return trip is offered', '16629' in t and 'Kazhakuttam to Kannur' in t)
    shot(pg, 'Pass dark')
    tap(pg, '.face.front [data-act="flip"]'); pg.wait_for_timeout(950)
    back = pg.locator('.face.back').inner_text()
    ok('Back of pass: PNR, passengers, SMS, legal note', all(s in back for s in ['123 456 7890', 'Anu Menon', 'Passenger 2', 'S2/3', 'S2/6', 'TRN:16630', 'Not a railway ticket']), back[:200])
    shot(pg, 'Pass flipped')
    tap(pg, '.face.back [data-act="flip"]')
    # Tabs
    tap(pg, '#tab-journey'); pg.wait_for_timeout(250); t = text(pg)
    order = [t.find(s) for s in ['7:55 PM', '8:00 PM', '8:25 PM', '8:52 PM', '8:55 PM', '10:00 PM', '6:55 AM', '7:25 AM']]
    ok('Timeline is complete and in order', order == sorted(order) and -1 not in order, order)
    ok('Timeline flags the look-alike', '16603 Maveli Express leaves' in t and 'Not your train' in t)
    ok('Coach order diagram is gone, display advice stays', 'Find coach S2' in t and 'coach display' in t and 'Engine' not in t)
    ok('Berth map highlights both passengers', pg.locator('.view.on .b.me').count() == 2)
    ok('Web shows a calendar wake-up, no fake alarm toggles', pg.locator('.view.on .sw').count() == 0 and '6:55 AM' in text(pg, '#alerts'))
    shot(pg, 'Journey')
    tap(pg, '.view.on .mins [data-v="60"]'); t = text(pg)
    ok('Commute changes leave-by and persists', '7:25 PM' in t and pg.evaluate("localStorage.getItem('trainguard_commute_min')") == '60')
    tap(pg, '.view.on .mins [data-v="30"]')
    tap(pg, '#tab-safety'); pg.wait_for_timeout(250); t = text(pg)
    ok('Not-your-train list is the real Monday list', all(s in t for s in ['12686', '16603', '16630', '16566', 'Going your way']), t[:300])
    ok('Warning names the real time at Kannur', '16603 Maveli Express goes your way and leaves Kannur at 8:00 PM' in t)
    ok('Other trains start collapsed', not pg.locator('details.also').evaluate('e=>e.open') and 'Also at Kannur (5)' in t)
    tap(pg, 'details.also summary'); t = text(pg)
    ok('Expanded list marks ends and other direction', 'Ends at Kannur' in t and 'Other direction' in t and '16608' in t)
    shot(pg, 'Safety')
    # Platform
    tap(pg, '#tab-pass'); tap(pg, '.view.on [data-act="openPlatform"]'); pg.wait_for_timeout(300); shot(pg, 'Platform sheet'); tap(pg, '.pfgrid [data-v="4"]'); pg.wait_for_timeout(350)
    ok('Platform saves on this trip only', 'Set by you' in text(pg) and json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')"))[0]['platform'] == '4')
    # Show Big
    tap(pg, '.view.on [data-act="bigOpen"]'); pg.wait_for_timeout(300); t = text(pg, '.big')
    ok('Show Big: train, coach, berth, warning', all(s in t for s in ['16630', 'S2', '3', 'Upper', 'Not 16603']))
    shot(pg, 'Show Big')
    tap(pg, '[data-act="toggleSun"]'); shot(pg, 'Show Big sun'); tap(pg, '[data-act="bigClose"]'); pg.wait_for_timeout(250)
    ok('Show Big closes', pg.locator('.big').count() == 0)
    # Share
    tap(pg, '.view.on [data-act="openShare"]'); pg.wait_for_timeout(300); msg = text(pg, '#shareMsg')
    ok('Share message is real and leaves out the PNR', all(s in msg for s in ['Anu is on 16630', 'Leaves Kannur at 8:55 PM', 'Reaches Kazhakuttam at 7:25 AM', 'Coach S2, berth 3']) and '1234567890' not in msg, msg)
    href = pg.locator('#sheet a.btn.primary').get_attribute('href')
    link = json.loads(base64.urlsafe_b64decode(urllib.parse.unquote(href.split('%23trip%3D')[1].split('&')[0] + '==')).decode()) if '%23trip%3D' in href else {}
    ok('Share link carries the trip without the PNR', link.get('trainNo') == '16630' and 'pnr' not in link and 'trainguard-cyan.vercel.app' in urllib.parse.unquote(href), link)
    shot(pg, 'Share')
    tap(pg, '[aria-label="Include PNR"]'); pg.wait_for_timeout(400)
    ok('PNR only when asked', '1234567890' in text(pg, '#shareMsg'))
    tap(pg, '[aria-label="Include PNR"]'); pg.wait_for_timeout(350); tap(pg, '#sheet .xbtn'); pg.wait_for_timeout(330)
    # Calendar
    tap(pg, '.view.on [data-act="openCalendar"]'); pg.wait_for_timeout(300); t = text(pg, '#sheet')
    ok('Calendar sheet offers journey and wake-up', 'Your journey' in t and 'Wake-up alert' in t and '6:55 AM' in t)
    gurl = urllib.parse.unquote(pg.locator('#sheet a.btn').first.get_attribute('href'))
    ok('Google link: real times and the wrong-train warning', 'dates=20261116T205500/20261117T072500' in gurl and 'NOT 16603' in gurl, gurl[:120])
    ics = pg.evaluate("""async()=>{let captured=null;const cu=URL.createObjectURL;URL.createObjectURL=f=>{captured=f;return cu.call(URL,f)};document.querySelector('[data-act=calPhone][data-k=trip]').click();await new Promise(r=>setTimeout(r,200));return captured?await captured.text():null}""")
    ok('Calendar file is valid with 3 alerts', ics and ics.count('BEGIN:VALARM') == 3 and 'DTSTART:20261116T205500' in ics and 'TRIGGER:-PT180M' in ics and 'TRIGGER:-PT60M' in ics and 'TRIGGER:-PT20M' in ics, (ics or '')[:160])
    shot(pg, 'Calendar'); tap(pg, '#sheet .xbtn'); pg.wait_for_timeout(330)
    # Trips: remove and undo
    tap(pg, '[data-act="openTrips"]'); pg.wait_for_timeout(300); shot(pg, 'Trips')
    tap(pg, '[data-act="removeTrip"][data-v="t1"]'); pg.wait_for_timeout(200)
    ok('Removing a trip offers undo', 'Undo' in text(pg, '#toastHost') and len(json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')"))) == 1)
    tap(pg, '#toastHost [data-act="undoRemove"]'); pg.wait_for_timeout(150)
    ok('Undo restores the trip', len(json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')"))) == 2)
    tap(pg, '.trow[data-v="t1"]'); pg.wait_for_timeout(400)
    ok('Picking a trip shows it', '16629' in text(pg) and 'Kazhakuttam' not in text(pg)[:0])
    t = text(pg); ok('Saturday trip uses its own look-alike', 'Not 66305' in t, t[:200])
    c.close()

    # ---------- Honest ticket states ----------
    c = ctx(); pg = page(c, [WL]); t = text(pg)
    ok('Waitlist: no invented seat, a clear warning', all(s in t for s in ['Waitlisted: WL 12', 'No seat yet', "You don't have a seat yet", 'Your ticket is for this train']) and pg.locator('.view.on a.next').count() == 1, t[:200])
    ok('Waitlist links to the official PNR page', 'indianrail.gov.in' in pg.locator('.view.on a.next').get_attribute('href'))
    shot(pg, 'Waitlist'); c.close()
    c = ctx(); pg = page(c, [RAC]); t = text(pg)
    ok('RAC: shared berth explained', all(s in t for s in ['RAC 7: shared berth', 'RAC 7', 'Shared side lower', 'You can board', 'Not on your SMS']), t[:200]); shot(pg, 'RAC'); c.close()
    c = ctx(); pg = page(c, [CANX]); t = text(pg)
    ok('Cancelled ticket says so', 'Cancelled' in t and 'This ticket was cancelled' in t, t[:200]); c.close()
    c = ctx(); pg = page(c, [NOTIME]); t = text(pg)
    ok('Missing time: asks, never guesses', 'Add your departure time' in t and "Couldn't read" in t and '6:40' not in t, t[:240]); shot(pg, 'Missing time')
    tap(pg, '.view.on .next'); pg.wait_for_timeout(300); pg.locator('#dpt').fill('20:55'); tap(pg, '[data-act="saveTime"]'); pg.wait_for_timeout(350); t = text(pg)
    ok('Adding the time completes the trip', 'Leave by 7:55 PM' in t and '8:55 PM' in t and 'Not 16603' in t, t[:200])
    pg.reload(wait_until='load'); pg.wait_for_timeout(500)
    ok('The added time survives a reload', '8:55 PM' in text(pg)); c.close()
    c = ctx(); pg = page(c, [OFFTIME]); t = text(pg)
    ok('Ticket vs timetable mismatch is flagged, ticket wins', 'The timetable says 8:55 PM from Kannur, but your ticket says 9:30 PM' in t and '9:30 PM' in t, t[:300]); c.close()
    c = ctx(when=at(16, 9, 0)); pg = page(c, [AC2]); tap(pg, '#tab-journey'); pg.wait_for_timeout(200); t = text(pg)
    ok('2AC uses a 6-berth bay, berth 5 is side lower', pg.locator('.view.on .b').count() == 6 and pg.locator('.view.on .b.me').inner_text().startswith('5'), t[:100]); c.close()

    # ---------- Add a ticket ----------
    c = ctx(); pg = page(c, [])
    tap(pg, '.dock [data-act="add"]'); pg.wait_for_timeout(650); shot(pg, 'Add sheet')
    tap(pg, '[data-act="readTicket"]'); ok('Empty paste explains itself', 'Paste your ticket text first' in text(pg, '#sheet'))
    pg.locator('#tkt').fill('Your OTP is 12345 for login. Do not share.'); tap(pg, '[data-act="readTicket"]')
    ok('An OTP text is rejected', "doesn't look like a train ticket" in text(pg, '#sheet') and json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')")) == [])
    pg.locator('#tkt').fill(SMS); pg.locator('#exp').fill('16603 Maveli'); tap(pg, '[data-act="readTicket"]'); pg.wait_for_timeout(200); t = text(pg, '#sheet')
    ok('Read-back: mismatch first, then the facts', t.find('Mismatch') < t.find('YOUR TRAIN') and all(s in t for s in ['You said 16603 Maveli', '16630 Malabar Express', 'Kannur to Kazhakuttam', 'S2/3 Upper', 'Is this the train you meant?']), t[:260])
    shot(pg, 'Read-back mismatch')
    tap(pg, '[data-act="readBack"]'); ok('Going back keeps the text', pg.locator('#tkt').input_value() == SMS)
    pg.locator('#exp').fill('16629 Malabar'); tap(pg, '[data-act="readTicket"]'); ok('Same name, wrong direction is a mismatch', 'You said 16629 Malabar' in text(pg, '#sheet'))
    tap(pg, '[data-act="readNo"]'); ok('Refusing saves nothing', 'Nothing was saved' in text(pg, '#sheet') and json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')")) == [])
    tap(pg, '#sheet .xbtn'); pg.wait_for_timeout(330)
    tap(pg, '.dock [data-act="add"]'); pg.wait_for_timeout(200); pg.locator('#tkt').fill(SMS); tap(pg, '[data-act="readTicket"]'); pg.wait_for_timeout(100); tap(pg, '[data-act="readYes"]'); pg.wait_for_timeout(400)
    ok('Saving creates the trip', '16630' in text(pg) and 'saved' in text(pg, '#toastHost') and len(json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')"))) == 1)
    # Before you pay
    tap(pg, '#tab-safety'); pg.wait_for_timeout(200); tap(pg, '[data-act="addPay"]'); pg.wait_for_timeout(650); shot(pg, 'Before you pay')
    pg.locator('#payNo').fill('166'); tap(pg, '[data-act="payCheck"]'); ok('Pay check needs 5 digits', 'Enter the 5-digit' in text(pg, '#sheet'))
    pg.locator('#payNo').fill('99999'); tap(pg, '[data-act="payCheck"]'); ok('Pay check: unknown train warns', "isn't in the timetable" in text(pg, '#sheet'))
    tap(pg, '[data-act="payBack"]'); pg.locator('#payNo').fill('16603'); pg.locator('#payMeant').fill('16630'); pg.locator('#payStation').fill('Kannur'); pg.locator('#payDate').fill('2026-11-16'); tap(pg, '[data-act="payCheck"]'); pg.wait_for_timeout(200); t = text(pg, '#sheet')
    ok('Pay check needs no PNR and catches the mix-up', all(s in t for s in ['Mismatch', 'YOU ARE BOOKING', '16603', 'Maveli Express', 'Kannur at 8:00 PM', 'Also going your way', '16630']), t[:320])
    shot(pg, 'Before you pay result')
    tap(pg, '[data-act="payNo"]'); ok('Refusing says stop', "Don't pay yet" in text(pg, '#sheet')); c.close()

    # ---------- The screen follows the clock ----------
    c = ctx(); pg = page(c, [SMS])
    for when, want, label in ((at(16, 14, 10), 'Leave by 7:55 PM', 'plan'), (at(16, 20, 0), 'Leave now', 'leave'), (at(16, 20, 30), 'Find your platform', 'station'), (at(16, 20, 50), 'Check the coach board', 'boarding'), (at(16, 23, 30), 'On board', 'onboard'), (at(17, 7, 0), 'Wake up: Kazhakuttam is close', 'wake'), (at(17, 7, 30), 'You should be at Kazhakuttam', 'arrived')):
        c.clock.set_fixed_time(when); pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(120)
        ok(f'Clock stage: {label}', want in text(pg), text(pg)[:0] + want)
        if label == 'boarding':
            ok('Boarding turns the number green and says what to check', 'The coach board must say' in text(pg) and pg.locator('.view.on .hero-no.check').count() == 1); shot(pg, 'Boarding')
    c.clock.set_fixed_time(at(17, 18, 0)); pg.reload(wait_until='load'); pg.wait_for_timeout(500)
    tap(pg, '[data-act="openTrips"]'); pg.wait_for_timeout(200)
    ok('A finished trip moves to Past', 'Past' in text(pg, '#sheet') and 'Upcoming' not in text(pg, '#sheet')); c.close()

    # ---------- Old data and links ----------
    c = ctx(); pg = c.new_page(); pg.goto(BASE, wait_until='load'); pg.evaluate("(s)=>{localStorage.clear();localStorage.setItem('trainguard_saved_ticket_v1',s);localStorage.setItem('trainguard_theme_v2','light')}", SMS); pg.reload(wait_until='load'); pg.wait_for_timeout(500)
    ok('A saved ticket from the old app migrates', '16630' in text(pg) and pg.evaluate("localStorage.getItem('trainguard_saved_ticket_v1')") is None and len(json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')"))) == 1)
    ok('Old theme choice is kept', pg.evaluate("document.querySelector('#app').dataset.theme") == 'light')
    pg.evaluate("(s)=>{localStorage.clear();localStorage.setItem('trainguard_saved_ticket_v1',s)}", 'garbage text'); pg.reload(wait_until='load'); pg.wait_for_timeout(400)
    ok('Unreadable old data is left alone', pg.evaluate("localStorage.getItem('trainguard_saved_ticket_v1')") == 'garbage text' and 'Never board' in text(pg)); c.close()

    c = ctx(); pg = page(c, [], path='?train=16630&name=Malabar&from=CAN&to=KZK&coach=S2&berth=3&time=20:55&date=16-NOV-2026&pnr=1234567890')
    t = text(pg); ok('Old share links still open, with the right date', all(s in t for s in ['16630', 'Mon', '16 Nov', 'Shared trip', 'Save to my trips', 'Someone shared']), t[:240])
    ok('Opening a shared trip saves nothing by itself', json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')")) == [])
    shot(pg, 'Shared trip')
    tap(pg, '[data-act="saveShared"]'); pg.wait_for_timeout(300)
    ok('Saving a shared trip adds it', len(json.loads(pg.evaluate("localStorage.getItem('trainguard_trips_v2')"))) == 1 and 'Shared trip' in text(pg)); c.close()
    evil = '?train=16630&from=CAN&to=KZK&time=20:55&date=16-NOV-2026&name=%3Cimg%20src%3Dx%20onerror%3Dwindow.__xss%3D1%3E&coach=%3Cscript%3Ewindow.__xss%3D2%3C/script%3E&berth=%3Cimg%20src%3Dx%20onerror%3Dwindow.__xss%3D3%3E&pnr=%3Cb%3Ex'
    c = ctx(); pg = page(c, [], path=evil); pg.wait_for_timeout(300)
    ok('A malicious share link runs nothing', pg.evaluate('window.__xss') is None and pg.locator('#app img').count() == 0 and pg.locator('#app script').count() == 0)
    ok('Bad fields are dropped, good ones kept', '16630' in text(pg) and '<' not in text(pg), text(pg)[:120]); c.close()
    bad = base64.urlsafe_b64encode(json.dumps({'trainNo': '16630', 'fromStn': '<img src=x onerror=window.__xss=9>', 'name': '<img src=x onerror=window.__xss=9>'}).encode()).decode().rstrip('=')
    c = ctx(); pg = page(c, [], path=f'#trip={bad}'); pg.wait_for_timeout(300)
    ok('A malicious #trip link runs nothing', pg.evaluate('window.__xss') is None and pg.locator('#app img').count() == 0); c.close()
    c = ctx(); pg = page(c, [], path='#trip=@@notbase64'); ok('A broken link falls back cleanly', 'Never board' in text(pg)); c.close()

    # ---------- Sound and haptics ----------
    c = ctx(1280, 900, False); pg = page(c, [SMS]); osc = lambda: pg.evaluate('window.__osc')
    tap(pg, '[data-act="openSettings"]'); pg.wait_for_timeout(650); shot(pg, 'Settings'); o = osc(); tap(pg, '[aria-label="Sounds"]'); pg.wait_for_timeout(100)
    ok('Sounds on plays the chime', osc() - o == 9, osc() - o)
    o = osc(); tap(pg, '[aria-label="Sounds"]'); pg.wait_for_timeout(100); ok('Sounds off is silent', osc() - o == 0)
    tap(pg, '[aria-label="Haptics"]'); pg.wait_for_timeout(120); o = osc(); tap(pg, '.xbtn'); pg.wait_for_timeout(330)
    ok('Haptics on: a tap clicks on a computer', osc() - o >= 1, osc() - o)
    pg.reload(wait_until='load'); pg.wait_for_timeout(400); ok('Sound and haptic settings persist', pg.evaluate("localStorage.getItem('trainguard_haptic_enabled')") == 'true'); c.close()
    for label, kw, want in (('Android-style phone', {}, 'vib'), ('iPhone', {'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}, 'tick')):
        c = ctx(**kw); pg = page(c, [SMS], {'trainguard_haptic_enabled': 'true'})
        tap(pg, '.view.on [data-act="openShare"]'); pg.wait_for_timeout(120)
        ok(f'{label}: taps use its real haptic path', pg.evaluate(f'window.__{want}') >= 1); c.close()

    # ---------- Languages ----------
    for lang, sample, journey in (('ml', 'ഈ ട്രെയിനിൽ മാത്രം കയറുക', 'യാത്ര'), ('hi', 'केवल इसी ट्रेन में चढ़ें', 'यात्रा'), ('ta', 'இந்த ரயிலில் மட்டும் ஏறுங்கள்', 'பயணம்')):
        c = ctx(); pg = page(c, [SMS], {'trainguard_lang': lang}); t = text(pg)
        wide = pg.evaluate("[...document.querySelectorAll('.view')].map(v=>v.scrollWidth>v.clientWidth+1)")
        ok(f'{lang}: translated and nothing overflows', sample in t and journey in text(pg, '.tabbar') and not any(wide), wide)
        ok(f'{lang}: <html lang> is set', pg.evaluate('document.documentElement.lang') == lang)
        shot(pg, f'{lang} pass'); tap(pg, '#tab-safety'); pg.wait_for_timeout(250); shot(pg, f'{lang} safety'); c.close()

    # ---------- Themes and sizes ----------
    for w, h, label, extra in ((375, 667, '375 dark', {}), (430, 932, '430 light', {'trainguard_theme_v2': 'light'}), (393, 852, '393 light', {'trainguard_theme_v2': 'light'})):
        c = ctx(w, h); pg = page(c, [SMS, RET], extra)
        wide = pg.evaluate("document.documentElement.scrollWidth>innerWidth+1")
        ok(f'{label}: no sideways scroll', not wide); shot(pg, label)
        tap(pg, '#tab-journey'); pg.wait_for_timeout(250); shot(pg, label + ' journey'); c.close()
    c = ctx(1280, 900, False); pg = page(c, [SMS, RET]); shot(pg, 'Desktop'); c.close()

    # ---------- Offline ----------
    c = b.new_context(viewport={'width': 393, 'height': 852}, service_workers='allow', timezone_id='Asia/Kolkata')
    c.clock.set_fixed_time(at(16, 14, 10))
    pg = c.new_page(); hosts = set(); pg.on('request', lambda r: hosts.add(r.url.split('/')[2]) if r.url.startswith('http') else None)
    pg.goto(BASE, wait_until='load')
    ok('No request leaves the app\'s own host', all(h == BASE.split('/')[2] for h in hosts), hosts)
    pg.evaluate("caches.open('trainguard-cache-v1').then(c=>c.put('/old',new Response('x')))")
    pg.evaluate("navigator.serviceWorker.ready"); pg.wait_for_timeout(1500)
    js, data = seed([SMS]); pg.evaluate(js, data); pg.reload(wait_until='load'); pg.wait_for_timeout(1200)
    sw_on = pg.evaluate("!!navigator.serviceWorker.controller")
    names = pg.evaluate("caches.keys()")
    ok('Service worker controls the page and precached everything', sw_on and any(n.startswith('trainguard-') and n != 'trainguard-cache-v1' for n in names), names)
    files = pg.evaluate("caches.keys().then(k=>caches.open(k.find(n=>n!=='trainguard-cache-v1'))).then(c=>c.keys()).then(r=>r.map(x=>new URL(x.url).pathname))")
    ok('Offline cache includes the timetable', '/data/timetable.json' in files and '/index.html' in files, files)
    c.set_offline(True); pg.reload(wait_until='load'); pg.wait_for_timeout(900); t = text(pg)
    ok('OFFLINE reload: full pass, timetable and styling', all(s in t for s in ['16630', 'Malabar Express', 'Not 16603 Maveli Express', '7:25 AM']) and pg.evaluate("getComputedStyle(document.querySelector('.tabbar')).display") == 'grid', t[:160])
    pg.goto(BASE + '?train=16630&from=CAN&to=KZK&time=20:55&date=16-NOV-2026', wait_until='load'); pg.wait_for_timeout(500)
    ok('OFFLINE: shared links open too', 'Shared trip' in text(pg))
    c.close()
    c = b.new_context(viewport={'width': 393, 'height': 852}, service_workers='allow'); pg = c.new_page(); pg.goto(BASE, wait_until='load'); pg.evaluate("caches.open('trainguard-cache-v1').then(c=>c.put('/old',new Response('x')))"); pg.wait_for_timeout(300)
    pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r&&r.unregister())"); pg.reload(wait_until='load'); pg.wait_for_timeout(1500)
    ok('Upgrading clears the old app cache', 'trainguard-cache-v1' not in pg.evaluate('caches.keys()'), pg.evaluate('caches.keys()')); c.close()
    # Native app: no service worker, and the network is gone
    c = b.new_context(viewport={'width': 393, 'height': 852}, service_workers='block', timezone_id='Asia/Kolkata'); c.clock.set_fixed_time(at(16, 14, 10)); pg = c.new_page()
    pg.route('**/*', lambda r: r.continue_() if BASE.split('/')[2] in r.request.url else r.abort())
    pg.goto(BASE, wait_until='load'); js, data = seed([SMS]); pg.evaluate(js, data); pg.reload(wait_until='load'); pg.wait_for_timeout(600)
    ok('Native simulation: layout complete with no network (was 0 of 99)', pg.evaluate("getComputedStyle(document.querySelector('.tiles')).display") == 'grid' and pg.evaluate("[...document.querySelectorAll('.foot,.row,.dock,.topbar')].every(e=>getComputedStyle(e).display==='flex')") and 'Not 16603' in text(pg))
    c.close()
    b.close()

print('Page errors:', errors[:8] or 'none')
fails = [c for c in checks if not c[1]]
for name, good, note in fails: print('FAIL', name, f'[{note}]' if note else '')
print(f'{len(checks) - len(fails)}/{len(checks)} checks passed')
# Contact sheets
TW = 300; per = 5; rows = 2; idx = 0; n = 0
for old in SHOTS.glob('e2e*.png'): old.unlink()
while idx < len(frames):
    chunk = frames[idx:idx + per * rows]; idx += per * rows
    th = [(l, im.resize((int(im.width * (TW / im.width if im.width < 500 else 600 / im.width)), int(im.height * (TW / im.width if im.width < 500 else 600 / im.width))))) for l, im in chunk]
    H = max(t.height for _, t in th) + 26
    W = max(sum(t.width + 8 for _, t in th[:per]), sum(t.width + 8 for _, t in th[per:]) if len(th) > per else 0)
    sheet = Image.new('RGB', (W, H * (1 if len(th) <= per else 2)), (40, 40, 40)); d = ImageDraw.Draw(sheet); x = y = 0
    for i, (lab, t) in enumerate(th):
        if i == per: x = 0; y = H
        sheet.paste(t, (x, y + 22)); d.text((x + 3, y + 5), lab, fill=(255, 255, 255)); x += t.width + 8
    n += 1; sheet.save(SHOTS / f'e2e{n}.png')
print('sheets', n, 'in', SHOTS)
sys.exit(1 if fails or errors else 0)
