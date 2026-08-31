//
//  AttentiveInboxView.mm
//  AttentiveReactNativeSdk
//
//  Like AttentiveReactNativeSdk.mm, only the new architecture path is implemented here. The old
//  architecture would need an RCTViewManager; that work is tracked with the module's own old-arch
//  gap (MSDK-350) rather than duplicated per component.
//

#import "AttentiveInboxView.h"

#ifdef RCT_NEW_ARCH_ENABLED

#import <react/renderer/components/AttentiveReactNativeSdkSpec/ComponentDescriptors.h>
#import <react/renderer/components/AttentiveReactNativeSdkSpec/Props.h>
#import <react/renderer/components/AttentiveReactNativeSdkSpec/RCTComponentViewHelpers.h>
#import <React/RCTConversions.h>
#import <React/RCTLog.h>
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

// Paired with AttentiveSDKManager.sdkDidBecomeAvailable on the Swift side. Notification.Name is a
// Swift struct and so can't cross into Objective-C as a constant; the literal is the contract.
static NSString *const kAttentiveSDKDidBecomeAvailable = @"ATTNSDKDidBecomeAvailable";

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

  if (self.window == nil) {
    return;
  }

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
  if (_inboxViewController == nil) {
    id maybeSDK = AttentiveSDKManager.shared.sdk;
    ATTNNativeSDK *sdk = [maybeSDK isKindOfClass:ATTNNativeSDK.class] ? (ATTNNativeSDK *)maybeSDK : nil;
    if (sdk == nil) {
      [self observeSDKAvailability];
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
    [_inboxViewController willMoveToParentViewController:parent];
    [parent addChildViewController:_inboxViewController];
    [_inboxViewController didMoveToParentViewController:parent];
  }
}

/**
 * Builds the inbox controller with the theming props that iOS can express.
 *
 * `InboxStyle` covers title/body/timestamp colour, which is three of the five colour props the
 * component accepts. `unreadIndicatorColor` and `swipeBackgroundColor` have no iOS equivalent
 * (MSDK-480); they are logged once rather than silently dropped, since a prop that works on Android
 * and does nothing here is exactly the kind of thing that costs someone an afternoon.
 */
- (UIViewController *)makeInboxViewControllerWithSDK:(ATTNNativeSDK *)sdk
{
  const auto &props = *std::static_pointer_cast<const AttentiveInboxViewProps>(_props);

  if (!_loggedUnsupportedProps && (props.unreadIndicatorColor || props.swipeBackgroundColor)) {
    _loggedUnsupportedProps = YES;
    RCTLogInfo(@"[AttentiveSDK] unreadIndicatorColor and swipeBackgroundColor are Android-only for "
                "now; iOS InboxStyle has no equivalent (MSDK-480). Other inbox colours apply.");
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
    if (self.window != nil) {
      [self attachInboxIfPossible];
    }
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
                                            name:kAttentiveSDKDidBecomeAvailable
                                          object:nil];
}

- (void)stopObservingSDKAvailability
{
  if (!_observingSDKAvailability) {
    return;
  }
  _observingSDKAvailability = NO;
  [NSNotificationCenter.defaultCenter removeObserver:self
                                               name:kAttentiveSDKDidBecomeAvailable
                                             object:nil];
}

- (void)sdkDidBecomeAvailable
{
  // The manager posts from whatever thread set `sdk`; UIKit work has to be on main.
  if (NSThread.isMainThread) {
    if (self.window != nil) {
      [self attachInboxIfPossible];
    }
  } else {
    __weak __typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf != nil && strongSelf.window != nil) {
        [strongSelf attachInboxIfPossible];
      }
    });
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _inboxViewController.view.frame = self.bounds;
}

- (void)dealloc
{
  [self stopObservingSDKAvailability];
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

Class<RCTComponentViewProtocol> AttentiveInboxViewCls(void)
{
  return AttentiveInboxView.class;
}

#endif
