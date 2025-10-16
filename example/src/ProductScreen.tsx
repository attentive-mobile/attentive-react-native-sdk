import React, { useEffect } from 'react';
import {
  Alert,
  Button,
  Text,
  View,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { ProductScreenProps } from './navTypes';
import {
  recordProductViewEvent,
  recordAddToCartEvent,
  recordPurchaseEvent,
  recordCustomEvent,
  invokeAttentiveDebugHelper,
  type AddToCart,
  type Purchase,
  type ProductView,
  type CustomEvent,
} from '@attentive-mobile/attentive-react-native-sdk';

const ProductScreen = ({}: ProductScreenProps) => {
  const getItems = () => {
    return {
      items: [
        {
          productId: '555',
          productVariantId: '777',
          price: '14.99',
          currency: 'USD',
        },
      ],
      deeplink: 'https://mydeeplink.com/products/32432423',
    };
  };

  useEffect(() => {
    const productViewAttrs: ProductView = {
      ...getItems(),
    };

    recordProductViewEvent(productViewAttrs);
  }, []);

  const addToCart = () => {
    const addToCartAttrs: AddToCart = {
      ...getItems(),
    };
    recordAddToCartEvent(addToCartAttrs);

    Alert.alert(
      'Debug Info',
      'Add to Cart event recorded! Check the debug overlay for payload details.'
    );
  };

  const purchase = () => {
    const purchaseAttrs: Purchase = {
      items: [
        {
          productId: '555',
          productVariantId: '777',
          price: '14.99',
          currency: 'USD',
        },
      ],
      orderId: '8989',
    };
    recordPurchaseEvent(purchaseAttrs);

    Alert.alert(
      'Debug Info',
      'Purchase event recorded! Check the debug overlay for payload details.'
    );
  };

  const customEvent = () => {
    const customEventAttrs: CustomEvent = {
      type: 'Added to Wishlist',
      properties: { lastName: 'Christmas List' },
    };

    recordCustomEvent(customEventAttrs);

    Alert.alert(
      'Debug Info',
      'Custom event recorded! Check the debug overlay for payload details.'
    );
  };

  const testDebugHelper = () => {
    invokeAttentiveDebugHelper();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐛 Product Screen Debug Demo</Text>
        <Text style={styles.description}>
          This screen automatically recorded a Product View event when it
          loaded. All button interactions will show debug overlays with payload
          information.
        </Text>
      </View>

      <View style={styles.section}>
        <Image
          source={require('../assets/images/tshirt.png')}
          style={styles.productImage}
        />
        <Text style={styles.productTitle}>T-Shirt</Text>
        <Text style={styles.productPrice}>$14.99</Text>
        <Text style={styles.productDescription}>
          Product ID: 555 • Variant ID: 777
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Actions</Text>
        <View style={styles.buttonContainer}>
          <Button title="🛒 Add to Cart" color="#841584" onPress={addToCart} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="💳 Purchase" color="#27ae60" onPress={purchase} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="❤️ Add to Wishlist"
            color="#e74c3c"
            onPress={customEvent}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Helper</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="🐛 Show Debug Info"
            color="#4ecdc4"
            onPress={testDebugHelper}
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
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    color: '#27ae60',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    marginVertical: 4,
  },
});

export default ProductScreen;
