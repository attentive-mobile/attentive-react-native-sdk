package com.attentivereactnativesdk;

import android.app.Activity;
import android.util.Log;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.attentive.androidsdk.AttentiveConfig;
import com.attentive.androidsdk.AttentiveEventTracker;
import com.attentive.androidsdk.UserIdentifiers;
import com.attentive.androidsdk.creatives.Creative;
import com.attentive.androidsdk.events.AddToCartEvent;
import com.attentive.androidsdk.events.CustomEvent;
import com.attentive.androidsdk.events.Item;
import com.attentive.androidsdk.events.Order;
import com.attentive.androidsdk.events.Price;
import com.attentive.androidsdk.events.ProductViewEvent;
import com.attentive.androidsdk.events.PurchaseEvent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;
import java.math.BigDecimal;
import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Currency;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ReactModule(name = AttentiveReactNativeSdkModule.NAME)
public class AttentiveReactNativeSdkModule extends ReactContextBaseJavaModule {
  public static final String NAME = "AttentiveReactNativeSdk";
  private static final String TAG = NAME;

  private AttentiveConfig attentiveConfig;
  private Creative creative;
  private boolean debuggingEnabled = false;
  private List<DebugEvent> debugHistory = new ArrayList<>();

  public AttentiveReactNativeSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void initialize(ReadableMap config) {
    final String rawMode = config.getString("mode");
    if (rawMode == null) {
      throw new IllegalArgumentException("The 'mode' parameter cannot be null.");
    }

    final String domain = config.getString("attentiveDomain");
    final Boolean skipFatigue = config.hasKey("skipFatigueOnCreatives") ?
      config.getBoolean("skipFatigueOnCreatives") : false;
    
    // Only enable debugging if both enableDebugger is true AND the app is running in debug mode
    final Boolean enableDebuggerFromConfig = config.hasKey("enableDebugger") ?
      config.getBoolean("enableDebugger") : false;
    final boolean isDebugBuild = (getReactApplicationContext().getApplicationInfo().flags & 
      android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    this.debuggingEnabled = enableDebuggerFromConfig && isDebugBuild;
    
    Log.i(TAG, "Debug initialization - enableDebuggerFromConfig: " + enableDebuggerFromConfig + 
                ", isDebugBuild: " + isDebugBuild + ", debuggingEnabled: " + this.debuggingEnabled);

    attentiveConfig = new AttentiveConfig.Builder()
        .context(this.getReactApplicationContext())
        .domain(domain)
        .mode(AttentiveConfig.Mode.valueOf(rawMode.toUpperCase(Locale.ROOT)))
        .skipFatigueOnCreatives(skipFatigue)
        .build();
    AttentiveEventTracker.getInstance().initialize(attentiveConfig);
  }

  @ReactMethod
  public void triggerCreative() {
    this.triggerCreative(null);
  }

  @ReactMethod
  public void triggerCreative(@Nullable String creativeId) {
    Log.i(TAG, "Native Attentive module was called to trigger the creative.");
    try {
      Activity currentActivity = getReactApplicationContext().getCurrentActivity();
      if (currentActivity != null) {
        ViewGroup rootView =
          (ViewGroup) currentActivity.getWindow().getDecorView().getRootView();
        // The following calls edit the view hierarchy so they must run on the UI thread
        UiThreadUtil.runOnUiThread(() -> {
          creative = new Creative(attentiveConfig, rootView);
          creative.trigger(null, creativeId);
          if (debuggingEnabled) {
            Map<String, Object> debugData = new HashMap<>();
            debugData.put("type", "trigger");
            debugData.put("creativeId", creativeId != null ? creativeId : "default");
            showDebugInfo("Creative Triggered", debugData);
          }
        });
      } else {
        Log.w(TAG, "Could not trigger the Attentive Creative because the current Activity was null");
      }
    } catch (Exception e) {
      Log.e(TAG, "Exception when triggering the creative: " + e);
    }
  }

  @ReactMethod
  public void destroyCreative() {
    if (creative != null) {
      UiThreadUtil.runOnUiThread(() -> {
        creative.destroy();
        creative = null;
      });
    }
  }

  @ReactMethod
  public void updateDomain(String domain) {
    attentiveConfig.changeDomain(domain);
  }

  @ReactMethod
  public void clearUser() {
    attentiveConfig.clearUser();
  }

  @ReactMethod
  public void identify(ReadableMap identifiers) {
    UserIdentifiers.Builder idsBuilder = new UserIdentifiers.Builder();
    if (identifiers.hasKey("phone")) {
      idsBuilder.withPhone(identifiers.getString("phone"));
    }
    if (identifiers.hasKey("email")) {
      idsBuilder.withEmail(identifiers.getString("email"));
    }
    if (identifiers.hasKey("klaviyoId")) {
      idsBuilder.withKlaviyoId(identifiers.getString("klaviyoId"));
    }
    if (identifiers.hasKey("shopifyId")) {
      idsBuilder.withShopifyId(identifiers.getString("shopifyId"));
    }
    if (identifiers.hasKey("clientUserId")) {
      idsBuilder.withClientUserId(identifiers.getString("clientUserId"));
    }
    if (identifiers.hasKey("customIdentifiers")) {
      Map<String, String> customIds = new HashMap<>();
      Map<String, Object> rawCustomIds = identifiers.getMap("customIdentifiers").toHashMap();
      for (Map.Entry<String, Object> entry : rawCustomIds.entrySet()) {
        if (entry.getValue() instanceof String) {
          customIds.put(entry.getKey(), (String) entry.getValue());
        }
      }
      idsBuilder.withCustomIdentifiers(customIds);
    }

    attentiveConfig.identify(idsBuilder.build());
  }

  @ReactMethod
  public void recordProductViewEvent(ReadableMap productViewAttrs) {
    Log.i(TAG, "Sending product viewed event");

    List<Item> items = buildItems(productViewAttrs.getArray("items"));
    String deeplink = productViewAttrs.getString("deeplink");
    ProductViewEvent productViewEvent = new ProductViewEvent.Builder(items).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(productViewEvent);

    if (debuggingEnabled) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(items.size()));
      debugData.put("deeplink", deeplink);
      debugData.put("payload", productViewAttrs.toHashMap());
      showDebugInfo("Product View Event", debugData);
    }
  }

  @ReactMethod
  public void recordPurchaseEvent(ReadableMap purchaseAttrs) {
    Log.i(TAG, "Sending purchase event");
    Order order = new Order.Builder(purchaseAttrs.getMap("order").getString("orderId")).build();

    List<Item> items = buildItems(purchaseAttrs.getArray("items"));
    PurchaseEvent purchaseEvent = new PurchaseEvent.Builder(items, order).build();

    AttentiveEventTracker.getInstance().recordEvent(purchaseEvent);

    if (debuggingEnabled) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(items.size()));
      debugData.put("order_id", order.getOrderId());
      debugData.put("payload", purchaseAttrs.toHashMap());
      showDebugInfo("Purchase Event", debugData);
    }
  }

  @ReactMethod
  public void recordAddToCartEvent(ReadableMap addToCartAttrs) {
    Log.i(TAG, "Sending add to cart event");

    List<Item> items = buildItems(addToCartAttrs.getArray("items"));
    String deeplink = addToCartAttrs.getString("deeplink");
    AddToCartEvent addToCartEvent = new AddToCartEvent.Builder(items).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(addToCartEvent);

    if (debuggingEnabled) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(items.size()));
      debugData.put("deeplink", deeplink);
      debugData.put("payload", addToCartAttrs.toHashMap());
      showDebugInfo("Add To Cart Event", debugData);
    }
  }

  @ReactMethod
  public void recordCustomEvent(ReadableMap customEventAttrs) {
    Log.i(TAG, "Sending custom event");
    ReadableMap propertiesRawMap = customEventAttrs.getMap("properties");
    if (propertiesRawMap == null) {
      throw new IllegalArgumentException("The CustomEvent 'properties' field cannot be null.");
    }
    Map<String, String> properties = convertToStringMap(propertiesRawMap.toHashMap());
    CustomEvent customEvent = new CustomEvent.Builder(customEventAttrs.getString("type"), properties).build();

    AttentiveEventTracker.getInstance().recordEvent(customEvent);

    if (debuggingEnabled) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("event_type", customEventAttrs.getString("type"));
      debugData.put("properties_count", String.valueOf(properties.size()));
      debugData.put("payload", customEventAttrs.toHashMap());
      showDebugInfo("Custom Event", debugData);
    }
  }

  @ReactMethod
  public void invokeAttentiveDebugHelper() {
    if (debuggingEnabled) {
      // Don't add to history - this is just for viewing existing debug data
      Activity currentActivity = getReactApplicationContext().getCurrentActivity();
      if (currentActivity != null) {
        UiThreadUtil.runOnUiThread(() -> {
          Map<String, Object> debugData = new HashMap<>();
          debugData.put("action", "manual_debug_call");
          debugData.put("session_events", String.valueOf(debugHistory.size()));
          showDebugDialog(currentActivity, "Manual Debug View", debugData);
        });
      }
    }
  }

  @ReactMethod
  public void exportDebugLogs(com.facebook.react.bridge.Promise promise) {
    try {
      String exportContent = exportDebugLogs();
      promise.resolve(exportContent);
    } catch (Exception e) {
      promise.reject("EXPORT_ERROR", "Failed to export debug logs: " + e.getMessage(), e);
    }
  }

  /**
   * Exports the current debug session logs as a formatted string
   * @return A comprehensive formatted string containing all debug events in the current session
   */
  private String exportDebugLogs() {
    if (!debuggingEnabled) {
      return "Debug logging is not enabled. Please enable debugging to export logs.";
    }
    
    if (debugHistory.isEmpty()) {
      return "No debug events recorded in this session.";
    }
    
    java.text.SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
    String exportDate = formatter.format(new java.util.Date());
    
    StringBuilder exportContent = new StringBuilder();
    exportContent.append("Attentive React Native SDK - Debug Session Export\n");
    exportContent.append("Generated: ").append(exportDate).append("\n");
    exportContent.append("Total Events: ").append(debugHistory.size()).append("\n\n");
    exportContent.append("=".repeat(60)).append("\n\n");
    
    // Add all events in chronological order (oldest first for better readability)
    for (int i = 0; i < debugHistory.size(); i++) {
      DebugEvent event = debugHistory.get(i);
      exportContent.append("Event #").append(i + 1).append("\n");
      exportContent.append(event.formatForExport());
      exportContent.append("\n");
    }
    
    exportContent.append("=".repeat(60)).append("\n");
    exportContent.append("End of Debug Session Export");
    
    return exportContent.toString();
  }

  /**
   * Shares debug logs using the Android share intent
   * @param context The current activity context
   * @param content The content to share
   */
  private void shareDebugLogs(Activity context, String content) {
    android.content.Intent shareIntent = new android.content.Intent();
    shareIntent.setAction(android.content.Intent.ACTION_SEND);
    shareIntent.setType("text/plain");
    shareIntent.putExtra(android.content.Intent.EXTRA_TEXT, content);
    shareIntent.putExtra(android.content.Intent.EXTRA_SUBJECT, "Attentive React Native SDK - Debug Session Export");
    
    android.content.Intent chooser = android.content.Intent.createChooser(shareIntent, "Share Debug Logs");
    if (shareIntent.resolveActivity(context.getPackageManager()) != null) {
      context.startActivity(chooser);
    }
  }

  private Map<String, String> convertToStringMap(Map<String, Object> inputMap) {
    Map<String, String> outputMap = new HashMap<>();
    for (Map.Entry<String, Object> entry : inputMap.entrySet()) {
      Object entryValue = entry.getValue();
      if (entryValue == null) {
        throw new InvalidParameterException(String.format("The key '%s' has a null value.", entry.getKey()));
      }
      if (entryValue instanceof String) {
        outputMap.put(entry.getKey(), (String) entry.getValue());
      }
    }

    return outputMap;
  }

  private List<Item> buildItems(ReadableArray rawItems) {
    Log.i(TAG, "buildItems method called with rawItems: " + rawItems.toString());
    List<Item> items = new ArrayList<>();
    for (int i = 0; i < rawItems.size(); i++) {
      ReadableMap rawItem = rawItems.getMap(i);

      ReadableMap priceMap = rawItem.getMap("price");
      Price price = new Price.Builder(new BigDecimal(priceMap.getString("price")), Currency.getInstance(priceMap.getString("currency"))).build();

      Item.Builder builder = new Item.Builder(rawItem.getString("productId"), rawItem.getString("productVariantId"), price);

      if (rawItem.hasKey("productImage")) {
        builder.productImage(rawItem.getString("productImage"));
      }

      if (rawItem.hasKey("name")) {
        builder.name(rawItem.getString("name"));
      }

      if (rawItem.hasKey("quantity")) {
        builder.quantity(rawItem.getInt("quantity"));
      }

      if (rawItem.hasKey("category")) {
        builder.category(rawItem.getString("category"));
      }

      Item item = builder.build();
      items.add(item);
    }

    return items;
  }

  private void showDebugInfo(String event, Map<String, Object> data) {
    Log.i(TAG, "showDebugInfo called for event: " + event + ", data: " + data);
    
    // Add to debug history
    DebugEvent debugEvent = new DebugEvent(event, data);
    debugHistory.add(debugEvent);

    Activity currentActivity = getReactApplicationContext().getCurrentActivity();
    if (currentActivity != null) {
      Log.i(TAG, "Current activity found, showing debug dialog on UI thread");
      UiThreadUtil.runOnUiThread(() -> {
        showDebugDialog(currentActivity, event, data);
      });
    } else {
      Log.w(TAG, "Current activity is null, cannot show debug dialog");
    }
  }

  private void showDebugDialog(Activity activity, String currentEvent, Map<String, Object> currentData) {
    Log.i(TAG, "showDebugDialog called for event: " + currentEvent);
    
    // Get the root view of the current activity to add our overlay directly
    ViewGroup rootView = (ViewGroup) activity.getWindow().getDecorView().getRootView();
    Log.i(TAG, "Root view obtained: " + rootView);

    // Create custom view for tabbed interface - this will be added directly to the activity
    android.widget.LinearLayout mainLayout = new android.widget.LinearLayout(activity);
    mainLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
    mainLayout.setPadding(32, 32, 32, 32);
    mainLayout.setBackgroundColor(android.graphics.Color.TRANSPARENT); // Completely transparent background
    
    // Make the overlay fill the entire screen but allow touch-through for transparent areas
    android.widget.FrameLayout.LayoutParams overlayParams = new android.widget.FrameLayout.LayoutParams(
      android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
      android.widget.FrameLayout.LayoutParams.MATCH_PARENT);
    mainLayout.setLayoutParams(overlayParams);

    // Create content container that will be positioned at bottom
    android.widget.LinearLayout contentContainer = new android.widget.LinearLayout(activity);
    contentContainer.setOrientation(android.widget.LinearLayout.VERTICAL);
    contentContainer.setBackgroundColor(0xFFFFFFFF);
    contentContainer.setPadding(24, 24, 24, 24);

    // Round corners with discrete outline border
    android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
    background.setColor(0xFFFFFFFF); // White background
    background.setCornerRadius(24); // Rounded corners
    background.setStroke(2, 0xFFE0E0E0); // Discrete light gray border (2dp width)
    contentContainer.setBackground(background);

    // Header with title, share button, and close button
    android.widget.LinearLayout headerLayout = new android.widget.LinearLayout(activity);
    headerLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    headerLayout.setGravity(android.view.Gravity.CENTER_VERTICAL);

    android.widget.TextView titleText = new android.widget.TextView(activity);
    titleText.setText("🐛 Attentive Debug Session");
    titleText.setTextSize(18);
    titleText.setTypeface(null, android.graphics.Typeface.BOLD);
    titleText.setTextColor(0xFF000000); // Black text
    android.widget.LinearLayout.LayoutParams titleParams = new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1);
    titleText.setLayoutParams(titleParams);
    headerLayout.addView(titleText);

    // Share button - Material Design share icon, circular
    android.widget.Button shareButton = new android.widget.Button(activity);
    shareButton.setText("↗"); // Material Design share icon - simple diagonal arrow up-right
    shareButton.setTextSize(28); // Even larger text size for prominence
    shareButton.setTextColor(0xFF1976D2); // Material blue color
    shareButton.setBackgroundColor(0xFFF0F0F0);
    // Padding will be set later for vertical centering
    shareButton.setTypeface(android.graphics.Typeface.DEFAULT_BOLD); // Make text bold
    shareButton.setGravity(android.view.Gravity.CENTER); // Center the glyph properly
    shareButton.setIncludeFontPadding(false); // Remove font padding for better centering
    
    // Remove button's default minimum width/height that can affect centering
    shareButton.setMinWidth(0);
    shareButton.setMinHeight(0);
    shareButton.setMinimumWidth(0);
    shareButton.setMinimumHeight(0);
    
    // Fix vertical centering by adjusting text baseline and using custom padding
    shareButton.setTextAlignment(android.view.View.TEXT_ALIGNMENT_CENTER);
    shareButton.setSingleLine(true);
    shareButton.setLines(1);
    
    // Fine-tune share glyph position with slight additional upward shift
    shareButton.setPadding(0, -20, 0, 8); // Slightly more negative top to lift text just a bit higher
    
    // Make button circular and even larger
    android.graphics.drawable.GradientDrawable shareDrawable = new android.graphics.drawable.GradientDrawable();
    shareDrawable.setShape(android.graphics.drawable.GradientDrawable.OVAL);
    shareDrawable.setColor(0xFFF0F0F0); // Light gray background
    shareDrawable.setStroke(3, 0xFF1976D2); // Thicker blue border
    shareButton.setBackground(shareDrawable);
    
    android.widget.LinearLayout.LayoutParams shareParams = new android.widget.LinearLayout.LayoutParams(72, 72); // Even larger circular size (72dp)
    shareParams.setMargins(0, 0, 20, 0); // More separation to avoid mistapping
    shareButton.setLayoutParams(shareParams);
    headerLayout.addView(shareButton);

    // Close button - circular with prominent X and destructive styling
    android.widget.Button closeButton = new android.widget.Button(activity);
    closeButton.setText("×"); // Clean multiplication symbol for close
    closeButton.setTextSize(32); // Even larger for the close button
    closeButton.setTextColor(0xFFD32F2F); // Destructive red color (Material Design red 700)
    closeButton.setBackgroundColor(0xFFFFF0F0); // Very light red background
    // Padding will be set later for vertical centering
    closeButton.setTypeface(android.graphics.Typeface.DEFAULT_BOLD); // Make text bold
    closeButton.setGravity(android.view.Gravity.CENTER); // Center the glyph properly
    closeButton.setIncludeFontPadding(false); // Remove font padding for better centering
    
    // Remove button's default minimum width/height that can affect centering
    closeButton.setMinWidth(0);
    closeButton.setMinHeight(0);
    closeButton.setMinimumWidth(0);
    closeButton.setMinimumHeight(0);
    
    // Fix vertical centering by adjusting text baseline and using custom padding
    closeButton.setTextAlignment(android.view.View.TEXT_ALIGNMENT_CENTER);
    closeButton.setSingleLine(true);
    closeButton.setLines(1);
    
    // Adjust close glyph to bring it back up from too low position
    closeButton.setPadding(0, -13, 0, 9); // Increase negative top to lift text back up
    
    // Make button circular and even larger with destructive styling
    android.graphics.drawable.GradientDrawable closeDrawable = new android.graphics.drawable.GradientDrawable();
    closeDrawable.setShape(android.graphics.drawable.GradientDrawable.OVAL);
    closeDrawable.setColor(0xFFFFF0F0); // Very light red background
    closeDrawable.setStroke(3, 0xFFD32F2F); // Destructive red border
    closeButton.setBackground(closeDrawable);
    
    android.widget.LinearLayout.LayoutParams closeParams = new android.widget.LinearLayout.LayoutParams(72, 72); // Even larger circular size (72dp)
    closeButton.setLayoutParams(closeParams);
    headerLayout.addView(closeButton);

    contentContainer.addView(headerLayout);

    // Tab buttons
    android.widget.LinearLayout tabLayout = new android.widget.LinearLayout(activity);
    tabLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    tabLayout.setPadding(0, 20, 0, 0);

    android.widget.Button currentTab = new android.widget.Button(activity);
    currentTab.setText("Current Event");
    currentTab.setTextColor(0xFF000000); // Black text
    currentTab.setLayoutParams(new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1));

    android.widget.Button historyTab = new android.widget.Button(activity);
    historyTab.setText("History (" + debugHistory.size() + ")");
    historyTab.setTextColor(0xFF000000); // Black text
    historyTab.setLayoutParams(new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1));

    tabLayout.addView(currentTab);
    tabLayout.addView(historyTab);
    contentContainer.addView(tabLayout);

    // Content area
    android.widget.ScrollView contentScroll = new android.widget.ScrollView(activity);
    android.widget.TextView contentText = new android.widget.TextView(activity);
    contentText.setTypeface(android.graphics.Typeface.MONOSPACE);
    contentText.setTextSize(12);
    contentText.setTextColor(0xFF333333); // Dark gray text for better readability
    contentText.setPadding(0, 20, 0, 0);
    contentScroll.addView(contentText);

    // Make content area larger to fill most of the screen
    android.widget.LinearLayout.LayoutParams scrollParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 0, 1);
    contentScroll.setLayoutParams(scrollParams);
    contentContainer.addView(contentScroll);

    // Position content container at bottom with minimum height (55% of screen - slightly shorter)
    android.util.DisplayMetrics displayMetrics = new android.util.DisplayMetrics();
    activity.getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
    int screenHeight = displayMetrics.heightPixels;
    int minHeight = (int) (screenHeight * 0.55); // 55% of screen height - slightly shorter
    
    android.widget.LinearLayout.LayoutParams containerParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
    containerParams.gravity = android.view.Gravity.BOTTOM;
    
    // Set minimum height to match iOS behavior
    contentContainer.setMinimumHeight(minHeight);
    contentContainer.setLayoutParams(containerParams);
    
    Log.i(TAG, "Debug overlay minimum height set to: " + minHeight + "px (55% of " + screenHeight + "px)");

    // Add spacer to push content to bottom
    android.view.View spacer = new android.view.View(activity);
    android.widget.LinearLayout.LayoutParams spacerParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 0, 1);
    spacer.setLayoutParams(spacerParams);
    mainLayout.addView(spacer);
    mainLayout.addView(contentContainer);

    // Set initial content to current event
    updateCurrentEventContent(contentText, currentEvent, currentData);

    // Tab click listeners
    currentTab.setOnClickListener(v -> {
      updateCurrentEventContent(contentText, currentEvent, currentData);
      currentTab.setEnabled(false);
      historyTab.setEnabled(true);
    });

    historyTab.setOnClickListener(v -> {
      updateHistoryContent(contentText);
      currentTab.setEnabled(true);
      historyTab.setEnabled(false);
    });

    // Set initial tab state
    currentTab.setEnabled(false);
    historyTab.setEnabled(true);

    // Setup share button to export and share debug logs
    shareButton.setOnClickListener(v -> {
      String exportContent = exportDebugLogs();
      shareDebugLogs(activity, exportContent);
    });

    // Setup close button to remove the overlay from the root view
    closeButton.setOnClickListener(v -> {
      rootView.removeView(mainLayout);
    });

    // Add the overlay directly to the activity's root view
    rootView.addView(mainLayout);
    Log.i(TAG, "Debug overlay added to root view successfully");

    // Note: No auto-dismiss to match iOS behavior - overlay stays until user closes it
  }

  private void updateCurrentEventContent(android.widget.TextView contentText, String event, Map<String, Object> data) {
    StringBuilder content = new StringBuilder();
    content.append("Event: ").append(event).append("\n\n");

    try {
      org.json.JSONObject jsonObject = new org.json.JSONObject(data);
      content.append(jsonObject.toString(2));
    } catch (Exception e) {
      content.append("Data: ").append(data.toString());
    }

    contentText.setText(content.toString());
  }

  private void updateHistoryContent(android.widget.TextView contentText) {
    if (debugHistory.isEmpty()) {
      contentText.setText("No events recorded in this session yet.");
      return;
    }

    StringBuilder content = new StringBuilder();
    content.append("Session History (").append(debugHistory.size()).append(" events):\n\n");

    // Show events in reverse order (newest first)
    for (int i = debugHistory.size() - 1; i >= 0; i--) {
      DebugEvent event = debugHistory.get(i);
      content.append("───────────────────────────────\n");
      content.append("[").append(event.getFormattedTime()).append("] ");
      content.append(event.getEventType()).append("\n");

      // Add summary
      String summary = event.getSummary();
      if (!summary.isEmpty()) {
        content.append("Summary: ").append(summary).append("\n");
      }

      content.append("\nPayload:\n");
      try {
        org.json.JSONObject jsonObject = new org.json.JSONObject(event.getData());
        content.append(jsonObject.toString(2));
      } catch (Exception e) {
        content.append(event.getData().toString());
      }
      content.append("\n\n");
    }

    contentText.setText(content.toString());
  }

  // Debug Event class for session history
  private static class DebugEvent {
    private final String eventType;
    private final Map<String, Object> data;
    private final long timestamp;

    public DebugEvent(String eventType, Map<String, Object> data) {
      this.eventType = eventType;
      this.data = new HashMap<>(data);
      this.timestamp = System.currentTimeMillis();
    }

    public String getEventType() {
      return eventType;
    }

    public Map<String, Object> getData() {
      return data;
    }

    public String getFormattedTime() {
      java.text.SimpleDateFormat formatter = new java.text.SimpleDateFormat("HH:mm:ss", Locale.getDefault());
      return formatter.format(new java.util.Date(timestamp));
    }

    public String getSummary() {
      List<String> summaryParts = new ArrayList<>();

      if (data.containsKey("items_count")) {
        summaryParts.add("Items: " + data.get("items_count"));
      }
      if (data.containsKey("order_id")) {
        summaryParts.add("Order: " + data.get("order_id"));
      }
      if (data.containsKey("creativeId")) {
        summaryParts.add("Creative: " + data.get("creativeId"));
      }
      if (data.containsKey("event_type")) {
        summaryParts.add("Type: " + data.get("event_type"));
      }

      // Always show payload size info
      summaryParts.add("Payload: " + data.size() + " fields");

      return String.join(" • ", summaryParts);
    }

    /**
     * Formats the debug event as a human-readable string for export
     * @return A formatted string containing timestamp, event type, and data
     */
    public String formatForExport() {
      java.text.SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault());
      String timeString = formatter.format(new java.util.Date(timestamp));
      
      StringBuilder output = new StringBuilder();
      output.append("[").append(timeString).append("] ").append(eventType).append("\n");
      
      // Add summary information if available
      String summary = getSummary();
      if (!summary.isEmpty()) {
        output.append("Summary: ").append(summary).append("\n");
      }
      
      output.append("Data:\n");
      
      // Format data as JSON for better readability
      try {
        org.json.JSONObject jsonObject = new org.json.JSONObject(data);
        output.append(jsonObject.toString(2));
      } catch (Exception e) {
        output.append(data.toString());
      }
      
      output.append("\n").append("=".repeat(50)).append("\n");
      return output.toString();
    }

    /**
     * Returns the timestamp in milliseconds
     * @return The timestamp when this event was created
     */
    public long getTimestamp() {
      return timestamp;
    }
  }
}
