package com.attentivereactnativesdk

import com.attentive.androidsdk.TrackingConsent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Unit tests for [parseTrackingConsent]: the three wire values and an omitted value map to the
 * native enum, and anything else returns null so the module logs it and sends no consent value.
 */
class TrackingConsentMappingTest {

    @Test
    fun `maps ACCEPTED and DECLINED to their native values`() {
        assertEquals(TrackingConsent.ACCEPTED, parseTrackingConsent("ACCEPTED"))
        assertEquals(TrackingConsent.DECLINED, parseTrackingConsent("DECLINED"))
    }

    @Test
    fun `maps UNSPECIFIED and an omitted value to UNSPECIFIED`() {
        assertEquals(TrackingConsent.UNSPECIFIED, parseTrackingConsent("UNSPECIFIED"))
        assertEquals(TrackingConsent.UNSPECIFIED, parseTrackingConsent(null))
    }

    @Test
    fun `returns null for unrecognised values, including other casings`() {
        listOf("DECLINE", "accepted", "Declined", "").forEach {
            assertNull("Expected null for \"$it\"", parseTrackingConsent(it))
        }
    }
}
