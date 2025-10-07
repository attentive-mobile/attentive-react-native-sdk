# attentive-react-native-sdk

# Attentive React Native SDK
The Attentive React Native SDK provides the functionality to render Attentive creative units and collect Attentive events in React Native mobile applications.

## Installation

Run `npm install @attentive-mobile/attentive-react-native-sdk` from your app's root directory.

## Usage
See the [Example Project](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/example)
for a sample of how the Attentive React Native SDK is used.

__*** NOTE: Please refrain from using any private or undocumented classes or methods as they may change between releases. ***__

### Import the SDK

```typescript
import { Attentive, <other types you need here> } from 'attentive-react-native-sdk';
```

### Create the AttentiveConfig

```typescript
// Create an AttentiveConfiguration with your attentive domain, in production mode
const config : AttentiveConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: Mode.Production,
}
```
```typescript
// Alternatively, use "debug" mode. When in debug mode, the Creative will not be shown, but instead a popup will show with debug information about your creative and any reason the Creative wouldn't show.
const config : AttentiveConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: Mode.Debug,
}
```

### Debugging Features

The SDK includes debugging helpers to show what data is being sent and received. Enable debugging by setting `enableDebugger: true`:

```typescript
const config : AttentiveConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: Mode.Debug,
  enableDebugger: true, // Shows debug overlays for events and creatives
}
```

When enabled, debug overlays will automatically appear when:
- Creatives are triggered
- Events are recorded (product views, purchases, etc.)

You can also manually invoke the debug helper:

```typescript
Attentive.invokeAttentiveDebugHelper();
```

See [DEBUGGING.md](./DEBUGGING.md) for detailed information about debugging features.

### Initialize the SDK

```typescript
// 'initialize' should be called as soon as possible after the app starts (see the example app for an example of initializing the SDK in the App element)
// Note: 'initialize' should only be called once per app session - if you call it multiple times it will throw an exception
Attentive.initialize(config);
```

### Destroy the creative

```typescript
// This will remove the creative along with its web view
Attentive.destroyCreative();
```


### Identify the current user
```typescript
// Before loading the creative or sending events, if you have any user identifiers, they will need to be registered. Each identifier is optional. It is okay to skip this step if you have no identifiers about the user yet.
const identifiers : UserIdentifiers = {
  'phone': '+15556667777',
  'email': 'some_email@gmailfake.com',
  'klaviyoId': 'userKlaviyoId',
  'shopifyId': 'userShopifyId',
  'clientUserId': 'userClientUserId',
  'customIdentifiers': { 'customIdKey': 'customIdValue' }
};
Attentive.identify(identifiers);
```

The more identifiers that are passed to `identify`, the better the SDK will function. Here is the list of possible identifiers:
| Identifier Name    | Type                  | Description                                                                                                             |
| ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Client User ID     | String                | Your unique identifier for the user. This should be consistent across the user's lifetime. For example, a database id.  |
| Phone              | String                | The users's phone number in E.164 format                                                                                |
| Email              | String                | The users's email                                                                                                       |
| Shopify ID         | String                | The users's Shopify ID                                                                                                  |
| Klaviyo ID         | String                | The users's Klaviyo ID                                                                                                  |
| Custom Identifiers | Map<String,String>    | Key-value pairs of custom identifier names and values. The values should be unique to this user.                        |

### Load the Creative

```typescript
// Trigger the Creative. This will show the Creative as a pop-up over the rest of the app.
Attentive.triggerCreative();
```

### Record user events

The SDK currently supports `PurchaseEvent`, `AddToCartEvent`, `ProductViewEvent`, and `CustomEvent`.

```typescript
// Construct one or more "Item"s, which represents the product(s) purchased
const items : Item[] = [
        {
          productId: '555',
          productVariantId: '777',
          price: {
            price: '14.99',
            currency: 'USD',
          },
        },
      ];

// Construct an "Order", which represents the order for the purchase
const order : Order = {
  orderId: '88888'
}

// (Optional) Construct a "Cart", which represents the cart this Purchase was made from
const cart : Cart = {
  cartId: '555555',
  cartCoupon: 'SOME-DISCOUNT'
}

// Construct a PurchaseEvent, which ties together the preceding objects
const purchaseEvent : PurchaseEvent = {
  items: items,
  order: order,
  cart: cart
}

// Record the PurchaseEvent
Attentive.recordPurchaseEvent(purchaseEvent);
```

The process is similar for the other events. See [eventTypes.tsx](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/src/eventTypes.tsx) for all events.

### Update the current user when new identifiers are available

```typescript
// If new identifiers are available for the user, register them
Attentive.identify({email: 'theusersemail@gmail.com'});
```

```typescript
Attentive.identify({email: 'theusersemail@gmail.com'});
Attentive.identify({phone: '+15556667777'};)
// The SDK will have these two identifiers:
//   email: 'theusersemail@gmail.com'
//   phone: '+15556667777'
```
