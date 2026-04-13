# Push Notifications Integration Guide

This guide covers everything needed to integrate Attentive push notification token registration on both iOS and Android. For Apple Developer Portal configuration, certificates, and TestFlight distribution steps, see [Push Notifications Setup](./PUSH_NOTIFICATIONS_SETUP.md).

---

## Android Integration

> **Important:** On Android, SDK initialization is **not** triggered from TypeScript. You must call `AttentiveSdk.initialize(config)` from your `Application.onCreate()` in native Kotlin/Java before the React Native bridge is ready. Calling `initialize()` from TypeScript on Android is a no-op. See the [Android Native Initialization](../README.md#android--initialize-from-native-code) section of the main README for the required `MainApplication.kt` setup.

Once the SDK is initialized natively, token registration is handled entirely from TypeScript using the same API on both platforms.

### Option A — Recommended: Let the SDK manage FCM registration

Call `registerForPushNotifications()` from JavaScript. On Android this triggers `AttentiveSdk.getPushTokenWithCallback` inside the native module, which requests the `POST_NOTIFICATIONS` permission (Android 13+), fetches the FCM token, and registers it with Attentive — no extra native code required.

```typescript
import { registerForPushNotifications } from 'attentive-react-native-sdk'

// Call once after identify(); shows the system permission dialog on Android 13+
// and registers the FCM token with the Attentive backend.
registerForPushNotifications()
```

### Option B — Alternative: Supply the FCM token yourself

If you already obtain the FCM token from `@react-native-firebase/messaging` or another library, pass it directly via `registerDeviceTokenWithCallback` and then call `handleRegularOpen` in the callback:

```typescript
import {
    getPushAuthorizationStatus,
    registerDeviceTokenWithCallback,
    handleRegularOpen,
} from 'attentive-react-native-sdk'

// Obtain your FCM token from Firebase Messaging (or any other source)
const fcmToken = await messaging().getToken()

getPushAuthorizationStatus().then((authStatus) => {
    registerDeviceTokenWithCallback(
        fcmToken,
        authStatus,
        (data, url, response, error) => {
            if (error) {
                console.error('[Attentive] Token registration failed', error)
            }
            // Always call handleRegularOpen after registration (success or failure)
            handleRegularOpen(authStatus)
        }
    )
})
```

### AndroidManifest prerequisite

Declare the notification permission for Android 13+ in your `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>
```

For the complete Android integration (launch, returning to foreground, and permission handling), refer to the **[App Events on Android](../README.md#app-events-on-android)** section in the main README.

---

## iOS Integration

> **Platform note:** On iOS, SDK initialization is called from TypeScript (`Attentive.initialize(config)`) before any push or event calls. The native `didRegisterForRemoteNotificationsWithDeviceToken` AppDelegate callback receives the APNs token and should forward it to the Attentive SDK.

### Complete AppDelegate Implementation

The following is a complete `AppDelegate.swift` for a React Native project that subclasses `RCTAppDelegate`. It handles device token registration, registration failure, foreground notification display, and notification tap tracking.

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import attentive_react_native_sdk

@main
class AppDelegate: RCTAppDelegate {

    // Typed access to the SDK instance set by the React Native bridge
    private var attentiveSdk: ATTNNativeSDK? {
        return AttentiveSDKManager.shared.sdk as? ATTNNativeSDK
    }

    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        self.moduleName = "YourAppName"
        self.dependencyProvider = RCTAppDependencyProvider()
        self.initialProps = [:]

        UNUserNotificationCenter.current().delegate = self

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

    // MARK: - Push Notification Handling

    /// Registers the APNs device token with the Attentive backend and, once the
    /// round-trip completes (success or failure), fires a regular-open event.
    override func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[Attentive] Device token received: \(tokenString.prefix(16))...")

        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            guard let self = self else { return }
            let authStatus = settings.authorizationStatus

            print("[Attentive] Authorization status: \(authStatus.rawValue)")

            self.attentiveSdk?.registerDeviceToken(
                deviceToken,
                authorizationStatus: authStatus,
                callback: { data, url, response, error in
                    DispatchQueue.main.async {
                        if let error = error {
                            print("[Attentive] Registration failed: \(error.localizedDescription)")
                        } else {
                            print("[Attentive] Registration successful")
                            if let httpResponse = response as? HTTPURLResponse {
                                print("[Attentive] Response status: \(httpResponse.statusCode)")
                            }
                        }

                        // Always trigger regular open regardless of registration outcome
                        self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
                        print("[Attentive] Regular open event triggered")
                    }
                }
            )
        }

        // Uncomment if you are also using RNCPushNotificationIOS:
        // RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
    }

    /// Fires a regular-open event even when APNs registration fails so that
    /// the app-open is still tracked regardless of notification permission state.
    override func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[Attentive] Failed to register for remote notifications: \(error.localizedDescription)")

        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let sdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK
            DispatchQueue.main.async {
                sdk?.handleRegularOpen(authorizationStatus: settings.authorizationStatus)
                print("[Attentive] Regular open event triggered after registration failure")
            }
        }
    }

    /// Handles remote notifications received in the background (legacy silent-push path).
    override func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        // Uncomment if you are also using RNCPushNotificationIOS:
        // RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
        completionHandler(.newData)
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {

    /// Shows notification banners while the app is in the foreground.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Uncomment if you are also using RNCPushNotificationIOS:
        // RNCPushNotificationIOS.didReceiveRemoteNotification(
        //     notification.request.content.userInfo,
        //     fetchCompletionHandler: { _ in }
        // )
        completionHandler([.banner, .sound, .badge])
    }

    /// Required: forwards the notification response to the Attentive SDK so that
    /// push-open and foreground-push events are tracked on the JS side.
    /// This single call handles both foreground and background app states and is
    /// safe to call for cold-launch notifications.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        AttentiveSDKManager.shared.handleNotificationResponse(response)

        // Uncomment if you are also using RNCPushNotificationIOS:
        // RNCPushNotificationIOS.didReceive(response)

        completionHandler()
    }
}
```

### Accessing the SDK Instance

#### Recommended: `AttentiveSDKManager` (automatic)

When you call `Attentive.initialize(config)` from React Native, the SDK instance is automatically stored in `AttentiveSDKManager.shared.sdk`. Your AppDelegate and any other native code can access it immediately with no additional setup.

```swift
import attentive_react_native_sdk

if let sdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK {
    sdk.registerDeviceToken(
        deviceToken,
        authorizationStatus: authStatus,
        callback: { data, url, response, error in
            // Handle callback
        }
    )
}
```

#### Alternative: Direct native SDK usage

If you prefer to avoid the React Native bridge entirely, you can use the Attentive iOS SDK directly. Note that this requires a separate initialization call in native code and may duplicate configuration.

```swift
import attentive_ios_sdk

ATTNSDK.shared.registerDeviceToken(
    deviceToken,
    authorizationStatus: authStatus,
    callback: { data, url, response, error in
        // Handle callback
    }
)
```

---

## Callback Parameters

The `registerDeviceToken` callback receives four arguments:

| Parameter  | Type           | Description                                              |
|------------|----------------|----------------------------------------------------------|
| `data`     | `Data?`        | Response body from the Attentive backend (if available)  |
| `url`      | `URL?`         | URL used for the registration request                    |
| `response` | `URLResponse?` | Full HTTP response from the backend                      |
| `error`    | `Error?`       | Error if registration failed; `nil` on success           |

---

## `handleRegularOpen`

`handleRegularOpen(authorizationStatus:)` tracks a "direct open" event in Attentive analytics. It must be called after device token registration completes — whether successful or not — so that every app launch is recorded.

**When to call it:**
- Inside the `registerDeviceToken` callback, dispatched to the main queue
- Inside `didFailToRegisterForRemoteNotificationsWithError`, after fetching notification settings

---

## `UNAuthorizationStatus` Values

| Value            | Description                                               |
|------------------|-----------------------------------------------------------|
| `.notDetermined` | User has not yet been asked for permission                |
| `.denied`        | User has explicitly denied permission                     |
| `.authorized`    | User has granted permission                               |
| `.provisional`   | User has granted provisional permission (iOS 12+)         |
| `.ephemeral`     | User has granted ephemeral permission (iOS 14+)           |

---

## Best Practices

1. **Dispatch to main queue** — always wrap UI-related operations inside `DispatchQueue.main.async` in the callback.
2. **Call `handleRegularOpen` unconditionally** — call it on both success and failure paths so every app open is tracked.
3. **Use `[weak self]`** — prevent retain cycles in closures that capture `self`.
4. **Check authorization status** — always fetch and pass the current `UNAuthorizationStatus` rather than assuming a value.
5. **Log in development** — use `print` statements during development; remove or gate them behind `#if DEBUG` for production.

---

## Testing

Push notifications require a physical iOS device; they do not function on the simulator.

1. Build and run on a physical device.
2. Grant notification permissions when prompted.
3. Verify the following log sequence in the Xcode console:
   ```
   [Attentive] Device token received: <first 16 chars>...
   [Attentive] Authorization status: <value>
   [Attentive] Registration successful
   [Attentive] Response status: 200
   [Attentive] Regular open event triggered
   ```
4. Send a test push notification from your platform and verify it appears in all three app states: foreground, background, and terminated.

---

## Troubleshooting

### SDK instance is `nil`

- Ensure `Attentive.initialize(config)` has been called from TypeScript before any AppDelegate push handling runs.
- Verify the React Native bridge is fully initialized before the token callback fires.
- As a fallback, use the direct SDK approach (`ATTNSDK.shared`) with its own initialization.

### Callback never fires

- Check network connectivity on the device.
- Verify the Attentive SDK is initialized with a valid domain.
- Inspect the Xcode console for error messages.
- Confirm the APNs device token is valid (physical device only).

### `handleRegularOpen` not tracked

- Ensure the call is dispatched to the main queue.
- Verify the SDK instance is not `nil` at the call site.
- Confirm a valid `UNAuthorizationStatus` is being passed.

### Token registration fails on Android

- Confirm `AttentiveSdk.initialize(config)` is called in `MainApplication.kt` → `onCreate()` before the RN bridge starts.
- Verify `POST_NOTIFICATIONS` permission is declared in `AndroidManifest.xml` (Android 13+).
- Check that the FCM token is valid and not expired.

---

## Related Documentation

- [Push Notifications Setup](./PUSH_NOTIFICATIONS_SETUP.md) — Apple Developer Portal, APNs certificates, and TestFlight configuration
- [Migration Guide](../MIGRATION_GUIDE.md)
- [Main README](../README.md)
