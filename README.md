# attentive-react-native-sdk

# Attentive React Native SDK
The Attentive React Native SDK provides the functionality to render Attentive creative units and collect Attentive events in React Native mobile applications.

## Package Manager

This project uses **npm** as the preferred package manager for consistency and alignment with modern React Native best practices. While this library will work with any package manager (npm, yarn, or pnpm), the development scripts are configured to use npm.

**Note on package managers:** Modern npm (v7+) has significantly improved performance and features, making it the recommended choice for React Native projects. Both npm and yarn work well with React Native, but this project standardizes on npm for development workflows.

## Requirements

| Tool | Version |
|------|---------|
| Node.js | >= 18.0.0 |
| React Native | >= 0.74 |
| Ruby | >= 3.3 |
| CocoaPods | ~> 1.16 |
| Xcode | >= 15 |
| Android SDK | API 24+ |
| JDK | 17 |

## Installation

Run `npm install @attentive-mobile/attentive-react-native-sdk` from your app's root directory.

## Setup with an AI coding agent

> [!WARNING]
> **Experimental.** Agent-assisted setup is a new, experimental feature. The [`AGENTS.md`](./AGENTS.md) guide and this flow may change, and results can vary by agent and project. Review whatever the agent changes before committing, and fall back to the manual steps below if anything looks off.

If you use Claude Code, Cursor, Copilot, Codex, or another AI coding agent, you can have the agent walk you through setup. Point it at [`AGENTS.md`](./AGENTS.md) in this repo — it's a step-by-step integration guide written for agents that handles the npm install, iOS `pod install` + TypeScript `initialize()`, and the **native** Android initialization in `MainApplication.onCreate()`.

**To trigger the flow**, open your project in your agent of choice and paste:

> Integrate the Attentive React Native SDK into this app. Follow the guide at https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/AGENTS.md top-to-bottom and ask me any questions it tells you to ask before writing code.

The agent flow intentionally stops at base integration. It does **not** wire up identify/clearUser, event recording, Creatives, marketing subscriptions, or push notifications — see the sections below for those.

## Usage
See the [Bonni example app](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/Bonni)
for a sample of how the Attentive React Native SDK is used.

__*** NOTE: Please refrain from using any private or undocumented classes or methods as they may change between releases. ***__

### Import the SDK

```typescript
import { initialize, identify, triggerCreative, recordPurchaseEvent, /* ... */ } from '@attentive-mobile/attentive-react-native-sdk';
```

### Create the AttentiveConfig

```typescript
// Create an AttentiveSdkConfiguration with your attentive domain, in production mode
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'production',
}
```
```typescript
// Alternatively, use "debug" mode. When in debug mode, the Creative will not be shown, but instead a popup will show with debug information about your creative and any reason the Creative wouldn't show.
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'debug',
}
```

### Debugging Features

The SDK includes debugging helpers to show what data is being sent and received. Enable debugging by setting `enableDebugger: true`:

```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'debug',
  enableDebugger: true, // Shows debug overlays for events and creatives
}
```

When enabled, debug overlays will automatically appear when:
- Creatives are triggered
- Events are recorded (product views, purchases, etc.)

You can also manually invoke the debug helper:

```typescript
invokeAttentiveDebugHelper();
```

See [DEBUGGING.md](./DEBUGGING.md) for detailed information about debugging features.

### Initialize the SDK

> **Platform difference:** iOS and Android have different initialization requirements.

#### iOS — Initialize from TypeScript

On iOS, call `initialize` from TypeScript as early as possible (e.g. the root `App` component's `useEffect`):

```typescript
// Called once per app session, before any other SDK operations.
initialize(config);
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
            .notificationIconId(R.drawable.ic_stat_notification)
            .skipFatigueOnCreatives(false)
            .logLevel(AttentiveLogLevel.VERBOSE)
            .build()

        // Application.onCreate() is always called on the main thread by the Android system,
        // so no thread-switching wrapper is needed here.
        AttentiveSdk.initialize(config)
    }
}
```

##### Android notification small icon

Android requires push notifications to use a small status-bar icon. If `notificationIconId` is not set, the Attentive Android SDK uses its default fallback icon. To use your app's branding, add a notification small icon resource to your host app and pass its resource ID during native initialization.

Add the icon to your Android app's drawable resources:

```text
android/app/src/main/res/drawable/ic_stat_notification.png
```

Use a white-only transparent PNG designed for Android notification status bars. Do not use the full-color launcher icon from `mipmap-*`, because Android masks small notification icons and it can render poorly.

Then add the icon to your existing `AttentiveConfig.Builder()` chain in `MainApplication.kt` before `build()`:

```text
android/app/src/main/java/<your-package>/MainApplication.kt
```

```kotlin
.notificationIconId(R.drawable.ic_stat_notification)
```

`MainApplication.kt` is host-app code, not generated by this SDK at runtime. If `R.drawable.ic_stat_notification` does not resolve, confirm the drawable file name matches exactly and that you are referencing your app module's `R` class.

After the native initialization, all other SDK operations (`identify`, `recordAddToCartEvent`, `recordPurchaseEvent`, etc.) are called from TypeScript as normal on both platforms.

> **Tip:** If you see `[AttentiveSDK] recordAddToCartEvent failed — SDK may not be initialized` in your Android logcat, it means `AttentiveSdk.initialize()` was not called from native code before the event was recorded. Check your `Application.onCreate()` setup.

### Identify the current user

Use `identify` to **add or enrich** information about the **current** user. As you gather identifiers (client user ID, email, phone, etc.), pass them to Attentive via `identify`. Each identifier is optional, and you can call `identify` repeatedly as you learn more about the user — **multiple calls combine the identifiers** rather than replacing them. The more identifiers you provide, the better the SDK functions.

`identify` only enriches the *current* user; it does **not** switch users. When a **different** user logs in on the same device, use [`updateUser`](#switch-the-current-user-updateuser) instead — it clears the previous user's identifiers first.

```typescript
// If you have any user identifiers, register them before loading the creative or
// sending events. Each identifier is optional — skip this step if you have none yet.
const identifiers: UserIdentifiers = {
  phone: '+15556667777',
  email: 'some_email@gmailfake.com',
  klaviyoId: 'userKlaviyoId',
  shopifyId: 'userShopifyId',
  clientUserId: 'userClientUserId',
  customIdentifiers: { customIdKey: 'customIdValue' }
};
identify(identifiers);
```

Here is the list of possible identifiers:
| Identifier Name    | Type                  | Description                                                                                                             |
| ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Client User ID     | String                | Your unique identifier for the user. This should be consistent across the user's lifetime. For example, a database id.  |
| Phone              | String                | The users's phone number in E.164 format                                                                                |
| Email              | String                | The users's email                                                                                                       |
| Shopify ID         | String                | The users's Shopify ID                                                                                                  |
| Klaviyo ID         | String                | The users's Klaviyo ID                                                                                                  |
| Custom Identifiers | Map<String,String>    | Key-value pairs of custom identifier names and values. The values should be unique to this user.                        |

Because identifiers accumulate, you can register them as they become available — later calls add to the set rather than overwriting it:

```typescript
identify({ email: 'theusersemail@gmail.com' });
identify({ phone: '+15556667777' });
// The SDK now has both identifiers:
//   email: 'theusersemail@gmail.com'
//   phone: '+15556667777'
```

### Switch the current user (`updateUser`)

Use `updateUser` to **switch to a different user** on the same device — for example, when one user logs out and a different user logs in. At least one of `email` or `phone` must be provided.

Calling `updateUser` automatically clears the identifiers previously associated with the current user — including detaching any push token from them — and associates the app with the new identifier(s) you provide, so all subsequent events and messages are attributed to the new user. It returns a `Promise` that resolves on success and rejects with an error on failure.

```typescript
try {
  // Switch to a different user on the same device
  await updateUser({ email: 'newuser@example.com', phone: '+15559876543' });
} catch (error) {
  // Handle the failure (e.g. surface an error to the user)
}
```

> Use `updateUser` only when switching to a different user. To add or enrich identifiers for the **current** user, prefer `identify` (shown above).

### Load the Creative

```typescript
// Trigger the Creative. This will show the Creative as a pop-up over the rest of the app.
triggerCreative();
```

### Destroy the creative

```typescript
// This will remove the creative along with its web view
destroyCreative();
```

### Observe creative lifecycle events

Subscribe with `addCreativeEventListener` to learn whether a creative actually opened and when the
user dismissed it — useful for analytics, or for holding back your own UI while a creative is on
screen.

```typescript
import { addCreativeEventListener, triggerCreative } from '@attentive-mobile/attentive-react-native-sdk';

useEffect(() => {
  const subscription = addCreativeEventListener(({ status, creativeId }) => {
    switch (status) {
      case 'opened':
        // The creative rendered and is visible to the user.
        break;
      case 'closed':
        // The user dismissed the creative.
        break;
      case 'notOpened':
        // The creative could not be shown — see the status table below.
        break;
      case 'notClosed':
        // Rare: the creative failed to close cleanly.
        break;
    }
  });

  return () => subscription.remove();
}, []);
```

One `triggerCreative()` call produces **more than one event over time** — `opened` and then
`closed` on the happy path — which is why this is an event stream rather than a callback or a
promise.

| `status` | Meaning |
|---|---|
| `opened` | The creative rendered and is visible. |
| `closed` | The creative was dismissed by the user tapping the creative's own close control. The Android hardware back button does **not** produce this event — see the caveats below. |
| `notOpened` | The creative could not be shown: no creative is configured for the app, the creative was fatigued, the load timed out, or an unknown error occurred. This is the single catch-all failure status on both platforms — it does not distinguish between those causes. See the Android caveat below. |
| `notClosed` | The creative failed to close cleanly (e.g. the web view was already gone). **Android only in practice** — `attentive-ios-sdk` 2.0.15 declares this status but never reports it, so an iOS-only integration will never see it. |

`creativeId` echoes the id you passed to `triggerCreative(creativeId)`, and is absent when you
triggered the default creative.

Notes:

- Supported on React Native 0.74+. Events travel as `RCTDeviceEventEmitter` device events rather
  than through a codegen event emitter, so the transport itself needs no New Architecture opt-in.
  **On iOS the New Architecture is still required**, because the native module only exports its
  methods under `RCT_NEW_ARCH_ENABLED` (old-architecture iOS support is tracked in MSDK-350). With
  the New Architecture disabled on iOS, `triggerCreative()` throws rather than emitting anything.
- **`destroyCreative()` does not emit an event** on either platform, so a `closed` event only ever
  comes from user-driven dismissal. Note the platforms diverge on what it actually does: on Android
  it removes the creative's web view, while on iOS it currently dismisses nothing — the creative
  stays on screen. Do not use it as a programmatic "hide the creative" call on iOS.
- **The Android back button neither closes the creative nor emits an event.** The native SDK exposes
  `Creative.onBackPressed()` for this, but nothing in this wrapper calls it, so a back press is
  handled by React Native's own navigation while the creative's web view stays on screen. If you
  gate UI on `closed`, that gate will not lift on a back press.
- **Android caveat — a failed page load emits nothing.** With `attentive-android-sdk` 2.1.9, if the
  creative page fails to load or hits the native 5-second render timeout, no event is delivered at
  all: the timeout is reported to native as a bare `TIMED OUT` string, and the message handler only
  dispatches JSON payloads, so `onCreativeNotOpened()` is never invoked. Network errors are logged
  and dropped too. On Android, treat `notOpened` as best-effort and do not rely on it as a timeout
  signal — if you need one, run your own timer alongside `triggerCreative()`. iOS reports
  `notOpened` on both timeout and failure.
- **Android caveat — a creative that fails to render in `Mode.DEBUG` freezes the app.** With
  `attentive-android-sdk` 2.1.9, DEBUG mode makes the creative's full-screen web view visible
  *before* the page loads. The view is transparent, so you see nothing — but a visible web view
  consumes every touch, and because the creative never opened there are no bounds to filter
  against. The app is unresponsive until the process is restarted, and per the caveat above no
  `notOpened` arrives to detect it. This only affects DEBUG builds; in `Mode.PRODUCTION` the view
  stays hidden and touches pass through. Trigger against a domain that serves a mobile-app
  creative, or pass an explicit `creativeId`, when testing in DEBUG.
- Always `remove()` the subscription when your component unmounts.

### Record user events

The SDK currently supports `Purchase`, `AddToCart`, `ProductView`, and `CustomEvent`.

```typescript
// Construct one or more "Item"s, which represents the product(s) purchased
const items: Item[] = [
  {
    productId: '555',
    productVariantId: '777',
    price: '14.99',
    currency: 'USD',
  },
];

// Construct a Purchase event
const purchase: Purchase = {
  items: items,
  orderId: '88888',
  cartId: '555555',        // optional
  cartCoupon: 'SOME-DISCOUNT', // optional
}

// Record the PurchaseEvent
recordPurchaseEvent(purchase);
```

The process is similar for the other events. See [eventTypes.tsx](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/src/eventTypes.tsx) for all events.

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

The Attentive Android SDK registers its own `FirebaseMessagingService` automatically — **you do not need to create a subclass**. As long as your app is registered with Firebase and includes a valid `google-services.json`, the SDK handles FCM token registration and foreground push delivery for you. Follow the [Firebase Android setup guide](https://firebase.google.com/docs/cloud-messaging/android/client) to add FCM to your project.

##### If you already have a FirebaseMessagingService subclass

If your app has an existing `FirebaseMessagingService` subclass for other purposes, route Attentive messages through to the SDK:

```kotlin
import com.attentive.androidsdk.AttentiveSdk
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class YourFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        if (AttentiveSdk.isAttentiveFirebaseMessage(remoteMessage)) {
            AttentiveSdk.sendNotification(remoteMessage)
        }
        // Handle your own messages below...
    }
}
```

##### Notification opens (singleTask apps)

React Native apps use `singleTask` launch mode by default. When a push notification is tapped while the app is in the background, Android delivers the intent via `onNewIntent()` rather than recreating the activity. Override `onNewIntent` in your `MainActivity` so the SDK can detect the notification tap:

```kotlin
import android.content.Intent

class MainActivity : ReactActivity() {

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { setIntent(it) }
    }
}
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
