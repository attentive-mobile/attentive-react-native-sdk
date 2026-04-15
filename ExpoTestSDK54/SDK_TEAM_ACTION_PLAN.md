# SDK Team Action Plan: Expo SDK 54 / RN 0.81 Compatibility

**Date:** 2026-04-13  
**Target:** Full compatibility with Expo SDK 54 / RN 0.81.5 / React 19.1.0

---

## Priority 1: iOS Podspec Update (BLOCKING)

**File:** `attentive-react-native-sdk.podspec` (lines 24-36)  
**Effort:** Small  
**Impact:** Fixes iOS builds in Expo prebuilt mode (the default)

### Problem

The podspec's new-arch conditional block declares dependencies on individual RN internal pods that don't exist as standalone specs in RN 0.81's prebuilt mode:

```ruby
if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
  s.dependency "React-Codegen"    # Bundled into ReactNativeDependencies
  s.dependency "RCT-Folly"        # Bundled into ReactNativeDependencies
  s.dependency "RCTRequired"      # Still exists separately
  s.dependency "RCTTypeSafety"    # Still exists separately
  s.dependency "ReactCommon/turbomodule/core"  # Changed structure
end
```

### Proposed Fix

Remove the entire `RCT_NEW_ARCH_ENABLED` conditional block. In modern React Native (0.78+), the codegen and new-arch dependencies are handled automatically by the build system. Libraries should only declare their own direct dependencies:

```ruby
Pod::Spec.new do |s|
  # ... existing metadata ...

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.dependency 'ATTNSDKFramework', '~> X.Y'  # Updated from attentive-ios-sdk
  s.swift_versions = ['5']
  s.dependency "React-Core"

  # Remove the entire RCT_NEW_ARCH_ENABLED conditional block
  # The build system handles codegen/folly/turbomodule dependencies automatically
end
```

### Verification
1. `pod install` succeeds in default Expo 54 prebuilt mode
2. `pod install` succeeds when building from source
3. iOS build succeeds in both modes
4. TurboModule functions correctly at runtime

---

## Priority 2: Android build.gradle Modernization (WARNING -> FUTURE BLOCKING)

**File:** `android/build.gradle`  
**Effort:** Medium  
**Impact:** Prevents future breakage with Gradle 9.0 / AGP 9.0; removes deprecation warnings

### Changes Required

#### 2a. Remove `buildscript` block (lines 1-11)
Libraries should not declare their own AGP or Kotlin Gradle plugin versions. The app project provides these.

**Before:**
```gradle
buildscript {
  repositories { google(); mavenCentral() }
  dependencies {
    classpath "com.android.tools.build:gradle:7.3.1"
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.10"
  }
}
```

**After:** Remove entirely.

#### 2b. Update deprecated DSL methods (lines 36-55)

| Before | After |
|--------|-------|
| `compileSdkVersion getExtOrIntegerDefault("compileSdkVersion")` | `compileSdk getExtOrIntegerDefault("compileSdkVersion")` |
| `minSdkVersion getExtOrIntegerDefault("minSdkVersion")` | `minSdk getExtOrIntegerDefault("minSdkVersion")` |
| `targetSdkVersion getExtOrIntegerDefault("targetSdkVersion")` | `targetSdk getExtOrIntegerDefault("targetSdkVersion")` |
| `lintOptions { disable "GradleCompatible" }` | `lint { disable += "GradleCompatible" }` |
| `JavaVersion.VERSION_1_8` | `JavaVersion.VERSION_17` |

#### 2c. Remove hardcoded Kotlin dependencies (lines 89-90)

**Before:**
```gradle
implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.10"
implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.9.10"))
```

**After:**
```gradle
implementation "org.jetbrains.kotlin:kotlin-stdlib"
// Remove the BOM — let the app project's Kotlin version resolve
```

#### 2d. Update `gradle.properties` defaults

**File:** `android/gradle.properties`

Update the default SDK versions to match modern Android targets:
```properties
AttentiveReactNativeSdk_compileSdkVersion=35
AttentiveReactNativeSdk_targetSdkVersion=35
AttentiveReactNativeSdk_minSdkVersion=24
```

### Verification
1. Build succeeds with Expo SDK 54 (Gradle 8.14.3, Kotlin 2.1.20, AGP 8.x)
2. Build succeeds with older Expo SDK 52 (Gradle 8.x, Kotlin 1.9.x)
3. No Gradle deprecation warnings from SDK module

---

## Priority 3: Update Native SDK Dependencies (WARNING)

### 3a. iOS: Migrate from `attentive-ios-sdk` to `ATTNSDKFramework`

**File:** `attentive-react-native-sdk.podspec` (line 19)  
**Effort:** Small-Medium (may require import changes in Swift bridging code)

The native iOS SDK `attentive-ios-sdk` is deprecated in favor of `ATTNSDKFramework`. Update:

```ruby
# Before
s.dependency 'attentive-ios-sdk', '2.0.13'

# After
s.dependency 'ATTNSDKFramework', '~> X.Y.Z'
```

Check if the Swift bridging files in `ios/Bridging/` need import statement updates:
- `ios/Bridging/ATTNNativeSDK.swift`
- `ios/Bridging/AttentiveSDKManager.swift`

### 3b. Replace `metro-react-native-babel-preset`

**File:** `package.json` (line 184)  
**Effort:** Small

```json
// Before
"metro-react-native-babel-preset": "^0.77.0"

// After
"@react-native/babel-preset": "^0.81.0"
```

Verify that the SDK's Babel/build configuration still works with the replacement.

---

## Priority 4: DevDependencies Version Bump (MAINTENANCE)

**File:** `package.json`  
**Effort:** Medium (requires running full test suite)

Update development dependencies to match the target environment:

| Package | Current | Target |
|---------|---------|--------|
| `react` (devDep) | 18.2.0 | 19.1.0 |
| `react-native` (devDep) | 0.75.5 | 0.81.5 |
| `@types/react` (devDep) | ~17.0.21 | ~19.1.0 |
| `typescript` (devDep) | ^4.5.2 | ^5.9.0 |

Also remove the `resolutions` block:
```json
// Remove:
"resolutions": {
  "@types/react": "17.0.21"
}
```

---

## Priority 5: Update Example Projects (MAINTENANCE)

### 5a. Update Bonni to RN 0.81 / React 19

**File:** `Bonni/package.json`

This ensures ongoing compatibility testing with the latest supported environment.

### 5b. Maintain ExpoTestSDK54 as a regression test

Keep the `ExpoTestSDK54/` project as a permanent test fixture for Expo compatibility. Add it to CI to catch regressions.

---

## Priority 6: Optional Expo Module Support (ENHANCEMENT)

**Effort:** Large  
**Impact:** Improved Expo developer experience

Consider adding official Expo module support:

1. **`app.plugin.js`** — Expo config plugin for automatic native configuration (e.g., push notification entitlements, Info.plist keys)
2. **`expo-module.config.json`** — Register as an Expo module for better autolinking and module lifecycle management

This is optional since the SDK already works as a standard React Native library with Expo via autolinking. But it would improve the developer experience for Expo users.

---

## Implementation Timeline Suggestion

| Phase | Priority | Items | Estimated Effort |
|-------|----------|-------|-----------------|
| Phase 1 | P1 | Podspec fix (remove RCT_NEW_ARCH conditional) | 1-2 hours |
| Phase 2 | P2 + P3 | Android gradle modernization + native SDK dep updates | 1-2 days |
| Phase 3 | P4 + P5 | DevDeps bump + example project updates | 1-2 days |
| Phase 4 | P6 | Expo module support (optional) | 1-2 weeks |

Phase 1 alone unblocks the customer's iOS builds in default Expo configuration.

---

## Testing Matrix After Changes

| Environment | iOS | Android |
|-------------|-----|---------|
| Expo SDK 54 (prebuilt) | Must pass | Must pass |
| Expo SDK 54 (source build) | Must pass | Must pass |
| Expo SDK 52 | Must pass | Must pass |
| Bare RN 0.81 | Must pass | Must pass |
| Bare RN 0.77 (Bonni) | Must pass | Must pass |
