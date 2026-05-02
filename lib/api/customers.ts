import { api } from './client';
import type { Customer, CustomersListParams, CustomersListResponse, Order } from '@/types';

// ============ Customers API ============
// Base: /api/mobile/customers

export async function getCustomers(params: CustomersListParams = {}): Promise<CustomersListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.hasOrders !== undefined) searchParams.set('hasOrders', params.hasOrders.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  
  const query = searchParams.toString();
  return api.get(`/mobile/customers${query ? `?${query}` : ''}`);
}

export async function getCustomer(customerId: string): Promise<{
  customer: Customer;
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: Order['status'];
    createdAt: string;
  }>;
  creditHistory: Array<{
    id: string;
    type: 'credit' | 'debit' | 'refund';
    amount: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
  }>;
}> {
  return api.get(`/mobile/customers/${customerId}`);
}

export async function updateCustomer(
  customerId: string,
  data: Partial<Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'notes' | 'acceptsMarketing'>>
): Promise<{ success: boolean; customer: Customer }> {
  return api.patch(`/mobile/customers/${customerId}`, data);
}

export async function addCustomerCredit(
  customerId: string,
  data: {
    amount: number;
    reason: string;
  }
): Promise<{
  success: boolean;
  customer: {
    id: string;
    creditBalance: number;
  };
}> {
  return api.post(`/mobile/customers/${customerId}/credit`, data);
}

export async function addCustomerNote(
  customerId: string,
  note: string
): Promise<{ success: boolean }> {
  return api.post(`/mobile/customers/${customerId}/notes`, { note });
}

// ============ Customer Stats ============
/** השרת מחזיר stats בתוך GET /mobile/customers (אין endpoint נפרד /stats) */
export async function getCustomersStats(): Promise<{
  total: number;
  new: number;
  returning: number;
  avgSpent: number;
}> {
  const res = await api.get<CustomersListResponse>(`/mobile/customers?limit=1`);
  const stats = res.stats;
  return {
    total: stats?.total ?? res.pagination?.total ?? 0,
    new: 0,
    returning: stats?.returning ?? 0,
    avgSpent: 0,
  };
}

// ============ Create Customer ============
export interface CreateCustomerData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  notes?: string;
  acceptsMarketing?: boolean;
  defaultAddress?: {
    street?: string;
    houseNumber?: string;
    apartment?: string;
    floor?: string;
    city?: string;
    zipCode?: string;
    phone?: string;
  };
}

export async function createCustomer(
  data: CreateCustomerData
): Promise<{ success: boolean; customer: Customer }> {
  return api.post(`/mobile/customers`, data);
}

// ============ Delete Customer ============
export async function deleteCustomer(
  customerId: string
): Promise<{ success: boolean }> {
  return api.delete(`/mobile/customers/${customerId}`);
}
