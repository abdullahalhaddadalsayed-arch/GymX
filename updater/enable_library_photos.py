#!/usr/bin/env python3
"""Enable local exercise thumbnails and two-frame movement photos in GymX v0.4."""
from pathlib import Path
import argparse, shutil

p=argparse.ArgumentParser()
p.add_argument('--android-app', default='android-app')
args=p.parse_args()
root=Path(args.android_app)
assets=root/'app/src/main/assets'
index=assets/'index.html'
assert index.is_file(), 'GymX Android assets missing'
assert (assets/'exercises.js').is_file(), 'GymX exercise catalog missing'
assert (assets/'app.js').is_file(), 'GymX application script missing'
shutil.copy2(Path(__file__).with_name('gymx-library-images.js'), assets/'gymx-library-images.js')
html=index.read_text(encoding='utf-8')
if 'gymx-library-images.js' not in html:
    assert '<script src="app.js"></script>' in html, 'GymX app script tag changed'
    html=html.replace('<script src="app.js"></script>', '<script src="app.js"></script><script src="gymx-library-images.js"></script>', 1)
    index.write_text(html, encoding='utf-8')
assert 'gymx-library-images.js' in index.read_text(encoding='utf-8')
print('OK: Photo thumbnails and two-position exercise guides enabled in current GymX.')
