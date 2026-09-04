# attentive-react-native-sdk

# Attentive React Native SDK

The Attentive React Native SDK provides the functionality to render Attentive creative units and collect Attentive events in React Native mobile applications.

## Package Manager

This project uses **npm** as the preferred package manager for consistency and alignment with modern React Native best practices. While this library will work with any package manager (npm, yarn, or pnpm), the development scripts are configured to use npm.

**Note on package managers:** Modern npm (v7+) has significantly improved performance and features, making it the recommended choice for React Native projects. Both npm and yarn work well with React Native, but this project standardizes on npm for development workflows.

## Requirements

| Tool         | Version   |
| ------------ | --------- |
| Node.js      | >= 18.0.0 |
| React Native | >= 0.74   |
| Ruby         | >= 3.3    |
| CocoaPods    | ~> 1.16   |
| Xcode        | >= 15     |
| Android SDK  | API 24+   |
| Android `compileSdk` | 35 |
| JDK          | 17        |

> **Android `compileSdk` 35.** Set `compileSdkVersion` (or `android.compileSdk`) to at least 35 in
> your app. The native Attentive Android SDK and its dependencies declare `minCompileSdk=35` in
> their AAR metadata, so a lower value fails the build with
> `Dependency '…' requires libraries and applications that depend on it to compile against version
> 35 or later of the Android APIs`. Releases before the inbox built against 34.

## Installation

Run `npm install @attentive-mobile/attentive-react-native-sdk` from your app's root directory.

## Setup with an AI coding agent

> [!WARNING]
> **Experimental.** Agent-assisted setup is a new, experimental feature. The [`AGENTS.md`](./AGENTS.md) guide and this flow may change, and results can vary by agent and project. Review whatever the agent changes before committing, and fall back to the manual steps below if anything looks off.

If you use Claude Code, Cursor, Copilot, Codex, or another AI coding agent, you can have the agent walk you through setup. Point it at [`AGENTS.md`](./AGENTS.md) in this repo — it's a step-by-step integration guide written for agents that handles the npm install, iOS `pod install` + TypeScript `initialize()`, and the **native** Android initialization in `MainApplication.onCreate()`.

**To trigger the flow**, open your project in your agent of choice and paste:

> Integrate the Attentive React Native SDK into this app. Follow the guide at https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/AGENTS.md top-to-bottom and ask me any questions it tells you to ask before writing code.

The agent flow intentionally stops at base integration. It does **not** wire up identify/clearUser, event recording, Creatives, marketing subscriptions, or push notifications — see the sections below for those.

## Usage

See the [Bonni example app](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/Bonni)
for a sample of how the Attentive React Native SDK is used.

__*** NOTE: Please refrain from using any private or undocumented classes or methods as they may change between releases. ***__

### Import the SDK

```typescript
import {
  initialize,
  identify,
  triggerCreative,
  recordPurchaseEvent /* ... */,
} from '@attentive-mobile/attentive-react-native-sdk'
```

### Create the AttentiveConfig

```typescript
// Create an AttentiveSdkConfiguration with your attentive domain, in production mode
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'production',
}
```

```typescript
// Alternatively, use "debug" mode. When in debug mode, the Creative will not be shown, but instead a popup will show with debug information about your creative and any reason the Creative wouldn't show.
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'debug',
}
```

### Debugging Features

The SDK includes debugging helpers to show what data is being sent and received. Enable debugging by setting `enableDebugger: true`:

```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'debug',
  enableDebugger: true, // Shows debug overlays for events and creatives
}
```

When enabled, debug overlays will automatically appear when:

- Creatives are triggered
- Events are recorded (product views, purchases, etc.)

You can also manually invoke the debug helper:

```typescript
invokeAttentiveDebugHelper()
```

See [DEBUGGING.md](./DEBUGGING.md) for detailed information about debugging features.

### Initialize the SDK

> **Platform difference:** iOS and Android have different initialization requirements.

#### iOS — Initialize from TypeScript

On iOS, call `initialize` from TypeScript as early as possible (e.g. the root `App` component's `useEffect`):

```typescript
// Called once per app session, before any other SDK operations.
initialize(config)
```

#### Android — Initialize from Native Code

On Android, `AttentiveSdk.initialize()` **must** be called from your `Application.onCreate()` in native Kotlin/Java code. There are two reasons for this:

1. **Lifecycle observers must be registered before the React Native bridge is ready.** Internally, the SDK creates an `AppLaunchTracker` that calls `lifecycle.addObserver()` on the `ProcessLifecycleOwner`. If initialization happens after the bridge starts, early app-launch events can be missed.
2. **`lifecycle.addObserver()` requires the main thread.** AndroidX enforces this with an `IllegalStateException` if called from a background thread. `Application.onCreate()` is guaranteed by the Android system to run on the main thread, so calling `initialize` there satisfies this requirement automatically — no extra threading machinery needed.

> **Do not** call `AttentiveSdk.initialize()` from a background thread or a coroutine dispatcher other than `Dispatchers.Main`. Doing so will throw an `IllegalStateException` from inside the AndroidX Lifecycle library.

> **Expo app using prebuild / CNG?** Do not edit `MainApplication` by hand — `npx expo prebuild` regenerates it and your edits are lost. Use the SDK's [Expo config plugin](#expo-apps--config-plugin-android) instead; it injects this initialization automatically on every prebuild.

Add the following to your `MainApplication.kt` (or `MainApplication.java`):

```kotlin
import android.app.Application
import com.attentive.androidsdk.AttentiveConfig
import com.attentive.androidsdk.AttentiveSdk
import com.attentive.androidsdk.AttentiveLogLevel

class MainApplication : Application(), ReactApplication {

    override fun onCreate() {
        super.onCreate()
        // ... your existing setup ...
        initAttentiveSDK()
    }

    private fun initAttentiveSDK() {
        val config = AttentiveConfig.Builder()
            .applicationContext(this)
            .domain("YOUR_ATTENTIVE_DOMAIN")
            .mode(AttentiveConfig.Mode.PRODUCTION) // or Mode.DEBUG for testing
            .notificationIconId(R.drawable.ic_stat_notification)
            .skipFatigueOnCreatives(false)
            .logLevel(AttentiveLogLevel.VERBOSE)
            .build()

        // Application.onCreate() is always called on the main thread by the Android system,
        // so no thread-switching wrapper is needed here.
        AttentiveSdk.initialize(config)
    }
}
```

##### Android notification small icon

Android requires push notifications to use a small status-bar icon. If `notificationIconId` is not set, the Attentive Android SDK uses its default fallback icon. To use your app's branding, add a notification small icon resource to your host app and pass its resource ID during native initialization.

Add the icon to your Android app's drawable resources:

```text
android/app/src/main/res/drawable/ic_stat_notification.png
```

Use a white-only transparent PNG designed for Android notification status bars. Do not use the full-color launcher icon from `mipmap-*`, because Android masks small notification icons and it can render poorly.

Then add the icon to your existing `AttentiveConfig.Builder()` chain in `MainApplication.kt` before `build()`:

```text
android/app/src/main/java/<your-package>/MainApplication.kt
```

```kotlin
.notificationIconId(R.drawable.ic_stat_notification)
```

`MainApplication.kt` is host-app code, not generated by this SDK at runtime. If `R.drawable.ic_stat_notification` does not resolve, confirm the drawable file name matches exactly and that you are referencing your app module's `R` class.

After the native initialization, all other SDK operations (`identify`, `recordAddToCartEvent`, `recordPurchaseEvent`, etc.) are called from TypeScript as normal on both platforms.

> **Tip:** If you see `[AttentiveSDK] recordAddToCartEvent failed — SDK may not be initialized` in your Android logcat, it means `AttentiveSdk.initialize()` was not called from native code before the event was recorded. Check your `Application.onCreate()` setup.

#### Expo apps — Config plugin (Android)

If your app uses Expo with [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) (`npx expo prebuild`), the `android/` directory is a build artifact regenerated from a template — the manual `MainApplication` edit above would be wiped on every prebuild. This package ships an Expo config plugin that injects the required Android initialization for you, on every regeneration.

Add the plugin to your `app.json` (or `app.config.js`):

```json
{
  "expo": {
    "plugins": [
      [
        "@attentive-mobile/attentive-react-native-sdk",
        { "domain": "YOUR_ATTENTIVE_DOMAIN", "mode": "production" }
      ]
    ]
  }
}
```

Then regenerate the native project (or let the next `npx expo run:android` / EAS build do it):

```bash
npx expo prebuild --platform android
```

The plugin adds the `AttentiveConfig` + `AttentiveSdk.initialize(...)` call shown above to the generated `MainApplication.kt`, right after `super.onCreate()`, inside tagged `@generated` blocks it manages across re-runs (re-running prebuild never duplicates them; changing the plugin options updates them in place).

**Plugin options:**

| Option   | Type                      | Description                                                                                |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| `domain` | `string`                  | Your Attentive domain (required).                                                          |
| `mode`   | `'debug' \| 'production'` | Native SDK mode. Use `debug` while testing creatives. Optional — defaults to `production`. |

**Notes:**

- **Requires Expo SDK 50+** (Kotlin `MainApplication` templates). On older SDKs the plugin fails prebuild with an explicit error rather than generating broken code.
- **iOS is untouched by the plugin.** iOS still initializes from TypeScript — the [`initialize()` call](#ios--initialize-from-typescript) is required either way.
- The debug overlay (`enableDebugger`, see [Debugging Features](#debugging-features)) is wired only by the TypeScript `initialize()` call. The plugin's `mode: 'debug'` sets the _native_ SDK mode (creative debug view, verbose native logging) — a different switch.
- If your `MainApplication` already contains a manual Attentive integration, the plugin leaves the file alone and prints a warning during prebuild — remove the manual code to let the plugin manage initialization.
- Builder options beyond `domain`/`mode` (`notificationIconId`, `skipFatigueOnCreatives`, `logLevel`) are not yet exposed as plugin props.
- Bare React Native apps (no prebuild) should not use the plugin — follow the manual instructions above.

#### Disabling push at initialization (`pushEnabled`)

The SDK accepts an initialization-time `pushEnabled` flag (default: `true`). When `false`, the SDK's push functionality is disabled: it will not register push tokens, send push-related app-launch events, or handle incoming push notifications. Marketing subscription opt-in / opt-out calls remain functional.

The flag follows each platform's initialization path:

**iOS** — set the optional `pushEnabled` field on the TypeScript configuration:

```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'YOUR_ATTENTIVE_DOMAIN',
  mode: 'production',
  pushEnabled: false, // optional; defaults to true
}
```

**Android** — because initialization is native (see above), the TypeScript field has no effect. Set the flag on the config builder in `MainApplication.kt` instead:

```kotlin
.pushEnabled(false)
```

The value is fixed at initialization and cannot be changed at runtime — applying a new value requires an app restart.

### Identify the current user

Use `identify` to **add or enrich** information about the **current** user. As you gather identifiers (client user ID, email, phone, etc.), pass them to Attentive via `identify`. Each identifier is optional, and you can call `identify` repeatedly as you learn more about the user — **multiple calls combine the identifiers** rather than replacing them. The more identifiers you provide, the better the SDK functions.

`identify` only enriches the _current_ user; it does **not** switch users. When a **different** user logs in on the same device, use [`updateUser`](#switch-the-current-user-updateuser) instead — it clears the previous user's identifiers first.

```typescript
// If you have any user identifiers, register them before loading the creative or
// sending events. Each identifier is optional — skip this step if you have none yet.
const identifiers: UserIdentifiers = {
  phone: '+15556667777',
  email: 'some_email@gmailfake.com',
  klaviyoId: 'userKlaviyoId',
  shopifyId: 'userShopifyId',
  clientUserId: 'userClientUserId',
  customIdentifiers: { customIdKey: 'customIdValue' },
}
identify(identifiers)
```

Here is the list of possible identifiers:
| Identifier Name | Type | Description |
| ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Client User ID | String | Your unique identifier for the user. This should be consistent across the user's lifetime. For example, a database id. |
| Phone | String | The users's phone number in E.164 format |
| Email | String | The users's email |
| Shopify ID | String | The users's Shopify ID |
| Klaviyo ID | String | The users's Klaviyo ID |
| Custom Identifiers | Map<String,String> | Key-value pairs of custom identifier names and values. The values should be unique to this user. |

Because identifiers accumulate, you can register them as they become available — later calls add to the set rather than overwriting it:

```typescript
identify({ email: 'theusersemail@gmail.com' })
identify({ phone: '+15556667777' })
// The SDK now has both identifiers:
//   email: 'theusersemail@gmail.com'
//   phone: '+15556667777'
```

### Switch the current user (`updateUser`)

Use `updateUser` to **switch to a different user** on the same device — for example, when one user logs out and a different user logs in. At least one of `email` or `phone` must be provided.

Calling `updateUser` automatically clears the identifiers previously associated with the current user — including detaching any push token from them — and associates the app with the new identifier(s) you provide, so all subsequent events and messages are attributed to the new user. It returns a `Promise` that resolves on success and rejects with an error on failure.

```typescript
try {
  // Switch to a different user on the same device
  await updateUser({ email: 'newuser@example.com', phone: '+15559876543' })
} catch (error) {
  // Handle the failure (e.g. surface an error to the user)
}
```

> Use `updateUser` only when switching to a different user. To add or enrich identifiers for the **current** user, prefer `identify` (shown above).

### Load the Creative

```typescript
// Trigger the Creative. This will show the Creative as a pop-up over the rest of the app.
triggerCreative()
```

### Destroy the creative

```typescript
// This will remove the creative along with its web view
destroyCreative()
```

### Observe creative lifecycle events

Subscribe with `addCreativeEventListener` to learn whether a creative actually opened and when the
user dismissed it — useful for analytics, or for holding back your own UI while a creative is on
screen.

```typescript
import { addCreativeEventListener, triggerCreative } from '@attentive-mobile/attentive-react-native-sdk';

useEffect(() => {
  const subscription = addCreativeEventListener(({ status, creativeId }) => {
    switch (status) {
      case 'opened':
        // The creative rendered and is visible to the user.
        break;
      case 'closed':
        // The user dismissed the creative.
        break;
      case 'notOpened':
        // The creative could not be shown — see the status table below.
        break;
      case 'notClosed':
        // Rare: the creative failed to close cleanly.
        break;
    }
  });

  return () => subscription.remove();
}, []);
```

One `triggerCreative()` call produces **more than one event over time** — `opened` and then
`closed` on the happy path — which is why this is an event stream rather than a callback or a
promise.

| `status` | Meaning |
|---|---|
| `opened` | The creative rendered and is visible. |
| `closed` | The creative was dismissed by the user tapping the creative's own close control. The Android hardware back button does **not** produce this event — see the caveats below. |
| `notOpened` | The creative could not be shown: no creative is configured for the app, the creative was fatigued, the load timed out, or an unknown error occurred. This is the single catch-all failure status on both platforms — it does not distinguish between those causes. See the Android caveat below. |
| `notClosed` | The creative failed to close cleanly (e.g. the web view was already gone). **Android only in practice** — `attentive-ios-sdk` 2.0.18-beta.1 declares this status but never reports it, so an iOS-only integration will never see it. |

`creativeId` echoes the id you passed to `triggerCreative(creativeId)`, and is absent when you
triggered the default creative.

Notes:

- Supported on React Native 0.74+. Events travel as `RCTDeviceEventEmitter` device events rather
  than through a codegen event emitter, so the transport itself needs no New Architecture opt-in.
  **On iOS the New Architecture is still required**, because the native module only exports its
  methods under `RCT_NEW_ARCH_ENABLED`; old-architecture iOS support is not implemented yet. With
  the New Architecture disabled on iOS, `triggerCreative()` throws rather than emitting anything.
- **`destroyCreative()` does not emit an event** on either platform, so a `closed` event only ever
  comes from user-driven dismissal. Note the platforms diverge on what it actually does: on Android
  it removes the creative's web view, while on iOS it currently dismisses nothing — the creative
  stays on screen. Do not use it as a programmatic "hide the creative" call on iOS.
- **The Android hardware back button neither closes the creative nor emits an event.** A back press
  is handled by React Native's own navigation while the creative's web view stays on screen, so if
  you gate UI on `closed`, that gate will not lift on a back press.
- **Android: a failed page load or render timeout emits nothing.** With `attentive-android-sdk`
  2.1.9, if the creative page fails to load, or does not render within the native five-second
  window, no event is delivered on Android — network errors included. Treat `notOpened` as
  best-effort there and do not rely on it as a timeout signal; if you need one, run your own timer
  alongside `triggerCreative()`. iOS reports `notOpened` for both timeout and failure.
- **Android: in `Mode.DEBUG`, a creative that never renders leaves the app unresponsive.** With
  `attentive-android-sdk` 2.1.9, the creative's web view is placed on screen before its content
  loads, and while it is there it receives touches — so if the creative never appears, taps stop
  reaching your app until the process is restarted. Per the caveat above, no `notOpened` arrives to
  detect it. `Mode.PRODUCTION` is unaffected. When testing in DEBUG, trigger against a domain that
  serves a mobile-app creative, or pass an explicit `creativeId`.
- **Trigger one creative at a time.** Overlapping `triggerCreative()` calls behave differently per
  platform:
  - While a creative is open or still launching, a second call is **dropped silently on iOS** — no
    event of any kind. On **Android** it builds a second creative and emits a full
    `opened`/`closed` stream.
  - On iOS, if you trigger again after the first creative has timed out but while its page is still
    resolving, the first creative's late `opened`/`closed` can arrive on the second call's listener,
    echoed with the *second* `creativeId`.

  Wait for a terminal event (`closed` or `notOpened`) before triggering the next creative. Both
  behaviours come from the pinned native SDK versions and may change in a future release.
- Always `remove()` the subscription when your component unmounts.

### Record user events

The SDK currently supports `Purchase`, `AddToCart`, `ProductView`, and `CustomEvent`.

```typescript
// Construct one or more "Item"s, which represents the product(s) purchased
const items: Item[] = [
  {
    productId: '555',
    productVariantId: '777',
    price: '14.99',
    currency: 'USD',
  },
]

// Construct a Purchase event
const purchase: Purchase = {
  items: items,
  orderId: '88888',
  cartId: '555555', // optional
  cartCoupon: 'SOME-DISCOUNT', // optional
}

// Record the PurchaseEvent
recordPurchaseEvent(purchase)
```

The process is similar for the other events. See [eventTypes.tsx](https://github.com/attentive-mobile/attentive-react-native-sdk/blob/main/src/eventTypes.tsx) for all events.

### Push Notifications (iOS and Android)

The SDK supports push notification integration on both iOS (APNs) and Android (FCM). The following sections cover iOS-specific setup flows. On Android, push notification integration is handled entirely in native Kotlin/Java code — see [App Events on Android](#app-events-on-android) for details.

Push can also be disabled entirely at initialization — see [Disabling push at initialization](#disabling-push-at-initialization-pushenabled).

> **iOS — required setup:** Your AppDelegate **must** forward notification
> responses to the SDK for push tracking to work. Add this single line to your
> `userNotificationCenter(_:didReceive:withCompletionHandler:)`:
>
> ```swift
> AttentiveSDKManager.shared.handleNotificationResponse(response)
> ```
>
> Without this, push open and foreground push events **will not be tracked** on
> iOS. See [iOS AppDelegate Integration](#ios-appdelegate-integration) for full
> details.
>
> **Migrating from an earlier version?** If you previously called
> `AttentiveSDKManager.shared.handleForegroundPush(response:authorizationStatus:)`
> or `AttentiveSDKManager.shared.handlePushOpen(response:authorizationStatus:)`
> directly from your AppDelegate, **replace** that code with the single
> `handleNotificationResponse` call above. Using both will result in
> double-tracked events. The old methods are now deprecated.

---

### Inbox

An in-app message center: a drop-in native view that renders the messages Attentive has delivered to
the current user. Each message has a title, body, timestamp, read/unread state, and optionally an
image (static or animated GIF) and a deep link.

Rendering the component **is** the integration. The native view initializes the inbox on first use,
fetches the first page in the background, and refreshes when the screen resumes — there is no inbox
call to make from TypeScript.

#### Requirements

- The SDK is initialized — see [Initialize the SDK](#initialize-the-sdk).
- The device is **registered for push** on the same company. Inbox messages are addressed to the same
  audience as push, so a device that never registered a push token has no inbox to read. See
  [Push Notifications](#push-notifications-ios-and-android).
- **iOS: the new architecture.** The iOS half is a Fabric component compiled only under
  `RCT_NEW_ARCH_ENABLED`; there is no old-architecture view manager for it yet.

#### Usage

```tsx
import { AttentiveInboxView } from '@attentive-mobile/attentive-react-native-sdk'

export default function InboxScreen() {
  return <AttentiveInboxView style={{ flex: 1 }} />
}
```

The native view fills the box you give it, so **it needs bounded height** — `flex: 1` inside a
filling parent, or an explicit `height`. Given a zero-height box it renders nothing.

Handled for you, with no props to set:

- message list with title, body, timestamp, and optional image
- unread indicator dot on unread rows
- pull-to-refresh and infinite-scroll pagination
- swipe left to mark unread, swipe right to delete
- tap to mark read and follow the message's deep link
- empty state when there are no messages

#### Theming

Five colors are overridable. Anything you leave unset falls back to the SDK's own default, and
clearing a prop restores that default rather than keeping the last value.

| Prop | Applies to |
| --- | --- |
| `unreadIndicatorColor` | the dot marking an unread message |
| `titleTextColor` | message title |
| `bodyTextColor` | message body / preview text |
| `timestampTextColor` | message timestamp |
| `swipeBackgroundColor` | background revealed by swipe-left ("mark as unread") |

Each accepts any React Native `ColorValue` — hex strings, named colors, `PlatformColor`,
`DynamicColorIOS`:

```tsx
<AttentiveInboxView
  style={{ flex: 1 }}
  unreadIndicatorColor="#1E88E5"
  titleTextColor="#000000"
  bodyTextColor="#666666"
  timestampTextColor="#999999"
  swipeBackgroundColor="#FFC5B9"
/>
```

> **Platform support:** Android applies all five. iOS applies `titleTextColor`, `bodyTextColor`, and
> `timestampTextColor`. `unreadIndicatorColor` and `swipeBackgroundColor` are Android-only. Setting
> them on iOS is safe and logs once, so they are never dropped silently.

Two knobs are deliberately **not** exposed:

- **Background color** — not themeable yet. Style the container behind the view instead.
- **Fonts** — not themeable from React Native yet; the inbox uses the SDK's own type styles.

The swipe-right delete action is a fixed red and is not themeable.

#### Unread badge

`getInboxUnreadCount()` reads the count and is also what *starts* the inbox — it kicks off the first
fetch and, on Android, the observer behind the change events. Register the listener first, then read:

```tsx
import {
  getInboxUnreadCount,
  addInboxUnreadCountListener,
} from '@attentive-mobile/attentive-react-native-sdk'

const [unreadCount, setUnreadCount] = useState(0)

useEffect(() => {
  const subscription = addInboxUnreadCountListener(setUnreadCount)
  getInboxUnreadCount().then(setUnreadCount).catch(() => {})
  return () => subscription.remove()
}, [])
```

The listener fires on every change the SDK makes — a completed fetch, a message read or deleted in
the inbox UI, an identity change. Repeat values are filtered out natively, so a re-fetch returning
the same number won't churn your badge. A listener on its own receives nothing until something
starts the inbox, which is why the read call above is not optional.

`0` is both the initial value and the "nothing unread" value, so it cannot tell you whether the
first fetch has landed. Track that separately if you need to distinguish them.

> **Refresh differs by platform, and it affects badge accuracy.** On **iOS** every
> `getInboxUnreadCount()` call refreshes from the server, so calling it on app foreground and after
> a push open — Attentive's iOS guidance — keeps the badge correct. On **Android** only the *first*
> call fetches; the native refresh entry points are still internal, so afterwards an Android badge
> updates when a push arrives while the app is foregrounded, and whenever the inbox view is on
> screen. A plain foreground with no push and no inbox visit will not refresh it.

#### Not yet available from TypeScript

The native SDKs expose more than the drop-in view and the unread count. The following are
**native-only** today — they are not bridged to React Native:

- programmatic `markRead` / `markUnread` / `deleteMessage` / load-next-page
- a custom tap handler that replaces the default mark-read-and-open-deep-link behavior
- subscribing to the full message stream to build your own inbox UI

If you need any of these, talk to your Attentive contact before designing around the drop-in view.

#### Identity

`clearUser()` and `updateUser()` clear the inbox, so one user's messages never leak into the next
session; inbox requests already in flight are discarded when they land.

#### Troubleshooting an empty inbox

Inbox messages are created server-side — there is no SDK API to inject one. If the list is empty:

1. Confirm the device registered a push token for that company. Without a resolved identity the
   server serves an empty inbox.
2. Confirm the message was sent **after** the device registered. Sends are addressed to a
   precomputed subscriber audience, so a device that registered shortly before the send may not be
   included in it yet.
3. Messages expire (30 days by default). An expired inbox is indistinguishable from a
   never-populated one on the client — both are `HTTP 200` with zero messages.

---

### App Events on Android

On Android, **regular app open and foreground events are handled automatically** by the native Android SDK once `AttentiveSdk.initialize()` is called from `Application.onCreate()` (see [Android Native Initialization](#android--initialize-from-native-code)). The lifecycle observers registered during initialization (e.g. `AppLaunchTracker`) take care of this transparently — there is no need to manually call `handleRegularOpen` or subscribe to `AppState` changes.

The only TypeScript-side step required on Android is calling `identify()` with any available user identifiers as early as possible in your app’s lifecycle (e.g. in the root component `useEffect`).

#### Prerequisites

1. **AndroidManifest** – Declare the notification permission for Android 13+:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <!-- other permissions -->
</manifest>
```

2. **Native initialization** – The SDK must be initialized from `Application.onCreate()` on Android (see [Android Native Initialization](#android--initialize-from-native-code) above). App open and lifecycle events are then tracked automatically.

#### TypeScript setup (Android)

After native initialization, the only required TypeScript call is `identify()`:

```typescript
import { Platform } from 'react-native'
import { initialize, identify } from 'attentive-react-native-sdk'

// Inside your root component (e.g. App.tsx useEffect):
if (Platform.OS === 'ios') {
  initialize(config)
}

identify({ email: 'user@example.com', clientUserId: 'id-123' })
```

#### Push notifications on Android (FCM)

The Attentive Android SDK registers its own `FirebaseMessagingService` automatically — **you do not need to create a subclass**. As long as your app is registered with Firebase and includes a valid `google-services.json`, the SDK handles FCM token registration and foreground push delivery for you. Follow the [Firebase Android setup guide](https://firebase.google.com/docs/cloud-messaging/android/client) to add FCM to your project.

##### If you already have a FirebaseMessagingService subclass

If your app has an existing `FirebaseMessagingService` subclass for other purposes, route Attentive messages through to the SDK:

```kotlin
import com.attentive.androidsdk.AttentiveSdk
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class YourFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        if (AttentiveSdk.isAttentiveFirebaseMessage(remoteMessage)) {
            AttentiveSdk.sendNotification(remoteMessage)
        }
        // Handle your own messages below...
    }
}
```

##### Notification opens (singleTask apps)

React Native apps use `singleTask` launch mode by default. When a push notification is tapped while the app is in the background, Android delivers the intent via `onNewIntent()` rather than recreating the activity. Override `onNewIntent` in your `MainActivity` so the SDK can detect the notification tap:

```kotlin
import android.content.Intent

class MainActivity : ReactActivity() {

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { setIntent(it) }
    }
}
```

Refer to the [Attentive Android SDK documentation](https://github.com/attentive-mobile/attentive-android-sdk) for the full list of native APIs available for push notification integration.

---

#### Request Push Permission (iOS)

```typescript
import { registerForPushNotifications } from 'attentive-react-native-sdk'

// Request permission to send push notifications
// This will show the iOS system permission dialog
registerForPushNotifications()
```

#### Register Device Token (iOS)

When your iOS app receives an APNs device token, register it with the Attentive backend:

```typescript
import { registerDeviceToken } from 'attentive-react-native-sdk'

// In your AppDelegate or push notification handler:
// Convert the device token Data to a hex string and pass the authorization status
registerDeviceToken(hexEncodedToken, 'authorized')
```

The `authorizationStatus` parameter should be one of:

- `'authorized'` - User has granted permission
- `'denied'` - User has denied permission
- `'notDetermined'` - User hasn't been asked yet
- `'provisional'` - Provisional authorization (quiet notifications)
- `'ephemeral'` - App Clip notifications

#### Handle Push Notification Opens (iOS)

When a user taps on a push notification, track the event:

```typescript
import { handlePushOpened } from 'attentive-react-native-sdk'
import type {
  ApplicationState,
  PushAuthorizationStatus,
} from 'attentive-react-native-sdk'

// In your notification handler:
handlePushOpened(
  notificationPayload, // The notification's userInfo/data
  'background', // App state: 'active', 'inactive', or 'background'
  'authorized' // Current authorization status
)
```

#### Handle Foreground Notifications (iOS)

When a notification arrives while the app is in the foreground:

```typescript
import { handleForegroundNotification } from 'attentive-react-native-sdk'

// In your foreground notification handler:
handleForegroundNotification(notificationPayload)
```

#### iOS AppDelegate Integration

For proper push notification integration, your iOS AppDelegate needs to:

1. Request notification permissions via the SDK
2. Implement `application:didRegisterForRemoteNotificationsWithDeviceToken:` to register the token
3. **Forward notification responses to the SDK for push-open tracking**

##### Push Open Tracking (Required)

Add **one line** to your AppDelegate's `didReceive` handler so the SDK can track
push opens and foreground push events. Without this, `handlePushOpen()` and
`handleForegroundPush()` called from JavaScript will not be able to track events
on iOS (the native SDK requires a `UNNotificationResponse` which cannot cross the
React Native bridge).

```swift
// In AppDelegate.swift — UNUserNotificationCenterDelegate
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
) {
    // Attentive push tracking (handles app-state + auth status automatically)
    AttentiveSDKManager.shared.handleNotificationResponse(response)

    // Forward to your push library (e.g. RNCPushNotificationIOS) for JS events
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
}
```

`handleNotificationResponse` automatically:

- Detects whether the app is in the foreground or background
- Fetches the current authorization status
- Calls the correct native SDK method (`handlePushOpen` or `handleForegroundPush`)
- Caches the response so the JS-side `handlePushOpen()` / `handleForegroundPush()` calls
  are fulfilled without double-tracking
- **Cold-launch safe:** If the user taps a push while the app is killed, the
  response is cached and automatically tracked once the SDK initializes

##### Callback-Based Registration (Recommended)

For more control over the registration flow, you can use the callback-based registration directly in your AppDelegate:

```swift
// In AppDelegate.swift
import UserNotifications
import attentive_react_native_sdk

func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
        let authStatus = settings.authorizationStatus

        // Get SDK instance with proper type
        guard let attentiveSdk = AttentiveSDKManager.shared.sdk as? ATTNNativeSDK else {
            print("[Attentive] SDK not initialized")
            return
        }

        // Register device token with callback
        attentiveSdk.registerDeviceToken(
            deviceToken,
            authorizationStatus: authStatus,
            callback: { data, url, response, error in
                DispatchQueue.main.async {
                    // Handle registration result
                    if let error = error {
                        print("[Attentive] Registration failed: \(error.localizedDescription)")
                    }

                    // Trigger regular open event after registration
                    attentiveSdk.handleRegularOpen(authorizationStatus: authStatus)
                }
            }
        )
    }
}
```

**Documentation:**

- [Push Notifications Integration Guide](./docs/PUSH_NOTIFICATIONS_INTEGRATION.md) - Callback-based registration, complete AppDelegate implementation, Android and iOS token flow
- [Push Notifications Setup](./docs/PUSH_NOTIFICATIONS_SETUP.md) - Apple Developer Portal, APNs certificates, and TestFlight configuration
- [iOS Native SDK documentation](https://github.com/attentive-mobile/attentive-ios-sdk) - Native SDK reference

For Android push notification integration, see the **[App Events on Android](#app-events-on-android)** section above.
