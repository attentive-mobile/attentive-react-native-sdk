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

  /// Handle notification tap/interaction
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    print("[Attentive] Notification tapped/received response")

    // Forward to React Native
    RNCPushNotificationIOS.didReceive(response)

    completionHandler()
  }
}
