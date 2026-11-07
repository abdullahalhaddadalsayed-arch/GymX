#!/usr/bin/env python3
"""Install GymX v0.5 realistic front/back male body selector and premium library UI."""
import argparse
import base64
import shutil
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
args=p.parse_args()
root=Path(args.android_app)
assets=root/"app/src/main/assets"
index=assets/"index.html"
source=Path(__file__).resolve().parent
assert index.is_file(), "GymX index.html missing"
assert (assets/"exercises.js").is_file(), "Existing GymX exercise data missing"
assert (assets/"gymx-library-images.js").is_file(), "Existing GymX exercise photo patch missing"
for side in ("front","back"):
    data=base64.b64decode((source/("realistic-"+side+".b64")).read_text().strip(),validate=True)
    assert len(data)>2000 and data[:4]==b"RIFF" and data[8:12]==b"WEBP", "Invalid GymX human image: "+side
    (assets/("gx-human-"+side+".webp")).write_bytes(data)
for name in ("gymx-anatomy.js","gymx-premium-design.js","gymx-premium-design.css"):
    shutil.copyfile(source/name,assets/name)
html=index.read_text(encoding="utf-8")
if "gymx-anatomy.js" not in html:
    assert '<script src="app.js"></script>' in html, "GymX original app script changed"
    html=html.replace('<script src="app.js"></script>',
                      '<script src="app.js"></script>'
                      '<script src="gymx-anatomy.js"></script>'
                      '<script src="gymx-premium-design.js"></script>',1)
if "gymx-premium-design.css" not in html:
    assert '<link rel="stylesheet" href="style.css">' in html
    html=html.replace('<link rel="stylesheet" href="style.css">',
                      '<link rel="stylesheet" href="style.css">'
                      '<link rel="stylesheet" href="gymx-premium-design.css">',1)
index.write_text(html,encoding="utf-8")
assert all(x in html for x in ("gymx-anatomy.js","gymx-updates.js","gymx-library-images.js"))
print("GymX v0.5 realistic male front/back muscle selector and premium exercise UI installed; existing workout history untouched.")
