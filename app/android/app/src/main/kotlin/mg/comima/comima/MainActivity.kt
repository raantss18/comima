package mg.comima.comima

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

private const val LOGIN_SCHEME = "mg.comima.app"

/** Canal système : version installée, processeur, installation d'une mise à jour vérifiée. */
class MainActivity : FlutterActivity() {
    private var channel: MethodChannel? = null

    /** Lien de retour de connexion (Google, Facebook, confirmation d'e-mail) pas encore lu par Dart. */
    private var pendingLink: String? = null

    private fun remember(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme == LOGIN_SCHEME) pendingLink = data.toString()
    }

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        remember(intent)
        super.onCreate(savedInstanceState)
    }

    /** Application déjà ouverte : le navigateur nous rend la main (launchMode singleTop). */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        remember(intent)
        val link = pendingLink
        if (link != null && channel != null) {
            pendingLink = null
            channel?.invokeMethod("deepLink", link)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        channel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "mg.comima.app/system")
        channel!!.setMethodCallHandler { call, result ->
            when (call.method) {
                "takeLink" -> {
                    result.success(pendingLink)
                    pendingLink = null
                }
                "info" -> {
                    val info = packageManager.getPackageInfo(packageName, 0)
                    val build = if (Build.VERSION.SDK_INT >= 28) info.longVersionCode.toInt() else @Suppress("DEPRECATION") info.versionCode
                    result.success(mapOf("build" to build, "version" to info.versionName, "abis" to Build.SUPPORTED_ABIS.toList()))
                }
                "canInstall" -> result.success(Build.VERSION.SDK_INT < 26 || packageManager.canRequestPackageInstalls())
                "openInstallSettings" -> {
                    if (Build.VERSION.SDK_INT >= 26) {
                        startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:$packageName")))
                    }
                    result.success(null)
                }
                "install" -> {
                    val path = call.argument<String>("path")
                    val file = path?.let { File(it) }
                    // Seuls les fichiers du dossier de mises à jour (cache) peuvent être installés.
                    if (file == null || !file.exists() || file.parentFile?.canonicalPath != File(cacheDir, "updates").canonicalPath) {
                        result.error("bad_path", null, null)
                    } else {
                        val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
                        startActivity(Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(uri, "application/vnd.android.package-archive")
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                        })
                        result.success(null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }
}
