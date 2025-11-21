/**
 * Product Detail Screen
 * Matches the iOS ProductDetailViewController
 * Automatically records Product View event on mount
 */

import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native'
import { ProductDetailScreenProps } from '../types/navigation'
import { useCart } from '../models/CartContext'
import { Colors, Typography, Spacing } from '../constants/theme'
import { getPrimaryButtonStyle, getPrimaryButtonTextStyle } from '../constants/buttonStyles'
import { useProductView, useAddToCart } from '../hooks/useAttentiveEvents'
import { useDisplayAlerts } from '../hooks/useDisplayAlerts'

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { product } = route.params
  const { addToCart } = useCart()
  const { recordProductView } = useProductView()
  const { handleAddToCart: handleAddToCartWithTracking } = useAddToCart()
  const displayAlerts = useDisplayAlerts()

  useEffect(() => {
    // Automatically record product view event on screen load
    recordProductView(product)
  }, [product, recordProductView])

  const handleAddToCart = useCallback(() => {
    handleAddToCartWithTracking(product, addToCart)

    if (displayAlerts) {
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
      )
    }
  }, [product, handleAddToCartWithTracking, addToCart, navigation, displayAlerts])

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

        <Pressable style={({ pressed }) => getPrimaryButtonStyle(pressed)} onPress={handleAddToCart}>
          {({ pressed }) => (
            <Text style={getPrimaryButtonTextStyle(pressed)}>ADD TO CART</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  )
}

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
    fontSize: Typography.sizes.xxl + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  productPrice: {
    fontSize: Typography.sizes.xl + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.success,
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
})

export default ProductDetailScreen
