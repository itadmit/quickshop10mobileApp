import { api } from './client';

export type ReturnRequestType = 'return' | 'exchange';
export type ReturnRequestStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'awaiting_shipment'
  | 'item_received'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ReturnResolution = 'store_credit' | 'refund' | 'exchange';

export interface ReturnRequestSummary {
  id: string;
  requestNumber: string;
  type: ReturnRequestType;
  status: ReturnRequestStatus;
  reason: string | null;
  totalValue: number;
  refundAmount: number | null;
  creditIssued: number | null;
  finalResolution: ReturnResolution | null;
  createdAt: string;
  processedAt: string | null;
  orderId: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
}

export interface ReturnItemDetail {
  orderItemId?: string;
  productId?: string;
  variantId?: string;
  name?: string;
  variantTitle?: string;
  imageUrl?: string;
  quantity: number;
  price?: number;
  total?: number;
  reason?: string;
}

export interface ReturnRequestDetail {
  id: string;
  storeId: string;
  orderId: string;
  customerId: string | null;
  requestNumber: string;
  type: ReturnRequestType;
  status: ReturnRequestStatus;
  items: ReturnItemDetail[];
  reason: string | null;
  reasonDetails: string | null;
  images: string[] | null;
  requestedResolution: ReturnResolution | null;
  finalResolution: ReturnResolution | null;
  resolutionDetails: string | null;
  totalValue: number;
  refundAmount: number | null;
  creditIssued: number | null;
  exchangeOrderId: string | null;
  returnTrackingNumber: string | null;
  internalNotes: string | null;
  customerNotes: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequestStats {
  pending: number;
  under_review: number;
  approved: number;
  awaiting_shipment: number;
  item_received: number;
  completed: number;
  rejected: number;
  cancelled: number;
  active: number;
  total: number;
}

export interface PendingInventoryItem {
  id: string;
  storeId: string;
  returnRequestId: string | null;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantTitle: string | null;
  imageUrl: string | null;
  quantity: number;
  status: 'pending' | 'received' | 'discarded';
  customerName: string | null;
  orderNumber: string | null;
  requestNumber: string | null;
  returnType: ReturnRequestType;
  resolvedAt: string | null;
  note: string | null;
  createdAt: string;
}

export async function listReturns(params: {
  status?: ReturnRequestStatus | 'all';
  type?: ReturnRequestType | 'all';
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  success: boolean;
  requests: ReturnRequestSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: ReturnRequestStats;
}> {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.type) q.set('type', params.type);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return api.get(`/mobile/returns${qs ? `?${qs}` : ''}`);
}

export async function getReturn(id: string): Promise<{
  success: boolean;
  request: ReturnRequestDetail;
  order: {
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerEmail: string | null;
    total: number;
    status: string;
    financialStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
  } | null;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    creditBalance: number;
  } | null;
  processedBy: string | null;
}> {
  return api.get(`/mobile/returns/${id}`);
}

export async function processReturn(
  id: string,
  body: {
    action: 'approve' | 'reject';
    resolution?: ReturnResolution;
    amount?: number;
    customerNotes?: string;
  },
): Promise<{ success: boolean; status?: string; resolution?: ReturnResolution; error?: string }> {
  return api.post(`/mobile/returns/${id}/process`, body);
}

export async function listPendingInventory(params: {
  status?: 'pending' | 'received' | 'discarded' | 'all';
  page?: number;
  limit?: number;
} = {}): Promise<{
  success: boolean;
  items: PendingInventoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  pendingCount: number;
}> {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return api.get(`/mobile/returns/pending-inventory${qs ? `?${qs}` : ''}`);
}

export async function actOnPendingInventory(
  id: string,
  body: { action: 'confirm' | 'discard'; note?: string },
): Promise<{ success: boolean; status?: string; error?: string }> {
  return api.post(`/mobile/returns/pending-inventory/${id}`, body);
}

export type ReturnReason =
  | 'wrong_size'
  | 'defective'
  | 'not_as_described'
  | 'changed_mind'
  | 'wrong_item'
  | 'damaged_shipping'
  | 'other';

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  wrong_size: 'מידה לא מתאימה',
  defective: 'פגם במוצר',
  not_as_described: 'לא כמתואר',
  changed_mind: 'שינוי דעה',
  wrong_item: 'מוצר שגוי',
  damaged_shipping: 'נזק במשלוח',
  other: 'אחר',
};

export async function createReturnRequest(body: {
  orderId: string;
  type: ReturnRequestType;
  items: Array<{ orderItemId: string; quantity: number }>;
  reason: ReturnReason;
  reasonDetails?: string;
  requestedResolution?: 'refund' | 'store_credit' | 'exchange' | 'partial_refund';
}): Promise<{
  success: boolean;
  requestId?: string;
  requestNumber?: string;
  error?: string;
}> {
  return api.post('/mobile/returns', body);
}
