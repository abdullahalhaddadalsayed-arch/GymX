#!/usr/bin/env python3
"""Install external Jeff Nippard official-channel video links on each GymX exercise page.

Existing workout history, images, offline functionality, exercise IDs, and local storage
are unchanged. The video opens externally and needs internet.
"""
import argparse, shutil, subprocess, sys
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("--android-app", default="android-app")
args=p.parse_args()
assets=Path(args.android_app)/"app/src/main/assets"
index=assets/"index.html"
src=Path(__file__).resolve().parent
subprocess.run([sys.executable, str(src/"install_jeff_videos.py"), "--android-app", args.android_app], check=True)
assert "openJeffVideo(url: String)" in (Path(args.android_app)/"app/src/main/java/com/gymx/app/MainActivity.kt").read_text(encoding="utf-8")
assert index.is_file() and (assets/"exercises.js").is_file()
assert "gymx-visual-quality.js" in index.read_text(encoding="utf-8"), "Core visual assets must be installed before YouTube links"
for name in ("gymx-jeff-nippard-videos.js","gymx-jeff-nippard-videos.css"):
    shutil.copy2(src/name,assets/name)
html=index.read_text(encoding="utf-8")
if 'gymx-jeff-nippard-videos.css' not in html:
    assert "</head>" in html
    html=html.replace("</head>",'<link rel="stylesheet" href="gymx-jeff-nippard-videos.css"></head>',1)
if 'gymx-jeff-nippard-videos.js' not in html:
    assert "</body>" in html
    html=html.replace("</body>",'<script src="gymx-jeff-nippard-videos.js"></script></body>',1)
assert html.count("gymx-jeff-nippard-videos.js")==1
assert "gymx-reviewed-guides.js" in html
index.write_text(html,encoding="utf-8")
print("GymX Jeff Nippard links installed; offline media and workout history unchanged.")
