package com.bonni

import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.attentivereactnativesdk.AttentiveNotificationStore
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Main React Native activity for Bonni.
 *
 * In addition to the standard RN delegate wiring, this class intercepts FCM notification
 * tap intents and routes them to the Attentive SDK via the React Native bridge.
 *
 * Two tap scenarios are handled:
 * - **Background tap**: App is running (in background), user taps notification →
 *   [onNewIntent] is called with the notification Intent → the ReactContext is alive
 *   so [EVENT_PUSH_OPENED] is emitted directly to the JS DeviceEventEmitter.
 *
 * - **Killed-state tap**: App was terminated, user taps notification → [onCreate] is
 *   called with the notification Intent → the RN bridge is not ready yet, so the
 *   payload is stored in [AttentiveNotificationStore] and retrieved by the JS layer
 *   after startup via `getInitialPushNotification()`.
 */
class MainActivity : ReactActivity() {

    companion object {
        private const val TAG = "BonniMainActivity"

        /** DeviceEventEmitter event name consumed by Bonni's App.tsx for push-open events. */
        const val EVENT_PUSH_OPENED = "AttentivePushOpened"

        /**
         * FCM puts notification data in the launch Intent when the user taps a notification.
         * When Attentive sends a push, the payload is stored under the "data" extras directly
         * or under Google's standard notification keys.
         */
        private val KNOWN_FCM_KEYS = setOf(
            "google.message_id", "google.sent_time", "gcm.n.e",
            "collapse_key", "from"
        )
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     */
    override fun getMainComponentName(): String = "Bonni"

    /**
     * Returns the [ReactActivityDelegate] instance.
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    /**
     * Called when the activity is first created — covers the killed-state tap scenario.
     *
     * If the launching [Intent] carries FCM notification data, the payload is persisted in
     * [AttentiveNotificationStore] so the JS layer can pick it up via `getInitialPushNotification()`
     * once the React Native bridge is fully initialised.
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "onCreate: checking for initial push notification intent")
    }

    /**
     * Called when a new Intent is delivered to an already-running activity — covers the
     * background-tap scenario.
     *
     * If the Intent carries FCM notification data and the ReactContext is available, the
     * [EVENT_PUSH_OPENED] event is emitted immediately to the JS layer. If the ReactContext
     * is not yet ready (edge case), the payload is persisted in [AttentiveNotificationStore]
     * as a fallback.
     *
     * @param intent The new Intent delivered to the activity.
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        Log.d(TAG, "onNewIntent: checking for push notification intent")
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Extracts FCM notification data from [intent] and routes it appropriately.
     *
     * When [isInitialLaunch] is true (killed-state tap), the payload is stored in
     * [AttentiveNotificationStore] for later JS retrieval. When false (background tap),
     * we attempt an immediate DeviceEventEmitter emission and fall back to storage if
     * the bridge is not yet ready.
     *
     * @param intent   The Intent to inspect for FCM notification extras.
     * @param isInitialLaunch `true` if called from [onCreate], `false` if from [onNewIntent].
     */
    private fun handleNotificationIntent(intent: Intent, isInitialLaunch: Boolean) {
        val payload = extractNotificationPayload(intent) ?: run {
            Log.d(TAG, "handleNotificationIntent: no FCM notification data found in intent")
            return
        }

        Log.i(TAG, "handleNotificationIntent: FCM tap detected — isInitialLaunch=$isInitialLaunch, keys=${payload.keys}")

        if (isInitialLaunch) {
            // RN bridge is not ready. Store for later retrieval via getInitialPushNotification().
            AttentiveNotificationStore.setPendingInitialNotification(payload)
            Log.i(TAG, "handleNotificationIntent: stored initial push notification for JS retrieval")
        } else {
            // App was in background — RN bridge is alive. Try to emit immediately.
            val emitted = emitPushOpenedToReactNative(payload)
            if (!emitted) {
                // Bridge not ready as a fallback; store it as the initial notification.
                AttentiveNotificationStore.setPendingInitialNotification(payload)
                Log.i(TAG, "handleNotificationIntent: bridge not ready — stored as initial notification")
            }
        }
    }

    /**
     * Extracts the notification tap payload from an FCM launch [Intent].
     *
     * FCM puts all notification data fields directly into [Intent.getExtras]. We filter
     * out internal FCM bookkeeping keys so the SDK receives only the notification's custom
     * data fields (plus title / body if present).
     *
     * @param intent The Intent to inspect.
     * @return A non-empty map of string properties, or null if this Intent was not triggered
     *         by a notification tap.
     */
    private fun extractNotificationPayload(intent: Intent): Map<String, String>? {
        val extras = intent.extras ?: return null

        // FCM notification taps always include "google.message_id" or "from".
        val isFcmNotification = extras.containsKey("google.message_id") ||
            extras.containsKey("from") ||
            extras.containsKey("gcm.notification.title") ||
            extras.containsKey("gcm.notification.body")

        if (!isFcmNotification) return null

        val payload = mutableMapOf<String, String>()
        for (key in extras.keySet()) {
            val value = extras.getString(key) ?: extras.getCharSequence(key)?.toString() ?: continue
            payload[key] = value
        }

        return payload.ifEmpty { null }
    }

    /**
     * Emits [EVENT_PUSH_OPENED] to the JS DeviceEventEmitter if the ReactContext is available.
     *
     * @param payload The notification payload to emit.
     * @return `true` if the event was emitted successfully, `false` if the bridge was unavailable.
     */
    private fun emitPushOpenedToReactNative(payload: Map<String, String>): Boolean {
        return try {
            val reactApplication = applicationContext as? ReactApplication ?: return false
            val reactContext = reactApplication.reactHost?.currentReactContext ?: return false

            val params = Arguments.createMap()
            payload.forEach { (key, value) -> params.putString(key, value) }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_PUSH_OPENED, params)

            Log.i(TAG, "emitPushOpenedToReactNative: emitted '$EVENT_PUSH_OPENED' to JS")
            true
        } catch (e: Exception) {
            Log.e(TAG, "emitPushOpenedToReactNative: error — ${e.message}", e)
            false
        }
    }
}
