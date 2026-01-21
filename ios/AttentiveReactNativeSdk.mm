//
//  AttentiveReactNativeSdk.m
//  AttentiveReactNativeSdk
//
//  Created by Wyatt Davis on 2/13/23.
//

#import "AttentiveReactNativeSdk.h"
#import <UserNotifications/UserNotifications.h>

#if __has_include(<AttentiveReactNativeSdk-Swift.h>)
#import "AttentiveReactNativeSdk-Swift.h"
#else
// Load the headers from the attentive-ios-sdk Pod
#import "attentive_react_native_sdk-Swift.h"
#endif

@implementation AttentiveReactNativeSdk {
    ATTNNativeSDK* _sdk;
}

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
// New Architecture implementation with flattened parameters
- (void)initialize:(NSString *)attentiveDomain
              mode:(NSString *)mode
skipFatigueOnCreatives:(BOOL)skipFatigueOnCreatives
    enableDebugger:(BOOL)enableDebugger {
    _sdk = [[ATTNNativeSDK alloc] initWithDomain:attentiveDomain 
                                            mode:mode 
                         skipFatigueOnCreatives:skipFatigueOnCreatives 
                                  enableDebugger:enableDebugger];
    
    // Make SDK instance accessible from native code (e.g., AppDelegate)
    [AttentiveSDKManager shared].sdk = _sdk;
}

- (void)identify:(NSString *)phone
           email:(NSString *)email
       klaviyoId:(NSString *)klaviyoId
       shopifyId:(NSString *)shopifyId
    clientUserId:(NSString *)clientUserId
customIdentifiers:(NSDictionary *)customIdentifiers {
    NSMutableDictionary *identifiers = [NSMutableDictionary new];
    if (phone && ![phone isEqual:[NSNull null]]) identifiers[@"phone"] = phone;
    if (email && ![email isEqual:[NSNull null]]) identifiers[@"email"] = email;
    if (klaviyoId && ![klaviyoId isEqual:[NSNull null]]) identifiers[@"klaviyoId"] = klaviyoId;
    if (shopifyId && ![shopifyId isEqual:[NSNull null]]) identifiers[@"shopifyId"] = shopifyId;
    if (clientUserId && ![clientUserId isEqual:[NSNull null]]) identifiers[@"clientUserId"] = clientUserId;
    if (customIdentifiers && ![customIdentifiers isEqual:[NSNull null]]) identifiers[@"customIdentifiers"] = customIdentifiers;
    
    [_sdk identify:identifiers];
}

- (void)recordAddToCartEvent:(NSArray *)items
                     deeplink:(NSString *)deeplink {
    NSMutableDictionary *attrs = [NSMutableDictionary new];
    attrs[@"items"] = items;
    if (deeplink && ![deeplink isEqual:[NSNull null]]) attrs[@"deeplink"] = deeplink;
    [_sdk recordAddToCartEvent:attrs];
}

- (void)recordProductViewEvent:(NSArray *)items
                       deeplink:(NSString *)deeplink {
    NSMutableDictionary *attrs = [NSMutableDictionary new];
    attrs[@"items"] = items;
    if (deeplink && ![deeplink isEqual:[NSNull null]]) attrs[@"deeplink"] = deeplink;
    [_sdk recordProductViewEvent:attrs];
}

- (void)recordPurchaseEvent:(NSArray *)items
                    orderId:(NSString *)orderId
                     cartId:(NSString *)cartId
                 cartCoupon:(NSString *)cartCoupon {
    NSMutableDictionary *attrs = [NSMutableDictionary new];
    attrs[@"items"] = items;
    attrs[@"orderId"] = orderId;
    if (cartId && ![cartId isEqual:[NSNull null]]) attrs[@"cartId"] = cartId;
    if (cartCoupon && ![cartCoupon isEqual:[NSNull null]]) attrs[@"cartCoupon"] = cartCoupon;
    [_sdk recordPurchaseEvent:attrs];
}

- (void)recordCustomEvent:(NSString *)type
               properties:(NSDictionary *)properties {
    NSMutableDictionary *attrs = [NSMutableDictionary new];
    attrs[@"type"] = type;
    attrs[@"properties"] = properties;
    [_sdk recordCustomEvent:attrs];
}

// Push Notification Methods (New Architecture)
- (void)registerForPushNotifications {
    [_sdk registerForPushNotifications];
}

- (void)registerDeviceToken:(NSString *)token
       authorizationStatus:(NSString *)authorizationStatus {
    [_sdk registerDeviceToken:token authorizationStatus:authorizationStatus];
}

- (void)handlePushOpened:(NSDictionary *)userInfo
        applicationState:(NSString *)applicationState
    authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handlePushOpened:userInfo applicationState:applicationState authorizationStatus:authorizationStatus];
}

- (void)handleForegroundNotification:(NSDictionary *)userInfo {
    [_sdk handleForegroundNotification:userInfo];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeAttentiveReactNativeSdkSpecJSI>(params);
}

#else
// Old Architecture implementation with dictionary parameters
- (void)initialize:(NSDictionary*)configuration {
    _sdk = [[ATTNNativeSDK alloc] initWithDomain:configuration[@"attentiveDomain"] 
                                            mode:configuration[@"mode"] 
                         skipFatigueOnCreatives:configuration[@"skipFatigueOnCreatives"] 
                                  enableDebugger:configuration[@"enableDebugger"]];
    
    // Make SDK instance accessible from native code (e.g., AppDelegate)
    [AttentiveSDKManager shared].sdk = _sdk;
}

- (void)identify:(NSDictionary*)identifiers {
    [_sdk identify:identifiers];
}

- (void)recordAddToCartEvent:(NSDictionary*)attrs {
    [_sdk recordAddToCartEvent:attrs];
}

- (void)recordProductViewEvent:(NSDictionary*)attrs {
    [_sdk recordProductViewEvent:attrs];
}

- (void)recordPurchaseEvent:(NSDictionary*)attrs {
    [_sdk recordPurchaseEvent:attrs];
}

- (void)recordCustomEvent:(NSDictionary*)attrs {
    [_sdk recordCustomEvent:attrs];
}

// Push Notification Methods (Old Architecture)
- (void)registerForPushNotifications {
    [_sdk registerForPushNotifications];
}

- (void)registerDeviceToken:(NSString *)token
       authorizationStatus:(NSString *)authorizationStatus {
    [_sdk registerDeviceToken:token authorizationStatus:authorizationStatus];
}

- (void)handlePushOpened:(NSDictionary *)userInfo
        applicationState:(NSString *)applicationState
    authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handlePushOpened:userInfo applicationState:applicationState authorizationStatus:authorizationStatus];
}

- (void)handleForegroundNotification:(NSDictionary *)userInfo {
    [_sdk handleForegroundNotification:userInfo];
}
#endif

- (void)triggerCreative:(NSString *)creativeId {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIWindow *window = [[UIApplication sharedApplication] keyWindow];
    UIView *topView = window.rootViewController.view;
    if (creativeId == nil) {
      [self->_sdk trigger:topView];
    } else {
      [self->_sdk trigger:topView creativeId:creativeId];
    }
  });
}

- (void)destroyCreative {
  dispatch_async(dispatch_get_main_queue(), ^{
//    [self->_sdk closeCreative]
  });
}

- (void)updateDomain:(NSString *)domain {
  [_sdk updateDomain:domain];
}

- (void)clearUser {
  [_sdk clearUser];
}

- (void)invokeAttentiveDebugHelper {
  [_sdk invokeAttentiveDebugHelper];
}

- (void)exportDebugLogs:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
  NSString *exportContent = [_sdk exportDebugLogs];
  resolve(exportContent);
}

@end

