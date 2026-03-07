package com.attentivereactnativesdk

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Android push notification permission helper for the Attentive SDK.
 *
 * On Android 13+ (API 33+), push notifications require the runtime permission
 * [android.permission.POST_NOTIFICATIONS]. On older versions, notifications
 * are allowed by default (no runtime permission).
 *
 * This helper provides:
 * - [getAuthorizationStatus] – current permission status for parity with iOS
 * - [requestPermission] – request POST_NOTIFICATIONS when needed (used by registerForPushNotifications)
 */
object AttentivePushHelper {

    private const val TAG = "AttentivePushHelper"

    /**
     * Authorization status values aligned with iOS push authorization for use in handleRegularOpen etc.
     * - "authorized" – user has granted notification permission (or API < 33)
     * - "denied" – user was asked and denied (API 33+, when determinable via activity)
     * - "notDetermined" – not yet requested, or unable to distinguish (API 33+ only)
     */
    const val STATUS_AUTHORIZED = "authorized"
    const val STATUS_DENIED = "denied"
    const val STATUS_NOT_DETERMINED = "notDetermined"

    /**
     * Returns the current push notification authorization status.
     *
     * On API 33+: uses [android.permission.POST_NOTIFICATIONS]. When permission is not granted,
     * uses [activity] (when provided) and [ActivityCompat.shouldShowRequestPermissionRationale]
     * to distinguish "denied" (user was asked and declined) from "notDetermined" (not yet asked).
     * On API < 33: returns [STATUS_AUTHORIZED] (no runtime permission required).
     *
     * @param context Application or Activity context
     * @param activity Current activity, or null. When non-null on API 33+, used to detect
     *   "denied" vs "notDetermined" so downstream logic and analytics are correct for denied users.
     * @return One of [STATUS_AUTHORIZED], [STATUS_DENIED], or [STATUS_NOT_DETERMINED]
     */
    @JvmStatic
    fun getAuthorizationStatus(context: Context, activity: Activity? = null): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            // API 32 and below: notification permission not required at runtime
            return STATUS_AUTHORIZED
        }
        return when (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)) {
            PackageManager.PERMISSION_GRANTED -> STATUS_AUTHORIZED
            else -> {
                // Not granted. Use shouldShowRequestPermissionRationale when we have an Activity
                // so we do not report "denied" users as "notDetermined" (fixes prompt-gating and analytics).
                if (activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, android.Manifest.permission.POST_NOTIFICATIONS)) {
                    STATUS_DENIED
                } else {
                    STATUS_NOT_DETERMINED
                }
            }
        }
    }

    /**
     * Requests the push notification permission (POST_NOTIFICATIONS) if needed.
     * Must be called from an [Activity] (e.g. [reactApplicationContext.currentActivity]).
     *
     * On API < 33 this is a no-op and returns immediately.
     *
     * @param activity Current activity (required for requestPermissions)
     * @param requestCode Request code for [Activity.onRequestPermissionsResult]
     * @return true if the permission request was started or already granted, false if activity is null or permission not applicable
     */
    @JvmStatic
    fun requestPermissionIfNeeded(activity: Activity?, requestCode: Int): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            Log.d(TAG, "requestPermissionIfNeeded: API < 33, no runtime permission needed")
            return true
        }
        if (activity == null) {
            Log.w(TAG, "requestPermissionIfNeeded: activity is null, cannot request permission")
            return false
        }
        if (ContextCompat.checkSelfPermission(activity, android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "requestPermissionIfNeeded: POST_NOTIFICATIONS already granted")
            return true
        }
        Log.i(TAG, "requestPermissionIfNeeded: requesting POST_NOTIFICATIONS")
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
            requestCode
        )
        return true
    }
}
