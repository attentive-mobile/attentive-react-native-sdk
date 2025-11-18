/**
 * Product Detail Screen
 * Matches the iOS ProductDetailViewController
 * Automatically records Product View event on mount
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ProductDetailScreenProps } from '../types/navigation';
import { useCart } from '../models/CartContext';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme';
import { useProductView, useAddToCart } from '../hooks/useAttentiveEvents';

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { product } = route.params;
  const { addToCart } = useCart();
  const { recordProductView } = useProductView();
  const { handleAddToCart: handleAddToCartWithTracking } = useAddToCart();

  useEffect(() => {
    // Automatically record product view event on screen load
    recordProductView(product);
  }, [product, recordProductView]);

  const handleAddToCart = useCallback(() => {
    handleAddToCartWithTracking(product, addToCart);

    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your cart!`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart'),
        },
      ]
    );
  }, [product, handleAddToCartWithTracking, addToCart, navigation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={product.image} style={styles.productImage} />
      </View>

      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>

        <Text style={styles.description}>
          Discover the luxurious {product.name} from Bonni Beauty.
          Crafted with premium ingredients to give you the best skincare experience.
        </Text>

        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: Colors.lightBackground,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  content: {
    padding: Spacing.xl,
  },
  productName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  productPrice: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  addButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.bold,
    letterSpacing: Typography.letterSpacing.normal,
  },
});

export default ProductDetailScreen;
