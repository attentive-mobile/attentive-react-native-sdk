import { Platform } from "react-native"
import type {
  UserIdentifiers,
  AttentiveSdkConfiguration,
  ProductView,
  Purchase,
  AddToCart,
  CustomEvent,
} from "./eventTypes"
import NativeAttentiveReactNativeSdkModule, {
  type Spec,
} from "./NativeAttentiveReactNativeSdk"

const LINKING_ERROR =
  `The package 'attentive-react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n"

const AttentiveReactNativeSdk = (NativeAttentiveReactNativeSdkModule
  ? NativeAttentiveReactNativeSdkModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      },
    )) as Spec

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
}

export type {
  UserIdentifiers,
  AttentiveSdkConfiguration,
  ProductView,
  Purchase,
  AddToCart,
  CustomEvent,
}
