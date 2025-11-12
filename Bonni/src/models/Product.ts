/**
 * Product model matching the iOS app's product data
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  image: any; // React Native image require() type
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Product catalog - matching the iOS app products
export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Protective Superscreen',
    price: 39.99,
    image: require('../assets/images/products/protective-superscreen.png'),
    category: 'skincare',
  },
  {
    id: '2',
    name: 'Mango Mask',
    price: 24.99,
    image: require('../assets/images/products/mango-mask.png'),
    category: 'skincare',
  },
  {
    id: '3',
    name: 'Coconut Balm',
    price: 14.99,
    image: require('../assets/images/products/coconut-balm.png'),
    category: 'skincare',
  },
  {
    id: '4',
    name: 'Mango Balm',
    price: 29.99,
    image: require('../assets/images/products/mango-balm.png'),
    category: 'skincare',
  },
  {
    id: '5',
    name: 'Honeydew Balm',
    price: 9.99,
    image: require('../assets/images/products/honeydew-balm.png'),
    category: 'skincare',
  },
  {
    id: '6',
    name: 'The Stick',
    price: 19.99,
    image: require('../assets/images/products/the-stick.png'),
    category: 'skincare',
  },
];
