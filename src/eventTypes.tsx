export type UserIdentifiers = {
  phone?: string;
  email?: string;
  klaviyoId?: string;
  shopifyId?: string;
  clientUserId?: string;
  customIdentifiers?: Record<string, string>;
};

export type AttentiveSdkConfiguration = {
  attentiveDomain: string;
  mode: string; // "production" or "debug"
  skipFatigueOnCreatives?: boolean;
  enableDebugger?: boolean;
};

// Codegen does not support nested objects inside of arrays. We must flatten the Item type.
export type Item = {
  productId: string;
  productVariantId: string;
  price: string;
  currency: string;
  productImage?: string;
  name?: string;
  quantity?: number;
  category?: string;
};

export type ProductView = {
  items: Item[];
  deeplink?: string;
};

// Codegen does not support nested objects. We must flatten the Purchase type.
export type Purchase = {
  items: Item[];
  orderId: string;
  cartId?: string;
  cartCoupon?: string;
};

export type AddToCart = {
  items: Item[];
  deeplink?: string;
};

export type CustomEvent = {
  type: string;
  properties: Record<string, string>;
};

/**
 * Push notification authorization status
 * Maps to UNAuthorizationStatus on iOS
 */
export type PushAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'provisional'
  | 'ephemeral';

/**
 * Application state when handling push notifications
 */
export type ApplicationState = 'active' | 'inactive' | 'background';

/**
 * Push notification user info payload
 * Contains data from the remote notification
 */
export type PushNotificationUserInfo = Record<string, unknown>;

/**
 * Result of registering for push notifications
 */
export type PushRegistrationResult = {
  success: boolean;
  token?: string;
  error?: string;
};

/**
 * Parameters for marketing subscription opt-in and opt-out operations.
 * At least one of email or phone must be provided; the native layer
 * validates this and rejects the promise with a missing-contact-info error
 * if both are absent.
 */
export interface MarketingSubscriptionParams {
  /** Email address to subscribe / unsubscribe */
  email?: string;
  /** E.164 phone number to subscribe / unsubscribe */
  phone?: string;
}
