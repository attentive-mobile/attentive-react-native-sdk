//
//  AttentiveSDKManager.swift
//  AttentiveReactNativeSdk
//
//  Created by Attentive SDK Team
//  Copyright © 2026 Attentive. All rights reserved.
//

import Foundation
import UIKit
import UserNotifications

/**
 * Shared manager for accessing the Attentive SDK instance from native code.
 * This allows AppDelegate and other native code to access the SDK instance
 * that was initialized from React Native.
 *
 * ## Minimal Integration (recommended)
 *
 * In your AppDelegate's `userNotificationCenter(_:didReceive:withCompletionHandler:)`,
 * add **one line** to enable push-open and foreground-push tracking:
 *
 * ```swift
 * func userNotificationCenter(_ center: UNUserNotificationCenter,
 *                             didReceive response: UNNotificationResponse,
 *                             withCompletionHandler completionHandler: @escaping () -> Void) {
 *     // Track push interaction with Attentive (handles app-state detection + auth status internally)
 *     AttentiveSDKManager.shared.handleNotificationResponse(response)
 *
 *     // Forward to your push library (e.g. RNCPushNotificationIOS) for JS-side handling
 *     RNCPushNotificationIOS.didReceive(response)
 *     completionHandler()
 * }
 * ```
 */
@objc public class AttentiveSDKManager: NSObject {
    /// Shared singleton instance
    @objc public static let shared: AttentiveSDKManager = AttentiveSDKManager()

    /// The Attentive SDK instance as AnyObject for Objective-C compatibility.
    /// When set, any pending (untracked) notification response is automatically flushed.
    @objc public var sdk: AnyObject? {
        didSet {
            if sdk != nil {
                flushPendingResponseIfNeeded()
            }
        }
    }

    // MARK: - Notification Response Cache

    /// The most recent UNNotificationResponse, cached so the RN bridge can use it
    /// when JS calls handlePushOpen / handleForegroundPush.
    private var pendingResponse: UNNotificationResponse?

    /// Whether the pending response has already been tracked via `handleNotificationResponse`.
    /// Prevents double-tracking when both the native convenience method and the JS bridge fire.
    private var pendingResponseTracked: Bool = false

    /// Serialises access to the cache fields above.
    private let responseLock = NSLock()

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

    // MARK: - Push Notification Convenience Method

    /**
     * Handle a push notification response in one call.
     *
     * This is the **recommended** way to track push interactions on iOS.
     * It automatically determines the app state, fetches the current
     * authorization status, and calls the appropriate native SDK method
     * (`handlePushOpen` or `handleForegroundPush`).
     *
     * Call this from your AppDelegate's
     * `userNotificationCenter(_:didReceive:withCompletionHandler:)`.
     *
     * The response is also cached so that if the JS layer later calls
     * `handlePushOpen()` or `handleForegroundPush()` via the RN bridge,
     * the bridge can fulfil the call using the real `UNNotificationResponse`
     * without double-tracking.
     *
     * **Cold-launch safety:** If the SDK has not yet been initialized (e.g. the
     * app was launched from a killed state via a push tap), the response is
     * cached and will be automatically tracked once `sdk` is set during RN
     * bridge initialization.
     *
     * @param response The `UNNotificationResponse` from the notification center delegate.
     */
    @objc public func handleNotificationResponse(_ response: UNNotificationResponse) {
        // Cache the response for the RN bridge (consumed by handlePushOpenFromRN / handleForegroundPushFromRN).
        // pendingResponseTracked stays false until tracking actually executes, so a bridge
        // call that races with the async block below will still track correctly.
        responseLock.lock()
        pendingResponse = response
        pendingResponseTracked = false
        responseLock.unlock()

        trackResponse(response)
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

    // MARK: - Response Cache (internal, used by RN bridge)

    /**
     * Consume the cached notification response.
     *
     * Returns the cached `UNNotificationResponse` and whether it was already
     * tracked by `handleNotificationResponse`. The bridge uses this to decide
     * whether to call the native SDK again.
     *
     * After this call the cache is cleared.
     */
    func consumePendingResponse() -> (response: UNNotificationResponse, alreadyTracked: Bool)? {
        responseLock.lock()
        defer { responseLock.unlock() }

        guard let response = pendingResponse else { return nil }
        let tracked = pendingResponseTracked
        pendingResponse = nil
        pendingResponseTracked = false
        return (response, tracked)
    }

    // MARK: - Private

    /// Attempt to track a cached response via the native SDK.
    /// If nativeSDK is nil (cold launch), returns without marking tracked;
    /// the `sdk` didSet will call `flushPendingResponseIfNeeded` later.
    private func trackResponse(_ response: UNNotificationResponse) {
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            guard let self = self else { return }
            let authStatus = settings.authorizationStatus
            DispatchQueue.main.async {
                guard let nativeSDK = self.nativeSDK else {
                    // SDK not yet initialized (cold launch). The response stays cached
                    // with pendingResponseTracked = false. When the SDK is set via the
                    // RN bridge, the didSet observer will call flushPendingResponseIfNeeded.
                    return
                }

                switch UIApplication.shared.applicationState {
                case .active:
                    nativeSDK.handleForegroundPush(response: response, authorizationStatus: authStatus)
                case .background, .inactive:
                    nativeSDK.handlePushOpen(response: response, authorizationStatus: authStatus)
                @unknown default:
                    nativeSDK.handlePushOpen(response: response, authorizationStatus: authStatus)
                }

                // Mark tracked only after the native SDK call has actually executed.
                // If the bridge consumed the response first (pendingResponse is now nil
                // or points to a different notification), skip — the bridge already handled it.
                self.responseLock.lock()
                if self.pendingResponse === response {
                    self.pendingResponseTracked = true
                }
                self.responseLock.unlock()
            }
        }
    }

    /// Called from `sdk` didSet when the SDK becomes available.
    /// If there is a pending untracked response (cold-launch scenario),
    /// track it now.
    private func flushPendingResponseIfNeeded() {
        responseLock.lock()
        guard let response = pendingResponse, !pendingResponseTracked else {
            responseLock.unlock()
            return
        }
        responseLock.unlock()

        trackResponse(response)
    }
}
