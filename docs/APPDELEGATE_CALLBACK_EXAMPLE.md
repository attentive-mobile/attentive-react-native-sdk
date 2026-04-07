# AppDelegate Implementation with Callback-Based Push Token Registration

This document provides a complete example of how to implement push token registration with callbacks in your iOS AppDelegate.

## Overview

The Attentive React Native SDK now exposes callback-based push token registration methods that can be called directly from your AppDelegate. This allows for more granular control over the registration flow and enables you to trigger follow-up actions (like `handleRegularOpen`) after registration completes.

## Complete AppDelegate Example

Here's a complete `AppDelegate.swift` implementation that demonstrates the callback-based approach:

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import attentive_react_native_sdk

@main
class AppDelegate: RCTAppDelegate {
    
    // Helper to get the SDK instance with proper type
    private var attentiveSdk: ATTNNativeSDK? {
        return AttentiveSDKManager.shared.sdk as? ATTNNativeSDK
    }
    
    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        self.moduleName = "YourAppName"
        self.dependencyProvider = RCTAppDependencyProvider()
        self.initialProps = [:]
        
        // Setup UNUserNotificationCenter delegate for push notifications
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
    
    // MARK: - Push Notification Handling with Callbacks
    
    /// Handle device token registration with Attentive SDK callback
    override func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Convert token to hex string for logging
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[Attentive] Device token registered: \(tokenString.prefix(16))...")
        
        // Get current notification settings
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            guard let self = self else { return }
            let authStatus = settings.authorizationStatus
            
            print("[Attentive] Authorization status: \(authStatus.rawValue)")
            
            // Register device token with Attentive SDK using callback via shared manager
            self.attentiveSdk?.registerDeviceToken(
                deviceToken,
                authorizationStatus: authStatus,
                callback: { data, url, response, error in
                    DispatchQueue.main.async {
                        if let error = error {
                            print("[Attentive] Device token registration failed: \(error.localizedDescription)")
                        } else {
                            print("[Attentive] Device token registered successfully")
                            
                            // Log response details if available
                            if let httpResponse = response as? HTTPURLResponse {
                                print("[Attentive] Response status: \(httpResponse.statusCode)")
                            }
                        }
                        
                        // Always trigger regular open event after registration (success or failure)
                        self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
                        print("[Attentive] Regular open event triggered")
                    }
                }
            )
        }
        
        // Also forward to React Native if you're using RNCPushNotificationIOS
        // RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
    }
    
    /// Handle registration failure
    override func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[Attentive] Failed to register for remote notifications: \(error.localizedDescription)")
        
        // Even on failure, trigger regular open event
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let attentiveSdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK
            DispatchQueue.main.async {
                attentiveSdk?.handleRegularOpen(authorizationStatus: settings.authorizationStatus)
                print("[Attentive] Regular open event triggered after registration failure")
            }
        }
    }
    
    /// Handle remote notification received (legacy method)
    override func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable : Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        print("[Attentive] Remote notification received")
        
        // Forward to React Native if using RNCPushNotificationIOS
        // RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
        
        completionHandler(.newData)
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {
    
    /// Handle notification received while app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        print("[Attentive] Notification will present in foreground")
        
        // Forward to React Native if using RNCPushNotificationIOS
        // RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: { _ in })
        
        // Show notification banner even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    /// Handle notification tap/interaction
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        print("[Attentive] Notification tapped/received response")
        
        // Forward to React Native if using RNCPushNotificationIOS
        // RNCPushNotificationIOS.didReceive(response)
        
        completionHandler()
    }
}
```

## Accessing the Attentive SDK Instance

The Attentive React Native SDK automatically makes the SDK instance accessible via `AttentiveSDKManager.shared.sdk`. This is set when you call `initialize()` from React Native.

### Using AttentiveSDKManager (Recommended)

```swift
import attentive_react_native_sdk

// Access the SDK instance anywhere in your native code
// Note: Cast to ATTNNativeSDK to access the methods
if let attentiveSdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK {
    attentiveSdk.registerDeviceToken(
        deviceToken,
        authorizationStatus: authStatus,
        callback: { data, url, response, error in
            // Handle callback
        }
    )
}
```

**How it works:**
1. When you call `Attentive.initialize(config)` from React Native, the SDK creates an instance
2. This instance is automatically stored in `AttentiveSDKManager.shared.sdk`
3. Your AppDelegate and other native code can access it immediately
4. No additional setup or bridging required!

### Alternative: Direct SDK Usage

If you prefer not to use the React Native bridge, you can use the native Attentive iOS SDK directly:

```swift
import attentive_ios_sdk

// Initialize and use the SDK directly
ATTNSDK.shared.registerDeviceToken(
    deviceToken,
    authorizationStatus: authStatus,
    callback: { data, url, response, error in
        // Handle callback
    }
)
```

**Note:** Using the direct SDK approach requires separate initialization in native code and may duplicate configuration.

## Key Points

1. **Callback Execution**: The callback is executed after the SDK attempts to register the device token with the Attentive backend
2. **Main Queue**: Always dispatch UI-related operations to the main queue inside the callback
3. **Regular Open Event**: Call `handleRegularOpen` after registration completes (success or failure)
4. **Error Handling**: Check for errors in the callback and handle them appropriately
5. **Authorization Status**: Always check and pass the current authorization status

## Callback Parameters

The `registerDeviceToken` callback provides:

- `data: Data?` - Response data from the Attentive backend (if available)
- `url: URL?` - The URL used for the registration request
- `response: URLResponse?` - HTTP response from the backend
- `error: Error?` - Error object if registration failed, `nil` on success

## Testing

To test this implementation:

1. Build and run your app on a physical device (push notifications don't work in simulator)
2. Grant notification permissions when prompted
3. Check the console logs for:
   - Device token registration
   - Authorization status
   - Registration success/failure
   - Regular open event trigger

## Troubleshooting

### SDK Instance is Nil

If `attentiveSdk` is nil:
- Ensure the React Native bridge has initialized
- Verify the Attentive SDK is properly initialized in your React Native code
- Consider using the direct SDK approach (Approach 3 above)

### Callback Never Fires

If the callback doesn't execute:
- Check network connectivity
- Verify the Attentive SDK is initialized with a valid domain
- Check for errors in the console logs
- Ensure the device token is valid

### Regular Open Event Not Tracked

If the regular open event doesn't fire:
- Ensure you're calling it on the main queue
- Verify the authorization status is valid
- Check that the SDK instance is not nil

## Related Documentation

- [Push Token Registration Guide](./PUSH_TOKEN_REGISTRATION_GUIDE.md)
- [Push Notifications Setup](./PUSH_NOTIFICATIONS_SETUP.md)
- [SDK Upgrade Guide](./UPGRADE_TO_2.0.8.md)
