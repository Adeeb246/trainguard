"""What the page asks the iPhone's alarm and Live Activity code to do, with a fake native layer and a fixed clock.
This proves the page's requests are right, not that iOS carries them out."""
import datetime, json, pathlib, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[2]
PORT = 4183
BASE = f'http://localhost:{PORT}/'
server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO / 'public')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(50):
    try: urllib.request.urlopen(BASE, timeout=1); break
    except Exception: time.sleep(.1)

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
at = lambda d, h, m=0: datetime.datetime(2026, 11, d, h, m, tzinfo=IST)
ms = lambda dt: dt.timestamp() * 1000
OK = 'PNR:1234567890,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970\n-IRCTC'
WL = 'PNR:1234567892,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON,WL 12,\nFare:485\n-IRCTC'
CAN = 'PNR:1234567894,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Your ticket has been cancelled. Refund Rs 400.'
SCHEDULES = "m.startAt>Date.now()?{status:'scheduled'}:{status:'started'}"
FAKE = """window.__wake=[];window.__live=[];window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios',Plugins:{
WakeUp:{schedule:m=>{window.__wake.push(['schedule',m]);return Promise.resolve(%s)},cancel:()=>{window.__wake.push(['cancel']);return Promise.resolve()}},
LiveActivity:{startActivity:m=>{window.__live.push(['start',m]);return %s},stopActivity:()=>{window.__live.push(['stop']);return Promise.resolve()}}}};"""

results, errors = [], []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        def open_page(sms, when, result="{alarm:true,location:'always'}", live=f'Promise.resolve({SCHEDULES})'):
            ctx = browser.new_context(viewport={'width': 393, 'height': 852}, timezone_id='Asia/Kolkata')
            ctx.clock.set_fixed_time(when)
            ctx.add_init_script("if(!localStorage.getItem('trainguard_trips_v2'))localStorage.setItem('trainguard_trips_v2', JSON.stringify([{id:'t1',raw:%s}]));" % json.dumps(sms))
            ctx.add_init_script(FAKE % (result, live))
            page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(BASE); page.wait_for_timeout(600)
            return ctx, page
        wake = lambda page: page.evaluate('window.__wake')
        live = lambda page: page.evaluate('window.__live')
        starts = lambda page: [l[1] for l in live(page) if l[0] == 'start']
        toggle = lambda page, k: (page.evaluate(f"document.querySelector('[data-k={k}]').click()"), page.wait_for_timeout(120))
        alerts = lambda page: page.evaluate("document.querySelector('#alerts')?.textContent || ''")

        # Inside the 7.5 hours: runs straight away
        ctx, page = open_page(OK, at(16, 18))
        start = starts(page)[-1] if starts(page) else {}
        m = start
        check('countdown starts straight away inside 7.5 hours', m.get('startAt') == 0, str(m.get('startAt')))
        check('countdown runs to the real departure', m.get('departure') == ms(at(16, 20, 55)), str(m.get('departure')))
        check('countdown has the right train and seat', m.get('trainNumber') == '16630' and m.get('coach') == 'S2' and m.get('seat', '').startswith('3') and m.get('departureTime') == '8:55 PM', str(m))
        check('countdown says platform unknown, not a guess', m.get('platform') == 'PF ?', m.get('platform'))
        check('the app says it is running and how to see it', 'Running' in alerts(page) and 'Dynamic Island' in alerts(page), alerts(page))
        check('no Start now button while running', page.locator('[data-act=liveNow]').count() == 0)
        n = len(live(page)); page.evaluate('window.__tg.render()'); page.wait_for_timeout(100)
        check('re-rendering does not restart the countdown', len(live(page)) == n)
        check('the Lock Screen gets its words from the app', m.get('coachLabel') == 'Coach' and m.get('berthLabel') == 'Berth' and m.get('leavesLabel') == 'Leaves' and '16630' in m.get('checkCoach', ''), str(m))
        page.evaluate("window.__tg.state.lang='hi'; window.__tg.render()"); page.wait_for_timeout(100)
        h = live(page)[-1][1]
        check('changing language updates the Lock Screen', len(live(page)) == n + 1 and h.get('coachLabel') not in (None, 'Coach') and '16630' in h.get('checkCoach', ''), str(h))
        page.evaluate("window.__tg.state.lang='en'; window.__tg.render()"); page.wait_for_timeout(100)
        check('no alarm until asked for', [w for w in wake(page) if w[0] == 'schedule'] == [], str(wake(page)))
        check('alarm toggles are offered in the iPhone app', page.evaluate("!!document.querySelector('[data-k=gps]') && !!document.querySelector('[data-k=backup]')"))

        toggle(page, 'backup')
        s = wake(page)[-1]
        check('timed alarm is scheduled', s[0] == 'schedule' and s[1]['backup'] is True and s[1]['gps'] is False, str(s))
        a = s[1]
        arrival = a['expires'] - 2 * 3600e3
        check('alarm is 30 minutes before arrival', arrival - a['backupDate'] == 30 * 60e3, f"{arrival} {a['backupDate']}")
        check('arrival is the next morning', at(17, 5) < datetime.datetime.fromtimestamp(arrival / 1000, IST) < at(17, 10), str(datetime.datetime.fromtimestamp(arrival / 1000, IST)))
        check('nothing fires before departure', a['notBefore'] == ms(at(16, 20, 55)), str(a['notBefore']))
        check('alarm title names the stop and train', '16630' in a['title'], a['title'])
        check('alarm button is in the app language', a.get('stopLabel') == 'Stop', str(a.get('stopLabel')))
        n = len(wake(page)); page.evaluate('window.__tg.render()'); page.wait_for_timeout(100)
        check('re-rendering does not reschedule', len(wake(page)) == n)

        toggle(page, 'gps')
        a = wake(page)[-1][1]
        check('GPS wake-up gets real coordinates near the destination', a['gps'] is True and 8 < a['latitude'] < 9.5 and 76 < a['longitude'] < 77.5, f"{a['latitude']} {a['longitude']}")
        page.evaluate("window.__tg.state.lang='ta'; window.__tg.render()"); page.wait_for_timeout(100)
        a = wake(page)[-1][1]
        check('changing language updates the alarm', a.get('stopLabel') == 'நிறுத்து', str(a.get('stopLabel')))
        page.evaluate("window.__tg.state.lang='en'; window.__tg.render()"); page.wait_for_timeout(100)
        toggle(page, 'gps'); toggle(page, 'backup')
        check('turning both off cancels', wake(page)[-1][0] == 'cancel', str(wake(page)[-1]))
        ctx.close()

        # More than 7.5 hours away: scheduled, which is the situation in the user's screenshot
        ctx, page = open_page(OK, at(16, 10, 55))
        m = starts(page)[-1] if starts(page) else {}
        check('further out it is scheduled, not skipped', m.get('startAt') == ms(at(16, 13, 25)), str(m.get('startAt')))
        check('the scheduled alert names the train', m.get('alertTitle', '').startswith('16630') and '16630' in m.get('alertBody', ''), str(m))
        check('the app says when it will start', 'Starts by itself at 1:25 PM' in alerts(page), alerts(page))
        check('it can be started now', page.locator('[data-act=liveNow]').count() == 1)
        page.evaluate("document.querySelector('[data-act=liveNow]').click()"); page.wait_for_timeout(150)
        check('Start now starts it straight away', starts(page)[-1].get('startAt') == 0, str(starts(page)[-1].get('startAt')))
        check('the app then says it is running', 'Running' in alerts(page) and page.locator('[data-act=liveNow]').count() == 0, alerts(page))
        page.reload(); page.wait_for_timeout(600)
        check('Start now is remembered after reopening', starts(page) and starts(page)[-1].get('startAt') == 0, str(starts(page)[-1:]))
        ctx.close()
        ctx, page = open_page(OK, at(15, 10))
        check('another day shows the date too', 'Mon 16 Nov, 1:25 PM' in alerts(page), alerts(page))
        ctx.close()

        # What the app says when it can't
        ctx, page = open_page(OK, at(16, 10), live="Promise.resolve({status:'tooEarly'})")
        check('older iOS says to open the app later', 'Open TrainGuard after' in alerts(page), alerts(page))
        ctx.close()
        ctx, page = open_page(OK, at(16, 18), live="Promise.resolve({status:'disabled'})")
        check('Live Activities turned off is explained', 'Live Activities are off' in alerts(page), alerts(page))
        ctx.close()
        ctx, page = open_page(OK, at(16, 18), live="Promise.reject(new Error('the widget was removed when this app was installed'))")
        check('a failure shows the reason', "Couldn't start it: the widget was removed" in alerts(page), alerts(page))
        ctx.close()

        # GPS alone would be a single point of failure
        ctx, page = open_page(OK, at(16, 18))
        toggle(page, 'gps')
        a = wake(page)[-1][1]
        check('turning on GPS also turns on the timed alarm', a['gps'] is True and a['backup'] is True and page.evaluate("document.querySelector('[data-k=backup]').getAttribute('aria-checked')") == 'true', str(a))
        toggle(page, 'gps')
        a = wake(page)[-1][1]
        check('turning off GPS keeps the timed alarm', a['gps'] is False and a['backup'] is True, str(a))
        toggle(page, 'backup'); toggle(page, 'gps'); toggle(page, 'gps')
        toggle(page, 'backup')
        check('the timed alarm can still be turned off by hand', wake(page)[-1][0] == 'cancel', str(wake(page)[-1]))
        ctx.close()

        # Permission refused
        toast = lambda page: page.evaluate("document.querySelector('#toastHost').innerText")
        ctx, page = open_page(OK, at(16, 18), "{alarm:false,location:'always'}")
        toggle(page, 'backup'); page.wait_for_timeout(150)
        check('refused alarm permission is reported', 'needs permission' in toast(page), toast(page))
        ctx.close()
        for status in ('denied', 'whenInUse'):
            ctx, page = open_page(OK, at(16, 18), "{alarm:true,location:'%s'}" % status)
            toggle(page, 'gps'); page.wait_for_timeout(150)
            check(f'location {status} is reported', 'set to Always' in toast(page), toast(page))
            ctx.close()
        for status in ('notDetermined', 'always'):
            ctx, page = open_page(OK, at(16, 18), "{alarm:true,location:'%s'}" % status)
            toggle(page, 'gps'); page.wait_for_timeout(150)
            check(f'location {status} is not reported as a problem', 'set to Always' not in toast(page), toast(page))
            ctx.close()
        ctx, page = open_page(OK, at(16, 18))
        check('the toggle says to choose Always', 'choose Always' in alerts(page), alerts(page))
        ctx.close()

        # After departure, waitlisted, cancelled
        ctx, page = open_page(OK, at(16, 21))
        check('no countdown after departure', not starts(page), str(live(page)))
        check('and no countdown row', 'Lock Screen countdown' not in alerts(page), alerts(page))
        ctx.close()
        for name, sms in (('waitlisted', WL), ('cancelled', CAN)):
            ctx, page = open_page(sms, at(16, 18))
            check(f'{name}: no countdown', not starts(page), str(live(page)))
            if page.evaluate("!!document.querySelector('[data-k=backup]')"):
                toggle(page, 'backup')
            check(f'{name}: no alarm', not [w for w in wake(page) if w[0] == 'schedule'], str(wake(page)))
            ctx.close()
        browser.close()
finally:
    server.terminate()
check('no page errors', not errors, '; '.join(errors[:3]))
print(f'{sum(results)}/{len(results)} passed')
sys.exit(0 if all(results) else 1)
