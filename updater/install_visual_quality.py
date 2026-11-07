#!/usr/bin/env python3
"""GymX: bundle sharp male anatomy artwork and validated movement-guide fallback.

This runs AFTER the existing GymX exercise import, original app patch,
premium redesign and the 36 separately reviewed photo-guide checks.
It changes display assets only; it never changes workout IDs or user data.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument("--android-app",default="android-app")
parser.add_argument("--image-dir",required=True)
args=parser.parse_args()

root=Path(args.android_app)
assets=root/"app/src/main/assets"
index=assets/"index.html"
source=Path(__file__).resolve().parent
inputs=Path(args.image_dir)

assert index.is_file(), "Existing GymX HTML is missing"
assert (assets/"exercises.js").is_file(), "Existing GymX catalogue missing"
assert (assets/"gymx-reviewed-guides.js").is_file(), "Reviewed guide data must be installed first"
assert (assets/"gymx-reviewed-guide-ui.js").is_file(), "Existing review UI is missing"

audit=[]
for side in ("front","back"):
    original=inputs/f"male-{side}.webp"
    binary=original.read_bytes()
    assert len(binary)>50000, f"{side} body artwork looks truncated"
    assert binary[:4]==b"RIFF" and binary[8:12]==b"WEBP",f"{side} image is not WebP"
    assert int.from_bytes(binary[4:8],"little")+8==len(binary), f"{side} RIFF size mismatch"
    for name in (f"gx-human-{side}.webp",f"gymx-body-{side}.webp"):
        (assets/name).write_bytes(binary)
    audit.append({"view":side,"bytes":len(binary),"sha256":hashlib.sha256(binary).hexdigest()})

license=inputs/"LICENSE"
assert license.is_file() and "MIT License" in license.read_text(encoding="utf-8")
legal=assets/"third-party"
legal.mkdir(exist_ok=True)
shutil.copy2(license,legal/"musclemap-MIT-LICENSE.txt")
shutil.copy2(source/"gymx-visual-quality.js",assets/"gymx-visual-quality.js")
shutil.copy2(source/"gymx-visual-quality.css",assets/"gymx-visual-quality.css")

html=index.read_text(encoding="utf-8")
if "gymx-visual-quality.css" not in html:
    html=html.replace("</head>",'<link rel="stylesheet" href="gymx-visual-quality.css"></head>',1)
if "gymx-visual-quality.js" not in html:
    html=html.replace("</body>",'<script src="gymx-visual-quality.js"></script></body>',1)
assert "gymx-reviewed-guides.js" in html and "gymx-visual-quality.js" in html
assert html.index("gymx-reviewed-guides.js") < html.index("gymx-visual-quality.js"), "Visual override must run last"
index.write_text(html,encoding="utf-8")

(root/"gymx-visual-quality-QA.json").write_text(json.dumps({
    "source":"Jsplice/MuscleMap",
    "source_license":"MIT",
    "images":audit,
    "fallback":"No abstract person; approved START/END guides only; pending text otherwise",
    "workout_data_changes":False
},indent=2)+"\n",encoding="utf-8")
print("GymX visual QA passed:",json.dumps(audit),"and older fallback removed")
