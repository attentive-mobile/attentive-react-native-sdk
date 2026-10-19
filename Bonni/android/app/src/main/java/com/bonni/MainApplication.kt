package com.bonni

import android.app.Application
import android.database.sqlite.SQLiteDatabase
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import com.attentive.androidsdk.*
import com.attentive.androidsdk.AttentiveLogLevel
import android.util.Log

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    val TAG = "NATIVE-PN-SETUP"
    Log.d(TAG, "Native onCreate was called!")
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    initAttentiveSDK()
  }

  fun initAttentiveSDK() {
    val TAG = "NATIVE-PN-SETUP"
    Log.d(TAG, "Native initAttentiveSDK was called!")

    val appContext = applicationContext as? Application
      ?: throw IllegalStateException("Application context is required for Attentive SDK")

    // This config is Android's ONLY source of truth, and must be kept in sync with the config in
    // Bonni/App.tsx by hand. The TypeScript initialize() is an intentional no-op here — lifecycle
    // observers have to be registered in onCreate(), before the RN bridge exists — so nothing set
    // in App.tsx ever reaches Android. Editing App.tsx alone changes iOS only. The one exception
    // is automaticallyOpensInboxDeepLinks, which comes from the Settings toggle through
    // readStoredBoolean() below instead of being hardcoded, so Bonni testers can toggle it without
    // rebuilding the app.
    //
    // The domain must serve a default mobile-app creative for `triggerCreative()` with no id to
    // render. "games" does. A domain without one loads the creative page, never shows an iframe,
    // and the native SDK times out after 5s — pass an explicit creative id against those.
    //
    // Mode stays DEBUG. PRODUCTION here would make every tester who submits the creative's
    // sign-up form a real subscriber on a live Attentive account. Be aware of one DEBUG-only
    // hazard while testing: attentive-android-sdk 2.1.9 makes the fullscreen WebView VISIBLE
    // before the creative page loads, and a visible WebView swallows every touch, so a creative
    // that fails to render leaves the app unresponsive until you restart it.
    val modeEnum = AttentiveConfig.Mode.DEBUG
    Log.d(TAG, "Building AttentiveConfig with mode: \"$modeEnum\"")
    val config = AttentiveConfig.Builder()
      .applicationContext(appContext)
      .domain("games")
      .mode(modeEnum)
      .notificationIconId(R.drawable.bonni_logo)
      .logLevel(AttentiveLogLevel.VERBOSE)
      .pushEnabled(true)
      .automaticallyOpensInboxDeepLinks(
        readStoredBoolean(AUTOMATICALLY_OPENS_INBOX_DEEP_LINKS_KEY, false)
      )
      .build()

    // Application.onCreate() is guaranteed by Android to run on the main thread.
    // AttentiveSdk.initialize internally calls lifecycle.addObserver() (via AppLaunchTracker /
    // ProcessLifecycleOwner), which AndroidX enforces must be called on the main thread.
    // No thread-switching wrapper is needed here because we are already on the main thread.
    AttentiveSdk.initialize(config)
  }

  /**
   * Reads a flag that JS saved with setStoredBoolean(). onCreate() runs before JS exists, so this
   * opens AsyncStorage's SQLite file directly. That layout is AsyncStorage's internal one, not a
   * public API: if a Bonni upgrade changes it, this quietly returns [defaultValue].
   */
  private fun readStoredBoolean(key: String, defaultValue: Boolean): Boolean {
    val path = getDatabasePath(ASYNC_STORAGE_DATABASE)
    if (!path.exists()) return defaultValue
    return try {
      SQLiteDatabase.openDatabase(path.path, null, SQLiteDatabase.OPEN_READONLY).use { db ->
        db.rawQuery("SELECT value FROM catalystLocalStorage WHERE key = ?", arrayOf(key)).use {
          if (it.moveToFirst()) it.getString(0) == "true" else defaultValue
        }
      }
    } catch (e: Exception) {
      Log.w("NATIVE-PN-SETUP", "Couldn't read \"$key\" from AsyncStorage", e)
      defaultValue
    }
  }

  companion object {
    private const val ASYNC_STORAGE_DATABASE = "RKStorage"
    // Must match CONFIG_STORAGE_KEYS in Bonni/src/constants/storage.ts.
    private const val AUTOMATICALLY_OPENS_INBOX_DEEP_LINKS_KEY =
      "attentive_automatically_opens_inbox_deep_links"
  }
}
