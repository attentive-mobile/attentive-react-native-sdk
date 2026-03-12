package com.bonni

import android.util.Log
import com.attentive.androidsdk.AttentiveSdk
import com.attentive.androidsdk.events.CustomEvent
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * FCM service that bridges Attentive push notification events to the React Native layer.
 *
 * Responsibilities:
 * - Foreground push receipt: records a `foreground_push` event via the Attentive Android SDK and
 *   emits [EVENT_FOREGROUND_PUSH] on the RN DeviceEventEmitter so App.tsx can react.
 * - Token refresh: triggers Attentive SDK token re-registration via [AttentiveSdk.updatePushPermissionStatus].
 *
 * Background / killed-state notification taps are handled in [MainActivity] via the
 * launched Intent, because [onMessageReceived] is NOT invoked by FCM for notification
 * messages when the app is in the background or terminated.
 */
class AttentiveFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "AttentiveFCMService"

        /** DeviceEventEmitter event name consumed by Bonni's App.tsx for foreground pushes. */
        const val EVENT_FOREGROUND_PUSH = "AttentiveForegroundPush"
    }

    /**
     * Called when an FCM message arrives while the app is in the foreground,
     * and for data-only messages regardless of app state.
     *
     * Reports the event to the Attentive SDK as a `foreground_push` custom event and
     * emits [EVENT_FOREGROUND_PUSH] on the RN DeviceEventEmitter so the JS layer can
     * call [handleForegroundPush] with the notification payload.
     *
     * @param remoteMessage The incoming FCM message containing data and/or notification payloads.
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.i(TAG, "onMessageReceived: messageId=${remoteMessage.messageId}")

        // Merge FCM data payload and notification fields into a flat map for the SDK.
        val payload = buildPayloadMap(remoteMessage)

        // Record the event directly via the Attentive SDK singleton.
        // AttentiveSdk is guaranteed to be initialized when the app is in the foreground,
        // because App.tsx's initialize() runs before any push can arrive.
        recordForegroundPushEvent(payload)

        // Notify the JS layer so App.tsx can call handleForegroundPush with full context.
        emitToReactNative(EVENT_FOREGROUND_PUSH, payload)
    }

    /**
     * Called when the FCM registration token is refreshed or initially assigned.
     *
     * Triggers [AttentiveSdk.updatePushPermissionStatus] so the new token is propagated
     * to the Attentive backend. The token string itself is intentionally ignored because
     * the Attentive Android SDK fetches the current FCM token internally.
     *
     * @param token The new FCM registration token.
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.i(TAG, "onNewToken: token refreshed (first 16 chars: ${token.take(16)}...)")

        try {
            val application = applicationContext as? android.app.Application
            if (application != null) {
                AttentiveSdk.updatePushPermissionStatus(application)
                Log.i(TAG, "onNewToken: Attentive SDK token registration updated")
            } else {
                Log.w(TAG, "onNewToken: applicationContext is not an Application — skipping token update")
            }
        } catch (e: Exception) {
            Log.e(TAG, "onNewToken: error updating push permission status — ${e.message}", e)
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a flat [Map] combining both the FCM data payload and the notification
     * display fields (title, body, channelId) so the full context is available in JS.
     *
     * @param remoteMessage The incoming FCM message.
     * @return A map of string key-value pairs representing the notification payload.
     */
    private fun buildPayloadMap(remoteMessage: RemoteMessage): Map<String, String> {
        val payload = mutableMapOf<String, String>()

        // FCM data payload (key-value pairs sent by the server)
        payload.putAll(remoteMessage.data)

        // FCM notification display payload (title, body, etc.)
        remoteMessage.notification?.let { notification ->
            notification.title?.let { payload["title"] = it }
            notification.body?.let { payload["body"] = it }
            notification.channelId?.let { payload["channelId"] = it }
        }

        remoteMessage.messageId?.let { payload["messageId"] = it }

        return payload
    }

    /**
     * Records a `foreground_push` custom event to the Attentive Android SDK.
     * This mirrors the Kotlin implementation inside [AttentiveReactNativeSdkModule.handleForegroundPush].
     *
     * @param payload The notification payload properties.
     */
    private fun recordForegroundPushEvent(payload: Map<String, String>) {
        try {
            val properties = payload.toMutableMap()
            properties["event_type"] = "foreground_push"
            properties["platform"] = "Android"

            val customEvent = CustomEvent.Builder()
                .type("foreground_push")
                .properties(properties)
                .build()

            AttentiveSdk.recordEvent(customEvent)
            Log.i(TAG, "recordForegroundPushEvent: foreground_push event recorded")
        } catch (e: Exception) {
            Log.w(TAG, "recordForegroundPushEvent: could not record event — ${e.message}")
        }
    }

    /**
     * Emits a JavaScript event to the RN DeviceEventEmitter if the React Native bridge
     * is currently running. No-op if the bridge is not yet initialized (e.g. data-only
     * push in the background before the app has launched at least once).
     *
     * @param eventName Name of the event as consumed by [NativeEventEmitter] in JS.
     * @param payload Map of string properties to pass as the event body.
     */
    private fun emitToReactNative(eventName: String, payload: Map<String, String>) {
        try {
            val reactApplication = applicationContext as? ReactApplication ?: return
            val reactContext = reactApplication.reactHost
                ?.currentReactContext
                ?: run {
                    Log.d(TAG, "emitToReactNative: ReactContext not ready — event '$eventName' not emitted")
                    return
                }

            val params = Arguments.createMap()
            payload.forEach { (key, value) -> params.putString(key, value) }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)

            Log.i(TAG, "emitToReactNative: emitted '$eventName' to JS")
        } catch (e: Exception) {
            Log.e(TAG, "emitToReactNative: error emitting '$eventName' — ${e.message}", e)
        }
    }
}
