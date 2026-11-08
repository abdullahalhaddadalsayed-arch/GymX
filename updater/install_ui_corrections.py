#!/usr/bin/env python3
"""Install the actual GymX v0.5 UI fixes over existing Android assets.
No changes to exercise IDs, history, photo storage, ML or the YouTube links.
"""
import argparse
import base64
import hashlib
import shutil
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
args=p.parse_args()
src=Path(__file__).resolve().parent
assets=Path(args.android_app)/"app/src/main/assets"
index=assets/"index.html"
assert index.is_file() and (assets/"gymx-static-human-fallback.js").exists()
assert (assets/"gymx-muscle-jeff-library.js").exists()
assert "gymx-static-human-fallback.js" in index.read_text(encoding="utf-8")
name="gymx-user-front-base.webp"
text=(src/(name+".b64")).read_text(encoding="ascii").strip()
expected_sha="7140c435c5d05b6ccba95a3bca76ae3a63357e3f7fc629ac7f26ab49e43037ee"

def good(source):
    try:
        data=base64.b64decode(source,validate=True)
    except Exception:
        return None
    if len(data)==4208 and hashlib.sha256(data).hexdigest()==expected_sha:
        return data
    return None

binary=good(text)
if binary is None and len(text)%4==3:
    # Diagnostic recovery for a single missing base64 character during transfer.
    # Do not accept another image; original SHA-256 must match.
    alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    for pos in range(len(text)+1):
        stem=text[:pos]
        tail=text[pos:]
        for letter in alphabet:
            candidate=stem+letter+tail
            binary=good(candidate)
            if binary is not None:
                print("RECOVERED_IMAGE_BASE64_INSERTION="+str(pos)+":"+letter)
                break
        if binary is not None:break
assert binary is not None, "Approved user human image SHA mismatch / corrupted base64"
assert binary[:4]==b"RIFF" and binary[8:12]==b"WEBP"
(assets/name).write_bytes(binary)

for asset in ("gymx-ui-corrections.js","gymx-ui-corrections.css"):
    shutil.copyfile(src/asset,assets/asset)
html=index.read_text(encoding="utf-8")
if "gymx-ui-corrections.css" not in html:
    assert "</head>" in html
    html=html.replace("</head>",'<link rel="stylesheet" href="gymx-ui-corrections.css">\n</head>',1)
if "gymx-ui-corrections.js" not in html:
    assert "</body>" in html
    html=html.replace("</body>",'<script src="gymx-ui-corrections.js"></script>\n</body>',1)
assert html.index("gymx-static-human-fallback.js")<html.index("gymx-ui-corrections.js")
index.write_text(html,encoding="utf-8")
for f in assets.rglob("*"):
    if f.is_file():
        assert f.suffix.lower() not in (".gif",".apng",".webm"),"Moving media not allowed: "+str(f)
print("GYMX_UI_STATIC_HUMAN_INSTALLED=1")
print("GYMX_UI_APPROVED_IMAGE_SHA256="+hashlib.sha256(binary).hexdigest())
print("GYMX_UI_NO_GIF_OR_ANIMATIONS=1")
