/**
 * Device-event names shared verbatim with both native bridges.
 *
 * Each name is a three-way contract: this file, `ios/AttentiveReactNativeSdk.mm`, and
 * `android/src/main/kotlin/com/attentivereactnativesdk/AttentiveReactNativeSdkModule.kt`. A
 * mismatch on any one side does not fail loudly — the emit simply lands on a name nobody listens
 * to, so the feature goes silently dead (no creative events at all, or a badge that never
 * updates).
 *
 * `src/__tests__/eventNames.test.ts` reads both native files and asserts every name here appears
 * in them, which turns that silent runtime failure into a test failure. Add a name here and the
 * test tells you which native side is still missing it.
 *
 * Internal to the package: not re-exported from `src/index.tsx`, because the names are an
 * implementation detail of the bridge rather than something consumers should subscribe to
 * directly.
 */
export const DEVICE_EVENT_NAMES = {
  /** Creative lifecycle transitions (`opened`, `closed`, `notOpened`). */
  creativeEvent: 'AttentiveCreativeEvent',
  /** Inbox unread-count changes. */
  inboxUnreadCount: 'AttentiveInboxUnreadCount',
} as const
