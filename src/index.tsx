import { NativeModules, Platform } from 'react-native';
import type {
  AddToCartEvent,
  ProductViewEvent,
  PurchaseEvent,
  CustomEvent,
} from './eventTypes';

const LINKING_ERROR =
  `The package 'attentive-react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const AttentiveReactNativeSdk = NativeModules.AttentiveReactNativeSdk
  ? NativeModules.AttentiveReactNativeSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export enum Mode {
  Production = 'production',
  Debug = 'debug',
}

export type AttentiveConfiguration = {
  attentiveDomain: string;
  mode: Mode;
};

export type UserIdentifiers = {
  phone?: string;
  email?: string;
  klaviyoId?: string;
  shopifyId?: string;
  clientUserId?: string;
  customIdentifiers?: { [key: string]: string };
};

export class Attentive {
  static initialize(configuration: AttentiveConfiguration): void {
    AttentiveReactNativeSdk.initialize(configuration);
  }

  static identify(userIdentifiers: UserIdentifiers): void {
    AttentiveReactNativeSdk.identify(userIdentifiers);
  }

  static clearUser(): void {
    AttentiveReactNativeSdk.clearUser();
  }

  static triggerCreative(): void {
    AttentiveReactNativeSdk.triggerCreative();
  }

  static destroyCreative(): void {
    AttentiveReactNativeSdk.destroyCreative();
  }

  static recordProductViewEvent(productViewEvent: ProductViewEvent): void {
    AttentiveReactNativeSdk.recordProductViewEvent(productViewEvent);
  }

  static recordAddToCartEvent(addToCartEvent: AddToCartEvent): void {
    AttentiveReactNativeSdk.recordAddToCartEvent(addToCartEvent);
  }

  static recordPurchaseEvent(purchaseEvent: PurchaseEvent): void {
    AttentiveReactNativeSdk.recordPurchaseEvent(purchaseEvent);
  }

  static recordCustomEvent(customEvent: CustomEvent): void {
    AttentiveReactNativeSdk.recordCustomEvent(customEvent);
  }
}

export type { AddToCartEvent, ProductViewEvent, PurchaseEvent, CustomEvent };
