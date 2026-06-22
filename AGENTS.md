# Attentive React Native SDK — Agent Integration Guide

This file is for AI coding agents (Claude Code, Cursor, Copilot, Codex, etc.) integrating the **Attentive React Native SDK** into a host React Native app. It is an alternative to reading the full `README.md` — it tells you exactly what to inspect in the client's codebase and what to write.

If you are an agent and the user has asked you to "set up Attentive", "integrate the Attentive SDK", or similar, follow this guide top-to-bottom. Do not add features beyond the base case unless explicitly asked.

---

## Scope

This guide covers **base integration only**:

1. Install the npm package.
2. **iOS** — run `pod install` and initialize the SDK from TypeScript (`initialize(config)`).
3. **Android** — initialize the SDK in **native** Kotlin/Java code inside `MainApplication.onCreate()`.
4. Verify the app builds on both platforms.

Do **not**, in this pass:

- Add `identify` / `clearUser` calls (the user will wire those at their own login/logout sites)
- Add event recording (`recordPurchaseEvent`, `recordAddToCartEvent`, `recordProductViewEvent`, `recordCustomEvent`)
- Add Creative rendering (`triggerCreative` / `destroyCreative`)
- Add marketing subscription calls (`optInMarketingSubscription` / `optOutMarketingSubscription`)
- Do **any** push-notification setup (no manifest changes, no `AppDelegate` push handlers, no FCM/`google-services.json`, no `@react-native-community/push-notification-ios`)

If the user asks for more after the base case is working, refer them to `README.md` in the SDK repo. Step 5 emits the exact links.

---

## The one thing to get right: initialization differs per platform

This SDK does **not** initialize the same way on both platforms. This is the most common integration mistake — read it before writing any code.

- **iOS is initialized from TypeScript.** Calling `initialize(config)` forwards to the native iOS SDK.
- **Android is NOT initialized from TypeScript.** On Android the TypeScript `initialize()` is an intentional **no-op** (it only wires the debug helper). The Android SDK **must** be initialized in native Kotlin/Java code in your `Application.onCreate()` via `AttentiveSdk.initialize(...)`. If you skip this, Android events fail silently.

You will do **both** (Step 3a for iOS, Step 3b for Android). Calling `initialize(config)` from TypeScript unconditionally is fine — it is harmless on Android.

---

## Inputs you must collect from the user before writing code

1. **Attentive domain** — a short string identifying their Attentive account (e.g. `myshop`). Ask:

   > "Do you know your Attentive domain? It's the short identifier for your account (e.g. `myshop`)."

   - If the user says **yes**, follow up with: "What is it?" Wait for their answer and use that exact string. Do not proceed until they've given you the domain.
   - If the user says **no** (or doesn't know), insert `"YOUR_ATTENTIVE_DOMAIN"` as a placeholder and tell them to replace it before shipping.

Do not invent a domain. Always initialize in `'debug'` mode for first-time integration; tell the user to switch to `'production'` for release builds.

---

## Step 1 — Inspect the client codebase

Before editing anything, determine:

1. **Is this a React Native app?** Confirm `react-native` is in the host `package.json` dependencies. The SDK requires **React Native >= 0.74**, Node >= 18, and (for iOS) Ruby >= 3.3 / CocoaPods ~> 1.16 / Xcode >= 15. For Android: Android SDK API 24+ and JDK 17.
2. **Bare React Native or Expo?** This SDK ships native modules, so it is **not compatible with Expo Go**. A plain (bare) React Native app is fine. An Expo app must use a development build / config plugin prebuild (i.e. it must have `ios/` and `android/` native directories). If the project is Expo *managed* with no native projects and the user won't prebuild, **stop and tell the user** — you cannot complete the native steps without the native projects.
3. **Package manager**: detect from the lockfile (`package-lock.json` → npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm). Use the matching install command.
4. **iOS project**: confirm an `ios/` directory with a `Podfile` (and a `Podfile` referencing `use_native_modules!` / autolinking, which RN apps have by default).
5. **Android project**: locate the host `MainApplication` file — `android/app/src/main/java/<package-path>/MainApplication.kt` (or `.java`). Note whether it's **Kotlin or Java** and match it. Locate `AndroidManifest.xml` too (not edited in the base case).
6. **Architecture**: the SDK is autolinked and works on both the New Architecture (TurboModule) and the old architecture (it falls back automatically). **Do not** toggle the New Architecture flag or bump the host's React Native version.

---

## Step 2 — Install the package

### 2a. Install via the host's package manager

Unlike a pinned native dependency, npm installs the latest published version by default — you do **not** need to look up a version number.

```bash
# npm
npm install @attentive-mobile/attentive-react-native-sdk

# yarn
yarn add @attentive-mobile/attentive-react-native-sdk

# pnpm
pnpm add @attentive-mobile/attentive-react-native-sdk
```

If the user needs a specific version, append `@<version>` — otherwise let it resolve to latest.

### 2b. iOS — install pods

The native module is autolinked; you do **not** edit the `Podfile` by hand. From the host app root:

```bash
cd ios && bundle exec pod install   # if the project uses Bundler (a Gemfile is present)
# or
npx pod-install
```

### 2c. Rebuild required

This adds native code, so a Metro reload is not enough — the app must be rebuilt (Step 4). Do not move on to Step 3 thinking a JS-only refresh will pick it up.

---

## Step 3 — Initialize the SDK (do BOTH 3a and 3b)

### 3a. iOS — initialize from TypeScript

In the app's root component (e.g. `App.tsx`), initialize once at startup inside a `useEffect`. Match the host's existing import style.

```typescript
import { useEffect } from 'react'
import {
  initialize,
  type AttentiveSdkConfiguration,
} from '@attentive-mobile/attentive-react-native-sdk'

function App() {
  useEffect(() => {
    const config: AttentiveSdkConfiguration = {
      attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
      mode: 'debug', // switch to 'production' for release builds
    }
    initialize(config)
  }, [])

  // ...rest of the app
}
```

If the host already has a root `useEffect` for app startup, add `initialize(config)` there rather than introducing a second effect. Place it as early as possible in the startup path. This call is a no-op on Android (see 3b), so it does not need to be guarded with `Platform.OS === 'ios'`.

### 3b. Android — initialize in native code (REQUIRED)

On Android the SDK must be initialized in `Application.onCreate()`, **not** from TypeScript. Two reasons:

1. The SDK registers lifecycle observers (e.g. `AppLaunchTracker` on the `ProcessLifecycleOwner`) that must be in place **before** the React Native bridge is ready, or early app-launch events are missed.
2. `lifecycle.addObserver()` must run on the main thread; `Application.onCreate()` is guaranteed by Android to run on the main thread, so no threading wrapper is needed.

Every React Native app has a `MainApplication` class — edit the existing one. Add the init **after** `super.onCreate()` (and after any logging/crash-reporter init the app already has). Match the file's language.

**Kotlin (`MainApplication.kt`):**

```kotlin
import com.attentive.androidsdk.AttentiveConfig
import com.attentive.androidsdk.AttentiveSdk

class MainApplication : Application(), ReactApplication {

  override fun onCreate() {
    super.onCreate()
    // ...existing SoLoader / New Architecture / other setup stays here...

    val config = AttentiveConfig.Builder()
      .applicationContext(this)
      .domain("YOUR_ATTENTIVE_DOMAIN")
      .mode(AttentiveConfig.Mode.DEBUG) // Mode.PRODUCTION for release builds
      .build()

    // Application.onCreate() runs on the main thread, which the SDK requires.
    AttentiveSdk.initialize(config)
  }
}
```

**Java (`MainApplication.java`):**

```java
import com.attentive.androidsdk.AttentiveConfig;
import com.attentive.androidsdk.AttentiveSdk;

@Override
public void onCreate() {
  super.onCreate();
  // ...existing setup stays here...

  AttentiveConfig config = new AttentiveConfig.Builder()
      .applicationContext(this)
      .domain("YOUR_ATTENTIVE_DOMAIN")
      .mode(AttentiveConfig.Mode.DEBUG) // Mode.PRODUCTION for release builds
      .build();

  AttentiveSdk.initialize(config);
}
```

> Do **not** call `AttentiveSdk.initialize()` from a background thread or a non-main coroutine dispatcher — AndroidX will throw an `IllegalStateException`. `onCreate()` is correct.
>
> The `notificationIconId(...)` / `skipFatigueOnCreatives(...)` / `logLevel(...)` builder options are not needed for base integration — `notificationIconId` is push-related. Leave them out for now.

---

## Step 4 — Verify the build

Build the app on each platform the user targets. A passing build is the verification — do not run the app on a device/simulator unless asked.

**iOS:**

```bash
npx react-native run-ios   # or build in Xcode (⌘B)
```

- If you see the linking error `The package 'attentive-react-native-sdk' doesn't seem to be linked`, it means `pod install` didn't run or the app wasn't rebuilt (or it's running under Expo Go). Re-run Step 2b and rebuild.

**Android:**

```bash
npx react-native run-android   # or build in Android Studio
```

- Confirm the native init ran and there are no warnings like `recordX failed — SDK may not be initialized` in logcat:

  ```bash
  adb logcat | grep -i attentive
  ```

  If you see that warning, the `AttentiveSdk.initialize()` call from Step 3b is missing or didn't run before an event fired — re-check `MainApplication.onCreate()`.

---

## Step 5 — Hand off

1. Tell the user:
   - Replace `"YOUR_ATTENTIVE_DOMAIN"` with their real domain in **both** places (TypeScript config and `MainApplication`) if a placeholder was used.
   - Switch `'debug'` / `Mode.DEBUG` to `'production'` / `Mode.PRODUCTION` for release builds.

2. Then **emit the following block to the user, verbatim**, including every `[text](url)` link exactly as written. Do not rewrite, summarize, paraphrase, drop URLs, or convert links to plain titles. The user's terminal renders Markdown; without the `(url)` part, the links are dead.

   ```
   The base integration is in. For everything this guide intentionally skipped, see the [SDK README](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md):

   - [Identify the current user](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#identify-the-current-user) — call at login or whenever you learn the user's email, phone, `clientUserId`, Shopify ID, Klaviyo ID, or custom identifiers.
   - [Record user events](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#record-user-events) — `recordPurchaseEvent`, `recordAddToCartEvent`, `recordProductViewEvent`, `recordCustomEvent`, plus the `Item` / `Purchase` / `ProductView` / `AddToCart` types.
   - [Show a Creative](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#load-the-creative) and [destroy it](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#destroy-the-creative) — in-app messages rendered over your app.
   - [Push notifications (iOS & Android)](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#push-notifications-ios-and-android) and [App events on Android](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#app-events-on-android) — the iOS `AppDelegate` hook, Android manifest/FCM setup, and token registration.
   - [Debugging features](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md#debugging-features) — `enableDebugger`, debug overlays, and log export.
   - `clearUser`, `updateDomain`, and marketing subscription helpers (`optInMarketingSubscription` / `optOutMarketingSubscription`) are exported from the package — see the API surface in [src/index.tsx](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/src/index.tsx) and the types in [src/eventTypes.tsx](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/src/eventTypes.tsx).
   ```

Do not run the app on a device or simulator unless asked.

---

## Things NOT to do

- Do not add `identify()`, `clearUser()`, any `recordXEvent()`, `triggerCreative()`/`destroyCreative()`, or marketing-subscription calls.
- Do not do any push setup — no `POST_NOTIFICATIONS` in the manifest, no `MainActivity.onNewIntent` override, no `AppDelegate` push handlers, no FCM / `google-services.json`, no `@react-native-community/push-notification-ios`.
- Do not call `AttentiveSdk.initialize()` outside `Application.onCreate()` or on a background thread.
- Do not try to initialize Android from TypeScript — the JS `initialize()` is a no-op there.
- Do not toggle the New Architecture, or bump the host's React Native, Gradle, AGP, Kotlin, or CocoaPods versions.
- Do not introduce state-management or DI libraries to wire initialization — a plain call in `useEffect` (iOS) and `onCreate` (Android) is correct.
- Do not write tests for the integration unless asked.

---

## Reference

- Full documentation: https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/README.md
- Sample app: `Bonni/` in the SDK repo — a working reference integration for both platforms.
- Push notification guides: `docs/PUSH_NOTIFICATIONS_INTEGRATION.md` and `docs/PUSH_NOTIFICATIONS_SETUP.md`.

### What this guide intentionally skipped

The base-integration guide does not wire up identify/clearUser, event recording, Creatives, marketing subscriptions, runtime domain changes, or any push setup. Step 5 already emits the linked README pointers for these to the user — see that step for the canonical block.
