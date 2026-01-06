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
  if (params.fulfillmentStatus) searchParams.set('fulfillmentStatus', params.fulfillmentStatus);
  if (params.search) searchParams.set('search', params.search);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  
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
    fulfillmentStatus?: Order['fulfillmentStatus'];
    internalNote?: string;
    trackingNumber?: string;
    trackingUrl?: string;
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

export async function refundOrder(
  orderId: string,
  data: {
    amount?: number;
    reason?: string;
    restockItems?: boolean;
    notifyCustomer?: boolean;
  }
): Promise<{
  success: boolean;
  refund: {
    id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId: string | null;
  };
}> {
  return api.post(`/mobile/orders/${orderId}/refund`, data);
}

export async function addOrderNote(
  orderId: string,
  note: string
): Promise<{ success: boolean }> {
  return api.post(`/mobile/orders/${orderId}/notes`, { note });
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
