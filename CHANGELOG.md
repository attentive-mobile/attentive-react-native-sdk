

# [2.3.0](https://github.com/attentive-mobile/attentive-react-native-sdk/compare/2.2.0...2.3.0) (2026-10-20)


### ⚠ Upgrade notes

- **The New Architecture is required on iOS and Android.** This is not a new requirement. The docs now say so plainly: on the old architecture the SDK doesn't build on Android, and on iOS every call, starting with `initialize()`, throws `The package 'attentive-react-native-sdk' doesn't seem to be linked`. See the README's Requirements.
- **`skipFatigueOnCreatives` is deprecated.** It has no effect, because fatigue is evaluated on the backend. To force a creative while debugging, trigger it by ID. The field is still accepted and will be removed in the next major version. (MSDK-529)

### Features

- **Inbox.** `<AttentiveInboxView />` is a drop-in message center with the list, unread dots, pull-to-refresh, paging and swipe actions. Rendering it is the whole integration. It needs a push-registered device and bounded height (for example `style={{ flex: 1 }}`). See the README's Inbox section.
  - **Theming:** `inboxBackgroundColor`, `unreadIndicatorColor`, `titleTextColor`, `bodyTextColor`, `timestampTextColor` and `swipeBackgroundColor` apply on both platforms. (MSDK-481)
  - **Taps:** `onMessageTap` reports `{ messageId, actionUrl }` for each tapped row. It observes the tap, and the SDK still records the click, marks the message read and opens its deep link. (MSDK-478)
  - **`automaticallyOpensInboxDeepLinks`** (default `true`): set it to `false` to route taps yourself. On iOS, set the TypeScript config field. On Android, call `.automaticallyOpensInboxDeepLinks(false)` on `AttentiveConfig.Builder`. In Expo CNG apps, set the new config plugin option of the same name. (MSDK-478, MSDK-550)
  - **Unread badge:** `getInboxUnreadCount()` and `addInboxUnreadCountListener(listener)`.
  - **Read state:** `markInboxMessageRead(id)` and `markInboxMessageUnread(id)`. Both are fire-and-forget and take IDs of loaded messages. (MSDK-551)
  - **Custom inbox UI:** to render your own inbox instead of the view, use `getInboxState()` and `addInboxStateListener(listener)` with `loadMoreInboxMessages()`, `markInboxMessageClicked(id)` and `deleteInboxMessage(id)`. New types: `InboxState`, `InboxMessage`, `InboxStateSubscription`, `InboxUnreadCountSubscription`, `AttentiveInboxViewProps`. There's no on-demand refresh yet. (MSDK-562)

### Native SDKs and requirements

- **iOS:** `ATTNSDKFramework` 2.1.1 → **2.2.0**. The minimum iOS deployment target is still 15.0.
- **Android:** `attentive-android-sdk` 2.3.0 → **2.3.4**. Its dependencies are unchanged, so the `compileSdk` 35 floor still applies. 2.3.4 bundles the inbox's swipe icons, so the inbox also works in apps on Compose BOM 2025.11.01 or newer (material3 1.4+).

# [2.2.0](https://github.com/attentive-mobile/attentive-react-native-sdk/compare/2.1.0...2.2.0) (2026-10-02)


### ⚠ Upgrade notes

- **iOS deployment target is now 15.0** (was 14.0), required by `ATTNSDKFramework` 2.1.x. Apps targeting iOS 14 fail `pod install` after upgrading. Raise `platform :ios` in your `Podfile` to `'15.0'` or higher (Expo: set `ios.deploymentTarget` via `expo-build-properties`). React Native 0.76+ templates already default to 15.1.

### Features

- **Tracking consent on marketing opt-in.** `optInMarketingSubscription` accepts an optional `trackingConsent` (`'ACCEPTED' | 'DECLINED' | 'UNSPECIFIED'`), forwarded to the native SDKs. New types: `OptInMarketingSubscriptionParams`, `TrackingConsent`. (MSDK-515)
- **Creative lifecycle events.** `addCreativeEventListener(listener)` reports `opened`, `closed`, `notOpened` and `notClosed`, with an optional `creativeId`. Call `remove()` on the returned subscription to stop listening. New types: `CreativeEvent`, `CreativeStatus`, `CreativeEventSubscription`.
- **`pushEnabled` initialization flag (iOS).** `AttentiveSdkConfiguration.pushEnabled` (default `true`). When `false`, the iOS SDK skips push token registration, push app-launch events and notification handling. On Android, set `AttentiveConfig.Builder().pushEnabled(...)` in `Application.onCreate()`.
- **Expo config plugin (Android).** Apps using Expo Continuous Native Generation can add `@attentive-mobile/attentive-react-native-sdk` to `plugins` in `app.json`, and `npx expo prebuild` injects the Android native initialization into `MainApplication`. See the README. (MSDK-404)

### Native SDKs and requirements

- **iOS:** `ATTNSDKFramework` 2.0.15 → **2.1.1**. Minimum iOS deployment target **15.0** (see Upgrade notes).
- **Android:** `attentive-android-sdk` 2.1.9 → **2.3.0**. Host apps must compile with **`compileSdk` 35** or higher. This is not new: 2.1.0's dependencies (`androidx.activity` 1.10.1, Compose UI 1.8.2) already required it, and `attentive-android-sdk` 2.3.0 now declares it directly.
