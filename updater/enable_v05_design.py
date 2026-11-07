#!/usr/bin/env python3
"""Install GymX v0.5 anatomical selector and premium exercise UI into extracted v0.4 APK."""
from pathlib import Path
import argparse
import shutil

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
p.add_argument("--anatomy-package",default="/tmp/gymx-anatomy-pkg/package")
args=p.parse_args()
root=Path(args.android_app)
assets=root/"app/src/main/assets"
index=assets/"index.html"
source=Path(__file__).resolve().parent
pkg=Path(args.anatomy_package)
library=pkg/"dist/umd/body-muscles.umd.min.js"
assert index.is_file(), "GymX index.html missing"
assert library.is_file(), "Pinned offline anatomy UMD library missing"
assert (assets/"exercises.js").is_file(), "GymX exercise data missing"
assert (assets/"gymx-library-images.js").is_file(), "GymX existing photo patch missing"
shutil.copyfile(library,assets/"body-muscles.umd.min.js")
for name in ("gymx-anatomy.js","gymx-premium-design.js","gymx-premium-design.css"):
    shutil.copyfile(source/name,assets/name)
license_dir=assets/"third-party"
license_dir.mkdir(exist_ok=True)
for name in ("LICENSE","NOTICE"):
    path=pkg/name
    if path.is_file():
        shutil.copyfile(path,license_dir/("body-muscles-"+name))
html=index.read_text(encoding="utf-8")
if "gymx-anatomy.js" not in html:
    assert '<script src="app.js"></script>' in html, "GymX original app entry changed"
    html=html.replace('<script src="app.js"></script>',
                      '<script src="app.js"></script>'
                      '<script src="body-muscles.umd.min.js"></script>'
                      '<script src="gymx-anatomy.js"></script>'
                      '<script src="gymx-premium-design.js"></script>',1)
if "gymx-premium-design.css" not in html:
    assert '<link rel="stylesheet" href="style.css">' in html
    html=html.replace('<link rel="stylesheet" href="style.css">',
                      '<link rel="stylesheet" href="style.css">'
                      '<link rel="stylesheet" href="gymx-premium-design.css">',1)
index.write_text(html,encoding="utf-8")
assert "gymx-anatomy.js" in html
assert "gymx-updates.js" in html
assert "gymx-library-images.js" in html
print("GymX UI 0.5 installed: anatomical muscle selector, photo library, redesigned exercise details; previous data preserved.")
