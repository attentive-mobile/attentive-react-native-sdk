# attentive-react-native-sdk

# Attentive React Native SDK
The Attentive React Native SDK provides the functionality to render Attentive creative units and collect Attentive events in React Native mobile applications.

## Package Manager

This project uses **npm** as the preferred package manager for consistency and alignment with modern React Native best practices. While this library will work with any package manager (npm, yarn, or pnpm), the development scripts are configured to use npm.

**Note on package managers:** Modern npm (v7+) has significantly improved performance and features, making it the recommended choice for React Native projects. Both npm and yarn work well with React Native, but this project standardizes on npm for development workflows.

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

> **Platform difference:** iOS and Android have different initialization requirements.

#### iOS — Initialize from TypeScript

On iOS, call `initialize` from TypeScript as early as possible (e.g. the root `App` component's `useEffect`):

```typescript
// Called once per app session, before any other SDK operations.
Attentive.initialize(config);
```

#### Android — Initialize from Native Code

On Android, `AttentiveSdk.initialize()` **must** be called from your `Application.onCreate()` in native Kotlin/Java code. This is required so that lifecycle observers (e.g. `AppLaunchTracker`) are registered before the React Native bridge is ready. Calling `initialize()` from TypeScript on Android is a **no-op** — the SDK will not be started and all subsequent event calls will fail.

Add the following to your `MainApplication.kt` (or `MainApplication.java`):

```kotlin
import android.app.Application
import com.attentive.androidsdk.AttentiveConfig
import com.attentive.androidsdk.AttentiveSdk
import com.attentive.androidsdk.AttentiveLogLevel
import com.facebook.react.bridge.UiThreadUtil

class MainApplication : Application(), ReactApplication {

    override fun onCreate() {
        super.onCreate()
        // ... your existing setup ...
        initAttentiveSDK()
    }

    private fun initAttentiveSDK() {
        val config = AttentiveConfig.Builder()
            .applicationContext(this)
            .domain("YOUR_ATTENTIVE_DOMAIN")
            .mode(AttentiveConfig.Mode.PRODUCTION) // or Mode.DEBUG for testing
            .skipFatigueOnCreatives(false)
            .logLevel(AttentiveLogLevel.VERBOSE)
            .build()

        // AttentiveSdk.initialize registers lifecycle observers and must run on the main thread.
        UiThreadUtil.runOnUiThread {
            AttentiveSdk.initialize(config)
        }
    }
}
```

After the native initialization, all other SDK operations (`identify`, `recordAddToCartEvent`, `recordPurchaseEvent`, etc.) are called from TypeScript as normal on both platforms. The TypeScript `initialize()` call is still required on iOS but is safely ignored on Android.

> **Tip:** If you see `[AttentiveSDK] recordAddToCartEvent failed — SDK may not be initialized` in your Android logcat, it means `AttentiveSdk.initialize()` was not called from native code before the event was recorded. Check your `Application.onCreate()` setup.

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

### Push Notifications (iOS and Android)

The SDK supports push notification integration on both iOS (APNs) and Android (runtime permission + optional FCM). The following sections cover iOS-specific flows and a full **App events on Android** implementation that mirrors the behavior of the [Bonni](https://github.com/attentive-mobile/attentive-react-native-sdk/tree/main/Bonni) example app.

> **iOS — required setup:** Your AppDelegate **must** forward notification
> responses to the SDK for push tracking to work. Add this single line to your
> `userNotificationCenter(_:didReceive:withCompletionHandler:)`:
>
> ```swift
> AttentiveSDKManager.shared.handleNotificationResponse(response)
> ```
>
> Without this, push open and foreground push events **will not be tracked** on
> iOS. See [iOS AppDelegate Integration](#ios-appdelegate-integration) for full
> details.
>
> **Migrating from an earlier version?** If you previously called
> `AttentiveSDKManager.shared.handleForegroundPush(response:authorizationStatus:)`
> or `AttentiveSDKManager.shared.handlePushOpen(response:authorizationStatus:)`
> directly from your AppDelegate, **replace** that code with the single
> `handleNotificationResponse` call above. Using both will result in
> double-tracked events. The old methods are now deprecated.

---

### App Events on Android

This section describes how to implement Attentive app events on Android so they behave like the iOS flow: **regular app opens** (launch and resume from background) and **notification permission** are handled using the SDK’s native Android APIs. You can add FCM token registration and push open handling when your app uses Firebase Cloud Messaging.

| SDK method | Purpose on Android |
|------------|--------------------|
| `getPushAuthorizationStatus()` | Returns `authorized`, `denied`, or `notDetermined` (uses `POST_NOTIFICATIONS` on API 33+). Use before `handleRegularOpen` so tracking uses the correct status. |
| `registerForPushNotifications()` | Requests `POST_NOTIFICATIONS` on Android 13+; no-op on older versions. |
| `handleRegularOpen(authStatus)` | Tracks a regular app open (launch or return to foreground). Call after `identify()` and pass the result of `getPushAuthorizationStatus()`. |
| `registerDeviceToken` / `registerDeviceTokenWithCallback` | Optional. Register your FCM token when using Firebase Cloud Messaging. |
| `handlePushOpen` / `handleForegroundPush` | Optional. Call when the user opens a notification or receives one in the foreground. |

#### Overview

- **Regular app open** – Call `handleRegularOpen(authorizationStatus)` when the app is opened (launch or returning to foreground). The SDK uses this for tracking and the `/mtctrl` endpoint.
- **Permission status** – On Android 13+ (API 33+), notification permission is `POST_NOTIFICATIONS`. The SDK exposes `getPushAuthorizationStatus()` so you can pass the correct status into `handleRegularOpen`.
- **Requesting permission** – Call `registerForPushNotifications()` to trigger the system permission dialog on Android 13+; it is a no-op on older versions.
- **Order of operations** – Always call `identify()` before any `handleRegularOpen()` so the SDK has user context for network requests.

#### Prerequisites

1. **AndroidManifest** – Declare the notification permission for Android 13+:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <!-- other permissions -->
</manifest>
```

2. **Initialize and identify first** – The SDK must be initialized natively from `Application.onCreate()` on Android (see [Android Native Initialization](#android--initialize-from-native-code) above). Then, in your app entry (e.g. root component `useEffect`), call `identify(identifiers)` before any push or app-event logic.

#### 1. On app launch (Android)

Right after `identify()`, do the following for the Android path:

1. Get the current notification authorization status with `getPushAuthorizationStatus()`.
2. Call `handleRegularOpen(authStatus)` with that status.
3. Optionally call `registerForPushNotifications()` to prompt for permission (Android 13+).

```typescript
import { Platform } from 'react-native';
import {
  initialize,
  identify,
  getPushAuthorizationStatus,
  registerForPushNotifications,
  handleRegularOpen,
  type AttentiveSdkConfiguration,
  type PushAuthorizationStatus,
} from 'attentive-react-native-sdk';

// Inside your root component (e.g. App.tsx useEffect):

// iOS only: initialize from TypeScript.
// Android: initialization must be done natively from Application.onCreate() — see README.
if (Platform.OS === 'ios') {
  initialize(config);
}

identify({ email: 'user@example.com', clientUserId: 'id-123' });

if (Platform.OS === 'android') {
  getPushAuthorizationStatus()
    .then((authStatus: PushAuthorizationStatus) => {
      handleRegularOpen(authStatus);
    })
    .catch(() => {
      handleRegularOpen('authorized'); // fallback
    });
  registerForPushNotifications(); // Shows permission dialog on Android 13+
}
```

#### 2. When app returns to foreground (Android)

Subscribe to `AppState` and, when the app becomes `active`, get the current status and call `handleRegularOpen` again:

```typescript
import { AppState } from 'react-native';
import { getPushAuthorizationStatus, handleRegularOpen } from 'attentive-react-native-sdk';
import type { PushAuthorizationStatus } from 'attentive-react-native-sdk';

const subscription = AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active' && Platform.OS === 'android') {
    getPushAuthorizationStatus()
      .then((authStatus: PushAuthorizationStatus) => {
        handleRegularOpen(authStatus);
      })
      .catch(() => {
        handleRegularOpen('authorized');
      });
  }
});

// Cleanup on unmount:
return () => subscription.remove();
```

#### 3. Optional: Register FCM token (Android)

**Recommended:** This React Native SDK’s Android native module depends on Attentive Android SDK **2.1.1**, which exposes `AttentiveSdk.getPushTokenWithCallback`. Calling `registerForPushNotifications()` from JS triggers that API: the SDK requests permission (when needed), fetches the FCM token, and registers it with Attentive. No separate native code is required.

**Alternative (token from JS):** If you obtain the FCM token elsewhere (e.g. Firebase Messaging), use `registerDeviceTokenWithCallback` and then call `handleRegularOpen` in the callback:

```typescript
import { registerDeviceTokenWithCallback, handleRegularOpen } from 'attentive-react-native-sdk';

getPushAuthorizationStatus().then((authStatus) => {
  registerDeviceTokenWithCallback(
    fcmToken,
    authStatus,
    (data, url, response, error) => {
      if (error) {
        console.error('Attentive token registration failed', error);
      }
      handleRegularOpen(authStatus);
    }
  );
});
```

#### 4. Optional: Handle notification opens and foreground (Android)

If you handle FCM messages (e.g. with `@react-native-firebase/messaging`), you can report notification opens and foreground receives the same way as on iOS:

- **User opened notification (background/inactive):** `handlePushOpen(payload, authorizationStatus)`
- **Notification received while app in foreground:** `handleForegroundPush(payload, authorizationStatus)`

Get `authorizationStatus` via `getPushAuthorizationStatus()` when handling the event.

#### Complete Android flow (reference)

The [Bonni](https://github.com/attentive-mobile/attentive-react-native-sdk/tree/main/Bonni) example app ([App.tsx](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/Bonni/App.tsx)) implements the full flow:

1. **Launch:** Native `AttentiveSdk.initialize(config)` (from `Application.onCreate()`) → TypeScript `identify` → `getPushAuthorizationStatus()` → `handleRegularOpen(authStatus)` → `registerForPushNotifications()`.
2. **Foreground:** `AppState.addEventListener('change', …)` → when `active` and Android → `getPushAuthorizationStatus()` → `handleRegularOpen(authStatus)`.
3. **Optional:** When FCM token is available → `registerDeviceTokenWithCallback(token, authStatus, callback)` → in callback call `handleRegularOpen(authStatus)`.
4. **Optional:** When user opens a notification or receives one in foreground → `handlePushOpen` / `handleForegroundPush` with payload and status from `getPushAuthorizationStatus()`.

---

#### Request Push Permission (iOS)

```typescript
import { registerForPushNotifications } from 'attentive-react-native-sdk';

// Request permission to send push notifications
// This will show the iOS system permission dialog
registerForPushNotifications();
```

#### Register Device Token (iOS: APNs / Android: FCM)

When your app receives a device token (APNs on iOS, FCM on Android), register it with the Attentive backend:

```typescript
import { registerDeviceToken } from 'attentive-react-native-sdk';

// In your AppDelegate or push notification handler:
// Convert the device token Data to a hex string and pass the authorization status
registerDeviceToken(hexEncodedToken, 'authorized');
```

The `authorizationStatus` parameter should be one of:
- `'authorized'` - User has granted permission
- `'denied'` - User has denied permission
- `'notDetermined'` - User hasn't been asked yet
- `'provisional'` - Provisional authorization (quiet notifications)
- `'ephemeral'` - App Clip notifications

#### Handle Push Notification Opens (iOS and Android)

When a user taps on a push notification, track the event:

```typescript
import { handlePushOpened } from 'attentive-react-native-sdk';
import type { ApplicationState, PushAuthorizationStatus } from 'attentive-react-native-sdk';

// In your notification handler:
handlePushOpened(
  notificationPayload,    // The notification's userInfo/data
  'background',           // App state: 'active', 'inactive', or 'background'
  'authorized'            // Current authorization status
);
```

#### Handle Foreground Notifications (iOS and Android)

When a notification arrives while the app is in the foreground:

```typescript
import { handleForegroundNotification } from 'attentive-react-native-sdk';

// In your foreground notification handler:
handleForegroundNotification(notificationPayload);
```

#### iOS AppDelegate Integration

For proper push notification integration, your iOS AppDelegate needs to:

1. Request notification permissions via the SDK
2. Implement `application:didRegisterForRemoteNotificationsWithDeviceToken:` to register the token
3. **Forward notification responses to the SDK for push-open tracking**

##### Push Open Tracking (Required)

Add **one line** to your AppDelegate's `didReceive` handler so the SDK can track
push opens and foreground push events. Without this, `handlePushOpen()` and
`handleForegroundPush()` called from JavaScript will not be able to track events
on iOS (the native SDK requires a `UNNotificationResponse` which cannot cross the
React Native bridge).

```swift
// In AppDelegate.swift — UNUserNotificationCenterDelegate
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
) {
    // Attentive push tracking (handles app-state + auth status automatically)
    AttentiveSDKManager.shared.handleNotificationResponse(response)

    // Forward to your push library (e.g. RNCPushNotificationIOS) for JS events
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
}
```

`handleNotificationResponse` automatically:
- Detects whether the app is in the foreground or background
- Fetches the current authorization status
- Calls the correct native SDK method (`handlePushOpen` or `handleForegroundPush`)
- Caches the response so the JS-side `handlePushOpen()` / `handleForegroundPush()` calls
  are fulfilled without double-tracking
- **Cold-launch safe:** If the user taps a push while the app is killed, the
  response is cached and automatically tracked once the SDK initializes

##### Callback-Based Registration (Recommended)

For more control over the registration flow, you can use the callback-based registration directly in your AppDelegate:

```swift
// In AppDelegate.swift
import UserNotifications
import attentive_react_native_sdk

func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
        let authStatus = settings.authorizationStatus

        // Get SDK instance with proper type
        guard let attentiveSdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK else {
            print("[Attentive] SDK not initialized")
            return
        }

        // Register device token with callback
        attentiveSdk.registerDeviceToken(
            deviceToken,
            authorizationStatus: authStatus,
            callback: { data, url, response, error in
                DispatchQueue.main.async {
                    // Handle registration result
                    if let error = error {
                        print("[Attentive] Registration failed: \(error.localizedDescription)")
                    }

                    // Trigger regular open event after registration
                    attentiveSdk.handleRegularOpen(authorizationStatus: authStatus)
                }
            }
        )
    }
}
```

**Documentation:**
- [Push Token Registration Guide](./docs/PUSH_TOKEN_REGISTRATION_GUIDE.md) - Detailed guide for callback-based registration
- [AppDelegate Callback Example](./docs/APPDELEGATE_CALLBACK_EXAMPLE.md) - Complete AppDelegate implementation
- [Push Notifications Setup](./docs/PUSH_NOTIFICATIONS_SETUP.md) - General push notification setup
- [iOS Native SDK documentation](https://github.com/attentive-mobile/attentive-ios-sdk) - Native SDK reference

For a full Android implementation (app launch, foreground, permission, and optional FCM), see the **[App Events on Android](#app-events-on-android)** section above.
