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
    // Add to debug history
    DebugEvent debugEvent = new DebugEvent(event, data);
    debugHistory.add(debugEvent);

    Activity currentActivity = getReactApplicationContext().getCurrentActivity();
    if (currentActivity != null) {
      UiThreadUtil.runOnUiThread(() -> {
        showDebugDialog(currentActivity, event, data);
      });
    }
  }

  private void showDebugDialog(Activity activity, String currentEvent, Map<String, Object> currentData) {
    // Create custom dialog with tabs for current event and history
    android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen);

    // Create custom view for tabbed interface
    android.widget.LinearLayout mainLayout = new android.widget.LinearLayout(activity);
    mainLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
    mainLayout.setPadding(32, 32, 32, 32);
    mainLayout.setBackgroundColor(0xE0000000); // Semi-transparent black background

    // Create content container that will be positioned at bottom
    android.widget.LinearLayout contentContainer = new android.widget.LinearLayout(activity);
    contentContainer.setOrientation(android.widget.LinearLayout.VERTICAL);
    contentContainer.setBackgroundColor(0xFFFFFFFF);
    contentContainer.setPadding(24, 24, 24, 24);

    // Round corners
    android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
    background.setColor(0xFFFFFFFF);
    background.setCornerRadius(24);
    contentContainer.setBackground(background);

    // Header with title and close button
    android.widget.LinearLayout headerLayout = new android.widget.LinearLayout(activity);
    headerLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    headerLayout.setGravity(android.view.Gravity.CENTER_VERTICAL);

    android.widget.TextView titleText = new android.widget.TextView(activity);
    titleText.setText("🐛 Attentive Debug Session");
    titleText.setTextSize(18);
    titleText.setTypeface(null, android.graphics.Typeface.BOLD);
    android.widget.LinearLayout.LayoutParams titleParams = new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1);
    titleText.setLayoutParams(titleParams);
    headerLayout.addView(titleText);

    // X Close button
    android.widget.Button closeButton = new android.widget.Button(activity);
    closeButton.setText("✕");
    closeButton.setTextSize(18);
    closeButton.setBackgroundColor(0xFFF0F0F0);
    closeButton.setPadding(16, 8, 16, 8);
    android.widget.LinearLayout.LayoutParams closeParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
    closeButton.setLayoutParams(closeParams);
    headerLayout.addView(closeButton);

    contentContainer.addView(headerLayout);

    // Tab buttons
    android.widget.LinearLayout tabLayout = new android.widget.LinearLayout(activity);
    tabLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    tabLayout.setPadding(0, 20, 0, 0);

    android.widget.Button currentTab = new android.widget.Button(activity);
    currentTab.setText("Current Event");
    currentTab.setLayoutParams(new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1));

    android.widget.Button historyTab = new android.widget.Button(activity);
    historyTab.setText("History (" + debugHistory.size() + ")");
    historyTab.setLayoutParams(new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1));

    tabLayout.addView(currentTab);
    tabLayout.addView(historyTab);
    contentContainer.addView(tabLayout);

    // Content area
    android.widget.ScrollView contentScroll = new android.widget.ScrollView(activity);
    android.widget.TextView contentText = new android.widget.TextView(activity);
    contentText.setTypeface(android.graphics.Typeface.MONOSPACE);
    contentText.setTextSize(12);
    contentText.setPadding(0, 20, 0, 0);
    contentScroll.addView(contentText);

    // Make content area larger to fill most of the screen
    android.widget.LinearLayout.LayoutParams scrollParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 0, 1);
    contentScroll.setLayoutParams(scrollParams);
    contentContainer.addView(contentScroll);

    // Position content container at bottom
    android.widget.LinearLayout.LayoutParams containerParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
    containerParams.gravity = android.view.Gravity.BOTTOM;
    contentContainer.setLayoutParams(containerParams);

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

    // Setup close button
    closeButton.setOnClickListener(v -> {
      // We'll set this after dialog creation
    });

    builder.setView(mainLayout);

    android.app.AlertDialog dialog = builder.create();
    dialog.getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                                android.view.WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
    dialog.show();

    // Set close button action after dialog is created
    closeButton.setOnClickListener(v -> dialog.dismiss());

    // Auto-dismiss after 8 seconds (longer for history viewing)
    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
      if (dialog.isShowing()) {
        dialog.dismiss();
      }
    }, 8000);
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
  }
}
