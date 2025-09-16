//
//  ATTNNativeSDK.swift
//  AttentiveReactNativeSdk
//
//  Created by Vladimir - Work on 2024-06-28.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation
import attentive_ios_sdk

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
}

@objc public class ATTNNativeSDK: NSObject {
  private let sdk: ATTNSDK
  private var debuggingEnabled: Bool = false
  private var debugOverlayWindow: UIWindow?
  private var debugHistory: [DebugEvent] = []

  @objc(initWithDomain:mode:skipFatigueOnCreatives:enableDebugger:)
  public init(domain: String, mode: String, skipFatigueOnCreatives: Bool, enableDebugger: Bool) {
    self.sdk = ATTNSDK(domain: domain, mode: ATTNSDKMode(rawValue: mode) ?? .production)
    self.sdk.skipFatigueOnCreative = skipFatigueOnCreatives ?? false
    self.debuggingEnabled = enableDebugger ?? false
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
    sdk.identify(identifiers)
  }

  @objc
  public func clearUser() {
    sdk.clearUser()
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
  @objc
  func recordAddToCartEvent(_ attributes: [String: Any]) {
    let items = parseItems(attributes["items"] as? [[String : Any]] ?? [])
    let deeplink = attributes["deeplink"] as? String ?? ""
    let event = ATTNAddToCartEvent(items: items, deeplink: deeplink)
    ATTNEventTracker.sharedInstance()?.record(event: event)

    if debuggingEnabled {
      showDebugInfo(event: "Add To Cart Event", data: ["items_count": "\(items.count)", "deeplink": deeplink, "payload": attributes])
    }
  }

  @objc
  func recordProductViewEvent(_ attributes: [String: Any]) {
    let items = parseItems(attributes["items"] as? [[String : Any]] ?? [])
    let deeplink = attributes["deeplink"] as? String ?? ""
    let event = ATTNProductViewEvent(items: items, deeplink: deeplink)
    ATTNEventTracker.sharedInstance()?.record(event: event)

    if debuggingEnabled {
      showDebugInfo(event: "Product View Event", data: ["items_count": "\(items.count)", "deeplink": deeplink, "payload": attributes])
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
      showDebugInfo(event: "Purchase Event", data: ["items_count": "\(items.count)", "order_id": orderId, "payload": attributes])
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
      if let rawPrice = rawItem["price"] as? [String: Any],
         let priceString = rawPrice["price"] as? String,
         let currency = rawPrice["currency"] as? String {

        let price = NSDecimalNumber(string: priceString)

        let attnPrice = ATTNPrice(price: price, currency: currency)

        if let productId = rawItem["productId"] as? String,
           let productVariantId = rawItem["productVariantId"] as? String {

          let item = ATTNItem(productId: productId, productVariantId: productVariantId, price: attnPrice)
          itemsToReturn.append(item)
        }
      }
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

      titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 16),
      titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      titleLabel.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8),

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

      titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 16),
      titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
      titleLabel.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8),

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

  @objc private func closeButtonTapped() {
    dismiss(animated: true)
  }
}
