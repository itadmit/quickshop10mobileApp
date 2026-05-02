import { api } from './client';
import type { DashboardSummary, OrderStatus } from '@/types';

// ============ Analytics API ============
// Base: /api/mobile/analytics

/** צורת התשובה מ־QuickShop GET /api/mobile/analytics/summary */
interface MobileAnalyticsSummaryPayload {
  success?: boolean;
  summary?: {
    revenue?: { current: number; previous: number; changePercent: number };
    orders?: { current: number; previous: number; changePercent: number };
    averageOrderValue?: number;
    pendingOrders?: number;
    unreadOrders?: number;
    newCustomers?: number;
    waitingForShipment?: number;
    inventory?: { lowStock: number; outOfStock: number };
  };
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    status: OrderStatus;
    total: number;
    isRead?: boolean;
    createdAt: string;
  }>;
  topProducts?: Array<{
    productId: string | null;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    imageUrl?: string | null;
  }>;
  salesChart?: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

function isLegacyDashboardShape(raw: unknown): raw is DashboardSummary {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  const rev = r.revenue;
  return (
    typeof rev === 'object' &&
    rev !== null &&
    'total' in rev &&
    typeof (rev as { total?: unknown }).total === 'number'
  );
}

function buildRevenueChart(
  salesChart: MobileAnalyticsSummaryPayload['salesChart'],
  recentOrders: MobileAnalyticsSummaryPayload['recentOrders'],
): DashboardSummary['revenueChart'] {
  if (salesChart && salesChart.length > 0) {
    return salesChart.map((d) => ({
      date: d.date,
      revenue: Number(d.revenue),
      orders: Number(d.orders),
    }));
  }

  if (!recentOrders || recentOrders.length === 0) return [];

  const dayMap = new Map<string, { revenue: number; orders: number }>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().split('T')[0], { revenue: 0, orders: 0 });
  }

  for (const o of recentOrders) {
    if (o.status === 'cancelled') continue;
    const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
    const entry = dayMap.get(dateStr);
    if (entry) {
      entry.revenue += Number(o.total);
      entry.orders += 1;
    }
  }

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));
}

/** ממפה את מבנה השרת (nested summary) ל־DashboardSummary שמסך הבית מצפה לו */
export function normalizeMobileAnalyticsSummary(raw: unknown): DashboardSummary {
  if (isLegacyDashboardShape(raw)) {
    return raw;
  }

  const r = raw as MobileAnalyticsSummaryPayload;
  const s = r.summary;

  if (!s) {
    return {
      revenue: { total: 0, change: 0, orders: 0, avgOrderValue: 0 },
      orders: {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        change: 0,
      },
      products: { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
      customers: { total: 0, new: 0, returning: 0, change: 0 },
      topProducts: [],
      recentOrders: [],
      revenueChart: [],
    };
  }

  const orderCount = s.orders?.current ?? 0;
  const revenueTotal = s.revenue?.current ?? 0;

  return {
    revenue: {
      total: revenueTotal,
      change: s.revenue?.changePercent ?? 0,
      orders: orderCount,
      avgOrderValue: s.averageOrderValue ?? 0,
    },
    orders: {
      total: orderCount,
      pending: s.pendingOrders ?? 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      change: s.orders?.changePercent ?? 0,
    },
    products: {
      total: 0,
      active: 0,
      lowStock: s.inventory?.lowStock ?? 0,
      outOfStock: s.inventory?.outOfStock ?? 0,
    },
    customers: {
      total: 0,
      new: s.newCustomers ?? 0,
      returning: 0,
      change: 0,
    },
    topProducts: (r.topProducts ?? []).map((p) => ({
      id: p.productId ?? '',
      name: p.name,
      imageUrl: p.imageUrl ?? null,
      revenue: Number(p.totalRevenue),
      quantity: Number(p.totalQuantity),
    })),
    recentOrders: (r.recentOrders ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName ?? '',
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
    })),
    revenueChart: buildRevenueChart(r.salesChart, r.recentOrders),
    waitingForShipment: s.waitingForShipment ?? 0,
  };
}

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
  const raw = await api.get<unknown>(
    `/mobile/analytics/summary${query ? `?${query}` : ''}`
  );
  return normalizeMobileAnalyticsSummary(raw);
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
  period?: 'today' | 'week' | 'month' | 'year';
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
  const query = searchParams.toString();
  const raw = await api.get<MobileAnalyticsSummaryPayload>(
    `/mobile/analytics/summary${query ? `?${query}` : ''}`
  );
  const limit = Math.min(Math.max(params.limit ?? 5, 1), 20);
  const rows = raw.topProducts ?? [];
  return rows.slice(0, limit).map((p, i) => ({
    id: p.productId ?? `top-${i}`,
    name: p.name,
    imageUrl: null,
    revenue: Number(p.totalRevenue),
    quantity: Number(p.totalQuantity),
    ordersCount: 0,
  }));
}

// ============ Discounts API ============
// Base: /api/mobile/discounts

export type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping' 
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'
  | 'quantity_discount'
  | 'spend_x_pay_y';

export interface Discount {
  id: string;
  discountKind?: 'coupon' | 'automatic';
  code: string | null;
  name?: string;
  title: string | null;
  description: string | null;
  type: DiscountType;
  value: number;
  minimumAmount: number | null;
  minimumQuantity: number | null;
  usageCount: number;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  oncePerCustomer?: boolean;
  firstOrderOnly?: boolean;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  excludeCategoryIds?: string[];
  excludeProductIds?: string[];
  isActive: boolean;
  isAutomatic: boolean;
  stackable?: boolean;
  priority?: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Advanced fields
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
  giftSameProduct?: boolean;
  giftProductIds?: string[];
  quantityTiers?: Array<{ quantity: number; discount: number; type: string }>;
  spendAmount?: number | null;
}

export interface DiscountsListResponse {
  discounts: Discount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDiscounts(params: {
  page?: number;
  limit?: number;
  type?: 'coupon' | 'automatic' | 'all';
  status?: 'active' | 'inactive' | 'expired' | 'all';
} = {}): Promise<DiscountsListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.type) searchParams.set('type', params.type);
  if (params.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return api.get(`/mobile/discounts${query ? `?${query}` : ''}`);
}

export async function getDiscount(discountId: string): Promise<{
  discount: Discount;
  stats: {
    totalUsage: number;
    totalSavings: number;
    ordersCount: number;
  };
}> {
  return api.get(`/mobile/discounts/${discountId}`);
}

export interface CreateDiscountData {
  _kind?: 'coupon' | 'automatic';
  code?: string;
  name?: string;
  title?: string;
  description?: string;
  type: DiscountType;
  value: number;
  minimumAmount?: number;
  minimumQuantity?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  oncePerCustomer?: boolean;
  firstOrderOnly?: boolean;
  appliesTo?: 'all' | 'category' | 'product' | 'member';
  categoryIds?: string[];
  productIds?: string[];
  excludeCategoryIds?: string[];
  excludeProductIds?: string[];
  isActive?: boolean;
  isAutomatic?: boolean;
  stackable?: boolean;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
  // Advanced
  buyQuantity?: number;
  payAmount?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  giftSameProduct?: boolean;
  giftProductIds?: string[];
  quantityTiers?: Array<{ quantity: number; discount: number; type: string }>;
  spendAmount?: number;
}

export async function createDiscount(data: CreateDiscountData): Promise<{
  success: boolean;
  data: Discount;
}> {
  return api.post(`/mobile/discounts`, data);
}

export async function updateDiscount(
  discountId: string,
  data: Partial<CreateDiscountData>
): Promise<{
  success: boolean;
  data: Discount;
}> {
  return api.patch(`/mobile/discounts/${discountId}`, data);
}

export async function deleteDiscount(discountId: string): Promise<{ success: boolean }> {
  return api.delete(`/mobile/discounts/${discountId}`);
}

export async function toggleDiscountStatus(
  discountId: string,
  isActive: boolean
): Promise<{ success: boolean }> {
  return api.patch(`/mobile/discounts/${discountId}`, { isActive });
}

// Quick coupon creation (simplified)
export async function createQuickCoupon(data: {
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumAmount?: number;
  usageLimit?: number;
  endsAt?: string;
}): Promise<{
  success: boolean;
  data: Discount;
}> {
  return api.post(`/mobile/discounts`, {
    ...data,
    isAutomatic: false,
    isActive: true,
  });
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

// ============ Returns API ============
// Base: /api/mobile/returns

export async function getReturns(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: 'return' | 'exchange';
} = {}): Promise<{
  returns: Array<{
    id: string;
    requestNumber: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    type: 'return' | 'exchange';
    status: string;
    totalValue: number;
    reason: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  stats: {
    pending: number;
    approved: number;
    completed: number;
  };
}> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  
  const query = searchParams.toString();
  return api.get(`/mobile/returns${query ? `?${query}` : ''}`);
}

// ============ Settings API ============
// Base: /api/mobile/settings

export async function getStoreSettings(): Promise<{
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  currency: string;
  timezone: string;
  language: string;
}> {
  return api.get(`/mobile/settings`);
}

export async function updateStoreSettings(settings: Partial<{
  name: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
  currency: string;
  timezone: string;
  language: string;
}>): Promise<{ success: boolean }> {
  return api.patch(`/mobile/settings`, settings);
}

// ============ Webhooks API ============
// Base: /api/mobile/webhooks

export type WebhookEvent = 
  | 'order.created'
  | 'order.updated'
  | 'order.paid'
  | 'order.fulfilled'
  | 'order.cancelled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'customer.created'
  | 'customer.updated'
  | 'inventory.low'
  | 'inventory.out_of_stock';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  description: string | null;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhooksListResponse {
  webhooks: Webhook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getWebhooks(params: {
  page?: number;
  limit?: number;
} = {}): Promise<WebhooksListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  
  const query = searchParams.toString();
  return api.get(`/mobile/webhooks${query ? `?${query}` : ''}`);
}

export async function getWebhook(webhookId: string): Promise<{
  webhook: Webhook;
  recentDeliveries: Array<{
    id: string;
    event: WebhookEvent;
    status: 'success' | 'failed' | 'pending';
    statusCode: number | null;
    responseTime: number | null;
    createdAt: string;
  }>;
}> {
  return api.get(`/mobile/webhooks/${webhookId}`);
}

export interface CreateWebhookData {
  url: string;
  events: WebhookEvent[];
  description?: string;
  isActive?: boolean;
}

export async function createWebhook(data: CreateWebhookData): Promise<{
  success: boolean;
  data: Webhook;
}> {
  return api.post(`/mobile/webhooks`, data);
}

export async function updateWebhook(
  webhookId: string,
  data: Partial<CreateWebhookData>
): Promise<{
  success: boolean;
  data: Webhook;
}> {
  return api.patch(`/mobile/webhooks/${webhookId}`, data);
}

export async function deleteWebhook(webhookId: string): Promise<{ success: boolean }> {
  return api.delete(`/mobile/webhooks/${webhookId}`);
}

export async function toggleWebhookStatus(
  webhookId: string,
  isActive: boolean
): Promise<{ success: boolean }> {
  return api.patch(`/mobile/webhooks/${webhookId}`, { isActive });
}

export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode: number;
  responseTime: number;
  response: string;
}> {
  return api.post(`/mobile/webhooks/${webhookId}/test`);
}

export async function regenerateWebhookSecret(webhookId: string): Promise<{
  success: boolean;
  secret: string;
}> {
  return api.post(`/mobile/webhooks/${webhookId}/regenerate-secret`);
}

// ============ Extended Analytics API ============
// מקור הנתונים בשרת: GET /api/mobile/analytics/summary (אין route נפרד ל־/mobile/analytics)

export type FullAnalyticsResponse = {
  summary: {
    revenue: number;
    revenueChange: number;
    orders: number;
    ordersChange: number;
    customers: number;
    customersChange: number;
    avgOrderValue: number;
    avgOrderValueChange: number;
    conversionRate: number;
    conversionRateChange: number;
  };
  charts: {
    revenue: Array<{ date: string; value: number }>;
    orders: Array<{ date: string; value: number }>;
    visitors: Array<{ date: string; value: number }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    revenue: number;
    quantity: number;
  }>;
  topCategories: Array<{
    id: string;
    name: string;
    revenue: number;
    ordersCount: number;
  }>;
  customerSegments?: {
    new: number;
    returning: number;
    inactive: number;
  };
};

function mapSummaryToFullAnalytics(raw: MobileAnalyticsSummaryPayload): FullAnalyticsResponse {
  const s = raw.summary;
  if (!s) {
    return {
      summary: {
        revenue: 0,
        revenueChange: 0,
        orders: 0,
        ordersChange: 0,
        customers: 0,
        customersChange: 0,
        avgOrderValue: 0,
        avgOrderValueChange: 0,
        conversionRate: 0,
        conversionRateChange: 0,
      },
      charts: { revenue: [], orders: [], visitors: [] },
      topProducts: [],
      topCategories: [],
    };
  }

  const topProducts = (raw.topProducts ?? []).map((p, i) => ({
    id: p.productId ?? `top-${i}`,
    name: p.name,
    imageUrl: null as string | null,
    revenue: Number(p.totalRevenue),
    quantity: Number(p.totalQuantity),
  }));

  return {
    summary: {
      revenue: s.revenue?.current ?? 0,
      revenueChange: s.revenue?.changePercent ?? 0,
      orders: s.orders?.current ?? 0,
      ordersChange: s.orders?.changePercent ?? 0,
      customers: s.newCustomers ?? 0,
      customersChange: 0,
      avgOrderValue: s.averageOrderValue ?? 0,
      avgOrderValueChange: 0,
      conversionRate: 0,
      conversionRateChange: 0,
    },
    charts: { revenue: [], orders: [], visitors: [] },
    topProducts,
    topCategories: [],
  };
}

export async function getAnalytics(params: {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  metrics?: string[];
} = {}): Promise<FullAnalyticsResponse> {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set('period', params.period);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params.metrics) searchParams.set('metrics', params.metrics.join(','));
  const query = searchParams.toString();
  const raw = await api.get<MobileAnalyticsSummaryPayload>(
    `/mobile/analytics/summary${query ? `?${query}` : ''}`
  );
  return mapSummaryToFullAnalytics(raw);
}
