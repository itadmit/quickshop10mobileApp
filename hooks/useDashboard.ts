import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/lib/api/analytics';

// ============ Query Keys ============
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (period?: string) => [...dashboardKeys.all, 'summary', period] as const,
  realtime: () => [...dashboardKeys.all, 'realtime'] as const,
  topProducts: (period?: string) => [...dashboardKeys.all, 'topProducts', period] as const,
};

// ============ Hooks ============
export function useDashboardSummary(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery({
    queryKey: dashboardKeys.summary(period),
    queryFn: () => analyticsApi.getDashboardSummary({ period }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

export function useRealtimeStats() {
  return useQuery({
    queryKey: dashboardKeys.realtime(),
    queryFn: analyticsApi.getRealtimeStats,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useTopProducts(period: 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: dashboardKeys.topProducts(period),
    queryFn: () => analyticsApi.getTopProducts({ period, limit: 5 }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

