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
            if (actionUrl != null) {
                putString("actionUrl", actionUrl)
            }
        }

    internal companion object {
        /** Native event name. See the class doc for why it is `top`-prefixed. */
        const val EVENT_NAME = "topMessageTap"
    }
}
