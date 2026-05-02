import { api } from './client';
import type {
  Order,
  OrdersListParams,
  OrdersListResponse,
  OrderItem,
  Customer,
} from '@/types';

// ============ Orders API ============
// Base: /api/mobile/orders

export async function getOrders(params: OrdersListParams = {}): Promise<OrdersListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.financialStatus) searchParams.set('financialStatus', params.financialStatus);
  if (params.fulfillmentStatus) searchParams.set('fulfillmentStatus', params.fulfillmentStatus);
  if (params.search) searchParams.set('search', params.search);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params.customerId) searchParams.set('customerId', params.customerId);
  
  const query = searchParams.toString();
  return api.get(`/mobile/orders${query ? `?${query}` : ''}`);
}

export async function getOrder(orderId: string): Promise<{
  order: Order;
  items: OrderItem[];
  customer: Customer | null;
  transactions: Array<{
    id: string;
    type: 'charge' | 'refund';
    status: 'pending' | 'success' | 'failed';
    amount: number;
    provider: string;
    createdAt: string;
  }>;
  timeline: Array<{
    action: string;
    description: string;
    userId: string | null;
    createdAt: string;
  }>;
}> {
  return api.get(`/mobile/orders/${orderId}`);
}

export async function updateOrderStatus(
  orderId: string,
  data: {
    status?: Order['status'];
    financialStatus?: string;
    fulfillmentStatus?: Order['fulfillmentStatus'];
    customStatus?: string | null;
    internalNote?: string;
    note?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    shippingAddress?: Record<string, unknown>;
    notifyCustomer?: boolean;
  }
): Promise<{ success: boolean; order: Order }> {
  return api.patch(`/mobile/orders/${orderId}`, data);
}

export async function markOrderAsRead(orderId: string): Promise<void> {
  await api.patch(`/mobile/orders/${orderId}/read`);
}

export async function archiveOrders(orderIds: string[]): Promise<{ success: boolean; archivedCount: number }> {
  return api.post(`/mobile/orders/archive`, { orderIds });
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean }> {
  return api.post(`/mobile/orders/${orderId}/cancel`, {});
}

export async function refundOrder(
  orderId: string,
  data?: {
    amount?: number;
    reason?: string;
    restockItems?: boolean;
    notifyCustomer?: boolean;
    items?: Array<{ orderItemId: string; quantity: number; amount: number }>;
  }
): Promise<{
  success: boolean;
  refundId?: string;
  refundedAmount?: number;
  newFinancialStatus?: 'refunded' | 'partially_refunded';
  error?: string;
}> {
  return api.post(`/mobile/orders/${orderId}/refund`, data || {});
}

export async function fulfillOrder(
  orderId: string,
  data?: {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
  }
): Promise<{ success: boolean }> {
  return api.post(`/mobile/orders/${orderId}/fulfill`, data || {});
}

export async function addOrderNote(
  orderId: string,
  data: { note?: string; internalNote?: string }
): Promise<{ success: boolean }> {
  return api.patch(`/mobile/orders/${orderId}/notes`, data);
}

export async function editOrder(
  orderId: string,
  data: {
    removeItems?: string[];
    updateQuantity?: Array<{ itemId: string; newQuantity: number }>;
    addItems?: Array<{
      productId: string;
      name: string;
      variantTitle?: string;
      sku?: string;
      quantity: number;
      price: number;
      imageUrl?: string;
    }>;
    shippingAmount?: number;
    discountAmount?: number;
    discountReason?: string;
  }
): Promise<{ success: boolean; newSubtotal?: number; newTotal?: number }> {
  return api.patch(`/mobile/orders/${orderId}/edit`, data);
}

// ============ Order Stats ============
export async function getOrdersStats(): Promise<{
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pending: number;
  processing: number;
}> {
  return api.get(`/mobile/orders/stats`);
}
