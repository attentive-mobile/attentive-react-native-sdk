/**
 * Bonni Beauty App
 * React Native example app demonstrating Attentive SDK integration
 */

import React, { useEffect, useState, useCallback } from 'react'
import { StatusBar, Platform, AppState, AppStateStatus } from 'react-native'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  initialize,
  identify,
  registerForPushNotifications,
  registerDeviceToken,
  handlePushOpened,
  handleForegroundNotification,
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
    // Initialize the Attentive SDK
    const config: AttentiveSdkConfiguration = {
      attentiveDomain: 'games', // Replace with your Attentive domain
      mode: 'production',
      enableDebugger: true,
    }
    initialize(config)

    // Identify user with sample identifiers (like iOS AppDelegate)
    identify({
      phone: '+15671230987',
      email: 'someemail@email.com',
      clientUserId: 'APP_USER_ID',
      shopifyId: '207119551',
      klaviyoId: '555555',
      customIdentifiers: { customId: 'customIdValue' },
    })

    // Setup push notifications (iOS only for now)
    if (Platform.OS === 'ios') {
      setupPushNotifications()
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
  }, [])

  /**
   * Setup push notification handlers (mirrors iOS AppDelegate implementation)
   */
  const setupPushNotifications = useCallback(() => {
    // Handle device token registration
    PushNotificationIOS.addEventListener('register', async (deviceToken: string) => {
      console.log('[Attentive] Device token received:', deviceToken.substring(0, 16) + '...')

      // Store token for display in Settings screen
      await AsyncStorage.setItem('deviceToken', deviceToken)
      await AsyncStorage.setItem('deviceTokenForDisplay', deviceToken)

      // Get authorization status and register with SDK
      PushNotificationIOS.checkPermissions((permissions) => {
        let authStatus: PushAuthorizationStatus = 'notDetermined'
        if (permissions.alert || permissions.badge || permissions.sound) {
          authStatus = 'authorized'
        }

        // Register device token with Attentive SDK
        registerDeviceToken(deviceToken, authStatus)
      })
    })

    // Handle registration errors
    PushNotificationIOS.addEventListener('registrationError', (error) => {
      console.error('[Attentive] Push registration error:', error)
    })

    // Handle push notifications received while app is in foreground
    PushNotificationIOS.addEventListener('notification', (notification: PushNotification) => {
      const userInfo = notification.getData()
      console.log('[Attentive] Push notification received in foreground:', userInfo)

      // Notify SDK about foreground notification
      handleForegroundNotification(userInfo)

      // Complete the notification
      notification.finish(PushNotificationIOS.FetchResult.NoData)
    })

    // Handle local notifications
    PushNotificationIOS.addEventListener('localNotification', (notification: PushNotification) => {
      console.log('[Attentive] Local notification received:', notification.getMessage())
      notification.finish(PushNotificationIOS.FetchResult.NoData)
    })

    // Request push notification permissions
    registerForPushNotifications()

    // Check for initial notification (app was launched from push notification)
    PushNotificationIOS.getInitialNotification().then((notification) => {
      if (notification) {
        console.log('[Attentive] App launched from notification')
        const userInfo = notification.getData()

        PushNotificationIOS.checkPermissions((permissions) => {
          let authStatus: PushAuthorizationStatus = 'notDetermined'
          if (permissions.alert || permissions.badge || permissions.sound) {
            authStatus = 'authorized'
          }

          // App was launched from notification, so it was in background/terminated
          handlePushOpened(userInfo, 'background', authStatus)
        })
      }
    })
  }, [])

  /**
   * Handle notification open (called when app is opened from notification)
   * This mirrors the iOS AppDelegate's userNotificationCenter:didReceive:
   */
  const handleNotificationOpen = useCallback((notification: PushNotification) => {
    const userInfo = notification.getData()
    console.log('[Attentive] Notification opened:', userInfo)

    // Get current app state to determine how to handle
    const appState = AppState.currentState

    // Get authorization status
    PushNotificationIOS.checkPermissions((permissions) => {
      let authStatus: PushAuthorizationStatus = 'notDetermined'
      if (permissions.alert || permissions.badge || permissions.sound) {
        authStatus = 'authorized'
      }

      // Determine application state for SDK
      let applicationState: 'active' | 'inactive' | 'background' = 'background'
      if (appState === 'active') {
        applicationState = 'active'
      } else if (appState === 'inactive') {
        applicationState = 'inactive'
      }

      // Notify SDK about push open
      handlePushOpened(userInfo, applicationState, authStatus)
    })

    notification.finish(PushNotificationIOS.FetchResult.NoData)
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
