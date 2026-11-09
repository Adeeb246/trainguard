"""The page's native paths, run in a browser against a fake Capacitor. This proves the page's side only, not iOS or Android."""
import json, pathlib, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[2]
PORT = 4179
BASE = f'http://localhost:{PORT}/'
server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO / 'public')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(50):
    try: urllib.request.urlopen(BASE, timeout=1); break
    except Exception: time.sleep(.1)

SMS = 'PNR:1234567890,TRN:16630,DOJ:16-11-30,SL,CAN-KZK,DP:20:55,Boarding at CAN only,\nANU MENON+1,S2 3,S2 6,\nFare:970\n-IRCTC'
SEED = "localStorage.setItem('trainguard_trips_v2', JSON.stringify([{id:'t1',raw:%s}]));" % json.dumps(SMS)

def fake(platform, sign=None):
    plugins = "Signing:{expiry:()=>Promise.resolve(%s)}" % sign if sign else ''
    return "window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'%s',Plugins:{%s}};" % (platform, plugins)

results, errors = [], []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        def open_page(init):
            ctx = browser.new_context(viewport={'width': 393, 'height': 852}, has_touch=True, is_mobile=True, device_scale_factor=2)
            ctx.add_init_script(SEED); ctx.add_init_script(init)
            page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(BASE); page.wait_for_timeout(500)
            return ctx, page
        visible = lambda page: page.evaluate("getComputedStyle(document.querySelector('#tabbar')).visibility") == 'visible'

        # The apps use the same tab bar as the website
        for platform in ('ios', 'android'):
            ctx, page = open_page(fake(platform))
            check(f'{platform}: the web tab bar shows', visible(page))
            page.locator('#tab-journey').tap(); page.wait_for_timeout(150)
            check(f'{platform}: tapping a tab switches to it', page.evaluate("document.querySelector('#view-journey').classList.contains('on')"))
            page.evaluate("window.__tg.ACT.openSettings()"); page.wait_for_timeout(100)
            check(f'{platform}: back closes a sheet', page.evaluate('window.__tg.back()') is True)
            page.wait_for_timeout(350)
            check(f'{platform}: the sheet really closed', page.evaluate('window.__tg.state.sheet') is None)
            check(f'{platform}: back with nothing open reports false', page.evaluate('window.__tg.back()') is False)
            page.evaluate("window.__tg.ACT.bigOpen()"); page.wait_for_timeout(100)
            check(f'{platform}: back closes Show Big', page.evaluate('window.__tg.back()') is True)
            ctx.close()

        ctx, page = open_page(fake('android'))
        page.evaluate("document.documentElement.style.setProperty('--safe-area-inset-top','30px');document.documentElement.style.setProperty('--safe-area-inset-bottom','40px')")
        tb, dock = page.evaluate("[document.querySelector('.topbar').getBoundingClientRect().top, innerHeight-document.querySelector('.dock').getBoundingClientRect().bottom]")
        check('Android safe areas move the chrome', tb == 36 and dock == 32, f'{tb} {dock}')
        ctx.close()

        # The empty strip iOS draws under Home Screen web apps takes the page's background colour
        ctx, page = open_page('')
        colour = lambda: page.evaluate("[getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]")
        check('dark theme: the page background matches the canvas', colour() == ['rgb(17, 17, 17)'] * 2, str(colour()))
        page.evaluate("window.__tg.ACT.setTheme({dataset:{v:'light'}})"); page.wait_for_timeout(150)
        check('light theme: the page background follows', colour() == ['rgb(242, 242, 247)'] * 2, str(colour()))
        ctx.close()

        # Free Apple ID: the app stops opening before the trip
        text = lambda page: page.evaluate("document.querySelector('#view-pass').innerText")
        ctx, page = open_page(fake('ios', sign="{date:Date.now()+7*864e5}"))
        check('warns when the app stops opening before the trip', 'stops opening' in text(page), text(page)[:120])
        page.evaluate("window.__tg.state.lang='ta'; window.__tg.render()"); page.wait_for_timeout(100)
        check('the warning is translated', 'திறக்காது' in text(page) and '{date}' not in text(page))
        ctx.close()
        ctx, page = open_page(fake('ios', sign="{date:+new Date('2040-01-01')}"))
        check('no warning when signing outlasts the trip', 'stops opening' not in text(page))
        ctx.close()
        ctx, page = open_page(fake('ios', sign="{}"))
        check('no warning without a profile', 'stops opening' not in text(page))
        ctx.close()
        ctx, page = open_page('')
        check('no warning on the web', 'stops opening' not in text(page))
        ctx.close()

        # Haptics on both platforms: selectionChanged does nothing natively without selectionStart
        for platform in ('ios', 'android'):
            ctx, page = open_page(fake(platform) + "window.__hap=[];window.Capacitor.Plugins.Haptics={selectionStart:()=>{window.__hap.push('start');return Promise.resolve()},selectionChanged:()=>{window.__hap.push('changed');return Promise.resolve()},impact:m=>{window.__hap.push('impact:'+m.style);return Promise.resolve()},notification:m=>{window.__hap.push('note:'+m.type);return Promise.resolve()}};")
            page.locator('#tab-journey').tap(); page.wait_for_timeout(150)
            hap = page.evaluate('window.__hap')
            check(f'{platform}: selection haptics are started before use', 'changed' in hap and hap.index('start') < hap.index('changed'), str(hap))
            page.locator('[data-act=openSettings]').tap(); page.wait_for_timeout(150)
            hap = page.evaluate('window.__hap')
            check(f'{platform}: a real tap gives a haptic in the style the plugin expects', 'impact:LIGHT' in hap, str(hap))
            page.evaluate('window.__tg.back()'); page.wait_for_timeout(400)
            page.evaluate('window.__hap.length=0'); page.locator('.dock .add').tap(); page.wait_for_timeout(150)
            hap = page.evaluate('window.__hap')
            check(f'{platform}: the add button gives a haptic', 'impact:MEDIUM' in hap, str(hap))
            ctx.close()

        # Android
        ctx, page = open_page(fake('android'))
        check('Android registers no service worker', page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.length)") == 0)
        page.evaluate("window.__tg.ACT.openCalendar()"); page.wait_for_timeout(150)
        html = page.evaluate("document.querySelector('#sheet')?.innerHTML || ''")
        check('Android offers the phone calendar and Google Calendar', 'calPhone' in html and 'google.com/calendar' in html.replace('&amp;', '&'), html[:200])
        check('Android back closes the calendar sheet', page.evaluate('window.__tg.back()') is True)
        page.wait_for_timeout(350)
        check('Android shows no iPhone-only alarm toggles', 'switch' not in page.evaluate("document.querySelector('#alerts')?.innerHTML || ''"))
        check('Android shows no iPhone-only countdown row', 'Lock Screen' not in page.evaluate("document.querySelector('#alerts')?.innerText || ''"))
        ctx.close()

        # Browser: phone calendar still offered, and no countdown row
        ctx, page = open_page('')
        check('the web shows no countdown row', 'Lock Screen' not in page.evaluate("document.querySelector('#alerts')?.innerText || ''"))
        page.evaluate("window.__tg.ACT.openCalendar()"); page.wait_for_timeout(150)
        check('the web keeps the phone calendar button', 'calPhone' in page.evaluate("document.querySelector('#sheet')?.innerHTML || ''"))
        ctx.close()
        browser.close()
finally:
    server.terminate()
check('no page errors', not errors, '; '.join(errors[:3]))
print(f'{sum(results)}/{len(results)} passed')
sys.exit(0 if all(results) else 1)
