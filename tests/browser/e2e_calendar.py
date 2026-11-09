"""What "Phone calendar" does on each platform. Safari's own sheet can only be seen on a real iPhone: this proves the page
navigates to a real text/calendar URL served by the service worker, which is what should trigger that sheet."""
import atexit, datetime, json, pathlib, subprocess, sys, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[2]
PORT = 4187
BASE = sys.argv[1] if len(sys.argv) > 1 else f'http://localhost:{PORT}/'
LOG = pathlib.Path(tempfile.gettempdir()) / 'trainguard_calendar_server.log'
log_out = LOG.open('w')
server = subprocess.Popen([sys.executable, '-u', '-m', 'http.server', str(PORT), '--directory', str(REPO / 'public')], stdout=log_out, stderr=subprocess.STDOUT, text=True)
atexit.register(server.kill)
for _ in range(50):
    try: urllib.request.urlopen(BASE, timeout=1); break
    except Exception: time.sleep(.1)

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
SMS = 'PNR:1234567890,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970\n-IRCTC'
SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1'
SEED = "localStorage.setItem('trainguard_trips_v2', JSON.stringify([{id:'t1',raw:%s}]));" % json.dumps(SMS)
SPY = "window.__blob=0;const cu=URL.createObjectURL;URL.createObjectURL=f=>{window.__blob++;return cu.call(URL,f)};"

results, errors = [], []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    def open_page(init='', ua=None, sw='block', mobile=True):
        kw = {'user_agent': ua} if ua else {}
        ctx = browser.new_context(viewport={'width': 393, 'height': 852}, has_touch=mobile, is_mobile=mobile, timezone_id='Asia/Kolkata', service_workers=sw, accept_downloads=True, **kw)
        ctx.clock.set_fixed_time(datetime.datetime(2026, 11, 16, 14, 10, tzinfo=IST))
        ctx.add_init_script(SEED); ctx.add_init_script(SPY)
        if init: ctx.add_init_script(init)
        page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE); page.wait_for_timeout(500)
        # The wake-up button only exists once the timetable has given an arrival time.
        page.wait_for_function('window.__tg.tripOf(window.__tg.recs[0])?.arrivalDate', timeout=30000)
        return ctx, page
    toast = lambda page: page.evaluate("document.querySelector('#toastHost').innerText")
    press = lambda page, kind='trip': page.evaluate("window.__tg.ACT.calPhone({dataset:{k:'%s'}})" % kind)
    label = lambda page: (page.evaluate('window.__tg.ACT.openCalendar()'), page.wait_for_timeout(150), page.evaluate("document.querySelector('[data-act=calPhone]').innerText"))[2]

    # iPhone app, saved straight to Calendar
    IOS_APP = "window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios',Plugins:{LiveActivity:{startActivity:()=>Promise.resolve(),stopActivity:()=>Promise.resolve(),addToCalendar:m=>{window.__cal=m;return %s}}}};"
    ctx, page = open_page(IOS_APP % 'Promise.resolve({status:"saved"})')
    press(page); page.wait_for_timeout(150)
    m = page.evaluate('window.__cal')
    check('iPhone app saves to Calendar with no file', m and page.evaluate('window.__blob') == 0 and 'Added to your calendar' in toast(page), toast(page))
    check('iPhone app sends the 3 alerts', m and m['alarmMinutes'][0] == 180 and len(m['alarmMinutes']) == 3 and m['startDate'] == datetime.datetime(2026, 11, 16, 20, 55, tzinfo=IST).timestamp() * 1000, str(m))
    check('iPhone app says "Phone calendar"', label(page) == 'Phone calendar')
    ctx.close()
    ctx, page = open_page(IOS_APP % 'Promise.reject(new Error("denied"))')
    press(page); page.wait_for_timeout(150)
    check('iPhone app with permission off explains it and downloads nothing', page.evaluate('window.__blob') == 0 and 'Calendar access is off' in toast(page), toast(page))
    ctx.close()

    # Android app, handed to the calendar app
    ANDROID_APP = "window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{PhoneCalendar:{add:m=>{window.__cal=m;return %s}}}};"
    ctx, page = open_page(ANDROID_APP % 'Promise.resolve()')
    press(page, 'wake'); page.wait_for_timeout(150)
    m = page.evaluate('window.__cal')
    check('Android app opens the calendar app with no file', m and page.evaluate('window.__blob') == 0 and m['title'].startswith('Wake up') and m['endDate'] > m['startDate'] > 0, str(m))
    check('Android app claims nothing was added, since the person still has to save', 'Added' not in toast(page), toast(page))
    check('Android says "Phone calendar"', label(page) == 'Phone calendar')
    ctx.close()
    ctx, page = open_page(ANDROID_APP % 'Promise.reject(new Error("none"))')
    press(page); page.wait_for_timeout(150)
    check('Android with no calendar app says so', 'No calendar app' in toast(page), toast(page))
    ctx.close()

    # Safari on iPhone: a real calendar URL, served from the phone
    ctx, page = open_page(ua=SAFARI, sw='allow')
    page.evaluate("navigator.serviceWorker.ready"); page.reload(); page.wait_for_timeout(600); page.wait_for_function('window.__tg.tripOf(window.__tg.recs[0])?.arrivalDate', timeout=30000)
    check('service worker controls the page', page.evaluate('!!navigator.serviceWorker.controller'))
    with page.expect_download(timeout=8000) as dl:
        press(page)  # Chromium turns the navigation into a download, which is where iPhone Safari shows its sheet
    d = dl.value
    body = pathlib.Path(d.path()).read_text(encoding='utf-8')
    check('Safari navigates to a real .ics URL, not a blob', d.url.endswith('/TrainGuard.ics') and page.evaluate('window.__blob') == 0, d.url)
    check('the file has the event and its 3 alerts', 'DTSTART:20261116T205500' in body and body.count('BEGIN:VALARM') == 3, body[:200])
    with page.expect_response('**/TrainGuard.ics') as resp:
        kind = page.evaluate("fetch('./TrainGuard.ics').then(r=>r.headers.get('content-type'))")
    check('it is served as text/calendar', kind.startswith('text/calendar'), kind)
    check('it comes from the phone, not a server', resp.value.from_service_worker)
    check('the page stays where it was', page.url.rstrip('/') == BASE.rstrip('/'), page.url)
    ctx.close()

    # Where the calendar URL can't work, the file route stays
    for name, kw, init in (('no service worker yet', {'ua': SAFARI}, ''), ('Chrome on iPhone', {'ua': CHROME_IOS, 'sw': 'allow'}, ''), ('home-screen app', {'ua': SAFARI, 'sw': 'allow'}, "Object.defineProperty(navigator,'standalone',{value:true});")):
        ctx, page = open_page(init, **kw)
        if kw.get('sw'): page.evaluate("navigator.serviceWorker.ready"); page.reload(); page.wait_for_timeout(500); page.wait_for_function('window.__tg.tripOf(window.__tg.recs[0])?.arrivalDate', timeout=30000)
        with page.expect_download(timeout=8000) as dl:
            press(page)
        check(f'{name}: falls back to the file', page.evaluate('window.__blob') == 1 and dl.value.suggested_filename == 'TrainGuard.ics', str(page.evaluate('window.__blob')))
        ctx.close()

    # Computer: says what it does, and downloads rather than opening a share dialog
    ctx, page = open_page("navigator.canShare=()=>true;navigator.share=()=>{window.__shared=1;return Promise.resolve()};", mobile=False)
    check('computer says it downloads a file', label(page) == 'Download calendar file', label(page))
    with page.expect_download(timeout=8000) as dl:
        press(page)
    check('computer downloads, with no share dialog', dl.value.suggested_filename == 'TrainGuard.ics' and not page.evaluate('window.__shared'))
    check('computer explains the next step', 'Open it to add' in toast(page), toast(page))
    check('the sheet is honest about alerts', 'use their own alerts' in page.evaluate("document.querySelector('#sheet').innerText"))
    ctx.close()
    # Phone browser that can share still uses the share sheet
    ctx, page = open_page("navigator.canShare=()=>true;navigator.share=m=>{window.__shared=m.files[0].name;return Promise.resolve()};")
    press(page); page.wait_for_timeout(150)
    check('other phones use the share sheet', page.evaluate('window.__shared') == 'TrainGuard.ics')
    ctx.close()
    browser.close()

server.terminate(); server.wait(); log_out.close()
log = LOG.read_text()
print('requests the server saw for the calendar file:', [l.split('"')[1] for l in log.splitlines() if 'TrainGuard.ics' in l])
if len(sys.argv) <= 1: check('the calendar file never reached the server', 'TrainGuard.ics' not in log, log[-300:])
check('no page errors', not errors, '; '.join(errors[:3]))
print(f'{sum(results)}/{len(results)} passed')
sys.exit(0 if all(results) else 1)
