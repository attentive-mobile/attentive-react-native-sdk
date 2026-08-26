package com.attentivereactnativesdk

import android.content.Context
import android.widget.FrameLayout
import com.attentive.androidsdk.inbox.AttentiveInboxView

/**
 * React Native host for the Attentive Android SDK's drop-in inbox UI.
 *
 * The SDK's `AttentiveInboxView` is an `AbstractComposeView`, and Compose cannot create a
 * composition for a view with no window: `onMeasure` -> `ensureCompositionCreated` ->
 * `resolveParentCompositionContext` -> `getWindowRecomposer` throws
 * `IllegalStateException: Cannot locate windowRecomposer`. Fabric measures views while mounting
 * them, before they are attached (`SurfaceMountingManager.updateLayout` -> `View.measure`), so
 * handing the Compose view straight to Fabric brings down the RN host. It reproduces by navigating
 * to a screen that contains the inbox — pushing Bonni's inbox screen raised the exception seven
 * times and killed the surface.
 *
 * Hence this wrapper, the Android counterpart of the iOS component's lazy attach in
 * `didMoveToWindow`. Three details, each established by A/B-ing them on a device:
 *
 *  1. [onMeasure] skips children while detached. This is the actual fix: it is what lets Fabric
 *     measure a not-yet-attached host safely.
 *  2. The Compose child is created **eagerly**, here in the constructor. Creating it lazily in
 *     `onAttachedToWindow` also avoids the crash, but the composition then stays empty forever —
 *     correct view bounds, no content drawn, no touch handling, an empty semantics tree. Compose
 *     has to own the attach dispatch of its own view, so the child must exist before the host
 *     attaches.
 *  3. [requestLayout] posts an explicit measure/layout pass, because RN's own parents no-op
 *     `onLayout` ("layout is handled by UIManager") and would otherwise never lay out a non-RN
 *     child. `onAttachedToWindow` triggers one too, to replace the measure skipped by (1).
 *
 * Nothing needs disposing: `AbstractComposeView` drops its composition when it leaves the window,
 * and the child's lifetime is the host's. Deliberately no `onDropViewInstance` cleanup — under
 * `ReactNativeFeatureFlags.enableViewRecycling()` a host can be handed back out of RN's recycle
 * pool, and a host that had its child removed would come back empty per (2).
 */
class AttentiveInboxHostView(context: Context) : FrameLayout(context) {

    init {
        addView(
            AttentiveInboxView(context),
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
        )
    }

    private val measureAndLayout = Runnable {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
        )
        layout(left, top, right, bottom)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        // The measure that arrived while detached was skipped, so ask for a real one.
        requestLayout()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        if (!isAttachedToWindow) {
            // Never let the Compose child be measured off-window — that is the crash. Report the
            // size Fabric asked for and leave the real pass to onAttachedToWindow.
            setMeasuredDimension(
                MeasureSpec.getSize(widthMeasureSpec),
                MeasureSpec.getSize(heightMeasureSpec),
            )
            return
        }
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }

    override fun requestLayout() {
        super.requestLayout()
        post(measureAndLayout)
    }
}
