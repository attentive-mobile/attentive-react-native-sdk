# Customer Action Plan: Using Attentive SDK with Expo SDK 54

**Date:** 2026-04-13  
**Customer Environment:** Expo SDK 54 / React Native 0.81.5 / React 19.1.0  
**Attentive SDK Version:** 2.0.0-beta.8

---

## Summary

The Attentive React Native SDK v2.0.0-beta.8 is compatible with your toolchain on **Android** with no issues. On **iOS**, the default Expo prebuilt configuration fails during `pod install`. Below are three options to resolve this, ordered by recommendation.

---

## Option A: Disable iOS Prebuilt Mode (Recommended - Immediate Fix)

**Effort:** Minimal (1 line change)  
**Risk:** Low  
**Impact:** Longer iOS build times (~2-3 minutes longer initial build)

### Steps

1. After running `npx expo prebuild`, edit `ios/Podfile.properties.json`:

```json
{
  "expo.jsEngine": "hermes",
  "EX_DEV_CLIENT_NETWORK_INSPECTOR": "true",
  "newArchEnabled": "true",
  "ios.buildReactNativeFromSource": "true"
}
```

2. Run pod install:
```bash
cd ios && pod install
```

3. Build normally:
```bash
npx expo run:ios
```

### Trade-offs
- **Pro:** Zero code changes to your app. Works immediately with current SDK version.
- **Pro:** Both iOS and Android builds succeed.
- **Con:** iOS builds take longer because React Native is compiled from source instead of using prebuilt binaries.
- **Con:** First `pod install` downloads and compiles more dependencies (~3+ minutes vs ~30 seconds).
- **Con:** CI/CD pipelines will be slower for iOS.

### Why This Works
React Native 0.81 defaults to prebuilt binaries for faster builds. In this mode, internal pods like `RCT-Folly` are bundled into `ReactNativeDependencies` and are not individually available. The Attentive SDK's podspec declares `RCT-Folly` as a dependency, which can't be resolved in prebuilt mode. Building from source makes all individual pods available again.

---

## Option B: Downgrade to Expo SDK 52 (Alternative)

**Effort:** Medium (dependency changes + potential API adjustments)  
**Risk:** Medium  
**Impact:** Uses proven SDK compatibility path

### Steps

1. Follow Expo's downgrade guide to move from SDK 54 to SDK 52:
```bash
npx expo install expo@^52.0.0
```

2. Pin compatible versions:
```json
{
  "expo": "~52.0.0",
  "react": "18.3.1",
  "react-native": "0.76.x"
}
```

3. Rebuild native projects:
```bash
npx expo prebuild --clean
```

### Version Compatibility Matrix

| Component | Expo SDK 54 (Current) | Expo SDK 52 (Downgrade) | SDK Tested With |
|-----------|----------------------|------------------------|----------------|
| React Native | 0.81.5 | 0.76.x | 0.75.5 - 0.77.3 |
| React | 19.1.0 | 18.3.1 | 18.2.0 - 18.3.1 |
| New Arch | Default ON | Opt-in | Supported |
| Prebuilt mode | Default ON | Not available | N/A |

### Trade-offs
- **Pro:** Uses React Native versions closest to what the SDK was tested against.
- **Pro:** React 18 is the version the SDK was developed against.
- **Pro:** No prebuilt mode issues (prebuilt wasn't available in SDK 52).
- **Con:** May require adjusting app code for React 18 vs 19 differences.
- **Con:** Doesn't use latest Expo features.
- **Con:** May need to downgrade other Expo dependencies.

---

## Option C: Wait for SDK Update (Future)

**Effort:** None on your side  
**Risk:** Depends on timeline  
**Impact:** Full native support without workarounds

### What the Attentive Team Would Fix

1. **iOS podspec update** to remove explicit `RCT-Folly` and other internal RN pod dependencies, making it compatible with prebuilt mode.
2. **Android build.gradle modernization** to remove deprecated Gradle DSL patterns.
3. **Dependency updates** to replace deprecated `metro-react-native-babel-preset` and `attentive-ios-sdk`.

### Trade-offs
- **Pro:** Clean, supported integration with no workarounds needed.
- **Con:** Requires waiting for the SDK team to release an update.
- **Con:** Timeline depends on SDK team priorities.

---

## Recommended Path

We recommend **Option A** as the immediate solution. It requires a single configuration change and has been verified to produce successful builds on both iOS and Android with your exact version requirements.

If build time is a critical concern for your CI/CD pipeline, you can implement Option A now and migrate to the updated SDK (Option C) when it becomes available, at which point you can remove the `ios.buildReactNativeFromSource` flag to regain prebuilt performance.

---

## Android Notes

No action needed for Android. The SDK builds and links successfully with:
- Kotlin 2.1.20 (resolves SDK's 1.9.10 automatically)
- AGP 8.x (overrides SDK's AGP 7.3.1)
- compileSdk 36

The SDK's deprecated Gradle patterns are handled gracefully by Gradle's backward compatibility layer.

---

## Verified Test Project

A complete test project matching your environment is available at `ExpoTestSDK54/` in the SDK repository. You can reference it for:
- Exact `package.json` version pins
- `Podfile.properties.json` configuration for the workaround
- Minimal `App.tsx` demonstrating SDK initialization
