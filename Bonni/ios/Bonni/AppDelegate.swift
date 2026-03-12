import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "Bonni"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
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

  // MARK: - Push Notification Handling
  // Note: RNCPushNotificationIOS is accessed via bridging header.
  // If build fails, configure "Objective-C Bridging Header" in Build Settings to:
  // $(SRCROOT)/Bonni/Bonni-Bridging-Header.h

  /// Handle device token registration - forward to React Native
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Convert token to hex string for logging
    let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("[Attentive] Device token registered: \(tokenString.prefix(16))...")

    // Forward to React Native via RNCPushNotificationIOS
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }

  /// Handle registration failure - log error
  /// Note: RNCPushNotificationIOS error forwarding is handled via JS event listeners
  override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("[Attentive] Failed to register for remote notifications: \(error.localizedDescription)")
    // Error is logged; the JS layer will receive registrationError via addEventListener
  }

  /// Handle remote notification received (legacy method) - forward to React Native
  override func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    print("[Attentive] Remote notification received")
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
  }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {
  /// Handle notification received while app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let userInfo = notification.request.content.userInfo
    print("[Attentive] Notification will present in foreground")

    // Forward to React Native
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: { _ in })

    // Show notification banner even when app is in foreground
    completionHandler([.banner, .sound, .badge])
  }

  /**
   * Handle notification tap/interaction.
   *
   * Calls the Attentive SDK via `AttentiveSDKManager.shared` using the full
   * `UNNotificationResponse` (required by the native iOS SDK) so that push open /
   * foreground push events are tracked correctly. The response is also forwarded to
   * `RNCPushNotificationIOS` so the React Native JS layer receives the corresponding
   * `localNotification` event for any additional in-app UI handling.
   *
   * Note: the `handleForegroundPush` / `handlePushOpen` paths that go through the
   * RN bridge (`src/index.tsx`) are no-ops on iOS because the native SDK requires a
   * `UNNotificationResponse` object which cannot be marshalled across the RN bridge.
   * This AppDelegate method is the authoritative push-tracking entry point on iOS.
   */
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    print("[Attentive] Notification tapped/received response")

    // Fetch the current auth status asynchronously then dispatch to the Attentive SDK
    // on the main thread, mirroring the recommended native AppDelegate pattern.
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      let authStatus = settings.authorizationStatus
      DispatchQueue.main.async {
        switch UIApplication.shared.applicationState {
        case .active:
          // App was in the foreground when the user interacted with the notification.
          AttentiveSDKManager.shared.handleForegroundPush(response: response, authorizationStatus: authStatus)
          print("[Attentive] handleForegroundPush called via AttentiveSDKManager (app was active)")
        case .background, .inactive:
          // App was backgrounded or in the middle of transitioning.
          AttentiveSDKManager.shared.handlePushOpen(response: response, authorizationStatus: authStatus)
          print("[Attentive] handlePushOpen called via AttentiveSDKManager (app was background/inactive)")
        @unknown default:
          AttentiveSDKManager.shared.handlePushOpen(response: response, authorizationStatus: authStatus)
          print("[Attentive] handlePushOpen called via AttentiveSDKManager (unknown app state)")
        }
      }
    }

    // Also forward to React Native so the JS `localNotification` event fires
    // and any in-app UI logic (navigation, banners, etc.) can respond.
    RNCPushNotificationIOS.didReceive(response)

    completionHandler()
  }
}
