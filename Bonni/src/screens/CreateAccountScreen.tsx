/**
 * Create Account Screen
 * Matches the iOS CreateAccountViewController
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
import { CreateAccountScreenProps } from '../types/navigation'
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme'
import { getPrimaryButtonStyle, getPrimaryButtonTextStyle } from '../constants/buttonStyles'
import { useAttentiveUser } from '../hooks/useAttentiveUser'

const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const { identifyUser } = useAttentiveUser()

  const handleCreateAccount = useCallback(() => {
    // Identify user with Attentive SDK
    if (email || phone) {
      identifyUser({
        email: email || undefined,
        phone: phone || undefined,
      })
    }

    // Navigate to product list
    navigation.replace('ProductList')
  }, [email, phone, identifyUser, navigation])

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
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Bonni Beauty today!</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Pressable
              style={({ pressed }) => [getPrimaryButtonStyle(pressed), { marginTop: Spacing.xl }]}
              onPress={handleCreateAccount}
            >
              {({ pressed }) => (
                <Text style={getPrimaryButtonTextStyle(pressed)}>CREATE ACCOUNT</Text>
              )}
            </Pressable>
          </View>
        </View>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.sizes.xxl + 4,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
    marginBottom: Spacing.xxxl,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.regular,
    color: Colors.black,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.medium,
    color: Colors.black,
  },
})

export default CreateAccountScreen
