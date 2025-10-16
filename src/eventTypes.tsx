export type UserIdentifiers = {
  phone?: string;
  email?: string;
  klaviyoId?: string;
  shopifyId?: string;
  clientUserId?: string;
  customIdentifiers?: Record<string, string>;
};

export type AttentiveSdkConfiguration = {
  attentiveDomain: string;
  mode: string; // "production" or "debug"
  skipFatigueOnCreatives?: boolean;
  enableDebugger?: boolean;
};

// Codegen does not support nested objects inside of arrays. We must flatten the Item type.
export type Item = {
  productId: string;
  productVariantId: string;
  price: string;
  currency: string;
  productImage?: string;
  name?: string;
  quantity?: number;
  category?: string;
};

export type ProductView = {
  items: Item[];
  deeplink?: string;
};

// Codegen does not support nested objects. We must flatten the Purchase type.
export type Purchase = {
  items: Item[];
  orderId: string;
  cartId?: string;
  cartCoupon?: string;
};

export type AddToCart = {
  items: Item[];
  deeplink?: string;
};

export type CustomEvent = {
  type: string;
  properties: Record<string, string>;
};
