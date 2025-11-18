/**
 * Product List Screen - Main product browsing screen
 * Matches the iOS ProductViewController with 2-column grid
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ProductListScreenProps } from '../types/navigation';
import { useCart } from '../models/CartContext';
import { PRODUCTS, Product } from '../models/Product';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAddToCart } from '../hooks/useAttentiveEvents';

const ProductListScreen: React.FC<ProductListScreenProps> = ({ navigation }) => {
  const { addToCart } = useCart();
  const { handleAddToCart: handleAddToCartWithTracking } = useAddToCart();

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { product });
  }, [navigation]);

  const handleAddToCart = useCallback((product: Product) => {
    handleAddToCartWithTracking(product, addToCart);
    Alert.alert('Added to Cart', `${product.name} added to cart!`);
  }, [handleAddToCartWithTracking, addToCart]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Image source={item.image} style={styles.productImage} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
    </View>
  ), [handleProductPress, handleAddToCart]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Products</Text>
      </View>
      <FlatList
        data={PRODUCTS}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.black,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  productCard: {
    flex: 1,
    marginBottom: Spacing.base,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: Spacing.sm,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.lightBackground,
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.black,
  },
  productName: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.semibold,
    color: Colors.black,
  },
});

export default ProductListScreen;
