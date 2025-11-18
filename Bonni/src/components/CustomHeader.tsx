/**
 * Custom Navigation Header
 * Matches the iOS app's custom navigation bar with peach background and centered logo
 * Shows back button when navigation can go back, otherwise shows burger icon
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../models/CartContext';
import { RootStackParamList } from '../types/navigation';
import { Colors, Spacing } from '../constants/theme';

import BurgerIcon from '../assets/images/ui/icons/burger-icon.svg';
import CartIcon from '../assets/images/ui/icons/cart-icon.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CustomHeaderProps {
  showLogo?: boolean;
  showCartIcon?: boolean;
}

/**
 * Custom header component that displays navigation controls
 * - Shows burger icon on ProductList screen (main screen)
 * - Shows back button on other screens when navigation can go back
 * - Always shows cart icon on the right
 * - Buttons are positioned at screen edges with proper offset
 */
const CustomHeader: React.FC<CustomHeaderProps> = ({
  showLogo = true,
  showCartIcon = true,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { cartItems } = useCart();

  const isProductListScreen = route.name === 'ProductList';
  const canGoBack = navigation.canGoBack();
  const shouldShowBackButton = !isProductListScreen && canGoBack;

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleBackPress = () => {
    if (canGoBack) {
      navigation.goBack();
    }
  };

  const handleBurgerPress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.header}>
      {/* Left Button - Back or Burger */}
      <View style={styles.leftButton}>
        {shouldShowBackButton ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.iconButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleBurgerPress}
            style={styles.iconButton}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <BurgerIcon />
          </TouchableOpacity>
        )}
      </View>

      {/* Center - Logo */}
      <View style={styles.centerContent}>
        {showLogo && (
          <Text style={styles.logoText}>BONNI</Text>
        )}
      </View>

      {/* Right Button - Cart */}
      <View style={styles.rightButton}>
        {showCartIcon && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.iconButton}
            accessibilityLabel="View cart"
            accessibilityRole="button"
          >
            <CartIcon />
            {cartItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    backgroundColor: Colors.peach,
    paddingHorizontal: 0,
  },
  leftButton: {
    width: 56,
    alignItems: 'flex-start',
    paddingLeft: Spacing.base,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    width: 56,
    alignItems: 'flex-end',
    paddingRight: Spacing.base,
    justifyContent: 'center',
  },
  iconButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.black,
    lineHeight: 32,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.black,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CustomHeader;
