/**
 * Cart Screen - Shopping cart with quantity controls
 * Matches the iOS CartViewController
 */

import React from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import { CartScreenProps } from '../types/navigation'
import { useCart } from '../models/CartContext'
import { CartItem } from '../models/Product'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'
import { getPrimaryButtonStyle, getPrimaryButtonTextStyle } from '../constants/buttonStyles'

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { cartItems, updateQuantity, getSubtotal, getTax, getTotal } =
    useCart()

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return
    }
    navigation.navigate('Checkout')
  }

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={item.product.image} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemCategory}>Skincare</Text>
        <Text style={styles.itemPrice}>
          ${item.product.price.toFixed(2)}
        </Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            updateQuantity(item.product.id, item.quantity - 1)
          }
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            updateQuantity(item.product.id, item.quantity + 1)
          }
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>${getSubtotal().toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Estimated Tax (5%)</Text>
        <Text style={styles.summaryValue}>${getTax().toFixed(2)}</Text>
      </View>
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${getTotal().toFixed(2)}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          getPrimaryButtonStyle(pressed),
          { marginTop: Spacing.xl },
          cartItems.length === 0 && styles.checkoutButtonDisabled,
        ]}
        onPress={handleCheckout}
        disabled={cartItems.length === 0}
      >
        {({ pressed }) => (
          <Text style={getPrimaryButtonTextStyle(pressed)}>CHECK OUT</Text>
        )}
      </Pressable>
    </View>
  )

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Pressable
          style={({ pressed }) => [getPrimaryButtonStyle(pressed), { paddingHorizontal: Spacing.xxxl }]}
          onPress={() => navigation.navigate('ProductList')}
        >
          {({ pressed }) => (
            <Text style={getPrimaryButtonTextStyle(pressed)}>Start Shopping</Text>
          )}
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderFooter}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  cartItem: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.lightBackground,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: Typography.sizes.small,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
    color: Colors.black,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
  },
  quantity: {
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.lightBackground,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
  },
  summaryValue: {
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.lightBackground,
  },
  totalLabel: {
    fontSize: Typography.sizes.large + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  totalValue: {
    fontSize: Typography.sizes.large + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.secondaryText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.medium,
    color: Colors.secondaryText,
    marginBottom: Spacing.xl,
  },
})

export default CartScreen
