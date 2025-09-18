// Mock React Native before importing anything else
jest.mock('react-native', () => ({
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
    },
  },
  Platform: {
    select: jest.fn(),
  },
}));

import { NativeModules } from 'react-native';
import { Attentive, AttentiveConfiguration, Mode } from '../index';

const mockAttentiveReactNativeSdk = NativeModules.AttentiveReactNativeSdk;

describe('Attentive SDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Debugging functionality', () => {
    it('should initialize with debugging enabled', () => {
      const config: AttentiveConfiguration = {
        attentiveDomain: 'test-domain',
        mode: Mode.Debug,
        enableDebugger: true,
      };

      Attentive.initialize(config);

      expect(mockAttentiveReactNativeSdk.initialize).toHaveBeenCalledWith(
        config
      );
      expect(mockAttentiveReactNativeSdk.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          enableDebugger: true,
        })
      );
    });

    it('should initialize with debugging disabled by default', () => {
      const config: AttentiveConfiguration = {
        attentiveDomain: 'test-domain',
        mode: Mode.Production,
      };

      Attentive.initialize(config);

      expect(mockAttentiveReactNativeSdk.initialize).toHaveBeenCalledWith(
        config
      );
      // When enableDebugger is not specified, it should not be in the config object
      const lastCall = mockAttentiveReactNativeSdk.initialize.mock.calls[0][0];
      expect(lastCall).not.toHaveProperty('enableDebugger');
    });

    it('should call invokeAttentiveDebugHelper', () => {
      Attentive.invokeAttentiveDebugHelper();

      expect(
        mockAttentiveReactNativeSdk.invokeAttentiveDebugHelper
      ).toHaveBeenCalled();
    });

    it('should accept enableDebugger flag in configuration', () => {
      const configWithDebugger: AttentiveConfiguration = {
        attentiveDomain: 'test-domain',
        mode: Mode.Debug,
        enableDebugger: true,
        skipFatigueOnCreatives: false,
      };

      const configWithoutDebugger: AttentiveConfiguration = {
        attentiveDomain: 'test-domain',
        mode: Mode.Production,
        enableDebugger: false,
      };

      Attentive.initialize(configWithDebugger);
      expect(mockAttentiveReactNativeSdk.initialize).toHaveBeenLastCalledWith(
        configWithDebugger
      );

      Attentive.initialize(configWithoutDebugger);
      expect(mockAttentiveReactNativeSdk.initialize).toHaveBeenLastCalledWith(
        configWithoutDebugger
      );
    });
  });

  describe('Event recording with debugging', () => {
    it('should record product view event', () => {
      const productViewEvent = {
        items: [
          {
            productId: 'test-product',
            productVariantId: 'test-variant',
            price: { price: '10.00', currency: 'USD' },
          },
        ],
        deeplink: 'test://product',
      };

      Attentive.recordProductViewEvent(productViewEvent);

      expect(
        mockAttentiveReactNativeSdk.recordProductViewEvent
      ).toHaveBeenCalledWith(productViewEvent);
    });

    it('should record add to cart event', () => {
      const addToCartEvent = {
        items: [
          {
            productId: 'test-product',
            productVariantId: 'test-variant',
            price: { price: '10.00', currency: 'USD' },
          },
        ],
        deeplink: 'test://cart',
      };

      Attentive.recordAddToCartEvent(addToCartEvent);

      expect(
        mockAttentiveReactNativeSdk.recordAddToCartEvent
      ).toHaveBeenCalledWith(addToCartEvent);
    });

    it('should record purchase event', () => {
      const purchaseEvent = {
        items: [
          {
            productId: 'test-product',
            productVariantId: 'test-variant',
            price: { price: '10.00', currency: 'USD' },
          },
        ],
        order: { orderId: 'test-order-123' },
      };

      Attentive.recordPurchaseEvent(purchaseEvent);

      expect(
        mockAttentiveReactNativeSdk.recordPurchaseEvent
      ).toHaveBeenCalledWith(purchaseEvent);
    });

    it('should record custom event', () => {
      const customEvent = {
        type: 'test-event',
        properties: { key1: 'value1', key2: 'value2' },
      };

      Attentive.recordCustomEvent(customEvent);

      expect(
        mockAttentiveReactNativeSdk.recordCustomEvent
      ).toHaveBeenCalledWith(customEvent);
    });
  });

  describe('Creative triggering with debugging', () => {
    it('should trigger creative without specific ID', () => {
      Attentive.triggerCreative();

      expect(mockAttentiveReactNativeSdk.triggerCreative).toHaveBeenCalledWith(
        null
      );
    });

    it('should trigger creative with specific ID', () => {
      const creativeId = 'test-creative-123';
      Attentive.triggerCreative(creativeId);

      expect(mockAttentiveReactNativeSdk.triggerCreative).toHaveBeenCalledWith(
        creativeId
      );
    });
  });

  describe('Configuration validation', () => {
    it('should ensure AttentiveConfiguration type includes enableDebugger', () => {
      // This test ensures the TypeScript types are correct
      const validConfig: AttentiveConfiguration = {
        attentiveDomain: 'test',
        mode: Mode.Debug,
        enableDebugger: true,
        skipFatigueOnCreatives: false,
      };

      expect(validConfig.enableDebugger).toBe(true);
    });
  });

  describe('Debug mode safety', () => {
    it('should pass enableDebugger flag to native module regardless of build mode', () => {
      // This test verifies that the enableDebugger flag is passed through to the native module
      // The actual debug mode checking happens in the native modules
      const config: AttentiveConfiguration = {
        attentiveDomain: 'test-domain',
        mode: Mode.Production,
        enableDebugger: true,
      };

      Attentive.initialize(config);

      expect(mockAttentiveReactNativeSdk.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          enableDebugger: true,
        })
      );
    });

    it('should pass enableDebugger: false when not specified', () => {
      const config: AttentiveConfiguration = {
        attentiveDomain: 'test-domain',
        mode: Mode.Production,
      };

      Attentive.initialize(config);

      // When enableDebugger is not specified, it should not be in the config object
      const lastCall = mockAttentiveReactNativeSdk.initialize.mock.calls[0][0];
      expect(lastCall).not.toHaveProperty('enableDebugger');
    });
  });
});
