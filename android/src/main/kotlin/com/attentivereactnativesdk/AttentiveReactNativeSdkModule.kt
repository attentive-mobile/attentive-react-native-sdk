package com.attentivereactnativesdk

import android.app.Activity
import android.util.Log
import android.view.ViewGroup
import androidx.annotation.NonNull
import androidx.annotation.Nullable
import com.attentive.androidsdk.AttentiveConfig
import com.attentive.androidsdk.AttentiveEventTracker
import com.attentive.androidsdk.UserIdentifiers
import com.attentive.androidsdk.creatives.Creative
import com.attentive.androidsdk.events.AddToCartEvent
import com.attentive.androidsdk.events.CustomEvent
import com.attentive.androidsdk.events.Item
import com.attentive.androidsdk.events.Order
import com.attentive.androidsdk.events.Price
import com.attentive.androidsdk.events.ProductViewEvent
import com.attentive.androidsdk.events.PurchaseEvent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Callback
import com.attentivereactnativesdk.debug.AttentiveDebugHelper
import java.math.BigDecimal
import java.security.InvalidParameterException
import java.util.Currency
import java.util.Locale

class AttentiveReactNativeSdkModule(reactContext: ReactApplicationContext) :
    NativeAttentiveReactNativeSdkSpec(reactContext) {

    companion object {
        const val NAME = "AttentiveReactNativeSdk"
        private const val TAG = NAME
    }

    private var attentiveConfig: AttentiveConfig? = null
    private var creative: Creative? = null
    private val debugHelper: AttentiveDebugHelper

    init {
        debugHelper = AttentiveDebugHelper(reactContext)
    }

    override fun getName(): String {
        return NAME
    }

    override fun initialize(
        attentiveDomain: String,
        mode: String,
        skipFatigueOnCreatives: Boolean,
        enableDebugger: Boolean
    ) {
        // Initialize debug helper
        debugHelper.initialize(enableDebugger)

        attentiveConfig = AttentiveConfig.Builder()
            .context(reactApplicationContext)
            .domain(attentiveDomain)
            .mode(AttentiveConfig.Mode.valueOf(mode.uppercase(Locale.ROOT)))
            .skipFatigueOnCreatives(skipFatigueOnCreatives)
            .build()
        AttentiveEventTracker.getInstance().initialize(attentiveConfig)
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
                    creative = Creative(attentiveConfig, rootView)
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

        val itemsList = buildItems(items)
        val productViewEvent = ProductViewEvent.Builder(itemsList).deeplink(deeplink).build()

        AttentiveEventTracker.getInstance().recordEvent(productViewEvent)

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["items_count"] = itemsList.size.toString()
            debugData["deeplink"] = deeplink ?: ""
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
        val order = Order.Builder(orderId).build()

        val itemsList = buildItems(items)
        val purchaseEvent = PurchaseEvent.Builder(itemsList, order).build()

        AttentiveEventTracker.getInstance().recordEvent(purchaseEvent)

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["items_count"] = itemsList.size.toString()
            debugData["order_id"] = orderId
            if (cartId != null) debugData["cart_id"] = cartId
            if (cartCoupon != null) debugData["cart_coupon"] = cartCoupon
            debugHelper.showDebugInfo("Purchase Event", debugData)
        }
    }

    override fun recordAddToCartEvent(items: ReadableArray, deeplink: String?) {
        Log.i(TAG, "Sending add to cart event")

        val itemsList = buildItems(items)
        val addToCartEvent = AddToCartEvent.Builder(itemsList).deeplink(deeplink).build()

        AttentiveEventTracker.getInstance().recordEvent(addToCartEvent)

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["items_count"] = itemsList.size.toString()
            debugData["deeplink"] = deeplink ?: ""
            debugHelper.showDebugInfo("Add To Cart Event", debugData)
        }
    }

    override fun recordCustomEvent(type: String, properties: ReadableMap?) {
        Log.i(TAG, "Sending custom event")
        if (properties == null) {
            throw IllegalArgumentException("The CustomEvent 'properties' field cannot be null.")
        }
        val propertiesMap = convertToStringMap(properties.toHashMap())
        val customEvent = CustomEvent.Builder(type, propertiesMap).build()

        AttentiveEventTracker.getInstance().recordEvent(customEvent)

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
    // IMPORTANT NOTE: The Attentive Android SDK version 1.0.1 has limited push notification
    // support compared to version 2.x. These methods provide logging and debugging infrastructure
    // but may require SDK upgrade or custom implementation for full functionality.
    //
    // The iOS implementation uses APNs; Android uses Firebase Cloud Messaging (FCM).
    // ==========================================================================

    /**
     * Request push notification permission from the user.
     *
     * Note: For Android 13+ (API 33+), you need to request POST_NOTIFICATIONS permission
     * in your app's AndroidManifest.xml and request it at runtime.
     * For older versions, permissions are granted at install time.
     *
     * This method is currently a logging placeholder for parity with iOS.
     * Actual permission handling should be done in the host app.
     */
    override fun registerForPushNotifications() {
        Log.i(TAG, "📱 [AttentiveSDK] registerForPushNotifications called (Android)")
        Log.i(TAG, "   Note: Push notification permissions should be requested in your host app")
        Log.i(TAG, "   For Android 13+, request POST_NOTIFICATIONS permission at runtime")

        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["platform"] = "Android"
            debugData["sdk_version"] = "1.0.1"
            debugData["note"] = "Permission handling should be done in host app"
            debugHelper.showDebugInfo("Push Registration Requested", debugData)
        }
    }

    /**
     * Register the device token (FCM token) with the Attentive backend.
     *
     * This method attempts to register the FCM push token with the Attentive SDK.
     * Note: The exact API for push token registration may vary by SDK version.
     *
     * @param token The FCM registration token from Firebase
     * @param authorizationStatus Push authorization status (used for consistency with iOS)
     */
    override fun registerDeviceToken(token: String, authorizationStatus: String) {
        Log.i(TAG, "🎫 [AttentiveSDK] registerDeviceToken called (Android)")
        Log.i(TAG, "   Token (preview): ${token.take(16)}...")
        Log.i(TAG, "   Token length: ${token.length}")
        Log.i(TAG, "   Authorization status: $authorizationStatus")

        try {
            // Note: Attentive Android SDK 1.0.1 may not have direct push token registration
            // For SDK version 2.x, use: AttentiveConfig.setDeviceToken() or similar
            // For now, we log the token and make it available for custom implementation
            
            Log.i(TAG, "⚠️  [AttentiveSDK] Push token registration requires manual implementation")
            Log.i(TAG, "   FCM token available: ${token.take(16)}...")
            Log.i(TAG, "   Store this token and register it with Attentive backend manually")
            Log.i(TAG, "   Or upgrade to Attentive Android SDK 2.x for built-in support")

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["token_preview"] = "${token.take(16)}..."
                debugData["token_length"] = token.length.toString()
                debugData["authorization_status"] = authorizationStatus
                debugData["sdk_version"] = "1.0.1"
                debugData["implementation_status"] = "manual_required"
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
     * Register the device token with callback for network response tracking.
     *
     * Note: The Android SDK version 1.0.1 doesn't provide a callback mechanism for
     * push token registration. This method logs the token and invokes the callback
     * immediately for consistency with the iOS API.
     *
     * @param token The FCM registration token
     * @param authorizationStatus Push authorization status
     * @param callback Callback invoked after registration attempt
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
            // Register using the standard method (which logs the token)
            registerDeviceToken(token, authorizationStatus)

            // Invoke callback immediately with success response
            val responseData = mapOf(
                "success" to true,
                "token" to "${token.take(16)}...",
                "platform" to "Android",
                "sdk_version" to "1.0.1",
                "note" to "Manual push token registration required"
            )

            // Invoke callback with: data, url, response, error
            callback.invoke(
                responseData, // data
                null, // url (not available in Android SDK)
                mapOf("statusCode" to 200), // response
                null // error
            )

            Log.i(TAG, "📥 [AttentiveSDK] Callback invoked with success response")

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
     *
     * @param authorizationStatus Current push authorization status
     */
    override fun handleRegularOpen(authorizationStatus: String) {
        Log.i(TAG, "🌉 [AttentiveSDK] handleRegularOpen called (Android)")
        Log.i(TAG, "   Authorization status: $authorizationStatus")
        Log.i(TAG, "   Tracking regular app open event...")

        try {
            // Attentive Android SDK 1.0.1 doesn't have a built-in handleRegularOpen method
            // We can track this as a custom event or use AttentiveEventTracker
            
            // Option 1: Track as custom event
            val properties = mapOf(
                "event_type" to "app_open",
                "authorization_status" to authorizationStatus,
                "platform" to "Android"
            )
            
            try {
                val customEvent = com.attentive.androidsdk.events.CustomEvent.Builder(
                    "app_open",
                    properties
                ).build()
                
                AttentiveEventTracker.getInstance().recordEvent(customEvent)
                
                Log.i(TAG, "✅ [AttentiveSDK] handleRegularOpen completed (tracked as custom event)")
                Log.i(TAG, "   Event sent to Attentive backend")
            } catch (e: Exception) {
                Log.w(TAG, "⚠️  [AttentiveSDK] Could not track app open as custom event: ${e.message}")
                Log.i(TAG, "   App open tracking requires manual implementation or SDK upgrade")
            }

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["authorization_status"] = authorizationStatus
                debugData["event_type"] = "regular_open"
                debugData["platform"] = "Android"
                debugData["sdk_version"] = "1.0.1"
                debugHelper.showDebugInfo("Regular Open Event", debugData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AttentiveSDK] Error in handleRegularOpen: ${e.message}", e)

            if (debugHelper.isDebuggingEnabled()) {
                val debugData = mutableMapOf<String, Any>()
                debugData["error"] = e.message ?: "Unknown error"
                debugData["error_type"] = e.javaClass.simpleName
                debugHelper.showDebugInfo("Regular Open Error", debugData)
            }
        }
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
                val customEvent = com.attentive.androidsdk.events.CustomEvent.Builder(
                    "push_open",
                    properties
                ).build()
                
                AttentiveEventTracker.getInstance().recordEvent(customEvent)
                
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
                debugData["sdk_version"] = "1.0.1"
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
                val customEvent = com.attentive.androidsdk.events.CustomEvent.Builder(
                    "foreground_push",
                    properties
                ).build()
                
                AttentiveEventTracker.getInstance().recordEvent(customEvent)
                
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
                debugData["sdk_version"] = "1.0.1"
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

            // Price and currency are now flattened, not nested
            val priceValue = rawItem.getString("price")
            val currencyCode = rawItem.getString("currency")
            val price = Price.Builder(BigDecimal(priceValue), Currency.getInstance(currencyCode)).build()

            val builder = Item.Builder(rawItem.getString("productId"), rawItem.getString("productVariantId"), price)

            if (rawItem.hasKey("productImage")) {
                builder.productImage(rawItem.getString("productImage"))
            }

            if (rawItem.hasKey("name")) {
                builder.name(rawItem.getString("name"))
            }

            if (rawItem.hasKey("quantity")) {
                builder.quantity(rawItem.getInt("quantity"))
            }

            if (rawItem.hasKey("category")) {
                builder.category(rawItem.getString("category"))
            }

            val item = builder.build()
            items.add(item)
        }

        return items
    }
}
