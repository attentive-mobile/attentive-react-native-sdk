/**
 * Sample React Native App
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navTypes';
import HomeScreen from './HomeScreen';
import ProductScreen from './ProductScreen';
import {
  Attentive,
  AttentiveConfiguration,
  Mode,
  UserIdentifiers,
} from '@attentive-mobile/attentive-react-native-sdk';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): JSX.Element {
  useEffect(() => {
    const config: AttentiveConfiguration = {
      attentiveDomain: 'games',
      mode: Mode.Debug,
    };
    // 'initialize' should be called when the app starts
    // 'initialize' should only be called once per app session
    Attentive.initialize(config);

    // Identify the current user as soon as possible. All of the identifiers are optional.
    // The more you pass, the better our SDK functions.
    const identifiers: UserIdentifiers = {
      phone: '+15556667777',
      email: 'some_email@gmailfake.com',
      klaviyoId: 'userKlaviyoId',
      shopifyId: 'userShopifyId',
      clientUserId: 'userClientUserId',
      customIdentifiers: { customIdKey: 'customIdValue' },
    };
    Attentive.identify(identifiers);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="Product"
          component={ProductScreen}
          options={{ title: 'Product Screen' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
