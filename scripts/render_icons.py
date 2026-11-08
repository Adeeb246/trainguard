"""Renders icons/icon.svg into every icon and splash the web, iOS and Android apps need. Run by hand after changing the icon.

    python scripts/render_icons.py
"""
import io
import pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG = (ROOT / "icons" / "icon.svg").read_text(encoding="utf-8")
CANVAS = "#111111"


def render(page, size):
    page.set_viewport_size({"width": size, "height": size})
    page.set_content(f'<!doctype html><style>*{{margin:0}}svg{{display:block;width:{size}px;height:{size}px}}</style>{SVG}')
    return Image.open(io.BytesIO(page.screenshot())).convert("RGB")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    master = render(page, 1024)
    browser.close()

for path, size in (
    ("icons/icon-192.png", 192),
    ("icons/icon-512.png", 512),
    ("icons/apple-touch-icon.png", 180),
    ("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024),
):
    master.resize((size, size), Image.LANCZOS).save(ROOT / path, optimize=True)

# Launch screen: the icon on the app's own background, so nothing flashes white
glyph = master.resize((640, 640), Image.LANCZOS)
splash = Image.new("RGB", (2732, 2732), CANVAS)
splash.paste(glyph, (1046, 1046))
for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
    splash.save(ROOT / "ios/App/App/Assets.xcassets/Splash.imageset" / name, optimize=True)

# Android launcher icons and splash, once the Android project exists
res = ROOT / "android/app/src/main/res"
if res.exists():
    sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    fg = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
    for density, size in sizes.items():
        folder = res / f"mipmap-{density}"
        icon = master.resize((size, size), Image.LANCZOS)
        icon.save(folder / "ic_launcher.png", optimize=True)
        icon.save(folder / "ic_launcher_round.png", optimize=True)
        master.resize((fg[density], fg[density]), Image.LANCZOS).save(folder / "ic_launcher_foreground.png", optimize=True)
    for png in res.glob("drawable*/splash.png"):
        w, h = Image.open(png).size
        side = min(w, h) // 3
        canvas = Image.new("RGB", (w, h), CANVAS)
        canvas.paste(master.resize((side, side), Image.LANCZOS), ((w - side) // 2, (h - side) // 2))
        canvas.save(png, optimize=True)

print("Icons rendered")
