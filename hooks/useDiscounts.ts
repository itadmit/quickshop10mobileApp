import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as discountsApi from '@/lib/api/analytics';

// ============ Query Keys ============
export const discountsKeys = {
  all: ['discounts'] as const,
  lists: () => [...discountsKeys.all, 'list'] as const,
  list: (params: object) => [...discountsKeys.lists(), params] as const,
  details: () => [...discountsKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountsKeys.details(), id] as const,
};

// ============ Hooks ============
export function useDiscounts(params: Parameters<typeof discountsApi.getDiscounts>[0] = {}) {
  return useQuery({
    queryKey: discountsKeys.list(params),
    queryFn: () => discountsApi.getDiscounts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInfiniteDiscounts(params: Omit<Parameters<typeof discountsApi.getDiscounts>[0], 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: [...discountsKeys.lists(), params],
    queryFn: ({ pageParam = 1 }) => discountsApi.getDiscounts({ ...params, page: pageParam }),
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

export function useDiscount(discountId: string) {
  return useQuery({
    queryKey: discountsKeys.detail(discountId),
    queryFn: () => discountsApi.getDiscount(discountId),
    enabled: !!discountId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============ Mutations ============
export function useCreateDiscount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: discountsApi.CreateDiscountData) => discountsApi.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountsKeys.lists() });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ discountId, data }: {
      discountId: string;
      data: Partial<discountsApi.CreateDiscountData>;
    }) => discountsApi.updateDiscount(discountId, data),
    onSuccess: (_, { discountId }) => {
      queryClient.invalidateQueries({ queryKey: discountsKeys.detail(discountId) });
      queryClient.invalidateQueries({ queryKey: discountsKeys.lists() });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (discountId: string) => discountsApi.deleteDiscount(discountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountsKeys.lists() });
    },
  });
}

export function useToggleDiscountStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ discountId, isActive }: { discountId: string; isActive: boolean }) =>
      discountsApi.toggleDiscountStatus(discountId, isActive),
    onSuccess: (_, { discountId }) => {
      queryClient.invalidateQueries({ queryKey: discountsKeys.detail(discountId) });
      queryClient.invalidateQueries({ queryKey: discountsKeys.lists() });
    },
  });
}

export function useCreateQuickCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof discountsApi.createQuickCoupon>[0]) =>
      discountsApi.createQuickCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountsKeys.lists() });
    },
  });
}
