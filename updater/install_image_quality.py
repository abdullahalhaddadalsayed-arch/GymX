#!/usr/bin/env python3
"""Install GymX's 886-exercise static media QA / licensed RepDB image display."""
from pathlib import Path
import argparse
import shutil
import json

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
args=p.parse_args()
base=Path(args.android_app)
assets=base/"app/src/main/assets"
src=Path(__file__).resolve().parent
index=assets/"index.html"

assert index.is_file()
assert (assets/"gymx-image-catalog.js").is_file(), "Run image audit before installing UI"
metadata=(assets/"gymx-image-catalog.js").read_text(encoding="utf-8")
catalog=json.loads(metadata[metadata.index("{"):metadata.rfind("}")+1])
assert catalog["summary"]["total_exercises"]>=800, "GymX catalogue unexpectedly shrunk"
assert catalog["summary"]["individually_reviewed_photo_pairs"]==36
assert len(catalog["exercises"])==catalog["summary"]["repdb_matched_exercises"]
for name in ("gymx-image-quality.js","gymx-image-quality.css"):
    shutil.copy2(src/name,assets/name)

html=index.read_text(encoding="utf-8")
if "gymx-image-quality.css" not in html:
    assert "</head>" in html
    html=html.replace("</head>",'<link rel="stylesheet" href="gymx-image-quality.css"></head>',1)
if "gymx-image-quality.js" not in html:
    assert "</body>" in html
    html=html.replace("</body>",'<script src="gymx-image-catalog.js"></script><script src="gymx-image-quality.js"></script></body>',1)
assert "gymx-reviewed-guides.js" in html
assert html.index("gymx-reviewed-guides.js")<html.index("gymx-image-catalog.js")
assert "gymx-jeff-nippard-videos.js" in html
index.write_text(html,encoding="utf-8")
print("GymX image QA/UI installed:",catalog["summary"])
