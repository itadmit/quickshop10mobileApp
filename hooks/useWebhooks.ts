import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as webhooksApi from '@/lib/api/analytics';

// ============ Query Keys ============
export const webhooksKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhooksKeys.all, 'list'] as const,
  list: (params: object) => [...webhooksKeys.lists(), params] as const,
  details: () => [...webhooksKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhooksKeys.details(), id] as const,
};

// ============ Hooks ============
export function useWebhooks(params: Parameters<typeof webhooksApi.getWebhooks>[0] = {}) {
  return useQuery({
    queryKey: webhooksKeys.list(params),
    queryFn: () => webhooksApi.getWebhooks(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInfiniteWebhooks(params: Omit<Parameters<typeof webhooksApi.getWebhooks>[0], 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: [...webhooksKeys.lists(), params],
    queryFn: ({ pageParam = 1 }) => webhooksApi.getWebhooks({ ...params, page: pageParam }),
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

export function useWebhook(webhookId: string) {
  return useQuery({
    queryKey: webhooksKeys.detail(webhookId),
    queryFn: () => webhooksApi.getWebhook(webhookId),
    enabled: !!webhookId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============ Mutations ============
export function useCreateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: webhooksApi.CreateWebhookData) => webhooksApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.lists() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ webhookId, data }: {
      webhookId: string;
      data: Partial<webhooksApi.CreateWebhookData>;
    }) => webhooksApi.updateWebhook(webhookId, data),
    onSuccess: (_, { webhookId }) => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.detail(webhookId) });
      queryClient.invalidateQueries({ queryKey: webhooksKeys.lists() });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (webhookId: string) => webhooksApi.deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.lists() });
    },
  });
}

export function useToggleWebhookStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ webhookId, isActive }: { webhookId: string; isActive: boolean }) =>
      webhooksApi.toggleWebhookStatus(webhookId, isActive),
    onSuccess: (_, { webhookId }) => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.detail(webhookId) });
      queryClient.invalidateQueries({ queryKey: webhooksKeys.lists() });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (webhookId: string) => webhooksApi.testWebhook(webhookId),
  });
}

export function useRegenerateWebhookSecret() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (webhookId: string) => webhooksApi.regenerateWebhookSecret(webhookId),
    onSuccess: (_, webhookId) => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.detail(webhookId) });
    },
  });
}
