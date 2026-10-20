

# [2.3.0](https://github.com/attentive-mobile/attentive-react-native-sdk/compare/2.2.0...2.3.0) (2026-10-20)


### Features

* **expo:** add the automaticallyOpensInboxDeepLinks plugin option (MSDK-550) ([204c57e](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/204c57e7176a30fb2678932ed7059edaf761bf0d))
* **inbox:** add inboxBackgroundColor and apply all colours on iOS (MSDK-481) ([50dc8a9](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/50dc8a99ec130e087dcdee6788ded009944024be))
* **inbox:** bridge markRead / markUnread to JS (MSDK-551) ([274747b](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/274747bf324eaada8df5bff1fe6a684bdfb8e77c))
* **inbox:** bridge the inbox state, load more, delete and click for custom UIs (MSDK-562) ([2829123](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/28291232d2bde571dc26b5b44ad366122cfae2dd))
* **inbox:** emit onMessageTap on iOS and gate SDK deep links on config ([590ab88](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/590ab883afba0350e67dfb6e6297e4cccc152a76)), closes [attentive-android-sdk#277](https://github.com/attentive-android-sdk/issues/277)
* **inbox:** route inbox message taps to JS as onMessageTap ([90043f9](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/90043f94d020e6026324b26939b8f0440059a6dc))


### Reverts

* Revert "chore(inbox): remove inbox from main until the native SDKs ship it" ([4e7ad05](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/4e7ad050b2ff378e823337dd19cdec8cfe8b582b))

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