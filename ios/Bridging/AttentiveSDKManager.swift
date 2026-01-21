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
 * AttentiveSDKManager.shared.sdk?.registerDeviceToken(...)
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
}
