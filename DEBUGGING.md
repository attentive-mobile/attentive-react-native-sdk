# Debugging Features

The Attentive React Native SDK includes powerful debugging features to help developers understand what data is being sent and received by the SDK.

## Enabling Debugging

To enable debugging features, set the `enableDebugger` flag to `true` when initializing the SDK:

```typescript
import { Attentive, Mode } from '@attentive-mobile/attentive-react-native-sdk';

const config = {
  attentiveDomain: 'your-domain',
  mode: Mode.Debug,
  enableDebugger: true, // Enable debugging helpers
};

Attentive.initialize(config);
```

## Features

### 1. Automatic Debug Overlays

When debugging is enabled, the SDK will automatically show debug overlays when:

- **Creative is triggered**: Shows creative ID and trigger type
- **Events are recorded**: Shows event type, payload data, and metadata
  - Product View events
  - Add to Cart events
  - Purchase events
  - Custom events

### 2. Manual Debug Helper

You can manually invoke the debug helper at any time:

```typescript
Attentive.invokeAttentiveDebugHelper();
```

This will display current debug information and SDK state.

### 3. Enhanced Debug Overlay

The debug overlay now features:

#### **Session History Tracking**
- **Complete Session View**: All events from app start are tracked and viewable
- **Current Event Tab**: Shows the most recent event with full payload details
- **Session History Tab**: Chronological list of all events with timestamps
- **Event Count Display**: Shows total events recorded in session

#### **Improved User Experience**
- **Bottom Positioning**: Overlay positioned at bottom for easy content visibility
- **Larger Size**: 65% of screen height for better readability
- **Share Button**: Export and share debug logs using platform-specific share functionality
- **X Close Button**: Convenient close button in top-right corner
- **Auto-dismiss**: 8-second timeout for hands-free operation

#### **Rich Event Information**
- **Event Type**: The type of event or action performed
- **Full Payload Data**: Complete JSON representation of all data (even if empty)
- **Event Summaries**: Quick overview with key metrics (item counts, order IDs, etc.)
- **Timestamps**: Precise timing for each event in session
- **Tap-to-Detail**: Tap any historical event to see full payload (iOS)

## Platform-Specific Implementation

### iOS
- **Tabbed Interface**: Segmented control for switching between current event and history
- **Table View History**: Scrollable list with event summaries and detail drill-down
- **Modal Presentation**: Full-screen overlay positioned at bottom of screen
- **Native UI**: Uses iOS system fonts, colors, and design patterns
- **Share Integration**: Native iOS share sheet with ↗ symbol, supports all iOS sharing options

### Android
- **Custom Dialog**: Full-screen dialog with tab buttons for navigation
- **Scrollable Content**: Large content area for viewing event details
- **Material Design**: Follows Android design guidelines with proper spacing, destructive styling for close button, and discrete outline border
- **Bottom Positioning**: Positioned at bottom with rounded corners and persistent display (matches iOS behavior)
- **Share Integration**: Android share intent with ↗ Material Design share icon in large circular button (72dp), supports all Android sharing apps

## Example Usage

```typescript
// Initialize with debugging
const config = {
  attentiveDomain: 'games',
  mode: Mode.Debug,
  enableDebugger: true,
};
Attentive.initialize(config);

// Record an event - debug overlay will automatically appear
Attentive.recordProductViewEvent({
  items: [{
    productId: 'test-product',
    productVariantId: 'test-variant',
    price: { price: '29.99', currency: 'USD' },
  }],
});

// Manually show debug info
Attentive.invokeAttentiveDebugHelper();

// Export debug logs programmatically
const debugLogs = await Attentive.exportDebugLogs();
console.log(debugLogs);
```

## Debug Log Export and Sharing

The debug overlay includes built-in export functionality that allows developers to easily share debug information outside of their apps.

### Share Button Location

The share button is located in the top-right corner of the debug overlay, positioned to the left of the close button:

- **iOS**: Uses the ↗ symbol (native iOS share icon)
- **Android**: Uses the ↗ symbol in a large circular button (72dp) with perfect glyph centering and optimal spacing (Material Design share icon)

### Share Functionality

When the share button is tapped:

1. **All debug events** from the current session are exported in a structured format
2. **Platform-specific sharing** is triggered:
   - **iOS**: Native share sheet with options for Messages, Mail, AirDrop, Files, etc.
   - **Android**: Android share intent with options for Email, Messaging, Drive, etc.

### Export Format

The exported logs include:
- **Session metadata**: Export timestamp, total event count
- **Event details**: Timestamp, event type, summary, and full JSON payload
- **Structured formatting**: Easy-to-read format suitable for analysis or support

### Programmatic Export

For advanced use cases, logs can also be exported programmatically:

```typescript
try {
  const debugLogs = await Attentive.exportDebugLogs();
  // Process or share the logs as needed
  console.log('Debug logs exported:', debugLogs.length, 'characters');
} catch (error) {
  console.error('Failed to export debug logs:', error);
}
```

### Individual Event Sharing

When viewing individual event details (iOS), each event detail view also includes a share button for exporting single events.

## Production Considerations

- Always set `enableDebugger: false` or omit it entirely in production builds
- Debug overlays only appear when `enableDebugger: true`
- No performance impact when debugging is disabled
- Debug information is not logged or persisted

## Development Tips

1. **Use in Debug Mode**: Combine with `mode: Mode.Debug` for comprehensive debugging
2. **Test All Events**: Use the example app to test all event types
3. **Verify Payloads**: Check that all required fields are present and correctly formatted
4. **Creative Testing**: Test creative triggering with and without specific IDs

## Troubleshooting

If debug overlays are not appearing:

1. Verify `enableDebugger: true` is set in configuration
2. Check that the SDK is properly initialized
3. Ensure you're testing on a device/simulator (not just type checking)
4. Check console logs for any initialization errors

## Example App

The included example app demonstrates all debugging features:

```bash
cd example
npm install
# iOS
npx react-native run-ios
# Android
npx react-native run-android
```

The example app includes buttons to test all event types and debugging features.
