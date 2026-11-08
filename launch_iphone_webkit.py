import sys
import time
from playwright.sync_api import sync_playwright

def run_iphone_simulator():
    with sync_playwright() as p:
        # Exact iPhone 16 Pro display specifications
        iphone_device = {
            'user_agent': (
                'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) '
                'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
            ),
            'viewport': {'width': 393, 'height': 852},
            'device_scale_factor': 3,
            'is_mobile': True,
            'has_touch': True,
            'default_browser_type': 'webkit'
        }

        print("[iPhone Simulator] Launching Apple WebKit engine...")
        browser = p.webkit.launch(
            headless=False,
            args=[
                '--window-size=425,930',
            ]
        )
        
        context = browser.new_context(
            **iphone_device,
            locale='en-US',
            timezone_id='Asia/Kolkata',
            color_scheme='dark'
        )
        
        page = context.new_page()
        page.goto("http://localhost:3300", wait_until="networkidle")
        
        # Ensure the 3D Apple Wallet pass is populated immediately on launch
        try:
            page.evaluate("""() => {
                const hasTicket = localStorage.getItem('trainguard_saved_ticket_v1');
                if (!hasTicket) {
                    const sampleBtn = document.getElementById('btn-quick-sample') || document.getElementById('btn-empty-demo');
                    if (sampleBtn) sampleBtn.click();
                }
            }""")
        except Exception:
            pass
            
        print("[iPhone Simulator] TrainGuard loaded successfully on Apple WebKit!")
        print("[iPhone Simulator] Testing window active. Close the window to exit.")

        # Keep alive until user closes the window
        while True:
            try:
                if not browser.is_connected() or len(context.pages) == 0:
                    break
                time.sleep(0.5)
            except Exception:
                break

if __name__ == "__main__":
    run_iphone_simulator()
