plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties

// Clé de signature de release : TOUTES les versions doivent être signées avec la même clé,
// sinon Android refuse la mise à jour. Chemin donné par app/android/key.properties (hors dépôt)
// ou par les variables d'environnement de la CI.
val keyProps = Properties().apply {
    val f = rootProject.file("key.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun keyProp(name: String, env: String): String? = keyProps.getProperty(name) ?: System.getenv(env)

android {
    namespace = "mg.comima.comima"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "mg.comima.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // Bibliothèques natives compressées dans l'APK : téléchargement ~2× plus léger
    // (connexions lentes et chères), au prix d'une extraction à l'installation.
    packaging {
        jniLibs {
            useLegacyPackaging = true
        }
    }

    signingConfigs {
        create("release") {
            val store = keyProp("storeFile", "COMIMA_KEYSTORE")
            if (store != null) {
                storeFile = file(store)
                storePassword = keyProp("storePassword", "COMIMA_KEYSTORE_PASSWORD")
                keyAlias = keyProp("keyAlias", "COMIMA_KEY_ALIAS")
                keyPassword = keyProp("keyPassword", "COMIMA_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (keyProp("storeFile", "COMIMA_KEYSTORE") != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug") // développement uniquement : non publiable
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation("androidx.core:core:1.13.1")
}
