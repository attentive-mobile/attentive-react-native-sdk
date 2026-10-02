

# [2.2.0](https://github.com/attentive-mobile/attentive-react-native-sdk/compare/2.1.0...2.2.0) (2026-10-02)


### Features

- **Tracking consent on marketing opt-in.** `optInMarketingSubscription` accepts an optional `trackingConsent` (`'ACCEPTED' | 'DECLINED' | 'UNSPECIFIED'`), forwarded to the native SDKs. New types: `OptInMarketingSubscriptionParams`, `TrackingConsent`. (MSDK-515)
- **Creative lifecycle events.** `addCreativeEventListener(listener)` reports `opened`, `closed`, `notOpened` and `notClosed`, with an optional `creativeId`. Call `remove()` on the returned subscription to stop listening. New types: `CreativeEvent`, `CreativeStatus`, `CreativeEventSubscription`.
- **`pushEnabled` initialization flag (iOS).** `AttentiveSdkConfiguration.pushEnabled` (default `true`). When `false`, the iOS SDK skips push token registration, push app-launch events and notification handling. On Android, set `AttentiveConfig.Builder().pushEnabled(...)` in `Application.onCreate()`.
- **Expo config plugin (Android).** Apps using Expo Continuous Native Generation can add `@attentive-mobile/attentive-react-native-sdk` to `plugins` in `app.json`, and `npx expo prebuild` injects the Android native initialization into `MainApplication`. See the README. (MSDK-404)

### Native SDKs and requirements

- **iOS:** `ATTNSDKFramework` 2.0.15 → **2.1.1**. The minimum iOS deployment target is now **15.0** (was 14.0), matching ATTNSDKFramework 2.1.x.
- **Android:** `attentive-android-sdk` 2.1.9 → **2.3.0**. Host apps must compile with **`compileSdk` 35** or higher (was 34).
