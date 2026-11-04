package com.attentivereactnativesdk

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import org.json.JSONArray
import org.json.JSONObject

internal fun JSONObject.toWritableMap(): WritableMap = Arguments.createMap().also { map ->
    keys().forEach { key ->
        when (val value = get(key)) {
            JSONObject.NULL -> map.putNull(key)
            is JSONObject -> map.putMap(key, value.toWritableMap())
            is JSONArray -> map.putArray(key, value.toWritableArray())
            is Boolean -> map.putBoolean(key, value)
            is Int -> map.putInt(key, value)
            is Number -> map.putDouble(key, value.toDouble())
            else -> map.putString(key, value.toString())
        }
    }
}

internal fun JSONArray.toWritableArray(): WritableArray = Arguments.createArray().also { array ->
    for (i in 0 until length()) {
        when (val value = get(i)) {
            JSONObject.NULL -> array.pushNull()
            is JSONObject -> array.pushMap(value.toWritableMap())
            is JSONArray -> array.pushArray(value.toWritableArray())
            is Boolean -> array.pushBoolean(value)
            is Int -> array.pushInt(value)
            is Number -> array.pushDouble(value.toDouble())
            else -> array.pushString(value.toString())
        }
    }
}
