#!/usr/bin/env python3
"""Audited, rights-conscious static exercise image enrichment for GymX.

- Audits every imported GymX exercise + its existing bundled JPGs (do NOT invent missing images).
- Imports only uniquely matched RepDB free-tier 512x512 static WebP images.
- Preserves all GymX exercise IDs and user history.
- Source labels START/PEAK are reported as source-labeled, NOT human-reviewed.
- Existing 36 individually reviewed Free Exercise DB movement-photo guides remain separate.
- Never imports premium samples, GIFs, videos, or unattributed media.
- Emits per-exercise audit CSV/JSON and strict source provenance.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import re
import shutil
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

def normalized_name(s: str) -> str:
    s=unicodedata.normalize("NFKD",str(s or "")).encode("ascii","ignore").decode().lower()
    s=re.sub(r"(?<![a-z0-9])db(?![a-z0-9])", "dumbbell",s)
    s=re.sub(r"(?<![a-z0-9])ez(?![a-z0-9])", "ez",s)
    s=s.replace("&"," and ")
    s=re.sub(r"[^a-z0-9]+"," ",s).strip()
    return " ".join(s.split())

# Explicitly narrow aliases; match is still rejected if equipment conflicts.
ALIASES={
    "barbell bench press medium grip":"bench press",
    "barbell full squat":"barbell squat",
    "dumbbell bench press":"db bench press",
    "dumbbell shoulder press":"seated dumbbell shoulder press",
    "side lateral raise":"dumbbell lateral raise",
    "leg extensions":"leg extension",
    "lying leg curls":"lying leg curl",
    "seated cable rows":"seated cable row",
    "triceps pushdown rope attachment":"rope triceps pushdown",
    "standing calf raises":"standing calf raise",
    "pushups":"push ups",
    "pullups":"pull ups",
    "hammer curls":"hammer curl",
    "triceps pushdown":"triceps pushdown",
    "barbell curl":"barbell curl"
}

def family(s):
    text=" ".join(s) if isinstance(s,list) else str(s or "")
    text=text.lower()
    if "dumbbell" in text or re.search(r"\bdb\b",text): return "dumbbell"
    if "barbell" in text or re.search(r"\bbb\b",text): return "barbell"
    if "kettlebell" in text: return "kettlebell"
    if "cable" in text: return "cable"
    if "smith" in text: return "smith machine"
    if "band" in text: return "bands"
    # machine and bodyweight are broad enough that mismatch shouldn't auto-reject.
    return None

def load_exercises(js: Path):
    text=js.read_text(encoding="utf-8")
    l=text.find("[")
    r=text.rfind("]")
    assert 0<=l<r, "Malformed GymX exercises.js"
    rows=json.loads(text[l:r+1])
    assert isinstance(rows,list) and len(rows)>100, "Unexpected GymX catalogue shape"
    return rows

def inspect_media(path:Path, kind:str):
    if not path.is_file(): return (False,0,"missing")
    data=path.read_bytes()
    if kind=="jpg":
        valid=len(data)>3000 and data[:2]==b"\xff\xd8" and data[-2:]==b"\xff\xd9"
    elif kind=="webp":
        valid=len(data)>6000 and data[:4]==b"RIFF" and data[8:12]==b"WEBP" and int.from_bytes(data[4:8],"little")+8==len(data)
    else: valid=False
    return (valid,len(data),hashlib.sha256(data).hexdigest() if valid else "bad_format")

def decode_source_path(src: str, assets:Path):
    from urllib.parse import unquote
    value=unquote(str(src or ""))
    if not value.startswith("freedb-images/") or ".." in Path(value).parts:
        return None
    candidate=assets/value
    if not candidate.resolve().is_relative_to(assets.resolve()):
        return None
    return candidate

def compatibility(gym,rep):
    a=family(gym.get("equipment"))
    b=family(rep.get("equipment"))
    if a and b and a!=b: return False
    # Exact exercise title is stronger than broad muscle categories; don't reject
    # only because one taxonomy calls the same exercise "shoulders" vs "delts".
    return True

def resolve_art(rep, art_root:Path):
    mapping=(rep.get("images") or {}).get("flat") or {}
    if not isinstance(mapping,dict): return None
    result={}
    for k in ("start","peak","main"):
        value=mapping.get(k)
        if not value: continue
        value=str(value).replace("\\","/")
        if ".." in Path(value).parts: return None
        if value.startswith("images/flat/"): value=value[len("images/flat/"):]
        if value.startswith("flat/"): value=value[len("flat/"):]
        if "/" in value: return None
        path=art_root/value
        valid,size,sha=inspect_media(path,"webp")
        if not valid: return None
        result[k]=(path,size,sha)
    if "main" in result: return {"main":result["main"]}
    if "start" in result and "peak" in result and result["start"][2]!=result["peak"][2]:
        return {"start":result["start"],"peak":result["peak"]}
    return None

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--android-app",default="android-app")
    ap.add_argument("--repdb",required=True)
    args=ap.parse_args()
    base=Path(args.android_app)
    assets=base/"app/src/main/assets"
    repo=Path(args.repdb)
    assert (assets/"exercises.js").is_file()
    assert (assets/"gymx-reviewed-guides.js").is_file()
    assert (repo/"LICENSE-DATA.md").is_file()
    license_text=(repo/"LICENSE-DATA.md").read_text(encoding="utf-8")
    assert "attribution" in license_text.lower() and "in-app use" in license_text.lower(), "RepDB licensing requirements changed"
    rep_data=json.loads((repo/"exercises.json").read_text(encoding="utf-8"))
    rep_rows=rep_data.get("exercises",[]) if isinstance(rep_data,dict) else rep_data
    assert 500<=len(rep_rows)<=1000, f"Unexpected RepDB record count: {len(rep_rows)}"
    art_root=repo/"images/flat"
    assert art_root.is_dir()
    rep_by_name=defaultdict(list)
    for ex in rep_rows:
        if ex.get("id") and ex.get("name_en"):
            rep_by_name[normalized_name(ex["name_en"])].append(ex)
    original=load_exercises(assets/"exercises.js")
    review_js=(assets/"gymx-reviewed-guides.js").read_text(encoding="utf-8")
    review=json.loads(review_js[review_js.index("{"):review_js.rfind("}")+1])
    reviewed={x["sourceId"] for x in review["guides"]}
    assert len(reviewed)==36, "36 independently reviewed guides must remain intact"

    output_dir=assets/"repdb-images"
    output_dir.mkdir(exist_ok=True)
    install={}
    rows=[]
    copied={}
    for ex in original:
        source=str(ex.get("sourceId") or "")
        gym_id=str(ex.get("id") or "")
        title=str(ex.get("name") or "")
        raw_paths=list(ex.get("imagesLocal") or [])
        photos=[decode_source_path(p,assets) for p in raw_paths]
        photo_checks=[inspect_media(p,"jpg") if p else (False,0,"invalid_path") for p in photos]
        valid_local=sum(1 for check in photo_checks if check[0])
        broken_local=sum(1 for check in photo_checks if not check[0])
        photo_pair=valid_local>=2 and len({x[2] for x in photo_checks if x[0]})>=2
        is_reviewed=source in reviewed and photo_pair
        normal=normalized_name(title)
        candidates=rep_by_name.get(normal,[])
        matching_rule="exact_title"
        # Safe one-to-one synonym mapping only, no fuzzy/semantic guesses.
        if not candidates and normal in ALIASES:
            candidates=rep_by_name.get(normalized_name(ALIASES[normal]),[])
            matching_rule="curated_alias"
        rep=None
        artwork=None
        if len(candidates)==1 and compatibility(ex,candidates[0]):
            rep=candidates[0]
            artwork=resolve_art(rep,art_root)
        if artwork:
            media={}
            for label,(source_file,size,sha) in artwork.items():
                filename=source_file.name
                dest=output_dir/filename
                if filename in copied:
                    assert copied[filename]==sha, f"Conflicting RepDB image name: {filename}"
                else:
                    shutil.copy2(source_file,dest)
                    copied[filename]=sha
                media[label]="repdb-images/"+filename
            install[gym_id]={
                "name":title,
                "sourceId":source,
                "repdbId":str(rep["id"]),
                "match":matching_rule,
                "reviewStatus":"source_labeled_not_individually_reviewed",
                "images":media
            }
        if is_reviewed:
            grade="individually_reviewed_photos"
        elif artwork and "start" in artwork and "peak" in artwork:
            grade="publisher_labeled_two_positions"
        elif artwork:
            grade="publisher_labeled_single_position"
        elif valid_local>=2:
            grade="unreviewed_legacy_photo_pair"
        elif valid_local:
            grade="unreviewed_legacy_single_photo"
        else:
            grade="no_available_image"

        rows.append({
            "gymx_id":gym_id,
            "exercise_name":title,
            "source_id":source,
            "equipment":ex.get("equipment") or "",
            "muscle_group":ex.get("muscle") or "",
            "legacy_image_paths":len(raw_paths),
            "legacy_images_valid":valid_local,
            "legacy_images_missing_or_corrupt":broken_local,
            "legacy_distinct_photo_pair":photo_pair,
            "individually_reviewed_legacy_pair":is_reviewed,
            "repdb_exact_or_alias":bool(artwork),
            "repdb_match_type":matching_rule if artwork else "",
            "repdb_source_id":rep["id"] if artwork else "",
            "repdb_image_count":len(artwork) if artwork else 0,
            "guide_quality":grade,
            "thumbnail_available":bool(artwork) or valid_local>0,
            "media_provenance":"Free Exercise DB existing assets; RepDB licensed artwork" if artwork and valid_local else ("RepDB licensed artwork" if artwork else ("Free Exercise DB existing assets" if valid_local else "none"))
        })

    count=len(rows)
    assert count>=800,"Unexpected reduction in GymX records"
    assert len({x["gymx_id"] for x in rows})==count, "Duplicate GymX IDs"
    assert sum(bool(row["individually_reviewed_legacy_pair"]) for row in rows)==36, "Previously reviewed guides disappeared"
    summary=Counter(x["guide_quality"] for x in rows)
    totals={
        "total_exercises":count,
        "legacy_with_any_photo":sum(x["legacy_images_valid"]>0 for x in rows),
        "legacy_with_two_distinct_photos":sum(bool(x["legacy_distinct_photo_pair"]) for x in rows),
        "legacy_missing_or_corrupt_image_references":sum(x["legacy_images_missing_or_corrupt"] for x in rows),
        "individually_reviewed_photo_pairs":sum(bool(x["individually_reviewed_legacy_pair"]) for x in rows),
        "repdb_matched_exercises":len(install),
        "repdb_matched_two_positions":sum(x["repdb_image_count"]==2 for x in rows),
        "repdb_matched_single_position":sum(x["repdb_image_count"]==1 for x in rows),
        "after_integration_exercises_with_thumbnail":sum(x["thumbnail_available"] for x in rows),
        "after_integration_exercises_without_any_image":sum(not x["thumbnail_available"] for x in rows),
        "after_integration_with_two_positions_either_source":sum(x["legacy_distinct_photo_pair"] or x["repdb_image_count"]==2 for x in rows),
        "licensed_webp_copied":len(copied),
        "matched_via_exact_title":sum(x["repdb_match_type"]=="exact_title" for x in rows),
        "matched_via_curated_alias":sum(x["repdb_match_type"]=="curated_alias" for x in rows),
        "review_levels":dict(summary)
    }

    final={"schema":2,
           "source":"RepDB/exercise-dataset; in-app use with visible attribution",
           "mediaPolicy":"Only static WebP images; no GIF or animation",
           "reviewDisclaimer":"RepDB start/peak photos are source-labeled, NOT individually visually verified by GymX; 36 existing FreeDB guides have independent review",
           "summary":totals,"exercises":install}
    (assets/"gymx-image-catalog.js").write_text("window.GYMX_IMAGE_CATALOG = "+json.dumps(final,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    (base/"gymx-image-audit.json").write_text(json.dumps({"summary":totals,"rows":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    with (base/"gymx-image-audit.csv").open("w",encoding="utf-8",newline="") as out:
        writer=csv.DictWriter(out,fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    legal=assets/"third-party"
    legal.mkdir(exist_ok=True)
    shutil.copy2(repo/"LICENSE-DATA.md",legal/"repdb-free-tier-license.md")
    if (repo/"ATTRIBUTION.md").exists():
        shutil.copy2(repo/"ATTRIBUTION.md",legal/"repdb-attribution.md")
    (base/"gymx-image-summary.md").write_text(
        "# GymX static exercise media audit\n\n"+
        "\n".join(f"- **{k.replace('_',' ')}:** {v}" for k,v in totals.items() if k!="review_levels")+
        "\n\nSources: legacy Free Exercise DB photos and licensed RepDB static 512px artwork. "+
        "RepDB matched poses are *publisher-labeled*, not human-verified. "+
        "Existing 36 reviewed photo pairs remain separate. "+
        "Kaggle media NOT imported because image licensing was not confirmed.\n",
        encoding="utf-8"
    )
    print("GYMX_IMAGE_AUDIT_SUMMARY="+json.dumps(totals,sort_keys=True))
    print("GYMX_IMAGE_QA_ROWS="+str(len(rows)))
    return totals

if __name__=="__main__":
    main()
