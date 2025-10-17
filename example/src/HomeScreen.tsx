import React from 'react';
import {
  Button,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  triggerCreative,
  clearUser as clearUserFunc,
  invokeAttentiveDebugHelper,
  exportDebugLogs,
  recordProductViewEvent,
  recordAddToCartEvent,
  recordCustomEvent,
} from '@attentive-mobile/attentive-react-native-sdk';

import type { HomeScreenProps } from './navTypes';

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const showCreative = () => {
    triggerCreative();
  };

  const showProductPage = () => {
    navigation.navigate('Product');
  };

  const clearUser = () => {
    // Call 'clearUser' if the current user logs out
    clearUserFunc();
  };

  const testDebugHelper = () => {
    // This will show the debug overlay if debugging is enabled
    invokeAttentiveDebugHelper();
  };

  const testExportDebugLogs = async () => {
    try {
      const debugLogs = await exportDebugLogs();
      Alert.alert(
        'Debug Logs Exported',
        `Successfully exported ${debugLogs.length} characters of debug data. Check console for full content.`
      );
      console.log('Exported Debug Logs:', debugLogs);
    } catch (error) {
      Alert.alert('Export Error', `Failed to export debug logs: ${error}`);
    }
  };

  const recordTestProductView = () => {
    recordProductViewEvent({
      items: [
        {
          productId: 'debug-test-product',
          productVariantId: 'debug-test-variant',
          price: '29.99',
          currency: 'USD',
          name: 'Debug Test Product',
          productImage: 'https://example.com/image.jpg',
          quantity: 1,
          category: 'test-category',
        },
      ],
      deeplink: 'attentive://product/debug-test',
    });

    Alert.alert(
      'Debug Info',
      'Product view event recorded! Check the debug overlay.'
    );
  };

  const recordTestAddToCart = () => {
    recordAddToCartEvent({
      items: [
        {
          productId: 'debug-cart-product',
          productVariantId: 'debug-cart-variant',
          price: '49.99',
          currency: 'USD',
          name: 'Debug Cart Product',
          quantity: 2,
        },
      ],
      deeplink: 'attentive://cart/debug-test',
    });

    Alert.alert(
      'Debug Info',
      'Add to cart event recorded! Check the debug overlay.'
    );
  };

  const recordTestCustomEvent = () => {
    recordCustomEvent({
      type: 'debug_test_event',
      properties: {
        test_property: 'debug_value',
        event_source: 'example_app',
        debug_timestamp: new Date().toISOString(),
      },
    });

    Alert.alert(
      'Debug Info',
      'Custom event recorded! Check the debug overlay.'
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐛 Debugging Features Demo</Text>
        <Text style={styles.description}>
          This example app has debugging enabled. When you interact with the
          buttons below, you'll see debug overlays showing the events and
          payloads being sent.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Features</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Show Creative!"
            color="#841584"
            onPress={showCreative}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="View Product Page" onPress={showProductPage} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Clear User" color="#ff6b6b" onPress={clearUser} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Helper</Text>
        <Text style={styles.description}>
          Test the manual debug helper to see debug information display.
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="🐛 Invoke Debug Helper"
            color="#4ecdc4"
            onPress={testDebugHelper}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="📤 Export Debug Logs"
            color="#ff6b6b"
            onPress={testExportDebugLogs}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Debugging</Text>
        <Text style={styles.description}>
          These buttons will trigger events and show debug information about the
          payloads.
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="📱 Test Product View Event"
            color="#45b7d1"
            onPress={recordTestProductView}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="🛒 Test Add to Cart Event"
            color="#f39c12"
            onPress={recordTestAddToCart}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="🎯 Test Custom Event"
            color="#9b59b6"
            onPress={recordTestCustomEvent}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    marginVertical: 4,
  },
});

export default HomeScreen;
