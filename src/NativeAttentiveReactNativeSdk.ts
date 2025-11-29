import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";
import { TurboModuleRegistry, NativeModules } from "react-native";

export interface Spec extends TurboModule {
  initialize: (
    attentiveDomain: string,
    mode: string,
    skipFatigueOnCreatives: boolean,
    enableDebugger: boolean
  ) => void;
  triggerCreative: (creativeId?: string) => void;
  destroyCreative: () => void;
  updateDomain: (domain: string) => void;
  identify: (
    phone?: string,
    email?: string,
    klaviyoId?: string,
    shopifyId?: string,
    clientUserId?: string,
    customIdentifiers?: Object
  ) => void;
  clearUser: () => void;
  recordAddToCartEvent: (
    items: Array<{
      productId: string;
      productVariantId: string;
      price: string;
      currency: string;
      productImage?: string;
      name?: string;
      quantity?: number;
      category?: string;
    }>,
    deeplink?: string
  ) => void;
  recordProductViewEvent: (
    items: Array<{
      productId: string;
      productVariantId: string;
      price: string;
      currency: string;
      productImage?: string;
      name?: string;
      quantity?: number;
      category?: string;
    }>,
    deeplink?: string
  ) => void;
  recordPurchaseEvent: (
    items: Array<{
      productId: string;
      productVariantId: string;
      price: string;
      currency: string;
      productImage?: string;
      name?: string;
      quantity?: number;
      category?: string;
    }>,
    orderId: string,
    cartId?: string,
    cartCoupon?: string
  ) => void;
  recordCustomEvent: (type: string, properties: Object) => void;
  invokeAttentiveDebugHelper: () => void;
  exportDebugLogs: () => Promise<string>;

  // Push Notification Methods (iOS only)
  /**
   * Request push notification permission from the user.
   * iOS only - Android is a no-op.
   */
  registerForPushNotifications: () => void;

  /**
   * Register the device token received from APNs.
   * iOS only - Android is a no-op.
   * @param token - The hex-encoded device token string
   * @param authorizationStatus - Current push authorization status
   */
  registerDeviceToken: (token: string, authorizationStatus: string) => void;

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
  ) => void;

  /**
   * Handle when a push notification arrives while the app is in foreground.
   * iOS only - Android is a no-op.
   * @param userInfo - The notification payload
   */
  handleForegroundNotification: (userInfo: Object) => void;
}

// Try to load via TurboModule first (new architecture)
// Fall back to NativeModules for old architecture
const isTurboModuleEnabled = (global as any).__turboModuleProxy != null;

const AttentiveReactNativeSdkModule = isTurboModuleEnabled
  ? TurboModuleRegistry.get<Spec>("AttentiveReactNativeSdk")
  : NativeModules.AttentiveReactNativeSdk;

export default AttentiveReactNativeSdkModule as Spec | null;
