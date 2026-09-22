//
//  AttentiveInboxView.mm
//  AttentiveReactNativeSdk
//
//  Like AttentiveReactNativeSdk.mm, only the new architecture path is implemented here. The old
//  architecture would need an RCTViewManager; that work is tracked with the module's own old-arch
//  gap rather than duplicated per component.
//

#import "AttentiveInboxView.h"

#ifdef RCT_NEW_ARCH_ENABLED

#import <react/renderer/components/AttentiveReactNativeSdkSpec/ComponentDescriptors.h>
#import <react/renderer/components/AttentiveReactNativeSdkSpec/EventEmitters.h>
#import <react/renderer/components/AttentiveReactNativeSdkSpec/Props.h>
#import <react/renderer/components/AttentiveReactNativeSdkSpec/RCTComponentViewHelpers.h>
#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

// Must precede the generated Swift header: ATTNNativeSDK's push methods surface
// UNAuthorizationStatus / UNNotificationResponse in it, and those types are otherwise
// unknown here. AttentiveReactNativeSdk.mm imports this for the same reason.
#import <UserNotifications/UserNotifications.h>

#if __has_include(<attentive_react_native_sdk/attentive_react_native_sdk-Swift.h>)
#import <attentive_react_native_sdk/attentive_react_native_sdk-Swift.h>
#elif __has_include(<AttentiveReactNativeSdk-Swift.h>)
#import "AttentiveReactNativeSdk-Swift.h"
#else
#import "attentive_react_native_sdk-Swift.h"
#endif

using namespace facebook::react;

@interface AttentiveInboxView () <RCTAttentiveInboxViewViewProtocol>
@end

@implementation AttentiveInboxView {
  UIViewController *_inboxViewController;
  BOOL _observingSDKAvailability;
  BOOL _loggedUnsupportedProps;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<AttentiveInboxViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const AttentiveInboxViewProps>();
    _props = defaultProps;
    [NSNotificationCenter.defaultCenter addObserver:self
                                           selector:@selector(inboxMessageTapped:)
                                               name:AttentiveSDKManager.inboxMessageTappedName
                                             object:nil];
  }
  return self;
}

/**
 * The inbox controller is built lazily on first attach rather than in init, because it needs the
 * SDK instance — and on iOS the SDK is created by JS calling initialize(). A view mounted before
 * that would capture nil; retrying on each attach means it recovers instead of rendering blank
 * forever.
 */
- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self attachInboxIfPossible];
}

/**
 * Builds and embeds the inbox controller once the SDK exists.
 *
 * The controller is created lazily rather than in init because on iOS the SDK instance only comes
 * into being when JS calls initialize(). A view mounted before that — a host app whose first screen
 * is the inbox, or any JS reload — would otherwise capture nil and stay blank forever, so when the
 * SDK is missing we wait for AttentiveSDKManager's availability broadcast instead of giving up.
 */
- (void)attachInboxIfPossible
{
  // The window precondition lives here rather than at each call site: a controller embedded in a
  // view with no window has nothing to attach to, and every caller would otherwise have to know
  // that. Cheap to re-check, and it means didMoveToWindow, the updateProps rebuild and
  // sdkDidBecomeAvailable can all just call this.
  if (self.window == nil) {
    return;
  }

  if (_inboxViewController == nil) {
    // Subscribe *before* reading, not after. `AttentiveSDKManager.sdk` is set from whichever
    // thread called initialize() — the module's method queue, not this one — and its didSet posts
    // the broadcast synchronously. Read-then-subscribe therefore has a window: a read that finds
    // nil, a post that lands before the observer exists, and then a subscription that will never
    // hear anything. That broadcast is the *only* thing that ever brings this view back, so losing
    // it means a permanently blank inbox for the whole session, recoverable only by a remount.
    //
    // Subscribing first cannot lose the post, and costs an add/remove pair on the path where the
    // SDK already exists. observeSDKAvailability is idempotent, so repeat calls are free.
    [self observeSDKAvailability];

    id maybeSDK = AttentiveSDKManager.shared.sdk;
    ATTNNativeSDK *sdk = [maybeSDK isKindOfClass:ATTNNativeSDK.class] ? (ATTNNativeSDK *)maybeSDK : nil;
    if (sdk == nil) {
      // Stay subscribed; sdkDidBecomeAvailable calls back into this method.
      return;
    }

    [self stopObservingSDKAvailability];
    _inboxViewController = [self makeInboxViewControllerWithSDK:sdk];
    _inboxViewController.view.frame = self.bounds;
    _inboxViewController.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_inboxViewController.view];
  }

  // View-controller containment: the inbox is a UIHostingController, so it needs a real parent to
  // receive appearance callbacks and resolve safe-area insets. Without this the SwiftUI content
  // renders but never learns it became visible.
  UIViewController *parent = self.reactViewController;
  if (parent != nil && _inboxViewController.parentViewController != parent) {
    // Detach from any previous parent first. The guard above is also true when the controller is
    // already parented somewhere *else* (the view moved between screen controllers, e.g. into a
    // modal), and UIKit requires an explicit removal before re-parenting.
    if (_inboxViewController.parentViewController != nil) {
      [_inboxViewController willMoveToParentViewController:nil];
      [_inboxViewController removeFromParentViewController];
    }

    // No explicit willMoveToParentViewController: here — addChildViewController: sends it, so
    // calling it as well delivers two willMove callbacks for one transition. Only the didMove half
    // has to be sent by hand.
    [parent addChildViewController:_inboxViewController];
    [_inboxViewController didMoveToParentViewController:parent];
  }
}

/**
 * Builds the inbox controller with the theming props that iOS can express.
 *
 * `InboxStyle` covers title/body/timestamp colour, which is three of the five colour props the
 * component accepts. `unreadIndicatorColor` and `swipeBackgroundColor` have no iOS equivalent
 * yet; they are logged once rather than silently dropped, since a prop that works on Android
 * and does nothing here is exactly the kind of thing that costs someone an afternoon.
 */
- (UIViewController *)makeInboxViewControllerWithSDK:(ATTNNativeSDK *)sdk
{
  const auto &props = *std::static_pointer_cast<const AttentiveInboxViewProps>(_props);

  if (!_loggedUnsupportedProps && (props.unreadIndicatorColor || props.swipeBackgroundColor)) {
    _loggedUnsupportedProps = YES;
    RCTLogInfo(@"[AttentiveSDK] unreadIndicatorColor and swipeBackgroundColor are Android-only for "
                "now and have no effect on iOS. Other inbox colours apply.");
  }

  // Convert only colours that were actually set. An unset SharedColor holds Color(nullptr), which
  // does convert to nil today, but the contract that matters here is "nil means keep the SDK's own
  // default" — so test it explicitly rather than lean on that chain.
  UIColor *titleColor = props.titleTextColor ? RCTUIColorFromSharedColor(props.titleTextColor) : nil;
  UIColor *bodyColor = props.bodyTextColor ? RCTUIColorFromSharedColor(props.bodyTextColor) : nil;
  UIColor *timestampColor =
      props.timestampTextColor ? RCTUIColorFromSharedColor(props.timestampTextColor) : nil;

  return [sdk makeInboxViewControllerWithTitleColor:titleColor
                                          bodyColor:bodyColor
                                     timestampColor:timestampColor];
}

/**
 * `InboxStyle` is passed once when the SwiftUI inbox is created, so a colour change has to rebuild
 * the controller. That resets scroll position, which is acceptable for theming — colours are
 * normally static — and is why the check is narrow: only the three colours iOS actually applies.
 */
- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  // The old side must come from _props, not from the oldProps argument: Fabric passes null there
  // on a view's first update, and dereferencing it segfaults inside SharedColor's comparison
  // (EXC_BAD_ACCESS in Color::operator==). RCTViewComponentView reads *_props for the same reason.
  // Both reads must happen before super, which replaces _props.
  const auto &oldViewProps = static_cast<const AttentiveInboxViewProps &>(*_props);
  const auto &newViewProps = static_cast<const AttentiveInboxViewProps &>(*props);

  const BOOL styleChanged = oldViewProps.titleTextColor != newViewProps.titleTextColor ||
      oldViewProps.bodyTextColor != newViewProps.bodyTextColor ||
      oldViewProps.timestampTextColor != newViewProps.timestampTextColor;

  [super updateProps:props oldProps:oldProps];

  if (styleChanged && _inboxViewController != nil) {
    [self teardownInboxViewController];
    [self attachInboxIfPossible];
  }
}

- (void)teardownInboxViewController
{
  if (_inboxViewController == nil) {
    return;
  }
  [_inboxViewController willMoveToParentViewController:nil];
  [_inboxViewController.view removeFromSuperview];
  [_inboxViewController removeFromParentViewController];
  _inboxViewController = nil;
}

- (void)observeSDKAvailability
{
  if (_observingSDKAvailability) {
    return;
  }
  _observingSDKAvailability = YES;
  [NSNotificationCenter.defaultCenter addObserver:self
                                        selector:@selector(sdkDidBecomeAvailable)
                                            name:AttentiveSDKManager.sdkDidBecomeAvailableName
                                          object:nil];
}

- (void)stopObservingSDKAvailability
{
  if (!_observingSDKAvailability) {
    return;
  }
  _observingSDKAvailability = NO;
  [NSNotificationCenter.defaultCenter removeObserver:self
                                               name:AttentiveSDKManager.sdkDidBecomeAvailableName
                                             object:nil];
}

/**
 * Turns the SDK's inbox tap broadcast into the component's `onMessageTap` event.
 *
 * The broadcast is used rather than `inboxViewController`'s `onMessageTap:` closure because the
 * closure *replaces* the SDK's own routing — it returns before the deep-link open — whereas this
 * is pure observation. Since Fabric never tells a native view whether JS actually attached a
 * handler, the RN SDK has to register unconditionally; with the closure that would silently cost
 * every consumer their deep links, so navigation stays governed by
 * `automaticallyOpensInboxDeepLinks` alone. That is the same split the Android SDK makes.
 *
 * Known limitation: the broadcast carries no view identity, so two `AttentiveInboxView`s mounted
 * at once both emit for a tap on either. Android's listener is per-view and does not have this.
 */
- (void)inboxMessageTapped:(NSNotification *)notification
{
  // Null before the view is mounted and after it is unmounted; Fabric owns the lifetime.
  if (_eventEmitter == nullptr) {
    return;
  }

  NSDictionary *userInfo = notification.userInfo;
  id rawMessageId = userInfo[AttentiveSDKManager.inboxMessageTappedMessageIdKey];
  NSString *messageId = [rawMessageId isKindOfClass:NSString.class] ? (NSString *)rawMessageId : nil;
  if (messageId.length == 0) {
    // The id is the only part of the payload a JS handler cannot work without, so a broadcast
    // missing it is dropped rather than delivered half-formed.
    RCTLogWarn(@"[AttentiveSDK] Ignoring an inbox tap broadcast with no message id.");
    return;
  }

  // The SDK posts an NSURL here, but accept a string too: this key is re-spelled on our side
  // (the SDK exposes no constant for it), and a type change should degrade rather than crash.
  id rawActionUrl = userInfo[AttentiveSDKManager.inboxMessageTappedActionUrlKey];
  NSString *actionUrl = nil;
  if ([rawActionUrl isKindOfClass:NSURL.class]) {
    actionUrl = ((NSURL *)rawActionUrl).absoluteString;
  } else if ([rawActionUrl isKindOfClass:NSString.class]) {
    actionUrl = (NSString *)rawActionUrl;
  }

  AttentiveInboxViewEventEmitter::OnMessageTap event;
  event.messageId = messageId.UTF8String;
  // Absent deep link travels as "", not as a missing key: the generated payload writes this field
  // unconditionally, so an optional type here would be a promise iOS cannot keep.
  event.actionUrl = actionUrl != nil ? actionUrl.UTF8String : "";
  std::static_pointer_cast<const AttentiveInboxViewEventEmitter>(_eventEmitter)
      ->onMessageTap(std::move(event));
}

- (void)sdkDidBecomeAvailable
{
  // The manager posts from whatever thread set `sdk`, and UIKit work has to be on main.
  // RCTExecuteOnMainQueue runs the block inline when already on the main queue and dispatches
  // otherwise, which is exactly the branch this used to spell out by hand.
  __weak __typeof(self) weakSelf = self;
  RCTExecuteOnMainQueue(^{
    [weakSelf attachInboxIfPossible];
  });
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _inboxViewController.view.frame = self.bounds;
}

- (void)dealloc
{
  [self stopObservingSDKAvailability];
  [NSNotificationCenter.defaultCenter removeObserver:self
                                                name:AttentiveSDKManager.inboxMessageTappedName
                                              object:nil];
  // Also tear down the child controller. prepareForRecycle covers the pooling path, but a
  // component view can be deallocated outright (pool eviction, surface stop, recycling disabled),
  // and releasing self takes the controller's *view* out of the hierarchy while the screen's
  // controller still holds the UIHostingController in childViewControllers — a controller whose
  // view has no superview, still receiving appearance callbacks and still keeping the inbox's view
  // model alive for the life of the screen.
  [self teardownInboxViewController];
}

- (void)prepareForRecycle
{
  [self stopObservingSDKAvailability];
  // Fabric pools views. Tear the child controller down so a recycled instance doesn't keep a
  // controller parented to a screen that is already gone.
  [self teardownInboxViewController];
  _loggedUnsupportedProps = NO;
  [super prepareForRecycle];
}

@end

/**
 * Registration hook for React Native 0.76 and earlier. Do not delete: nothing in this file calls
 * it, so it reads as dead code.
 *
 * The two RN generations discover third-party Fabric components differently, and this component
 * satisfies both. Up to 0.76, codegen walks every library's spec and emits
 * `RCTThirdPartyFabricComponentsProvider` containing `{"AttentiveInboxView", AttentiveInboxViewCls}`
 * — it links against this symbol by name, so its absence is a link error in a consumer's app, not
 * here. From 0.77, `codegenConfig.ios.componentProvider` in package.json generates
 * `RCTThirdPartyComponentsProvider` with an `NSClassFromString` lookup instead, and this function
 * goes unreferenced. Keeping both is what lets the component work across the RN range the package
 * declares; 0.76-and-earlier codegen ignores the `componentProvider` key, which it does not know.
 */
Class<RCTComponentViewProtocol> AttentiveInboxViewCls(void)
{
  return AttentiveInboxView.class;
}

#endif
