package com.attentivereactnativesdk.debug

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Kotlin-based debug helper for the Attentive React Native SDK.
 * 
 * This class provides comprehensive debugging capabilities including:
 * - Session history tracking
 * - Debug overlay with tabbed interface
 * - Export and share functionality
 * - Real-time debug information display
 */
class AttentiveDebugHelper(private val reactContext: ReactApplicationContext) {
    
    companion object {
        private const val TAG = "AttentiveDebugHelper"
    }

    private val debugHistory = mutableListOf<DebugEvent>()
    private var isDebuggingEnabled = false
    
    /**
     * Returns whether debugging is currently enabled.
     * Provides explicit getter method for Java interop.
     */
    fun isDebuggingEnabled(): Boolean = isDebuggingEnabled

    /**
     * Initializes debugging based on configuration and build type.
     * 
     * @param enableDebuggerFromConfig Whether debugging is enabled in configuration
     */
    fun initialize(enableDebuggerFromConfig: Boolean) {
        val isDebugBuild = (reactContext.applicationInfo.flags and 
            android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
        isDebuggingEnabled = enableDebuggerFromConfig && isDebugBuild
        
        Log.i(TAG, "Debug initialization - enableDebuggerFromConfig: $enableDebuggerFromConfig, " +
                "isDebugBuild: $isDebugBuild, debuggingEnabled: ${isDebuggingEnabled()}")
    }

    /**
     * Shows debug information by adding to history and displaying the debug dialog.
     * 
     * @param event The event name/type
     * @param data The event data
     */
    fun showDebugInfo(event: String, data: Map<String, Any?>) {
        if (!isDebuggingEnabled()) return
        
        Log.i(TAG, "showDebugInfo called for event: $event, data: $data")

        // Add to debug history
        val debugEvent = DebugEvent(event, data)
        debugHistory.add(debugEvent)

        val currentActivity = reactContext.currentActivity
        if (currentActivity != null) {
            Log.i(TAG, "Current activity found, showing debug dialog on UI thread")
            UiThreadUtil.runOnUiThread {
                showDebugDialog(currentActivity, event, data)
            }
        } else {
            Log.w(TAG, "Current activity is null, cannot show debug dialog")
        }
    }

    /**
     * Manually invokes the debug helper overlay.
     * Shows existing debug session data without adding to history.
     */
    fun invokeDebugHelper() {
        Log.i(TAG, "invokeDebugHelper called - isDebuggingEnabled: ${isDebuggingEnabled()}")
        
        if (!isDebuggingEnabled()) {
            Log.w(TAG, "Debug helper not invoked because debugging is not enabled")
            return
        }
        
        val currentActivity = reactContext.currentActivity
        Log.i(TAG, "Current activity: $currentActivity")
        
        if (currentActivity != null) {
            Log.i(TAG, "Activity is available, running on UI thread")
            UiThreadUtil.runOnUiThread {
                val debugData = mapOf(
                    "action" to "manual_debug_call",
                    "session_events" to debugHistory.size.toString()
                )
                Log.i(TAG, "About to show debug dialog")
                showDebugDialog(currentActivity, "Manual Debug View", debugData)
            }
        } else {
            Log.w(TAG, "Current activity is null, cannot show debug dialog")
        }
    }

    /**
     * Exports the current debug session logs as a formatted string.
     * @return A comprehensive formatted string containing all debug events in the current session
     */
    fun exportDebugLogs(): String {
        if (!isDebuggingEnabled()) {
            return "Debug logging is not enabled. Please enable debugging to export logs."
        }

        if (debugHistory.isEmpty()) {
            return "No debug events recorded in this session."
        }

        val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val exportDate = formatter.format(Date())

        return buildString {
            appendLine("Attentive React Native SDK - Debug Session Export")
            appendLine("Generated: $exportDate")
            appendLine("Total Events: ${debugHistory.size}")
            appendLine()
            appendLine("=".repeat(60))
            appendLine()

            // Add all events in chronological order (oldest first for better readability)
            debugHistory.forEachIndexed { index, event ->
                appendLine("Event #${index + 1}")
                append(event.formatForExport())
                appendLine()
            }

            appendLine("=".repeat(60))
            append("End of Debug Session Export")
        }
    }

    /**
     * Shares debug logs using the Android share intent.
     * @param context The current activity context
     * @param content The content to share
     */
    private fun shareDebugLogs(context: Activity, content: String) {
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, content)
            putExtra(Intent.EXTRA_SUBJECT, "Attentive React Native SDK - Debug Session Export")
        }

        val chooser = Intent.createChooser(shareIntent, "Share Debug Logs")
        if (shareIntent.resolveActivity(context.packageManager) != null) {
            context.startActivity(chooser)
        }
    }

    /**
     * Creates and displays the comprehensive debug overlay with tabbed interface.
     * Features:
     * - Current event details
     * - Session history with chronological listing
     * - Export/share functionality
     * - Material Design styling with rounded corners and proper spacing
     */
    private fun showDebugDialog(activity: Activity, currentEvent: String, currentData: Map<String, Any?>) {
        Log.i(TAG, "showDebugDialog called for event: $currentEvent")

        // Get the root view of the current activity to add our overlay directly
        val rootView = activity.window.decorView.rootView as ViewGroup
        Log.i(TAG, "Root view obtained: $rootView")

        // Create custom view for tabbed interface - this will be added directly to the activity
        val mainLayout = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
            setBackgroundColor(Color.TRANSPARENT) // Completely transparent background
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Create content container that will be positioned at bottom
        val contentContainer = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFFFFFFFF.toInt())
            setPadding(24, 24, 24, 24)

            // Round corners with discrete outline border
            val background = GradientDrawable().apply {
                setColor(0xFFFFFFFF.toInt()) // White background
                cornerRadius = 24f // Rounded corners
                setStroke(2, 0xFFE0E0E0.toInt()) // Discrete light gray border (2dp width)
            }
            setBackground(background)
        }

        // Header with title, share button, and close button
        val headerLayout = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val titleText = TextView(activity).apply {
            text = "🐛 Attentive Debug Session"
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.BLACK)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        headerLayout.addView(titleText)

        // Share button - Material Design share icon, circular
        val shareButton = createCircularButton(activity, "↗", 0xFF1976D2.toInt(), 0xFFF0F0F0.toInt()).apply {
            layoutParams = LinearLayout.LayoutParams(72, 72).apply {
                setMargins(0, 0, 20, 0)
            }
        }
        headerLayout.addView(shareButton)

        // Close button - circular with prominent X and destructive styling
        val closeButton = createCircularButton(activity, "×", 0xFFD32F2F.toInt(), 0xFFFFF0F0.toInt()).apply {
            textSize = 32f
            layoutParams = LinearLayout.LayoutParams(72, 72)
        }
        headerLayout.addView(closeButton)

        contentContainer.addView(headerLayout)

        // Tab buttons
        val tabLayout = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 20, 0, 0)
        }

        val currentTab = Button(activity).apply {
            text = "Current Event"
            setTextColor(Color.BLACK)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val historyTab = Button(activity).apply {
            text = "History (${debugHistory.size})"
            setTextColor(Color.BLACK)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        tabLayout.addView(currentTab)
        tabLayout.addView(historyTab)
        contentContainer.addView(tabLayout)

        // Content area
        val contentScroll = ScrollView(activity)
        val contentText = TextView(activity).apply {
            typeface = Typeface.MONOSPACE
            textSize = 12f
            setTextColor(0xFF333333.toInt()) // Dark gray text for better readability
            setPadding(0, 20, 0, 0)
        }
        contentScroll.addView(contentText)

        // Make content area larger to fill most of the screen
        contentScroll.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        )
        contentContainer.addView(contentScroll)

        // Position content container at bottom with minimum height (55% of screen - slightly shorter)
        val displayMetrics = DisplayMetrics()
        activity.windowManager.defaultDisplay.getMetrics(displayMetrics)
        val screenHeight = displayMetrics.heightPixels
        val minHeight = (screenHeight * 0.55).toInt() // 55% of screen height - slightly shorter

        contentContainer.apply {
            minimumHeight = minHeight
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.BOTTOM
            }
        }

        Log.i(TAG, "Debug overlay minimum height set to: ${minHeight}px (55% of ${screenHeight}px)")

        // Add spacer to push content to bottom
        val spacer = View(activity).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
            )
        }
        mainLayout.addView(spacer)
        mainLayout.addView(contentContainer)

        // Set initial content to current event
        updateCurrentEventContent(contentText, currentEvent, currentData)

        // Tab click listeners
        currentTab.setOnClickListener {
            updateCurrentEventContent(contentText, currentEvent, currentData)
            currentTab.isEnabled = false
            historyTab.isEnabled = true
        }

        historyTab.setOnClickListener {
            updateHistoryContent(contentText)
            currentTab.isEnabled = true
            historyTab.isEnabled = false
        }

        // Set initial tab state
        currentTab.isEnabled = false
        historyTab.isEnabled = true

        // Setup share button to export and share debug logs
        shareButton.setOnClickListener {
            val exportContent = exportDebugLogs()
            shareDebugLogs(activity, exportContent)
        }

        // Setup close button to remove the overlay from the root view
        closeButton.setOnClickListener {
            rootView.removeView(mainLayout)
        }

        // Add the overlay directly to the activity's root view
        rootView.addView(mainLayout)
        Log.i(TAG, "Debug overlay added to root view successfully")

        // Note: No auto-dismiss to match iOS behavior - overlay stays until user closes it
    }

    /**
     * Creates a circular button with specified text, colors, and styling.
     */
    private fun createCircularButton(activity: Activity, text: String, textColor: Int, backgroundColor: Int): Button {
        return Button(activity).apply {
            this.text = text
            textSize = 28f
            setTextColor(textColor)
            setBackgroundColor(backgroundColor)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            includeFontPadding = false
            minWidth = 0
            minHeight = 0
            minimumWidth = 0
            minimumHeight = 0
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setSingleLine(true)
            setLines(1)
            setPadding(0, -20, 0, 8)

            val drawable = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(backgroundColor)
                setStroke(3, textColor)
            }
            background = drawable
        }
    }

    /**
     * Updates the content text view with current event information.
     */
    private fun updateCurrentEventContent(contentText: TextView, event: String, data: Map<String, Any?>) {
        val content = buildString {
            appendLine("Event: $event")
            appendLine()

            try {
                val jsonObject = JSONObject(data)
                append(jsonObject.toString(2))
            } catch (e: Exception) {
                append("Data: $data")
            }
        }

        contentText.text = content
    }

    /**
     * Updates the content text view with session history information.
     */
    private fun updateHistoryContent(contentText: TextView) {
        if (debugHistory.isEmpty()) {
            contentText.text = "No events recorded in this session yet."
            return
        }

        val content = buildString {
            appendLine("Session History (${debugHistory.size} events):")
            appendLine()

            // Show events in reverse order (newest first)
            debugHistory.asReversed().forEach { event ->
                appendLine("───────────────────────────────")
                appendLine("[${event.getFormattedTime()}] ${event.eventType}")

                // Add summary
                val summary = event.getSummary()
                if (summary.isNotEmpty()) {
                    appendLine("Summary: $summary")
                }

                appendLine()
                appendLine("Payload:")
                try {
                    val jsonObject = JSONObject(event.data)
                    appendLine(jsonObject.toString(2))
                } catch (e: Exception) {
                    appendLine(event.data.toString())
                }
                appendLine()
                appendLine()
            }
        }

        contentText.text = content
    }
}
