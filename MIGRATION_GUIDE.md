# Migration Guide: React Native New Architecture

This guide will help you migrate your application to use the new architecture-compatible version of `@attentive-mobile/attentive-react-native-sdk`.

## Table of Contents

- [Overview](#overview)
- [What Changed](#what-changed)
- [Breaking Changes](#breaking-changes)
- [Step-by-Step Migration](#step-by-step-migration)
- [Updated API Reference](#updated-api-reference)
- [Common Issues](#common-issues)
- [Testing Your Migration](#testing-your-migration)

## Overview

Starting with version **1.1.0**, the Attentive React Native SDK is compatible with React Native's new architecture (Fabric & TurboModules). This version maintains backward compatibility with the old architecture while introducing some API changes to support the new architecture's requirements.

### What You Need to Know

- **React Native Version**: This SDK now requires React Native 0.74 or higher
- **New Architecture**: Supports both old and new architecture
- **API Changes**: Import structure and event payload structure have changed
- **TypeScript**: Full TypeScript support with updated type definitions

## What Changed

### 1. Import Structure

The SDK now uses **named exports** instead of a default export.

### 2. Event Payload Structure

Event payloads have been flattened to comply with React Native Codegen requirements:

- **Item objects**: `price` and `currency` are now top-level properties (not nested in a `price` object)
- **Purchase events**: `orderId` is now a top-level property (not nested in an `order` object)
- **Mode enum**: Replaced with string literals (`"debug"` or `"production"`)

### 3. Type Names

Some type names have been updated for clarity:
- `AttentiveConfiguration` → `AttentiveSdkConfiguration`
- `AddToCartEvent` → `AddToCart`
- `ProductViewEvent` → `ProductView`
- `PurchaseEvent` → `Purchase`

## Breaking Changes

### 1. Imports

**Before:**
```typescript
import Attentive, { Mode, type AttentiveConfiguration } from '@attentive-mobile/attentive-react-native-sdk';
```

**After:**
```typescript
import { 
  initialize, 
  identify,
  recordProductViewEvent,
  recordAddToCartEvent,
  recordPurchaseEvent,
  type AttentiveSdkConfiguration,
  type UserIdentifiers 
} from '@attentive-mobile/attentive-react-native-sdk';
```

### 2. Initialization

**Before:**
```typescript
const config: AttentiveConfiguration = {
  attentiveDomain: 'your-domain',
  mode: Mode.Debug,
  enableDebugger: true,
};
Attentive.initialize(config);
```

**After:**
```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'your-domain',
  mode: 'debug', // Use string literal: 'debug' or 'production'
  enableDebugger: true,
};
initialize(config);
```

### 3. User Identification

**Before:**
```typescript
Attentive.identify({
  phone: '+15556667777',
  email: 'user@example.com',
});
```

**After:**
```typescript
const identifiers: UserIdentifiers = {
  phone: '+15556667777',
  email: 'user@example.com',
};
identify(identifiers);
```

### 4. Event Recording - Item Structure

**Before:**
```typescript
const event: ProductViewEvent = {
  items: [
    {
      productId: '123',
      productVariantId: '456',
      price: {
        price: '29.99',      // ❌ Nested object
        currency: 'USD',
      },
      name: 'Product Name',
    },
  ],
  deeplink: 'https://example.com/product/123',
};
Attentive.recordProductViewEvent(event);
```

**After:**
```typescript
const event: ProductView = {
  items: [
    {
      productId: '123',
      productVariantId: '456',
      price: '29.99',        // ✅ Top-level property
      currency: 'USD',       // ✅ Top-level property
      name: 'Product Name',
    },
  ],
  deeplink: 'https://example.com/product/123',
};
recordProductViewEvent(event);
```

### 5. Event Recording - Purchase

**Before:**
```typescript
const event: PurchaseEvent = {
  items: [...],
  order: {                   // ❌ Nested object
    orderId: '789',
  },
};
Attentive.recordPurchaseEvent(event);
```

**After:**
```typescript
const event: Purchase = {
  items: [...],
  orderId: '789',           // ✅ Top-level property
  cartId: 'optional-cart-id',
  cartCoupon: 'optional-coupon',
};
recordPurchaseEvent(event);
```

### 6. Other Methods

All methods now use named function imports:

**Before:**
```typescript
Attentive.triggerCreative('creative-id');
Attentive.destroyCreative();
Attentive.clearUser();
Attentive.recordCustomEvent({
  type: 'custom-event',
  properties: { key: 'value' },
});
```

**After:**
```typescript
triggerCreative('creative-id');
destroyCreative();
clearUser();
recordCustomEvent({
  type: 'custom-event',
  properties: { key: 'value' },
});
```

## Step-by-Step Migration

### Step 1: Update Package

```bash
npm install @attentive-mobile/attentive-react-native-sdk@latest
# or
yarn add @attentive-mobile/attentive-react-native-sdk@latest
```

### Step 2: Update React Native (if needed)

Ensure you're on React Native 0.74 or higher:

```bash
npm install react-native@latest
```

### Step 3: Update Imports

Find all imports of the SDK and update them:

```typescript
// Find this pattern:
import Attentive from '@attentive-mobile/attentive-react-native-sdk';

// Replace with individual named imports:
import { 
  initialize,
  identify,
  triggerCreative,
  // ... add other functions you use
} from '@attentive-mobile/attentive-react-native-sdk';
```

### Step 4: Update Configuration

Replace `Mode` enum usage with string literals:

```typescript
// Old
import { Mode } from '@attentive-mobile/attentive-react-native-sdk';
const config = { mode: Mode.Debug };

// New
const config = { mode: 'debug' };
```

### Step 5: Update Event Payloads

Search for all event recording calls and flatten the payload structure:

#### Product View & Add to Cart Events

```typescript
// Old structure
const items = [{
  productId: '123',
  productVariantId: '456',
  price: {
    price: '29.99',
    currency: 'USD',
  },
}];

// New structure
const items = [{
  productId: '123',
  productVariantId: '456',
  price: '29.99',
  currency: 'USD',
}];
```

#### Purchase Events

```typescript
// Old structure
const event = {
  items: [...],
  order: { orderId: '789' },
};

// New structure
const event = {
  items: [...],
  orderId: '789',
};
```

### Step 6: Update Method Calls

Replace all `Attentive.` calls with direct function calls:

```typescript
// Old
Attentive.initialize(config);
Attentive.identify(identifiers);

// New
initialize(config);
identify(identifiers);
```

### Step 7: Install Native Dependencies

#### iOS
```bash
cd ios && pod install && cd ..
```

#### Android
```bash
cd android && ./gradlew clean && cd ..
```

### Step 8: Rebuild Your App

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## Updated API Reference

### Initialization

```typescript
import { initialize, type AttentiveSdkConfiguration } from '@attentive-mobile/attentive-react-native-sdk';

const config: AttentiveSdkConfiguration = {
  attentiveDomain: string;              // Required: Your Attentive domain
  mode: 'debug' | 'production';         // Required: SDK mode
  skipFatigueOnCreatives?: boolean;     // Optional: Skip fatigue rules (default: false)
  enableDebugger?: boolean;             // Optional: Enable debug helpers (default: false)
};

initialize(config);
```

### User Identification

```typescript
import { identify, type UserIdentifiers } from '@attentive-mobile/attentive-react-native-sdk';

const identifiers: UserIdentifiers = {
  phone?: string;                       // User's phone number
  email?: string;                       // User's email
  klaviyoId?: string;                   // Klaviyo user ID
  shopifyId?: string;                   // Shopify user ID
  clientUserId?: string;                // Your internal user ID
  customIdentifiers?: Record<string, string>; // Custom key-value pairs
};

identify(identifiers);
```

### Product Events

```typescript
import { 
  recordProductViewEvent, 
  recordAddToCartEvent,
  type ProductView,
  type AddToCart 
} from '@attentive-mobile/attentive-react-native-sdk';

// Define items
const items = [{
  productId: string;                    // Required: Product ID
  productVariantId: string;             // Required: Variant ID
  price: string;                        // Required: Price as string
  currency: string;                     // Required: Currency code (e.g., 'USD')
  productImage?: string;                // Optional: Image URL
  name?: string;                        // Optional: Product name
  quantity?: number;                    // Optional: Quantity
  category?: string;                    // Optional: Product category
}];

// Product View
const productView: ProductView = {
  items,
  deeplink?: string;                    // Optional: Deep link URL
};
recordProductViewEvent(productView);

// Add to Cart
const addToCart: AddToCart = {
  items,
  deeplink?: string;                    // Optional: Deep link URL
};
recordAddToCartEvent(addToCart);
```

### Purchase Events

```typescript
import { recordPurchaseEvent, type Purchase } from '@attentive-mobile/attentive-react-native-sdk';

const purchase: Purchase = {
  items: [...],                         // Same item structure as above
  orderId: string;                      // Required: Order ID
  cartId?: string;                      // Optional: Cart ID
  cartCoupon?: string;                  // Optional: Coupon code
};

recordPurchaseEvent(purchase);
```

### Custom Events

```typescript
import { recordCustomEvent, type CustomEvent } from '@attentive-mobile/attentive-react-native-sdk';

const event: CustomEvent = {
  type: string;                         // Required: Event type
  properties: Record<string, string>;   // Required: Event properties
};

recordCustomEvent(event);
```

### Creative Management

```typescript
import { triggerCreative, destroyCreative } from '@attentive-mobile/attentive-react-native-sdk';

// Show a creative (modal)
triggerCreative(creativeId?: string);   // Optional: Specific creative ID

// Dismiss the creative
destroyCreative();
```

### User Management

```typescript
import { clearUser } from '@attentive-mobile/attentive-react-native-sdk';

// Clear the current user
clearUser();
```

### Domain Updates

```typescript
import { updateDomain } from '@attentive-mobile/attentive-react-native-sdk';

// Update the Attentive domain
updateDomain(domain: string);
```

### Debug Helpers

```typescript
import { 
  invokeAttentiveDebugHelper, 
  exportDebugLogs 
} from '@attentive-mobile/attentive-react-native-sdk';

// Show debug UI (only if enableDebugger: true)
invokeAttentiveDebugHelper();

// Export debug logs
const logs: string = await exportDebugLogs();
console.log(logs);
```

## Common Issues

### Issue 1: "Cannot find name 'Mode'"

**Error:**
```
Cannot find name 'Mode'.
```

**Solution:**
Replace `Mode.Debug` and `Mode.Production` with string literals:

```typescript
// Before
mode: Mode.Debug

// After
mode: 'debug'
```

### Issue 2: Type Error on Item Objects

**Error:**
```
Type '{ productId: string; productVariantId: string; price: { price: string; currency: string; }; }' 
is not assignable to type 'Item'.
```

**Solution:**
Flatten the `price` object:

```typescript
// Before
{
  productId: '123',
  price: { price: '29.99', currency: 'USD' }
}

// After
{
  productId: '123',
  price: '29.99',
  currency: 'USD'
}
```

### Issue 3: Type Error on Purchase Events

**Error:**
```
Property 'order' does not exist on type 'Purchase'.
```

**Solution:**
Use `orderId` instead of nested `order` object:

```typescript
// Before
{
  items: [...],
  order: { orderId: '789' }
}

// After
{
  items: [...],
  orderId: '789'
}
```

### Issue 4: Import Error

**Error:**
```
Module '"@attentive-mobile/attentive-react-native-sdk"' has no default export.
```

**Solution:**
Use named imports instead of default import:

```typescript
// Before
import Attentive from '@attentive-mobile/attentive-react-native-sdk';

// After
import { initialize, identify } from '@attentive-mobile/attentive-react-native-sdk';
```

### Issue 5: Android Build Fails

**Error:**
```
error: cannot find symbol class AttentiveReactNativeSdkSpec
```

**Solution:**
1. Clean the Android build:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```
2. Clear the cache:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Rebuild:
   ```bash
   npx react-native run-android
   ```

### Issue 6: iOS Build Fails

**Error:**
```
'ReactCommon/RCTTurboModule.h' file not found
```

**Solution:**
1. Reinstall pods:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```
2. Rebuild:
   ```bash
   npx react-native run-ios
   ```

## Testing Your Migration

### 1. Type Checking

Ensure your TypeScript code compiles without errors:

```bash
npm run typecheck
# or
tsc --noEmit
```

### 2. Manual Testing Checklist

- [ ] App initializes without errors
- [ ] User identification works
- [ ] Product view events are tracked
- [ ] Add to cart events are tracked
- [ ] Purchase events are tracked
- [ ] Custom events are tracked
- [ ] Creative triggers and dismisses correctly
- [ ] Debug helpers work (if enabled)

### 3. Automated Testing

Update your tests to use the new API:

```typescript
import { initialize, identify } from '@attentive-mobile/attentive-react-native-sdk';

describe('Attentive SDK', () => {
  it('should initialize', () => {
    initialize({
      attentiveDomain: 'test',
      mode: 'debug',
    });
    // assertions...
  });

  it('should identify user', () => {
    identify({
      email: 'test@example.com',
    });
    // assertions...
  });
});
```

## Migration Examples

### Complete Before/After Example

#### Before (Old API)

```typescript
import Attentive, { 
  Mode, 
  type AttentiveConfiguration,
  type ProductViewEvent,
  type PurchaseEvent 
} from '@attentive-mobile/attentive-react-native-sdk';

// Initialize
const config: AttentiveConfiguration = {
  attentiveDomain: 'mystore',
  mode: Mode.Production,
  enableDebugger: false,
};
Attentive.initialize(config);

// Identify user
Attentive.identify({
  email: 'user@example.com',
  phone: '+15551234567',
});

// Track product view
const productView: ProductViewEvent = {
  items: [{
    productId: 'prod_123',
    productVariantId: 'var_456',
    price: {
      price: '49.99',
      currency: 'USD',
    },
    name: 'T-Shirt',
  }],
  deeplink: 'myapp://product/123',
};
Attentive.recordProductViewEvent(productView);

// Track purchase
const purchase: PurchaseEvent = {
  items: [{
    productId: 'prod_123',
    productVariantId: 'var_456',
    price: {
      price: '49.99',
      currency: 'USD',
    },
  }],
  order: {
    orderId: 'order_789',
  },
};
Attentive.recordPurchaseEvent(purchase);
```

#### After (New API)

```typescript
import { 
  initialize,
  identify,
  recordProductViewEvent,
  recordPurchaseEvent,
  type AttentiveSdkConfiguration,
  type ProductView,
  type Purchase 
} from '@attentive-mobile/attentive-react-native-sdk';

// Initialize
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'mystore',
  mode: 'production',
  enableDebugger: false,
};
initialize(config);

// Identify user
identify({
  email: 'user@example.com',
  phone: '+15551234567',
});

// Track product view
const productView: ProductView = {
  items: [{
    productId: 'prod_123',
    productVariantId: 'var_456',
    price: '49.99',
    currency: 'USD',
    name: 'T-Shirt',
  }],
  deeplink: 'myapp://product/123',
};
recordProductViewEvent(productView);

// Track purchase
const purchase: Purchase = {
  items: [{
    productId: 'prod_123',
    productVariantId: 'var_456',
    price: '49.99',
    currency: 'USD',
  }],
  orderId: 'order_789',
};
recordPurchaseEvent(purchase);
```

## Need Help?

If you encounter issues during migration:

1. Check the [Common Issues](#common-issues) section
2. Review the [Updated API Reference](#updated-api-reference)
3. See the example app in the repository for working code samples
4. Open an issue on GitHub with:
   - Your React Native version
   - Error messages and stack traces
   - Minimal reproduction code

## Summary of Changes

| Category | Old API | New API |
|----------|---------|---------|
| **Import** | Default import | Named exports |
| **Mode** | `Mode.Debug` enum | `'debug'` string |
| **Type Names** | `AttentiveConfiguration` | `AttentiveSdkConfiguration` |
| **Item Price** | Nested `price` object | Flat `price` + `currency` |
| **Purchase Order** | Nested `order` object | Flat `orderId` |
| **Method Calls** | `Attentive.method()` | `method()` |

---

**Migration complete!** Your app is now ready to use the new architecture-compatible Attentive SDK. 🎉

