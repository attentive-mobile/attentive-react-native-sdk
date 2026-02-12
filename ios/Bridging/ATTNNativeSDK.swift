//
//  ATTNNativeSDK.swift
//  AttentiveReactNativeSdk
//
//  Created by Vladimir - Work on 2024-06-28.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation
import attentive_ios_sdk
import UIKit
import UserNotifications

// Debug Event structure for session history
struct DebugEvent {
  let id: UUID
  let timestamp: Date
  let eventType: String
  let data: [String: Any]

  init(eventType: String, data: [String: Any]) {
    self.id = UUID()
    self.timestamp = Date()
    self.eventType = eventType
    self.data = data
  }

  /**
   * Formats the debug event as a human-readable string for export
   * @return A formatted string containing timestamp, event type, and data
   */
  func formatForExport() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
    let timeString = formatter.string(from: timestamp)

    var output = "[\(timeString)] \(eventType)\n"

    // Add summary information if available
    let summary = getSummary()
    if !summary.isEmpty {
      output += "Summary: \(summary)\n"
    }

    output += "Data:\n"

    // Format data as JSON for better readability
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
      if let jsonString = String(data: jsonData, encoding: .utf8) {
        output += jsonString
      } else {
        output += "\(data)"
      }
    } catch {
      output += "\(data)"
    }

    return output + "\n" + String(repeating: "=", count: 50) + "\n"
  }

  /**
   * Generates a summary of the debug event for quick overview
   * @return A brief summary string highlighting key information
   */
  private func getSummary() -> String {
    var summaryParts: [String] = []

    if let itemsCount = data["items_count"] as? String {
      summaryParts.append("Items: \(itemsCount)")
    }
    if let orderId = data["order_id"] as? String {
      summaryParts.append("Order: \(orderId)")
    }
    if let creativeId = data["creativeId"] as? String {
      summaryParts.append("Creative: \(creativeId)")
    }
    if let eventType = data["event_type"] as? String {
      summaryParts.append("Type: \(eventType)")
    }

    // Always show payload size info
    summaryParts.append("Payload: \(data.count) fields")

    return summaryParts.joined(separator: " • ")
  }
}

@objc public class ATTNNativeSDK: NSObject {
  private let sdk: ATTNSDK
  private var debuggingEnabled: Bool = false
  private var debugOverlayWindow: UIWindow?
  private var debugHistory: [DebugEvent] = []

  @objc(initWithDomain:mode:skipFatigueOnCreatives:enableDebugger:)
  public init(domain: String, mode: String, skipFatigueOnCreatives: Bool, enableDebugger: Bool) {
    self.sdk = ATTNSDK(domain: domain, mode: ATTNSDKMode(rawValue: mode) ?? .production)
    self.sdk.skipFatigueOnCreative = skipFatigueOnCreatives

    // Only enable debugging if both enableDebugger is true AND the app is running in debug mode
    #if DEBUG
    let isDebugBuild = true
    #else
    let isDebugBuild = false
    #endif
    self.debuggingEnabled = enableDebugger && isDebugBuild

    ATTNEventTracker.setup(with: sdk)
  }

  @objc(trigger:)
  public func trigger(_ view: UIView) {
    sdk.trigger(view)
    if debuggingEnabled {
      showDebugInfo(event: "Creative Triggered", data: ["type": "trigger", "creativeId": "default"])
    }
  }

  @objc(trigger:creativeId:)
  public func trigger(_ view: UIView, creativeId: String) {
    sdk.trigger(view, creativeId:creativeId)
    if debuggingEnabled {
      showDebugInfo(event: "Creative Triggered", data: ["type": "trigger", "creativeId": creativeId])
    }
  }

  @objc(updateDomain:)
  public func updateDomain(domain: String) {
    sdk.update(domain:domain)
  }

  @objc(identify:)
  public func identify(_ identifiers: [String: Any]) {
    print("👤 [AttentiveSDK] identify called from React Native")
    print("   Identifiers: \(identifiers)")

    sdk.identify(identifiers)

    print("✅ [AttentiveSDK] identify completed")
    print("   User is now identified with the SDK")
    print("   SDK can now make network calls")
  }

  @objc
  public func clearUser() {
    sdk.clearUser()
  }

  // MARK: - Push Notification Methods

  /**
   * Request push notification permission from the user.
   * This will trigger the iOS permission dialog.
   */
  @objc
  public func registerForPushNotifications() {
    sdk.registerForPushNotifications()
    if debuggingEnabled {
      showDebugInfo(event: "Push Registration Requested", data: ["action": "registerForPushNotifications"])
    }
  }

  /**
   * Register the device token received from APNs with the Attentive backend.
   * @param token The hex-encoded device token string
   * @param authorizationStatus Current push authorization status string
   */
  @objc(registerDeviceToken:authorizationStatus:)
  public func registerDeviceToken(_ token: String, authorizationStatus: String) {
    // Convert hex string back to Data
    guard let tokenData = hexStringToData(token) else {
      print("[AttentiveSDK] Invalid device token format")
      return
    }

    // Map string to UNAuthorizationStatus
    let status = mapAuthorizationStatus(authorizationStatus)

    sdk.registerDeviceToken(tokenData, authorizationStatus: status)

    if debuggingEnabled {
      showDebugInfo(event: "Device Token Registered", data: [
        "token": String(token.prefix(16)) + "...",
        "authorizationStatus": authorizationStatus
      ])
    }
  }

  /**
   * Register the device token with callback for use in AppDelegate.
   * This method is intended to be called directly from the host app's AppDelegate,
   * not from React Native JavaScript.
   *
   * @param token The device token Data from APNs
   * @param authorizationStatus Current push authorization status
   * @param callback Completion handler called after registration attempt
   */
  @objc(registerDeviceTokenWithCallback:authorizationStatus:callback:)
  public func registerDeviceToken(
    _ token: Data,
    authorizationStatus: UNAuthorizationStatus,
    callback: @escaping (_ data: Data?, _ url: URL?, _ response: URLResponse?, _ error: Error?) -> Void
  ) {
    sdk.registerDeviceToken(token, authorizationStatus: authorizationStatus, callback: callback)

    if debuggingEnabled {
      let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
      showDebugInfo(event: "Device Token Registered (with callback)", data: [
        "token": String(tokenString.prefix(16)) + "...",
        "authorizationStatus": authorizationStatusToString(authorizationStatus)
      ])
    }
  }

  /**
   * Handle a regular/direct app open event.
   * This should be called after device token registration completes (success or failure).
   *
   * This is the TypeScript equivalent of the native iOS AppDelegate method:
   * ```swift
   * func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
   *   UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
   *     guard let self = self else { return }
   *     let authStatus = settings.authorizationStatus
   *     attentiveSdk?.registerDeviceToken(deviceToken, authorizationStatus: authStatus, callback: { data, url, response, error in
   *       DispatchQueue.main.async {
   *         self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
   *       }
   *     })
   *   }
   * }
   * ```
   *
   * @param authorizationStatus Current push authorization status
   */
  @objc(handleRegularOpen:)
  public func handleRegularOpen(authorizationStatus: UNAuthorizationStatus) {
    print("🌉 [AttentiveSDK] handleRegularOpen called from React Native")
    print("   Authorization Status: \(authorizationStatusToString(authorizationStatus))")
    print("   Calling underlying iOS SDK handleRegularOpen...")

    // Call the underlying Attentive iOS SDK
    sdk.handleRegularOpen(authorizationStatus: authorizationStatus)

    print("✅ [AttentiveSDK] handleRegularOpen completed")
    print("   This should trigger a network call to: https://mobile.attentivemobile.com/mtctrl")
    print("   If you don't see the network call:")
    print("   1. Check that user is identified (call identify() before handleRegularOpen)")
    print("   2. Check your proxy debugger is configured for mobile.attentivemobile.com")
    print("   3. Verify SSL proxying is enabled")
    print("   4. Check device has internet connection")

    if debuggingEnabled {
      showDebugInfo(event: "Regular Open Event", data: [
        "authorizationStatus": authorizationStatusToString(authorizationStatus),
        "expectedEndpoint": "https://mobile.attentivemobile.com/mtctrl",
        "note": "Check network logs to verify endpoint was called"
      ])
    }
  }


  /**
   * Handle when a push notification is opened by the user.
   * Note: SDK 2.0.8 changed the API to require UNNotificationResponse instead of userInfo dictionary.
   * This method is kept for backward compatibility but has limited functionality.
   * For full functionality, handle push notifications natively in AppDelegate.
   *
   * @param userInfo The notification payload
   * @param applicationState The app state when notification was opened
   * @param authorizationStatus Current push authorization status
   */
  @objc(handlePushOpened:applicationState:authorizationStatus:)
  public func handlePushOpened(_ userInfo: [String: Any], applicationState: String, authorizationStatus: String) {
    // Note: SDK 2.0.8 changed the API to require UNNotificationResponse
    // Since React Native doesn't provide direct access to UNNotificationResponse,
    // apps should handle push notifications natively in AppDelegate for full functionality
    print("[AttentiveSDK] Warning: Push notification handling from React Native is limited in SDK 2.0.8")
    print("[AttentiveSDK] The native SDK now requires UNNotificationResponse for push tracking")
    print("[AttentiveSDK] Please implement push handling in AppDelegate for full functionality")

    if debuggingEnabled {
      showDebugInfo(event: "Push Opened (Limited)", data: [
        "applicationState": applicationState,
        "authorizationStatus": authorizationStatus,
        "userInfo": userInfo,
        "warning": "SDK 2.0.8 requires native UNNotificationResponse handling in AppDelegate"
      ])
    }
  }

  /**
   * Handle when a push notification arrives while the app is in foreground.
   * @param userInfo The notification payload
   */
  @objc(handleForegroundNotification:)
  public func handleForegroundNotification(_ userInfo: [String: Any]) {
    // Note: SDK 2.0.8 changed the API to require UNNotificationResponse
    // Since React Native doesn't provide this, we'll log a warning
    print("[AttentiveSDK] Warning: Foreground notification handling from React Native is limited in SDK 2.0.8")
    print("[AttentiveSDK] Please handle foreground notifications natively in AppDelegate for full functionality")

    if debuggingEnabled {
      showDebugInfo(event: "Foreground Notification", data: [
        "userInfo": userInfo,
        "warning": "SDK 2.0.8 requires native UNNotificationResponse handling"
      ])
    }
  }

  /**
   * Handle a push notification when the app is in the foreground (active state).
   * This is the native equivalent that should be called from AppDelegate when the app is active.
   *
   * Equivalent to Swift AppDelegate code:
   * ```swift
   * case .active:
   *   self.attentiveSdk?.handleForegroundPush(response: response, authorizationStatus: authStatus)
   * ```
   *
   * @param response The UNNotificationResponse from the notification center delegate
   * @param authorizationStatus Current push authorization status
   */
  @objc(handleForegroundPush:authorizationStatus:)
  public func handleForegroundPush(response: UNNotificationResponse, authorizationStatus: UNAuthorizationStatus) {
    sdk.handleForegroundPush(response: response, authorizationStatus: authorizationStatus)

    if debuggingEnabled {
      let userInfo = response.notification.request.content.userInfo
      showDebugInfo(event: "Foreground Push", data: [
        "authorizationStatus": authorizationStatusToString(authorizationStatus),
        "userInfo": userInfo as? [String: Any] ?? [:],
        "actionIdentifier": response.actionIdentifier
      ])
    }
  }

  /**
   * Handle when a push notification is opened by the user (app in background/inactive state).
   * This is the native equivalent that should be called from AppDelegate when the app is background or inactive.
   *
   * Equivalent to Swift AppDelegate code:
   * ```swift
   * case .background, .inactive:
   *   self.attentiveSdk?.handlePushOpen(response: response, authorizationStatus: authStatus)
   * ```
   *
   * @param response The UNNotificationResponse from the notification center delegate
   * @param authorizationStatus Current push authorization status
   */
  @objc(handlePushOpen:authorizationStatus:)
  public func handlePushOpen(response: UNNotificationResponse, authorizationStatus: UNAuthorizationStatus) {
    sdk.handlePushOpen(response: response, authorizationStatus: authorizationStatus)

    if debuggingEnabled {
      let userInfo = response.notification.request.content.userInfo
      showDebugInfo(event: "Push Open", data: [
        "authorizationStatus": authorizationStatusToString(authorizationStatus),
        "userInfo": userInfo as? [String: Any] ?? [:],
        "actionIdentifier": response.actionIdentifier
      ])
    }
  }

  /**
   * Handle a push notification when the app is in the foreground (active state) - React Native version.
   * This method accepts userInfo dictionary instead of UNNotificationResponse, making it callable from React Native.
   *
   * Note: This is a limited version since we don't have access to the full UNNotificationResponse.
   * For full functionality, use the native AppDelegate implementation.
   *
   * @param userInfo The notification payload dictionary
   * @param authorizationStatus Current push authorization status string
   */
  @objc(handleForegroundPushFromRN:authorizationStatus:)
  public func handleForegroundPushFromRN(_ userInfo: [String: Any], authorizationStatus: String) {
    _ = mapAuthorizationStatus(authorizationStatus)

    // Note: SDK 2.0.8 requires UNNotificationResponse, but we only have userInfo from React Native
    // This is a workaround that logs the limitation
    print("[AttentiveSDK] handleForegroundPush called from React Native (limited functionality)")
    print("[AttentiveSDK] For full functionality, implement in native AppDelegate")

    if debuggingEnabled {
      showDebugInfo(event: "Foreground Push (React Native)", data: [
        "authorizationStatus": authorizationStatus,
        "userInfo": userInfo,
        "note": "Limited functionality - UNNotificationResponse not available from React Native"
      ])
    }
  }

  /**
   * Handle when a push notification is opened by the user (app in background/inactive state) - React Native version.
   * This method accepts userInfo dictionary instead of UNNotificationResponse, making it callable from React Native.
   *
   * Note: This is a limited version since we don't have access to the full UNNotificationResponse.
   * For full functionality, use the native AppDelegate implementation.
   *
   * @param userInfo The notification payload dictionary
   * @param authorizationStatus Current push authorization status string
   */
  @objc(handlePushOpenFromRN:authorizationStatus:)
  public func handlePushOpenFromRN(_ userInfo: [String: Any], authorizationStatus: String) {
    _ = mapAuthorizationStatus(authorizationStatus)

    // Note: SDK 2.0.8 requires UNNotificationResponse, but we only have userInfo from React Native
    // This is a workaround that logs the limitation
    print("[AttentiveSDK] handlePushOpen called from React Native (limited functionality)")
    print("[AttentiveSDK] For full functionality, implement in native AppDelegate")

    if debuggingEnabled {
      showDebugInfo(event: "Push Open (React Native)", data: [
        "authorizationStatus": authorizationStatus,
        "userInfo": userInfo,
        "note": "Limited functionality - UNNotificationResponse not available from React Native"
      ])
    }
  }

  // MARK: - Push Notification Helpers

  private func hexStringToData(_ hexString: String) -> Data? {
    var data = Data()
    var hex = hexString

    // Remove any non-hex characters
    hex = hex.replacingOccurrences(of: " ", with: "")
    hex = hex.replacingOccurrences(of: "<", with: "")
    hex = hex.replacingOccurrences(of: ">", with: "")

    var index = hex.startIndex
    while index < hex.endIndex {
      let nextIndex = hex.index(index, offsetBy: 2, limitedBy: hex.endIndex) ?? hex.endIndex
      if nextIndex > hex.endIndex { break }

      let byteString = String(hex[index..<nextIndex])
      if let byte = UInt8(byteString, radix: 16) {
        data.append(byte)
      } else {
        return nil
      }
      index = nextIndex
    }

    return data.isEmpty ? nil : data
  }

  private func mapAuthorizationStatus(_ status: String) -> UNAuthorizationStatus {
    switch status.lowercased() {
    case "authorized":
      return .authorized
    case "denied":
      return .denied
    case "notdetermined":
      return .notDetermined
    case "provisional":
      return .provisional
    case "ephemeral":
      if #available(iOS 14.0, *) {
        return .ephemeral
      }
      return .authorized
    default:
      return .notDetermined
    }
  }

  private func authorizationStatusToString(_ status: UNAuthorizationStatus) -> String {
    switch status {
    case .authorized:
      return "authorized"
    case .denied:
      return "denied"
    case .notDetermined:
      return "notDetermined"
    case .provisional:
      return "provisional"
    case .ephemeral:
      if #available(iOS 14.0, *) {
        return "ephemeral"
      }
      return "authorized"
    @unknown default:
      return "notDetermined"
    }
  }

  @objc
  public func invokeAttentiveDebugHelper() {
    if debuggingEnabled {
      // Don't add to history - this is just for viewing existing debug data
      DispatchQueue.main.async {
        guard let keyWindow = UIApplication.shared.connectedScenes
          .compactMap({ $0 as? UIWindowScene })
          .first?.windows
          .first(where: { $0.isKeyWindow }) else { return }

        let debugVC = DebugOverlayViewController(currentEvent: "Manual Debug View", currentData: ["action": "manual_debug_call", "session_events": "\(self.debugHistory.count)"], history: self.debugHistory)
        debugVC.modalPresentationStyle = .overFullScreen
        debugVC.modalTransitionStyle = .crossDissolve

        keyWindow.rootViewController?.present(debugVC, animated: true)
      }
    }
  }

}

public extension ATTNNativeSDK {
  /**
   * Exports the current debug session logs as a formatted string
   * @return A comprehensive formatted string containing all debug events in the current session
   */
  @objc
  func exportDebugLogs() -> String {
    guard debuggingEnabled else {
      return "Debug logging is not enabled. Please enable debugging to export logs."
    }

    if debugHistory.isEmpty {
      return "No debug events recorded in this session."
    }

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    let exportDate = formatter.string(from: Date())

    var exportContent = """
    Attentive React Native SDK - Debug Session Export
    Generated: \(exportDate)
    Total Events: \(debugHistory.count)

    \(String(repeating: "=", count: 60))

    """

    // Add all events in chronological order (oldest first for better readability)
    for (index, event) in debugHistory.enumerated() {
      exportContent += "Event #\(index + 1)\n"
      exportContent += event.formatForExport()
      exportContent += "\n"
    }

    exportContent += """
    \(String(repeating: "=", count: 60))
    End of Debug Session Export
    """

    return exportContent
  }

  @objc
  func recordAddToCartEvent(_ attributes: [String: Any]) {
    let items = parseItems(attributes["items"] as? [[String : Any]] ?? [])
    let deeplink = attributes["deeplink"] as? String ?? ""
    let event = ATTNAddToCartEvent(items: items, deeplink: deeplink)
    ATTNEventTracker.sharedInstance()?.record(event: event)

    if debuggingEnabled {
      // Enhanced debug data to show parsed item details
      var debugData: [String: Any] = [
        "items_count": "\(items.count)",
        "deeplink": deeplink,
        "payload": attributes
      ]

      // Add item details to debug output
      if let firstItem = items.first {
        var itemDetails: [String: Any] = [
          "productId": firstItem.productId,
          "productVariantId": firstItem.productVariantId
        ]
        if let name = firstItem.name {
          itemDetails["name"] = name
        }
        if let productImage = firstItem.productImage {
          itemDetails["productImage"] = productImage
        }
        if let category = firstItem.category {
          itemDetails["category"] = category
        }
        itemDetails["quantity"] = firstItem.quantity
        debugData["first_item"] = itemDetails
      }

      showDebugInfo(event: "Add To Cart Event", data: debugData)
    }
  }

  @objc
  func recordProductViewEvent(_ attributes: [String: Any]) {
    let items = parseItems(attributes["items"] as? [[String : Any]] ?? [])
    let deeplink = attributes["deeplink"] as? String ?? ""
    let event = ATTNProductViewEvent(items: items, deeplink: deeplink)
    ATTNEventTracker.sharedInstance()?.record(event: event)

    if debuggingEnabled {
      // Enhanced debug data to show parsed item details
      var debugData: [String: Any] = [
        "items_count": "\(items.count)",
        "deeplink": deeplink,
        "payload": attributes
      ]

      // Add item details to debug output
      if let firstItem = items.first {
        var itemDetails: [String: Any] = [
          "productId": firstItem.productId,
          "productVariantId": firstItem.productVariantId
        ]
        if let name = firstItem.name {
          itemDetails["name"] = name
        }
        if let productImage = firstItem.productImage {
          itemDetails["productImage"] = productImage
        }
        if let category = firstItem.category {
          itemDetails["category"] = category
        }
        itemDetails["quantity"] = firstItem.quantity
        debugData["first_item"] = itemDetails
      }

      showDebugInfo(event: "Product View Event", data: debugData)
    }
  }

  @objc
  func recordPurchaseEvent(_ attributes: [String: Any]) {
    let attrOrder = attributes["order"] as? [String: String] ?? [:]
    guard let orderId = attrOrder["id"] else { return }
    let order = ATTNOrder(orderId: orderId)
    let items = parseItems(attributes["items"] as? [[String : Any]] ?? [])
    let event = ATTNPurchaseEvent(items: items, order: order)
    ATTNEventTracker.sharedInstance()?.record(event: event)

    if debuggingEnabled {
      // Enhanced debug data to show parsed item details
      var debugData: [String: Any] = [
        "items_count": "\(items.count)",
        "order_id": orderId,
        "payload": attributes
      ]

      // Add item details to debug output
      if let firstItem = items.first {
        var itemDetails: [String: Any] = [
          "productId": firstItem.productId,
          "productVariantId": firstItem.productVariantId
        ]
        if let name = firstItem.name {
          itemDetails["name"] = name
        }
        if let productImage = firstItem.productImage {
          itemDetails["productImage"] = productImage
        }
        if let category = firstItem.category {
          itemDetails["category"] = category
        }
        itemDetails["quantity"] = firstItem.quantity
        debugData["first_item"] = itemDetails
      }

      showDebugInfo(event: "Purchase Event", data: debugData)
    }
  }

  @objc
  func recordCustomEvent(_ attributes: [String: Any]) {
    let type = attributes["type"] as? String ?? ""
    let properties = attributes["properties"] as? [String: String] ?? [:]
    guard let customEvent = ATTNCustomEvent(type: type, properties: properties) else { return }
    ATTNEventTracker.sharedInstance()?.record(event: customEvent)

    if debuggingEnabled {
      showDebugInfo(event: "Custom Event", data: ["event_type": type, "properties_count": "\(properties.count)", "payload": attributes])
    }
  }
}

private extension ATTNNativeSDK {
  func parseItems(_ rawItems: [[String: Any]]) -> [ATTNItem] {
    var itemsToReturn: [ATTNItem] = []

    for rawItem in rawItems {
      // Parse price - flattened structure (not nested)
      guard let priceString = rawItem["price"] as? String,
            let currency = rawItem["currency"] as? String,
            let productId = rawItem["productId"] as? String,
            let productVariantId = rawItem["productVariantId"] as? String else {
        continue
      }

      let price = NSDecimalNumber(string: priceString)
      let attnPrice = ATTNPrice(price: price, currency: currency)

      let item = ATTNItem(productId: productId, productVariantId: productVariantId, price: attnPrice)

      // Parse optional fields to match Android implementation
      if let productImage = rawItem["productImage"] as? String {
        item.productImage = productImage
      }

      if let name = rawItem["name"] as? String {
        item.name = name
      }

      // React Native bridges JS numbers as NSNumber, so accept NSNumber directly
      if let quantity = rawItem["quantity"] as? NSNumber {
        item.quantity = quantity.intValue
      }

      if let category = rawItem["category"] as? String {
        item.category = category
      }

      itemsToReturn.append(item)
    }

    return itemsToReturn
  }

  func showDebugInfo(event: String, data: [String: Any]) {
    // Add to debug history
    let debugEvent = DebugEvent(eventType: event, data: data)
    debugHistory.append(debugEvent)

    DispatchQueue.main.async {
      // Create debug overlay with history
      guard let keyWindow = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene })
        .first?.windows
        .first(where: { $0.isKeyWindow }) else { return }

      let debugVC = DebugOverlayViewController(currentEvent: event, currentData: data, history: self.debugHistory)
      debugVC.modalPresentationStyle = .overFullScreen
      debugVC.modalTransitionStyle = .crossDissolve

      keyWindow.rootViewController?.present(debugVC, animated: true)
    }
  }
}

// Debug Overlay View Controller
class DebugOverlayViewController: UIViewController {
  private let currentEvent: String
  private let currentData: [String: Any]
  private let history: [DebugEvent]

  private var segmentedControl: UISegmentedControl!
  private var containerView: UIView!
  private var currentEventView: UIView!
  private var historyView: UIView!

  init(currentEvent: String, currentData: [String: Any], history: [DebugEvent]) {
    self.currentEvent = currentEvent
    self.currentData = currentData
    self.history = history
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    setupUI()
  }

  private func setupUI() {
    view.backgroundColor = UIColor.black.withAlphaComponent(0.8)

    // Main container
    containerView = UIView()
    containerView.backgroundColor = UIColor.systemBackground
    containerView.layer.cornerRadius = 12
    containerView.layer.shadowColor = UIColor.black.cgColor
    containerView.layer.shadowOpacity = 0.3
    containerView.layer.shadowOffset = CGSize(width: 0, height: 2)
    containerView.layer.shadowRadius = 8
    containerView.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(containerView)

    // Title
    let titleLabel = UILabel()
    titleLabel.text = "🐛 Attentive Debug Session"
    titleLabel.font = UIFont.boldSystemFont(ofSize: 18)
    titleLabel.textAlignment = .center
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(titleLabel)

    // Segmented control for Current/History
    segmentedControl = UISegmentedControl(items: ["Current Event", "Session History (\(history.count))"])
    segmentedControl.selectedSegmentIndex = 0
    segmentedControl.addTarget(self, action: #selector(segmentChanged), for: .valueChanged)
    segmentedControl.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(segmentedControl)

    // Content container for switching views
    let contentContainer = UIView()
    contentContainer.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(contentContainer)

    // Setup current event view
    setupCurrentEventView()
    contentContainer.addSubview(currentEventView)

    // Setup history view
    setupHistoryView()
    contentContainer.addSubview(historyView)
    historyView.isHidden = true

    // Share button in top-right corner (left of close button)
    let shareButton = UIButton(type: .system)
    shareButton.setTitle("↗", for: .normal) // iOS-style share symbol
    shareButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
    shareButton.setTitleColor(.systemBlue, for: .normal)
    shareButton.backgroundColor = UIColor.systemGray5
    shareButton.layer.cornerRadius = 15
    shareButton.addTarget(self, action: #selector(shareButtonTapped), for: .touchUpInside)
    shareButton.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(shareButton)

    // X Close button in top-right corner
    let closeButton = UIButton(type: .system)
    closeButton.setTitle("✕", for: .normal)
    closeButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
    closeButton.setTitleColor(.secondaryLabel, for: .normal)
    closeButton.backgroundColor = UIColor.systemGray5
    closeButton.layer.cornerRadius = 15
    closeButton.addTarget(self, action: #selector(closeButtonTapped), for: .touchUpInside)
    closeButton.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(closeButton)

    // Layout constraints - position at bottom and make larger
    NSLayoutConstraint.activate([
      containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
      containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
      containerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
      containerView.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.65),

      closeButton.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 12),
      closeButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12),
      closeButton.widthAnchor.constraint(equalToConstant: 30),
      closeButton.heightAnchor.constraint(equalToConstant: 30),

      shareButton.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 12),
      shareButton.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8),
      shareButton.widthAnchor.constraint(equalToConstant: 30),
      shareButton.heightAnchor.constraint(equalToConstant: 30),

      titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 16),
      titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      titleLabel.trailingAnchor.constraint(equalTo: shareButton.leadingAnchor, constant: -8),

      segmentedControl.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 16),
      segmentedControl.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      segmentedControl.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),

      contentContainer.topAnchor.constraint(equalTo: segmentedControl.bottomAnchor, constant: 16),
      contentContainer.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      contentContainer.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),
      contentContainer.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -16),

      currentEventView.topAnchor.constraint(equalTo: contentContainer.topAnchor),
      currentEventView.leadingAnchor.constraint(equalTo: contentContainer.leadingAnchor),
      currentEventView.trailingAnchor.constraint(equalTo: contentContainer.trailingAnchor),
      currentEventView.bottomAnchor.constraint(equalTo: contentContainer.bottomAnchor),

      historyView.topAnchor.constraint(equalTo: contentContainer.topAnchor),
      historyView.leadingAnchor.constraint(equalTo: contentContainer.leadingAnchor),
      historyView.trailingAnchor.constraint(equalTo: contentContainer.trailingAnchor),
      historyView.bottomAnchor.constraint(equalTo: contentContainer.bottomAnchor)
    ])

    // Auto-dismiss after 8 seconds (longer for history viewing)
    DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) {
      self.dismiss(animated: true)
    }
  }

  private func formatData(_ data: [String: Any]) -> String {
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
      return String(data: jsonData, encoding: .utf8) ?? "Unable to format data"
    } catch {
      return "Error formatting data: \(error.localizedDescription)"
    }
  }

  private func setupCurrentEventView() {
    currentEventView = UIView()
    currentEventView.translatesAutoresizingMaskIntoConstraints = false

    let eventLabel = UILabel()
    eventLabel.text = "Event: \(currentEvent)"
    eventLabel.font = UIFont.systemFont(ofSize: 16, weight: .medium)
    eventLabel.translatesAutoresizingMaskIntoConstraints = false
    currentEventView.addSubview(eventLabel)

    let scrollView = UIScrollView()
    scrollView.translatesAutoresizingMaskIntoConstraints = false
    currentEventView.addSubview(scrollView)

    let dataLabel = UILabel()
    dataLabel.text = formatData(currentData)
    dataLabel.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .regular)
    dataLabel.numberOfLines = 0
    dataLabel.translatesAutoresizingMaskIntoConstraints = false
    scrollView.addSubview(dataLabel)

    NSLayoutConstraint.activate([
      eventLabel.topAnchor.constraint(equalTo: currentEventView.topAnchor),
      eventLabel.leadingAnchor.constraint(equalTo: currentEventView.leadingAnchor),
      eventLabel.trailingAnchor.constraint(equalTo: currentEventView.trailingAnchor),

      scrollView.topAnchor.constraint(equalTo: eventLabel.bottomAnchor, constant: 16),
      scrollView.leadingAnchor.constraint(equalTo: currentEventView.leadingAnchor),
      scrollView.trailingAnchor.constraint(equalTo: currentEventView.trailingAnchor),
      scrollView.bottomAnchor.constraint(equalTo: currentEventView.bottomAnchor),

      dataLabel.topAnchor.constraint(equalTo: scrollView.topAnchor),
      dataLabel.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      dataLabel.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      dataLabel.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
      dataLabel.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
    ])
  }

  private func setupHistoryView() {
    historyView = UIView()
    historyView.translatesAutoresizingMaskIntoConstraints = false

    if history.isEmpty {
      let emptyLabel = UILabel()
      emptyLabel.text = "No events recorded in this session yet."
      emptyLabel.font = UIFont.systemFont(ofSize: 16)
      emptyLabel.textColor = .secondaryLabel
      emptyLabel.textAlignment = .center
      emptyLabel.translatesAutoresizingMaskIntoConstraints = false
      historyView.addSubview(emptyLabel)

      NSLayoutConstraint.activate([
        emptyLabel.centerXAnchor.constraint(equalTo: historyView.centerXAnchor),
        emptyLabel.centerYAnchor.constraint(equalTo: historyView.centerYAnchor),
      ])
    } else {
      let tableView = UITableView()
      tableView.translatesAutoresizingMaskIntoConstraints = false
      tableView.dataSource = self
      tableView.delegate = self
      tableView.register(DebugHistoryCell.self, forCellReuseIdentifier: "DebugHistoryCell")
      tableView.backgroundColor = .clear
      historyView.addSubview(tableView)

      NSLayoutConstraint.activate([
        tableView.topAnchor.constraint(equalTo: historyView.topAnchor),
        tableView.leadingAnchor.constraint(equalTo: historyView.leadingAnchor),
        tableView.trailingAnchor.constraint(equalTo: historyView.trailingAnchor),
        tableView.bottomAnchor.constraint(equalTo: historyView.bottomAnchor),
      ])
    }
  }

  @objc private func segmentChanged(_ sender: UISegmentedControl) {
    if sender.selectedSegmentIndex == 0 {
      currentEventView.isHidden = false
      historyView.isHidden = true
    } else {
      currentEventView.isHidden = true
      historyView.isHidden = false
    }
  }

  /**
   * Handles the share button tap to export and share debug logs
   */
  @objc private func shareButtonTapped() {
    // Generate export content for the current history
    let exportContent = generateExportContent()

    // Create activity view controller for sharing
    let activityVC = UIActivityViewController(activityItems: [exportContent], applicationActivities: nil)

    // For iPad - prevent crash by setting popover presentation controller
    if let popover = activityVC.popoverPresentationController {
      // Find the share button view to anchor the popover
      if let shareButton = view.subviews.first(where: { $0.accessibilityLabel == "shareButton" }) {
        popover.sourceView = shareButton
        popover.sourceRect = shareButton.bounds
      } else {
        popover.sourceView = view
        popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
      }
    }

    present(activityVC, animated: true)
  }

  /**
   * Generates formatted export content for sharing
   * @return Formatted string containing all debug events
   */
  private func generateExportContent() -> String {
    if history.isEmpty {
      return "No debug events recorded in this session."
    }

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    let exportDate = formatter.string(from: Date())

    var exportContent = """
    Attentive React Native SDK - Debug Session Export
    Generated: \(exportDate)
    Total Events: \(history.count)

    \(String(repeating: "=", count: 60))

    """

    // Add all events in chronological order (oldest first for better readability)
    for (index, event) in history.enumerated() {
      exportContent += "Event #\(index + 1)\n"
      exportContent += event.formatForExport()
      exportContent += "\n"
    }

    exportContent += """
    \(String(repeating: "=", count: 60))
    End of Debug Session Export
    """

    return exportContent
  }

  @objc private func closeButtonTapped() {
    dismiss(animated: true)
  }
}

// MARK: - TableView DataSource and Delegate
extension DebugOverlayViewController: UITableViewDataSource, UITableViewDelegate {
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return history.count
  }

  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "DebugHistoryCell", for: indexPath) as! DebugHistoryCell
    let event = history[history.count - 1 - indexPath.row] // Show newest first
    cell.configure(with: event)
    return cell
  }

  func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
    return UITableView.automaticDimension
  }

  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    tableView.deselectRow(at: indexPath, animated: true)
    let event = history[history.count - 1 - indexPath.row]

    // Show detailed view of selected event
    let detailVC = EventDetailViewController(event: event)
    detailVC.modalPresentationStyle = .overFullScreen
    present(detailVC, animated: true)
  }
}

// MARK: - Debug History Cell
class DebugHistoryCell: UITableViewCell {
  private let timeLabel = UILabel()
  private let eventLabel = UILabel()
  private let summaryLabel = UILabel()

  override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
    super.init(style: style, reuseIdentifier: reuseIdentifier)
    setupUI()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupUI() {
    backgroundColor = .clear

    timeLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .regular)
    timeLabel.textColor = .secondaryLabel
    timeLabel.translatesAutoresizingMaskIntoConstraints = false
    contentView.addSubview(timeLabel)

    eventLabel.font = UIFont.systemFont(ofSize: 14, weight: .medium)
    eventLabel.translatesAutoresizingMaskIntoConstraints = false
    contentView.addSubview(eventLabel)

    summaryLabel.font = UIFont.systemFont(ofSize: 12)
    summaryLabel.textColor = .secondaryLabel
    summaryLabel.numberOfLines = 2
    summaryLabel.translatesAutoresizingMaskIntoConstraints = false
    contentView.addSubview(summaryLabel)

    NSLayoutConstraint.activate([
      timeLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 8),
      timeLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

      eventLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 8),
      eventLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
      eventLabel.trailingAnchor.constraint(equalTo: timeLabel.leadingAnchor, constant: -8),

      summaryLabel.topAnchor.constraint(equalTo: eventLabel.bottomAnchor, constant: 4),
      summaryLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
      summaryLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
      summaryLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -8),
    ])
  }

  func configure(with event: DebugEvent) {
    let formatter = DateFormatter()
    formatter.dateFormat = "HH:mm:ss"
    timeLabel.text = formatter.string(from: event.timestamp)

    eventLabel.text = event.eventType

    // Create summary from data - always show payload info
    var summaryParts: [String] = []

    // Add key-value summary
    if let itemsCount = event.data["items_count"] as? String {
      summaryParts.append("Items: \(itemsCount)")
    }
    if let orderId = event.data["order_id"] as? String {
      summaryParts.append("Order: \(orderId)")
    }
    if let creativeId = event.data["creativeId"] as? String {
      summaryParts.append("Creative: \(creativeId)")
    }
    if let eventType = event.data["event_type"] as? String {
      summaryParts.append("Type: \(eventType)")
    }

    // Always show payload size info
    let payloadInfo = "Payload: \(event.data.count) fields"
    summaryParts.append(payloadInfo)

    summaryLabel.text = summaryParts.joined(separator: " • ") + " (Tap for details)"
  }
}

// MARK: - Event Detail View Controller
class EventDetailViewController: UIViewController {
  private let event: DebugEvent

  init(event: DebugEvent) {
    self.event = event
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    setupUI()
  }

  private func setupUI() {
    view.backgroundColor = UIColor.black.withAlphaComponent(0.8)

    let containerView = UIView()
    containerView.backgroundColor = UIColor.systemBackground
    containerView.layer.cornerRadius = 12
    containerView.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(containerView)

    let titleLabel = UILabel()
    titleLabel.text = event.eventType
    titleLabel.font = UIFont.boldSystemFont(ofSize: 18)
    titleLabel.textAlignment = .center
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(titleLabel)

    let timeLabel = UILabel()
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    timeLabel.text = "Timestamp: \(formatter.string(from: event.timestamp))"
    timeLabel.font = UIFont.systemFont(ofSize: 14)
    timeLabel.textColor = .secondaryLabel
    timeLabel.textAlignment = .center
    timeLabel.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(timeLabel)

    let scrollView = UIScrollView()
    scrollView.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(scrollView)

    let dataLabel = UILabel()
    dataLabel.text = formatData(event.data)
    dataLabel.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .regular)
    dataLabel.numberOfLines = 0
    dataLabel.translatesAutoresizingMaskIntoConstraints = false
    scrollView.addSubview(dataLabel)

    // Share button for single event
    let shareButton = UIButton(type: .system)
    shareButton.setTitle("↗", for: .normal) // iOS-style share symbol
    shareButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
    shareButton.setTitleColor(.systemBlue, for: .normal)
    shareButton.backgroundColor = UIColor.systemGray5
    shareButton.layer.cornerRadius = 15
    shareButton.addTarget(self, action: #selector(shareEventButtonTapped), for: .touchUpInside)
    shareButton.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(shareButton)

    let closeButton = UIButton(type: .system)
    closeButton.setTitle("✕", for: .normal)
    closeButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
    closeButton.setTitleColor(.secondaryLabel, for: .normal)
    closeButton.backgroundColor = UIColor.systemGray5
    closeButton.layer.cornerRadius = 15
    closeButton.addTarget(self, action: #selector(closeButtonTapped), for: .touchUpInside)
    closeButton.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(closeButton)

    NSLayoutConstraint.activate([
      containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
      containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
      containerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
      containerView.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.65),

      closeButton.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 12),
      closeButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12),
      closeButton.widthAnchor.constraint(equalToConstant: 30),
      closeButton.heightAnchor.constraint(equalToConstant: 30),

      shareButton.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 12),
      shareButton.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8),
      shareButton.widthAnchor.constraint(equalToConstant: 30),
      shareButton.heightAnchor.constraint(equalToConstant: 30),

      titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 16),
      titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      titleLabel.trailingAnchor.constraint(equalTo: shareButton.leadingAnchor, constant: -8),

      timeLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
      timeLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      timeLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),

      scrollView.topAnchor.constraint(equalTo: timeLabel.bottomAnchor, constant: 16),
      scrollView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      scrollView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),
      scrollView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -16),

      dataLabel.topAnchor.constraint(equalTo: scrollView.topAnchor),
      dataLabel.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      dataLabel.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      dataLabel.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
      dataLabel.widthAnchor.constraint(equalTo: scrollView.widthAnchor)
    ])
  }

  private func formatData(_ data: [String: Any]) -> String {
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
      return String(data: jsonData, encoding: .utf8) ?? "Unable to format data"
    } catch {
      return "Error formatting data: \(error.localizedDescription)"
    }
  }

  /**
   * Handles the share button tap to export and share a single debug event
   */
  @objc private func shareEventButtonTapped() {
    let exportContent = generateSingleEventExport()

    // Create activity view controller for sharing
    let activityVC = UIActivityViewController(activityItems: [exportContent], applicationActivities: nil)

    // For iPad - prevent crash by setting popover presentation controller
    if let popover = activityVC.popoverPresentationController {
      popover.sourceView = view
      popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
    }

    present(activityVC, animated: true)
  }

  /**
   * Generates formatted export content for a single event
   * @return Formatted string containing the single debug event
   */
  private func generateSingleEventExport() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    let exportDate = formatter.string(from: Date())

    let eventContent = """
    Attentive React Native SDK - Single Event Export
    Generated: \(exportDate)

    \(String(repeating: "=", count: 60))

    \(event.formatForExport())
    \(String(repeating: "=", count: 60))
    End of Single Event Export
    """

    return eventContent
  }

  @objc private func closeButtonTapped() {
    dismiss(animated: true)
  }
}
