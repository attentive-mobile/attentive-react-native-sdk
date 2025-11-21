/**
 * Navigation types for type-safe navigation
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Product } from '../models/Product'

export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  ProductList: undefined;
  ProductDetail: { product: Product };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Settings: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type CreateAccountScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;
export type ProductListScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductList'>;
export type ProductDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
export type CartScreenProps = NativeStackScreenProps<RootStackParamList, 'Cart'>;
export type CheckoutScreenProps = NativeStackScreenProps<RootStackParamList, 'Checkout'>;
export type OrderConfirmationScreenProps = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
