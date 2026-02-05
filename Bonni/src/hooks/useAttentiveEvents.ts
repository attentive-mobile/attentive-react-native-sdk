/**
 * Custom hooks for Attentive SDK event tracking
 * Separates business logic from UI components for better maintainability and testability
 */

import { useCallback } from 'react'
import {
  recordAddToCartEvent,
  recordProductViewEvent,
  recordPurchaseEvent,
  type Item,
} from '@attentive-mobile/attentive-react-native-sdk'
import { Product, CartItem } from '../models/Product'

/**
 * Converts a Product to an Attentive SDK Item format
 * @param product - The product to convert
 * @param quantity - Optional quantity (defaults to 1)
 * @returns Item formatted for Attentive SDK
 */
function productToItem(product: Product, quantity: number = 1): Item {
  const item: Item = {
    productId: product.id,
    productVariantId: product.id,
    price: product.price.toString(),
    currency: 'USD',
    name: product.name,
    quantity,
  }

  // Add optional category if present
  if (product.category) {
    item.category = product.category
  }

  // Add optional product image if we have a URL
  // Note: For local assets, we'd need to convert require() to a URL
  // For now, we could use a placeholder or skip this field
  // item.productImage = 'https://example.com/images/' + product.id + '.png'

  return item
}

/**
 * Hook for tracking product view events
 * @returns A memoized function to record product view events
 */
export function useProductView() {
  const recordProductView = useCallback((product: Product) => {
    recordProductViewEvent({
      items: [productToItem(product)],
    })
  }, [])

  return { recordProductView }
}

/**
 * Hook for tracking add to cart events
 * Combines cart logic with SDK tracking
 * @returns A memoized function to handle add to cart with SDK tracking
 */
export function useAddToCart() {
  const handleAddToCart = useCallback(
    (product: Product, addToCartFn: (product: Product) => void) => {
      // Add to cart first
      addToCartFn(product)

      // Then record the event
      recordAddToCartEvent({
        items: [productToItem(product)],
      })
    },
    []
  )

  return { handleAddToCart }
}

/**
 * Hook for tracking purchase events
 * @returns A memoized function to record purchase events
 */
export function usePurchase() {
  const recordPurchase = useCallback(
    (cartItems: CartItem[], orderId: string, cartId?: string, cartCoupon?: string) => {
      const items: Item[] = cartItems.map((item) =>
        productToItem(item.product, item.quantity)
      )

      recordPurchaseEvent({
        items,
        orderId,
        cartId,
        cartCoupon,
      })
    },
    []
  )

  return { recordPurchase }
}

