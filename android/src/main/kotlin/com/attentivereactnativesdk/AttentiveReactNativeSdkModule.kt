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
    // MARK: - Push Notification Methods (Android Implementation - TODO)
    // ==========================================================================
    //
    // These methods are stubs for Android push notification support.
    // Android push notifications typically use Firebase Cloud Messaging (FCM)
    // and require different handling than iOS APNs.
    //
    // TODO: Implement Android push notification support
    // - Integrate with Firebase Cloud Messaging (FCM)
    // - Register FCM token with Attentive backend
    // - Handle push notification opens and foreground notifications
    // - Consider using the attentive-android-sdk's push notification features if available
    //
    // Reference: The iOS implementation uses:
    // - registerForPushNotifications() - Request permission
    // - registerDeviceToken() - Send token to backend
    // - handlePushOpened() - Track push open events
    // - handleForegroundNotification() - Handle foreground push display
    // ==========================================================================

    /**
     * Request push notification permission from the user.
     *
     * TODO: Implement for Android
     * - For Android 13+ (API 33+), request POST_NOTIFICATIONS permission
     * - For older versions, permissions are granted at install time
     * - Initialize FCM and get the registration token
     */
    override fun registerForPushNotifications() {
        Log.i(TAG, "[TODO] registerForPushNotifications called - Android implementation pending")
        // TODO: Implement Android push notification registration
        // 1. Check/request POST_NOTIFICATIONS permission (Android 13+)
        // 2. Initialize Firebase Cloud Messaging
        // 3. Get FCM registration token
        // 4. Register token with Attentive backend
    }

    /**
     * Register the device token with the Attentive backend.
     *
     * TODO: Implement for Android
     * - Android uses FCM tokens instead of APNs tokens
     * - Token format and registration endpoint may differ
     *
     * @param token The FCM registration token
     * @param authorizationStatus Push authorization status (may not apply to Android)
     */
    override fun registerDeviceToken(token: String, authorizationStatus: String) {
        Log.i(TAG, "[TODO] registerDeviceToken called - Android implementation pending")
        Log.d(TAG, "Token: ${token.take(16)}..., Status: $authorizationStatus")
        // TODO: Implement Android device token registration
        // 1. Send FCM token to Attentive backend
        // 2. Handle token refresh via FirebaseMessagingService.onNewToken()
    }

    /**
     * Handle when a push notification is opened by the user.
     *
     * TODO: Implement for Android
     * - Track push open events with Attentive
     * - Handle deep linking if present in payload
     *
     * @param userInfo The notification payload (from FCM RemoteMessage data)
     * @param applicationState App state when notification was opened
     * @param authorizationStatus Push authorization status
     */
    override fun handlePushOpened(
        userInfo: ReadableMap,
        applicationState: String,
        authorizationStatus: String
    ) {
        Log.i(TAG, "[TODO] handlePushOpened called - Android implementation pending")
        Log.d(TAG, "App state: $applicationState, Auth status: $authorizationStatus")
        // TODO: Implement Android push open tracking
        // 1. Parse notification payload
        // 2. Send push open event to Attentive backend
        // 3. Handle any deep links in the payload
    }

    /**
     * Handle when a push notification arrives while the app is in foreground.
     *
     * TODO: Implement for Android
     * - Android handles foreground notifications differently than iOS
     * - By default, FCM data messages don't show UI in foreground
     * - Need to create NotificationCompat.Builder to show notification
     *
     * @param userInfo The notification payload
     */
    override fun handleForegroundNotification(userInfo: ReadableMap) {
        Log.i(TAG, "[TODO] handleForegroundNotification called - Android implementation pending")
        // TODO: Implement Android foreground notification handling
        // 1. Create notification channel (required for Android 8+)
        // 2. Build and display notification using NotificationCompat
        // 3. Track foreground notification event with Attentive
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
