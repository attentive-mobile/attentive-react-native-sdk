import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport'
import { TurboModuleRegistry, NativeModules } from 'react-native'

export interface Spec extends TurboModule {
  initialize: (
    attentiveDomain: string,
    mode: string,
    skipFatigueOnCreatives: boolean,
    enableDebugger: boolean,
    pushEnabled: boolean
  ) => void
  triggerCreative: (creativeId?: string) => void
  destroyCreative: () => void
  updateDomain: (domain: string) => void
  identify: (
    phone?: string,
    email?: string,
    klaviyoId?: string,
    shopifyId?: string,
    clientUserId?: string,
    customIdentifiers?: Object
  ) => void
  clearUser: () => void
  /**
   * Updates the current user's identifiers (email and/or phone).
   *
   * On iOS, delegates to the native ATTNSDK's updateUser; on Android, calls
   * AttentiveSdk.updateUserWithCallback.
   *
   * @param email - Optional email address
   * @param phone - Optional E.164 phone number
   * @returns Promise that resolves on success or rejects with an error
   */
  updateUser: (
    email: string | undefined,
    phone: string | undefined
  ) => Promise<void>
  recordAddToCartEvent: (
    items: Array<{
      productId: string
      productVariantId: string
      price: string
      currency: string
      productImage?: string
      name?: string
      quantity?: number
      category?: string
    }>,
    deeplink?: string
  ) => void
  recordProductViewEvent: (
    items: Array<{
      productId: string
      productVariantId: string
      price: string
      currency: string
      productImage?: string
      name?: string
      quantity?: number
      category?: string
    }>,
    deeplink?: string
  ) => void
  recordPurchaseEvent: (
    items: Array<{
      productId: string
      productVariantId: string
      price: string
      currency: string
      productImage?: string
      name?: string
      quantity?: number
      category?: string
    }>,
    orderId: string,
    cartId?: string,
    cartCoupon?: string
  ) => void
  recordCustomEvent: (type: string, properties: Object) => void
  invokeAttentiveDebugHelper: () => void
  exportDebugLogs: () => Promise<string>

  // Push Notification Methods
  /**
   * Request push notification permission from the user.
   * On iOS, triggers the system permission dialog.
   * On Android 13+, requests POST_NOTIFICATIONS; on older versions, no-op.
   */
  registerForPushNotifications: () => void

  /**
   * Get the current push notification authorization status.
   * On Android, uses POST_NOTIFICATIONS (API 33+); on older versions returns 'authorized'.
   * On iOS, use PushNotificationIOS.checkPermissions instead; this method is for Android parity.
   * @returns Promise resolving to 'authorized' | 'denied' | 'notDetermined'
   */
  getPushAuthorizationStatus: () => Promise<string>

  /**
   * Register the device token received from APNs (simple version without callback).
   * iOS only - Android is a no-op.
   * @param token - The hex-encoded device token string
   * @param authorizationStatus - Current push authorization status
   */
  registerDeviceToken: (token: string, authorizationStatus: string) => void

  /**
   * Register the device token received from APNs with a callback.
   * iOS only - Android is a no-op.
   * The callback receives the response from the Attentive API after registration.
   * @param token - The hex-encoded device token string
   * @param authorizationStatus - Current push authorization status
   * @param callback - Callback invoked after registration completes
   */
  registerDeviceTokenWithCallback: (
    token: string,
    authorizationStatus: string,
    callback: (
      data?: Object,
      url?: string,
      response?: Object,
      error?: Object
    ) => void
  ) => void

  /**
   * Handle regular/direct app open (not from a push notification).
   * iOS only - Android is a no-op.
   * This should be called after device token registration to track app opens.
   * @param authorizationStatus - Current push authorization status
   */
  handleRegularOpen: (authorizationStatus: string) => void

  /**
   * Handle when a push notification is opened by the user.
   * iOS only - Android is a no-op.
   * @param userInfo - The notification payload
   * @param applicationState - The app state when notification was opened ('active', 'inactive', 'background')
   * @param authorizationStatus - Current push authorization status
   */
  handlePushOpened: (
    userInfo: Object,
    applicationState: string,
    authorizationStatus: string
  ) => void

  /**
   * Handle when a push notification arrives while the app is in foreground.
   * iOS only - Android is a no-op.
   * @param userInfo - The notification payload
   */
  handleForegroundNotification: (userInfo: Object) => void

  /**
   * Handle a push notification when the app is in the foreground (active state).
   * This is the React Native equivalent of calling handleForegroundPush in native iOS.
   * iOS only - Android is a no-op.
   * @param userInfo - The notification payload
   * @param authorizationStatus - Current push authorization status
   */
  handleForegroundPush: (userInfo: Object, authorizationStatus: string) => void

  /**
   * Handle when a push notification is opened by the user (app in background/inactive state).
   * This is the React Native equivalent of calling handlePushOpen in native iOS.
   * iOS only - Android is a no-op.
   * @param userInfo - The notification payload
   * @param authorizationStatus - Current push authorization status
   */
  handlePushOpen: (userInfo: Object, authorizationStatus: string) => void

  /**
   * Returns the push notification payload that launched the app from a killed state
   * (i.e. the user tapped a notification when the app was not running), then clears it
   * so it is only delivered once.
   *
   * Android only — on iOS use `PushNotificationIOS.getInitialNotification()` instead.
   *
   * @returns Promise resolving to a notification data map, or null if the app was not
   *          launched from a push notification tap.
   */
  getInitialPushNotification: () => Promise<Object | null>

  // ==========================================================================
  // Marketing Subscription Methods
  // ==========================================================================

  /**
   * Opts a user into marketing subscriptions (email and/or SMS).
   *
   * On iOS, delegates to the native ATTNSDK which handles input normalisation,
   * validation that at least one contact identifier is provided, and push-token
   * queueing when the token is not yet available.
   *
   * On Android, calls the Attentive opt-in endpoint directly via OkHttp with
   * equivalent normalisation and validation logic.
   *
   * @param email - Optional email address
   * @param phone - Optional E.164 phone number
   * @returns Promise that resolves on success or rejects with an error
   */
  optInMarketingSubscription: (
    email: string | undefined,
    phone: string | undefined
  ) => Promise<void>

  /**
   * Opts a user out of marketing subscriptions (email and/or SMS).
   *
   * On iOS, delegates to the native ATTNSDK which handles input normalisation,
   * validation that at least one contact identifier is provided, and push-token
   * queueing when the token is not yet available.
   *
   * On Android, calls the Attentive opt-out endpoint directly via OkHttp with
   * equivalent normalisation and validation logic.
   *
   * @param email - Optional email address
   * @param phone - Optional E.164 phone number
   * @returns Promise that resolves on success or rejects with an error
   */
  optOutMarketingSubscription: (
    email: string | undefined,
    phone: string | undefined
  ) => Promise<void>

  // Inbox
  /**
   * Reads the unread inbox message count, and is also how you start the inbox.
   *
   * Call it once when your badge mounts, then subscribe with
   * `addInboxUnreadCountListener` for subsequent changes. It returns `0` until the first
   * fetch lands, so "loading" and "no unread messages" look identical — track that yourself
   * if you need to tell them apart.
   *
   * Fetch behaviour differs per platform, and the difference is not cosmetic:
   * - **iOS** forces a server refresh on every call, because the native SDK exposes one
   *   publicly. Calling this on app foreground and after a push open — Attentive's own iOS
   *   guidance — therefore keeps a badge accurate.
   * - **Android** fetches only on the *first* call. `refreshInbox()` and
   *   `refreshInboxUnreadCount()` are still `internal` in the native SDK, so later
   *   calls return the cached value. An Android badge updates on that first call, on push
   *   received while the app is foregrounded, and whenever the inbox view is on screen.
   *
   * @returns Promise resolving to the unread count
   */
  getInboxUnreadCount: () => Promise<number>
}

// Try to load via TurboModule first (new architecture)
// Fall back to NativeModules for old architecture
const isTurboModuleEnabled = (global as any).__turboModuleProxy != null

const AttentiveReactNativeSdkModule = isTurboModuleEnabled
  ? TurboModuleRegistry.get<Spec>('AttentiveReactNativeSdk')
  : NativeModules.AttentiveReactNativeSdk

export default AttentiveReactNativeSdkModule as Spec | null
