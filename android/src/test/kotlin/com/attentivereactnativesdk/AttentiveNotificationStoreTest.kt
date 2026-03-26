package com.attentivereactnativesdk

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Unit tests for [AttentiveNotificationStore].
 *
 * Verifies the store's core contract:
 * - Starts empty.
 * - Accepts a payload via [AttentiveNotificationStore.setPendingInitialNotification].
 * - Returns the payload exactly once via [AttentiveNotificationStore.getAndClear].
 * - Clears the store after retrieval (subsequent calls return null).
 * - Replaces any previously stored value when set is called again.
 */
class AttentiveNotificationStoreTest {

    @After
    fun tearDown() {
        // Ensure no state leaks between tests.
        AttentiveNotificationStore.getAndClear()
    }

    @Test
    fun `getAndClear returns null when no notification has been set`() {
        val result = AttentiveNotificationStore.getAndClear()

        assertNull("Expected null when nothing was stored", result)
    }

    @Test
    fun `getAndClear returns the payload that was previously set`() {
        val payload = mapOf(
            "google.message_id" to "fcm-123",
            "title" to "Flash Sale",
            "body" to "40% off today only",
        )

        AttentiveNotificationStore.setPendingInitialNotification(payload)

        val result = AttentiveNotificationStore.getAndClear()

        assertEquals(payload, result)
    }

    @Test
    fun `getAndClear returns null on the second call after the first consumed the payload`() {
        val payload = mapOf("messageId" to "msg-1")
        AttentiveNotificationStore.setPendingInitialNotification(payload)

        // First retrieval — should return the payload.
        val firstResult = AttentiveNotificationStore.getAndClear()
        assertEquals(payload, firstResult)

        // Second retrieval — store should be cleared.
        val secondResult = AttentiveNotificationStore.getAndClear()
        assertNull("Store should be empty after first getAndClear", secondResult)
    }

    @Test
    fun `setPendingInitialNotification replaces any previously stored payload`() {
        val firstPayload = mapOf("title" to "First Notification")
        val secondPayload = mapOf("title" to "Second Notification", "body" to "Replacement")

        AttentiveNotificationStore.setPendingInitialNotification(firstPayload)
        AttentiveNotificationStore.setPendingInitialNotification(secondPayload)

        val result = AttentiveNotificationStore.getAndClear()

        assertEquals("Expected the second (replacement) payload", secondPayload, result)
    }

    @Test
    fun `store handles payloads with all standard FCM fields`() {
        val payload = mapOf(
            "google.message_id" to "0:1234%abc",
            "google.sent_time" to "1700000000000",
            "from" to "123456789",
            "collapse_key" to "com.bonni",
            "title" to "New Order",
            "body" to "Your order has shipped",
            "channelId" to "orders",
            "campaignId" to "camp-999",
        )

        AttentiveNotificationStore.setPendingInitialNotification(payload)
        val result = AttentiveNotificationStore.getAndClear()

        assertEquals(payload, result)
    }

    @Test
    fun `store handles empty payloads without throwing`() {
        val emptyPayload = emptyMap<String, String>()

        AttentiveNotificationStore.setPendingInitialNotification(emptyPayload)
        val result = AttentiveNotificationStore.getAndClear()

        assertEquals(emptyPayload, result)
    }
}
