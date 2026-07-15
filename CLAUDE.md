# CLAUDE.md

Guidance for AI coding agents working **on** the Attentive React Native SDK itself (this repo). If you are instead helping a client integrate the SDK into their app, use [`AGENTS.md`](./AGENTS.md) — that is the consumer-facing guide. Do not conflate the two.

## Internal API Documentation

Internal Attentive API documentation and instructions live in the private [`attentive-mobile/claude-plugins`](https://github.com/attentive-mobile/claude-plugins) repo as the `mobile-sdk-internal` plugin. To load this context into Claude Code:

```
/plugin marketplace add attentive-mobile/claude-plugins
/plugin install mobile-sdk-internal@attentive-marketplace
```

If you've previously added the marketplace but don't see `mobile-sdk-internal`, refresh the local cache first:

```
/plugin marketplace update attentive-marketplace
```

This keeps internal details out of the public SDK repo while letting Claude Code pull them in at runtime.

### Drafting a PR description

Once the `mobile-sdk-internal` plugin is installed, use its `write-pr` skill to draft PR descriptions that meet the mobile SDK team's expectations (verification with RN version coverage across iOS and Android, public API impact, host-app rollback):

```
/mobile-sdk-internal:write-pr           # new PR
/mobile-sdk-internal:write-pr --update  # update existing PR on this branch
```

The skill detects this repo from the git remote, confirms the base branch, reads the diff, and asks targeted questions before drafting. For this repo it will push on both JS API and native module/bridge changes, and on old- vs. new-architecture coverage where relevant.

## What this package is

`@attentive-mobile/attentive-react-native-sdk` is a React Native wrapper around Attentive's native iOS and Android SDKs. It exposes a TypeScript API (creatives, events, identify, push, marketing subscriptions) and bridges each call to the corresponding native SDK.

## Repository layout

| Path | What's there |
|---|---|
| `src/index.tsx` | Public TypeScript API — the thin layer consumers import. Each function forwards to the native module. |
| `src/NativeAttentiveReactNativeSdk.ts` | The TurboModule **codegen spec** (`interface Spec extends TurboModule`). Adding/changing a native method starts here. Includes the old-architecture `NativeModules` fallback. |
| `src/eventTypes.tsx` | Public types (`AttentiveSdkConfiguration`, `UserIdentifiers`, `Item`, `Purchase`, etc.). |
| `ios/` | Swift bridging layer (e.g. `AttentiveSDKManager`, `ATTNNativeSDK`) over `attentive-ios-sdk`. |
| `android/src/main/kotlin/com/attentivereactnativesdk/` | Kotlin TurboModule (`AttentiveReactNativeSdkModule.kt`, `AttentiveReactNativeSdkPackage.kt`, push + debug helpers) over `attentive-android-sdk`. |
| `Bonni/` | The example / test-harness app. Use it to exercise changes on a real app on both platforms. |
| `plugin/src/` + `app.plugin.js` | Expo config plugin: injects the Android native init into CNG apps' generated `MainApplication.kt` at prebuild (exists because of the init asymmetry below). Compiles to `plugin/build/` (gitignored, shipped) via `npm run build:plugin`; imports **only** from `expo/config-plugins` (never `@expo/config-plugins` — pnpm phantom dep); tests in `plugin/src/__tests__` run in the main jest suite. |
| `lib/` | Build output from `react-native-builder-bob` — generated, do not edit by hand. |
| `docs/` | `PUSH_NOTIFICATIONS_INTEGRATION.md`, `PUSH_NOTIFICATIONS_SETUP.md`. |
| Root docs | `README.md` (consumer reference), `DEBUGGING.md`, `MIGRATION_GUIDE.md`, `AGENTS.md` (consumer agent guide). |
| `attentive-react-native-sdk.podspec` | iOS pod definition; pins the native `attentive-ios-sdk` dependency. |

## Architecture

- The native module is a **TurboModule** generated via codegen (`codegenConfig` in `package.json`: spec name `AttentiveReactNativeSdkSpec`, Android package `com.attentivereactnativesdk`). It also works on the old architecture through the `NativeModules` fallback in `NativeAttentiveReactNativeSdk.ts`.
- Bridge data crosses as flat scalars (codegen limitation): e.g. on event payloads `price`/`currency` are flat fields on each item and `orderId` is a flat arg, not nested objects. Keep new native method signatures flat-friendly.

## Critical invariant — initialization is asymmetric

**iOS initializes from TypeScript; Android initializes in native code.** The TypeScript `initialize()` (`src/index.tsx`) forwards to the native module, but the Android implementation's `initialize()` is an **intentional no-op** (`AttentiveReactNativeSdkModule.kt`, ~lines 59–98) — it only wires the debug helper. On Android the SDK must be initialized by the host app in `Application.onCreate()` via `AttentiveSdk.initialize(AttentiveConfig…)`, because lifecycle observers must register on the main thread before the RN bridge is ready. `Bonni/android/app/src/main/java/com/bonni/MainApplication.kt` is the canonical example.

Do not "fix" the Android `initialize()` to actually initialize the SDK without understanding this — it would break main-thread / early-lifecycle guarantees. Keep `README.md`, `AGENTS.md`, and the `src/index.tsx` JSDoc consistent with this behavior whenever you touch initialization.

## Common commands

```bash
npm run build      # bundle with react-native-builder-bob -> lib/
npm test           # jest (tests live under src/)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint over src/**/*.{js,ts,tsx}
```

Code style is enforced by Prettier (single quotes, no semicolons, 2-space, trailing commas es5) via the ESLint config in `package.json` — match it.

## Testing changes

Use the `Bonni/` app to validate end-to-end on a device/simulator. For Android changes, remember the native init lives in Bonni's `MainApplication.kt`; for iOS, init flows from Bonni's `App.tsx`. CI runs build, typecheck, lint, and tests for the SDK and Bonni — make sure those pass locally before pushing.

## Linking the SDK from a local checkout (testing / contributors)

This is for **testing the SDK by linking this checkout into a separate host app** (e.g. a throwaway RN app, or a monorepo). It is **not** something published-package consumers need — so it lives here, not in `AGENTS.md`. Real clients install `@attentive-mobile/attentive-react-native-sdk` from npm and never hit any of this.

Install the local checkout into the host app via a path dependency:

```bash
npm install file:../attentive-react-native-sdk    # adjust the relative path
```

**Why a Metro tweak is then required.** `package.json` points the `react-native` and `source` fields at `src/index` (TypeScript source), so when the host app bundles, Metro pulls in this repo's **source** and crawls its `node_modules` — which contains a version-skewed `react-native@0.75.5` (a devDependency, see `package.json`). Two copies of `react-native` in the graph cause a **Metro Haste module-name collision**, and the SDK can bind against the wrong React Native. (npm consumers never see this: the published tarball excludes `node_modules` — see the `files` array in `package.json`.)

Fix it in the **host app's** `metro.config.js`: watch this folder, block its nested `node_modules`, and funnel shared deps to the host app's copy.

```js
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Adjust to wherever this SDK checkout lives relative to the host app.
const sdkRoot = path.resolve(__dirname, '../attentive-react-native-sdk');
const escaped = sdkRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  watchFolders: [sdkRoot],
  resolver: {
    blockList: [
      defaultConfig.resolver.blockList,
      new RegExp(`^${escaped}/node_modules/.*$`),
    ].filter(Boolean),
    extraNodeModules: new Proxy(
      {},
      {
        get: (_t, name) =>
          typeof name === 'string' ? path.join(__dirname, 'node_modules', name) : undefined,
      }
    ),
  },
});
```

Revert the host app's `metro.config.js` to its default once it consumes the published npm package instead of the local link.

## When adding or changing a native method

1. Update the spec in `src/NativeAttentiveReactNativeSdk.ts`.
2. Add the JS wrapper + types in `src/index.tsx` / `src/eventTypes.tsx`.
3. Implement on both platforms: `android/src/main/kotlin/com/attentivereactnativesdk/AttentiveReactNativeSdkModule.kt` and the `ios/` bridging layer.
4. Rebuild (`npm run build`) and exercise it in `Bonni/`.
5. If it changes the consumer integration steps, update `README.md` **and** `AGENTS.md`.
