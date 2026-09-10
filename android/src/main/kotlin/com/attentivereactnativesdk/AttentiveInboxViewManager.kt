package com.attentivereactnativesdk

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.AttentiveInboxViewManagerDelegate
import com.facebook.react.viewmanagers.AttentiveInboxViewManagerInterface

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
 * Props come in through the codegen-generated [AttentiveInboxViewManagerInterface] and
 * [AttentiveInboxViewManagerDelegate] rather than `@ReactProp` + reflection, so adding a prop to
 * the TypeScript spec without implementing it here is a compile error instead of a silent no-op.
 * `ColorValue` props arrive already processed as a nullable `Int`; null means "prop absent", which
 * the host view turns back into the SDK's default colour. Message taps are currently not
 * observable at all from the View wrapper.
 */
class AttentiveInboxViewManager :
    SimpleViewManager<AttentiveInboxHostView>(),
    AttentiveInboxViewManagerInterface<AttentiveInboxHostView> {

    private val delegate by lazy {
        AttentiveInboxViewManagerDelegate<AttentiveInboxHostView, AttentiveInboxViewManager>(this)
    }

    override fun getName(): String = REACT_CLASS

    override fun getDelegate(): ViewManagerDelegate<AttentiveInboxHostView> = delegate

    override fun createViewInstance(reactContext: ThemedReactContext): AttentiveInboxHostView =
        AttentiveInboxHostView(reactContext)

    /**
     * Clears the previous mount's theme before a pooled host is reused.
     *
     * Under `ReactNativeFeatureFlags.enableViewRecycling()` a dropped host goes into a per-surface
     * pool and is handed back here instead of through [createViewInstance]. Fabric then applies
     * only the props JS wrote for the new mount, so a colour set on the first screen and omitted
     * on the second is never overwritten and the recycled view keeps it. Resetting here — the last
     * point before `updateProperties` runs — means the new mount always starts from the SDK
     * defaults, whether the host is fresh or reused.
     *
     * This is deliberately not [prepareToRecycleView]: that hook can decline recycling by
     * returning null, and declining is a heavier decision than this needs.
     */
    override fun recycleView(
        reactContext: ThemedReactContext,
        view: AttentiveInboxHostView,
    ): AttentiveInboxHostView {
        view.resetTheme()
        return super.recycleView(reactContext, view)
    }

    override fun setUnreadIndicatorColor(view: AttentiveInboxHostView, value: Int?) {
        view.setUnreadIndicatorColor(value)
    }

    override fun setTitleTextColor(view: AttentiveInboxHostView, value: Int?) {
        view.setTitleTextColor(value)
    }

    override fun setBodyTextColor(view: AttentiveInboxHostView, value: Int?) {
        view.setBodyTextColor(value)
    }

    override fun setTimestampTextColor(view: AttentiveInboxHostView, value: Int?) {
        view.setTimestampTextColor(value)
    }

    override fun setSwipeBackgroundColor(view: AttentiveInboxHostView, value: Int?) {
        view.setSwipeBackgroundColor(value)
    }

    companion object {
        const val REACT_CLASS = "AttentiveInboxView"
    }
}
