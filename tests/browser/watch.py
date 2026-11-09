"""Opens a window where you can watch the test robot use the built app, with each check ticking off only after it has passed.
It also saves a video. Needs a build first: npm run test:watch"""
import datetime, json, pathlib, shutil, subprocess, sys, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(tempfile.gettempdir()) / 'trainguard-watch'
OUT.mkdir(parents=True, exist_ok=True)
PORT = 4195
BASE = f'http://localhost:{PORT}/'
server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO / 'public')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(50):
    try: urllib.request.urlopen(BASE, timeout=1); break
    except Exception: time.sleep(.1)

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
SMS = 'PNR:1234567890,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970,C Fee:11.8+PG\n-IRCTC'
WL = 'PNR:1234567892,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON,WL 12,\nFare:485\n-IRCTC'
OTP = 'Your OTP is 12345 for login. Do not share.'
W, H = 744, 724  # Fits a 1536x864 screen with the browser's own bars
STAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#0b0c0b;color:#f5f5f5;font:15px/1.35 -apple-system,'Segoe UI',Roboto,sans-serif;overflow:hidden}
body{display:flex}.phone{width:334px;height:724px;overflow:hidden;flex:none;background:#111}iframe{width:393px;height:852px;border:0;background:#111;transform:scale(.85);transform-origin:0 0}
.panel{flex:1;min-width:0;padding:22px 22px 0;border-left:1px solid #2a2a2a;display:flex;flex-direction:column;gap:10px}
h1{margin:0;font-size:13px;letter-spacing:.09em;text-transform:uppercase;color:#9a9a9a;font-weight:600}
#count{font:800 44px/1 Consolas,monospace;color:#4ade80}#count small{font:600 14px/1 -apple-system,'Segoe UI',sans-serif;color:#9a9a9a;margin-left:6px}
ol{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:1px}
li{display:grid;grid-template-columns:20px 1fr;gap:8px;padding:4px 8px;border-radius:7px;font-size:13px;color:#b8b8b8}
li.now{background:#1e3b2a;color:#fff}li i{font-style:normal;font-weight:800;color:#4ade80}li.bad{background:#4a1f1f;color:#fff}li.bad i{color:#ff6b6b}
li span{min-width:0}
</style></head><body><div class="phone"><iframe id="app" src="/"></iframe></div><div class="panel"><h1>Test robot</h1><div id="count">0<small>checks passed</small></div><ol id="list"></ol></div>
<script>
let n=0,cur=null;const list=document.getElementById('list'),count=document.getElementById('count');
window.step=t=>{cur=document.createElement('li');cur.className='now';cur.innerHTML='<i></i><span></span>';cur.lastChild.textContent=t;list.appendChild(cur)};
window.pass=()=>{cur.className='';cur.firstChild.textContent='\\u2713';n++;count.firstChild.textContent=n};
window.fail=m=>{cur.className='bad';cur.firstChild.textContent='\\u2715';cur.lastChild.textContent+=': '+m};
</script></body></html>"""
# Shows each tap, which a screen recording otherwise can't.
RIPPLE = """if(window.top!==window)addEventListener('pointerdown',e=>{const d=document.createElement('div');d.style.cssText='position:fixed;z-index:99999;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(74,222,128,.45);border:2px solid #4ade80;left:'+e.clientX+'px;top:'+e.clientY+'px;transition:transform .45s,opacity .45s';document.documentElement.appendChild(d);requestAnimationFrame(()=>{d.style.transform='scale(1.7)';d.style.opacity=0});setTimeout(()=>d.remove(),500)},true);"""

failures = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=90, args=['--window-position=770,0'])
        ctx = browser.new_context(viewport={'width': W, 'height': H}, has_touch=True, timezone_id='Asia/Kolkata', service_workers='allow', record_video_dir=str(OUT / 'raw'), record_video_size={'width': W, 'height': H})
        ctx.clock.set_fixed_time(datetime.datetime(2026, 11, 16, 14, 10, tzinfo=IST))
        ctx.add_init_script(RIPPLE)
        ctx.route('**/stage.html', lambda route: route.fulfill(status=200, content_type='text/html', body=STAGE))
        page = ctx.new_page()
        page.set_default_timeout(7000)
        page.bring_to_front()
        page.goto(BASE + 'stage.html')
        app = page.frame_locator('#app')
        frame = lambda: page.frame_locator('#app').locator('#app')
        text = lambda sel='#app': app.locator(sel).first.inner_text()
        def tap(sel, wait=350):
            app.locator(sel).first.tap(); page.wait_for_timeout(wait)
        def shot(name):
            page.locator('#app').screenshot(path=str(OUT / f'{name}.png'))
        def check(title, fn, hold=650):
            page.evaluate('t => window.step(t)', title)
            page.wait_for_timeout(250)
            try:
                fn()
                page.evaluate('window.pass()')
            except Exception as e:
                failures.append(f'{title}: {str(e)[:200]}')
                page.evaluate('m => window.fail(m)', str(e)[:60])
            page.wait_for_timeout(hold)
        def must(cond, msg):
            if not cond: raise AssertionError(msg)

        def first_open():
            app.locator('.welcome').wait_for(timeout=8000)
            must('Never board the wrong train' in text(), 'no welcome')
            shot('welcome')
        check('Opens with a clear first screen', first_open, 900)

        def rejects_otp():
            tap('[data-act="add"]', 700)
            app.locator('#tkt').fill(OTP); tap('[data-act="readTicket"]', 500)
            must(app.locator('[data-act="readYes"]').count() == 0, 'accepted an OTP')
        check('Refuses an OTP text that is not a ticket', rejects_otp, 900)

        def reads_sms():
            app.locator('#tkt').fill(SMS); tap('[data-act="readTicket"]', 600)
            t = text('#sheet')
            must('16630' in t and 'Malabar' in t, 'did not read the train')
            shot('readback')
        check('Reads a real-format IRCTC SMS back', reads_sms, 1200)

        def confirms():
            tap('[data-act="readYes"]', 800)
            must('16630' in text('.view.on'), 'pass has no train number')
            shot('pass')
        check('Shows the train number first on the pass', confirms, 900)

        check('Warns: not 16603 Maveli, which leaves 55 min earlier', lambda: must('Not 16603' in text('.view.on'), 'no warning'), 1100)

        def flips():
            tap('.face.front [data-act="flip"]', 1000)
            must('1234567890'.replace(' ', '') in text('.face.back').replace(' ', ''), 'no PNR on the back')
            tap('.face.back [data-act="flip"]', 900)
        check('Flips to show the PNR, then flips back', flips, 400)

        def journey():
            tap('#tab-journey', 700)
            must('Leave for the station' in text('.view.on'), 'no timeline')
            app.locator('.view.on').first.evaluate('e => e.scrollTo({top: 220, behavior: "smooth"})'); page.wait_for_timeout(800)
            shot('journey')
        check('Journey tab shows the real timetable times', journey, 700)

        def safety():
            tap('#tab-safety', 700)
            t = text('.view.on')
            must('16603' in t and 'Not your train' in t, 'no list')
            shot('safety')
        check('Safety tab lists every train you could mistake', safety, 900)

        def waitlist():
            tap('.dock [data-act="add"]', 700)
            app.locator('#tkt').fill(WL); tap('[data-act="readTicket"]', 500); tap('[data-act="readYes"]', 800)
            tap('#tab-pass', 600)
            must('No seat yet' in text('.view.on') or 'seat' in text('.view.on').lower(), 'claimed a seat')
            must('S2' not in text('.view.on').split('Next')[0], 'showed a coach for a waitlisted ticket')
            shot('waitlist')
        check('A waitlisted ticket shows no seat, never a guess', waitlist, 1000)

        def back_to_first():
            tap('[data-act="openTrips"]', 800); tap('#sheet [data-act="pickTrip"]', 800)
            must('16630' in text('.view.on'), 'no trip')
        check('Keeps several trips and switches between them', back_to_first, 400)

        def calendar():
            tap('.view.on [data-act="openCalendar"]', 700)
            t = text('#sheet')
            must('Your journey' in t and '6:55 AM' in t, 'no wake-up time')
            tap('#sheet .xbtn', 450)
        check('Offers calendar alerts, with the 6:55 AM wake-up', calendar, 300)

        def language():
            tap('[data-act="openSettings"]', 700)
            tap('#sheet [data-act="setLang"][data-v="ml"]', 500)
            must(text('#tab-pass') != 'Pass', 'still in English')
            tap('#sheet .xbtn', 500)
            shot('malayalam')
            tap('[data-act="openSettings"]', 600)
            tap('#sheet [data-act="setLang"][data-v="en"]', 400)
        check('Switches the whole app to Malayalam and back', language, 300)

        def light():
            tap('#sheet [data-act="setTheme"][data-v="light"]', 500)
            must(app.locator('#app[data-theme="light"]').count() == 1, 'theme did not change')
            tap('#sheet .xbtn', 500)
            shot('light')
            page.wait_for_timeout(500)
            tap('[data-act="openSettings"]', 600)
            tap('#sheet [data-act="setTheme"][data-v="dark"]', 400)
            tap('#sheet .xbtn', 450)
        check('Light theme works too', light, 300)

        def big():
            tap('[data-act="bigOpen"]', 800)
            must('16630' in text('.big'), 'no train number')
            tap('[data-act="bigClose"]', 500)
        check('Show Big fills the screen for bright platforms', big, 300)

        def offline():
            page.frames[1].evaluate('navigator.serviceWorker.ready.then(()=>1)')
            page.wait_for_timeout(700)
            ctx.set_offline(True)
            page.frames[1].evaluate('location.reload()')
            page.wait_for_timeout(2200)
            t = text('.view.on')
            must('16630' in t, 'lost the pass offline')
            must('Not 16603' in t, 'lost the timetable offline')
            ctx.set_offline(False)
        check('Still works with no internet, timetable included', offline, 2400)

        page.wait_for_timeout(6000)  # Leaves the finished list on screen
        print('passed', page.evaluate("document.querySelector('#count').firstChild.textContent"))
        video = page.video
        ctx.close()
        pathlib.Path(video.path()).replace(OUT / 'robot.webm')
        browser.close()
finally:
    server.terminate()
shutil.rmtree(OUT / 'raw', ignore_errors=True)
print('failures:', failures or 'none')
print('video', OUT / 'robot.webm')
sys.exit(1 if failures else 0)
