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

public class AttentiveReactNativeSdkModule extends NativeAttentiveReactNativeSdkSpec {
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
  public void initialize(String attentiveDomain, String mode, boolean skipFatigueOnCreatives, boolean enableDebugger) {
    if (mode == null) {
      throw new IllegalArgumentException("The 'mode' parameter cannot be null.");
    }
    
    // Initialize debug helper
    debugHelper.initialize(enableDebugger);

    attentiveConfig = new AttentiveConfig.Builder()
        .context(getReactApplicationContext())
        .domain(attentiveDomain)
        .mode(AttentiveConfig.Mode.valueOf(mode.toUpperCase(Locale.ROOT)))
        .skipFatigueOnCreatives(skipFatigueOnCreatives)
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
  public void identify(String phone, String email, String klaviyoId, String shopifyId, String clientUserId, ReadableMap customIdentifiers) {
    UserIdentifiers.Builder idsBuilder = new UserIdentifiers.Builder();
    if (phone != null && !phone.isEmpty()) {
      idsBuilder.withPhone(phone);
    }
    if (email != null && !email.isEmpty()) {
      idsBuilder.withEmail(email);
    }
    if (klaviyoId != null && !klaviyoId.isEmpty()) {
      idsBuilder.withKlaviyoId(klaviyoId);
    }
    if (shopifyId != null && !shopifyId.isEmpty()) {
      idsBuilder.withShopifyId(shopifyId);
    }
    if (clientUserId != null && !clientUserId.isEmpty()) {
      idsBuilder.withClientUserId(clientUserId);
    }
    if (customIdentifiers != null) {
      Map<String, String> customIds = new HashMap<>();
      Map<String, Object> rawCustomIds = customIdentifiers.toHashMap();
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
  public void recordProductViewEvent(ReadableArray items, String deeplink) {
    Log.i(TAG, "Sending product viewed event");

    List<Item> itemsList = buildItems(items);
    ProductViewEvent productViewEvent = new ProductViewEvent.Builder(itemsList).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(productViewEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(itemsList.size()));
      debugData.put("deeplink", deeplink);
      debugHelper.showDebugInfo("Product View Event", debugData);
    }
  }

  @Override
  public void recordPurchaseEvent(ReadableArray items, String orderId, String cartId, String cartCoupon) {
    Log.i(TAG, "Sending purchase event");
    Order order = new Order.Builder(orderId).build();

    List<Item> itemsList = buildItems(items);
    PurchaseEvent purchaseEvent = new PurchaseEvent.Builder(itemsList, order).build();

    AttentiveEventTracker.getInstance().recordEvent(purchaseEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(itemsList.size()));
      debugData.put("order_id", orderId);
      if (cartId != null) debugData.put("cart_id", cartId);
      if (cartCoupon != null) debugData.put("cart_coupon", cartCoupon);
      debugHelper.showDebugInfo("Purchase Event", debugData);
    }
  }

  @Override
  public void recordAddToCartEvent(ReadableArray items, String deeplink) {
    Log.i(TAG, "Sending add to cart event");

    List<Item> itemsList = buildItems(items);
    AddToCartEvent addToCartEvent = new AddToCartEvent.Builder(itemsList).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(addToCartEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("items_count", String.valueOf(itemsList.size()));
      debugData.put("deeplink", deeplink);
      debugHelper.showDebugInfo("Add To Cart Event", debugData);
    }
  }

  @Override
  public void recordCustomEvent(String type, ReadableMap properties) {
    Log.i(TAG, "Sending custom event");
    if (properties == null) {
      throw new IllegalArgumentException("The CustomEvent 'properties' field cannot be null.");
    }
    Map<String, String> propertiesMap = convertToStringMap(properties.toHashMap());
    CustomEvent customEvent = new CustomEvent.Builder(type, propertiesMap).build();

    AttentiveEventTracker.getInstance().recordEvent(customEvent);

    if (debugHelper.isDebuggingEnabled()) {
      Map<String, Object> debugData = new HashMap<>();
      debugData.put("event_type", type);
      debugData.put("properties_count", String.valueOf(propertiesMap.size()));
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

      // Price and currency are now flattened, not nested
      String priceValue = rawItem.getString("price");
      String currencyCode = rawItem.getString("currency");
      Price price = new Price.Builder(new BigDecimal(priceValue), Currency.getInstance(currencyCode)).build();

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
