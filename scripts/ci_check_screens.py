"""CI only: fails if simulator or emulator screenshots are blank, or if the tab switches never changed the screen.

Screenshots are taken about every 10 seconds, so this doesn't depend on exactly when each tab switch lands.
"""
import base64
import io
import pathlib
import sys
from PIL import Image, ImageChops

shots = sorted(pathlib.Path(sys.argv[1]).glob('[0-9]*.png'))
if len(shots) < 3:
    print(f'::error::Expected a series of screenshots, found {len(shots)}')
    sys.exit(1)
images = [Image.open(s).convert('RGB').resize((200, 433)) for s in shots]
colours = [len(i.getcolors(100000) or []) for i in images]


def share_changed(a, b):
    # A status bar clock or a countdown changes a few pixels. A different tab changes far more.
    diff = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 16 else 0)
    return diff.histogram()[255] / (diff.width * diff.height)


def show_strip():
    # Artifacts need a GitHub login, annotations don't, so a failure posts a small strip of every screenshot
    # as base64 JPEG chunks. Join the "Screens" notices in order and decode them to see what the check saw.
    strip = Image.new('L', (48 * len(images), 104))
    for i, im in enumerate(images):
        strip.paste(im.convert('L').resize((48, 104)), (i * 48, 0))
    buf = io.BytesIO()
    strip.save(buf, 'JPEG', quality=60)
    data = base64.b64encode(buf.getvalue()).decode()
    parts = [data[i:i + 3500] for i in range(0, len(data), 3500)][:8]
    for n, part in enumerate(parts, 1):
        print(f'::notice title=Screens {n}/{len(parts)}::{part}')


changed = [round(share_changed(a, b), 3) for a, b in zip(images, images[1:])]
switches = sum(c >= 0.03 for c in changed)
print(f'::notice::{len(shots)} screenshots, {switches} screen changes, last one has {colours[-1]} colours, share changed {changed}')
if colours[-1] < 50:
    show_strip()
    print('::error::The last screen is blank')
    sys.exit(1)
if switches < 2:
    show_strip()
    print('::error::The screen did not change when the tabs were switched')
    sys.exit(1)
