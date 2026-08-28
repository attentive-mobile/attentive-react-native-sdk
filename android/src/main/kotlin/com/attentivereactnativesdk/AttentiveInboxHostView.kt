package com.attentivereactnativesdk

import android.content.Context
import android.widget.FrameLayout
import androidx.annotation.ColorInt
import androidx.annotation.ColorRes
import androidx.core.content.ContextCompat
import com.attentive.androidsdk.R as SdkR
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
 *
 * ## Theming
 *
 * The colour setters below forward straight to the child, whose backing fields are
 * `mutableStateOf`, so a change recomposes without touching the view tree. Each one takes a
 * nullable colour and substitutes the SDK's own `R.color.attentive_inbox_*` default when null —
 * that is what makes unsetting a prop restore the default instead of keeping the last value, which
 * matters precisely because of the recycling note above: a recycled host must not inherit the
 * previous screen's theme. Reading the defaults from the SDK's resources (rather than hardcoding
 * them here) keeps us honest if the SDK restyles.
 */
class AttentiveInboxHostView(context: Context) : FrameLayout(context) {

    private val inbox = AttentiveInboxView(context)

    init {
        addView(inbox, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
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

    fun setUnreadIndicatorColor(@ColorInt color: Int?) {
        inbox.setUnreadIndicatorColor(color ?: default(SdkR.color.attentive_inbox_unread_indicator))
    }

    fun setTitleTextColor(@ColorInt color: Int?) {
        inbox.setTitleTextColor(color ?: default(SdkR.color.attentive_inbox_title_text))
    }

    fun setBodyTextColor(@ColorInt color: Int?) {
        inbox.setBodyTextColor(color ?: default(SdkR.color.attentive_inbox_body_text))
    }

    fun setTimestampTextColor(@ColorInt color: Int?) {
        inbox.setTimestampTextColor(color ?: default(SdkR.color.attentive_inbox_timestamp_text))
    }

    fun setSwipeBackgroundColor(@ColorInt color: Int?) {
        inbox.setSwipeBackgroundColor(color ?: default(SdkR.color.attentive_inbox_swipe_background))
    }

    @ColorInt
    private fun default(@ColorRes id: Int): Int = ContextCompat.getColor(context, id)
}
