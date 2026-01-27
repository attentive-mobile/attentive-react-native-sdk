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
 * Register the device token received from APNs with a callback.
 * This is the callback-based version that allows you to handle the response from the Attentive API.
 *
 * On iOS, this will register the device token with the Attentive SDK and invoke the callback
 * after the registration completes (success or failure).
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
  AttentiveReactNativeSdk.handleRegularOpen(authorizationStatus)
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
function handleForegroundNotification(
  userInfo: PushNotificationUserInfo
): void {
  AttentiveReactNativeSdk.handleForegroundNotification(userInfo as Object)
}

/**
 * Handle a push notification when the app is in the foreground (active state).
 * This is the React Native equivalent of the native iOS handleForegroundPush method.
 *
 * Call this when you receive a notification response and the app state is 'active'.
 * This is part of implementing the native iOS pattern:
 * ```swift
 * case .active:
 *   self.attentiveSdk?.handleForegroundPush(response: response, authorizationStatus: authStatus)
 * ```
 *
 * On iOS, this properly tracks foreground push notifications.
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
  AttentiveReactNativeSdk.handleForegroundPush(userInfo as Object, authorizationStatus)
}

/**
 * Handle when a push notification is opened by the user (app in background/inactive state).
 * This is the React Native equivalent of the native iOS handlePushOpen method.
 *
 * Call this when you receive a notification response and the app state is 'background' or 'inactive'.
 * This is part of implementing the native iOS pattern:
 * ```swift
 * case .background, .inactive:
 *   self.attentiveSdk?.handlePushOpen(response: response, authorizationStatus: authStatus)
 * ```
 *
 * On iOS, this properly tracks push notification opens.
 * On Android, this is currently a no-op (TODO: implement FCM integration).
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
  AttentiveReactNativeSdk.handlePushOpen(userInfo as Object, authorizationStatus)
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
  registerDeviceTokenWithCallback,
  handleRegularOpen,
  handlePushOpened,
  handleForegroundNotification,
  handleForegroundPush,
  handlePushOpen,
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
