/**
 * Bonni Beauty App
 * React Native example app demonstrating Attentive SDK integration
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  initialize,
  type AttentiveSdkConfiguration,
} from '@attentive-mobile/attentive-react-native-sdk';

import { CartProvider } from './src/models/CartContext';
import CustomHeader from './src/components/CustomHeader';
import LoginScreen from './src/screens/LoginScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { RootStackParamList } from './src/types/navigation';
import { Colors } from './src/constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Stable function reference to avoid recreating on every render
const renderCustomHeader = () => <CustomHeader />;

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize the Attentive SDK
    const config: AttentiveSdkConfiguration = {
      attentiveDomain: 'games', // Replace with your Attentive domain
      mode: 'production',
      enableDebugger: true,
    };
    initialize(config);
  }, []);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
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
  );
}

export default App;
