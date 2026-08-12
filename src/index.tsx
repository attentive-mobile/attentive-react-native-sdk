import { DeviceEventEmitter, Platform } from 'react-native'
import type {
  UserIdentifiers,
  AttentiveSdkConfiguration,
  ProductView,
  Purchase,
  AddToCart,
  CustomEvent,
  Item,
  CreativeStatus,
  CreativeEvent,
  CreativeEventSubscription,
  PushAuthorizationStatus,
  ApplicationState,
  PushNotificationUserInfo,
  PushRegistrationResult,
  MarketingSubscriptionParams,
  UpdateUserParams,
} from './eventTypes'
import { CREATIVE_STATUSES } from './eventTypes'
import NativeAttentiveReactNativeSdkModule, {
  type Spec,
} from './NativeAttentiveReactNativeSdk'

const LINKING_ERROR =
  `The package 'attentive-react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({
    ios: "- You have run 'pod install'\n",
    default: '',
  }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const AttentiveReactNativeSdk = (
  NativeAttentiveReactNativeSdkModule
    ? NativeAttentiveReactNativeSdkModule
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR)
          },
        }
      )
) as Spec

/**
 * Initialize the Attentive SDK with the provided configuration.
 *
 * Initialization is asymmetric across platforms:
 * - **iOS:** call this once at startup (e.g. in the root component's `useEffect`). The call is
 *   forwarded to the native module, which initializes the native iOS Attentive SDK.
 * - **Android:** this call is a no-op. The Android SDK must be initialized in native code from
 *   your `Application.onCreate()` via `AttentiveSdk.initialize(AttentiveConfig...)`, so that
 *   lifecycle observers register on the main thread before the React Native bridge is ready.
 *   See the README "Android — Initialize from Native Code" section.
 *
 * Calling this unconditionally is safe; it is harmless on Android.
 *
 * @param configuration - Configuration object for the Attentive SDK
 */
function initialize(configuration: AttentiveSdkConfiguration) {
  AttentiveReactNativeSdk.initialize(
    configuration.attentiveDomain,
    configuration.mode,
    configuration.skipFatigueOnCreatives ?? false,
    configuration.enableDebugger ?? false
  )
}

/**
 * Trigger a creative with an optional creative ID
 * @param creativeId - Optional creative ID to trigger
 */
function triggerCreative(creativeId?: string) {
  AttentiveReactNativeSdk.triggerCreative(creativeId)
}

/**
 * Destroy the current creative
 */
function destroyCreative() {
  AttentiveReactNativeSdk.destroyCreative()
}

/**
 * Narrows an untyped device-event status onto the published `CreativeStatus` union, so the
 * runtime allowlist and the compile-time union can never drift apart.
 */
const isCreativeStatus = (value?: string): value is CreativeStatus =>
  CREATIVE_STATUSES.includes(value as CreativeStatus)

/**
 * Statuses already warned about, so an unrecognized status logs once per app session instead of
 * once per active subscriber. Each `addCreativeEventListener` call installs its own device-event
 * wrapper, so without this a single unknown status would log N identical lines for N listeners.
 * A `Set` rather than a `WeakSet` because statuses are strings, which a `WeakSet` cannot hold.
 */
const warnedUnknownStatuses = new Set<string>()

/**
 * Device-event name carrying creative lifecycle transitions.
 *
 * This string is a contract shared with both native bridges — `AttentiveReactNativeSdk.mm`
 * emits it through `callableJSModules`, and `AttentiveReactNativeSdkModule.kt` through
 * `RCTDeviceEventEmitter`. Changing it here without changing both native sides silently
 * stops all creative events.
 */
const CREATIVE_EVENT_NAME = 'AttentiveCreativeEvent'

/**
 * Subscribe to creative lifecycle events.
 *
 * A single `triggerCreative` call produces more than one event over time — `opened` when the
 * creative renders and `closed` when the user dismisses it — or a single `notOpened` when it
 * could not be shown at all (no creative configured, fatigued, load timed out). Because the
 * lifecycle is a stream rather than a one-shot result, it is delivered as events instead of a
 * callback or a promise.
 *
 * ```ts
 * useEffect(() => {
 *   const subscription = addCreativeEventListener(({ status, creativeId }) => {
 *     console.log('creative', creativeId ?? 'default', status)
 *   })
 *   return () => subscription.remove()
 * }, [])
 * ```
 *
 * Supported on React Native 0.74+: events travel as `RCTDeviceEventEmitter` device events rather
 * than through a codegen event emitter, which would have required 0.76+. The transport works on
 * both architectures, but on iOS the New Architecture is still required — the native module only
 * exports its methods under `RCT_NEW_ARCH_ENABLED` (see MSDK-350).
 *
 * @param listener - Invoked for each lifecycle transition
 * @returns A subscription; call `remove()` to stop receiving events
 */
function addCreativeEventListener(
  listener: (event: CreativeEvent) => void
): CreativeEventSubscription {
  return DeviceEventEmitter.addListener(
    CREATIVE_EVENT_NAME,
    (event: { status?: string; creativeId?: string }) => {
      // Native sends the normalized vocabulary, but this is an untyped device event: guard so a
      // status added by a future native SDK surfaces as a warning instead of breaking the
      // CreativeStatus union that consumers switch on.
      const status = event?.status
      if (!isCreativeStatus(status)) {
        const key = String(status)
        if (!warnedUnknownStatuses.has(key)) {
          warnedUnknownStatuses.add(key)
          console.warn(
            `[AttentiveSDK] Ignoring creative event with unrecognized status "${key}".`
          )
        }
        return
      }

      // Build the event without a `creativeId` key at all when there is no id, rather than
      // setting it to undefined: `creativeId` is an optional property, so consumers are entitled
      // to test it with `'creativeId' in event`.
      const creativeEvent: CreativeEvent = { status }
      if (event.creativeId != null) {
        creativeEvent.creativeId = event.creativeId
      }

      // Isolate the consumer's listener. React Native's EventEmitter.emit has no try/catch, so a
      // listener that throws would abort the emit loop — every other subscriber to this event
      // would silently stop receiving it — and the exception would escape into the native->JS
      // call. Both native emitters already log rather than throw; this keeps the JS edge of the
      // bridge to the same rule.
      try {
        listener(creativeEvent)
      } catch (error) {
        console.error(
          `[AttentiveSDK] A creative event listener threw while handling "${status}". Other listeners are unaffected.`,
          error
        )
      }
    }
  )
}

/**
 * Update the Attentive domain
 * @param domain - New domain to use
 */
function updateDomain(domain: string) {
  AttentiveReactNativeSdk.updateDomain(domain)
}

/**
 * Identify a user with the provided identifiers
 * @param identifiers - User identifier object containing phone, email, etc.
 */
function identify(identifiers: UserIdentifiers) {
  AttentiveReactNativeSdk.identify(
    identifiers.phone,
    identifiers.email,
    identifiers.klaviyoId,
    identifiers.shopifyId,
    identifiers.clientUserId,
    identifiers.customIdentifiers
  )
}

/**
 * Clear the current user identification
 */
function clearUser() {
  AttentiveReactNativeSdk.clearUser()
}

/**
 * Record an add to cart event
 * @param attrs - Event attributes containing items and optional deeplink
 */
function recordAddToCartEvent(attrs: AddToCart) {
  AttentiveReactNativeSdk.recordAddToCartEvent(attrs.items, attrs.deeplink)
}

/**
 * Record a product view event
 * @param attrs - Event attributes containing items and optional deeplink
 */
function recordProductViewEvent(attrs: ProductView) {
  AttentiveReactNativeSdk.recordProductViewEvent(attrs.items, attrs.deeplink)
}

/**
 * Record a purchase event
 * @param attrs - Event attributes containing items, order ID, and optional cart details
 */
function recordPurchaseEvent(attrs: Purchase) {
  AttentiveReactNativeSdk.recordPurchaseEvent(
    attrs.items,
    attrs.orderId,
    attrs.cartId,
    attrs.cartCoupon
  )
}

/**
 * Record a custom event
 * @param attrs - Custom event attributes containing type and properties
 */
function recordCustomEvent(attrs: CustomEvent) {
  AttentiveReactNativeSdk.recordCustomEvent(attrs.type, attrs.properties)
}

/**
 * Invoke the Attentive debug helper
 */
function invokeAttentiveDebugHelper() {
  AttentiveReactNativeSdk.invokeAttentiveDebugHelper()
}

/**
 * Export debug logs
 * @returns Promise that resolves to a string containing the debug logs
 */
function exportDebugLogs(): Promise<string> {
  return AttentiveReactNativeSdk.exportDebugLogs()
}

// =============================================================================
// Push Notification Methods (iOS and Android)
// =============================================================================

/**
 * Request push notification permission from the user.
 * On iOS, this will trigger the system permission dialog.
 * On Android 13+, this requests POST_NOTIFICATIONS; on older versions, no-op.
 *
 * @example
 * ```typescript
 * import { registerForPushNotifications } from 'attentive-react-native-sdk';
 *
 * // Request permission (typically called after user onboarding)
 * registerForPushNotifications();
 * ```
 */
function registerForPushNotifications(): void {
  AttentiveReactNativeSdk.registerForPushNotifications()
}

/**
 * Get the current push notification authorization status.
 * On Android, uses the SDK's native check (POST_NOTIFICATIONS on API 33+).
 * On iOS, uses UNUserNotificationCenter notification settings.
 *
 * @returns Promise resolving to 'authorized' | 'denied' | 'notDetermined' (and on iOS possibly 'provisional' | 'ephemeral')
 *
 * @example
 * ```typescript
 * import { getPushAuthorizationStatus, handleRegularOpen } from 'attentive-react-native-sdk';
 *
 * getPushAuthorizationStatus().then((status) => handleRegularOpen(status));
 * ```
 */
function getPushAuthorizationStatus(): Promise<PushAuthorizationStatus> {
  return AttentiveReactNativeSdk.getPushAuthorizationStatus() as Promise<PushAuthorizationStatus>
}

/**
 * Register the device token received from APNs/FCM with the Attentive backend.
 * Call this from your AppDelegate's didRegisterForRemoteNotificationsWithDeviceToken.
 *
 * On iOS, the token should be the hex-encoded string representation of the device token Data.
 * On Android, registers the FCM token when provided by the host app.
 *
 * @param token - The device token as a hex-encoded string
 * @param authorizationStatus - Current push authorization status
 *
 * @example
 * ```typescript
 * import { registerDeviceToken } from 'attentive-react-native-sdk';
 *
 * // In your native module or push notification handler:
 * registerDeviceToken('abc123...', 'authorized');
 * ```
 */
function registerDeviceToken(
  token: string,
  authorizationStatus: PushAuthorizationStatus
): void {
  AttentiveReactNativeSdk.registerDeviceToken(token, authorizationStatus)
}

/**
 * Register the device token received from APNs with a callback.
 * This is the callback-based version that allows you to handle the response from the Attentive API.
 *
 * On iOS, this will register the device token with the Attentive SDK and invoke the callback
 * after the registration completes (success or failure).
 * On Android, registers the FCM token when provided by the host app.
 *
 * @param token - The hex-encoded device token string from APNs
 * @param authorizationStatus - Current push authorization status
 * @param callback - Callback function invoked after registration completes
 *
 * @example
 * ```typescript
 * import { registerDeviceTokenWithCallback, handleRegularOpen } from 'attentive-react-native-sdk';
 *
 * // In your AppDelegate equivalent (TypeScript):
 * registerDeviceTokenWithCallback(
 *   deviceToken,
 *   'authorized',
 *   (data, url, response, error) => {
 *     console.log('Registration complete:', { data, url, response, error });
 *     // After registration, trigger regular open event
 *     handleRegularOpen('authorized');
 *   }
 * );
 * ```
 */
function registerDeviceTokenWithCallback(
  token: string,
  authorizationStatus: PushAuthorizationStatus,
  callback: (
    data?: Object,
    url?: string,
    response?: Object,
    error?: Object
  ) => void
): void {
  AttentiveReactNativeSdk.registerDeviceTokenWithCallback(
    token,
    authorizationStatus,
    callback
  )
}

/**
 * Handle regular/direct app open (not from a push notification).
 * This should be called after device token registration to track app opens.
 *
 * This is the TypeScript equivalent of the native iOS AppDelegate method:
 * ```swift
 * func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
 *   UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
 *     guard let self = self else { return }
 *     let authStatus = settings.authorizationStatus
 *     attentiveSdk?.registerDeviceToken(deviceToken, authorizationStatus: authStatus, callback: { data, url, response, error in
 *       DispatchQueue.main.async {
 *         self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
 *       }
 *     })
 *   }
 * }
 * ```
 *
 * On iOS, this will notify the Attentive SDK that the app was opened directly
 * (not from a push notification tap).
 * On Android, registers the FCM token when provided by the host app.
 *
 * @param authorizationStatus - Current push authorization status
 *
 * @example
 * ```typescript
 * import { registerDeviceTokenWithCallback, handleRegularOpen } from 'attentive-react-native-sdk';
 * import PushNotificationIOS from '@react-native-community/push-notification-ios';
 *
 * // In your device token registration handler:
 * PushNotificationIOS.addEventListener('register', (deviceToken: string) => {
 *   PushNotificationIOS.checkPermissions((permissions) => {
 *     let authStatus: PushAuthorizationStatus = 'notDetermined'
 *     if (permissions.alert || permissions.badge || permissions.sound) {
 *       authStatus = 'authorized'
 *     }
 *
 *     // Register device token with callback
 *     registerDeviceTokenWithCallback(deviceToken, authStatus, (data, url, response, error) => {
 *       if (error) {
 *         console.error('Registration error:', error)
 *       }
 *       // After registration completes, trigger regular open event
 *       handleRegularOpen(authStatus)
 *     })
 *   })
 * })
 * ```
 */
function handleRegularOpen(authorizationStatus: PushAuthorizationStatus): void {
  console.log('[AttentiveSDK] 🌉 Calling handleRegularOpen from TypeScript')
  console.log(`   Authorization Status: ${authorizationStatus}`)
  console.log(
    '   This should trigger: https://mobile.attentivemobile.com/mtctrl'
  )

  AttentiveReactNativeSdk.handleRegularOpen(authorizationStatus)

  console.log('[AttentiveSDK] ✅ handleRegularOpen call completed')
}

/**
 * Handle when a push notification is opened by the user.
 * Call this from your notification handler when the user taps a notification.
 *
 * On iOS, this will track the push open event and handle the notification appropriately
 * based on whether the app was in the foreground, background, or not running.
 * On Android, registers the FCM token when provided by the host app.
 *
 * @param userInfo - The notification payload from the push notification
 * @param applicationState - The app state when the notification was opened ('active', 'inactive', 'background')
 * @param authorizationStatus - Current push authorization status
 *
 * @example
 * ```typescript
 * import { handlePushOpened } from 'attentive-react-native-sdk';
 *
 * // In your notification handler:
 * handlePushOpened(
 *   notification.data,
 *   'background',
 *   'authorized'
 * );
 * ```
 */
function handlePushOpened(
  userInfo: PushNotificationUserInfo,
  applicationState: ApplicationState,
  authorizationStatus: PushAuthorizationStatus
): void {
  AttentiveReactNativeSdk.handlePushOpened(
    userInfo as Object,
    applicationState,
    authorizationStatus
  )
}

/**
 * Handle when a push notification arrives while the app is in the foreground.
 * Call this from your notification handler when a notification is received while the app is active.
 *
 * On iOS, this allows the Attentive SDK to track the notification event.
 * On Android, registers the FCM token when provided by the host app.
 *
 * @param userInfo - The notification payload from the push notification
 *
 * @example
 * ```typescript
 * import { handleForegroundNotification } from 'attentive-react-native-sdk';
 *
 * // In your notification handler when app is in foreground:
 * handleForegroundNotification(notification.data);
 * ```
 */
function handleForegroundNotification(
  userInfo: PushNotificationUserInfo
): void {
  AttentiveReactNativeSdk.handleForegroundNotification(userInfo as Object)
}

/**
 * Handle a push notification when the app is in the foreground (active state).
 *
 * Call this when you receive a notification response and the app state is 'active'.
 *
 * **iOS prerequisite:** Your AppDelegate's
 * `userNotificationCenter(_:didReceive:withCompletionHandler:)` must call
 * `AttentiveSDKManager.shared.handleNotificationResponse(response)` so that
 * the SDK can cache the `UNNotificationResponse` required by the native iOS SDK.
 * Without that one line of native code, this function cannot track the event.
 *
 * On Android, this tracks the foreground push as a custom event.
 *
 * @param userInfo - The notification payload from the push notification
 * @param authorizationStatus - Current push authorization status
 *
 * @example
 * ```typescript
 * import { handleForegroundPush } from 'attentive-react-native-sdk';
 * import { AppState } from 'react-native';
 *
 * // In your notification handler:
 * const appState = AppState.currentState;
 * if (appState === 'active') {
 *   handleForegroundPush(notification.data, 'authorized');
 * }
 * ```
 */
function handleForegroundPush(
  userInfo: PushNotificationUserInfo,
  authorizationStatus: PushAuthorizationStatus
): void {
  AttentiveReactNativeSdk.handleForegroundPush(
    userInfo as Object,
    authorizationStatus
  )
}

/**
 * Handle when a push notification is opened by the user (app in background/inactive state).
 *
 * Call this when you receive a notification response and the app state is 'background' or 'inactive'.
 *
 * **iOS prerequisite:** Your AppDelegate's
 * `userNotificationCenter(_:didReceive:withCompletionHandler:)` must call
 * `AttentiveSDKManager.shared.handleNotificationResponse(response)` so that
 * the SDK can cache the `UNNotificationResponse` required by the native iOS SDK.
 * Without that one line of native code, this function cannot track the event.
 *
 * On Android, this tracks the push open as a custom event.
 *
 * @param userInfo - The notification payload from the push notification
 * @param authorizationStatus - Current push authorization status
 *
 * @example
 * ```typescript
 * import { handlePushOpen } from 'attentive-react-native-sdk';
 * import { AppState } from 'react-native';
 *
 * // In your notification handler:
 * const appState = AppState.currentState;
 * if (appState === 'background' || appState === 'inactive') {
 *   handlePushOpen(notification.data, 'authorized');
 * }
 * ```
 */
function handlePushOpen(
  userInfo: PushNotificationUserInfo,
  authorizationStatus: PushAuthorizationStatus
): void {
  AttentiveReactNativeSdk.handlePushOpen(
    userInfo as Object,
    authorizationStatus
  )
}

/**
 * Returns the push notification payload that launched the app from a killed state
 * (i.e. the user tapped an FCM notification while the app was not running) and clears
 * it so it is only delivered once.
 *
 * **Android only.** On iOS, use `PushNotificationIOS.getInitialNotification()` to
 * achieve the same result — the Attentive iOS SDK event is tracked natively in
 * `AppDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:)` via
 * `AttentiveSDKManager.shared`.
 *
 * Call this once at app startup (after `initialize()`) to detect and handle the
 * killed-state push-open scenario:
 *
 * ```typescript
 * const initial = await getInitialPushNotification()
 * if (initial) {
 *   const authStatus = await getPushAuthorizationStatus()
 *   handlePushOpen(initial as PushNotificationUserInfo, authStatus)
 * }
 * ```
 *
 * @returns A promise that resolves to the notification data object, or `null` if the
 *          app was not launched via a push notification tap.
 */
async function getInitialPushNotification(): Promise<Record<
  string,
  string
> | null> {
  const result = await AttentiveReactNativeSdk.getInitialPushNotification()
  return result as Record<string, string> | null
}

// =============================================================================
// Marketing Subscription Methods (iOS and Android)
// =============================================================================

/**
 * Opts a user into marketing subscriptions (email and/or SMS).
 *
 * Forwards the call to the native SDK on each platform. At least one of
 * `email` or `phone` must be a valid value; the underlying native SDK
 * rejects the call if neither is provided.
 *
 * @param params - Object containing optional `email` and/or `phone`
 * @returns Promise that resolves on success or rejects with an error
 */
function optInMarketingSubscription(
  params: MarketingSubscriptionParams
): Promise<void> {
  return AttentiveReactNativeSdk.optInMarketingSubscription(
    params?.email,
    params?.phone
  )
}

/**
 * Opts a user out of marketing subscriptions (email and/or SMS).
 *
 * Same contract as [optInMarketingSubscription].
 *
 * @param params - Object containing optional `email` and/or `phone`
 * @returns Promise that resolves on success or rejects with an error
 */
function optOutMarketingSubscription(
  params: MarketingSubscriptionParams
): Promise<void> {
  return AttentiveReactNativeSdk.optOutMarketingSubscription(
    params?.email,
    params?.phone
  )
}

/**
 * Updates the current user's identifiers (email and/or phone).
 *
 * Forwards the call to the native SDK on each platform.
 *
 * @param params - Object containing optional `email` and/or `phone`
 * @returns Promise that resolves on success or rejects with an error
 */
function updateUser(params: UpdateUserParams): Promise<void> {
  return AttentiveReactNativeSdk.updateUser(params?.email, params?.phone)
}

export {
  initialize,
  triggerCreative,
  destroyCreative,
  addCreativeEventListener,
  updateDomain,
  identify,
  clearUser,
  recordAddToCartEvent,
  recordProductViewEvent,
  recordPurchaseEvent,
  recordCustomEvent,
  invokeAttentiveDebugHelper,
  exportDebugLogs,
  // Push Notification Methods
  registerForPushNotifications,
  getPushAuthorizationStatus,
  registerDeviceToken,
  registerDeviceTokenWithCallback,
  handleRegularOpen,
  handlePushOpened,
  handleForegroundNotification,
  handleForegroundPush,
  handlePushOpen,
  getInitialPushNotification,
  // Marketing Subscription Methods
  optInMarketingSubscription,
  optOutMarketingSubscription,
  updateUser,
}

export type {
  UserIdentifiers,
  AttentiveSdkConfiguration,
  ProductView,
  Purchase,
  AddToCart,
  CustomEvent,
  Item,
  // Creative Event Types
  CreativeStatus,
  CreativeEvent,
  CreativeEventSubscription,
  // Push Notification Types
  PushAuthorizationStatus,
  ApplicationState,
  PushNotificationUserInfo,
  PushRegistrationResult,
  // Marketing Subscription Types
  MarketingSubscriptionParams,
  UpdateUserParams,
}
