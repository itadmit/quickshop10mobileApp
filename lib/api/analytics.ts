import { api } from './client';
import type { DashboardSummary } from '@/types';

// ============ Analytics API ============
// Base: /api/mobile/analytics

export async function getDashboardSummary(params: {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<DashboardSummary> {
  const searchParams = new URLSearchParams();
  
  if (params.period) searchParams.set('period', params.period);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  
  const query = searchParams.toString();
  return api.get(`/mobile/analytics/summary${query ? `?${query}` : ''}`);
}

export async function getRealtimeStats(): Promise<{
  activeVisitors: number;
  todayPageViews: number;
  todayOrders: number;
  todayRevenue: number;
  activeCarts: number;
  cartValue: number;
}> {
  // Note: This endpoint is NOT YET IMPLEMENTED on backend (requires Redis)
  return api.get(`/mobile/analytics/realtime`);
}

export async function getSalesReport(params: {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<{
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
  totals: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
  };
}> {
  const searchParams = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  if (params.groupBy) searchParams.set('groupBy', params.groupBy);
  
  return api.get(`/mobile/analytics/sales?${searchParams}`);
}

export async function getTopProducts(params: {
  period?: 'week' | 'month' | 'year';
  limit?: number;
} = {}): Promise<
  Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    revenue: number;
    quantity: number;
    ordersCount: number;
  }>
> {
  const searchParams = new URLSearchParams();
  
  if (params.period) searchParams.set('period', params.period);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  
  const query = searchParams.toString();
  return api.get(`/mobile/analytics/top-products${query ? `?${query}` : ''}`);
}

// ============ Discounts API ============
// Base: /api/mobile/discounts

export async function getDiscounts(): Promise<{
  coupons: Array<{
    id: string;
    code: string;
    title: string | null;
    type: string;
    value: number;
    usageCount: number;
    usageLimit: number | null;
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
  }>;
  automaticDiscounts: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    appliesTo: 'all' | 'category' | 'product' | 'member';
    isActive: boolean;
    usageCount: number;
  }>;
}> {
  return api.get(`/mobile/discounts`);
}

// ============ Notifications API ============
// Base: /api/mobile/notifications

export async function getNotifications(): Promise<{
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string | null;
    resourceId: string | null;
    resourceType: string | null;
    isRead: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
}> {
  return api.get(`/mobile/notifications`);
}

export async function markNotificationsAsRead(notificationIds?: string[]): Promise<void> {
  await api.patch(`/mobile/notifications/read`, { notificationIds });
}

export async function getNotificationSettings(): Promise<{
  newOrder: boolean;
  lowStock: boolean;
  outOfStock: boolean;
  newCustomer: boolean;
  orderCancelled: boolean;
  returnRequest: boolean;
}> {
  return api.get(`/mobile/notifications/settings`);
}

export async function updateNotificationSettings(settings: {
  newOrder?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
  newCustomer?: boolean;
  orderCancelled?: boolean;
  returnRequest?: boolean;
}): Promise<void> {
  await api.patch(`/mobile/notifications/settings`, settings);
}
