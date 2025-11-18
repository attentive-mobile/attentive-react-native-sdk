/**
 * Custom Navigation Header
 * Matches the iOS app's custom navigation bar with peach background and centered logo
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  showSettingsIcon?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  showLogo = true,
  showCartIcon = true,
  showSettingsIcon = true,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { cartItems } = useCart();

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <View style={styles.header}>
      {/* Left Button - Settings */}
      <View style={styles.leftButton}>
        {showSettingsIcon && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconButton}
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
    paddingHorizontal: Spacing.base,
  },
  leftButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
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
