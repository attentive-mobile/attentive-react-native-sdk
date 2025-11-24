/**
 * Checkout Screen - Address and payment information
 * Matches the iOS AddressViewController and PlaceOrderViewController combined
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { CheckoutScreenProps } from '../types/navigation'
import { useCart } from '../models/CartContext'
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme'
import { getPrimaryButtonStyle, getPrimaryButtonTextStyle } from '../constants/buttonStyles'
import { usePurchase } from '../hooks/useAttentiveEvents'

const PLACEHOLDER_TEXT_COLOR = '#666666'

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { cartItems, getTotal, clearCart } = useCart()
  const { recordPurchase } = usePurchase()

  // Contact
  const [email, setEmail] = useState('')

  // Delivery
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')

  // Payment
  const [cardNumber, setCardNumber] = useState('')
  const [nameOnCard, setNameOnCard] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [cvv, setCvv] = useState('')

  const handlePlaceOrder = useCallback(() => {
    // Generate order ID
    const orderId = `ORDER-${Date.now()}`

    // Record purchase event with Attentive SDK
    recordPurchase(cartItems, orderId)

    // Clear cart
    clearCart()

    // Navigate to confirmation
    navigation.replace('OrderConfirmation', { orderId })
  }, [cartItems, recordPurchase, clearCart, navigation])

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
            placeholder="your.email@example.com"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
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
            placeholder="John"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Doe"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="123 Main Street"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={address1}
            onChangeText={setAddress1}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Apt, suite, etc. (optional)"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={address2}
            onChangeText={setAddress2}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="New York"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="CA"
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
              value={state}
              onChangeText={setState}
              autoCapitalize="characters"
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="12345"
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
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
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
            maxLength={19}
          />
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            value={nameOnCard}
            onChangeText={setNameOnCard}
            autoCapitalize="words"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="12/25"
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
              value={expirationDate}
              onChangeText={setExpirationDate}
              keyboardType="number-pad"
              maxLength={5}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="123"
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [getPrimaryButtonStyle(pressed), { marginHorizontal: Spacing.base, marginTop: Spacing.xl }]}
          onPress={handlePlaceOrder}
        >
          {({ pressed }) => (
            <Text style={getPrimaryButtonTextStyle(pressed)}>PLACE ORDER</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

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
})

export default CheckoutScreen
