import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as returnsApi from '@/lib/api/returns';
import type {
  ReturnRequestStatus,
  ReturnRequestType,
  ReturnResolution,
} from '@/lib/api/returns';

export const returnsKeys = {
  all: ['returns'] as const,
  lists: () => [...returnsKeys.all, 'list'] as const,
  list: (params: object) => [...returnsKeys.lists(), params] as const,
  details: () => [...returnsKeys.all, 'detail'] as const,
  detail: (id: string) => [...returnsKeys.details(), id] as const,
  pending: (params: object) => [...returnsKeys.all, 'pending', params] as const,
};

export function useReturnRequests(params: {
  status?: ReturnRequestStatus | 'all';
  type?: ReturnRequestType | 'all';
  search?: string;
} = {}) {
  return useQuery({
    queryKey: returnsKeys.list(params),
    queryFn: () => returnsApi.listReturns(params),
    staleTime: 1000 * 30,
  });
}

export function useReturnRequest(id: string) {
  return useQuery({
    queryKey: returnsKeys.detail(id),
    queryFn: () => returnsApi.getReturn(id),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function useProcessReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      resolution,
      amount,
      customerNotes,
    }: {
      id: string;
      action: 'approve' | 'reject';
      resolution?: ReturnResolution;
      amount?: number;
      customerNotes?: string;
    }) => returnsApi.processReturn(id, { action, resolution, amount, customerNotes }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: returnsKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: returnsKeys.lists() });
      qc.invalidateQueries({ queryKey: [...returnsKeys.all, 'pending'] });
    },
  });
}

export function usePendingInventory(params: {
  status?: 'pending' | 'received' | 'discarded' | 'all';
} = {}) {
  return useQuery({
    queryKey: returnsKeys.pending(params),
    queryFn: () => returnsApi.listPendingInventory(params),
    staleTime: 1000 * 30,
  });
}

export function useActOnPendingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: 'confirm' | 'discard';
      note?: string;
    }) => returnsApi.actOnPendingInventory(id, { action, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...returnsKeys.all, 'pending'] });
    },
  });
}

export function useCreateReturnRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: returnsApi.createReturnRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: returnsKeys.lists() });
    },
  });
}
