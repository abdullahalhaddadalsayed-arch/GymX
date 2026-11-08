#!/usr/bin/env python3
"""Install two-level muscle filtering, Jeff-only catalogue, and still-photo fallbacks.

Adds no GIF/animation assets and does not modify original GymX exercise IDs,
sessions, workout history, or camera ML implementation.
"""
import argparse
import base64
import hashlib
import shutil
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
args=p.parse_args()
root=Path(args.android_app)
assets=root/"app/src/main/assets"
index=assets/"index.html"
assert all((assets/name).is_file() for name in ("app.js","exercises.js","gymx-image-catalog.js","gx-human-front.webp","gx-human-back.webp"))
assert index.is_file() and "gymx-image-quality.js" in index.read_text(encoding="utf-8")
src=Path(__file__).resolve().parent
raw=base64.b64decode((src/"gymx-user-male-sprite.webp.b64").read_text(encoding="ascii").strip(),validate=True)
assert raw[:4]==b"RIFF" and raw[8:12]==b"WEBP"
assert len(raw)==3972 and hashlib.sha256(raw).hexdigest()=="9f19073b013d93325517f71d6f64e2bc015513de49f82a45eab04655d817e4e1"
(assets/"gymx-user-male-sprite.webp").write_bytes(raw)
scripts=("gymx-muscle-jeff-library.js","gymx-static-human-fallback.js")
stylesheet="gymx-static-muscle-jeff.css"
for name in (*scripts,stylesheet):
    shutil.copyfile(src/name,assets/name)
html=index.read_text(encoding="utf-8")
for name in scripts:
    if name not in html:
        assert "</body>" in html
        html=html.replace("</body>",f'<script src="{name}"></script>\n</body>',1)
if stylesheet not in html:
    assert "</head>" in html
    html=html.replace("</head>",f'<link rel="stylesheet" href="{stylesheet}">\n</head>',1)
index.write_text(html,encoding="utf-8")
assert html.index("gymx-image-quality.js")<html.index("gymx-muscle-jeff-library.js")<html.index("gymx-static-human-fallback.js")
for forbidden in (".gif",".apng",".webm"):
    assert not any(p.is_file() and p.name.lower().endswith(forbidden) for p in assets.rglob("*")),f"Moving media found: {forbidden}"
print("OK: Static illustrated human fallback and main/sub muscle filters installed.")
print("OK: Nine-video Jeff Nippard library source tags installed; no media copied.")
print("OK: No GIFs, APNGs, WebM or exercise animations added.")
