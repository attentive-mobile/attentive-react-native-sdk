# Bonni Beauty - React Native Example App

A comprehensive example app demonstrating the integration of the Attentive React Native SDK. This app uses React Native 0.77 and follows best practices for cross-platform mobile development while replicating the native iOS and Android "Bonni" example app.

## Overview

Bonni Beauty is a fictional e-commerce beauty products store that showcases all major features of the Attentive SDK, including:

- User identification and management
- Product view event tracking
- Add to cart event tracking
- Purchase event tracking
- Custom events
- Creative display triggering
- SDK testing and configuration

## Features

### Complete E-commerce Flow

1. **Login Screen** - Welcome screen with guest access and account creation
2. **Create Account** - User registration with SDK identification
3. **Product Catalog** - 2-column grid displaying 6 beauty products
4. **Product Details** - Detailed product view with automatic event tracking
5. **Shopping Cart** - Full cart management with quantity controls
6. **Checkout** - Complete checkout flow with address and payment forms
7. **Order Confirmation** - Success screen with purchase event tracking
8. **Settings** - SDK testing and configuration panel

### Attentive SDK Integration

- **Automatic Event Tracking**: Product views, add to cart, and purchases
- **User Identification**: Email and phone number identification
- **Creative Display**: Trigger SDK creative displays
- **Custom Events**: Send custom event data
- **User Management**: Clear user data, switch users

## Getting Started

### Prerequisites

- Node.js >= 18
- React Native development environment set up
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install iOS pods:
```bash
npm run pods
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## SDK Configuration

Update the Attentive domain in `App.tsx`:

```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'your-domain', // Replace with your Attentive domain
  mode: 'production',
  enableDebugger: true,
};
```

## Testing the SDK

Use the **Settings** screen to:

1. Switch users (update email/phone)
2. Clear user data
3. Trigger creative display
4. Send custom events
5. Add email/phone identifiers

## Cross-Platform Compatibility

This app is built with React Native 0.77 and supports:

- ✅ iOS 13.0+
- ✅ Android API 21+ (5.0 Lollipop)

All features work identically on both platforms, demonstrating true cross-platform development.

## License

MIT
