package com.gymx.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.IOException
import javax.net.ssl.SSLException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/** Fetches a GitHub Release, verifies the update, then invokes Android's installer. */
class GymXUpdater(private val activity: Activity, private val emit: (JSONObject) -> Unit) {
    private data class Release(val version: String, val url: String, val sha256: String)
    private val repo = "abdullahalhaddadalsayed-arch/GymX"
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var next: Release? = null
    @Volatile private var cached: File? = null
    @Volatile private var busy = false

    fun installedVersion(): String = try {
        activity.packageManager.getPackageInfo(activity.packageName, 0).versionName ?: "0.4.0"
    } catch (_: Exception) { "0.4.0" }

    private fun status(kind: String, message: String, version: String? = null) {
        val event = JSONObject().put("type",kind).put("message",message)
        if(version != null) event.put("version",version)
        main.post { emit(event) }
    }

    private fun newer(remote: String, current: String): Boolean {
        fun nums(s: String): List<Int> {
            val n = s.removePrefix("v").split(".").take(3).map { it.toIntOrNull() ?: 0 }
            return n + List(3 - n.size) { 0 }
        }
        val a = nums(remote); val b = nums(current)
        for(i in 0..2) if(a[i]!=b[i]) return a[i]>b[i]
        return false
    }

    fun checkForUpdates() {
        if(busy) return
        busy = true; next=null; cached=null
        status("checking","Checking GymX releases...")
        Thread {
            try {
                val conn = (URL("https://api.github.com/repos/$repo/releases/latest").openConnection() as HttpURLConnection).apply {
                    connectTimeout=15000; readTimeout=20000
                    setRequestProperty("Accept","application/vnd.github+json")
                    setRequestProperty("User-Agent","GymX-Android-Updater")
                }
                val code=conn.responseCode
                require(code==200) { if(code==404) "No signed public GymX release yet." else "GitHub returned HTTP $code" }
                val obj=JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
                conn.disconnect()
                val tag=obj.getString("tag_name")
                require(Regex("^v\\d+\\.\\d+\\.\\d+$").matches(tag)) { "Unexpected release version tag" }
                val version=tag.removePrefix("v")
                if(!newer(version,installedVersion())) {
                    status("current","GymX is already up to date.",installedVersion())
                    return@Thread
                }
                val assets=obj.getJSONArray("assets")
                var apk:JSONObject?=null
                for(i in 0 until assets.length()) {
                    val item=assets.getJSONObject(i)
                    if(item.optString("name")=="GymX.apk") { apk=item; break }
                }
                require(apk!=null) { "No GymX.apk in latest release" }
                val item=apk!!
                val url=item.getString("browser_download_url")
                val uri=Uri.parse(url)
                require(uri.scheme=="https" && uri.host=="github.com" && uri.path?.startsWith("/$repo/releases/download/")==true) {
                    "Untrusted update URL"
                }
                next=Release(version,url,item.optString("digest").removePrefix("sha256:"))
                status("available","GymX v$version is ready to install.",version)
            } catch(e:Exception) {
                status("error",e.message ?: "Update check failed")
            } finally { busy=false }
        }.start()
    }

    /** Temporary GitHub/CDN 504 errors should not end an update immediately. */
    private fun openDownloadWithRetries(url: String): HttpURLConnection {
        var lastFailure: IOException = IOException("Download was unavailable")
        for (attempt in 1..4) {
            var connection: HttpURLConnection? = null
            var success = false
            try {
                connection=(URL(url).openConnection() as HttpURLConnection).apply {
                    connectTimeout=20000
                    readTimeout=90000
                    instanceFollowRedirects=true
                    setRequestProperty("User-Agent","GymX-Android-Updater")
                }
                val code=connection.responseCode
                if(code==200) {
                    success=true
                    return connection
                }
                val error=IOException("Download failed: HTTP " + code)
                if(code !in listOf(408,429,500,502,503,504)) throw error
                lastFailure=error
            } catch(e: IOException) {
                if(e is SSLException) throw e
                lastFailure=e
                if(e.message?.startsWith("Download failed: HTTP ") == true &&
                    e.message !in listOf("Download failed: HTTP 408","Download failed: HTTP 429",
                        "Download failed: HTTP 500","Download failed: HTTP 502",
                        "Download failed: HTTP 503","Download failed: HTTP 504"))
                    throw e
            } finally {
                if(!success) connection?.disconnect()
            }
            if(attempt < 4) {
                status("retrying","GitHub download temporarily unavailable. Retrying (" +
                    (attempt+1) + "/4)…")
                Thread.sleep(1500L * (1L shl (attempt-1)))
            }
        }
        throw IOException(lastFailure.message ?: "Download failed after retries")
    }

    /** Browser fallback if the in-app connection to GitHub/CDN keeps timing out. */
    fun openLatestReleasePage() = main.post {
        try {
            activity.startActivity(Intent(Intent.ACTION_VIEW,
                Uri.parse("https://github.com/" + repo + "/releases/latest")).apply {
                addCategory(Intent.CATEGORY_BROWSABLE)
            })
        } catch(e:Exception) {
            status("error","Could not open GitHub Releases: " + (e.message ?: "Unknown error"))
        }
    }

    fun updateNow() {
        if(busy) return
        val release=next ?: run { status("error","Check for updates first."); return }
        cached?.let { if(it.isFile) { install(it); return } }
        busy=true
        status("downloading","Downloading GymX v${release.version}...")
        Thread {
            try {
                val conn=openDownloadWithRetries(release.url)
                val size=conn.contentLengthLong
                require(size<=200000000L || size == -1L) { "APK too large" }
                val folder=File(activity.cacheDir,"updates").apply { mkdirs() }
                val part=File(folder,"GymX-download.part")
                val file=File(folder,"GymX.apk")
                val digest=MessageDigest.getInstance("SHA-256")
                var bytes=0L
                conn.inputStream.use { input ->
                    part.outputStream().use { output ->
                        val buf=ByteArray(16384)
                        while(true) {
                            val n=input.read(buf)
                            if(n<0) break
                            bytes+=n
                            require(bytes<=200000000L) { "APK exceeds size limit" }
                            digest.update(buf,0,n)
                            output.write(buf,0,n)
                        }
                    }
                }
                conn.disconnect()
                require(bytes>0L) { "Empty APK" }
                if(release.sha256.matches(Regex("[a-fA-F0-9]{64}"))) {
                    val actual=digest.digest().joinToString("") { "%02x".format(it) }
                    require(actual.equals(release.sha256,ignoreCase=true)) { "APK checksum mismatch" }
                }
                val info=activity.packageManager.getPackageArchiveInfo(part.absolutePath,0) ?: error("Invalid APK")
                require(info.packageName==activity.packageName) { "APK package name mismatch" }
                @Suppress("DEPRECATION")
                val old=activity.packageManager.getPackageInfo(activity.packageName,0).longVersionCode
                require(info.longVersionCode>old) { "This APK is not a newer version" }
                if(file.exists()) file.delete()
                require(part.renameTo(file)) { "Couldn't prepare APK" }
                cached=file
                status("downloaded","Download complete. Confirm Android installation.",release.version)
                install(file)
            } catch(e:Exception) {
                status("error","In-app download failed: " + (e.message ?: "Network error") + ". Retry or choose Open GitHub Releases in Settings.")
            } finally { busy=false }
        }.start()
    }

    private fun install(file:File)=main.post {
        try {
            if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.O && !activity.packageManager.canRequestPackageInstalls()) {
                status("permission","Allow GymX to install updates, then tap Update again.")
                activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:${activity.packageName}")))
                return@post
            }
            val uri=FileProvider.getUriForFile(activity,"${activity.packageName}.fileprovider",file)
            activity.startActivity(Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri,"application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            })
        } catch(e:Exception) {
            status("error","Unable to launch installer: ${e.message}")
        }
    }
}
