import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken } from './api/auth';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device for push notifications
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const pushTokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = pushTokenResponse.data;

    console.log('🔔 Push Token:', token);

    // Set up Android notification channel with custom sound
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'הזמנות חדשות',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00785C',
        sound: 'purchase.wav', // Custom sound for orders
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'התראות כלליות',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00785C',
      });
    }

    // Register push token with backend
    await registerPushToken(token);

    console.log('✅ Push token registered with server');
  } catch (error) {
    console.error('Error getting/registering push token:', error);
  }

  return token;
}

// Handle notification tap
export function setupNotificationResponseListener(
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
}

// Handle incoming notifications while app is foregrounded
export function setupNotificationReceivedListener(
  onNotification: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(onNotification);
}

// Schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: Platform.OS === 'ios' ? 'purchase.wav' : undefined,
    },
    trigger: null, // Immediate
  });
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Clear all notifications
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

