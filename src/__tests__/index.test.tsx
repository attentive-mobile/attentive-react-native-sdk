// Mock the NativeAttentiveReactNativeSdk module
const mockNativeModule = {
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
  // Push Notification Methods
  registerForPushNotifications: jest.fn(),
  registerDeviceToken: jest.fn(),
  handlePushOpened: jest.fn(),
  handleForegroundNotification: jest.fn(),
};

jest.mock('../NativeAttentiveReactNativeSdk', () => ({
  __esModule: true,
  default: mockNativeModule,
}));

jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn(),
  },
}));

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
  registerDeviceToken,
  handlePushOpened,
  handleForegroundNotification,
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
  });
});
