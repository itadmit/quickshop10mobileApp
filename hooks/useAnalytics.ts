import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/lib/api/analytics';

// ============ Query Keys ============
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (period: string) => [...analyticsKeys.all, 'summary', period] as const,
  full: (params: object) => [...analyticsKeys.all, 'full', params] as const,
  sales: (params: object) => [...analyticsKeys.all, 'sales', params] as const,
  topProducts: (params: object) => [...analyticsKeys.all, 'top-products', params] as const,
  realtime: () => [...analyticsKeys.all, 'realtime'] as const,
};

// ============ Hooks ============
export function useFullAnalytics(params: Parameters<typeof analyticsApi.getAnalytics>[0] = {}) {
  return useQuery({
    queryKey: analyticsKeys.full(params),
    queryFn: () => analyticsApi.getAnalytics(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useSalesReport(params: Parameters<typeof analyticsApi.getSalesReport>[0]) {
  return useQuery({
    queryKey: analyticsKeys.sales(params),
    queryFn: () => analyticsApi.getSalesReport(params),
    enabled: !!params.dateFrom && !!params.dateTo,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useTopProducts(params: Parameters<typeof analyticsApi.getTopProducts>[0] = {}) {
  return useQuery({
    queryKey: analyticsKeys.topProducts(params),
    queryFn: () => analyticsApi.getTopProducts(params),
    staleTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useRealtimeStats() {
  return useQuery({
    queryKey: analyticsKeys.realtime(),
    queryFn: analyticsApi.getRealtimeStats,
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}
