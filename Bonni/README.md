# Bonni Beauty - React Native Example App

A comprehensive example app demonstrating the integration of the Attentive React Native SDK. This app uses React Native 0.77 and follows best practices for cross-platform mobile development while replicating the native iOS and Android "Bonni" example app.

## Overview

Bonni Beauty is a fictional e-commerce beauty products store that showcases all major features of the Attentive SDK, including:

- User identification and management
- Product view event tracking
- Add to cart event tracking
- Purchase event tracking
- Custom events
- Creative display triggering
- SDK testing and configuration

## Features

### Complete E-commerce Flow

1. **Login Screen** - Welcome screen with guest access and account creation
2. **Create Account** - User registration with SDK identification
3. **Product Catalog** - 2-column grid displaying 6 beauty products
4. **Product Details** - Detailed product view with automatic event tracking
5. **Shopping Cart** - Full cart management with quantity controls
6. **Checkout** - Complete checkout flow with address and payment forms
7. **Order Confirmation** - Success screen with purchase event tracking
8. **Settings** - SDK testing and configuration panel

### Attentive SDK Integration

- **Automatic Event Tracking**: Product views, add to cart, and purchases
- **User Identification**: Email and phone number identification
- **Creative Display**: Trigger SDK creative displays
- **Custom Events**: Send custom event data
- **User Management**: Clear user data, switch users

## Getting Started

### Prerequisites

- Node.js >= 18
- React Native development environment set up
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install iOS pods:
```bash
npm run pods
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Building & Running for Development

This section covers the exact steps to build, run, and debug the Bonni app on both platforms. Follow the platform-specific steps below after completing the initial [Installation](#installation).

### Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Node.js | 18 | Use nvm — the repo includes an `.nvmrc` file |
| npm | 9 | Project standardizes on npm; do not use yarn or pnpm |
| **iOS** | | |
| Xcode | 15 | Required for React Native 0.77 |
| Ruby | 3.x | Needed by CocoaPods via Bundler |
| CocoaPods | latest | Installed via `bundle exec pod install` |
| **Android** | | |
| Android Studio | latest | Includes SDK Manager and AVD Manager |
| Android SDK Platform | API 35 | `compileSdkVersion = 35` |
| Android SDK Build Tools | compatible with API 35 | Managed by Android Studio |
| JDK | 17 | Set `JAVA_HOME` to JDK 17 |
| ADB | any | Included with Android Studio; verify with `adb devices` |

---

### iOS — Step by Step

1. **Navigate to the Bonni directory** from the repo root:

    ```bash
    cd Bonni
    ```

2. **Use the correct Node version:**

    ```bash
    nvm use
    ```

3. **Install JS dependencies:**

    ```bash
    npm install
    ```

4. **Install iOS pods:**

    ```bash
    npm run pods
    ```

    This runs `install-pods.sh`, which copies pods from `../example/ios/Pods` when available. This avoids a known `xcodeproj` v1.25.1 hang on macOS Sequoia and Apple Silicon. If it fails, see [`PODS_WORKAROUND.md`](./PODS_WORKAROUND.md) for manual alternatives.

5. **Open the workspace in Xcode** (always use `.xcworkspace`, never `.xcodeproj`):

    ```bash
    open ios/Bonni.xcworkspace
    ```

6. **Configure signing:** In Xcode, select the `Bonni` target → **Signing & Capabilities** tab → choose your Team from the dropdown. Xcode will automatically manage the provisioning profile.

7. **Select a simulator or connected device** from the device picker in the Xcode toolbar.

8. **Run the app:**

    - Via CLI (recommended — starts Metro automatically):

        ```bash
        npm run ios
        ```

    - Via Xcode: press **⌘R**. If using this path, start Metro separately in a dedicated terminal:

        ```bash
        npm start
        ```

> **Push notifications require a physical device.** APNs does not function on iOS simulators. See [`docs/PUSH_NOTIFICATIONS_SETUP.md`](../docs/PUSH_NOTIFICATIONS_SETUP.md) for the full TestFlight setup.

---

### Android — Step by Step

1. **Start an emulator** in Android Studio (AVD Manager → ▶) or connect a physical device with USB debugging enabled. Confirm it is recognized:

    ```bash
    adb devices
    ```

2. **Navigate to the Bonni directory** (if not already there):

    ```bash
    cd Bonni
    ```

3. **Install JS dependencies** (if not already done):

    ```bash
    npm install
    ```

4. **Run the app** — choose the script that matches your workflow:

    | Script | Command | When to use |
    |--------|---------|-------------|
    | Standard | `npm run android` | Day-to-day development |
    | Fresh SDK build | `npm run android-fresh` | After making changes to the parent SDK source; builds the SDK first with `npm --prefix .. run build` then installs the APK |
    | Pure Gradle | `npm run android-pure` | When Metro is already running; bypasses the RN CLI and launches directly via `adb` |

5. **Metro bundler** runs automatically with all of the above. If you need to start it manually:

    ```bash
    npm start
    ```

> **Android initialization reminder:** `AttentiveSdk.initialize()` must be called from `MainApplication.kt` → `onCreate()` before the React Native bridge starts. If this call is missing, all SDK events will silently fail. See the [Android Integration](../docs/PUSH_NOTIFICATIONS_INTEGRATION.md#android-integration) section of the Push Notifications Integration Guide for details.

---

### Metro Bundler

Metro must be running whenever the app is launched from Xcode (⌘R) or via `android-pure`. Start it manually when needed:

```bash
# Standard start (run from the Bonni/ directory)
npm start

# Clear the JS transform cache — use this when JS changes are not reflected in the app
npm start -- --reset-cache
```

---

### Debugging Tips

#### SDK debug overlay

Enable the in-app overlay to inspect events in real time (see [`DEBUGGING.md`](../DEBUGGING.md) for full details):

```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'your-domain',
  mode: 'debug',
  enableDebugger: true,
}
```

#### iOS native logs

In Xcode, open **View → Debug Area → Activate Console**. All SDK log lines are prefixed with `[Attentive]`.

Alternatively, use the Console app on macOS and filter by process name `Bonni`.

#### Android native logs

Stream SDK logs directly from a connected device or emulator:

```bash
adb logcat | grep -i attentive
```

For structured output including React Native JS errors:

```bash
adb logcat *:S ReactNative:V ReactNativeJS:V AttentiveSDK:V
```

#### Metro / JS errors

Check the Metro terminal window for bundle errors. Common fix when stale cache causes unexpected behavior:

```bash
npm start -- --reset-cache
```

#### Android Gradle issues

If the build fails with dependency or compilation errors:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

---

## SDK Configuration

Update the Attentive domain in `App.tsx`:

```typescript
const config: AttentiveSdkConfiguration = {
  attentiveDomain: 'your-domain', // Replace with your Attentive domain
  mode: 'production',
  enableDebugger: true,
};
```

## Testing the SDK

Use the **Settings** screen to:

1. Switch users (update email/phone)
2. Clear user data
3. Trigger creative display
4. Send custom events
5. Add email/phone identifiers

## Cross-Platform Compatibility

This app is built with React Native 0.77 and supports:

- ✅ iOS 13.0+
- ✅ Android API 21+ (5.0 Lollipop)

All features work identically on both platforms, demonstrating true cross-platform development.

## License

MIT
