/**
 * Checkout Screen - Address and payment information
 * Matches the iOS AddressViewController and PlaceOrderViewController combined
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CheckoutScreenProps } from '../types/navigation';
import { useCart } from '../models/CartContext';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme';
import { usePurchase } from '../hooks/useAttentiveEvents';

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { cartItems, getTotal, clearCart } = useCart();
  const { recordPurchase } = usePurchase();

  // Contact
  const [email, setEmail] = useState('');

  // Delivery
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Payment
  const [cardNumber, setCardNumber] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePlaceOrder = useCallback(() => {
    // Generate order ID
    const orderId = `ORDER-${Date.now()}`;

    // Record purchase event with Attentive SDK
    recordPurchase(cartItems, orderId);

    // Clear cart
    clearCart();

    // Navigate to confirmation
    navigation.replace('OrderConfirmation', { orderId });
  }, [cartItems, recordPurchase, clearCart, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>${getTotal().toFixed(2)}</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Delivery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Address Line 1"
            value={address1}
            onChangeText={setAddress1}
          />
          <TextInput
            style={styles.input}
            placeholder="Address Line 2 (Optional)"
            value={address2}
            onChangeText={setAddress2}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              value={state}
              onChangeText={setState}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Name on Card"
            value={nameOnCard}
            onChangeText={setNameOnCard}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="MM/YY"
              value={expirationDate}
              onChangeText={setExpirationDate}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="CVV"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderButtonText}>PLACE ORDER</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  section: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  sectionTitle: {
    fontSize: Typography.sizes.large + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.medium,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
  },
  summaryValue: {
    fontSize: Typography.sizes.large + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  placeOrderButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
  },
  placeOrderButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
    letterSpacing: Typography.letterSpacing.normal,
  },
});

export default CheckoutScreen;
