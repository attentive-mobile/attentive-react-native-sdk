/**
 * Settings Screen - SDK Testing and Configuration
 * Matches the iOS SettingsViewController
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SettingsScreenProps } from '../types/navigation';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme';
import { useAttentiveUser } from '../hooks/useAttentiveUser';
import { useAttentiveActions } from '../hooks/useAttentiveActions';

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { identifyUser, clearUserIdentification } = useAttentiveUser();
  const { triggerAttentiveCreative, recordCustomAttentiveEvent } = useAttentiveActions();

  const handleSwitchUser = useCallback(() => {
    Alert.prompt(
      'Switch User',
      'Enter email or phone',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: (value) => {
            if (value) {
              const isEmail = value.includes('@');
              identifyUser(isEmail ? { email: value } : { phone: value });
              Alert.alert('Success', 'User updated!');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [identifyUser]);

  const handleShowCreative = useCallback(() => {
    triggerAttentiveCreative();
  }, [triggerAttentiveCreative]);

  const handleClearUser = useCallback(() => {
    clearUserIdentification();
    Alert.alert('Success', 'User cleared!');
  }, [clearUserIdentification]);

  const handleAddEmail = useCallback(() => {
    if (email) {
      identifyUser({ email });
      Alert.alert('Success', `Email ${email} added!`);
      setEmail('');
    } else {
      Alert.alert('Error', 'Please enter an email');
    }
  }, [email, identifyUser]);

  const handleAddPhone = useCallback(() => {
    if (phone) {
      identifyUser({ phone });
      Alert.alert('Success', `Phone ${phone} added!`);
      setPhone('');
    } else {
      Alert.alert('Error', 'Please enter a phone number');
    }
  }, [phone, identifyUser]);

  const handleSendCustomEvent = useCallback(() => {
    recordCustomAttentiveEvent('settings_test_event', {
      source: 'settings_screen',
      timestamp: new Date().toISOString(),
    });
    Alert.alert('Success', 'Custom event sent!');
  }, [recordCustomAttentiveEvent]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Management</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSwitchUser}
        >
          <Text style={styles.buttonText}>Switch User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleClearUser}
        >
          <Text style={styles.buttonText}>Clear User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SDK Testing</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleShowCreative}
        >
          <Text style={styles.buttonText}>Show Creative</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSendCustomEvent}
        >
          <Text style={styles.buttonText}>Send Custom Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Identifiers</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddEmail}
          >
            <Text style={styles.actionButtonText}>Add Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddPhone}
          >
            <Text style={styles.actionButtonText}>Add Phone</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SDK:</Text>
          <Text style={styles.infoValue}>Attentive React Native</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  section: {
    backgroundColor: Colors.white,
    marginVertical: Spacing.sm,
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.large,
    fontWeight: Typography.weights.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  button: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.md,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.medium,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    height: 40,
    backgroundColor: Colors.peach,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  actionButtonText: {
    color: Colors.black,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  infoLabel: {
    fontSize: Typography.sizes.medium,
    color: Colors.secondaryText,
  },
  infoValue: {
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
    color: Colors.black,
  },
});

export default SettingsScreen;
