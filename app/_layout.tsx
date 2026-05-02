import 'react-native-gesture-handler';
import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator, StyleSheet, Animated, Image as RNImage, Text as RNText } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
} from '@expo-google-fonts/assistant';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { 
  registerForPushNotifications, 
  setupNotificationResponseListener,
  setupNotificationReceivedListener 
} from '@/lib/notifications';
import { ToastContainer } from '@/components/ui/Toast';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync().catch(() => {});

// Force RTL for Hebrew - Must be called before any components render
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  // Note: In Expo Go, RTL might not work perfectly
  // Production builds (iOS/Android) will have RTL forced via native config
}

// Create React Query client - תיקון בעיית pull-to-refresh
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'always',
    },
    mutations: {
      retry: 1,
      networkMode: 'always',
    },
  },
});

function AnimatedProgressBar() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
    ).start();
  }, [anim]);
  return (
    <View style={otaStyles.progressTrack}>
      <Animated.View
        style={[
          otaStyles.progressFill,
          { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['8%', '92%'] }) },
        ]}
      />
    </View>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const updates = Updates.useUpdates();
  const otaActive = updates.isDownloading || updates.isUpdatePending;
  const otaLabel = updates.isUpdatePending
    ? 'מתקין עדכון...'
    : updates.isDownloading
      ? 'מוריד עדכון...'
      : '';
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Ensure RTL is set before render
  useLayoutEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  }, []);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Assistant_400Regular,
    Assistant_500Medium,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
    Pacifico_400Regular,
  });

  // While the splash is still up, if a downloaded update is staged, apply
  // it now so the user sees one clean splash → update install → app, with
  // no mid-session reload. After splash is gone we leave the staged update
  // alone (it will apply on the next cold start).
  useEffect(() => {
    if (__DEV__ || splashDone) return;
    if (!updates.isUpdatePending) return;
    Updates.reloadAsync().catch(() => {});
  }, [updates.isUpdatePending, splashDone]);

  // Initialize auth
  useEffect(() => {
    const prepare = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setAppReady(true);
      }
    };
    prepare();
  }, [initialize]);

  // Setup push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated || !appReady) return;

    // Register for push notifications
    registerForPushNotifications();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = setupNotificationReceivedListener((notification: Notifications.Notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for notification taps
    responseListener.current = setupNotificationResponseListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data?.type === 'new_order' && data?.orderId) {
        router.push(`/(tabs)/orders/${data.orderId}`);
      } else if (data?.type === 'low_stock' && data?.productId) {
        router.push(`/(tabs)/products/${data.productId}`);
      } else if (data?.type === 'new_customer' && data?.customerId) {
        router.push(`/(tabs)/customers/${data.customerId}`);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, appReady, router]);

  // Hide native splash ASAP — our white custom view is already rendered underneath.
  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 50);
    return () => clearTimeout(timer);
  }, []);

  // Fade out the CUSTOM splash only when everything is ready AND no OTA is
  // mid-flight. If an update is downloading, the splash holds with a label.
  useEffect(() => {
    if (fontsLoaded && appReady && !isLoading && !otaActive) {
      const timeout = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setSplashDone(true));
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded, appReady, isLoading, otaActive, splashOpacity]);

  // While fonts/auth are loading, show only the custom splash (no app content).
  if (!fontsLoaded || !appReady) {
    return (
      <View style={[StyleSheet.absoluteFill, otaStyles.splashContainer]}>
        <StatusBar style="dark" />
        <RNImage
          source={require('../assets/icon.png')}
          style={otaStyles.logo}
          resizeMode="contain"
        />
        {otaActive && (
          <View style={otaStyles.updateBox}>
            <ActivityIndicator size="small" color="#008060" />
            <RNText style={otaStyles.updateTitle}>{otaLabel}</RNText>
            {updates.isDownloading && <AnimatedProgressBar />}
          </View>
        )}
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Slot />
        <ToastContainer />
        {!splashDone && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              otaStyles.splashContainer,
              { opacity: splashOpacity },
            ]}
          >
            <RNImage
              source={require('../assets/icon.png')}
              style={otaStyles.logo}
              resizeMode="contain"
            />
            {otaActive && (
              <View style={otaStyles.updateBox}>
                <ActivityIndicator size="small" color="#008060" />
                <RNText style={otaStyles.updateTitle}>{otaLabel}</RNText>
                {updates.isDownloading && <AnimatedProgressBar />}
              </View>
            )}
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const otaStyles = StyleSheet.create({
  splashContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  updateBox: {
    position: 'absolute',
    bottom: 140,
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  updateTitle: {
    fontFamily: 'Assistant_400Regular',
    fontSize: 15,
    color: '#71717A',
    textAlign: 'center',
  },
  updateSubtitle: {
    fontFamily: 'Assistant_400Regular',
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
  progressTrack: {
    width: 220,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E4E4E7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#008060',
  },
});
