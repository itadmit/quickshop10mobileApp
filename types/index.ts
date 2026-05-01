// ============================================
// QuickShop Mobile - Type Definitions
// ============================================

// ============ Auth Types ============
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'merchant';
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: 'owner' | 'manager' | 'marketing' | 'developer';
  permissions: Record<string, boolean>;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  pushToken?: string;
  platform: 'ios' | 'android';
  appVersion: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  expiresAt: string;
  user: User;
  stores: Store[];
}

// ============ Order Types ============
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type FinancialStatus = 
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'partially_refunded';

export type FulfillmentStatus = 
  | 'unfulfilled'
  | 'partial'
  | 'fulfilled';

export interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  street?: string;
  houseNumber?: string;
  apartment?: string;
  floor?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  country?: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
}

export interface Shipment {
  id: string;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: string;
  statusDescription: string | null;
  provider: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  financialStatus: FinancialStatus;
  fulfillmentStatus: FulfillmentStatus;
  customStatus?: string | null;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  discountDetails?: Array<{ type: string; name: string; amount: number }>;
  shippingAmount: number;
  taxAmount: number;
  creditUsed: number;
  total: number;
  currency: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: Address;
  billingAddress: Address | null;
  shippingMethod: string | null;
  paymentMethod?: string | null;
  paymentDetails?: Record<string, unknown>;
  paidAt?: string | null;
  note: string | null;
  internalNote: string | null;
  isRead: boolean;
  archivedAt?: string | null;
  source?: string | null;
  utmSource?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  shipments?: Shipment[];
  itemsCount?: number;
}

export interface OrdersListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  financialStatus?: FinancialStatus;
  fulfillmentStatus?: FulfillmentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
}

export interface OrdersStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  /** ספירה ללשונית "שולמו" — אופציונלי אם השרת מחזיר */
  paid?: number;
  /** financialStatus = 'pending' — לשונית "ממתינות לתשלום" */
  pendingPayment?: number;
  /** financialStatus = 'paid' AND fulfillmentStatus != 'fulfilled' — לשונית "ממתינות למשלוח" */
  awaitingShipment?: number;
  /** financialStatus = 'paid' AND fulfillmentStatus = 'fulfilled' — לשונית "שולמו" (הושלמו) */
  paidShipped?: number;
}

export interface OrdersListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: OrdersStats;
}

// ============ Product Types ============
export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  comparePrice: number | null;
  cost: number | null;
  inventory: number | null;
  weight: number | null;
  imageUrl: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number | null;
  comparePrice: number | null;
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  hasVariants: boolean;
  trackInventory: boolean;
  inventory: number | null;
  allowBackorder: boolean;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  // Price range for products with variants (from API)
  minPrice?: number | null;
  maxPrice?: number | null;
  // Sum of active variants' inventory (only for hasVariants products)
  variantTotalInventory?: number | null;
}

export interface ProductsListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'active' | 'draft' | 'all';
  lowStock?: boolean;
  outOfStock?: boolean;
  sortBy?: 'name' | 'price' | 'inventory' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsStats {
  total: number;
  active: number;
  draft: number;
  lowStock: number;
  outOfStock: number;
}

export interface ProductsListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ProductsStats;
}

// ============ Customer Types ============
export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  defaultAddress: Address | null;
  notes: string | null;
  totalOrders: number;
  totalSpent: number;
  creditBalance: number;
  acceptsMarketing: boolean;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersListParams {
  page?: number;
  limit?: number;
  search?: string;
  hasOrders?: boolean;
  sortBy?: 'name' | 'totalSpent' | 'totalOrders' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomersListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** מוחזר מ־GET /mobile/customers (גם עם limit=1) */
  stats?: {
    total: number;
    withOrders?: number;
    returning?: number;
    withCredit?: number;
    acceptsMarketing?: number;
  };
}

// ============ Analytics Types ============
export interface DashboardSummary {
  revenue: {
    total: number;
    change: number;
    orders: number;
    avgOrderValue: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    change: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    change: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    revenue: number;
    quantity: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  waitingForShipment?: number;
}

// ============ Notification Types ============
export type NotificationType = 
  | 'new_order'
  | 'low_stock'
  | 'out_of_stock'
  | 'new_customer'
  | 'order_cancelled'
  | 'return_request'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  resourceId: string | null;
  resourceType: string | null;
  isRead: boolean;
  createdAt: string;
}

// ============ Discount Types ============
export type DiscountType = 
  | 'percentage'
  | 'fixed_amount'
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'
  | 'quantity_discount'
  | 'spend_x_pay_y';

export type DiscountAppliesTo = 'all' | 'category' | 'product' | 'member';

export interface Coupon {
  id: string;
  discountKind?: 'coupon' | 'automatic';
  code: string | null;
  title: string | null;
  name?: string;
  type: DiscountType;
  value: number;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  appliesTo?: DiscountAppliesTo;
  categoryIds?: string[];
  productIds?: string[];
  excludeCategoryIds?: string[];
  excludeProductIds?: string[];
  minimumAmount?: number | null;
  minimumQuantity?: number | null;
  oncePerCustomer?: boolean;
  firstOrderOnly?: boolean;
  stackable?: boolean;
  priority?: number;
  // Advanced type fields
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
  giftSameProduct?: boolean;
  giftProductIds?: string[];
  quantityTiers?: Array<{ quantity: number; discount: number; type: string }>;
  spendAmount?: number | null;
  description?: string | null;
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

