package com.attentivereactnativesdk

/**
 * In-process store for a pending initial push notification payload.
 *
 * When the user taps an FCM notification while the app is in the killed state,
 * Android launches the app's main activity before the React Native bridge is
 * initialised. The notification payload is written here by the host app's
 * `MainActivity` and consumed exactly once by [AttentiveReactNativeSdkModule.getInitialPushNotification]
 * after the JS layer is ready.
 *
 * ## Usage pattern
 *
 * ```kotlin
 * // In host app's MainActivity.onCreate:
 * intent?.extras?.let { extras ->
 *     val payload = // … extract FCM data …
 *     AttentiveNotificationStore.setPendingInitialNotification(payload)
 * }
 * ```
 *
 * ```typescript
 * // In JS (App.tsx), after initialize():
 * const initial = await getInitialPushNotification()
 * if (initial) handlePushOpen(initial, authStatus)
 * ```
 *
 * Thread-safety: the two public methods are `@Synchronized` so concurrent access
 * from the main UI thread (writer) and the JS bridge thread (reader) is safe.
 */
object AttentiveNotificationStore {

    @Volatile
    private var pendingInitialNotification: Map<String, String>? = null

    /**
     * Stores [payload] as the pending initial push notification.
     *
     * Replaces any previously stored value (only one initial notification is tracked at a time).
     *
     * @param payload A map of string key-value pairs representing the notification data.
     */
    @Synchronized
    fun setPendingInitialNotification(payload: Map<String, String>) {
        pendingInitialNotification = payload
    }

    /**
     * Returns the stored initial push notification payload and clears it atomically,
     * ensuring the payload is delivered to the JS layer exactly once.
     *
     * @return The stored payload map, or `null` if no initial notification is pending.
     */
    @Synchronized
    fun getAndClear(): Map<String, String>? {
        val pending = pendingInitialNotification
        pendingInitialNotification = null
        return pending
    }
}
