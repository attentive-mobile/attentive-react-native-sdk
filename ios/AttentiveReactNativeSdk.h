//
//  AttentiveReactNativeSdk.h
//  AttentiveReactNativeSdk
//
//  Created by Wyatt Davis on 2/13/23.
//

#ifdef RCT_NEW_ARCH_ENABLED
#import "AttentiveReactNativeSdkSpec.h"

@interface AttentiveReactNativeSdk : NSObject <NativeAttentiveReactNativeSdkSpec>
#else
#import <React/RCTBridgeModule.h>

@interface AttentiveReactNativeSdk : NSObject <RCTBridgeModule>
#endif

@end
