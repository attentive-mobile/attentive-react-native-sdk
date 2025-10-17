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
}

// Try to load via TurboModule first (new architecture)
// Fall back to NativeModules for old architecture
const isTurboModuleEnabled = (global as any).__turboModuleProxy != null;

const AttentiveReactNativeSdkModule = isTurboModuleEnabled
  ? TurboModuleRegistry.get<Spec>("AttentiveReactNativeSdk")
  : NativeModules.AttentiveReactNativeSdk;

export default AttentiveReactNativeSdkModule as Spec | null;
