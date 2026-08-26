package com.attentivereactnativesdk

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Hosts the Attentive Android SDK's drop-in inbox UI ("default renderer") as a React Native view.
 *
 * On Android a Fabric component's platform half *is* a `ViewManager` — the C++ side (shadow node,
 * props, component descriptor) comes from codegen off `AttentiveInboxViewNativeComponent.ts`, and
 * `SimpleViewManager` is the leaf-view base RN's own Fabric components use. The view is a leaf on
 * purpose: the SDK owns its children, so RN must never insert into it.
 *
 * What is managed here is [AttentiveInboxHostView], not the SDK's Compose view directly — see that
 * class for why handing an `AbstractComposeView` straight to Fabric crashes the RN host.
 *
 * The inbox bootstraps itself: on first composition it calls `AttentiveSdk.initializeInbox()`,
 * which kicks off the first-page fetch, and registers the `ON_RESUME` observer that refreshes on
 * foreground. Pull-to-refresh and pagination are internal to it too, so there is nothing to drive
 * from JS.
 *
 * No props yet — see `AttentiveInboxViewNativeComponent.ts` for why. When theming props land
 * (MSDK-480) this should also implement the generated `AttentiveInboxViewManagerInterface` and
 * return an `AttentiveInboxViewManagerDelegate` from `getDelegate()`, so codegen compile-checks
 * setter coverage instead of falling back to reflection. Message taps are currently not observable
 * at all from the View wrapper (MSDK-478).
 */
class AttentiveInboxViewManager : SimpleViewManager<AttentiveInboxHostView>() {

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): AttentiveInboxHostView =
        AttentiveInboxHostView(reactContext)

    companion object {
        const val REACT_CLASS = "AttentiveInboxView"
    }
}
