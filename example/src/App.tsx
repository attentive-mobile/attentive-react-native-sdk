import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  initialize,
  identify,
  type AttentiveSdkConfiguration,
  type UserIdentifiers,
} from '@attentive-mobile/attentive-react-native-sdk';

import HomeScreen from './HomeScreen';
import ProductScreen from './ProductScreen';
import type { RootStackParamList } from './navTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize the SDK with New Architecture support
    const config: AttentiveSdkConfiguration = {
      attentiveDomain: 'vs',
      mode: 'debug',
      enableDebugger: true,
    };
    initialize(config);

    // Identify the user
    const identifiers: UserIdentifiers = {
      phone: '+15556667777',
      email: 'demo@example.com',
      klaviyoId: 'userKlaviyoId',
      shopifyId: 'userShopifyId',
      clientUserId: 'userClientUserId',
      customIdentifiers: { customIdKey: 'customIdValue' },
    };
    identify(identifiers);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#841584',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Attentive SDK Example' }}
        />
        <Stack.Screen
          name="Product"
          component={ProductScreen}
          options={{ title: 'Product Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
