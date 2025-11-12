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
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LoginScreenProps } from '../types/navigation';
import { Colors, Typography, Spacing, Layout } from '../constants/theme';

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
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          HEY BESTIE!{'\n'}Welcome to Bonni Beauty!
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSignIn}
          >
            <Text style={styles.primaryButtonText}>SIGN IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleContinueAsGuest}
          >
            <Text style={styles.primaryButtonText}>CONTINUE AS GUEST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCreateAccount}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  welcomeText: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xxxl * 2,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.base,
  },
  button: {
    height: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: Colors.black,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.bold,
    letterSpacing: Typography.letterSpacing.normal,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  secondaryButtonText: {
    color: Colors.black,
    fontSize: Typography.sizes.medium,
    fontWeight: Typography.weights.semibold,
  },
});

export default LoginScreen;
