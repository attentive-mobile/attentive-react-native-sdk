/**
 * Bonni Beauty App
 * React Native example app demonstrating Attentive SDK integration
 */

import React, { useEffect, useState, useCallback } from 'react'
import { StatusBar, Platform, AppState } from 'react-native'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  initialize,
  identify,
  registerForPushNotifications,
  registerDeviceTokenWithCallback,
  handleRegularOpen,
  handleForegroundPush,
  handlePushOpen,
  type AttentiveSdkConfiguration,
  type PushAuthorizationStatus,
} from '@attentive-mobile/attentive-react-native-sdk'
import PushNotificationIOS, { PushNotification } from '@react-native-community/push-notification-ios'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { CartProvider } from './src/models/CartContext'
import CustomHeader from './src/components/CustomHeader'
import LoginScreen from './src/screens/LoginScreen'
import CreateAccountScreen from './src/screens/CreateAccountScreen'
import ProductListScreen from './src/screens/ProductListScreen'
import ProductDetailScreen from './src/screens/ProductDetailScreen'
import CartScreen from './src/screens/CartScreen'
import CheckoutScreen from './src/screens/CheckoutScreen'
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import { RootStackParamList } from './src/types/navigation'
import { Colors } from './src/constants/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

// Stable function reference to avoid recreating on every render
const renderCustomHeader = () => <CustomHeader />

/**
 * Screens that don't show a header - StatusBar should match their background
 */
const SCREENS_WITHOUT_HEADER: Record<string, string> = {
  Login: 'transparent', // ImageBackground - transparent so image shows through
  OrderConfirmation: Colors.white, // White background
}

function App(): React.JSX.Element {
  const navigationRef = useNavigationContainerRef<RootStackParamList>()
  // Initialize with transparent since Login is the initial route
  const [statusBarBackgroundColor, setStatusBarBackgroundColor] = useState<string>('transparent')

  useEffect(() => {
    console.log('🚀 [Attentive] App.tsx useEffect - Starting initialization')
    console.log('   Platform:', Platform.OS)

    // Initialize the Attentive SDK
    const config: AttentiveSdkConfiguration = {
      attentiveDomain: 'games', // Replace with your Attentive domain
      mode: 'production',
      enableDebugger: true,
    }
    console.log('📦 [Attentive] Initializing SDK with config:', config)
    initialize(config)
    console.log('✅ [Attentive] SDK initialized')

    // Identify user with sample identifiers (like iOS AppDelegate)
    console.log('👤 [Attentive] Identifying user')
    identify({
      phone: '+15671230987',
      email: 'someemail@email.com',
      clientUserId: 'APP_USER_ID',
      shopifyId: '207119551',
      klaviyoId: '555555',
      customIdentifiers: { customId: 'customIdValue' },
    })
    console.log('✅ [Attentive] User identified')

    // Setup push notifications (iOS only for now)
    if (Platform.OS === 'ios') {
      console.log('📱 [Attentive] Setting up push notifications for iOS')
      setupPushNotifications()
      console.log('✅ [Attentive] Push notification setup complete')
    } else {
      console.log('⚠️ [Attentive] Not iOS - skipping push notification setup')
    }

    return () => {
      // Cleanup push notification listeners
      if (Platform.OS === 'ios') {
        PushNotificationIOS.removeEventListener('register')
        PushNotificationIOS.removeEventListener('registrationError')
        PushNotificationIOS.removeEventListener('notification')
        PushNotificationIOS.removeEventListener('localNotification')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Handle notification open (called when app is opened from notification)
   *
   * This is the TypeScript equivalent of the native iOS AppDelegate method:
   * ```swift
   * func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
   *     UNUserNotificationCenter.current().getNotificationSettings { settings in
   *       let authStatus = settings.authorizationStatus
   *       DispatchQueue.main.async {
   *         switch UIApplication.shared.applicationState {
   *         case .active:
   *           self.attentiveSdk?.handleForegroundPush(response: response, authorizationStatus: authStatus)
   *         case .background, .inactive:
   *           self.attentiveSdk?.handlePushOpen(response: response, authorizationStatus: authStatus)
   *         @unknown default:
   *           self.attentiveSdk?.handlePushOpen(response: response, authorizationStatus: authStatus)
   *         }
   *       }
   *     }
   *     completionHandler()
   *   }
   * ```
   */
  const handleNotificationOpen = useCallback((notification: PushNotification) => {
    const userInfo = notification.getData()
    console.log('[Attentive] Notification opened:', userInfo)

    // Get current app state (equivalent to UIApplication.shared.applicationState)
    const appState = AppState.currentState
    console.log('[Attentive] Current app state:', appState)

    // Get authorization status (equivalent to getNotificationSettings)
    PushNotificationIOS.checkPermissions((permissions) => {
      let authStatus: PushAuthorizationStatus = 'notDetermined'
      if (permissions.alert || permissions.badge || permissions.sound) {
        authStatus = 'authorized'
      }
      console.log('[Attentive] Authorization status:', authStatus)

      // Determine which SDK method to call based on app state
      // This matches the native iOS switch statement exactly
      switch (appState) {
        case 'active':
          // App is in foreground - handle as foreground push
          console.log('[Attentive] App state: active - calling handleForegroundPush')
          handleForegroundPush(userInfo, authStatus)
          break

        case 'background':
        case 'inactive':
          // App is in background or inactive - handle as push open
          console.log('[Attentive] App state: background/inactive - calling handlePushOpen')
          handlePushOpen(userInfo, authStatus)
          break

        default:
          // Unknown state - default to push open behavior (matches @unknown default in Swift)
          console.log('[Attentive] App state: unknown - calling handlePushOpen')
          handlePushOpen(userInfo, authStatus)
          break
      }
    })

    notification.finish(PushNotificationIOS.FetchResult.NoData)
  }, [])

  /**
   * Setup push notification handlers (mirrors iOS AppDelegate implementation)
   * This is the TypeScript equivalent of:
   * func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
   *     UNUserNotificationCenter.current().getNotificationSettings { settings in
   *         let authStatus = settings.authorizationStatus
   *         attentiveSdk?.registerDeviceToken(deviceToken, authorizationStatus: authStatus, callback: { data, url, response, error in
   *             DispatchQueue.main.async {
   *                 self.attentiveSdk?.handleRegularOpen(authorizationStatus: authStatus)
   *             }
   *         })
   *     }
   * }
   */
  const setupPushNotifications = useCallback(() => {
    console.log('🔧 [Attentive] setupPushNotifications called')

    // Handle device token registration
    console.log('📝 [Attentive] Adding "register" event listener')
    PushNotificationIOS.addEventListener('register', async (deviceToken: string) => {
      console.log('🎫 [Attentive] Device token received from APNs')
      console.log('   Token (preview):', deviceToken.substring(0, 16) + '...')
      console.log('   Token (full):', deviceToken)
      console.log('   Token length:', deviceToken.length)

      // Store token for display in Settings screen
      await AsyncStorage.setItem('deviceToken', deviceToken)
      await AsyncStorage.setItem('deviceTokenForDisplay', deviceToken)

      // Get authorization status and register with SDK (equivalent to getNotificationSettings)
      PushNotificationIOS.checkPermissions((permissions) => {
        let authStatus: PushAuthorizationStatus = 'notDetermined'
        if (permissions.alert || permissions.badge || permissions.sound) {
          authStatus = 'authorized'
        }

        console.log('✅ [Attentive] Authorization status:', authStatus)
        console.log('📤 [Attentive] Registering device token with Attentive SDK (with callback)')

        // Register device token with callback-based method (equivalent to Swift callback-based registration)
        registerDeviceTokenWithCallback(
          deviceToken,
          authStatus,
          (data?: Object, url?: string, response?: Object, error?: Object) => {
            console.log('📥 [Attentive] Registration callback invoked')

            if (error) {
              console.error('❌ [Attentive] Registration callback returned error:', error)
            } else {
              console.log('✅ [Attentive] Device token registered successfully')
              console.log('   Response URL:', url)
              console.log('   Response:', response)
              console.log('   Data:', data)
            }

            // Trigger regular open event (equivalent to DispatchQueue.main.async { handleRegularOpen })
            console.log('📱 [Attentive] Triggering regular open event from callback')
            handleRegularOpen(authStatus)
            console.log('✅ [Attentive] Regular open event triggered successfully')
          }
        )
      })
    })

    // Handle registration errors
    console.log('📝 [Attentive] Adding "registrationError" event listener')
    PushNotificationIOS.addEventListener('registrationError', (error) => {
      console.error('❌ [Attentive] Push registration error:', error)
    })

    // Handle push notifications received while app is in foreground
    console.log('📝 [Attentive] Adding "notification" event listener')
    PushNotificationIOS.addEventListener('notification', (notification: PushNotification) => {
      const userInfo = notification.getData()
      console.log('[Attentive] Push notification received in foreground:', userInfo)

      // Get authorization status and call handleForegroundPush
      // This provides better tracking than the legacy handleForegroundNotification
      PushNotificationIOS.checkPermissions((permissions) => {
        let authStatus: PushAuthorizationStatus = 'notDetermined'
        if (permissions.alert || permissions.badge || permissions.sound) {
          authStatus = 'authorized'
        }

        // Use handleForegroundPush for better tracking (matches native iOS pattern)
        console.log('[Attentive] Calling handleForegroundPush for foreground notification')
        handleForegroundPush(userInfo, authStatus)
      })

      // Complete the notification
      notification.finish(PushNotificationIOS.FetchResult.NoData)
    })

    // Handle local notifications and notification taps
    console.log('📝 [Attentive] Adding "localNotification" event listener')
    PushNotificationIOS.addEventListener('localNotification', (notification: PushNotification) => {
      console.log('🔔 [Attentive] Local notification received:', notification.getMessage())
      handleNotificationOpen(notification)
    })

    // Request push notification permissions
    console.log('🔐 [Attentive] Requesting push notification permissions via native bridge')
    registerForPushNotifications()
    console.log('✅ [Attentive] Permission request sent')

    // Check for initial notification (app was launched from push notification)
    PushNotificationIOS.getInitialNotification().then((notification) => {
      if (notification) {
        console.log('[Attentive] App launched from notification')
        handleNotificationOpen(notification)
      }
    })
  }, [])

  // Set initial status bar color for Login screen (initial route)
  useEffect(() => {
    // Login is the initial route, so set transparent immediately
    setStatusBarBackgroundColor('transparent')
  }, [])

  /**
   * Updates StatusBar backgroundColor based on current screen
   * - If screen has no header, use screen-specific background color
   * - If screen has header, use peach to match header
   */
  const handleNavigationStateChange = useCallback(() => {
    try {
      if (!navigationRef.isReady()) {
        return
      }

      const currentRoute = navigationRef.getCurrentRoute()
      if (!currentRoute) {
        // Keep transparent for Login (initial route) if no route yet
        return
      }

      const routeName = currentRoute.name as keyof RootStackParamList

      // Explicitly handle Login screen to ensure transparent
      if (routeName === 'Login') {
        setStatusBarBackgroundColor('transparent')
        return
      }

      const screenBackgroundColor = SCREENS_WITHOUT_HEADER[routeName]

      if (screenBackgroundColor) {
        // Screen without header - use screen-specific background
        setStatusBarBackgroundColor(screenBackgroundColor)
      } else {
        // Screen with header - use peach to match header
        setStatusBarBackgroundColor(Colors.peach)
      }
    } catch (error) {
      // Navigation ref might not be ready yet, keep transparent for Login
    }
  }, [navigationRef])

  // For Android, transparent string might not work - use rgba format
  // With translucent=true, the background will still show through
  const statusBarColor = Platform.OS === 'android' && statusBarBackgroundColor === 'transparent'
    ? 'rgba(0,0,0,0)' // Fully transparent rgba for Android compatibility
    : statusBarBackgroundColor

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={statusBarColor}
        translucent={true}
      />
      <CartProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={handleNavigationStateChange}
          onStateChange={handleNavigationStateChange}
        >
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: Colors.peach,
            },
            headerTintColor: '#000',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerBackVisible: false,
          }}
        >
          {/* Login Flow */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="CreateAccount"
            component={CreateAccountScreen}
            options={{
              title: 'Create Account',
              headerBackTitle: 'Back',
            }}
          />

          {/* Main App Flow */}
          <Stack.Screen
            name="ProductList"
            component={ProductListScreen}
            options={{
              header: renderCustomHeader,
            }}
          />

          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              header: renderCustomHeader,
            }}
          />

          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{
              header: renderCustomHeader,
            }}
          />

          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              header: renderCustomHeader,
            }}
          />

          <Stack.Screen
            name="OrderConfirmation"
            component={OrderConfirmationScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              header: renderCustomHeader,
            }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  )
}

export default App
