package com.attentivereactnativesdk.debug

import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Data class representing a debug event with timestamp and formatting capabilities.
 * 
 * @param eventType The type/name of the event
 * @param data The event data as a map
 */
data class DebugEvent(
    val eventType: String,
    val data: Map<String, Any?>
) {
    val timestamp: Long = System.currentTimeMillis()

    /**
     * Returns formatted time string for display.
     */
    fun getFormattedTime(): String {
        val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        return formatter.format(Date(timestamp))
    }

    /**
     * Generates a summary string with key information from the event data.
     */
    fun getSummary(): String {
        val summaryParts = mutableListOf<String>()

        data["items_count"]?.let { summaryParts.add("Items: $it") }
        data["order_id"]?.let { summaryParts.add("Order: $it") }
        data["creativeId"]?.let { summaryParts.add("Creative: $it") }
        data["event_type"]?.let { summaryParts.add("Type: $it") }

        // Always show payload size info
        summaryParts.add("Payload: ${data.size} fields")

        return summaryParts.joinToString(" • ")
    }

    /**
     * Formats the debug event as a human-readable string for export.
     * @return A formatted string containing timestamp, event type, and data
     */
    fun formatForExport(): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault())
        val timeString = formatter.format(Date(timestamp))

        return buildString {
            appendLine("[$timeString] $eventType")

            // Add summary information if available
            val summary = getSummary()
            if (summary.isNotEmpty()) {
                appendLine("Summary: $summary")
            }

            appendLine("Data:")

            // Format data as JSON for better readability
            try {
                val jsonObject = JSONObject(data)
                appendLine(jsonObject.toString(2))
            } catch (e: Exception) {
                appendLine(data.toString())
            }

            appendLine("=".repeat(50))
        }
    }

}
