#!/usr/bin/env python3
"""Install offline home messages, update alerts and original schematic thumbnails.

Creates exactly 5,000 unique, deterministic, original motivational combinations.
Does not overwrite the existing workout / progress-photo databases.
"""
import argparse
import itertools
import json
import random
import shutil
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
ap = argparse.ArgumentParser()
ap.add_argument("--android-app", default="android-app")
args = ap.parse_args()
assets = Path(args.android_app)/"app/src/main/assets"
index = assets/"index.html"
assert index.exists() and (assets/"app.js").exists()

starts = """
Make today count
Train with purpose
Show up for yourself
Keep your standards high
Build strength one rep at a time
Lead with effort
Give this session your attention
Take pride in the process
Set a goal for today's workout
Own your next rep
Make consistency your advantage
Bring focus to the gym
Stay committed to your plan
Let action replace hesitation
Begin before motivation arrives
Choose patience over shortcuts
Keep the momentum alive
Practice being stronger
Earn your progress with steady work
Put your energy into good form
Make your warm-up matter
Respect the work you have done
Trust the value of repetition
Build habits that last
Turn intention into movement
Challenge yourself with control
Find your rhythm today
Give every set a purpose
Start the session you planned
Be proud of small improvements
Take the next achievable step
Stay steady through the ordinary days
Aim for quality over ego
Remember why you started
Celebrate consistency
Keep your technique sharp
Let discipline lead
Give your best sustainable effort
Keep your eyes on your own progress
Invest in long-term strength
Use today's energy wisely
Practice patient improvement
Turn up with a clear goal
Build confidence with each session
Focus on what you can control
Stay curious about your progress
Make time for your health
Keep building your foundation
Work with determination
Train hard and train smart
""".strip().splitlines()
middles = """
Small improvements compound over time
A repeatable routine beats a perfect plan
A controlled rep is a rep worth doing
Strength comes from training and recovery
Showing up is a meaningful victory
Good technique makes progress more useful
You can improve without rushing
Effort today supports tomorrow's confidence
Your pace is still a valid pace
Progress is not always a heavier number
Consistency gives your goals a chance
Every session is a chance to learn
Rest and recovery are part of training
Patience is a practical strength
Quality work creates real momentum
A clear goal makes the next set easier
Movement is a habit worth protecting
Strong routines are built gradually
Your effort matters even on quiet days
Focus on what you can do well today
""".strip().splitlines()
closers = """
One session at a time
Keep showing up
Own today's effort
Build the habit
Train for the long run
""".strip().splitlines()
assert (len(starts),len(middles),len(closers)) == (50,20,5)
messages = [a+". "+b+". "+c+"." for a,b,c in itertools.product(starts,middles,closers)]
assert len(messages)==5000 and len(set(messages))==5000
random.Random(20261108).shuffle(messages)
(assets/"gymx-messages.js").write_text(
    "/* Original locally bundled daily messages; combinations of 75 reviewed clauses. */\n"
    "window.GYMX_QUOTES_VERSION='2026-11-08-v1';\n"
    "window.GYMX_QUOTES="+json.dumps(messages,ensure_ascii=False,separators=(',',':'))+";\n",
    encoding="utf-8"
)
for name in ("gymx-home-features.js","gymx-home-features.css"):
    shutil.copy2(SOURCE/name, assets/name)
html=index.read_text(encoding="utf-8")
assert 'gymx-updates.js' in html, "Native updater must install first"
if 'gymx-home-features.js' not in html:
    assert "</body>" in html, "Missing closing body"
    html=html.replace("</body>",
        '<script src="gymx-messages.js"></script>\n'
        '<script src="gymx-home-features.js"></script>\n'
        "</body>",1)
if 'gymx-home-features.css' not in html:
    assert "</head>" in html
    html=html.replace("</head>",
        '<link rel="stylesheet" href="gymx-home-features.css">\n</head>',1)
index.write_text(html,encoding="utf-8")
print("GymX home features installed: 5000 original messages, local IndexedDB copy, daily banner and update notice.")
