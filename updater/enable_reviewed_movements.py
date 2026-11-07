#!/usr/bin/env python3
"""Validate 36 human-reviewed Free Exercise DB image pairs and install their GymX guides.

Important: this validates the EXACT photographs bundled in the APK, not just metadata.
No workout data, IDs, or history are altered.
"""
from pathlib import Path
import argparse
import json
import hashlib
import shutil

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
p.add_argument("--free-db",required=True)
args=p.parse_args()
root=Path(args.android_app)
source=Path(__file__).resolve().parent
assets=root/"app/src/main/assets"
index=assets/"index.html"
assert index.is_file()
docs=json.loads((source/"reviewed-movement-guides.json").read_text(encoding="utf-8"))
guides=docs["guides"]
assert len(guides)==36, "Unexpected reviewed guide count"
data=(assets/"exercises.js").read_text(encoding="utf-8")
start=data.find("[")
end=data.rfind("]")
assert start>=0 and end>start
exercises=json.loads(data[start:end+1])
source_by_id={e.get("sourceId"):e for e in exercises if e.get("sourceId")}
known_source=json.loads((Path(args.free_db)/"dist/exercises.json").read_text(encoding="utf-8"))
known={e["id"]:e for e in known_source}
seen=set()
results=[]
for guide in guides:
    sid=guide["sourceId"]
    assert sid not in seen, f"Duplicate reviewed guide: {sid}"
    seen.add(sid)
    assert sid in known, f"Source exercise missing: {sid}"
    assert sid in source_by_id, f"GymX exercise missing: {sid}"
    meta=known[sid]
    actual=source_by_id[sid]
    assert len(meta.get("instructions") or [])>=2, f"Insufficient movement instructions: {sid}"
    original_paths=meta.get("images") or []
    local_paths=actual.get("imagesLocal") or []
    assert len(original_paths)>=2 and len(local_paths)>=2, f"Missing pair: {sid}"
    assert sorted([guide["startIndex"], guide["endIndex"]])==[0,1], f"Invalid frame indices: {sid}"
    digests=[]
    for i in (0,1):
        expected="freedb-images/"+original_paths[i]
        assert local_paths[i].replace("%20"," ")==expected, f"Unexpected photo mapping: {sid} image {i}: {local_paths[i]}"
        path=assets/expected
        assert path.is_file(), f"Bundled image missing: {path}"
        b=path.read_bytes()
        assert len(b)>=3000 and b[:2]==b"\xff\xd8" and b[-2:]==b"\xff\xd9", f"Invalid JPEG: {sid} {i}"
        digests.append(hashlib.sha256(b).hexdigest())
    assert digests[0]!=digests[1], f"Duplicate photographs for {sid}"
    assert all(guide.get(k) for k in ("startCue","endCue","motion"))
    results.append({"sourceId":sid,"name":actual["name"],"gymxId":actual["id"],"sourcePhotoHashes":digests})
assert len(results)==36
metadata={
 "schema":1,
 "verifiedCount":len(results),
 "reviewDate":docs["reviewedOn"],
 "reviewSource":docs["source"],
 "reviewType":docs["reviewType"],
 "notes":docs["notes"],
 "guides":guides
}
(assets/"gymx-reviewed-guides.js").write_text(
    "window.GYMX_REVIEWED_GUIDES = "+json.dumps(metadata,ensure_ascii=False,separators=(",",":"))+";\n",
    encoding="utf-8"
)
for name in ("gymx-reviewed-guide-ui.js","gymx-reviewed-guide-ui.css"):
    shutil.copy2(source/name,assets/name)
html=index.read_text(encoding="utf-8")
if "gymx-reviewed-guide-ui.css" not in html:
    assert "</head>" in html
    html=html.replace("</head>", '<link rel="stylesheet" href="gymx-reviewed-guide-ui.css"></head>',1)
if "gymx-reviewed-guide-ui.js" not in html:
    assert "</body>" in html
    html=html.replace("</body>", '<script src="gymx-reviewed-guides.js"></script><script src="gymx-reviewed-guide-ui.js"></script></body>',1)
index.write_text(html,encoding="utf-8")
(root/"reviewed-movements-QA.json").write_text(json.dumps({
 "verifiedCount":len(results),
 "source":"yuhonas/free-exercise-db",
 "reviewDate":docs["reviewedOn"],
 "photoHashChecks":results
},indent=2)+"\n",encoding="utf-8")
print("VERIFIED:",len(results),"complete image pairs. START/END ordering, file integrity, and exercise links checked.")
