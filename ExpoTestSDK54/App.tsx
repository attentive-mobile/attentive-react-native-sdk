import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import {
  initialize,
  identify,
  triggerCreative,
  clearUser,
  recordProductViewEvent,
} from '@attentive-mobile/attentive-react-native-sdk';
import type { AttentiveSdkConfiguration } from '@attentive-mobile/attentive-react-native-sdk';

export default function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const config: AttentiveSdkConfiguration = {
      attentiveDomain: 'attentivetexts',
      mode: 'debug',
      enableDebugger: true,
    };

    try {
      initialize(config);
      setInitialized(true);
    } catch (error) {
      Alert.alert('SDK Init Error', String(error));
    }
  }, []);

  const handleIdentify = () => {
    identify({
      phone: '+15671230987',
      email: 'test@example.com',
      clientUserId: 'EXPO54_TEST_USER',
    });
    Alert.alert('Identified', 'User identified successfully');
  };

  const handleTriggerCreative = () => {
    triggerCreative();
  };

  const handleProductView = () => {
    recordProductViewEvent({
      items: [{ productId: 'SKU-001', productVariantId: 'VAR-001', price: '29.99', currency: 'USD' }],
      deeplink: 'https://example.com/product/001',
    });
    Alert.alert('Event Sent', 'Product view event recorded');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo SDK 54 + Attentive SDK Test</Text>
      <Text style={styles.status}>
        SDK Status: {initialized ? 'Initialized' : 'Not Initialized'}
      </Text>
      <View style={styles.buttons}>
        <Button title="Identify User" onPress={handleIdentify} />
        <Button title="Trigger Creative" onPress={handleTriggerCreative} />
        <Button title="Record Product View" onPress={handleProductView} />
        <Button title="Clear User" onPress={() => clearUser()} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  buttons: {
    gap: 10,
    width: '100%',
    maxWidth: 300,
  },
});
