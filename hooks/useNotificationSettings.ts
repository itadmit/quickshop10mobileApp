import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '@/lib/api/notifications';
import type { NotificationSettings } from '@/lib/api/notifications';

export const notificationSettingsKeys = {
  all: ['notificationSettings'] as const,
  settings: () => [...notificationSettingsKeys.all, 'settings'] as const,
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationSettingsKeys.settings(),
    queryFn: notificationsApi.getNotificationSettings,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<Omit<NotificationSettings, 'hasPushToken'>>) =>
      notificationsApi.updateNotificationSettings(patch),
    onMutate: async (patch) => {
      // Optimistic update so toggles feel instant.
      await queryClient.cancelQueries({ queryKey: notificationSettingsKeys.settings() });
      const previous = queryClient.getQueryData<{ success: boolean; settings: NotificationSettings }>(
        notificationSettingsKeys.settings()
      );
      if (previous) {
        queryClient.setQueryData(notificationSettingsKeys.settings(), {
          ...previous,
          settings: { ...previous.settings, ...patch },
        });
      }
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationSettingsKeys.settings(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationSettingsKeys.settings() });
    },
  });
}
