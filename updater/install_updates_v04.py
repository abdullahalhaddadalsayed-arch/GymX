#!/usr/bin/env python3
"""Add native GitHub Releases updater to extracted GymX v0.4 without removing ML."""
from pathlib import Path
import argparse
import shutil

ROOT = Path(__file__).resolve().parent
p = argparse.ArgumentParser()
p.add_argument('--android-app', default='android-app')
args = p.parse_args()
app = Path(args.android_app)
base = app / 'app/src/main'
java = base / 'java/com/gymx/app/MainActivity.kt'
manifest = base / 'AndroidManifest.xml'
paths = base / 'res/xml/file_paths.xml'
gradle = app / 'app/build.gradle.kts'
index = base / 'assets/index.html'
assert all(f.is_file() for f in (java,manifest,paths,gradle,index)), 'GymX v0.4 files missing'

shutil.copy2(ROOT/'GymXUpdater.kt', java.parent/'GymXUpdater.kt')
s = java.read_text()
if 'private lateinit var updater: GymXUpdater' not in s:
    assert 'private lateinit var webView: WebView' in s, 'MainActivity webView declaration changed'
    s = s.replace('private lateinit var webView: WebView',
                  'private lateinit var webView: WebView\n    private lateinit var updater: GymXUpdater', 1)
    assert 'super.onCreate(savedInstanceState)' in s
    s = s.replace('super.onCreate(savedInstanceState)', '''super.onCreate(savedInstanceState)
        updater = GymXUpdater(this) { update ->
            if (::webView.isInitialized) webView.evaluateJavascript(
                "window.gymxUpdateEvent && window.gymxUpdateEvent(${update})", null)
        }''', 1)
    assert 'webView.addJavascriptInterface(object {' in s, 'Native bridge changed'
    s = s.replace('webView.addJavascriptInterface(object {', '''webView.addJavascriptInterface(object {
            @JavascriptInterface fun getAppVersion(): String = updater.installedVersion()
            @JavascriptInterface fun checkForUpdates() { updater.checkForUpdates() }
            @JavascriptInterface fun installUpdate() { updater.updateNow() }
''', 1)
java.write_text(s)

s=manifest.read_text()
if 'android.permission.REQUEST_INSTALL_PACKAGES' not in s:
    assert '<application' in s
    s=s.replace('    <application', '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n    <application', 1)
manifest.write_text(s)

s=paths.read_text()
if 'signed_apk_updates' not in s:
    assert '</paths>' in s
    s=s.replace('</paths>', '<cache-path name="signed_apk_updates" path="updates/"/></paths>', 1)
paths.write_text(s)

s=gradle.read_text()
if 'GYMX_VERSION_CODE' not in s:
    assert 'versionCode = 4' in s and 'versionName = "0.4.0"' in s
    s=s.replace('versionCode = 4','versionCode = System.getenv("GYMX_VERSION_CODE")?.toIntOrNull() ?: 4', 1)
    s=s.replace('versionName = "0.4.0"','versionName = System.getenv("GYMX_VERSION_NAME") ?: "0.4.0"', 1)
if 'gymxRelease' not in s:
    assert 'buildTypes { release { isMinifyEnabled = false } }' in s, 'Build type changed'
    s=s.replace('buildTypes { release { isMinifyEnabled = false } }', '''signingConfigs {
        create("gymxRelease") {
            storeFile = file("gymx-release.jks")
            storePassword = System.getenv("GYMX_KEYSTORE_PASSWORD") ?: ""
            keyAlias = System.getenv("GYMX_KEY_ALIAS") ?: "gymx"
            keyPassword = System.getenv("GYMX_KEY_PASSWORD") ?: ""
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("gymxRelease")
        }
    }''',1)
gradle.write_text(s)

shutil.copy2(ROOT/'gymx-updates.js', base/'assets/gymx-updates.js')
s=index.read_text()
if 'gymx-updates.js' not in s:
    assert '<script src="app.js"></script>' in s
    s=s.replace('<script src="app.js"></script>',
                '<script src="app.js"></script><script src="gymx-updates.js"></script>',1)
index.write_text(s)
assert 'matcher = OfflineMachineMatcher' in java.read_text(), 'Offline ML must remain'
print('OK: updater installed in extracted GymX v0.4; offline ML and workouts preserved.')
