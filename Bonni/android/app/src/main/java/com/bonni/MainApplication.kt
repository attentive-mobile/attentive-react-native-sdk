package com.bonni

import android.app.Application
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
import java.util.Locale
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

    val mode = "DEBUG"
    val modeEnum = AttentiveConfig.Mode.valueOf(mode.uppercase(Locale.ROOT))
    Log.d(TAG, "Building AttentiveConfig with mode received from TypeScript: \"$modeEnum\"")
    val config = AttentiveConfig.Builder()
      .applicationContext(appContext)
      .domain("games")
      .mode(modeEnum)
      .notificationIconId(R.drawable.bonni_logo)
      .skipFatigueOnCreatives(false)
      .logLevel(AttentiveLogLevel.VERBOSE)
      .build()

    // Application.onCreate() is guaranteed by Android to run on the main thread.
    // AttentiveSdk.initialize internally calls lifecycle.addObserver() (via AppLaunchTracker /
    // ProcessLifecycleOwner), which AndroidX enforces must be called on the main thread.
    // No thread-switching wrapper is needed here because we are already on the main thread.
    AttentiveSdk.initialize(config)
  }
}
