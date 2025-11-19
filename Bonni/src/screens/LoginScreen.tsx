/**
 * Login Screen - Entry point of the Bonni Beauty app
 * Matches the iOS LoginViewController design
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreenProps } from '../types/navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import { ButtonStyles, getPrimaryButtonStyle, getPrimaryButtonTextStyle, getSecondaryButtonStyle, getSecondaryButtonTextStyle, getGhostButtonTextStyle } from '../constants/buttonStyles';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const handleSignIn = () => {
    Alert.alert('Sign In', 'Sign in functionality coming soon!');
  };

  const handleContinueAsGuest = () => {
    navigation.navigate('ProductList');
  };

  const handleCreateAccount = () => {
    navigation.navigate('CreateAccount');
  };

  return (
    <ImageBackground
      source={require('../assets/images/ui/login-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
        <Text style={styles.greetingText}>
          HEY BESTIE!
        </Text>
        <Text style={styles.welcomeText}>
          Welcome to{'\n'}Bonni Beauty!
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => getPrimaryButtonStyle(pressed)}
            onPress={handleSignIn}
          >
            {({ pressed }) => (
              <Text style={getPrimaryButtonTextStyle(pressed)}>SIGN IN</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => getSecondaryButtonStyle(pressed)}
            onPress={handleContinueAsGuest}
          >
            {({ pressed }) => (
              <Text style={getSecondaryButtonTextStyle(pressed)}>CONTINUE AS GUEST</Text>
            )}
          </Pressable>

          <Pressable
            style={ButtonStyles.ghost}
            onPress={handleCreateAccount}
          >
            {({ pressed }) => (
              <Text style={getGhostButtonTextStyle(pressed)}>Create Account</Text>
            )}
          </Pressable>
        </View>
      </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  greetingText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.md,
  },
  welcomeText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.medium,
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xxxl * 1.5,
    lineHeight: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
});

export default LoginScreen;
