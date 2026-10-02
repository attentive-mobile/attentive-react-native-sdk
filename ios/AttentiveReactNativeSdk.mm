//
//  AttentiveReactNativeSdk.m
//  AttentiveReactNativeSdk
//
//  Created by Wyatt Davis on 2/13/23.
//
//  NOTE: This file contains both new arch and old arch implementations. Only the new arch path
//  (RCT_NEW_ARCH_ENABLED) is functional. The old arch #else branch does not compile and is
//  retained as scaffolding for future old arch support work.
//

#import "AttentiveReactNativeSdk.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <UserNotifications/UserNotifications.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "AttentiveReactNativeSdkSpec.h"
#endif

#if __has_include(<attentive_react_native_sdk/attentive_react_native_sdk-Swift.h>)
#import <attentive_react_native_sdk/attentive_react_native_sdk-Swift.h>
#elif __has_include(<AttentiveReactNativeSdk-Swift.h>)
#import "AttentiveReactNativeSdk-Swift.h"
#else
#import "attentive_react_native_sdk-Swift.h"
#endif

#ifdef RCT_NEW_ARCH_ENABLED
@interface AttentiveReactNativeSdk () <NativeAttentiveReactNativeSdkSpec>
@end
#endif

@implementation AttentiveReactNativeSdk {
    ATTNNativeSDK* _sdk;

    // --- Inbox unread count: main queue only. ---
    //
    // This module declares no methodQueue, so RCTTurboModuleManager runs its methods on the
    // shared serial queue it creates for such modules ("com.meta.react.turbomodulemanager.queue")
    // — not the JS thread, and not main. Both writers below, however, are on main: the change
    // observer is registered with `queue: .main` and the refresh completion is `@MainActor`.
    // Reading them from a method body would therefore be a genuine data race, and the
    // delivery-counter handshake in particular is a check-then-act that misbehaves when the
    // sample and the comparison happen on different threads. So every inbox entry point hops to
    // main first, and these five are only ever touched there.
    //
    // dealloc is the one exception, and is safe by construction: nothing else can be running
    // against an object that is being destroyed.

    // Block-based NSNotificationCenter token for inbox unread-count changes; removed in dealloc.
    id<NSObject> _inboxUnreadCountObserver;
    // Token for AttentiveSDKManager's availability broadcast, held only while an inbox read is
    // waiting for initialize(). See startObservingSDKAvailabilityForInbox.
    id<NSObject> _inboxSDKAvailabilityObserver;
    // Last count actually delivered to JS, so repeats can be filtered. See emitInboxUnreadCount:.
    NSInteger _lastEmittedUnreadCount;
    BOOL _hasEmittedUnreadCount;
    // Bumped on every delivery that reached JS, so an explicit refresh can tell whether the change
    // observer already delivered its value. See deliverRefreshedInboxUnreadCount:ifNoDeliverySince:.
    uint64_t _unreadCountDeliveries;
}

// Creative lifecycle events are delivered as RCTDeviceEventEmitter device events. This is the
// only emit route that works on the old architecture, the new architecture, and bridgeless:
// RCTBridgeModuleDecorator injects callableJSModules into any module implementing this setter,
// and RCTCallableJSModules wraps both the bridge and the bridgeless module invoker. It is the
// same mechanism RCTEventEmitter uses internally.
@synthesize callableJSModules = _callableJSModules;

// Device-event name carrying creative lifecycle transitions. Must stay in sync with
// CREATIVE_EVENT_NAME in `src/index.tsx` and in the Android module; a mismatch silently stops all
// creative events rather than failing loudly.
static NSString *const kAttentiveCreativeEventName = @"AttentiveCreativeEvent";

// Device-event name carrying inbox unread-count changes. Same contract as the creative event
// name: must stay in sync with INBOX_UNREAD_COUNT_EVENT_NAME in `src/index.tsx` and in the
// Android module.
static NSString *const kAttentiveInboxUnreadCountEventName = @"AttentiveInboxUnreadCount";

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
// New Architecture implementation with flattened parameters.
// Initialize is invoked only from TypeScript (e.g. Bonni App); native must not auto-initialize.
- (void)initialize:(NSString *)attentiveDomain
              mode:(NSString *)mode
skipFatigueOnCreatives:(BOOL)skipFatigueOnCreatives
    enableDebugger:(BOOL)enableDebugger
       pushEnabled:(BOOL)pushEnabled {
    _sdk = [[ATTNNativeSDK alloc] initWithDomain:attentiveDomain
                                            mode:mode
                          skipFatigueOnCreatives:skipFatigueOnCreatives
                                  enableDebugger:enableDebugger
                                     pushEnabled:pushEnabled];

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

- (void)registerDeviceTokenWithCallback:(NSString *)token
                   authorizationStatus:(NSString *)authorizationStatus
                              callback:(RCTResponseSenderBlock)callback {
    // Convert hex string token to Data
    NSMutableData *tokenData = [[NSMutableData alloc] init];
    unsigned char byte;
    for (NSUInteger i = 0; i < token.length; i += 2) {
        NSString *hex = [token substringWithRange:NSMakeRange(i, 2)];
        if ([[NSScanner scannerWithString:hex] scanHexInt:(unsigned int *)&byte]) {
            [tokenData appendBytes:&byte length:1];
        }
    }

    // Convert string authorization status to UNAuthorizationStatus enum
    UNAuthorizationStatus authStatus = [self authorizationStatusFromString:authorizationStatus];

    // Call the Swift method with callback (note: selector is registerDeviceTokenWithCallback:authorizationStatus:callback:)
    [_sdk registerDeviceTokenWithCallback:tokenData
                     authorizationStatus:authStatus
                                callback:^(NSData * _Nullable data, NSURL * _Nullable url, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        // Convert response to JavaScript-compatible objects
        NSDictionary *dataDict = nil;
        if (data) {
            NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            if (dataString) {
                dataDict = @{@"string": dataString, @"length": @(data.length)};
            }
        }

        NSString *urlString = url ? [url absoluteString] : nil;

        NSDictionary *responseDict = nil;
        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
            responseDict = @{
                @"statusCode": @(httpResponse.statusCode),
                @"headers": httpResponse.allHeaderFields ?: @{}
            };
        }

        NSDictionary *errorDict = nil;
        if (error) {
            errorDict = @{
                @"code": @(error.code),
                @"domain": error.domain,
                @"description": error.localizedDescription
            };
        }

        // Invoke the callback with the results
        callback(@[dataDict ?: [NSNull null],
                   urlString ?: [NSNull null],
                   responseDict ?: [NSNull null],
                   errorDict ?: [NSNull null]]);
    }];
}

- (void)handleRegularOpen:(NSString *)authorizationStatus {
    UNAuthorizationStatus authStatus = [self authorizationStatusFromString:authorizationStatus];
    [_sdk handleRegularOpen:authStatus];
}

- (void)handlePushOpened:(NSDictionary *)userInfo
        applicationState:(NSString *)applicationState
    authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handlePushOpened:userInfo applicationState:applicationState authorizationStatus:authorizationStatus];
}

- (void)handleForegroundNotification:(NSDictionary *)userInfo {
    [_sdk handleForegroundNotification:userInfo];
}

- (void)handleForegroundPush:(NSDictionary *)userInfo
        authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handleForegroundPushFromRN:userInfo authorizationStatus:authorizationStatus];
}

- (void)handlePushOpen:(NSDictionary *)userInfo
   authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handlePushOpenFromRN:userInfo authorizationStatus:authorizationStatus];
}


- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeAttentiveReactNativeSdkSpecJSI>(params);
}

#else
// Old Architecture implementation — currently does not compile (missing RCT_EXPORT_METHOD macros,
// bridge module registration, etc.). Kept here as a starting point for restoring old arch support
// in a future ticket.
- (void)initialize:(NSDictionary*)configuration {
    // pushEnabled defaults to YES when the key is absent, matching the TypeScript default.
    NSNumber *pushEnabled = configuration[@"pushEnabled"];
    _sdk = [[ATTNNativeSDK alloc] initWithDomain:configuration[@"attentiveDomain"]
                                            mode:configuration[@"mode"]
                         skipFatigueOnCreatives:configuration[@"skipFatigueOnCreatives"]
                                  enableDebugger:configuration[@"enableDebugger"]
                                     pushEnabled:pushEnabled ? [pushEnabled boolValue] : YES];

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

- (void)registerDeviceTokenWithCallback:(NSString *)token
                   authorizationStatus:(NSString *)authorizationStatus
                              callback:(RCTResponseSenderBlock)callback {
    // Convert hex string token to Data
    NSMutableData *tokenData = [[NSMutableData alloc] init];
    unsigned char byte;
    for (NSUInteger i = 0; i < token.length; i += 2) {
        NSString *hex = [token substringWithRange:NSMakeRange(i, 2)];
        if ([[NSScanner scannerWithString:hex] scanHexInt:(unsigned int *)&byte]) {
            [tokenData appendBytes:&byte length:1];
        }
    }

    // Convert string authorization status to UNAuthorizationStatus enum
    UNAuthorizationStatus authStatus = [self authorizationStatusFromString:authorizationStatus];

    // Call the Swift method with callback (note: selector is registerDeviceTokenWithCallback:authorizationStatus:callback:)
    [_sdk registerDeviceTokenWithCallback:tokenData
                     authorizationStatus:authStatus
                                callback:^(NSData * _Nullable data, NSURL * _Nullable url, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        // Convert response to JavaScript-compatible objects
        NSDictionary *dataDict = nil;
        if (data) {
            NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            if (dataString) {
                dataDict = @{@"string": dataString, @"length": @(data.length)};
            }
        }

        NSString *urlString = url ? [url absoluteString] : nil;

        NSDictionary *responseDict = nil;
        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
            responseDict = @{
                @"statusCode": @(httpResponse.statusCode),
                @"headers": httpResponse.allHeaderFields ?: @{}
            };
        }

        NSDictionary *errorDict = nil;
        if (error) {
            errorDict = @{
                @"code": @(error.code),
                @"domain": error.domain,
                @"description": error.localizedDescription
            };
        }

        // Invoke the callback with the results
        callback(@[dataDict ?: [NSNull null],
                   urlString ?: [NSNull null],
                   responseDict ?: [NSNull null],
                   errorDict ?: [NSNull null]]);
    }];
}

- (void)handleRegularOpen:(NSString *)authorizationStatus {
    UNAuthorizationStatus authStatus = [self authorizationStatusFromString:authorizationStatus];
    [_sdk handleRegularOpen:authStatus];
}

- (void)handlePushOpened:(NSDictionary *)userInfo
        applicationState:(NSString *)applicationState
    authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handlePushOpened:userInfo applicationState:applicationState authorizationStatus:authorizationStatus];
}

- (void)handleForegroundNotification:(NSDictionary *)userInfo {
    [_sdk handleForegroundNotification:userInfo];
}

- (void)handleForegroundPush:(NSDictionary *)userInfo
        authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handleForegroundPushFromRN:userInfo authorizationStatus:authorizationStatus];
}

- (void)handlePushOpen:(NSDictionary *)userInfo
   authorizationStatus:(NSString *)authorizationStatus {
    [_sdk handlePushOpenFromRN:userInfo authorizationStatus:authorizationStatus];
}

/**
 * iOS stub for getInitialPushNotification.
 *
 * On iOS, the killed-state push-open event is tracked natively in
 * AppDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:) via
 * AttentiveSDKManager.shared, so there is no pending payload to return here.
 * Resolves with nil so callers on both platforms can share the same code path.
 */
- (void)getInitialPushNotification:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject {
    resolve(nil);
}
#endif


// Helper method to convert string to UNAuthorizationStatus
- (UNAuthorizationStatus)authorizationStatusFromString:(NSString *)statusString {
    if ([statusString isEqualToString:@"authorized"]) {
        return UNAuthorizationStatusAuthorized;
    } else if ([statusString isEqualToString:@"denied"]) {
        return UNAuthorizationStatusDenied;
    } else if ([statusString isEqualToString:@"notDetermined"]) {
        return UNAuthorizationStatusNotDetermined;
    } else if ([statusString isEqualToString:@"provisional"]) {
        if (@available(iOS 12.0, *)) {
            return UNAuthorizationStatusProvisional;
        }
        return UNAuthorizationStatusNotDetermined;
    } else if ([statusString isEqualToString:@"ephemeral"]) {
        if (@available(iOS 14.0, *)) {
            return UNAuthorizationStatusEphemeral;
        }
        return UNAuthorizationStatusNotDetermined;
    }
    return UNAuthorizationStatusNotDetermined;
}

// Helper to convert UNAuthorizationStatus to string for getPushAuthorizationStatus
- (NSString *)authorizationStatusToRNString:(UNAuthorizationStatus)status {
    switch (status) {
        case UNAuthorizationStatusAuthorized:
            return @"authorized";
        case UNAuthorizationStatusDenied:
            return @"denied";
        case UNAuthorizationStatusNotDetermined:
            return @"notDetermined";
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 120000
        case UNAuthorizationStatusProvisional:
            return @"provisional";
#endif
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
        case UNAuthorizationStatusEphemeral:
            return @"ephemeral";
#endif
        default:
            return @"notDetermined";
    }
}

- (void)getPushAuthorizationStatus:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
        NSString *status = [self authorizationStatusToRNString:settings.authorizationStatus];
        resolve(status);
    }];
}

// =============================================================================
// Marketing Subscription Methods (both architectures)
// =============================================================================

- (void)optInMarketingSubscription:(NSString *)email
                              phone:(NSString *)phone
                            resolve:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject {
    NSString *normalizedEmail = (email && ![email isEqual:[NSNull null]] && email.length > 0) ? email : nil;
    NSString *normalizedPhone = (phone && ![phone isEqual:[NSNull null]] && phone.length > 0) ? phone : nil;

    if (!_sdk) {
        reject(@"OPT_IN_ERROR", @"SDK not initialized", nil);
        return;
    }

    [_sdk optInMarketingSubscriptionWithEmail:normalizedEmail
                                        phone:normalizedPhone
                                   completion:^(NSError * _Nullable error) {
        if (error) {
            reject(@"OPT_IN_ERROR", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)optOutMarketingSubscription:(NSString *)email
                               phone:(NSString *)phone
                             resolve:(RCTPromiseResolveBlock)resolve
                              reject:(RCTPromiseRejectBlock)reject {
    NSString *normalizedEmail = (email && ![email isEqual:[NSNull null]] && email.length > 0) ? email : nil;
    NSString *normalizedPhone = (phone && ![phone isEqual:[NSNull null]] && phone.length > 0) ? phone : nil;

    if (!_sdk) {
        reject(@"OPT_OUT_ERROR", @"SDK not initialized", nil);
        return;
    }

    [_sdk optOutMarketingSubscriptionWithEmail:normalizedEmail
                                         phone:normalizedPhone
                                    completion:^(NSError * _Nullable error) {
        if (error) {
            reject(@"OPT_OUT_ERROR", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)updateUser:(NSString * _Nullable)email
             phone:(NSString * _Nullable)phone
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
    NSString *normalizedEmail = (email && ![email isEqual:[NSNull null]] && email.length > 0) ? email : nil;
    NSString *normalizedPhone = (phone && ![phone isEqual:[NSNull null]] && phone.length > 0) ? phone : nil;

    if (!_sdk) {
        reject(@"UPDATE_USER_ERROR", @"SDK not initialized", nil);
        return;
    }

    [_sdk updateUserWithEmail:normalizedEmail
                        phone:normalizedPhone
                   completion:^(NSError * _Nullable error) {
        if (error) {
            reject(@"UPDATE_USER_ERROR", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)triggerCreative:(NSString *)creativeId {
  // Only `handler` needs the weak capture. The dispatch block below is transient — it is released
  // as soon as it runs — so capturing self strongly there is safe and matches destroyCreative.
  // The handler is different: the SDK retains it for the creative's lifetime and calls it on each
  // transition (opened -> closed, or a single notOpened), so capturing self strongly there would
  // form a self -> _sdk -> handler -> self cycle that ARC cannot collect. Weak also stops
  // emitting once the module has been torn down.
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    void (^handler)(NSString *) = ^(NSString *status) {
      [weakSelf emitCreativeEventWithStatus:status creativeId:creativeId];
    };

    // Messaging a nil _sdk is a silent no-op, which would leave the public event stream with no
    // event at all when triggerCreative() runs before initialize(). Report notOpened instead, so
    // a consumer gating UI on the stream is not stranded. Matches the Android bail-out paths.
    if (self->_sdk == nil) {
      RCTLogWarn(@"[AttentiveSDK] triggerCreative called before initialize(); reporting notOpened.");
      // Use the Swift-owned constant rather than a literal so this synthesized status shares one
      // source of truth with ATTNNativeSDK's normalizer (see -notOpenedStatus there).
      handler(ATTNNativeSDK.notOpenedStatus);
      return;
    }

    UIWindow *window = [[UIApplication sharedApplication] keyWindow];
    UIView *topView = window.rootViewController.view;

    if (creativeId == nil) {
      [self->_sdk trigger:topView handler:handler];
    } else {
      [self->_sdk trigger:topView creativeId:creativeId handler:handler];
    }
  });
}

/**
 * Forwards a creative lifecycle transition to JS as an `AttentiveCreativeEvent` device event.
 *
 * `status` arrives already normalized by ATTNNativeSDK ('opened' / 'closed' / 'notOpened' /
 * 'notClosed'); `creativeId` echoes the id passed to triggerCreative, which the native SDK does
 * not report back.
 *
 * `callableJSModules` is nil until the module is attached to a runtime, so a transition arriving
 * that early is dropped rather than crashing.
 */
/**
 * The single native->JS emit path, the counterpart of the Android module's `emitDeviceEvent`.
 *
 * Keeps the `RCTDeviceEventEmitter`/`emit` pair and the "no runtime yet" drop in one place, so a
 * future event cannot get a third hand-rolled copy of them. Returns NO when there was no runtime
 * to emit into; callers log that themselves, since only they know what was dropped.
 */
- (BOOL)emitDeviceEvent:(NSString *)name payload:(id)payload {
  if (_callableJSModules == nil) {
    return NO;
  }

  [_callableJSModules invokeModule:@"RCTDeviceEventEmitter"
                            method:@"emit"
                          withArgs:@[ name, payload ]];
  return YES;
}

- (void)emitCreativeEventWithStatus:(NSString *)status creativeId:(NSString *)creativeId {
  if (status == nil) {
    return;
  }

  NSMutableDictionary *payload = [NSMutableDictionary dictionaryWithObject:status forKey:@"status"];
  if (creativeId != nil) {
    payload[@"creativeId"] = creativeId;
  }

  if (![self emitDeviceEvent:kAttentiveCreativeEventName payload:payload]) {
    RCTLogWarn(@"[AttentiveSDK] Dropping creative event '%@': no JS runtime attached yet.", status);
  }
}

// =============================================================================
// Inbox (both architectures)
// =============================================================================

// Refreshes the unread count from the server, then resolves it.
//
// Unlike Android — where the native refresh entry points are still internal and only
// the first read fetches — iOS exposes a public refresh, so every call here hits the server. That
// is what makes an inbox badge on iOS accurate on app foreground and after a push open.
//
// Starting the observer here as well means one JS call delivers both the initial value and every
// later change, so a consumer never has to sequence two native calls.
- (void)getInboxUnreadCount:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  // Two different owners, so read each on its own thread. `_sdk` belongs to the method queue —
  // initialize: writes it there, and every other method reads it there — so it is captured *here*
  // and handed over, rather than read again on main. The inbox counters belong to main. Reading
  // `_sdk` from main would just trade the counter race for a pointer race.
  //
  // self is captured strongly on purpose: the promise has to settle, and a weak self gone nil
  // would drop the block and leave the JS caller awaiting forever.
  ATTNNativeSDK *sdk = _sdk;
  RCTExecuteOnMainQueue(^{
    [self readInboxUnreadCountWithSDK:sdk resolve:resolve reject:reject];
  });
}

// Main queue only.
- (void)readInboxUnreadCountWithSDK:(ATTNNativeSDK *)capturedSDK
                            resolve:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject {
  ATTNNativeSDK *sdk = capturedSDK;

  if (sdk == nil) {
    // Rejecting alone would strand the badge. This method is documented as the call that starts
    // the inbox, and it is the only caller of startObservingInboxUnreadCount — so returning here
    // without arranging a retry means no observer is ever registered, no unread-count event ever
    // fires, and the badge sits at its initial value for the whole session. The documented
    // consumer pattern catches and ignores the rejection, so nothing surfaces.
    //
    // Subscribe first, then re-read — the same order attachInboxIfPossible uses, and for a wider
    // window. `capturedSDK` was sampled on the method queue *before* this block was scheduled, so
    // initialize() can have landed during the hop; its didSet posts the availability broadcast
    // synchronously, and `sdk` only ever transitions nil -> non-nil once. Subscribing after that
    // post would leave an observer that can never fire, which is the stranded badge this whole
    // path exists to prevent. Re-reading after subscribing catches the post we may have missed.
    [self startObservingSDKAvailabilityForInbox];

    sdk = [self availableSDKFromManager];
    if (sdk == nil) {
      reject(@"inbox_unread_count_error",
             @"The Attentive SDK is not initialized. Call initialize() before reading the inbox. "
              "The unread count will be delivered to addInboxUnreadCountListener once it is.",
             nil);
      return;
    }

    // The SDK arrived during the hop. Nothing to wait for, and the promise can resolve with a
    // real count rather than rejecting.
    [self stopObservingSDKAvailabilityForInbox];
  }

  [self startObservingInboxUnreadCountWithSDK:sdk];

  // Sampled before the refresh so the completion can tell whether the change observer already
  // delivered this refresh's value.
  uint64_t deliveriesBeforeRefresh = _unreadCountDeliveries;

  __weak __typeof(self) weakSelf = self;
  [sdk refreshInboxUnreadCountWithCompletion:^(NSNumber *unreadCount) {
    // nil means the refresh could not be performed — the shim was released mid-flight by a module
    // teardown or a JS reload. Reject rather than resolve: the promise has to settle either way,
    // and resolving with a placeholder count would overwrite a correct badge.
    if (unreadCount == nil) {
      reject(@"inbox_unread_count_error",
             @"The Attentive SDK was torn down before the inbox unread count came back.",
             nil);
      return;
    }

    [weakSelf deliverRefreshedInboxUnreadCount:unreadCount.integerValue
                            ifNoDeliverySince:deliveriesBeforeRefresh];
    resolve(unreadCount);
  }];
}

/**
 * Waits for the SDK so an inbox read that arrived before initialize() is not lost.
 *
 * Main queue only. Idempotent, and torn down as soon as it fires: this is a one-shot recovery for
 * the mounted-before-initialize case, not a standing subscription.
 *
 * The iOS unread-count observer is bound to a specific ATTNSDK instance (`object: sdk`), so unlike
 * Android there is nothing to register against while the SDK is nil — the retry has to be driven
 * by AttentiveSDKManager's broadcast. AttentiveInboxView does the same thing for the same reason.
 */
- (void)startObservingSDKAvailabilityForInbox {
  if (_inboxSDKAvailabilityObserver != nil) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  _inboxSDKAvailabilityObserver = [NSNotificationCenter.defaultCenter
      addObserverForName:AttentiveSDKManager.sdkDidBecomeAvailableName
                  object:nil
                   queue:NSOperationQueue.mainQueue
              usingBlock:^(__unused NSNotification *note) {
                [weakSelf inboxSDKDidBecomeAvailable];
              }];
}

// Main queue only — NSOperationQueue.mainQueue above guarantees it.
- (void)stopObservingSDKAvailabilityForInbox {
  if (_inboxSDKAvailabilityObserver == nil) {
    return;
  }
  [NSNotificationCenter.defaultCenter removeObserver:_inboxSDKAvailabilityObserver];
  _inboxSDKAvailabilityObserver = nil;
}

/**
 * The SDK instance as seen from the main queue.
 *
 * Reads the manager rather than `_sdk`, which is owned by the method queue: initialize() writes it
 * there, so reading it from main would be a data race. The manager is the agreed hand-off point —
 * AttentiveInboxView reads it the same way, with the same class check. (The manager's own property
 * is not yet synchronised; MSDK-509.)
 */
- (ATTNNativeSDK *)availableSDKFromManager {
  id maybeSDK = AttentiveSDKManager.shared.sdk;
  return [maybeSDK isKindOfClass:ATTNNativeSDK.class] ? (ATTNNativeSDK *)maybeSDK : nil;
}

// Main queue only.
- (void)inboxSDKDidBecomeAvailable {
  ATTNNativeSDK *sdk = [self availableSDKFromManager];
  if (sdk == nil) {
    return;
  }

  [self stopObservingSDKAvailabilityForInbox];
  [self startObservingInboxUnreadCountWithSDK:sdk];

  // Registering the observer is not enough on its own: it only carries *changes*, so a consumer
  // whose read was rejected would keep showing the initial value until the count next moved.
  // Refresh so the first real count is delivered too — the caller asked for it, and this is the
  // call they would otherwise have to know to make again.
  uint64_t deliveriesBeforeRefresh = _unreadCountDeliveries;
  __weak __typeof(self) weakSelf = self;
  [sdk refreshInboxUnreadCountWithCompletion:^(NSNumber *unreadCount) {
    if (unreadCount == nil) {
      return;
    }
    [weakSelf deliverRefreshedInboxUnreadCount:unreadCount.integerValue
                            ifNoDeliverySince:deliveriesBeforeRefresh];
  }];
}

// Idempotent — the token is created once and reused, so repeated getInboxUnreadCount calls do not
// stack observers. Main queue only.
- (void)startObservingInboxUnreadCountWithSDK:(ATTNNativeSDK *)sdk {
  if (_inboxUnreadCountObserver != nil || sdk == nil) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  _inboxUnreadCountObserver = [sdk observeInboxUnreadCountWithHandler:^(NSInteger unreadCount) {
    [weakSelf emitInboxUnreadCount:unreadCount];
  }];
}

/**
 * Delivers an explicitly refreshed count, unless the change observer already delivered it.
 *
 * An explicit refresh has to reach JS even when the value did not change: the caller may discard
 * the promise, and device events have no replay, so a listener that mounted since the last
 * delivery would otherwise never learn the count. But when the count *did* change, the observer
 * has already emitted it during this refresh, and repeating it is exactly the redundant hop
 * emitInboxUnreadCount: filters out. The delivery counter separates those two cases without a
 * second source of truth for "what has JS seen".
 */
- (void)deliverRefreshedInboxUnreadCount:(NSInteger)unreadCount
                       ifNoDeliverySince:(uint64_t)deliveries {
  if (_unreadCountDeliveries != deliveries) {
    return;
  }

  [self emitInboxUnreadCount:unreadCount force:YES];
}

- (void)emitInboxUnreadCount:(NSInteger)unreadCount {
  [self emitInboxUnreadCount:unreadCount force:NO];
}

- (void)emitInboxUnreadCount:(NSInteger)unreadCount force:(BOOL)force {
  // Filter repeats, which is what addInboxUnreadCountListener already documents ("repeats of the
  // same value are filtered out natively"). Android gets this free from StateFlow's
  // distinctUntilChanged; iOS has two paths into this method — the change observer and the explicit
  // emit in getInboxUnreadCount's completion — so without a last-value check a refresh delivers the
  // count twice when it changed and re-delivers it when it did not. That is not a one-off: README
  // and AGENTS tell iOS integrators to refresh on every foreground and after every push open, and
  // each redundant delivery costs a native->JS hop plus a setState in every subscriber.
  if (!force && _hasEmittedUnreadCount && unreadCount == _lastEmittedUnreadCount) {
    return;
  }

  if (![self emitDeviceEvent:kAttentiveInboxUnreadCountEventName
                     payload:@{ @"unreadCount" : @(unreadCount) }]) {
    RCTLogWarn(@"[AttentiveSDK] Dropping inbox unread count %ld: no JS runtime attached yet.",
               (long)unreadCount);
    return;
  }

  // Recorded only after a delivery that actually happened, so a drop does not suppress the next
  // identical value.
  _lastEmittedUnreadCount = unreadCount;
  _hasEmittedUnreadCount = YES;
  _unreadCountDeliveries++;
}

// The observer is block-based, so it must be removed explicitly; a weak self in the handler stops
// calls into a dead module but would still leak the registration itself.
- (void)dealloc {
  if (_inboxUnreadCountObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_inboxUnreadCountObserver];
    _inboxUnreadCountObserver = nil;
  }
  if (_inboxSDKAvailabilityObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_inboxSDKAvailabilityObserver];
    _inboxSDKAvailabilityObserver = nil;
  }
}

- (void)destroyCreative {
  dispatch_async(dispatch_get_main_queue(), ^{
//    [self->_sdk closeCreative]
    [self->_sdk notifyCreativeDestroyed];
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
