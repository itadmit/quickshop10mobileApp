import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores';
import * as customersApi from '@/lib/api/customers';
import type { CustomersListParams, Customer } from '@/types';

// ============ Query Keys ============
export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  list: (params: CustomersListParams) => [...customersKeys.lists(), params] as const,
  details: () => [...customersKeys.all, 'detail'] as const,
  detail: (id: string) => [...customersKeys.details(), id] as const,
  stats: () => [...customersKeys.all, 'stats'] as const,
};

// ============ Hooks ============
export function useCustomers(params: CustomersListParams = {}) {
  const refreshKey = useAppStore((s) => s.customersRefreshKey);
  
  return useQuery({
    queryKey: [...customersKeys.list(params), refreshKey],
    queryFn: () => customersApi.getCustomers(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInfiniteCustomers(params: Omit<CustomersListParams, 'page'> = {}) {
  const refreshKey = useAppStore((s) => s.customersRefreshKey);
  
  return useInfiniteQuery({
    queryKey: [...customersKeys.lists(), params, refreshKey],
    queryFn: ({ pageParam = 1 }) => customersApi.getCustomers({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: customersKeys.detail(customerId),
    queryFn: () => customersApi.getCustomer(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCustomersStats() {
  return useQuery({
    queryKey: customersKeys.stats(),
    queryFn: customersApi.getCustomersStats,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============ Mutations ============
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerCustomersRefresh);
  
  return useMutation({
    mutationFn: ({ customerId, data }: {
      customerId: string;
      data: Parameters<typeof customersApi.updateCustomer>[1];
    }) => customersApi.updateCustomer(customerId, data),
    
    onMutate: async ({ customerId, data }) => {
      await queryClient.cancelQueries({ queryKey: customersKeys.detail(customerId) });
      
      const previousCustomer = queryClient.getQueryData(customersKeys.detail(customerId));
      
      queryClient.setQueryData(
        customersKeys.detail(customerId),
        (old: { customer: Customer } | undefined) => {
          if (!old) return old;
          return { ...old, customer: { ...old.customer, ...data } };
        }
      );
      
      return { previousCustomer };
    },
    
    onError: (_err, { customerId }, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(customersKeys.detail(customerId), context.previousCustomer);
      }
    },
    
    onSuccess: () => {
      triggerRefresh();
    },
  });
}

export function useAddCustomerCredit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, data }: {
      customerId: string;
      data: { amount: number; reason: string };
    }) => customersApi.addCustomerCredit(customerId, data),
    
    onSuccess: (result, { customerId }) => {
      // Update customer credit balance
      queryClient.setQueryData(
        customersKeys.detail(customerId),
        (old: { customer: Customer } | undefined) => {
          if (!old) return old;
          return { 
            ...old, 
            customer: { 
              ...old.customer, 
              creditBalance: result.customer.creditBalance 
            } 
          };
        }
      );
      
      // Invalidate to get updated credit history
      queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
    },
  });
}

export function useAddCustomerNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, note }: { customerId: string; note: string }) =>
      customersApi.addCustomerNote(customerId, note),
    
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
    },
  });
}

