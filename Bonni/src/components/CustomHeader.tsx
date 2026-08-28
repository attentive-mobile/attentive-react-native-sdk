/**
 * Custom Navigation Header
 * Matches the iOS app's custom navigation bar with peach background and centered logo
 * Shows back button when navigation can go back, otherwise shows burger icon
 *
 * The inbox entry point mirrors the native Android example app, which puts a Material
 * mail_outline icon in the Products toolbar (`Icons.Filled.MailOutline`). Unlike that app
 * there is no unread badge here: the unread count lives on `AttentiveSdk.inboxState`, which
 * is not bridged to React Native yet — only the drop-in view is.
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCart } from '../models/CartContext'
import { RootStackParamList } from '../types/navigation'
import { Colors, Spacing, Typography } from '../constants/theme'

import BackIcon from '../assets/images/ui/icons/back-icon.svg'
import BurgerIcon from '../assets/images/ui/icons/burger-icon.svg'
import CartIcon from '../assets/images/ui/icons/cart-icon.svg'
import InboxIcon from '../assets/images/ui/icons/inbox-icon.svg'
import BonniLogo from '../assets/images/ui/icons/bonni-logo.svg'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface CustomHeaderProps {
  showLogo?: boolean
  showCartIcon?: boolean
}

/**
 * Custom header component that displays navigation controls
 * - Shows burger icon on ProductList screen (main screen)
 * - Shows back button on other screens when navigation can go back
 * - Shows the Attentive inbox icon on the ProductList screen, left of the cart
 * - Always shows cart icon on the right
 * - Buttons are positioned at screen edges with proper offset
 */
const CustomHeader: React.FC<CustomHeaderProps> = ({
  showLogo = true,
  showCartIcon = true,
}) => {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const { cartItems } = useCart()

  const isProductListScreen = route.name === 'ProductList'
  const canGoBack = navigation.canGoBack()
  const shouldShowBackButton = !isProductListScreen && canGoBack

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleBackPress = () => {
    if (canGoBack) {
      navigation.goBack()
    }
  }

  const handleBurgerPress = () => {
    navigation.navigate('Settings')
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        {/* Left Button - Back or Burger */}
        <View style={styles.leftButton}>
          {shouldShowBackButton ? (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.iconButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <BackIcon />
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
        <View style={styles.centerContent}>{showLogo && <BonniLogo />}</View>

        {/* Right Buttons - Inbox (ProductList only) + Cart */}
        <View style={styles.rightButton}>
          {isProductListScreen && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Inbox')}
              style={styles.iconButton}
              accessibilityLabel="Inbox"
              accessibilityRole="button"
            >
              <InboxIcon />
            </TouchableOpacity>
          )}
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
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.peach,
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  leftButton: {
    // Kept the same width as rightButton so the centred logo stays centred when the
    // right side carries two icons.
    width: 96,
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
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing.base,
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
    fontSize: 26,
    fontWeight: Typography.weights.semibold,
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
    fontWeight: Typography.weights.semibold,
  },
})

export default CustomHeader
