"""CI only: fails if simulator or emulator screenshots are blank, or if switching tabs didn't change the screen."""
import pathlib
import sys
from PIL import Image, ImageChops

# The three tabs. A fourth screenshot of the Dynamic Island is only there for people to look at.
shots = sorted(pathlib.Path(sys.argv[1]).glob('*.png'))[:3]
if len(shots) < 3:
    print(f'::error::Expected 3 screenshots, found {len(shots)}')
    sys.exit(1)
images = [Image.open(s).convert('RGB').resize((200, 433)) for s in shots]
colours = [len(i.getcolors(100000) or []) for i in images]


def share_changed(a, b):
    # A status bar clock or a countdown changes a few pixels. A different tab changes far more.
    diff = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 16 else 0)
    return diff.histogram()[255] / (diff.width * diff.height)


changed = [share_changed(a, b) for a, b in zip(images, images[1:])]
print(f'::notice::{len(shots)} screens, distinct colours {colours}, share changed between tabs {[round(c, 3) for c in changed]}')
if any(c < 50 for c in colours):
    print('::error::At least one screen is blank')
    sys.exit(1)
if any(c < 0.03 for c in changed):
    print('::error::Switching tabs did not change the screen')
    sys.exit(1)
