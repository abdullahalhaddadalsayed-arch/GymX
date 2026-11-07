#!/usr/bin/env python3
"""Install external Jeff Nippard YouTube links in GymX exercise details.

Open via Android ACTION_VIEW (YouTube app/browser), not embedded/cached video.
Only https YouTube hosts allowed. No exercise IDs/history are modified.
"""
from pathlib import Path
import argparse
import shutil

p=argparse.ArgumentParser()
p.add_argument("--android-app",default="android-app")
args=p.parse_args()

base=Path(args.android_app)/"app/src/main"
index=base/"assets/index.html"
java=base/"java/com/gymx/app/MainActivity.kt"
assets=base/"assets"
src=Path(__file__).resolve().parent
assert index.is_file() and java.is_file()
assert (assets/"exercises.js").is_file()

text=java.read_text(encoding="utf-8")
if "fun openJeffVideo(" not in text:
    match="webView.addJavascriptInterface(object {"
    assert match in text, "GymX native bridge changed; cannot install safe YouTube opener"
    method='''webView.addJavascriptInterface(object {
            @JavascriptInterface fun openJeffVideo(url: String) {
                try {
                    val parsed = android.net.Uri.parse(url)
                    val host = parsed.host?.lowercase() ?: return
                    val allowed = setOf("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be")
                    if (!parsed.scheme.equals("https", true) || host !in allowed) return
                    this@MainActivity.runOnUiThread {
                        try {
                            val intent = android.content.Intent(
                                android.content.Intent.ACTION_VIEW, parsed
                            ).addCategory(android.content.Intent.CATEGORY_BROWSABLE)
                            this@MainActivity.startActivity(intent)
                        } catch (_: Exception) { /* No YouTube handler installed */ }
                    }
                } catch (_: Exception) { /* Ignore invalid URLs */ }
            }
'''
    text=text.replace(match,method,1)
    java.write_text(text,encoding="utf-8")

for name in ("gymx-jeff-video-links.js","gymx-jeff-video-links.css"):
    shutil.copy2(src/name, assets/name)

html=index.read_text(encoding="utf-8")
if "gymx-jeff-video-links.css" not in html:
    assert "</head>" in html
    html=html.replace("</head>",'<link rel="stylesheet" href="gymx-jeff-video-links.css"></head>',1)
if "gymx-jeff-video-links.js" not in html:
    assert "</body>" in html
    html=html.replace("</body>",'<script src="gymx-jeff-video-links.js"></script></body>',1)
index.write_text(html,encoding="utf-8")
assert "gymx-jeff-video-links.js" in html
assert "openJeffVideo(url: String)" in java.read_text(encoding="utf-8")
print("GymX Jeff Nippard video links installed (external YouTube, HTTPS only).")
