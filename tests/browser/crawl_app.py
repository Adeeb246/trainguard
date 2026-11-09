"""Clicks every control in the built app with a real mouse and flags anything that does nothing. Also measures motion."""
import atexit, datetime, json, pathlib, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[2]; PORT = 4174; BASE = f'http://localhost:{PORT}/'
server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO / 'public')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
atexit.register(server.kill)
for _ in range(50):
    try: urllib.request.urlopen(BASE, timeout=1); break
    except Exception: time.sleep(.1)
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
NOW = datetime.datetime(2026, 11, 16, 14, 10, tzinfo=IST)
SMS = 'PNR:1234567890,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970\n-IRCTC'
RET = 'PNR:1234567899,TRN:16629,DOJ:21-11-26,SL,KZK-CAN,DP:18:56,Boarding at KZK only,\nANU MENON,S4 33,\nFare:485\n-IRCTC'
RAC = 'PNR:1234567891,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON,RAC 7,'
WL = 'PNR:1234567892,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON,WL 12,'
NOTIME = 'PNR:1234567893,TRN:16630,DOJ:16-11-26,SL,CAN-KZK,Boarding at CAN only,\nANU MENON,S2 3,'
SCENES = {
    'First run': ([], {}), 'Pass': ([SMS, RET], {}), 'Pass flipped': ([SMS, RET], {'flipped': True}), 'Journey': ([SMS, RET], {'tab': 'journey'}), 'Safety': ([SMS, RET], {'tab': 'safety'}),
    'Waitlist': ([WL], {}), 'RAC': ([RAC], {}), 'Missing time': ([NOTIME], {}), 'Missing time journey': ([NOTIME], {'tab': 'journey'}),
    'Trips sheet': ([SMS, RET], {'sheet': 'trips'}), 'Settings sheet': ([SMS], {'sheet': 'settings'}), 'Share sheet': ([SMS], {'sheet': 'share'}), 'Platform sheet': ([SMS], {'sheet': 'platform'}),
    'Calendar sheet': ([SMS], {'sheet': 'calendar'}), 'Calendar no time': ([NOTIME], {'sheet': 'calendar'}), 'Time sheet': ([NOTIME], {'sheet': 'time'}), 'Install sheet': ([SMS], {'sheet': 'install'}),
    'Add sheet': ([SMS], {'sheet': 'add', 'add': {'text': '', 'expected': '', 'error': '', 'step': 'paste', 'refused': False}}),
    'Pay sheet': ([SMS], {'sheet': 'pay', 'pay': {'no': '16630', 'meant': '', 'station': '', 'date': '2026-11-16', 'result': None, 'error': '', 'refused': False}}),
    'Show Big': ([SMS], {'big': True}),
}
PRINT = """() => { const s = window.__tg.state, v = document.querySelector('.view.on');
  return JSON.stringify({ ...s, add: !!s.add.trip + String(s.add.error) + s.add.step, pay: String(s.pay.error) + !!s.pay.result }) + '|' + (localStorage.getItem('trainguard_trips_v2') || '') + '|' + (document.querySelector('#sheet .shead h2')?.textContent || '') + '|' + (document.querySelector('#sheet .sbody')?.textContent.length || 0) + '|' + (document.querySelector('#toastHost')?.textContent || '') + '|' + !!document.querySelector('.big') + '|' + (v ? Math.round(v.scrollTop) : 0) + '|' + (document.querySelector('.is-flipped') ? 1 : 0) + '|' + [...document.querySelectorAll('[aria-checked]')].map(e => e.getAttribute('aria-checked')).join() + '|' + (document.querySelector('details.also')?.open) + '|' + (document.querySelector('#app').dataset.theme); }"""
LIST = """() => { const out = [];
  document.querySelectorAll('#app button, #app a, #app summary').forEach((e, i) => {
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    if (!r.width || !r.height || c.visibility === 'hidden' || c.display === 'none' || e.closest('.view:not(.on)')) return;
    if (document.querySelector('#sheet') && !e.closest('#sheet')) return;
    if (document.querySelector('.big') && !e.closest('.big')) return;
    const fl = !!document.querySelector('.is-flipped'); if ((e.closest('.face.back') && !fl) || (e.closest('.face.front') && fl)) return;
    out.push({ i, sel: e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-selected') === 'true', label: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\\s+/g, ' ').slice(0, 40), act: e.dataset.act || '', href: e.getAttribute('href') || '' });
  }); return out; }"""
AIM = """(i) => { const e = document.querySelectorAll('#app button, #app a, #app summary')[i]; if (!e) return null;
  e.scrollIntoView({ block: 'center', behavior: 'instant' });
  const hitOk = () => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, h = document.elementFromPoint(x, y); return h && (e === h || e.contains(h)) ? { x, y } : null; };
  let at = hitOk(); if (at) return at;
  const sc = e.closest('.view,.sbody'); if (sc) { sc.scrollTop += e.getBoundingClientRect().top > innerHeight / 2 ? 150 : -150; at = hitOk(); }
  return at || { covered: true }; }"""
dead, errors, popups, total = [], [], [], 0
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    c = b.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce', service_workers='block', timezone_id='Asia/Kolkata', permissions=['clipboard-read', 'clipboard-write'])
    c.clock.set_fixed_time(NOW)
    c.route('**/*', lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
    pg = c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)[:200]))
    c.on('page', lambda w: (popups.append(1), w.close()))
    pg.goto(BASE, wait_until='load')
    def enter(scene):
        trips, st = SCENES[scene]
        pg.evaluate("(t)=>{localStorage.clear();localStorage.setItem('trainguard_sound_enabled','false');localStorage.setItem('trainguard_haptic_enabled','false');localStorage.setItem('trainguard_trips_v2',JSON.stringify(t.map((raw,i)=>({id:'t'+i,raw}))))}", trips)
        pg.reload(wait_until='load'); pg.wait_for_function('window.__tg'); pg.wait_for_timeout(130)
        if st: pg.evaluate("(k)=>{Object.assign(window.__tg.state,k);window.__tg.render()}", st); pg.wait_for_timeout(50)
    for scene in SCENES:
        enter(scene); n = len(pg.evaluate(LIST)); seen = 0
        for k in range(n):
            enter(scene); now = pg.evaluate(LIST)
            if k >= len(now): continue
            t = now[k]
            at = pg.evaluate(AIM, t['i'])
            if not at or at.get('covered'): dead.append(f"{scene}: '{t['label']}' is covered"); continue
            before = pg.evaluate(PRINT); pops = len(popups)
            pg.mouse.move(at['x'], at['y']); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(300)
            after = pg.evaluate(PRINT); total += 1
            if t['href'].startswith('tel:') or t['sel']: continue
            if t['href'].startswith('http'):
                for _ in range(40):
                    if len(popups) > pops: break
                    pg.wait_for_timeout(50)
            if after == before and len(popups) == pops:
                dead.append(f"{scene}: '{t['label']}' (act={t['act'] or t['href'][:30]}) did nothing")
    c.close()

    # Motion on the real page, with the CPU slowed 4x
    c = b.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block', timezone_id='Asia/Kolkata'); c.clock.set_fixed_time(NOW)
    pg = c.new_page(); pg.goto(BASE, wait_until='load')
    pg.evaluate("(t)=>{localStorage.setItem('trainguard_sound_enabled','false');localStorage.setItem('trainguard_haptic_enabled','false');localStorage.setItem('trainguard_trips_v2',JSON.stringify(t.map((raw,i)=>({id:'t'+i,raw}))))}", [SMS, RET])
    pg.reload(wait_until='load'); pg.wait_for_timeout(600)
    c.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate', {'rate': 4})
    START = "()=>{window.__f=[];window.__lt=0;window.__on=true;try{new PerformanceObserver(l=>{window.__lt+=l.getEntries().length}).observe({entryTypes:['longtask']})}catch(e){}let last=performance.now();const tick=t=>{window.__f.push(t-last);last=t;if(window.__on)requestAnimationFrame(tick)};requestAnimationFrame(tick)}"
    STOP = "()=>{window.__on=false;const f=window.__f.slice(1).sort((a,b)=>a-b),n=f.length;return{frames:n,p95:+f[Math.floor(n*.95)].toFixed(1),worst:+f[n-1].toFixed(1),janky:f.filter(x=>x>34).length,longTasks:window.__lt}}"
    def center(sel):
        bb = pg.locator(sel).first.bounding_box(); return bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
    def run(name, fn):
        pg.evaluate(START); fn(); r = pg.evaluate(STOP)
        print(f"  {name:<22} frames {r['frames']:>4} | p95 {r['p95']:>6} ms | worst {r['worst']:>6} ms | janky {r['janky']:>3} | long tasks {r['longTasks']}")
    print('motion, CPU 4x slower:')
    run('tab switch', lambda: [(pg.mouse.click(*center(f'#tab-{t}')), pg.wait_for_timeout(520)) for t in ('journey', 'safety', 'pass', 'safety', 'journey', 'pass')])
    run('sheet open and close', lambda: [(pg.mouse.click(*center('[data-act="openTrips"]')), pg.wait_for_timeout(560), pg.mouse.click(*center('#sheet .xbtn')), pg.wait_for_timeout(360)) for _ in range(3)])
    run('pass flip', lambda: [(pg.evaluate("document.querySelector('[data-act=flip]').click()"), pg.wait_for_timeout(820)) for _ in range(4)])
    def tilt():
        x, y = center('#passTilt')
        for i in range(70): pg.mouse.move(x + 120 * ((i % 14) / 7 - 1), y + 90 * ((i % 10) / 5 - 1)); pg.wait_for_timeout(16)
        pg.mouse.move(5, 5); pg.wait_for_timeout(200)
    run('pass tilt', tilt)
    def scroll():
        pg.mouse.move(*center('.view.on'))
        for i in range(40): pg.mouse.wheel(0, 60 if i < 20 else -60); pg.wait_for_timeout(16)
    run('scroll under glass', scroll)
    b.close()
print(f'Clicked {total} controls across {len(SCENES)} screens. Dead or covered: {len(dead)}. Links opened: {len(popups)}. Page errors: {errors[:5] or "none"}')
for d in dead: print('  -', d)
sys.exit(1 if dead or errors else 0)
