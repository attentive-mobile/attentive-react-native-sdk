//
//  AttentiveSDKManager.swift
//  AttentiveReactNativeSdk
//
//  Created by Attentive SDK Team
//  Copyright © 2026 Attentive. All rights reserved.
//

import Foundation
import UserNotifications

/**
 * Shared manager for accessing the Attentive SDK instance from native code.
 * This allows AppDelegate and other native code to access the SDK instance
 * that was initialized from React Native.
 *
 * Usage in AppDelegate:
 * ```swift
 * // In userNotificationCenter(_:didReceive:withCompletionHandler:)
 * UNUserNotificationCenter.current().getNotificationSettings { settings in
 *   let authStatus = settings.authorizationStatus
 *   DispatchQueue.main.async {
 *     switch UIApplication.shared.applicationState {
 *     case .active:
 *       AttentiveSDKManager.shared.handleForegroundPush(response: response, authorizationStatus: authStatus)
 *     case .background, .inactive:
 *       AttentiveSDKManager.shared.handlePushOpen(response: response, authorizationStatus: authStatus)
 *     @unknown default:
 *       AttentiveSDKManager.shared.handlePushOpen(response: response, authorizationStatus: authStatus)
 *     }
 *   }
 * }
 * ```
 */
@objc public class AttentiveSDKManager: NSObject {
    /// Shared singleton instance
    @objc public static let shared = AttentiveSDKManager()
    
    /// The Attentive SDK instance as AnyObject for Objective-C compatibility
    /// This should be set when the SDK is initialized from React Native
    /// Cast to ATTNNativeSDK in Swift code
    @objc public var sdk: AnyObject?
    
    private override init() {
        super.init()
    }
    
    /// Helper method to get the SDK instance with proper type in Swift
    public var nativeSDK: ATTNNativeSDK? {
        return sdk as? ATTNNativeSDK
    }
    
    /// Helper method to set the SDK instance with proper type in Swift
    public func setNativeSDK(_ nativeSDK: ATTNNativeSDK?) {
        sdk = nativeSDK
    }
    
    // MARK: - Push Notification Handlers (for AppDelegate)
    
    /**
     * Handle a push notification when the app is in the foreground (active state).
     * Call this from AppDelegate's userNotificationCenter(_:didReceive:withCompletionHandler:)
     * when UIApplication.shared.applicationState == .active
     *
     * @param response The UNNotificationResponse from the notification center delegate
     * @param authorizationStatus Current push authorization status from notification settings
     */
    @objc public func handleForegroundPush(response: UNNotificationResponse, authorizationStatus: UNAuthorizationStatus) {
        nativeSDK?.handleForegroundPush(response: response, authorizationStatus: authorizationStatus)
    }
    
    /**
     * Handle when a push notification is opened by the user (app in background/inactive state).
     * Call this from AppDelegate's userNotificationCenter(_:didReceive:withCompletionHandler:)
     * when UIApplication.shared.applicationState == .background or .inactive
     *
     * @param response The UNNotificationResponse from the notification center delegate
     * @param authorizationStatus Current push authorization status from notification settings
     */
    @objc public func handlePushOpen(response: UNNotificationResponse, authorizationStatus: UNAuthorizationStatus) {
        nativeSDK?.handlePushOpen(response: response, authorizationStatus: authorizationStatus)
    }
}
