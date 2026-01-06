import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores';
import * as ordersApi from '@/lib/api/orders';
import type { OrdersListParams, Order } from '@/types';

// ============ Query Keys ============
export const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (params: OrdersListParams) => [...ordersKeys.lists(), params] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
  stats: () => [...ordersKeys.all, 'stats'] as const,
};

// ============ Hooks ============
export function useOrders(params: OrdersListParams = {}) {
  const refreshKey = useAppStore((s) => s.ordersRefreshKey);
  
  return useQuery({
    queryKey: [...ordersKeys.list(params), refreshKey],
    queryFn: () => ordersApi.getOrders(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useInfiniteOrders(params: Omit<OrdersListParams, 'page'> = {}) {
  const refreshKey = useAppStore((s) => s.ordersRefreshKey);
  
  return useInfiniteQuery({
    queryKey: [...ordersKeys.lists(), params, refreshKey],
    queryFn: ({ pageParam = 1 }) => ordersApi.getOrders({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ordersKeys.detail(orderId),
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useOrdersStats() {
  return useQuery({
    queryKey: ordersKeys.stats(),
    queryFn: ordersApi.getOrdersStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============ Mutations ============
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerOrdersRefresh);
  
  return useMutation({
    mutationFn: ({ orderId, data }: { 
      orderId: string; 
      data: Parameters<typeof ordersApi.updateOrderStatus>[1] 
    }) => ordersApi.updateOrderStatus(orderId, data),
    
    // Optimistic update
    onMutate: async ({ orderId, data }) => {
      await queryClient.cancelQueries({ queryKey: ordersKeys.detail(orderId) });
      
      const previousOrder = queryClient.getQueryData(ordersKeys.detail(orderId));
      
      // Update cache optimistically
      queryClient.setQueryData(ordersKeys.detail(orderId), (old: { order: Order } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          order: {
            ...old.order,
            ...(data.status && { status: data.status }),
            ...(data.fulfillmentStatus && { fulfillmentStatus: data.fulfillmentStatus }),
            ...(data.internalNote !== undefined && { internalNote: data.internalNote }),
          },
        };
      });
      
      return { previousOrder };
    },
    
    onError: (_err, { orderId }, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(ordersKeys.detail(orderId), context.previousOrder);
      }
    },
    
    onSuccess: () => {
      triggerRefresh();
    },
  });
}

export function useMarkOrderAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.markOrderAsRead(orderId),
    
    onMutate: async (orderId) => {
      queryClient.setQueryData(ordersKeys.detail(orderId), (old: { order: Order } | undefined) => {
        if (!old) return old;
        return { ...old, order: { ...old.order, isRead: true } };
      });
    },
  });
}

export function useArchiveOrders() {
  const triggerRefresh = useAppStore((s) => s.triggerOrdersRefresh);
  
  return useMutation({
    mutationFn: (orderIds: string[]) => ordersApi.archiveOrders(orderIds),
    onSuccess: () => {
      triggerRefresh();
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerOrdersRefresh);
  
  return useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: string;
      data: Parameters<typeof ordersApi.refundOrder>[1];
    }) => ordersApi.refundOrder(orderId, data),
    
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
      triggerRefresh();
    },
  });
}

export function useAddOrderNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note: string }) => 
      ordersApi.addOrderNote(orderId, note),
    
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
    },
  });
}

