/**
 * Common Button Styles
 * Reusable button styles for the Bonni Beauty app
 * All buttons use sharp corners (no border radius)
 */

import { StyleSheet, TextStyle, ViewStyle } from 'react-native'
import { Colors, Typography, Layout, Spacing } from './theme'

/**
 * Primary button style - Black background with white text
 * Used for main actions like "Sign In", "Check Out", "Add to Cart", etc.
 */
export const primaryButton: ViewStyle = {
  height: Layout.buttonHeight,
  backgroundColor: Colors.black,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 0, // No rounded corners
}

/**
 * Primary button pressed style - Very dark gray background with white text
 * Used when primary button is pressed (background changes to dark gray, text stays white)
 */
export const primaryButtonPressed: ViewStyle = {
  height: Layout.buttonHeight,
  backgroundColor: '#1a1a1a', // Very dark gray, slightly lighter than black
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 0, // No rounded corners
}

/**
 * Primary button text style
 */
export const primaryButtonText: TextStyle = {
  color: Colors.white,
  fontSize: Typography.sizes.medium,
  fontWeight: Typography.weights.regular,
  letterSpacing: Typography.letterSpacing.wide,
  textTransform: 'uppercase',
}

/**
 * Secondary button style - White background with black border and black text
 * Used for secondary actions like "Create Account"
 */
export const secondaryButton: ViewStyle = {
  height: Layout.buttonHeight,
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.black,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 0, // No rounded corners
}

/**
 * Secondary button text style
 */
export const secondaryButtonText: TextStyle = {
  color: Colors.black,
  fontSize: Typography.sizes.medium,
  fontWeight: Typography.weights.regular,
  textTransform: 'uppercase',
  letterSpacing: Typography.letterSpacing.wide,
}

/**
 * Secondary button pressed style - Matches primary button background style
 * Used when secondary button is pressed (background changes to black)
 */
export const secondaryButtonPressed: ViewStyle = {
  height: Layout.buttonHeight,
  backgroundColor: '#888888',
  borderWidth: 0, // Remove border when pressed
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 0, // No rounded corners
}

/**
 * Secondary button text pressed style - White text with same weight and size as secondary
 * Used when secondary button is pressed (text color changes to white, but weight/size stay the same)
 */
export const secondaryButtonTextPressed: TextStyle = {
  color: Colors.white,
  fontSize: Typography.sizes.medium,
  fontWeight: Typography.weights.regular,
  textTransform: 'uppercase',
  letterSpacing: Typography.letterSpacing.wide,
}

/**
 * Ghost button style - No background, no border, transparent
 * Used for text-only buttons that are always underlined
 */
export const ghostButton: ViewStyle = {
  height: Layout.buttonHeight - Spacing.md,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 0, // No rounded corners
}

/**
 * Ghost button text style - Black text, always underlined, not uppercased
 */
export const ghostButtonText: TextStyle = {
  color: Colors.black,
  fontSize: Typography.sizes.medium,
  fontWeight: Typography.weights.regular,
  textDecorationLine: 'underline',
  letterSpacing: Typography.letterSpacing.wide,
}

/**
 * Ghost button text pressed style - Dark gray text, always underlined, not uppercased
 * Used when ghost button is pressed (text color changes to dark gray)
 */
export const ghostButtonTextPressed: TextStyle = {
  color: '#666666', // Dark gray
  fontSize: Typography.sizes.medium,
  fontWeight: Typography.weights.regular,
  textDecorationLine: 'underline',
  letterSpacing: Typography.letterSpacing.wide,
}

/**
 * Helper function to get primary button style based on pressed state
 * Use with Pressable component's style prop: style={(pressed) => getPrimaryButtonStyle(pressed)}
 */
export function getPrimaryButtonStyle(pressed: boolean): ViewStyle {
  return pressed ? primaryButtonPressed : primaryButton
}

/**
 * Helper function to get primary button text style based on pressed state
 * Text style remains the same regardless of pressed state
 * Use with Pressable component's style prop: style={(pressed) => getPrimaryButtonTextStyle(pressed)}
 */
export function getPrimaryButtonTextStyle(_pressed: boolean): TextStyle {
  return primaryButtonText
}

/**
 * Helper function to get secondary button style based on pressed state
 * Use with Pressable component's style prop: style={(pressed) => getSecondaryButtonStyle(pressed)}
 */
export function getSecondaryButtonStyle(pressed: boolean): ViewStyle {
  return pressed ? secondaryButtonPressed : secondaryButton
}

/**
 * Helper function to get secondary button text style based on pressed state
 * Text color changes to white when pressed, but weight and size remain the same
 * Use with Pressable component's style prop: style={(pressed) => getSecondaryButtonTextStyle(pressed)}
 */
export function getSecondaryButtonTextStyle(pressed: boolean): TextStyle {
  return pressed ? secondaryButtonTextPressed : secondaryButtonText
}

/**
 * Helper function to get ghost button text style based on pressed state
 * Text color changes to dark gray when pressed, but weight, size, and underline remain the same
 * Use with Pressable component's style prop: style={(pressed) => getGhostButtonTextStyle(pressed)}
 */
export function getGhostButtonTextStyle(pressed: boolean): TextStyle {
  return pressed ? ghostButtonTextPressed : ghostButtonText
}

/**
 * Button styles object for easy access
 */
export const ButtonStyles = StyleSheet.create({
  primary: primaryButton,
  primaryText: primaryButtonText,
  primaryPressed: primaryButtonPressed,
  secondary: secondaryButton,
  secondaryText: secondaryButtonText,
  secondaryPressed: secondaryButtonPressed,
  secondaryTextPressed: secondaryButtonTextPressed,
  ghost: ghostButton,
  ghostText: ghostButtonText,
  ghostTextPressed: ghostButtonTextPressed,
})

