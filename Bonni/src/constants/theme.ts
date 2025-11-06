/**
 * Bonni Beauty - Design System
 * Matching the native iOS app's design specifications
 */

export const Colors = {
  // Primary
  peach: '#FFC5B9', // RGB: 255, 197, 185 - Main navigation background
  black: '#000000',
  white: '#FFFFFF',

  // Text
  primaryText: '#000000',
  secondaryText: '#7F8C8D',

  // UI Elements
  border: '#000000',
  background: '#FFFFFF',
  lightBackground: '#F8F9FA',

  // Status
  success: '#27AE60',
  error: '#E74C3C',
  warning: '#F39C12',
};

export const Typography = {
  // Font sizes
  sizes: {
    xxxl: 40, // Welcome text
    xxl: 30,  // Headers
    xl: 24,   // Product titles
    large: 20, // Prices
    medium: 16, // Body text
    small: 14,  // Secondary text
    xs: 12,     // Small labels
  },

  // Font weights
  weights: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  } as const,

  // Letter spacing
  letterSpacing: {
    tight: 0,
    normal: 1.0,
    wide: 1.25,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  small: 8,
  medium: 16,
  large: 24,
  round: 999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Layout = {
  screenPadding: Spacing.base,
  sectionSpacing: Spacing.xl,
  buttonHeight: 50,
  inputHeight: 46,
};
