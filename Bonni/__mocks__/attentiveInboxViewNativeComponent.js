/**
 * Stub for the SDK's inbox native component.
 *
 * `AttentiveInboxViewNativeComponent` calls `codegenNativeComponent` at module scope, so it
 * reaches the bridge at **require** time rather than render time: importing the SDK's public API
 * at all throws "__fbBatchedBridgeConfig is not set" under Jest, before a test renders anything.
 *
 * This is wired through `moduleNameMapper` rather than `jest.mock` in `jest.setup.js`, because
 * `jest.mock` from `setupFiles` does not intercept these requires — the mapper is applied by the
 * resolver, so it cannot be missed.
 *
 * A string stands in for the component: React treats a string element type as a host component,
 * which is what the real codegen export behaves like when rendered.
 */
module.exports = { __esModule: true, default: 'AttentiveInboxView' }
