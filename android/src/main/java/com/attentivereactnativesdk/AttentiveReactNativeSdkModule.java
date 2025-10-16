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
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.Promise;
import java.math.BigDecimal;
import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Currency;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.attentivereactnativesdk.debug.AttentiveDebugHelper;

public class AttentiveReactNativeSdkModule extends AttentiveReactNativeSdkSpec {
  public static final String NAME = "AttentiveReactNativeSdk";
  private static final String TAG = NAME;

  private AttentiveConfig attentiveConfig;
  private Creative creative;
  private AttentiveDebugHelper debugHelper;

  AttentiveReactNativeSdkModule(ReactApplicationContext context) {
    super(context);
    this.debugHelper = new AttentiveDebugHelper(context);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @Override
  public void initialize(ReadableMap config) {
    final String rawMode = config.getString("mode");
    if (rawMode == null) {
      throw new IllegalArgumentException("The 'mode' parameter cannot be null.");
    }

    final String domain = config.getString("attentiveDomain");
    final Boolean skipFatigue = config.hasKey("skipFatigueOnCreatives") ?
      config.getBoolean("skipFatigueOnCreatives") : false;
    
    // Initialize debug helper
    final Boolean enableDebuggerFromConfig = config.hasKey("enableDebugger") ?
      config.getBoolean("enableDebugger") : false;
    debugHelper.initialize(enableDebuggerFromConfig);

    attentiveConfig = new AttentiveConfig.Builder()
        .context(this.getReactApplicationContext())
        .domain(domain)
        .mode(AttentiveConfig.Mode.valueOf(rawMode.toUpperCase(Locale.ROOT)))
        .skipFatigueOnCreatives(skipFatigue)
        .build();
    AttentiveEventTracker.getInstance().initialize(attentiveConfig);
  }

  @Override
  public void triggerCreative(String creativeId) {
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
          if (debugHelper.isDebuggingEnabled()) {
            Map<String, Object> debugData = new HashMap<>();
            debugData.put("type", "trigger");
            debugData.put("creativeId", creativeId != null ? creativeId : "default");
            debugHelper.showDebugInfo("Creative Triggered", debugData);
          }
        });
      } else {
        Log.w(TAG, "Could not trigger the Attentive Creative because the current Activity was null");
      }
    } catch (Exception e) {
      Log.e(TAG, "Exception when triggering the creative: " + e);
    }
  }

  @Override
  public void destroyCreative() {
    if (creative != null) {
      UiThreadUtil.runOnUiThread(() -> {
        creative.destroy();
        creative = null;
      });
    }
  }

  @Override
  public void updateDomain(String domain) {
    attentiveConfig.changeDomain(domain);
  }

  @Override
  public void clearUser() {
    attentiveConfig.clearUser();
  }

  @Override
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

  @Override
  public void recordProductViewEvent(ReadableMap productViewAttrs) {
    Log.i(TAG, "Sending product viewed event");

    List<Item> items = buildItems(productViewAttrs.getArray("items"));
    String deeplink = productViewAttrs.getString("deeplink");
    ProductViewEvent productViewEvent = new ProductViewEvent.Builder(items).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(productViewEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(items.size()));
      debugData.put("deeplink", deeplink);
      debugData.put("payload", productViewAttrs.toHashMap());
      debugHelper.showDebugInfo("Product View Event", debugData);
    }
  }

  @Override
  public void recordPurchaseEvent(ReadableMap purchaseAttrs) {
    Log.i(TAG, "Sending purchase event");
    Order order = new Order.Builder(purchaseAttrs.getMap("order").getString("orderId")).build();

    List<Item> items = buildItems(purchaseAttrs.getArray("items"));
    PurchaseEvent purchaseEvent = new PurchaseEvent.Builder(items, order).build();

    AttentiveEventTracker.getInstance().recordEvent(purchaseEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(items.size()));
      debugData.put("order_id", order.getOrderId());
      debugData.put("payload", purchaseAttrs.toHashMap());
      debugHelper.showDebugInfo("Purchase Event", debugData);
    }
  }

  @Override
  public void recordAddToCartEvent(ReadableMap addToCartAttrs) {
    Log.i(TAG, "Sending add to cart event");

    List<Item> items = buildItems(addToCartAttrs.getArray("items"));
    String deeplink = addToCartAttrs.getString("deeplink");
    AddToCartEvent addToCartEvent = new AddToCartEvent.Builder(items).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(addToCartEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(items.size()));
      debugData.put("deeplink", deeplink);
      debugData.put("payload", addToCartAttrs.toHashMap());
      debugHelper.showDebugInfo("Add To Cart Event", debugData);
    }
  }

  @Override
  public void recordCustomEvent(ReadableMap customEventAttrs) {
    Log.i(TAG, "Sending custom event");
    ReadableMap propertiesRawMap = customEventAttrs.getMap("properties");
    if (propertiesRawMap == null) {
      throw new IllegalArgumentException("The CustomEvent 'properties' field cannot be null.");
    }
    Map<String, String> properties = convertToStringMap(propertiesRawMap.toHashMap());
    CustomEvent customEvent = new CustomEvent.Builder(customEventAttrs.getString("type"), properties).build();

    AttentiveEventTracker.getInstance().recordEvent(customEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("event_type", customEventAttrs.getString("type"));
      debugData.put("properties_count", String.valueOf(properties.size()));
      debugData.put("payload", customEventAttrs.toHashMap());
      debugHelper.showDebugInfo("Custom Event", debugData);
    }
  }

  @Override
  public void invokeAttentiveDebugHelper() {
    debugHelper.invokeDebugHelper();
  }

  @Override
  public void exportDebugLogs(Promise promise) {
    try {
      String exportContent = debugHelper.exportDebugLogs();
      promise.resolve(exportContent);
    } catch (Exception e) {
      promise.reject("EXPORT_ERROR", "Failed to export debug logs: " + e.getMessage(), e);
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
}
