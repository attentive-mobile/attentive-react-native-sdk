package com.attentivereactnativesdk

import com.attentive.androidsdk.TrackingConsent

/**
 * Maps the RN string to the native enum, matching exactly like the TS union. Returns null
 * for an unrecognised value so the caller can log it before falling back to
 * [TrackingConsent.UNSPECIFIED], which omits the field and leaves the backend's defaulting.
 */
internal fun parseTrackingConsent(raw: String?): TrackingConsent? =
    when (raw) {
        "ACCEPTED" -> TrackingConsent.ACCEPTED
        "DECLINED" -> TrackingConsent.DECLINED
        null, "UNSPECIFIED" -> TrackingConsent.UNSPECIFIED
        else -> null
    }
