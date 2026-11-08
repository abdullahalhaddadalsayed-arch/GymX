#!/usr/bin/env python3
"""GymX conservative external metadata comparison.

Assesses current 54 no-specific-photo exercises against pinned, MIT metadata of
hasaneyldrm/exercises-dataset. It never imports source thumbnails/GIFs,
never replaces GymX IDs or source images, and never claims pose verification.
"""
import argparse
import csv
import difflib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

MISSING = """ex004|Incline Barbell Bench Press|Barbell|Chest
ex010|Decline Chest Press|Machine|Chest
ex012|Chest Dip|Bodyweight|Chest
ex024|Machine High Row|Machine|Back
ex074|Woodchopper|Cable|Core
ex076|Treadmill Run|Treadmill|Cardio
ex077|Treadmill Walk|Treadmill|Cardio
ex082|Outdoor Walk|Bodyweight|Cardio
ex083|Outdoor Run|Bodyweight|Cardio
at004|Bounds|Bodyweight|Cardio
at006|Box Toe Touch|Platform|Legs
at007|Broad Jump|Bodyweight|Legs
at010|Burpee Broad Jump|Bodyweight|Cardio
at011|Butt Kickers|Bodyweight|Legs
at013|Chest Press|Dumbbell|Chest
at014|Close to Wide Grip Burnout|Dumbbell|Arms
at015|Compass Jump|Bodyweight|Cardio
at016|Crab Crawl|Bodyweight|Cardio
at017|Curtsey Lunges|Dumbbell|Legs
at018|Deficit Squat|Platform|Legs
at021|Flutter Kick|Bodyweight|Core
at022|Frogger|Bodyweight|Cardio
at024|Glute Bridge March|Resistance Band|Legs
at027|Heart Pump|Kettlebell|Arms
at031|Jumping Jack Push Press|Medicine Ball|Cardio
at034|Knee Drive|Bodyweight|Cardio
at036|Leg Pull Apart|Resistance Band|Legs
at037|Leg Raise|Bodyweight|Core
at038|Literally Just Jumping|Bodyweight|Cardio
at040|Military Plank|Bodyweight|Core
at041|Monkey Jump|Bodyweight|Cardio
at044|Plank Jack|Resistance Band|Core
at047|Pushup Walk|Resistance Band|Chest
at051|Seal Jacks|Bodyweight|Cardio
at056|Side Plank Dips|Bodyweight|Core
at058|Single Arm Clean and Press|Kettlebell|Shoulders
at060|Single Leg Squat|Bodyweight|Legs
at061|Situp and Throw|Medicine Ball|Core
at062|Skaters|Bodyweight|Legs
at063|Skipping|Bodyweight|Cardio
at068|Squat Jumps 180|Bodyweight|Cardio
at069|Squat to Lateral Leg Lift|Resistance Band|Legs
at070|Standing Glute Kickbaks|Resistance Band|Legs
at071|Standing Leg Lift|Cable|Legs
at072|Standing Oblique Crunch|Dumbbell|Core
at074|Step Up Lunges|Platform|Legs
at076|Straightup Situp|Dumbbell|Core
at079|Touchdown|Bodyweight|Cardio
at083|Tuck Jump|Bodyweight|Cardio
at084|Twisted Mountain Climbers|Bodyweight|Core
at086|Weighted Jumping Jacks|Dumbbell|Cardio
at087|Weighted Punches|Dumbbell|Cardio
fedb_bc8f2e4fb6cb6a86|Kettlebell Halo with Overhead Extension|Kettlebell|Shoulders
fedb_b18107532527862f|Kettlebell Overhead Triceps Extension|Kettlebell|Arms"""

SOURCE_REPO="https://github.com/hasaneyldrm/exercises-dataset"
SOURCE_COMMIT="7455efae41b330c265e7cd4b78dfa848e7ce5ebd"

def normalized(x):
    s=unicodedata.normalize("NFKD",str(x)).encode("ascii","ignore").decode().lower()
    s=s.replace("kettlebell","kb").replace("dumbbell","db")
    s=s.replace("situp","sit up").replace("pushup","push up").replace("curtsey","curtsy")
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return " ".join(s.split())

def equipment_ok(gym, external):
    g=normalized(gym);e=normalized(external)
    if g=="bodyweight":return e in {"body weight","bodyweight","none","body"}
    if g=="platform":return e in {"box","step","plyo box","body weight","bodyweight"} # Some platforms are counted as bodyweight.
    if g=="machine":return any(q in e for q in ("machine","leverage","assisted"))
    if g=="treadmill":return "treadmill" in e
    if g=="resistance band":return "band" in e
    if g=="medicine ball":return "medicine ball" in e or "ball" in e
    if g=="kb":return "kb" in e
    if g=="db":return "db" in e
    if g=="barbell":return "barbell" in e
    if g=="cable":return "cable" in e
    return False

def review(rows):
    output=[]
    for line in MISSING.splitlines():
        gym_id,gym_name,gym_equipment,gym_muscle=line.split("|")
        gname=normalized(gym_name)
        scored=[]
        for entry in rows:
            name=entry.get("name") or ""
            if not isinstance(name,str):continue
            score=difflib.SequenceMatcher(None,gname,normalized(name)).ratio()
            # Equipment match can outrank generic similar names, but never hide a mismatch.
            eq=equipment_ok(gym_equipment,str(entry.get("equipment") or ""))
            rank=score+(0.09 if eq else -0.15)
            scored.append((rank,score,eq,entry))
        scored.sort(key=lambda x:(-x[0],-x[1],str(x[3].get("id",""))))
        hits=scored[:3]
        best=hits[0]
        _,score,ok,entry=best
        exact=(score>0.999)
        if exact and ok:
            state="Exact name + equipment — metadata candidate"
        elif score>=0.86 and ok:
            state="Close name + equipment — manual mapping needed"
        elif score>=0.86:
            state="Close name but equipment differs — reject automatic link"
        else:
            state="No reliable name/equipment match"
        output.append({
            "gymx_id":gym_id,
            "gymx_name":gym_name,
            "gymx_equipment":gym_equipment,
            "gymx_muscle":gym_muscle,
            "candidate_id":str(entry.get("id","")),
            "candidate_name":str(entry.get("name","")),
            "candidate_equipment":str(entry.get("equipment","")),
            "candidate_target":str(entry.get("target","")),
            "name_similarity":round(score,4),
            "equipment_compatible":ok,
            "match_status":state,
            "other_candidate_names":" | ".join(str(x[3].get("name","")) for x in hits[1:]),
            "metadata_license":"MIT (text only); preserve notices before any import",
            "media_license":"NOT approved for GymX; no thumbnails or GIFs imported",
            "review_required":True
        })
    assert len(output)==54 and len(set(r["gymx_id"] for r in output))==54
    return output

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--source",required=True)
    p.add_argument("--out",default="external-source-review")
    args=p.parse_args()
    entries=json.loads(Path(args.source).read_text(encoding="utf-8"))
    assert isinstance(entries,list) and len(entries)==1324, "Unexpected source catalogue size"
    result=review(entries)
    output=Path(args.out);output.mkdir(parents=True,exist_ok=True)
    with (output/"gymx-54-metadata-match.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=list(result[0]));w.writeheader();w.writerows(result)
    (output/"gymx-54-metadata-match.json").write_text(
        json.dumps({"source":SOURCE_REPO,"source_commit":SOURCE_COMMIT,
          "license_scope":"MIT metadata only; image rights not transferred","rows":result},
          ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    counts=Counter(r["match_status"] for r in result)
    print("SOURCE_DATASET_RECORDS="+str(len(entries)))
    print("GYMX_GAPS_REVIEWED="+str(len(result)))
    for k,n in counts.items():print("MATCH_"+k+"="+str(n))
    for r in result:
        if r["match_status"]!="No reliable name/equipment match":
            print("CANDIDATE|{gymx_id}|{gymx_name}|{candidate_id}|{candidate_name}|{candidate_equipment}|{match_status}".format(**r))
    print("MEDIA_IMPORTS=0")
    print("ACTUAL_MOVEMENT_IMAGES_FILLED=0")

if __name__=="__main__":main()
