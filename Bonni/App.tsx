/**
 * Bonni Beauty App
 * React Native example app demonstrating Attentive SDK integration
 */

import React, { useEffect, useState, useCallback } from 'react'
import { StatusBar, Platform } from 'react-native'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  initialize,
  type AttentiveSdkConfiguration,
} from '@attentive-mobile/attentive-react-native-sdk'

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
