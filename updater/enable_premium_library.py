#!/usr/bin/env python3
"""Install original GymX human-body illustrations and premium library UI into the existing Android project."""
from pathlib import Path
import base64, argparse, shutil

p=argparse.ArgumentParser()
p.add_argument('--android-app',default='android-app')
args=p.parse_args()
root=Path(args.android_app)
assets=root/'app/src/main/assets'
index=assets/'index.html'
assert index.is_file() and (assets/'app.js').is_file() and (assets/'exercises.js').is_file()
src=Path(__file__).resolve().parent
for side in ('front','back'):
    encoded=(src/f'anatomy-{side}.webp.b64').read_text(encoding='ascii').strip()
    data=base64.b64decode(encoded,validate=True)
    assert data[:4]==b'RIFF' and data[8:12]==b'WEBP',f'Invalid {side} WEBP'
    assert int.from_bytes(data[4:8],'little')+8==len(data), f'Corrupt {side} WEBP length'
    (assets/f'gymx-body-{side}.webp').write_bytes(data)
for name in ('gymx-premium-library.js','gymx-premium-library.css'):
    shutil.copy2(src/name,assets/name)

html=index.read_text(encoding='utf-8')
if 'gymx-premium-library.css' not in html:
    assert '</head>' in html
    html=html.replace('</head>','<link rel="stylesheet" href="gymx-premium-library.css"></head>',1)
if 'gymx-premium-library.js' not in html:
    assert '</body>' in html
    html=html.replace('</body>','<script src="gymx-premium-library.js"></script></body>',1)
index.write_text(html,encoding='utf-8')

assert (assets/'gymx-body-front.webp').stat().st_size>1000
assert (assets/'gymx-body-back.webp').stat().st_size>1000
print('GymX premium Library and Exercise Details installed. Data and local history untouched.')
