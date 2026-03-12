// jest.mock factories are hoisted above all other module-level code by jest's babel transform.
// Any const/let declared outside the factory would be in the TDZ when the factory first runs.
// Therefore the entire mock object is defined INSIDE the factory, and we retrieve a reference
// to it afterwards via jest.requireMock() so tests can assert on individual jest.fn() calls.
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (options: Record<string, unknown>) => options.ios ?? options.default,
  },
  // NativeAttentiveReactNativeSdk.ts falls back to NativeModules when __turboModuleProxy
  // is absent (the case in a Jest environment with no TurboModule support).
  NativeModules: {
    AttentiveReactNativeSdk: {
      initialize: jest.fn(),
      identify: jest.fn(),
      clearUser: jest.fn(),
      triggerCreative: jest.fn(),
      destroyCreative: jest.fn(),
      updateDomain: jest.fn(),
      recordProductViewEvent: jest.fn(),
      recordAddToCartEvent: jest.fn(),
      recordPurchaseEvent: jest.fn(),
      recordCustomEvent: jest.fn(),
      invokeAttentiveDebugHelper: jest.fn(),
      exportDebugLogs: jest.fn().mockResolvedValue('debug logs'),
      registerForPushNotifications: jest.fn(),
      getPushAuthorizationStatus: jest.fn().mockResolvedValue('authorized'),
      registerDeviceToken: jest.fn(),
      registerDeviceTokenWithCallback: jest.fn(),
      handleRegularOpen: jest.fn(),
      handlePushOpened: jest.fn(),
      handleForegroundNotification: jest.fn(),
      handleForegroundPush: jest.fn(),
      handlePushOpen: jest.fn(),
      getInitialPushNotification: jest.fn().mockResolvedValue(null),
    },
  },
  TurboModuleRegistry: {
    get: () => null,
  },
}));

// Retrieve a stable reference to the mock after jest.mock is evaluated.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockNativeModule = require('react-native').NativeModules.AttentiveReactNativeSdk;

import {
  initialize,
  identify,
  clearUser,
  triggerCreative,
  destroyCreative,
  updateDomain,
  recordProductViewEvent,
  recordAddToCartEvent,
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
} from '../index';
import type { AttentiveSdkConfiguration } from '../index';

describe('Attentive SDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with all configuration options', () => {
      const config: AttentiveSdkConfiguration = {
        attentiveDomain: 'test-domain',
        mode: 'debug',
        enableDebugger: true,
        skipFatigueOnCreatives: true,
      };

      initialize(config);

      expect(mockNativeModule.initialize).toHaveBeenCalledWith(
        'test-domain',
        'debug',
        true,
        true
      );
    });

    it('should initialize with minimal configuration', () => {
      const config: AttentiveSdkConfiguration = {
        attentiveDomain: 'test-domain',
        mode: 'production',
      };

      initialize(config);

      expect(mockNativeModule.initialize).toHaveBeenCalledWith(
        'test-domain',
        'production',
        false,
        false
      );
    });
  });

  describe('User identification', () => {
    it('should identify user with all identifiers', () => {
      identify({
        phone: '+1234567890',
        email: 'test@example.com',
        klaviyoId: 'klaviyo-123',
        shopifyId: 'shopify-123',
        clientUserId: 'client-123',
        customIdentifiers: { custom1: 'value1' },
      });

      expect(mockNativeModule.identify).toHaveBeenCalledWith(
        '+1234567890',
        'test@example.com',
        'klaviyo-123',
        'shopify-123',
        'client-123',
        { custom1: 'value1' }
      );
    });

    it('should clear user', () => {
      clearUser();

      expect(mockNativeModule.clearUser).toHaveBeenCalled();
    });
  });

  describe('Event recording', () => {
    it('should record product view event', () => {
      const items = [
        {
          productId: 'test-product',
          productVariantId: 'test-variant',
          price: '10.00',
          currency: 'USD',
        },
      ];

      recordProductViewEvent({ items, deeplink: 'test://product' });

      expect(mockNativeModule.recordProductViewEvent).toHaveBeenCalledWith(
        items,
        'test://product'
      );
    });

    it('should record add to cart event', () => {
      const items = [
        {
          productId: 'test-product',
          productVariantId: 'test-variant',
          price: '10.00',
          currency: 'USD',
        },
      ];

      recordAddToCartEvent({ items, deeplink: 'test://cart' });

      expect(mockNativeModule.recordAddToCartEvent).toHaveBeenCalledWith(
        items,
        'test://cart'
      );
    });

    it('should record purchase event', () => {
      const items = [
        {
          productId: 'test-product',
          productVariantId: 'test-variant',
          price: '10.00',
          currency: 'USD',
        },
      ];

      recordPurchaseEvent({
        items,
        orderId: 'test-order-123',
        cartId: 'cart-123',
        cartCoupon: 'DISCOUNT10',
      });

      expect(mockNativeModule.recordPurchaseEvent).toHaveBeenCalledWith(
        items,
        'test-order-123',
        'cart-123',
        'DISCOUNT10'
      );
    });

    it('should record custom event', () => {
      recordCustomEvent({
        type: 'test-event',
        properties: { key1: 'value1', key2: 'value2' },
      });

      expect(mockNativeModule.recordCustomEvent).toHaveBeenCalledWith(
        'test-event',
        { key1: 'value1', key2: 'value2' }
      );
    });
  });

  describe('Creative management', () => {
    it('should trigger creative without specific ID', () => {
      triggerCreative();

      expect(mockNativeModule.triggerCreative).toHaveBeenCalledWith(undefined);
    });

    it('should trigger creative with specific ID', () => {
      const creativeId = 'test-creative-123';
      triggerCreative(creativeId);

      expect(mockNativeModule.triggerCreative).toHaveBeenCalledWith(
        creativeId
      );
    });

    it('should destroy creative', () => {
      destroyCreative();

      expect(mockNativeModule.destroyCreative).toHaveBeenCalled();
    });
  });

  describe('Domain management', () => {
    it('should update domain', () => {
      updateDomain('new-domain.com');

      expect(mockNativeModule.updateDomain).toHaveBeenCalledWith(
        'new-domain.com'
      );
    });
  });

  describe('Debugging', () => {
    it('should invoke debug helper', () => {
      invokeAttentiveDebugHelper();

      expect(mockNativeModule.invokeAttentiveDebugHelper).toHaveBeenCalled();
    });

    it('should export debug logs', async () => {
      const logs = await exportDebugLogs();

      expect(mockNativeModule.exportDebugLogs).toHaveBeenCalled();
      expect(logs).toBe('debug logs');
    });
  });

  describe('Push Notifications', () => {
    it('should register for push notifications', () => {
      registerForPushNotifications();

      expect(mockNativeModule.registerForPushNotifications).toHaveBeenCalled();
    });

    it('should get push authorization status', async () => {
      const status = await getPushAuthorizationStatus();

      expect(mockNativeModule.getPushAuthorizationStatus).toHaveBeenCalled();
      expect(status).toBe('authorized');
    });

    it('should register device token', () => {
      registerDeviceToken('abc123def456', 'authorized');

      expect(mockNativeModule.registerDeviceToken).toHaveBeenCalledWith(
        'abc123def456',
        'authorized'
      );
    });

    it('should handle push opened', () => {
      const userInfo = { messageId: '123', title: 'Test notification' };

      handlePushOpened(userInfo, 'background', 'authorized');

      expect(mockNativeModule.handlePushOpened).toHaveBeenCalledWith(
        userInfo,
        'background',
        'authorized'
      );
    });

    it('should handle foreground notification', () => {
      const userInfo = { messageId: '123', title: 'Test notification' };

      handleForegroundNotification(userInfo);

      expect(mockNativeModule.handleForegroundNotification).toHaveBeenCalledWith(
        userInfo
      );
    });

    it('should handle regular open', () => {
      handleRegularOpen('authorized');

      expect(mockNativeModule.handleRegularOpen).toHaveBeenCalledWith('authorized');
    });

    it('should call handleForegroundPush with userInfo and authorizationStatus', () => {
      const userInfo = { messageId: 'msg-1', title: 'Summer Sale', body: '20% off today' };

      handleForegroundPush(userInfo, 'authorized');

      expect(mockNativeModule.handleForegroundPush).toHaveBeenCalledWith(userInfo, 'authorized');
    });

    it('should call handlePushOpen with userInfo and authorizationStatus', () => {
      const userInfo = { messageId: 'msg-2', title: 'New arrivals', body: 'Check them out' };

      handlePushOpen(userInfo, 'authorized');

      expect(mockNativeModule.handlePushOpen).toHaveBeenCalledWith(userInfo, 'authorized');
    });

    describe('getInitialPushNotification', () => {
      it('should return null when no initial notification is pending', async () => {
        mockNativeModule.getInitialPushNotification.mockResolvedValueOnce(null);

        const result = await getInitialPushNotification();

        expect(mockNativeModule.getInitialPushNotification).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
      });

      it('should return the stored notification payload when app was launched from a push tap', async () => {
        const expectedPayload = {
          messageId: 'fcm-123',
          title: 'Flash Sale',
          body: '40% off for 2 hours',
          campaignId: 'camp-456',
        };
        mockNativeModule.getInitialPushNotification.mockResolvedValueOnce(expectedPayload);

        const result = await getInitialPushNotification();

        expect(mockNativeModule.getInitialPushNotification).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedPayload);
      });

      it('should propagate native module rejections as errors', async () => {
        mockNativeModule.getInitialPushNotification.mockRejectedValueOnce(
          new Error('INITIAL_PUSH_ERROR'),
        );

        await expect(getInitialPushNotification()).rejects.toThrow('INITIAL_PUSH_ERROR');
      });
    });
  });
});
