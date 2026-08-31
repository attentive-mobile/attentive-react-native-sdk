export type UserIdentifiers = {
  phone?: string
  email?: string
  klaviyoId?: string
  shopifyId?: string
  clientUserId?: string
  customIdentifiers?: Record<string, string>
}

export type AttentiveSdkConfiguration = {
  attentiveDomain: string
  mode: string // "production" or "debug"
  skipFatigueOnCreatives?: boolean
  enableDebugger?: boolean
  pushEnabled?: boolean
}

// Codegen does not support nested objects inside of arrays. We must flatten the Item type.
export type Item = {
  productId: string
  productVariantId: string
  price: string
  currency: string
  productImage?: string
  name?: string
  quantity?: number
  category?: string
}

export type ProductView = {
  items: Item[]
  deeplink?: string
}

/**
 * Lifecycle outcome of a triggered creative.
 *
 * This is the vocabulary both platforms are normalized onto — iOS reports
 * `ATTNCreativeTriggerStatus` string constants, Android calls the matching
 * `CreativeTriggerCallback` method — but the two SDKs do not each report all four. Handle every
 * status, and do not treat any single one as guaranteed to arrive.
 *
 * - `opened` — the creative rendered and is visible to the user.
 * - `closed` — the creative was dismissed via its own close control. Not emitted for an Android
 *   back press, and not emitted by `destroyCreative()`.
 * - `notOpened` — the creative could not be shown. This is the catch-all failure status on
 *   both platforms: no creative is configured for the app, the creative was fatigued, the
 *   load timed out, or an unknown exception occurred. Android does not report it for a failed
 *   page load or render timeout (see the README caveats).
 * - `notClosed` — the creative failed to close cleanly (rare; e.g. the web view was already
 *   gone at close time). Android only in practice: `attentive-ios-sdk` 2.0.18-beta.1 declares this
 *   status but has no call site for it.
 */
export const CREATIVE_STATUSES = [
  'opened',
  'closed',
  'notOpened',
  'notClosed',
] as const

export type CreativeStatus = (typeof CREATIVE_STATUSES)[number]

/**
 * A single creative lifecycle transition delivered to `addCreativeEventListener`.
 */
export type CreativeEvent = {
  status: CreativeStatus
  /**
   * The `creativeId` passed to the `triggerCreative` call that produced this event.
   * Absent when the creative was triggered without an explicit id.
   */
  creativeId?: string
}

/**
 * Handle returned by `addCreativeEventListener`. Call `remove()` to stop receiving events.
 *
 * Deliberately minimal rather than React Native's `EventSubscription`, whose published
 * TypeScript shape (`eventType` / `key` / `subscriber`) is an internal detail that has
 * differed across RN versions.
 */
export type CreativeEventSubscription = {
  remove: () => void
}

/** Handle returned by `addInboxUnreadCountListener`; call `remove()` to unsubscribe. */
export type InboxUnreadCountSubscription = {
  remove: () => void
}

// Codegen does not support nested objects. We must flatten the Purchase type.
export type Purchase = {
  items: Item[]
  orderId: string
  cartId?: string
  cartCoupon?: string
}

export type AddToCart = {
  items: Item[]
  deeplink?: string
}

export type CustomEvent = {
  type: string
  properties: Record<string, string>
}

/**
 * Push notification authorization status
 * Maps to UNAuthorizationStatus on iOS
 */
export type PushAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'provisional'
  | 'ephemeral'

/**
 * Application state when handling push notifications
 */
export type ApplicationState = 'active' | 'inactive' | 'background'

/**
 * Push notification user info payload
 * Contains data from the remote notification
 */
export type PushNotificationUserInfo = Record<string, unknown>

/**
 * Result of registering for push notifications
 */
export type PushRegistrationResult = {
  success: boolean
  token?: string
  error?: string
}

/**
 * Parameters for marketing subscription opt-in and opt-out operations.
 * At least one of email or phone must be provided; the native layer
 * validates this and rejects the promise with a missing-contact-info error
 * if both are absent.
 */
export interface MarketingSubscriptionParams {
  /** Email address to subscribe / unsubscribe */
  email?: string
  /** E.164 phone number to subscribe / unsubscribe */
  phone?: string
}

/**
 * Parameters for the updateUser operation. Provide the email and/or
 * E.164 phone number identifying the user to update.
 */
export interface UpdateUserParams {
  /** Email address to set for the user */
  email?: string
  /** E.164 phone number to set for the user */
  phone?: string
}
