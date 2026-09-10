//
//  AttentiveInboxView.h
//  AttentiveReactNativeSdk
//
//  Fabric host component backing <AttentiveInboxView /> — the inbox default renderer.
//

#import <UIKit/UIKit.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>

// The component name in AttentiveInboxViewNativeComponent.ts must match this class name —
// Fabric resolves a component to its view class by name.
@interface AttentiveInboxView : RCTViewComponentView
@end
#endif
