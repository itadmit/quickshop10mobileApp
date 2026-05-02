import { api } from './client';
import { getStoreId } from '../utils/storage';

// ============ POS Types ============
export interface POSProduct {
  id: string;
  name: string;
  price: number | null;
  comparePrice: number | null;
  sku: string | null;
  barcode: string | null;
  hasVariants: boolean;
  inventory: number | null;
  trackInventory: boolean;
  categoryId: string | null;
  imageUrl: string | null;
}

export interface POSVariant {
  id: string;
  title: string;
  price: number | null;
  comparePrice: number | null;
  sku: string | null;
  barcode: string | null;
  inventory: number | null;
  imageUrl: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

export interface POSCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  type: 'product' | 'manual' | 'return';
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  imageUrl?: string | null;
  originalOrderId?: string;
}

export interface POSCustomer {
  type: 'existing' | 'new' | 'guest';
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    houseNumber?: string;
    apartment?: string;
    floor?: string;
    city: string;
    zipCode?: string;
  };
}

export interface AppliedCoupon {
  id: string;
  code: string;
  type: string;
  value: number;
  isGiftCard?: boolean;
}

export interface CreatePOSOrderData {
  items: CartItem[];
  customer: POSCustomer;
  shippingMethod: 'pickup' | 'delivery';
  shippingAmount: number;
  discountCode?: string;
  discountAmount: number;
  notes?: string;
  subtotal: number;
  total: number;
  markAsPaid?: boolean;
  partialPaymentAmount?: number;
  isExchange?: boolean;
}

export interface POSSearchCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  defaultAddress?: unknown;
}

// ============ API Functions ============

export async function getPOSProducts(params: {
  search?: string;
  categoryId?: string;
  limit?: number;
} = {}): Promise<{
  products: POSProduct[];
  categories: POSCategory[];
}> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  const url = `/mobile/pos/products${query ? `?${query}` : ''}`;
  if (__DEV__) console.log('[POS API] Calling:', url);
  return api.get(url);
}

export async function getProductVariants(productId: string): Promise<{
  variants: POSVariant[];
}> {
  return api.get(`/mobile/pos/products/${productId}/variants`);
}

export async function createPOSOrder(data: CreatePOSOrderData): Promise<{
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentUrl?: string;
  error?: string;
}> {
  return api.post(`/mobile/pos/orders`, data);
}

export async function validateCouponCode(
  code: string,
  cartTotal: number,
  email?: string,
): Promise<{
  success: boolean;
  coupon?: AppliedCoupon;
  error?: string;
}> {
  const storeId = await getStoreId();
  return api.post('/coupon/validate', { storeId, code, cartTotal, email });
}

export async function searchPOSCustomers(search: string): Promise<{
  customers: POSSearchCustomer[];
}> {
  return api.get(
    `/mobile/customers?search=${encodeURIComponent(search)}&limit=10&sortBy=totalOrders&sortOrder=desc`,
  );
}
