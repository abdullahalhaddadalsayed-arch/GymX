#!/usr/bin/env python3
"""Fill remaining GymX THUMBNAIL gaps with clearly labeled, licensed equipment/muscle icons.

These icons are NOT exercise movement photos and never count as START/END guides.
They avoid unrelated/incorrect movement depictions, while keeping library cards
visually complete across all 886 exercises.
"""
from pathlib import Path
import argparse
import csv
import json
import shutil

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
p.add_argument("--repdb",required=True)
args=p.parse_args()
base=Path(args.android_app)
assets=base/"app/src/main/assets"
repo=Path(args.repdb)
datafile=base/"gymx-image-audit.json"
catalogfile=assets/"gymx-image-catalog.js"
assert datafile.is_file() and catalogfile.is_file()

audit=json.loads(datafile.read_text(encoding="utf-8"))
text=catalogfile.read_text(encoding="utf-8")
catalog=json.loads(text[text.index("{"):text.rfind("}")+1])
rows=audit["rows"]
assert len(rows)==catalog["summary"]["total_exercises"]
assert catalog["summary"]["individually_reviewed_photo_pairs"]==36
matches=catalog["summary"]["repdb_matched_exercises"]

eq={
    "barbell":"barbell",
    "dumbbell":"dumbbell",
    "cable":"cable",
    "kettlebell":"kettlebell",
    "resistance band":"resistance-band",
    "band":"resistance-band",
    "medicine ball":"medicine-ball",
    "platform":"plyo-box",
    "treadmill":"treadmill",
    "bike":"stationary-bike",
    "bicycle":"bicycle",
    "elliptical":"elliptical",
    "rowing machine":"rower",
    "jump rope":"jump-rope",
}
muscle={
    "chest":"pectoralis-major",
    "back":"latissimus-dorsi",
    "shoulders":"lateral-deltoid",
    "legs":"quadriceps",
    "arms":"biceps-brachii",
    "core":"rectus-abdominis",
    "cardio":"quadriceps",
}
subdir=assets/"repdb-thumbnails"
subdir.mkdir(exist_ok=True)
fallbacks=0
equipment=0
muscle_used=0
for row in rows:
    if row["thumbnail_available"]:
        row["thumbnail_type"]="exercise_specific"
        continue
    id_=str(row["gymx_id"])
    raw_eq=str(row.get("equipment") or "").lower().strip()
    if raw_eq in eq:
        stem=eq[raw_eq]
        src=repo/"images/equipment"/(stem+".webp")
        category="equipment_reference"
        equipment+=1
    else:
        stem=muscle.get(str(row.get("muscle_group") or "").lower().strip(),"pectoralis-major")
        src=repo/"images/muscles"/(stem+".webp")
        category="muscle_reference"
        muscle_used+=1
    assert src.is_file(),f"Missing licensed RepDB reference asset: {src}"
    binary=src.read_bytes()
    assert len(binary)>1000 and binary[:4]==b"RIFF" and binary[8:12]==b"WEBP"
    dest_name=category+"-"+stem+".webp"
    dest=subdir/dest_name
    if not dest.is_file():shutil.copy2(src,dest)
    catalog["exercises"][id_]={
        "kind":category,
        "thumbnail":"repdb-thumbnails/"+dest_name,
        "reviewStatus":"category_reference_not_exercise_illustration",
        "name":row["exercise_name"],
    }
    row["thumbnail_type"]=category
    row["thumbnail_available"]=True
    # The named movement still needs exercise-specific imagery.
    row["needs_exercise_image"]=True
    row["media_provenance"]="RepDB licensed "+("equipment" if category=="equipment_reference" else "muscle")+" illustration (not exercise pose)"
    fallbacks+=1

for row in rows:
    row.setdefault("needs_exercise_image",row.get("guide_quality")=="no_available_image")

totals=catalog["summary"]
totals["repdb_matched_exercises"]=matches
totals["after_integration_exercises_with_thumbnail"]=sum(x["thumbnail_available"] for x in rows)
totals["after_integration_exercises_without_any_image"]=sum(not x["thumbnail_available"] for x in rows)
totals["after_integration_without_exercise_specific_image"]=sum(x["needs_exercise_image"] for x in rows)
totals["non_exercise_specific_fallback_thumbnails"]=fallbacks
totals["equipment_reference_thumbnails"]=equipment
totals["muscle_reference_thumbnails"]=muscle_used
totals["exercise_specific_thumbnails"]=len(rows)-fallbacks
assert totals["after_integration_exercises_with_thumbnail"]==len(rows)
assert totals["after_integration_exercises_without_any_image"]==0
assert totals["individually_reviewed_photo_pairs"]==36
assert len(catalog["exercises"])>=matches
audit["summary"]=totals

catalogfile.write_text("window.GYMX_IMAGE_CATALOG = "+json.dumps(catalog,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
datafile.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
with (base/"gymx-image-audit.csv").open("w",encoding="utf-8",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]))
    w.writeheader();w.writerows(rows)
(base/"gymx-image-summary.md").write_text(
    "# GymX static exercise media audit\n\n"+
    "\n".join(f"- **{k.replace('_',' ')}:** {v}" for k,v in totals.items() if k!="review_levels")+
    "\n\n**Quality disclosure:** Only exercise-specific photos and exact-match RepDB art "+
    "are movement references. "+str(fallbacks)+" equipment/muscle thumbnails are "+
    "clearly labeled generic references, *not* START/END exercise guides. "+
    "The original 36 human-reviewed photo guides remain. New RepDB two-position "+
    "images are publisher-labeled and not individually visually verified. "+
    "No GIFs or animations. The Kaggle dataset was not imported because licensing "+
    "could not be confirmed.\n",
    encoding="utf-8"
)
print("GYMX_STATIC_THUMBNAIL_COVERAGE="+str(len(rows)))
print("GYMX_EXERCISE_SPECIFIC_THUMBNAILS="+str(len(rows)-fallbacks))
print("GYMX_REPDB_CATEGORY_REFERENCES="+str(fallbacks))
