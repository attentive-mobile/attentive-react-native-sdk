package com.attentivereactnativesdk

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class AttentiveInboxMessageTapEvent(
    surfaceId: Int,
    viewTag: Int,
    private val messageId: String,
    private val actionUrl: String?,
) : Event<AttentiveInboxMessageTapEvent>(surfaceId, viewTag) {

    override fun getEventName(): String = EVENT_NAME

    public override fun getEventData(): WritableMap =
        Arguments.createMap().apply {
            putString("messageId", messageId)
            putString("actionUrl", actionUrl ?: "")
        }

    internal companion object {
        /**
         * Native event name. The `top` prefix is what RN's Android event plumbing strips to reach
         * the `onMessageTap` prop;
         */
        const val EVENT_NAME = "topMessageTap"
    }
}
