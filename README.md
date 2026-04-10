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

On Android, `AttentiveSdk.initialize()` **must** be called from your `Application.onCreate()` in native Kotlin/Java code. There are two reasons for this:

1. **Lifecycle observers must be registered before the React Native bridge is ready.** Internally, the SDK creates an `AppLaunchTracker` that calls `lifecycle.addObserver()` on the `ProcessLifecycleOwner`. If initialization happens after the bridge starts, early app-launch events can be missed.
2. **`lifecycle.addObserver()` requires the main thread.** AndroidX enforces this with an `IllegalStateException` if called from a background thread. `Application.onCreate()` is guaranteed by the Android system to run on the main thread, so calling `initialize` there satisfies this requirement automatically — no extra threading machinery needed.

> **Do not** call `AttentiveSdk.initialize()` from a background thread or a coroutine dispatcher other than `Dispatchers.Main`. Doing so will throw an `IllegalStateException` from inside the AndroidX Lifecycle library.

Add the following to your `MainApplication.kt` (or `MainApplication.java`):

```kotlin
import android.app.Application
import com.attentive.androidsdk.AttentiveConfig
import com.attentive.androidsdk.AttentiveSdk
import com.attentive.androidsdk.AttentiveLogLevel

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

        // Application.onCreate() is always called on the main thread by the Android system,
        // so no thread-switching wrapper is needed here.
        AttentiveSdk.initialize(config)
    }
}
```

After the native initialization, all other SDK operations (`identify`, `recordAddToCartEvent`, `recordPurchaseEvent`, etc.) are called from TypeScript as normal on both platforms.

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

The SDK supports push notification integration on both iOS (APNs) and Android (FCM). The following sections cover iOS-specific setup flows. On Android, push notification integration is handled entirely in native Kotlin/Java code — see [App Events on Android](#app-events-on-android) for details.

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

On Android, **regular app open and foreground events are handled automatically** by the native Android SDK once `AttentiveSdk.initialize()` is called from `Application.onCreate()` (see [Android Native Initialization](#android--initialize-from-native-code)). The lifecycle observers registered during initialization (e.g. `AppLaunchTracker`) take care of this transparently — there is no need to manually call `handleRegularOpen` or subscribe to `AppState` changes.

The only TypeScript-side step required on Android is calling `identify()` with any available user identifiers as early as possible in your app’s lifecycle (e.g. in the root component `useEffect`).

#### Prerequisites

1. **AndroidManifest** – Declare the notification permission for Android 13+:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <!-- other permissions -->
</manifest>
```

2. **Native initialization** – The SDK must be initialized from `Application.onCreate()` on Android (see [Android Native Initialization](#android--initialize-from-native-code) above). App open and lifecycle events are then tracked automatically.

#### TypeScript setup (Android)

After native initialization, the only required TypeScript call is `identify()`:

```typescript
import { Platform } from 'react-native';
import { initialize, identify } from 'attentive-react-native-sdk';

// Inside your root component (e.g. App.tsx useEffect):
if (Platform.OS === 'ios') {
  initialize(config);
}

identify({ email: 'user@example.com', clientUserId: 'id-123' });
```

#### Push notifications on Android (FCM)

On Android, FCM token registration and push notification handling are managed natively in Kotlin/Java. This gives you full control over the Firebase Messaging lifecycle and ensures events are tracked before the React Native bridge initialises.

Add Firebase Cloud Messaging to your app following the [Firebase Android setup guide](https://firebase.google.com/docs/cloud-messaging/android/client), then handle token registration and notification events in your native `FirebaseMessagingService`:

```kotlin
import com.attentive.androidsdk.AttentiveSdk
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AttentiveMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Register the FCM token with the Attentive SDK
        AttentiveSdk.registerDeviceToken(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        // Handle foreground push delivery
        AttentiveSdk.handleForegroundPush(remoteMessage.data)
    }
}
```

For notification opens (when the user taps a push notification), handle the intent in your main `Activity`:

```kotlin
import com.attentive.androidsdk.AttentiveSdk

class MainActivity : ReactActivity() {

    override fun onResume() {
        super.onResume()
        intent?.let { AttentiveSdk.handlePushOpen(it) }
    }
}
```

Declare the service in your `AndroidManifest.xml`:

```xml
<service
    android:name=".AttentiveMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

Refer to the [Attentive Android SDK documentation](https://github.com/attentive-mobile/attentive-android-sdk) for the full list of native APIs available for push notification integration.

---

#### Request Push Permission (iOS)

```typescript
import { registerForPushNotifications } from 'attentive-react-native-sdk';

// Request permission to send push notifications
// This will show the iOS system permission dialog
registerForPushNotifications();
```

#### Register Device Token (iOS)

When your iOS app receives an APNs device token, register it with the Attentive backend:

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

#### Handle Push Notification Opens (iOS)

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

#### Handle Foreground Notifications (iOS)

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
- [Push Notifications Integration Guide](./docs/PUSH_NOTIFICATIONS_INTEGRATION.md) - Callback-based registration, complete AppDelegate implementation, Android and iOS token flow
- [Push Notifications Setup](./docs/PUSH_NOTIFICATIONS_SETUP.md) - Apple Developer Portal, APNs certificates, and TestFlight configuration
- [iOS Native SDK documentation](https://github.com/attentive-mobile/attentive-ios-sdk) - Native SDK reference

For Android push notification integration, see the **[App Events on Android](#app-events-on-android)** section above.
