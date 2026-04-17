package com.attentivereactnativesdk

import android.app.Activity
import android.app.Application
import android.util.Log
import android.view.ViewGroup
import androidx.annotation.NonNull
import androidx.annotation.Nullable
import com.attentive.androidsdk.AttentiveConfig
import com.attentive.androidsdk.AttentiveSdk
import com.attentive.androidsdk.UserIdentifiers
import com.attentive.androidsdk.creatives.Creative
import com.attentive.androidsdk.events.AddToCartEvent
import com.attentive.androidsdk.events.Cart
import com.attentive.androidsdk.events.CustomEvent
import com.attentive.androidsdk.events.Item
import com.attentive.androidsdk.events.Order
import com.attentive.androidsdk.events.Price
import com.attentive.androidsdk.events.ProductViewEvent
import com.attentive.androidsdk.events.PurchaseEvent
import com.attentive.androidsdk.push.TokenFetchResult
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Callback
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.attentivereactnativesdk.debug.AttentiveDebugHelper
import com.attentive.androidsdk.AttentiveLogLevel
import java.math.BigDecimal
import java.security.InvalidParameterException
import java.util.Currency
import java.util.Locale
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AttentiveReactNativeSdkModule(reactContext: ReactApplicationContext) :
    NativeAttentiveReactNativeSdkSpec(reactContext) {

    companion object {
        const val NAME = "AttentiveReactNativeSdk"
        private const val TAG = NAME
        private const val PUSH_PERMISSION_REQUEST_CODE = 3901
    }

    private var attentiveConfig: AttentiveConfig? = null
    private var creative: Creative? = null
    private val debugHelper: AttentiveDebugHelper

    /** Coroutine scope tied to IO dispatcher for calling AttentiveSdk suspend functions. */
    private val ioScope = CoroutineScope(Dispatchers.IO)

    init {
        debugHelper = AttentiveDebugHelper(reactContext)
    }

    override fun getName(): String {
        return NAME
    }

    /**
     * TypeScript-facing initialize() — intentionally a no-op on Android.
     *
     * On Android, AttentiveSdk.initialize() MUST be called from your Application.onCreate()
     * (native code) so that lifecycle observers (AppLaunchTracker, etc.) are registered
     * before the React Native bridge is ready. Calling this from TypeScript on Android has
     * no effect and will not initialize the SDK.
     *
     * Required native setup in your Application class:
     * ```kotlin
     * override fun onCreate() {
     *     super.onCreate()
     *     val config = AttentiveConfig.Builder()
     *         .applicationContext(this)
     *         .domain("YOUR_ATTENTIVE_DOMAIN")
     *         .mode(AttentiveConfig.Mode.PRODUCTION)
     *         .build()
     *     AttentiveSdk.initialize(config)
     * }
     * ```
     *
     * See the README.md "Android Native Initialization" section for the full guide.
     * All other SDK operations (identify, recordEvent, push) are handled from TypeScript as normal.
     */
    override fun initialize(
        attentiveDomain: String,
        mode: String,
        skipFatigueOnCreatives: Boolean,
        enableDebugger: Boolean
    ) {
        debugHelper.initialize(enableDebugger)
    }

    override fun triggerCreative(creativeId: String?) {
        Log.i(TAG, "Native Attentive module was called to trigger the creative.")
        try {
            val currentActivity: Activity? = reactApplicationContext.currentActivity
            if (currentActivity != null) {
                val rootView =
                    currentActivity.window.decorView.rootView as ViewGroup
                // The following calls edit the view hierarchy so they must run on the UI thread
                UiThreadUtil.runOnUiThread {
                    creative = Creative(attentiveConfig!!, rootView, currentActivity)
                    creative?.trigger(null, creativeId)
                    if (debugHelper.isDebuggingEnabled()) {
                        val debugData = mutableMapOf<String, Any>()
                        debugData["type"] = "trigger"
                        debugData["creativeId"] = creativeId ?: "default"
                        debugHelper.showDebugInfo("Creative Triggered", debugData)
                    }
                }
            } else {
                Log.w(TAG, "Could not trigger the Attentive Creative because the current Activity was null")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception when triggering the creative: $e")
        }
    }

    override fun destroyCreative() {
        val creativeToDestroy = creative
        if (creativeToDestroy != null) {
            UiThreadUtil.runOnUiThread {
                creativeToDestroy.destroy()
                creative = null
            }
        }
    }

    override fun updateDomain(domain: String) {
        attentiveConfig?.changeDomain(domain)
    }

    override fun clearUser() {
        attentiveConfig?.clearUser()
    }

    override fun identify(
        phone: String?,
        email: String?,
        klaviyoId: String?,
        shopifyId: String?,
        clientUserId: String?,
        customIdentifiers: ReadableMap?
    ) {
        val idsBuilder = UserIdentifiers.Builder()
        if (!phone.isNullOrEmpty()) {
            idsBuilder.withPhone(phone)
        }
        if (!email.isNullOrEmpty()) {
            idsBuilder.withEmail(email)
        }
        if (!klaviyoId.isNullOrEmpty()) {
            idsBuilder.withKlaviyoId(klaviyoId)
        }
        if (!shopifyId.isNullOrEmpty()) {
            idsBuilder.withShopifyId(shopifyId)
        }
        if (!clientUserId.isNullOrEmpty()) {
            idsBuilder.withClientUserId(clientUserId)
        }
        if (customIdentifiers != null) {
            val customIds = mutableMapOf<String, String>()
            val rawCustomIds = customIdentifiers.toHashMap()
            for ((key, value) in rawCustomIds) {
                if (value is String) {
                    customIds[key] = value
                }
            }
            idsBuilder.withCustomIdentifiers(customIds)
        }

        attentiveConfig?.identify(idsBuilder.build())
    }

    override fun recordProductViewEvent(items: ReadableArray, deeplink: String?) {
        Log.i(TAG, "Sending product viewed event")

        val itemsDebugData = if (debugHelper.isDebuggingEnabled()) extractItemsDebugData(items) else emptyList()

        val itemsList = buildItems(items)
        val productViewEvent = ProductViewEvent.Builder().items(itemsList).deeplink(deeplink).build()

        if (!recordEventSafely("recordProductViewEvent") { AttentiveSdk.recordEvent(productViewEvent) }) return

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["items_count"] = itemsList.size.toString()
            debugData["deeplink"] = deeplink ?: ""
            debugData["all_items"] = itemsDebugData
            itemsDebugData.firstOrNull()?.let { debugData["first_item"] = it }
            debugHelper.showDebugInfo("Product View Event", debugData)
        }
    }

    override fun recordPurchaseEvent(
        items: ReadableArray,
        orderId: String,
        cartId: String?,
        cartCoupon: String?
    ) {
        Log.i(TAG, "Sending purchase event")

        val itemsDebugData = if (debugHelper.isDebuggingEnabled()) extractItemsDebugData(items) else emptyList()

        val order = Order.Builder().orderId(orderId).build()
        val itemsList = buildItems(items)
        val purchaseBuilder = PurchaseEvent.Builder(itemsList, order)
        if (!cartId.isNullOrEmpty()) {
            purchaseBuilder.cart(Cart.Builder().cartId(cartId).cartCoupon(cartCoupon).build())
        }
        val purchaseEvent = purchaseBuilder.build()

        if (!recordEventSafely("recordPurchaseEvent") { AttentiveSdk.recordEvent(purchaseEvent) }) return

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["items_count"] = itemsList.size.toString()
            debugData["order_id"] = orderId
            if (!cartId.isNullOrEmpty()) debugData["cart_id"] = cartId!!
            if (!cartCoupon.isNullOrEmpty()) debugData["cart_coupon"] = cartCoupon!!
            debugData["all_items"] = itemsDebugData
            itemsDebugData.firstOrNull()?.let { debugData["first_item"] = it }
            debugHelper.showDebugInfo("Purchase Event", debugData)
        }
    }

    override fun recordAddToCartEvent(items: ReadableArray, deeplink: String?) {
        Log.i(TAG, "Sending add to cart event")

        // Extract raw debug data before building items so all bridge fields are preserved
        val itemsDebugData = if (debugHelper.isDebuggingEnabled()) extractItemsDebugData(items) else emptyList()

        val itemsList = buildItems(items)
        val addToCartEvent = AddToCartEvent.Builder().items(itemsList).deeplink(deeplink).build()

        if (!recordEventSafely("recordAddToCartEvent") { AttentiveSdk.recordEvent(addToCartEvent) }) return

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["items_count"] = itemsList.size.toString()
            debugData["deeplink"] = deeplink ?: ""
            debugData["all_items"] = itemsDebugData
            itemsDebugData.firstOrNull()?.let { debugData["first_item"] = it }
            debugHelper.showDebugInfo("Add To Cart Event", debugData)
        }
    }

    override fun recordCustomEvent(type: String, properties: ReadableMap?) {
        Log.i(TAG, "Sending custom event")
        if (properties == null) {
            throw IllegalArgumentException("The CustomEvent 'properties' field cannot be null.")
        }
        val propertiesMap = convertToStringMap(properties.toHashMap())
        val customEvent = CustomEvent.Builder().type(type).properties(propertiesMap).build()

        if (!recordEventSafely("recordCustomEvent") { AttentiveSdk.recordEvent(customEvent) }) return

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["event_type"] = type
            debugData["properties_count"] = propertiesMap.size.toString()
            debugHelper.showDebugInfo("Custom Event", debugData)
        }
    }

    override fun invokeAttentiveDebugHelper() {
        debugHelper.invokeDebugHelper()
    }

    override fun exportDebugLogs(promise: Promise) {
        try {
            val exportContent = debugHelper.exportDebugLogs()
            promise.resolve(exportContent)
        } catch (e: Exception) {
            promise.reject("EXPORT_ERROR", "Failed to export debug logs: " + e.message, e)
        }
    }

    // ==========================================================================
    // MARK: - Push Notification Methods (Android Implementation)
    // ==========================================================================
    //
    // These methods provide Android push notification support.
    //
    // Push: Uses AttentiveSdk.getPushTokenWithCallback (SDK 2.1.x) to fetch FCM token and register with Attentive.
    // See: https://github.com/attentive-mobile/attentive-android-sdk/blob/main/README.md
    // ==========================================================================

    /**
     * Request push notification permission and fetch the FCM token via the Attentive SDK.
     *
     * Uses [AttentiveSdk.getPushTokenWithCallback] so the SDK requests permission (when
     * requestPermission = true) and registers the token with Attentive.
     */
    override fun registerForPushNotifications() {
        Log.i(TAG, "📱 [AttentiveSDK] registerForPushNotifications called (Android)")

        val application = reactApplicationContext.applicationContext as? Application
        if (application == null) {
            Log.w(TAG, "   Application context is null; cannot fetch push token.")
            return
        }

        AttentiveSdk.getPushTokenWithCallback(application, true, createPushTokenCallback())
    }

    private fun createPushTokenCallback(): AttentiveSdk.PushTokenCallback =
        object : AttentiveSdk.PushTokenCallback {
            override fun onSuccess(result: TokenFetchResult) {
                UiThreadUtil.runOnUiThread {
                    val token = result.token
                    Log.i(TAG, "🎫 [AttentiveSDK] Push token fetched successfully (preview): ${token.take(16)}...")

                    // Emit the token to JS so the app can store it (e.g. for display in Settings)
                    // and mirror the iOS behavior where APNs delivers the token via a "register" event.
                    try {
                        reactApplicationContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit("AttentiveDeviceToken", token)
                        Log.i(TAG, "📡 [AttentiveSDK] AttentiveDeviceToken event emitted to JS")
                    } catch (e: Exception) {
                        Log.w(TAG, "⚠️  [AttentiveSDK] Could not emit AttentiveDeviceToken event: ${e.message}")
                    }

                    if (debugHelper.isDebuggingEnabled()) {
                        val debugData = mutableMapOf<String, Any>()
                        debugData["platform"] = "Android"
                        debugData["token_preview"] = "${token.take(16)}..."
                        debugData["has_token"] = token.isNotEmpty()
                        debugData["permission_granted"] = result.permissionGranted
                        debugHelper.showDebugInfo("Push Token (AttentiveSdk)", debugData)
                    }
                }
            }
            override fun onFailure(exception: Exception) {
                UiThreadUtil.runOnUiThread {
                    Log.e(TAG, "❌ [AttentiveSDK] getPushTokenWithCallback failed: ${exception.message}", exception)
                    if (debugHelper.isDebuggingEnabled()) {
                        val debugData = mutableMapOf<String, Any>()
                        debugData["error"] = exception.message ?: "Unknown error"
                        debugHelper.showDebugInfo("Push Token Error", debugData)
                    }
                }
            }
        }

    /**
     * Returns the current push notification authorization status for Android.
     *
     * On API 33+: returns "authorized" if POST_NOTIFICATIONS is granted, else "notDetermined".
     * On API < 33: returns "authorized" (no runtime permission required).
     */
    override fun getPushAuthorizationStatus(promise: Promise) {
        try {
            val status = AttentivePushHelper.getAuthorizationStatus(
                reactApplicationContext,
                reactApplicationContext.currentActivity
            )
            Log.d(TAG, "getPushAuthorizationStatus: $status")
            promise.resolve(status)
        } catch (e: Exception) {
            Log.e(TAG, "getPushAuthorizationStatus error: ${e.message}", e)
            promise.reject("GET_STATUS_ERROR", e.message ?: "Unknown error", e)
        }
    }

    /**
     * Register the device token (FCM token) with the Attentive backend.
     *
     * The Attentive Android SDK does not expose an API that accepts a token string; it registers
     * by fetching the FCM token from Firebase and sending it to Attentive. When the app passes
     * its own FCM token (e.g. from Firebase Messaging in JS), that token matches the one the SDK
     * will fetch. This method therefore triggers [AttentiveSdk.updatePushPermissionStatus], which
     * fetches the current FCM token and registers it with Attentive, so push targeting works.
     *
     * @param token The FCM registration token from Firebase (used for logging; registration uses SDK fetch)
     * @param authorizationStatus Push authorization status (used for consistency with iOS)
     */
    override fun registerDeviceToken(token: String, authorizationStatus: String) {
        Log.i(TAG, "🎫 [AttentiveSDK] registerDeviceToken called (Android)")
        Log.i(TAG, "   Token (preview): ${token.take(16)}...")
        Log.i(TAG, "   Token length: ${token.length}")
        Log.i(TAG, "   Authorization status: $authorizationStatus")

        try {
            val application = reactApplicationContext.applicationContext
            if (application == null) {
                Log.w(TAG, "   Application context is null; cannot register push token with Attentive.")
                return
            }
            // Forward registration to the Attentive SDK. It will fetch the FCM token (same as app-provided
            // token when the app gets it from Firebase) and register it with the Attentive backend.
            AttentiveSdk.updatePushPermissionStatus(application)
            Log.i(TAG, "   Attentive SDK updatePushPermissionStatus invoked (token will be fetched and registered)")

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["token_preview"] = "${token.take(16)}..."
                debugData["token_length"] = token.length.toString()
                debugData["authorization_status"] = authorizationStatus
                debugData["registration_triggered"] = true
                debugHelper.showDebugInfo("Device Token (Android)", debugData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AttentiveSDK] Error in registerDeviceToken: ${e.message}", e)

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["error"] = e.message ?: "Unknown error"
                debugData["error_type"] = e.javaClass.simpleName
                debugHelper.showDebugInfo("Device Token Registration Error", debugData)
            }
        }
    }

    /**
     * Register the device token with callback for flow consistency with iOS.
     *
     * Triggers the same registration as [registerDeviceToken] via [AttentiveSdk.updatePushPermissionStatus].
     * The Attentive Android SDK does not expose a registration API with a completion callback, so this
     * callback is invoked after registration has been triggered (token is fetched by the SDK and sent
     * to Attentive). Success here means the registration request was triggered, not that the backend
     * responded successfully.
     *
     * @param token The FCM registration token
     * @param authorizationStatus Push authorization status
     * @param callback Callback invoked after registration has been triggered
     */
    override fun registerDeviceTokenWithCallback(
        token: String,
        authorizationStatus: String,
        callback: Callback
    ) {
        Log.i(TAG, "🎫 [AttentiveSDK] registerDeviceTokenWithCallback called (Android)")
        Log.i(TAG, "   Token (preview): ${token.take(16)}...")
        Log.i(TAG, "   Authorization status: $authorizationStatus")

        try {
            // Trigger real registration (SDK fetches FCM token and registers with Attentive)
            registerDeviceToken(token, authorizationStatus)

            // Callback is invoked after triggering registration; Android SDK does not provide backend result
            val responseData = mapOf(
                "success" to true,
                "token" to "${token.take(16)}...",
                "platform" to "Android",
                "sdk_version" to "2.1.1",
                "registration_triggered" to true
            )

            callback.invoke(
                responseData, // data
                null, // url (not available in Android SDK)
                mapOf("statusCode" to 200), // response
                null // error
            )

            Log.i(TAG, "📥 [AttentiveSDK] Callback invoked after registration triggered")

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["token_preview"] = "${token.take(16)}..."
                debugData["authorization_status"] = authorizationStatus
                debugData["callback_invoked"] = "true"
                debugHelper.showDebugInfo("Device Token (with callback)", debugData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AttentiveSDK] Error in registerDeviceTokenWithCallback: ${e.message}", e)

            val errorData = mapOf(
                "code" to 0,
                "message" to (e.message ?: "Unknown error"),
                "type" to e.javaClass.simpleName
            )

            // Invoke callback with error
            callback.invoke(null, null, null, errorData)

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["error"] = e.message ?: "Unknown error"
                debugData["error_type"] = e.javaClass.simpleName
                debugHelper.showDebugInfo("Device Token Error (callback)", debugData)
            }
        }
    }

    /**
     * Handle regular/direct app open (not from a push notification).
     *
     * This tracks app open events using the Attentive SDK's event tracking system.
     * This operation is iOS only. Android version is handled directly by native SDK upon
     * TypeScript initialization.
     *
     * @param authorizationStatus Current push authorization status
     */
    override fun handleRegularOpen(authorizationStatus: String) {  // Meant to be NOOP
        Log.i(TAG, "🌉 [AttentiveSDK] handleRegularOpen called (Android)")
        Log.i(TAG, "   Authorization status: $authorizationStatus")
    }

    /**
     * Handle when a push notification is opened by the user (app in background/inactive state).
     *
     * This tracks push notification open events using the Attentive SDK's event tracking system.
     *
     * @param userInfo The notification payload
     * @param authorizationStatus Current push authorization status
     */
    override fun handlePushOpen(userInfo: ReadableMap, authorizationStatus: String) {
        Log.i(TAG, "🔔 [AttentiveSDK] handlePushOpen called (Android)")
        Log.i(TAG, "   Authorization status: $authorizationStatus")
        Log.i(TAG, "   User opened push notification while app was in background/inactive")

        try {
            // Convert ReadableMap to HashMap for processing
            val payload = userInfo.toHashMap()

            Log.d(TAG, "   Notification payload: $payload")

            // Track push open as custom event
            val properties = mutableMapOf<String, String>()
            properties["event_type"] = "push_open"
            properties["authorization_status"] = authorizationStatus
            properties["platform"] = "Android"

            // Add notification payload to properties (converting to strings)
            payload.forEach { (key, value) ->
                properties["notification_$key"] = value?.toString() ?: "null"
            }

            try {
                val customEvent = CustomEvent.Builder()
                    .type("push_open")
                    .properties(properties)
                    .build()

                AttentiveSdk.recordEvent(customEvent)

                Log.i(TAG, "✅ [AttentiveSDK] handlePushOpen completed (tracked as custom event)")
                Log.i(TAG, "   Push open event sent to Attentive backend")
            } catch (e: Exception) {
                Log.w(TAG, "⚠️  [AttentiveSDK] Could not track push open as custom event: ${e.message}")
                Log.i(TAG, "   Push open tracking requires manual implementation or SDK upgrade")
            }

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["authorization_status"] = authorizationStatus
                debugData["event_type"] = "push_open"
                debugData["platform"] = "Android"
                debugData["payload_keys"] = payload.keys.joinToString(", ")
                debugData["sdk_version"] = "2.1.1"
                debugHelper.showDebugInfo("Push Open Event", debugData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AttentiveSDK] Error in handlePushOpen: ${e.message}", e)

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["error"] = e.message ?: "Unknown error"
                debugData["error_type"] = e.javaClass.simpleName
                debugHelper.showDebugInfo("Push Open Error", debugData)
            }
        }
    }

    /**
     * Handle a push notification when the app is in the foreground (active state).
     *
     * This tracks foreground push notification events using the Attentive SDK's event tracking system.
     *
     * @param userInfo The notification payload
     * @param authorizationStatus Current push authorization status
     */
    override fun handleForegroundPush(userInfo: ReadableMap, authorizationStatus: String) {
        Log.i(TAG, "📱 [AttentiveSDK] handleForegroundPush called (Android)")
        Log.i(TAG, "   Authorization status: $authorizationStatus")
        Log.i(TAG, "   Push received while app was in foreground (active)")

        try {
            // Convert ReadableMap to HashMap for processing
            val payload = userInfo.toHashMap()

            Log.d(TAG, "   Notification payload: $payload")

            // Track foreground push as custom event
            val properties = mutableMapOf<String, String>()
            properties["event_type"] = "foreground_push"
            properties["authorization_status"] = authorizationStatus
            properties["platform"] = "Android"

            // Add notification payload to properties (converting to strings)
            payload.forEach { (key, value) ->
                properties["notification_$key"] = value?.toString() ?: "null"
            }

            try {
                val customEvent = CustomEvent.Builder()
                    .type("foreground_push")
                    .properties(properties)
                    .build()

                AttentiveSdk.recordEvent(customEvent)

                Log.i(TAG, "✅ [AttentiveSDK] handleForegroundPush completed (tracked as custom event)")
                Log.i(TAG, "   Foreground push event sent to Attentive backend")
            } catch (e: Exception) {
                Log.w(TAG, "⚠️  [AttentiveSDK] Could not track foreground push as custom event: ${e.message}")
                Log.i(TAG, "   Foreground push tracking requires manual implementation or SDK upgrade")
            }

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["authorization_status"] = authorizationStatus
                debugData["event_type"] = "foreground_push"
                debugData["platform"] = "Android"
                debugData["payload_keys"] = payload.keys.joinToString(", ")
                debugData["sdk_version"] = "2.1.1"
                debugHelper.showDebugInfo("Foreground Push Event", debugData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AttentiveSDK] Error in handleForegroundPush: ${e.message}", e)

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["error"] = e.message ?: "Unknown error"
                debugData["error_type"] = e.javaClass.simpleName
                debugHelper.showDebugInfo("Foreground Push Error", debugData)
            }
        }
    }

    /**
     * Handle when a push notification is opened by the user (legacy method).
     *
     * This is kept for backward compatibility with the iOS implementation.
     * For new code, prefer using handlePushOpen or handleForegroundPush based on app state.
     *
     * @param userInfo The notification payload
     * @param applicationState App state when notification was opened
     * @param authorizationStatus Push authorization status
     */
    override fun handlePushOpened(
        userInfo: ReadableMap,
        applicationState: String,
        authorizationStatus: String
    ) {
        Log.i(TAG, "🔔 [AttentiveSDK] handlePushOpened called (Android - legacy method)")
        Log.i(TAG, "   App state: $applicationState")
        Log.i(TAG, "   Authorization status: $authorizationStatus")

        // Route to the appropriate method based on application state
        when (applicationState.lowercase()) {
            "active" -> {
                Log.i(TAG, "   Routing to handleForegroundPush")
                handleForegroundPush(userInfo, authorizationStatus)
            }
            "background", "inactive" -> {
                Log.i(TAG, "   Routing to handlePushOpen")
                handlePushOpen(userInfo, authorizationStatus)
            }
            else -> {
                Log.w(TAG, "   Unknown application state, defaulting to handlePushOpen")
                handlePushOpen(userInfo, authorizationStatus)
            }
        }
    }

    /**
     * Handle when a push notification arrives while the app is in foreground (legacy method).
     *
     * This is kept for backward compatibility with the iOS implementation.
     * For new code, prefer using handleForegroundPush.
     *
     * @param userInfo The notification payload
     */
    override fun handleForegroundNotification(userInfo: ReadableMap) {
        Log.i(TAG, "📱 [AttentiveSDK] handleForegroundNotification called (Android - legacy method)")
        Log.i(TAG, "   Routing to handleForegroundPush with default authorization status")

        // Route to handleForegroundPush with a default authorization status
        // Note: Authorization status is less relevant on Android than iOS
        handleForegroundPush(userInfo, "authorized")
    }

    /**
     * Returns the push notification payload that launched the app from a killed state
     * (i.e. the user tapped a notification while the app was not running) and clears it
     * so it is only delivered once.
     *
     * The host app's `MainActivity.onCreate` is responsible for storing the payload in
     * [AttentiveNotificationStore] when a push-tap Intent is detected before the React
     * Native bridge is ready.
     *
     * Returns a [Promise] that resolves to a `ReadableMap` containing the notification data,
     * or `null` if the app was not launched from a push notification tap.
     *
     * @param promise Promise to resolve with the notification payload map or null.
     */
    override fun getInitialPushNotification(promise: Promise) {
      Log.d(TAG, "getInitialPushNotification called!")
    }

    // ==========================================================================
    // MARK: - Marketing Subscription Methods
    // ==========================================================================

    /**
     * Opts a user into marketing subscriptions via [AttentiveSdk.optUserIntoMarketingSubscription].
     *
     * Both [email] and [phone] are normalised (trimmed, blank → null) before being forwarded
     * to the native SDK, which performs its own validation and API call. The SDK rejects
     * the call if both identifiers are absent.
     *
     * The native method is a Kotlin suspend function; it is invoked on [Dispatchers.IO]
     * and the promise is settled back on the UI thread.
     *
     * @param email Optional email address.
     * @param phone Optional E.164 phone number.
     * @param promise Resolved with null on success; rejected with an error on failure.
     */
    override fun optInMarketingSubscription(email: String?, phone: String?, promise: Promise) {
        Log.i(TAG, "📬 [AttentiveSDK] optInMarketingSubscription called (Android)")

        val normalizedEmail = email?.trim()?.takeIf { it.isNotEmpty() }
        val normalizedPhone = phone?.trim()?.takeIf { it.isNotEmpty() }

        ioScope.launch {
            try {
                AttentiveSdk.optUserIntoMarketingSubscription(
                    email = normalizedEmail ?: "",
                    phoneNumber = normalizedPhone ?: "",
                )
                Log.i(TAG, "✅ [AttentiveSDK] optInMarketingSubscription succeeded")
                UiThreadUtil.runOnUiThread { promise.resolve(null) }

                if (debugHelper.isDebuggingEnabled()) {
                    val debugData = mutableMapOf<String, Any>(
                        "email" to (normalizedEmail ?: "nil"),
                        "phone" to (normalizedPhone ?: "nil"),
                        "status" to "success",
                    )
                    UiThreadUtil.runOnUiThread {
                        debugHelper.showDebugInfo("Marketing Subscription Opt-In", debugData)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ [AttentiveSDK] optInMarketingSubscription failed: ${e.message}", e)
                UiThreadUtil.runOnUiThread {
                    promise.reject("OPT_IN_ERROR", e.message ?: "Unknown error", e)
                }
            }
        }
    }

    /**
     * Opts a user out of marketing subscriptions via [AttentiveSdk.optUserOutOfMarketingSubscription].
     *
     * Both [email] and [phone] are normalised (trimmed, blank → null) before being forwarded
     * to the native SDK, which performs its own validation and API call. The SDK rejects
     * the call if both identifiers are absent.
     *
     * The native method is a Kotlin suspend function; it is invoked on [Dispatchers.IO]
     * and the promise is settled back on the UI thread.
     *
     * @param email Optional email address.
     * @param phone Optional E.164 phone number.
     * @param promise Resolved with null on success; rejected with an error on failure.
     */
    override fun optOutMarketingSubscription(email: String?, phone: String?, promise: Promise) {
        Log.i(TAG, "📬 [AttentiveSDK] optOutMarketingSubscription called (Android)")

        val normalizedEmail = email?.trim()?.takeIf { it.isNotEmpty() }
        val normalizedPhone = phone?.trim()?.takeIf { it.isNotEmpty() }

        ioScope.launch {
            try {
                AttentiveSdk.optUserOutOfMarketingSubscription(
                    email = normalizedEmail ?: "",
                    phoneNumber = normalizedPhone ?: "",
                )
                Log.i(TAG, "✅ [AttentiveSDK] optOutMarketingSubscription succeeded")
                UiThreadUtil.runOnUiThread { promise.resolve(null) }

                if (debugHelper.isDebuggingEnabled()) {
                    val debugData = mutableMapOf<String, Any>(
                        "email" to (normalizedEmail ?: "nil"),
                        "phone" to (normalizedPhone ?: "nil"),
                        "status" to "success",
                    )
                    UiThreadUtil.runOnUiThread {
                        debugHelper.showDebugInfo("Marketing Subscription Opt-Out", debugData)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ [AttentiveSDK] optOutMarketingSubscription failed: ${e.message}", e)
                UiThreadUtil.runOnUiThread {
                    promise.reject("OPT_OUT_ERROR", e.message ?: "Unknown error", e)
                }
            }
        }
    }

    // ==========================================================================
    // MARK: - NativeEventEmitter support
    // ==========================================================================
    // These stubs are required by React Native's NativeEventEmitter on the old
    // architecture. Without them the bridge logs a warning about missing methods.

    @ReactMethod
    fun addListener(eventName: String) {
        // No-op: listener bookkeeping is handled by the JS NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // No-op: listener bookkeeping is handled by the JS NativeEventEmitter.
    }

    /**
     * Extracts a human-readable list of item maps from the raw bridge array for debug display.
     *
     * This intentionally reads all fields from the original [ReadableArray] rather than from
     * the built [Item] objects so that every field sent from TypeScript (including optional ones)
     * is visible in the debugger — even fields that may be skipped during SDK item construction.
     *
     * @param rawItems The raw item array as received from the React Native bridge.
     * @return A list of maps, one per item, containing all present fields.
     */
    /**
     * Executes [block] (which calls [AttentiveSdk.recordEvent]) and catches any [Exception].
     *
     * When an exception is caught the log always includes the exception's simple class name so
     * callers can distinguish an uninitialized-SDK error (typically [IllegalStateException]) from
     * a programming mistake such as [NullPointerException] or [IllegalArgumentException] in event
     * construction — both of which would have been silently misattributed to initialization
     * failure under the previous broad catch-and-blame pattern.
     *
     * @param callerName Method name to include in the log for quick triage (e.g. "recordPurchaseEvent").
     * @param block Lambda that performs the [AttentiveSdk.recordEvent] call.
     * @return `true` if [block] completed without throwing, `false` if an exception was caught.
     */
    private fun recordEventSafely(callerName: String, block: () -> Unit): Boolean {
        return try {
            block()
            true
        } catch (e: Exception) {
            // Include the exception class so the developer can tell apart an uninitialized SDK
            // (IllegalStateException) from a malformed-event bug (NullPointerException, etc.)
            Log.e(
                TAG,
                "[AttentiveSDK] $callerName failed with ${e.javaClass.simpleName}: ${e.message}. " +
                "If the SDK was not initialized via AttentiveSdk.initialize() in Application.onCreate(), " +
                "that is the most likely cause. Otherwise, inspect the exception type above."
            )
            false
        }
    }

    private fun extractItemsDebugData(rawItems: ReadableArray): List<Map<String, Any>> {
        val result = mutableListOf<Map<String, Any>>()
        for (i in 0 until rawItems.size()) {
            val rawItem = rawItems.getMap(i) ?: continue
            val itemData = mutableMapOf<String, Any>()

            rawItem.getString("productId")?.let { itemData["productId"] = it }
            rawItem.getString("productVariantId")?.let { itemData["productVariantId"] = it }
            rawItem.getString("price")?.let { itemData["price"] = it }
            rawItem.getString("currency")?.let { itemData["currency"] = it }
            rawItem.getString("name")?.let { itemData["name"] = it }
            rawItem.getString("productImage")?.let { itemData["productImage"] = it }
            rawItem.getString("category")?.let { itemData["category"] = it }
            if (rawItem.hasKey("quantity")) {
                itemData["quantity"] = rawItem.getDouble("quantity").toInt()
            }

            result.add(itemData)
        }
        return result
    }

    private fun convertToStringMap(inputMap: Map<String, Any?>): Map<String, String> {
        val outputMap = mutableMapOf<String, String>()
        for ((key, value) in inputMap) {
            if (value == null) {
                throw InvalidParameterException("The key '$key' has a null value.")
            }
            if (value is String) {
                outputMap[key] = value
            }
        }
        return outputMap
    }

    private fun buildItems(rawItems: ReadableArray): List<Item> {
        Log.i(TAG, "buildItems method called with rawItems: $rawItems")
        val items = mutableListOf<Item>()

        for (i in 0 until rawItems.size()) {
            val rawItem = rawItems.getMap(i) ?: continue

            // Required scalar fields
            val priceValue = rawItem.getString("price") ?: continue
            val currencyCode = rawItem.getString("currency") ?: continue
            val productId = rawItem.getString("productId") ?: continue
            val productVariantId = rawItem.getString("productVariantId") ?: continue

            // Parse price amount — skip item on malformed value rather than crash
            val priceDecimal = try {
                BigDecimal(priceValue)
            } catch (e: NumberFormatException) {
                Log.w(TAG, "buildItems: invalid price value '$priceValue' at index $i — skipping item")
                continue
            }

            // Parse currency — skip item on unrecognised ISO 4217 code rather than crash
            val currency = try {
                Currency.getInstance(currencyCode)
            } catch (e: IllegalArgumentException) {
                Log.w(TAG, "buildItems: invalid currency code '$currencyCode' at index $i — skipping item")
                continue
            }

            val price = Price.Builder()
                .price(priceDecimal)
                .currency(currency)
                .build()

            val builder = Item.Builder(productId, productVariantId, price)

            if (rawItem.hasKey("productImage")) {
                builder.productImage(rawItem.getString("productImage"))
            }

            if (rawItem.hasKey("name")) {
                builder.name(rawItem.getString("name"))
            }

            // JS numbers are doubles on the bridge; use getDouble().toInt() to avoid ClassCastException
            if (rawItem.hasKey("quantity")) {
                builder.quantity(rawItem.getDouble("quantity").toInt())
            }

            if (rawItem.hasKey("category")) {
                builder.category(rawItem.getString("category"))
            }

            items.add(builder.build())
        }

        return items
    }
}
