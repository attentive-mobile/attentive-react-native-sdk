# ExpoTestSDK54 — Attentive SDK Demo

A minimal Expo SDK 54 application demonstrating the integration of the
`@attentive-mobile/attentive-react-native-sdk` v2.0.0-beta.8 with the latest
Expo / React Native toolchain.

| Component | Version |
|-----------|---------|
| Expo SDK | 54.0.27 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| Attentive SDK | 2.0.0-beta.8 |
| New Architecture | Enabled (default) |

> **See also:** [`ANALYSIS.md`](./ANALYSIS.md) for the full compatibility
> report and [`CUSTOMER_ACTION_PLAN.md`](./CUSTOMER_ACTION_PLAN.md) for the
> options matrix.

---

## What this demo covers

`App.tsx` exercises the four most commonly used SDK entry points:

- **`initialize`** — bootstraps the SDK on component mount
- **`identify`** — associates the current session with a known user
- **`triggerCreative`** — displays an Attentive creative overlay
- **`recordProductViewEvent`** — fires a product-view analytics event
- **`clearUser`** — resets the current user session

---

## Prerequisites

Ensure the following tools are available before proceeding.

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 20 LTS | `node --version` |
| npm | 10 | bundled with Node 20 |
| Expo CLI | latest | `npm i -g expo-cli` or use `npx expo` |
| Xcode | 16+ (17 recommended) | macOS only, for iOS |
| CocoaPods | 1.15+ | `gem install cocoapods` |
| Android Studio | Meerkat (2024.3+) | for Android |
| Java (JDK) | 17 | Gradle 8.x requires JDK 17 |

---

## 1 — Install dependencies

Run this from the `ExpoTestSDK54/` directory:

```bash
npm install
```

> **Note:** You will see the following deprecation warning — it is harmless and
> does not block the build:
>
> ```
> npm warn deprecated metro-react-native-babel-preset@0.77.0:
>   Use @react-native/babel-preset instead
> ```
>
> This warning originates from the Attentive SDK's `package.json`. No action is
> needed on your side; the SDK team tracks it in [SDK_TEAM_ACTION_PLAN.md §
> Priority 3b](./SDK_TEAM_ACTION_PLAN.md).

---

## 2 — Generate native projects (prebuild)

The `ios/` and `android/` directories are listed in `.gitignore` and are
**not tracked** in this repository. You must generate them before any native
build by running:

```bash
npx expo prebuild
```

> **Warning:** Adding `--clean` will wipe any manual edits inside `ios/` and
> `android/` and regenerate them from scratch. After every clean prebuild you
> **must** re-apply the `ios.buildReactNativeFromSource` fix described in
> § 3.1 before running `pod install`.

---

## 3 — iOS setup

### 3.1 — Apply the required iOS workaround (BLOCKING issue)

> **Issue:** `pod install` fails by default with Expo SDK 54 / RN 0.81.
>
> **Error:**
> ```
> [!] Unable to find a specification for `RCT-Folly`
>       depended upon by `attentive-react-native-sdk`
> ```
>
> **Root cause:** React Native 0.81 defaults to **prebuilt binaries**. In this
> mode, internal RN pods (`RCT-Folly`, `React-Codegen`, `ReactCommon/…`) are
> bundled into a single `ReactNativeDependencies` pod and are no longer
> available as standalone CocoaPods specs. The Attentive SDK's podspec still
> declares `RCT-Folly` as an explicit dependency, which cannot be resolved.
>
> **Permanent fix:** Will be shipped by the Attentive SDK team in a future
> release (see [SDK_TEAM_ACTION_PLAN.md § Priority 1](./SDK_TEAM_ACTION_PLAN.md)).

**Workaround — disable prebuilt mode for iOS:**

Open `ios/Podfile.properties.json` and add the `ios.buildReactNativeFromSource`
key:

```json
{
  "expo.jsEngine": "hermes",
  "EX_DEV_CLIENT_NETWORK_INSPECTOR": "true",
  "newArchEnabled": "true",
  "ios.buildReactNativeFromSource": "true"
}
```

This single flag tells the Expo Podfile to compile React Native from source
instead of using prebuilt binaries, making all individual pods available again.

> **Trade-off:** The first `pod install` after adding this flag will take
> significantly longer (~3–5 minutes instead of ~30 seconds) because React
> Native is compiled from source. Subsequent incremental builds are unaffected.

### 3.2 — Install CocoaPods

```bash
cd ios
pod install
cd ..
```

You will see the following warning during `pod install` — it is non-blocking:

```
[!] attentive-ios-sdk has been deprecated in favor of ATTNSDKFramework
```

The SDK still builds and links correctly with the deprecated pod. Migration to
`ATTNSDKFramework` is tracked in the SDK team's backlog
([SDK_TEAM_ACTION_PLAN.md § Priority 3a](./SDK_TEAM_ACTION_PLAN.md)).

A successful install ends with output similar to:

```
Pod installation complete! There are 82 dependencies from the Podfile
and they can be found in the Pods folder.
```

### 3.3 — Run on iOS

```bash
npx expo run:ios
```

Or open `ios/ExpoTestSDK54.xcworkspace` directly in Xcode and press **Run**.

> **Simulator vs device:** The SDK initializes and fires events on both. For
> creative rendering (the `triggerCreative` call), a physical device is
> recommended since the WKWebView creative overlay may behave differently in
> the iOS Simulator.

---

## 4 — Android setup

Android requires **no workarounds** with this stack. The Expo / RN Gradle
plugin automatically overrides the SDK's legacy build configuration.

### 4.1 — Configure Android SDK path

Ensure your `ANDROID_HOME` environment variable points to your Android SDK
installation, or set it in `~/.bash_profile` / `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 4.2 — Start an emulator or connect a device

From Android Studio open **Device Manager** and start an emulator with API 34
or higher, or connect a physical device with USB debugging enabled.

Verify connectivity:

```bash
adb devices
```

### 4.3 — Run on Android

```bash
npx expo run:android
```

> **Note:** The first Gradle build fetches all dependencies and may take
> 3–5 minutes. Subsequent builds are incremental and much faster.

You will see several deprecation warnings in the Gradle output (e.g.
`compileSdkVersion` → `compileSdk`, `lintOptions` → `lint`). These originate
from the Attentive SDK's `android/build.gradle` and are non-blocking. They will
be resolved in a future SDK release
([SDK_TEAM_ACTION_PLAN.md § Priority 2](./SDK_TEAM_ACTION_PLAN.md)).

A successful Android build ends with:

```
BUILD SUCCESSFUL in Xs
```

---

## 5 — Running the Expo development server (optional)

If you prefer to use the Metro bundler directly (e.g. for fast refresh without
a full native rebuild):

```bash
npx expo start
```

Then press **i** to open the iOS Simulator or **a** to open the Android
emulator from the Expo CLI menu.

> This requires the native project to already be installed on the target device
> or emulator (steps 3 and 4 above must have been completed at least once).

---

## 6 — Verifying the integration

Once the app is running you should see:

1. **SDK Status: Initialized** — confirms `initialize()` returned without
   throwing. Check the native logs if this shows "Not Initialized".
2. **Identify User** — fires an identify call with a test phone, email, and
   client user ID.
3. **Trigger Creative** — opens a WKWebView (iOS) / WebView (Android) overlay
   with the configured Attentive creative.
4. **Record Product View** — sends a product-view event (SKU-001, $29.99 USD).
5. **Clear User** — resets the current user context.

To inspect native SDK logs on iOS:

```bash
# In a separate terminal while the app is running
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.attentive"'
```

To inspect on Android:

```bash
adb logcat -s AttentiveSDK
```

---

## 7 — Known issues and solutions summary

| # | Severity | Platform | Symptom | Solution |
|---|----------|----------|---------|----------|
| 1 | **BLOCKING** | iOS | `pod install` fails: `RCT-Folly` not found | Add `"ios.buildReactNativeFromSource": "true"` to `ios/Podfile.properties.json` (§ 3.1 above) |
| 2 | Warning | iOS | `attentive-ios-sdk has been deprecated` | Non-blocking. SDK team will migrate to `ATTNSDKFramework` in a future release |
| 3 | Warning | All | `npm warn deprecated metro-react-native-babel-preset` | Non-blocking. SDK team will migrate to `@react-native/babel-preset` |
| 4 | Warning | Android | Gradle deprecation warnings (`compileSdkVersion`, `lintOptions`, etc.) | Non-blocking until Gradle/AGP 9.0. SDK team tracking modernization |

---

## 8 — Project structure

```
ExpoTestSDK54/
├── App.tsx                     # Main app — SDK initialization + UI
├── index.ts                    # Expo entry point (registerRootComponent)
├── app.json                    # Expo config (newArchEnabled: true)
├── package.json                # Dependencies
├── tsconfig.json
├── .gitignore                  # ios/ and android/ are intentionally ignored
│
│   # Generated by `npx expo prebuild` — not committed to git
├── ios/
│   ├── Podfile
│   ├── Podfile.properties.json # ← Add ios.buildReactNativeFromSource here
│   └── ExpoTestSDK54.xcworkspace
├── android/
│   └── ...
│
├── ANALYSIS.md                 # Full compatibility analysis
├── CUSTOMER_ACTION_PLAN.md     # Integration options for customers
└── SDK_TEAM_ACTION_PLAN.md     # Fixes required from the SDK team
```

---

## 9 — Frequently asked questions

**Q: Do I need to run `npx expo prebuild` every time?**  
No. Only run prebuild when you change `app.json`, add a new native module, or
need to regenerate the native projects. For regular JS/TS changes, `npx expo
start` with fast refresh is sufficient.

**Q: Can I use Expo Go instead of a native build?**  
No. The Attentive SDK ships native modules (TurboModule on the new architecture)
that are not available in the Expo Go sandbox. You must use a custom development
build (`npx expo run:ios` / `npx expo run:android`).

**Q: Why is the iOS build so slow?**  
Because `ios.buildReactNativeFromSource: true` compiles React Native from
source (~82 pods). This is the required workaround until the Attentive SDK
podspec is updated to remove the standalone `RCT-Folly` dependency. Once the
SDK is updated, you can remove that flag to regain prebuilt performance.

**Q: Can I disable the New Architecture?**  
You can set `"newArchEnabled": false` in `app.json`, but the Attentive SDK
v2.x is built for the New Architecture. Disabling it may work but is untested
and unsupported.

**Q: The app builds but the creative does not appear — what should I check?**  
1. Verify the `attentiveDomain` in `App.tsx` matches your Attentive account
   domain.
2. In `debug` mode, the SDK logs additional output — check the native console.
3. Ensure your device/emulator has internet access.
4. Check that no content blocker or ad blocker is active on the device.
