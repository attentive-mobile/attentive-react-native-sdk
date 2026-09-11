

# [2.2.0-beta.1](https://github.com/attentive-mobile/attentive-react-native-sdk/compare/2.1.0...2.2.0-beta.1) (2026-09-11)


### Bug Fixes

* **bonni:** refresh iOS release metadata ([dd81682](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/dd81682686843cc7e6394fa3e29deb4bb4828dd8))
* **bonni:** sequence SDK startup and gate push setup on pushEnabled ([d0df381](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/d0df381dbb858f9fb1e28544402602a6b9ca4a56)), closes [#102](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/102)
* **bonni:** stop Clear User button from calling clearUser() twice ([3b242e6](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/3b242e6e186dae60deafaddbd63546621983e165))
* **ci:** address PR [#90](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/90) review — signing, shell injection, gating ([ea5a706](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/ea5a706cc78ba7793d812ae7141fbf67c1fdbb44))
* **ci:** bump Android deploy executor to xlarge for RN native build ([1a4a5c8](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/1a4a5c89e80e29f568d36f48b0f3629569b8994c))
* **ci:** drop stray space in Firebase --groups alias list ([535b858](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/535b85897a3a5d0ece9030ab861e442892772432))
* **ci:** drop unused APPLE_ID from Bonni iOS Matchfile ([909e341](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/909e34128161b427e77c235f76c412153397174a))
* **ci:** gate Android Bonni distribution + harden versionCode check ([bb85004](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/bb85004e387d8d76f8d1e144b4373238177b9e82)), closes [#90](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/90)
* **ci:** hard-fail Android Bonni distribution on missing signing vars ([55893cd](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/55893cd456b83b0624b805cf5258a26954cfdb16))
* **ci:** harden release input handling ([5213c3f](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/5213c3fc98723f86b0f7c4bc5ac632f76e8a0d89))
* **ci:** harden release job post-publish failure and Slack posts ([cd8a63c](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/cd8a63c1ddc4dd1b50d9fface44371dc9c3e96db)), closes [#89](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/89)
* **ci:** honor operator release notes, else fall back to changelog ([84ba399](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/84ba3990703865fbfea5208dd6cb6f744e407b07))
* **ci:** make Bonni deploy manual across platforms ([241424d](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/241424d4e47ccfadc31736a3f24c2ce54ef813d2))
* **ci:** normalize empty release_notes "<nil>" from CircleCI ([394a08a](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/394a08a4790e23ba66ae7562a497b3a0de9d1d6a))
* **ci:** skip release-it's GitHub pre-flight checks for the App token ([85a8dc2](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/85a8dc27f2e209b86d54339a2ac16b402b472eb9))
* **ci:** unblock Bonni deploy — align iOS Ruby + fix Android OOM ([8a88654](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/8a8865440f4cb136273cb0a42dfc081fabee4ae8))
* **ci:** untrack yarn.lock so npm ci leaves a clean tree ([1c59c43](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/1c59c4363b5426bfbf771a6d2836a151e3846b8f))
* **ci:** use bare AWS_REGION in aws-cli/setup (match iOS) ([64d16ab](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/64d16ab40f52b37247f56bb2580ff1caac976c6a))
* **creatives:** address PR review on the lifecycle event stream ([47a76eb](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/47a76eb4e1df1d3e9a048770d26f65f0733c1786))
* **creatives:** close event-stream gaps found in review ([16f2c52](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/16f2c5238fe45d5ad6db37955b594233ffc3caf2))
* **creatives:** second review round from [@adelag-attentive](https://github.com/adelag-attentive) ([1ba45ce](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/1ba45ce69c62bf6c0fd16b8e945f89f20f7e8516))
* **expo:** resolve expo/config-plugins from the app root when hoisted apart ([8b58aa2](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/8b58aa2e3857f20201cbbb32547ab59adfc23ab5))
* **expo:** resolve mergeContents compatibly across Expo SDK 50-57 ([dafaafb](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/dafaafba1241f511feabc7d6ecaea3bba2ec54a1)), closes [#94](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/94)
* **expo:** strip generated blocks when deferring to a manual integration ([2593f27](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/2593f27eacba7b03b8327ca4a476cd0aa79e8a40)), closes [#94](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/94)
* **expo:** validate plugin props, escape Kotlin literals, detect manual ([0d89f56](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/0d89f56b6b499414ea56930d3bf449230959cebf)), closes [#94](https://github.com/attentive-mobile/attentive-react-native-sdk/issues/94)
* **inbox:** close the availability race the main-queue hop opened on iOS ([94417f5](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/94417f5852d437a21bf0c3c8f20569a1a86389c3))
* **inbox:** make the iOS unread-count path settle, thread-safe, and recoverable ([87db7c6](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/87db7c60e5cb17dcb2b773d914af81db37b6b08c))
* **inbox:** native delivery and lifecycle fixes for the inbox bridge ([f9348f8](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/f9348f8f9e7e3c42274556bf49c39f8abe7bc32d))
* **inbox:** restart a dead collector and reset a recycled host's theme ([b32a1fe](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/b32a1fe573dc89ad011a689d6241aaf6530d3034))
* use prepare ([8648a27](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/8648a27957c36a2107810eb41937346f1deecdfa))


### Features

* add pushEnabled flag to SDK initialization ([9244e2f](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/9244e2f2115fedb0e3cb507d029b947145ab4666))
* **creatives:** expose creative lifecycle events to JS ([a4153cd](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/a4153cd61bd746f972c3b56a7b73c28819887ddb))
* **expo:** add config plugin for Android native initialization (MSDK-404) ([e84043d](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/e84043ddd52c1245242ac6fa52febb5ddce62143))
* **inbox:** add the iOS inbox component, its theming, and a device-buildable Bonni ([a8315e4](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/a8315e48fa359518a5a7299cb5c9b7a18cfebeb5))
* **inbox:** bridge the unread count and show a badge ([4eb1537](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/4eb15372b7bd0bfa32d1364766c070491cb8025d)), closes [attentive-android-sdk#268](https://github.com/attentive-android-sdk/issues/268)
* **inbox:** expose the Android default renderer as <AttentiveInboxView /> ([53c6d50](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/53c6d507ee3db6331c1e6cd684e519233a39d428))
* **inbox:** route inbox deep links in Bonni on both platforms ([724bbd2](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/724bbd2547b42dc074d54b33bb09ff841bf151af))
* **inbox:** theming props for the Android inbox default renderer ([dc7fb0e](https://github.com/attentive-mobile/attentive-react-native-sdk/commit/dc7fb0e6ce39630bc3651cee55bef07450de368e))