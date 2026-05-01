import { api } from './client';

// ============ Notification Settings API ============
// Base: /api/mobile/notifications/settings

export interface NotificationSettings {
  notificationsEnabled: boolean;
  notifyNewOrders: boolean;
  notifyLowStock: boolean;
  notifyReturns: boolean;
  hasPushToken: boolean;
}

export async function getNotificationSettings(): Promise<{
  success: boolean;
  settings: NotificationSettings;
}> {
  return api.get('/mobile/notifications/settings');
}

export async function updateNotificationSettings(
  patch: Partial<Omit<NotificationSettings, 'hasPushToken'>>
): Promise<{ success: boolean; message: string }> {
  return api.patch('/mobile/notifications/settings', patch);
}
