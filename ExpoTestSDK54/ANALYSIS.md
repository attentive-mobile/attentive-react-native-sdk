# Expo SDK 54 + Attentive RN SDK v2.0.0-beta.8 Compatibility Analysis

**Date:** 2026-04-13  
**Test Environment:**
- Expo SDK: 54.0.27
- React Native: 0.81.5
- React: 19.1.0
- Attentive SDK: 2.0.0-beta.8
- Xcode: 17A400 (Xcode 17)
- Kotlin: 2.1.20 (from Expo/RN)
- AGP: via Gradle 8.14.3
- Android compileSdk: 36

---

## Executive Summary

The Attentive React Native SDK v2.0.0-beta.8 **is partially compatible** with Expo SDK 54 / RN 0.81.5 / React 19.1.0. Both iOS and Android builds succeed under certain conditions, but the **default Expo iOS configuration fails** due to a podspec dependency issue.

| Platform | Default Expo Config | Workaround Available | Build Result |
|----------|-------------------|---------------------|-------------|
| **iOS (prebuilt mode)** | Fails | Yes | Pod install fails: `RCT-Folly` not found |
| **iOS (source build)** | N/A (non-default) | N/A | BUILD SUCCEEDED |
| **Android** | Works | N/A | BUILD SUCCEEDED |
| **npm install** | Works | N/A | No peer dep conflicts |

---

## Issue #1: iOS Pod Install Fails in Prebuilt Mode (BLOCKING)

**Platform:** iOS  
**Build Phase:** `pod install`  
**Severity:** BLOCKING — prevents any iOS build with default Expo configuration

### Error Message
```
[!] Unable to find a specification for `RCT-Folly` depended upon by `attentive-react-native-sdk`
```

### Root Cause

React Native 0.81 introduced **prebuilt binaries** as the default build mode. In this mode:
- The environment variables `RCT_USE_RN_DEP=1` and `RCT_USE_PREBUILT_RNCORE=1` are set by the Expo Podfile
- Internal RN dependencies like `RCT-Folly`, `React-Codegen`, `RCTRequired`, `RCTTypeSafety`, and `ReactCommon/turbomodule/core` are bundled into a single `ReactNativeDependencies` pod
- These individual pods are **not available** as standalone CocoaPods specs in prebuilt mode

The Attentive SDK's podspec (`attentive-react-native-sdk.podspec`, lines 24-36) conditionally declares these dependencies when `RCT_NEW_ARCH_ENABLED=1`:

```ruby
if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
  s.dependency "React-Codegen"
  s.dependency "RCT-Folly"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "ReactCommon/turbomodule/core"
end
```

In prebuilt mode, `RCT-Folly` is no longer a standalone pod — it's been absorbed into `ReactNativeDependencies`.

### SDK File Affected
- `attentive-react-native-sdk.podspec` (lines 24-36)

### Workaround
The customer can disable prebuilt mode by adding to `ios/Podfile.properties.json`:
```json
{
  "ios.buildReactNativeFromSource": "true"
}
```
Then run `pod install` again. This makes the build succeed but **increases build times significantly** (from ~30s to ~3+ minutes for initial build).

---

## Issue #2: Deprecated iOS Native SDK Dependency (WARNING)

**Platform:** iOS  
**Build Phase:** `pod install` (warning, not blocking)  
**Severity:** WARNING

### Warning Message
```
[!] attentive-ios-sdk has been deprecated in favor of ATTNSDKFramework
```

### Root Cause
The podspec depends on `attentive-ios-sdk` version 2.0.13, which has been superseded by `ATTNSDKFramework`. While this doesn't block the build today, it may become unavailable in the future.

### SDK File Affected
- `attentive-react-native-sdk.podspec` (line 19)

---

## Issue #3: Deprecated `metro-react-native-babel-preset` Dependency (WARNING)

**Platform:** All  
**Build Phase:** `npm install` (warning, not blocking)  
**Severity:** WARNING

### Warning Message
```
npm warn deprecated metro-react-native-babel-preset@0.77.0: Use @react-native/babel-preset instead
```

### Root Cause
The SDK's `package.json` declares `metro-react-native-babel-preset: "^0.77.0"` as a runtime dependency. This package has been deprecated in favor of `@react-native/babel-preset` (the official replacement since RN 0.73+).

### SDK File Affected
- `package.json` (line 184)

---

## Issue #4: Android Build Configuration Deprecations (WARNING)

**Platform:** Android  
**Build Phase:** Gradle sync/build (warnings, not blocking)  
**Severity:** WARNING — works now but will break with Gradle 9.0 or AGP 9.0

### Details

The SDK's `android/build.gradle` contains several deprecated patterns that currently work because the app project's Gradle/AGP takes precedence, but will break in future versions:

| Deprecated Pattern | Location | Replacement |
|-------------------|----------|-------------|
| `buildscript` with AGP 7.3.1 | build.gradle:1-11 | Remove entirely (library should not declare AGP) |
| `compileSdkVersion` | build.gradle:36 | `compileSdk` |
| `minSdkVersion` | build.gradle:39 | `minSdk` |
| `targetSdkVersion` | build.gradle:40 | `targetSdk` |
| `lintOptions {}` | build.gradle:49-51 | `lint {}` |
| `JavaVersion.VERSION_1_8` | build.gradle:54-55 | `JavaVersion.VERSION_17` |
| Hardcoded Kotlin 1.9.10 | build.gradle:9,89,90 | Use app project's Kotlin version |

### Why It Works Now
The Expo/RN Gradle plugin overrides many of these settings at the app level. The library's `buildscript` block is ignored because the app project applies AGP first. The Kotlin stdlib version is resolved by Gradle's dependency resolution, which picks the highest compatible version (2.1.20 from the app). The deprecated DSL methods still exist in AGP 8.x but emit warnings.

### Why It Will Break Later
AGP 9.0 (expected 2027) will remove `compileSdkVersion`, `lintOptions`, and other deprecated APIs entirely.

---

## Issue #5: `RCT_NEW_ARCH_ENABLED` Environment Variable Check (INFORMATIONAL)

**Platform:** iOS  
**Severity:** INFORMATIONAL

The SDK's podspec checks `ENV['RCT_NEW_ARCH_ENABLED'] == '1'` to conditionally add new-arch dependencies. In Expo SDK 54, new architecture is enabled by default but the Podfile sets this via `Podfile.properties.json` (`"newArchEnabled": "true"`), which then sets the environment variable.

The current approach works correctly — the environment variable IS set to `'1'` during pod install. However, in prebuilt mode, the pods it depends on are not available individually (see Issue #1).

---

## Build Environment Details

### iOS Source Build (Successful)
```
- 82 pods installed
- attentive-ios-sdk 2.0.13
- attentive-react-native-sdk 2.0.0-beta.8
- Codegen: AttentiveReactNativeSdkSpec generated successfully
- Swift compilation: No errors
- Objective-C++ compilation: No errors
- Linking: Successful
```

### Android Build (Successful)
```
- Gradle 8.14.3
- Kotlin 2.1.20 (app-level, overrides SDK's 1.9.10)
- compileSdk 36 (app-level, overrides SDK's default 34)
- attentive-android-sdk 2.1.3
- Codegen: NativeAttentiveReactNativeSdkSpec generated successfully
- No Kotlin compile warnings from SDK module
- 210 tasks executed
```

### npm Install
```
- No peer dependency conflicts
- SDK declares "react": "*" and "react-native": "*" (accepts any version)
- Deprecated babel preset warning only
```
