/**
 * Order Confirmation Screen
 * Matches the iOS OrderConfirmationViewController
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OrderConfirmationScreenProps } from '../types/navigation'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'
import { getPrimaryButtonStyle, getPrimaryButtonTextStyle } from '../constants/buttonStyles'

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  route,
  navigation,
}) => {
  const { orderId } = route.params

  const handleDone = () => {
    // Navigate back to product list (root)
    navigation.reset({
      index: 0,
      routes: [{ name: 'ProductList' }],
    })
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>Thank you for shopping with us!</Text>

        <Text style={styles.message}>
          Your order has been placed successfully.
        </Text>

        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order Number:</Text>
          <Text style={styles.orderId}>{orderId}</Text>
        </View>

        <Text style={styles.confirmationText}>
          You will receive a confirmation email shortly with your order details.
        </Text>

        <Pressable style={({ pressed }) => [getPrimaryButtonStyle(pressed), { width: '100%' }]} onPress={handleDone}>
          {({ pressed }) => (
            <Text style={getPrimaryButtonTextStyle(pressed)}>DONE</Text>
          )}
        </Pressable>
      </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  checkmark: {
    fontSize: 60,
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
  },
  title: {
    fontSize: Typography.sizes.xxl + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  message: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  orderInfo: {
    backgroundColor: Colors.lightBackground,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.xl,
  },
  orderLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  orderId: {
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
    color: Colors.black,
  },
  confirmationText: {
    fontSize: Typography.sizes.small,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxxl,
  },
})

export default OrderConfirmationScreen
