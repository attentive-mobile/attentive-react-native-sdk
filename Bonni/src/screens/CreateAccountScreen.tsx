/**
 * Create Account Screen
 * Matches the iOS CreateAccountViewController
 */

import React, { useState } from 'react';
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
import { identify } from '@attentive-mobile/attentive-react-native-sdk';
import { CreateAccountScreenProps } from '../types/navigation';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme';

const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreateAccount = () => {
    // Identify user with Attentive SDK
    if (email || phone) {
      identify({
        email: email || undefined,
        phone: phone || undefined,
      });
    }

    // Navigate to product list
    navigation.replace('ProductList');
  };

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

            <TouchableOpacity
              style={styles.button}
              onPress={handleCreateAccount}
            >
              <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
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
    fontWeight: Typography.weights.medium,
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
  button: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
    marginTop: Spacing.xl,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.bold,
    letterSpacing: Typography.letterSpacing.normal,
  },
});

export default CreateAccountScreen;
