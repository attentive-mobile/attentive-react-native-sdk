/**
 * Order Confirmation Screen
 * Matches the iOS OrderConfirmationViewController
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { OrderConfirmationScreenProps } from '../types/navigation';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme';

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  route,
  navigation,
}) => {
  const { orderId } = route.params;

  const handleDone = () => {
    // Navigate back to product list (root)
    navigation.reset({
      index: 0,
      routes: [{ name: 'ProductList' }],
    });
  };

  return (
    <View style={styles.container}>
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

        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>DONE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    fontWeight: Typography.weights.bold,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
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
    fontWeight: Typography.weights.bold,
    color: Colors.black,
  },
  confirmationText: {
    fontSize: Typography.sizes.small,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxxl,
  },
  doneButton: {
    width: '100%',
    height: Layout.buttonHeight,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.bold,
    letterSpacing: Typography.letterSpacing.normal,
  },
});

export default OrderConfirmationScreen;
