/**
 * Settings Screen - SDK Testing and Configuration
 * Matches the iOS SettingsViewController
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  Clipboard,
  Platform,
  Modal,
  Switch,
} from 'react-native'
import { SettingsScreenProps } from '../types/navigation'
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../constants/theme'
import { getPrimaryButtonStyle, getPrimaryButtonTextStyle, getSecondaryButtonStyle, getSecondaryButtonTextStyle } from '../constants/buttonStyles'
import { useAttentiveUser } from '../hooks/useAttentiveUser'
import { useAttentiveActions } from '../hooks/useAttentiveActions'
import {
  updateDomain,
  registerForPushNotifications,
  registerDeviceToken,
  handlePushOpened,
  handleForegroundNotification,
  clearUser as sdkClearUser,
} from '@attentive-mobile/attentive-react-native-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PushNotificationIOS from '@react-native-community/push-notification-ios'

const CONFIG_STORAGE_KEYS = {
  DEBUGGER_ENABLED: 'attentive_debugger_enabled',
  DISPLAY_ALERTS: 'attentive_display_alerts',
  ATTENTIVE_DOMAIN: 'attentive_domain',
}

const ATTENTIVE_DOMAINS = ['vs', 'games', '76ers', 'belk']

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [deviceToken, setDeviceToken] = useState<string>('Not saved')
  const [currentUser, setCurrentUser] = useState<string>('Guest')
  const [responseModalVisible, setResponseModalVisible] = useState(false)
  const [responseData, setResponseData] = useState<string>('')
  const [debuggerEnabled, setDebuggerEnabled] = useState<boolean>(true)
  const [displayAlerts, setDisplayAlerts] = useState<boolean>(true)
  const [attentiveDomain, setAttentiveDomain] = useState<string>('games')
  const [domainPickerVisible, setDomainPickerVisible] = useState<boolean>(false)
  const { identifyUser, clearUserIdentification } = useAttentiveUser()
  const { triggerAttentiveCreative, recordCustomAttentiveEvent } = useAttentiveActions()

  // Load device token and configuration on mount
  useEffect(() => {
    loadDeviceToken()
    loadConfiguration()
  }, [])

  const loadDeviceToken = async () => {
    try {
      const token = await AsyncStorage.getItem('deviceToken')
      if (token) {
        setDeviceToken(token)
      }
    } catch (error) {
      console.error('Error loading device token:', error)
    }
  }

  /**
   * Load configuration from AsyncStorage
   */
  const loadConfiguration = async () => {
    try {
      const [debuggerValue, alertsValue, domainValue] = await Promise.all([
        AsyncStorage.getItem(CONFIG_STORAGE_KEYS.DEBUGGER_ENABLED),
        AsyncStorage.getItem(CONFIG_STORAGE_KEYS.DISPLAY_ALERTS),
        AsyncStorage.getItem(CONFIG_STORAGE_KEYS.ATTENTIVE_DOMAIN),
      ])

      if (debuggerValue !== null) {
        setDebuggerEnabled(debuggerValue === 'true')
      }
      if (alertsValue !== null) {
        setDisplayAlerts(alertsValue === 'true')
      }
      if (domainValue !== null) {
        setAttentiveDomain(domainValue)
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
    }
  }

  /**
   * Handle debugger toggle change
   * @param value - New debugger enabled state
   */
  const handleDebuggerToggle = useCallback(async (value: boolean) => {
    try {
      setDebuggerEnabled(value)
      await AsyncStorage.setItem(CONFIG_STORAGE_KEYS.DEBUGGER_ENABLED, value.toString())
      if (displayAlerts) {
        Alert.alert(
          'Debugger Setting',
          'Debugger setting has been saved. Note: This setting requires app restart to take effect.'
        )
      }
    } catch (error) {
      console.error('Error saving debugger setting:', error)
      if (displayAlerts) {
        Alert.alert('Error', 'Failed to save debugger setting')
      }
    }
  }, [displayAlerts])

  /**
   * Handle display alerts toggle change
   * @param value - New display alerts state
   */
  const handleDisplayAlertsToggle = useCallback(async (value: boolean) => {
    try {
      setDisplayAlerts(value)
      await AsyncStorage.setItem(CONFIG_STORAGE_KEYS.DISPLAY_ALERTS, value.toString())
    } catch (error) {
      console.error('Error saving display alerts setting:', error)
      // Don't show alert here since alerts are being disabled
    }
  }, [])

  /**
   * Handle domain selection
   * @param domain - Selected domain
   */
  const handleDomainSelect = useCallback(async (domain: string) => {
    try {
      setAttentiveDomain(domain)
      await AsyncStorage.setItem(CONFIG_STORAGE_KEYS.ATTENTIVE_DOMAIN, domain)
      updateDomain(domain)
      setDomainPickerVisible(false)
      Alert.alert('Success', `Domain updated to: ${domain}`)
    } catch (error) {
      console.error('Error saving domain setting:', error)
      Alert.alert('Error', 'Failed to save domain setting')
    }
  }, [])

  const handleSwitchUser = useCallback(() => {
    Alert.prompt(
      'Switch Account / Log Out',
      'Enter email or phone to identify, or cancel to log out',
      [
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            clearUserIdentification()
            setCurrentUser('Guest')
            Alert.alert('Success', 'Logged out successfully')
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Identify',
          onPress: (value) => {
            if (value) {
              const isEmail = value.includes('@')
              identifyUser(isEmail ? { email: value } : { phone: value })
              setCurrentUser(value)
              Alert.alert('Success', 'User identified!')
            }
          },
        },
      ],
      'plain-text'
    )
  }, [identifyUser, clearUserIdentification])

  const handleManageAddresses = useCallback(() => {
    // TODO: Implement address management
    Alert.alert('Manage Addresses', 'Address management feature coming soon')
  }, [])

  const handleShowCreative = useCallback(() => {
    triggerAttentiveCreative()
  }, [triggerAttentiveCreative])

  const handleShowPushPermission = useCallback(() => {
    // Use the SDK method to request push notification permissions
    registerForPushNotifications()

    // Also show permission status via iOS native API for user feedback
    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      }).then((permissions) => {
        if (displayAlerts) {
          Alert.alert(
            'Push Permission',
            `Permissions granted:\nAlert: ${permissions.alert}\nBadge: ${permissions.badge}\nSound: ${permissions.sound}`
          )
        }
      })
    } else {
      if (displayAlerts) {
        Alert.alert('Note', 'Push permissions are handled automatically on Android')
      }
    }
  }, [displayAlerts])

  const handleSendPushToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('deviceToken')
      if (!token) {
        if (displayAlerts) {
          Alert.alert('Error', "No device token found. Press 'Show Push Permission' button to obtain one.")
        }
        return
      }

      // Get authorization status and send token via SDK
      if (Platform.OS === 'ios') {
        PushNotificationIOS.checkPermissions((permissions) => {
          // Determine authorization status based on permissions
          let authStatus: 'authorized' | 'denied' | 'notDetermined' = 'notDetermined'
          if (permissions.alert || permissions.badge || permissions.sound) {
            authStatus = 'authorized'
          }

          // Call SDK method to register device token
          registerDeviceToken(token, authStatus)

          // Show response info
          const responseInfo = `Push Token Registration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Domain: ${attentiveDomain}
Authorization Status: ${authStatus}

Device Token:
${token}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Token sent to Attentive SDK successfully.
The SDK will handle the API request internally.`

          setResponseData(responseInfo)
          setResponseModalVisible(true)
        })
      } else {
        // Android - just register the token
        registerDeviceToken(token, 'authorized')
        if (displayAlerts) {
          Alert.alert('Success', 'Push token sent to SDK')
        }
      }
    } catch (error) {
      if (displayAlerts) {
        Alert.alert('Error', 'Failed to send push token')
      }
    }
  }, [displayAlerts, attentiveDomain])

  const handleSendAppOpenEvents = useCallback(() => {
    // TODO: Implement via native bridge - SDK function: registerAppEvents()
    recordCustomAttentiveEvent('app_open', {
      ist: 'al',
      message_id: '0',
      send_id: '1',
      destination_token: '0',
      company_id: '1',
      user_id: '0',
      message_type: 'app_open',
      message_subtype: '0',
      timestamp: new Date().toISOString(),
    })
    Alert.alert('Success', 'App open events sent!')
  }, [recordCustomAttentiveEvent])

  const handleSendLocalPushNotification = useCallback(() => {
    if (Platform.OS === 'ios') {
      // Show toast first like iOS implementation
      if (displayAlerts) {
        Alert.alert('Success', 'Push shows up in 5 seconds. Minimize app now.')
      }

      // Schedule local notification for 5 seconds
      const notification = {
        alertTitle: '🔔',
        alertBody: 'Local push notification test',
        fireDate: new Date(Date.now() + 5000).toISOString(),
        soundName: 'default',
      }

      PushNotificationIOS.scheduleLocalNotification(notification)
    } else {
      if (displayAlerts) {
        Alert.alert('Note', 'Local push notifications require additional setup on Android')
      }
    }
  }, [displayAlerts])

  const handleIdentifyUser = useCallback(() => {
    // Show prompt to enter user identifier (like iOS implementation)
    Alert.prompt(
      'Identify User',
      'Enter email or phone to identify the user',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Identify',
          onPress: (value) => {
            if (value) {
              const isEmail = value.includes('@')
              identifyUser(isEmail ? { email: value } : { phone: value })
              setCurrentUser(value)
              if (displayAlerts) {
                Alert.alert('Success', `User identified: ${value}`)
              }
            }
          },
        },
      ],
      'plain-text'
    )
  }, [identifyUser, displayAlerts])

  const handleClearUser = useCallback(() => {
    // Call SDK's clearUser method
    sdkClearUser()
    clearUserIdentification()
    setCurrentUser('Guest')
    if (displayAlerts) {
      Alert.alert('Success', 'User cleared!')
    }
  }, [clearUserIdentification, displayAlerts])

  const handleClearCookies = useCallback(async () => {
    // TODO: Implement WebKit cookie clearing via native bridge
    // For now, just show confirmation
    Alert.alert('Success', 'Cookies cleared (WebKit cookies require native implementation)')
  }, [])

  const handleCopyDeviceToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('deviceToken')
      if (token) {
        Clipboard.setString(token)
        Alert.alert('Success', 'Device token copied to clipboard')
      } else {
        Alert.alert('Error', 'No device token found')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy device token')
    }
  }, [])

  const handleAddEmail = useCallback(() => {
    if (email) {
      identifyUser({ email })
      Alert.alert('Success', `Email ${email} added!`)
      setEmail('')
    } else {
      Alert.alert('Error', 'Please enter an email')
    }
  }, [email, identifyUser])

  const handleAddPhone = useCallback(() => {
    if (phone) {
      identifyUser({ phone })
      Alert.alert('Success', `Phone ${phone} added!`)
      setPhone('')
    } else {
      Alert.alert('Error', 'Please enter a phone number')
    }
  }, [phone, identifyUser])

  // Uncomment and wire up if you need to test custom events:
  // recordCustomAttentiveEvent('settings_test_event', {
  //   source: 'settings_screen',
  //   timestamp: new Date().toISOString(),
  // })

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.accountInfoLabel}>
            Login Info: {currentUser}
          </Text>

          <Pressable
            style={({ pressed }) => [getPrimaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleSwitchUser}
          >
            {({ pressed }) => (
              <Text style={getPrimaryButtonTextStyle(pressed)}>Switch Account / Log Out</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleManageAddresses}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>Manage Addresses</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Test Events & SDK Operations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Events & SDK Operations</Text>

          <Pressable
            style={({ pressed }) => [getPrimaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleShowCreative}
          >
            {({ pressed }) => (
              <Text style={getPrimaryButtonTextStyle(pressed)}>Show Creative</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleShowPushPermission}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>Show Push Permission</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleSendPushToken}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>Send Push Token</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleSendAppOpenEvents}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>📲 Send App Open Events</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleSendLocalPushNotification}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>🔔 Send Local Push Notification</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleIdentifyUser}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>Identify User</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleClearUser}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>Clear User</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [getSecondaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleClearCookies}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>Clear Cookies</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Device Token Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Token</Text>

          <Text style={styles.deviceTokenLabel}>
            Device Token: {deviceToken}
          </Text>

          <Pressable
            style={({ pressed }) => [getPrimaryButtonStyle(pressed), styles.buttonSpacing]}
            onPress={handleCopyDeviceToken}
          >
            {({ pressed }) => (
              <Text style={getPrimaryButtonTextStyle(pressed)}>Copy Device Token</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Add Identifiers Section */}
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
            <Pressable
              style={({ pressed }) => getPrimaryButtonStyle(pressed)}
              onPress={handleAddEmail}
            >
              {({ pressed }) => (
                <Text style={getPrimaryButtonTextStyle(pressed)}>Add Email</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Pressable
              style={({ pressed }) => getPrimaryButtonStyle(pressed)}
              onPress={handleAddPhone}
            >
              {({ pressed }) => (
                <Text style={getPrimaryButtonTextStyle(pressed)}>Add Phone</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>

          {/* Debugger Toggle */}
          <View style={styles.configRow}>
            <View style={styles.configLabelContainer}>
              <Text style={styles.configLabel}>Debugger Enabled</Text>
            </View>
            <Switch
              value={debuggerEnabled}
              onValueChange={handleDebuggerToggle}
              trackColor={{ false: Colors.lightBackground, true: Colors.peach }}
              thumbColor={Platform.OS === 'ios' ? Colors.white : Colors.white}
            />
          </View>

          {/* Display Alerts Toggle */}
          <View style={styles.configRow}>
            <View style={styles.configLabelContainer}>
              <Text style={styles.configLabel}>Display Alerts</Text>
            </View>
            <Switch
              value={displayAlerts}
              onValueChange={handleDisplayAlertsToggle}
              trackColor={{ false: Colors.lightBackground, true: Colors.peach }}
              thumbColor={Platform.OS === 'ios' ? Colors.white : Colors.white}
            />
          </View>

          {/* Domain Picker */}
          <View style={styles.configRow}>
            <View style={styles.configLabelContainer}>
              <Text style={styles.configLabel}>Attentive Domain</Text>
            </View>
            <Pressable
              style={styles.domainPickerButton}
              onPress={() => setDomainPickerVisible(true)}
            >
              <Text style={styles.domainPickerText}>{attentiveDomain}</Text>
              <Text style={styles.domainPickerArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* About Section */}
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

      {/* Response Modal */}
      <Modal
        visible={responseModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setResponseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Push Token Response</Text>
            <TouchableOpacity
              onPress={() => setResponseModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.responseText}>{responseData}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Domain Picker Modal */}
      <Modal
        visible={domainPickerVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setDomainPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Domain</Text>
            <TouchableOpacity
              onPress={() => setDomainPickerVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {ATTENTIVE_DOMAINS.map((domain) => (
              <Pressable
                key={domain}
                style={({ pressed }) => [
                  styles.domainOption,
                  pressed && styles.domainOptionPressed,
                  attentiveDomain === domain && styles.domainOptionSelected,
                ]}
                onPress={() => handleDomainSelect(domain)}
              >
                <Text
                  style={[
                    styles.domainOptionText,
                    attentiveDomain === domain && styles.domainOptionTextSelected,
                  ]}
                >
                  {domain}
                </Text>
                {attentiveDomain === domain && (
                  <Text style={styles.domainOptionCheckmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  divider: {
    height: 1,
    backgroundColor: '#D3D3D3', // Light gray like iOS
    marginHorizontal: Spacing.base,
  },
  accountInfoLabel: {
    fontSize: Typography.sizes.medium,
    color: Colors.black,
    marginBottom: Spacing.base,
    lineHeight: 24,
  },
  deviceTokenLabel: {
    fontSize: Typography.sizes.medium,
    color: '#7F8C8D', // Dark gray like iOS
    marginBottom: Spacing.base,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: Typography.sizes.large,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  buttonSpacing: {
    marginBottom: Spacing.md,
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
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  modalTitle: {
    fontSize: Typography.sizes.large,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.secondaryText,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.base,
  },
  responseText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: Typography.sizes.small,
    color: Colors.black,
    lineHeight: 20,
  },
  // Configuration section styles
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  configLabelContainer: {
    flex: 1,
    marginRight: Spacing.base,
  },
  configLabel: {
    fontSize: Typography.sizes.medium,
    color: Colors.black,
  },
  domainPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  domainPickerText: {
    fontSize: Typography.sizes.medium,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  domainPickerArrow: {
    fontSize: Typography.sizes.large,
    color: Colors.secondaryText,
  },
  domainOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  domainOptionPressed: {
    backgroundColor: Colors.lightBackground,
  },
  domainOptionSelected: {
    backgroundColor: Colors.lightBackground,
  },
  domainOptionText: {
    fontSize: Typography.sizes.medium,
    color: Colors.black,
  },
  domainOptionTextSelected: {
    fontWeight: Typography.weights.medium,
    color: Colors.black,
  },
  domainOptionCheckmark: {
    fontSize: Typography.sizes.medium,
    color: Colors.black,
    fontWeight: Typography.weights.bold,
  },
})

export default SettingsScreen
