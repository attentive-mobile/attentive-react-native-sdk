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

    System.out.println("pfaff: " + productViewAttrs.toString());
    List<Item> items = buildItems(productViewAttrs.getArray("items"));
    String deeplink = productViewAttrs.getString("deeplink");
    ProductViewEvent productViewEvent = new ProductViewEvent.Builder(items).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(productViewEvent);
  }

  @ReactMethod
  public void recordPurchaseEvent(ReadableMap purchaseAttrs) {
    Log.i(TAG, "Sending purchase event");
    Order order = new Order.Builder(purchaseAttrs.getMap("order").getString("orderId")).build();

    List<Item> items = buildItems(purchaseAttrs.getArray("items"));
    PurchaseEvent purchaseEvent = new PurchaseEvent.Builder(items, order).build();

    AttentiveEventTracker.getInstance().recordEvent(purchaseEvent);
  }

  @ReactMethod
  public void recordAddToCartEvent(ReadableMap addToCartAttrs) {
    Log.i(TAG, "Sending add to cart event");

    List<Item> items = buildItems(addToCartAttrs.getArray("items"));
    String deeplink = addToCartAttrs.getString("deeplink");
    AddToCartEvent addToCartEvent = new AddToCartEvent.Builder(items).deeplink(deeplink).build();

    AttentiveEventTracker.getInstance().recordEvent(addToCartEvent);
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
