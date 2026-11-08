#!/usr/bin/env python3
"""Replace ambiguous generic icon thumbnails with 54 clearly labeled original SVG title cards.

This does NOT pretend to resolve missing exercise START/END photos.
SVGs are high-contrast exercise-themed, not technique demonstrations;
the image audit keeps those 54 exercises flagged as needing movement media.
"""
import argparse
import csv
import html
import json
import re
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
a=p.parse_args()
base=Path(a.android_app)
assets=base/"app/src/main/assets"
auditpath=base/"gymx-image-audit.json"
catalogpath=assets/"gymx-image-catalog.js"
audit=json.loads(auditpath.read_text(encoding="utf-8"))
raw=catalogpath.read_text(encoding="utf-8")
catalog=json.loads(raw[raw.index("{"):raw.rfind("}")+1])
assert audit["summary"]["total_exercises"]==886
rows=[r for r in audit["rows"] if r.get("needs_exercise_image")]
assert len(rows)==54, "Review new gaps before changing placeholder catalog"
out=assets/"gymx-schematics"
out.mkdir(parents=True,exist_ok=True)

def art(name,equipment):
    n=name.lower()
    # Every figure is an original symbolic graphic, not a biomechanical pose guide.
    if any(x in n for x in ("walk","run","bounds","skater","skip","butt kicker","high knee","climber")):
        kind="CARDIO / MOTION"
        shape='''<circle cx="325" cy="91" r="24" fill="#d9eddb"/>
        <path d="M312 128l-28 75 70 36 43-52 M285 203l-60 63 M353 238l70 22 M310 145l-65 34 M328 141l56-38"
            fill="none" stroke="#b7ff66" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>'''
    elif any(x in n for x in ("jump","jack","hop","tuck","toe touch","frogger")):
        kind="JUMP / PLYOMETRIC"
        shape='''<circle cx="320" cy="92" r="24" fill="#d9eddb"/>
        <path d="M320 127v102 M314 151l-78-48 M326 151l78-48 M320 224l-73 63 M320 224l74 63"
            stroke="#b7ff66" stroke-width="20" stroke-linecap="round" fill="none"/>
        <path d="M224 296h185" stroke="#6e8c67" stroke-width="5" stroke-linecap="round" stroke-dasharray="15 14"/>'''
    elif any(x in n for x in ("plank","pushup","crawl","crab","military")):
        kind="FLOOR / CORE"
        shape='''<circle cx="222" cy="178" r="24" fill="#d9eddb"/>
        <path d="M251 182l122 14 78 41 M285 199l-30 69 M385 203l-10 68"
            fill="none" stroke="#b7ff66" stroke-width="20" stroke-linecap="round"/>
        <path d="M165 283h329" stroke="#6e8c67" stroke-width="5" stroke-dasharray="16 14"/>'''
    elif any(x in n for x in ("squat","lunge","step up","curtsey","leg lift","glute","bridge")):
        kind="LOWER BODY"
        shape='''<circle cx="319" cy="85" r="23" fill="#d9eddb"/>
        <path d="M317 120l-24 104 90 19 -16 54 M295 224l-78 25 -2 43 M307 137l-80 20 M319 137l77 11"
            fill="none" stroke="#b7ff66" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M182 302h254" stroke="#6e8c67" stroke-width="5" stroke-linecap="round"/>'''
    elif any(x in n for x in ("situp","leg raise","flutter","oblique","woodchop","twist","crunch")):
        kind="CORE / ROTATION"
        shape='''<circle cx="263" cy="119" r="23" fill="#d9eddb"/>
        <path d="M280 154l54 70 75 22 M336 226l-94 58 M310 182l74-39 M340 225l93 62"
            fill="none" stroke="#b7ff66" stroke-width="20" stroke-linecap="round"/>
        <path d="M188 302h286" stroke="#6e8c67" stroke-width="5" stroke-linecap="round"/>'''
    elif "treadmill" in n:
        kind="CARDIO / EQUIPMENT"
        shape='''<path d="M190 261h268l-20 30H202z M388 258l25-136h50"
            fill="none" stroke="#6e8c67" stroke-width="12" stroke-linecap="round"/>
        <circle cx="303" cy="99" r="23" fill="#d9eddb"/>
        <path d="M303 133l-22 67 58 36 M281 201l-41 46 M339 233l50 17 M303 145l47 18"
            fill="none" stroke="#b7ff66" stroke-width="18" stroke-linecap="round"/>'''
    elif any(x in n for x in ("chest press","bench press","dip","high row","press")):
        kind="STRENGTH / PRESS OR PULL"
        shape='''<circle cx="322" cy="93" r="24" fill="#d9eddb"/>
        <path d="M318 131v94 M320 164l-72-28 M320 164l71-28 M320 223l-53 75 M320 223l55 75"
            fill="none" stroke="#b7ff66" stroke-width="20" stroke-linecap="round"/>
        <path d="M222 114h194" stroke="#e7f4df" stroke-width="10" stroke-linecap="round"/>
        <path d="M221 94v40 M417 94v40" stroke="#e7f4df" stroke-width="13"/>'''
    elif any(x in n for x in ("kettlebell","halo","clean")):
        kind="KETTLEBELL / STRENGTH"
        shape='''<path d="M286 149v-25a34 34 0 0 1 68 0v25"
            fill="none" stroke="#e7f4df" stroke-width="17" stroke-linecap="round"/>
        <path d="M264 150h112c20 0 36 21 36 41v42c0 38-37 67-92 67s-92-29-92-67v-42c0-20 16-41 36-41z"
            fill="#b7ff66" opacity=".9"/><circle cx="320" cy="219" r="23" fill="#1f2c22"/>'''
    elif "band" in str(equipment).lower():
        kind="RESISTANCE BAND"
        shape='''<path d="M206 190c35-92 190-92 228 0-43 97-185 97-228 0z"
            fill="none" stroke="#b7ff66" stroke-width="19" stroke-linecap="round"/>
        <circle cx="205" cy="189" r="28" stroke="#e7f4df" stroke-width="10" fill="#1f2c22"/>
        <circle cx="435" cy="189" r="28" stroke="#e7f4df" stroke-width="10" fill="#1f2c22"/>'''
    else:
        kind="STRENGTH / MOVEMENT"
        shape='''<circle cx="321" cy="90" r="24" fill="#d9eddb"/>
        <path d="M321 128v94 M319 162l-67 27 M322 162l67 27 M320 220l-55 79 M320 220l55 79"
            fill="none" stroke="#b7ff66" stroke-width="20" stroke-linecap="round"/>
        <path d="M213 173h215" stroke="#e7f4df" stroke-width="9" stroke-linecap="round"/>
        <path d="M212 156v36 M427 156v36" stroke="#e7f4df" stroke-width="13" stroke-linecap="round"/>'''
    return kind,shape

for row in rows:
    id_=str(row["gymx_id"])
    name=str(row["exercise_name"])
    eq=str(row.get("equipment") or "Exercise")
    muscle=str(row.get("muscle_group") or "Movement")
    kind,shape=art(name,eq)
    # Long exercise titles remain readable in the full detail panel; CSS clips tiny thumbnails.
    title=html.escape(name[:48])
    meta=html.escape((muscle+"  ·  "+eq)[:65])
    key=html.escape(kind)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="{title}: original symbolic exercise reference">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#283827"/><stop offset="1" stop-color="#101e19"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#99ef54" stop-opacity=".16"/><stop offset="1" stop-color="#99ef54" stop-opacity="0"/></radialGradient></defs>
    <rect width="640" height="420" fill="url(#bg)" rx="26"/>
    <circle cx="322" cy="178" r="166" fill="url(#glow)"/>
    <rect x="18" y="16" width="604" height="388" rx="22" fill="none" stroke="#739764" stroke-opacity=".45" stroke-width="2"/>
    <text x="34" y="49" fill="#c7ff8b" font-size="19" font-weight="800" font-family="sans-serif">GYM<tspan fill="#f7fff5">X</tspan></text>
    <text x="606" y="49" text-anchor="end" fill="#b8c9b1" font-size="12" font-weight="700" font-family="sans-serif">{key}</text>
    <g>{shape}</g>
    <rect x="24" y="315" width="592" height="88" rx="14" fill="#101a14" fill-opacity=".91"/>
    <text x="39" y="344" fill="#f7fff5" font-size="24" font-weight="800" font-family="sans-serif">{title}</text>
    <text x="39" y="365" fill="#bcd4b2" font-size="14" font-family="sans-serif">{meta}</text>
    <text x="39" y="389" fill="#f3da85" font-size="12" font-weight="700" font-family="sans-serif">SCHEMATIC ONLY · NOT A START / END MOVEMENT GUIDE</text>
    </svg>'''
    assert not re.search(r"<script|onload=|javascript:",svg,re.I)
    dest=out/(id_+".svg")
    dest.write_text(svg,encoding="utf-8")
    catalog["exercises"][id_]={
        "kind":"exercise_schematic_reference",
        "thumbnail":"gymx-schematics/"+id_+".svg",
        "reviewStatus":"original_schematic_not_technique_guide",
        "name":name
    }
    row["thumbnail_type"]="original_exercise_title_schematic"
    row["media_provenance"]="Original GymX symbolic SVG (not a movement demonstration)"
    row["needs_exercise_image"]=True

summary=audit["summary"]
summary["equipment_reference_thumbnails"]=0
summary["muscle_reference_thumbnails"]=0
summary["original_schematic_reference_thumbnails"]=len(rows)
summary["non_exercise_specific_fallback_thumbnails"]=len(rows)
assert summary["exercise_specific_thumbnails"]==832
assert summary["after_integration_without_exercise_specific_image"]==54
catalog["summary"]=summary
audit["summary"]=summary
catalogpath.write_text("window.GYMX_IMAGE_CATALOG = "+
    json.dumps(catalog,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
auditpath.write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
with (base/"gymx-image-audit.csv").open("w",encoding="utf-8",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(audit["rows"][0]))
    w.writeheader(); w.writerows(audit["rows"])
summaryfile=base/"gymx-image-summary.md"
old=summaryfile.read_text(encoding="utf-8")
old=old.replace("54 equipment/muscle thumbnails are", "54 original symbolic exercise-title cards are")
old=old.replace("equipment/muscle thumbnails are", "symbolic exercise-title cards are")
old=old.replace("clearly labeled generic references", "clearly labeled non-demonstration references")
old += "\n**Latest illustrated fallback:** 54 original GymX exercise-themed SVG title cards replace generic equipment/muscle thumbnails. They are illustrative placeholders, not validated START/END poses. The 54 movement-photo gaps remain open. No GIFs or animation.\n"
summaryfile.write_text(old,encoding="utf-8")
print("Original symbolic thumbnails installed:",len(rows),
      "| exercise-specific movement images unchanged:",summary["exercise_specific_thumbnails"])
