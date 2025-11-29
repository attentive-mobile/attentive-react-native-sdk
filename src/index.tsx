import { Platform } from 'react-native'
import type {
  UserIdentifiers,
  AttentiveSdkConfiguration,
  ProductView,
  Purchase,
  AddToCart,
  CustomEvent,
  Item,
  PushAuthorizationStatus,
  ApplicationState,
  PushNotificationUserInfo,
  PushRegistrationResult,
} from './eventTypes'
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
 * Initialize the Attentive SDK with the provided configuration
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
// Push Notification Methods (iOS only - Android is no-op with TODO stubs)
// =============================================================================

/**
 * Request push notification permission from the user.
 * On iOS, this will trigger the system permission dialog.
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
 * Register the device token received from APNs/FCM with the Attentive backend.
 * Call this from your AppDelegate's didRegisterForRemoteNotificationsWithDeviceToken.
 *
 * On iOS, the token should be the hex-encoded string representation of the device token Data.
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
 * Handle when a push notification is opened by the user.
 * Call this from your notification handler when the user taps a notification.
 *
 * On iOS, this will track the push open event and handle the notification appropriately
 * based on whether the app was in the foreground, background, or not running.
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
function handleForegroundNotification(userInfo: PushNotificationUserInfo): void {
  AttentiveReactNativeSdk.handleForegroundNotification(userInfo as Object)
}

export {
  initialize,
  triggerCreative,
  destroyCreative,
  updateDomain,
  identify,
  clearUser,
  recordAddToCartEvent,
  recordProductViewEvent,
  recordPurchaseEvent,
  recordCustomEvent,
  invokeAttentiveDebugHelper,
  exportDebugLogs,
  // Push Notification Methods (iOS only)
  registerForPushNotifications,
  registerDeviceToken,
  handlePushOpened,
  handleForegroundNotification,
}

export type {
  UserIdentifiers,
  AttentiveSdkConfiguration,
  ProductView,
  Purchase,
  AddToCart,
  CustomEvent,
  Item,
  // Push Notification Types
  PushAuthorizationStatus,
  ApplicationState,
  PushNotificationUserInfo,
  PushRegistrationResult,
}
