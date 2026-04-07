# Push Token Registration with Callback - Implementation Guide

This guide explains how to implement push token registration with callback handling in your iOS AppDelegate for the Attentive React Native SDK.

## Overview

The Attentive iOS SDK provides a callback-based `registerDeviceToken` method that allows you to:
1. Register the device token with the Attentive backend
2. Receive a callback with the registration result
3. Trigger a "regular open" event after registration completes

## Android Token Registration

> **Important:** On Android, SDK initialization is **not** triggered from TypeScript. You must call `AttentiveSdk.initialize(config)` from your `Application.onCreate()` in native Kotlin/Java before the React Native bridge is ready. Calling `initialize()` from TypeScript on Android is a no-op. See the [Android Native Initialization](../README.md#android--initialize-from-native-code) section of the main README for the required `MainApplication.kt` setup.

Once the SDK is initialized natively, token registration is handled entirely from TypeScript using the same API on both platforms.

### Option A — Recommended: Let the SDK manage FCM registration

Call `registerForPushNotifications()` from JavaScript. On Android this triggers `AttentiveSdk.getPushTokenWithCallback` inside the native module, which requests the `POST_NOTIFICATIONS` permission (Android 13+), fetches the FCM token, and registers it with Attentive — no extra native code required.

```typescript
import { registerForPushNotifications } from 'attentive-react-native-sdk';

// Call once after identify(); shows the system permission dialog on Android 13+
// and registers the FCM token with the Attentive backend.
registerForPushNotifications();
```

### Option B — Alternative: Supply the FCM token yourself

If you already obtain the FCM token from `@react-native-firebase/messaging` or another library, pass it directly via `registerDeviceTokenWithCallback` and then call `handleRegularOpen` in the callback:

```typescript
import {
  getPushAuthorizationStatus,
  registerDeviceTokenWithCallback,
  handleRegularOpen,
} from 'attentive-react-native-sdk';

// Obtain your FCM token from Firebase Messaging (or any other source)
const fcmToken = await messaging().getToken();

getPushAuthorizationStatus().then((authStatus) => {
  registerDeviceTokenWithCallback(
    fcmToken,
    authStatus,
    (data, url, response, error) => {
      if (error) {
        console.error('[Attentive] Token registration failed', error);
      }
      // Always call handleRegularOpen after registration (success or failure)
      handleRegularOpen(authStatus);
    }
  );
});
```

### AndroidManifest prerequisite

Declare the notification permission for Android 13+ in your `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>
```

### Full Android launch and foreground flow

For the complete Android integration (launch, returning to foreground, and permission handling), refer to the **[App Events on Android](../README.md#app-events-on-android)** section in the main README.

---

## iOS Token Registration

> **Platform difference:** On iOS, SDK initialization is called from TypeScript (`Attentive.initialize(config)`) before any push or event calls. The native `didRegisterForRemoteNotificationsWithDeviceToken` AppDelegate callback receives the APNs token and should forward it to the Attentive SDK.

## Implementation in AppDelegate

### Step 1: Import Required Frameworks

Add these imports to your `AppDelegate.swift`:

```swift
import UserNotifications
import attentive_ios_sdk
```

### Step 2: Implement Device Token Registration

Add or update the `didRegisterForRemoteNotificationsWithDeviceToken` method in your AppDelegate:

```swift
func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    // Get current notification settings
    UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
        guard let self = self else { return }
        let authStatus = settings.authorizationStatus

        // Register device token with Attentive SDK
        // Note: Access the SDK instance via your bridge or module
        attentiveSdk?.registerDeviceToken(
            deviceToken,
            authorizationStatus: authStatus,
            callback: { data, url, response, error in
                DispatchQueue.main.async {
                    // Handle registration result
                    if let error = error {
                        print("[Attentive] Device token registration failed: \(error.localizedDescription)")
                    } else {
                        print("[Attentive] Device token registered successfully")
                    }

                    // Always trigger regular open event after registration
                    self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
                }
            }
        )
    }
}
```

## Callback Parameters

The `registerDeviceToken` callback provides the following parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Data?` | Response data from the Attentive backend (if available) |
| `url` | `URL?` | The URL used for the registration request |
| `response` | `URLResponse?` | HTTP response from the backend |
| `error` | `Error?` | Error object if registration failed, `nil` on success |

## Regular Open Event

The `handleRegularOpen` method should be called after device token registration completes (whether successful or not). This tracks a "direct open" event in the Attentive analytics.

### When to Call `handleRegularOpen`

- **After successful token registration**: To track that the user opened the app and successfully registered for push notifications
- **After failed token registration**: To track the app open event even if registration failed
- **Inside the callback's main queue dispatch**: Ensures UI-related operations are safe

## Complete Example

Here's a complete example with error handling and logging:

```swift
import UIKit
import UserNotifications
import attentive_react_native_sdk

class AppDelegate: UIResponder, UIApplicationDelegate {

    // Helper to get the SDK instance with proper type
    private var attentiveSdk: ATTNNativeSDK? {
        return AttentiveSDKManager.shared.sdk as? ATTNNativeSDK
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Convert token to hex string for logging
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[Attentive] Device token received: \(tokenString.prefix(16))...")

        // Get notification settings
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            guard let self = self else { return }
            let authStatus = settings.authorizationStatus

            print("[Attentive] Authorization status: \(authStatus.rawValue)")

            // Register with Attentive SDK via shared manager
            self.attentiveSdk?.registerDeviceToken(
                deviceToken,
                authorizationStatus: authStatus,
                callback: { data, url, response, error in
                    DispatchQueue.main.async {
                        if let error = error {
                            print("[Attentive] Registration failed: \(error.localizedDescription)")
                        } else {
                            print("[Attentive] Registration successful")

                            // Log response details if available
                            if let httpResponse = response as? HTTPURLResponse {
                                print("[Attentive] Response status: \(httpResponse.statusCode)")
                            }

                            if let data = data, let responseString = String(data: data, encoding: .utf8) {
                                print("[Attentive] Response data: \(responseString)")
                            }
                        }

                        // Always trigger regular open event
                        self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
                        print("[Attentive] Regular open event triggered")
                    }
                }
            )
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[Attentive] Failed to register for remote notifications: \(error.localizedDescription)")

        // Even on failure, you might want to trigger a regular open event
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let attentiveSdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK
            DispatchQueue.main.async {
                attentiveSdk?.handleRegularOpen(authorizationStatus: settings.authorizationStatus)
            }
        }
    }
}
```

## Accessing the SDK Instance

The Attentive React Native SDK provides `AttentiveSDKManager` to access the SDK instance from native code:

### Recommended: Use AttentiveSDKManager (Automatic)

The SDK automatically sets the shared instance when initialized from React Native:

```swift
// In AppDelegate.swift
import attentive_react_native_sdk

func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    // Access the SDK via the shared manager
    AttentiveSDKManager.shared.sdk?.registerDeviceToken(
        deviceToken,
        authorizationStatus: authStatus,
        callback: { data, url, response, error in
            // Handle callback
        }
    )
}
```

**How it works:**
- When you call `initialize()` from React Native, the SDK instance is automatically stored in `AttentiveSDKManager.shared.sdk`
- This makes the SDK accessible from any native code (AppDelegate, extensions, etc.)
- No additional setup required!

### Alternative: Direct SDK Usage

You can also use the Attentive iOS SDK directly without going through the React Native bridge:

```swift
import attentive_ios_sdk

// Use ATTNSDK directly
ATTNSDK.shared.registerDeviceToken(
    deviceToken,
    authorizationStatus: authStatus,
    callback: { data, url, response, error in
        // Handle callback
    }
)
```

**Note:** Using the direct SDK approach means you'll need to initialize the Attentive iOS SDK separately in your native code, which may duplicate configuration.

## Authorization Status Values

The `UNAuthorizationStatus` enum has the following values:

- `.notDetermined` - User has not yet been asked for permission
- `.denied` - User has explicitly denied permission
- `.authorized` - User has granted permission
- `.provisional` - User has granted provisional permission (iOS 12+)
- `.ephemeral` - User has granted ephemeral permission (iOS 14+)

## Best Practices

1. **Always call on main queue**: The callback should dispatch UI-related operations to the main queue
2. **Handle both success and failure**: Always call `handleRegularOpen` regardless of registration outcome
3. **Log appropriately**: Use logging to debug registration issues in development
4. **Check authorization status**: Always check the current authorization status before registering
5. **Weak self references**: Use `[weak self]` in closures to prevent retain cycles

## Troubleshooting

### Token Registration Fails

If token registration fails:
- Check that the Attentive SDK is properly initialized with a valid domain
- Verify that the device has network connectivity
- Check the error message in the callback for specific details
- Ensure the authorization status is correctly passed

### Regular Open Event Not Firing

If the regular open event doesn't fire:
- Ensure you're calling it on the main queue
- Verify the SDK instance is not nil
- Check that the authorization status is valid

## Related Documentation

- [Push Notifications Setup Guide](./PUSH_NOTIFICATIONS_SETUP.md)
- [Migration Guide](../MIGRATION_GUIDE.md)

## Support

For issues or questions about push token registration:
1. Check the Attentive iOS SDK documentation
2. Review the example app implementation in `Bonni/ios/Bonni/AppDelegate.swift`
3. Contact Attentive support for SDK-specific issues
