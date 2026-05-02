import 'react-native-gesture-handler';
import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator, StyleSheet, Animated, Image as RNImage, Text as RNText, Pressable } from 'react-native';
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

type OtaPhase = 'idle' | 'checking' | 'available' | 'downloading' | 'installing';

function UpdatePromptModal({
  onUpdate,
  onLater,
}: {
  onUpdate: () => void;
  onLater: () => void;
}) {
  return (
    <View style={otaStyles.modalBackdrop}>
      <View style={otaStyles.modalCard}>
        <View style={otaStyles.modalIconWrap}>
          <RNText style={otaStyles.modalIcon}>⬇️</RNText>
        </View>
        <RNText style={otaStyles.modalTitle}>עדכון חדש זמין</RNText>
        <RNText style={otaStyles.modalBody}>
          יצא עדכון חדש לאפליקציה עם שיפורים ותיקונים. רוצה להתקין עכשיו?
        </RNText>
        <Pressable style={otaStyles.modalPrimaryBtn} onPress={onUpdate}>
          <RNText style={otaStyles.modalPrimaryBtnText}>עדכן כעת</RNText>
        </Pressable>
        <Pressable style={otaStyles.modalSecondaryBtn} onPress={onLater}>
          <RNText style={otaStyles.modalSecondaryBtnText}>לא עכשיו</RNText>
        </Pressable>
      </View>
    </View>
  );
}

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

function PulsingDots() {
  const dot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [dot]);
  return (
    <Animated.View style={{ opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }}>
      <ActivityIndicator size="large" color="#008060" />
    </Animated.View>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [otaPhase, setOtaPhase] = useState<OtaPhase>(__DEV__ ? 'idle' : 'checking');
  const splashOpacity = useRef(new Animated.Value(1)).current;
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

  // OTA (EAS Update): check silently, then prompt the user with a modal
  // before downloading/installing. Avoids the flickering auto-apply on launch.
  useEffect(() => {
    if (__DEV__) return;
    let cancelled = false;

    const safety = setTimeout(() => {
      if (!cancelled) setOtaPhase('idle');
    }, 8000);

    (async () => {
      try {
        if (!Updates.isEnabled) {
          if (!cancelled) setOtaPhase('idle');
          return;
        }
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (cancelled) return;
        setOtaPhase(isAvailable ? 'available' : 'idle');
      } catch {
        if (!cancelled) setOtaPhase('idle');
      } finally {
        clearTimeout(safety);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []);

  const handleApplyUpdate = async () => {
    try {
      setOtaPhase('downloading');
      await Updates.fetchUpdateAsync();
      setOtaPhase('installing');
      await Updates.reloadAsync();
    } catch {
      setOtaPhase('idle');
    }
  };

  const handleDismissUpdate = () => {
    setOtaPhase('idle');
  };

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

  // Fade out the CUSTOM splash only when everything is ready AND OTA is idle.
  useEffect(() => {
    if (fontsLoaded && appReady && !isLoading && otaPhase === 'idle') {
      const timeout = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setSplashDone(true));
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded, appReady, isLoading, otaPhase, splashOpacity]);

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
        {(otaPhase === 'downloading' || otaPhase === 'installing') && (
          <View style={otaStyles.updateBox}>
            <ActivityIndicator size="small" color="#008060" />
            <RNText style={otaStyles.updateTitle}>
              {otaPhase === 'downloading' && 'מוריד עדכונים...'}
              {otaPhase === 'installing' && 'מתקין, רגע...'}
            </RNText>
            {otaPhase === 'downloading' && <AnimatedProgressBar />}
          </View>
        )}
        {otaPhase === 'available' && (
          <UpdatePromptModal onUpdate={handleApplyUpdate} onLater={handleDismissUpdate} />
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
            {(otaPhase === 'downloading' || otaPhase === 'installing') && (
              <View style={otaStyles.updateBox}>
                <ActivityIndicator size="small" color="#008060" />
                <RNText style={otaStyles.updateTitle}>
                  {otaPhase === 'downloading' && 'מוריד עדכונים...'}
                  {otaPhase === 'installing' && 'מתקין, רגע...'}
                </RNText>
                {otaPhase === 'downloading' && <AnimatedProgressBar />}
              </View>
            )}
          </Animated.View>
        )}
        {otaPhase === 'available' && (
          <UpdatePromptModal onUpdate={handleApplyUpdate} onLater={handleDismissUpdate} />
        )}
        {(otaPhase === 'downloading' || otaPhase === 'installing') && splashDone && (
          <View style={otaStyles.applyOverlay}>
            <View style={otaStyles.updateBox}>
              <ActivityIndicator size="small" color="#008060" />
              <RNText style={otaStyles.updateTitle}>
                {otaPhase === 'downloading' && 'מוריד עדכונים...'}
                {otaPhase === 'installing' && 'מתקין, רגע...'}
              </RNText>
              {otaPhase === 'downloading' && <AnimatedProgressBar />}
            </View>
          </View>
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
  applyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 30,
  },
  modalTitle: {
    fontFamily: 'Assistant_700Bold',
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  modalBody: {
    fontFamily: 'Assistant_400Regular',
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
    writingDirection: 'rtl',
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#008060',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPrimaryBtnText: {
    fontFamily: 'Assistant_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontFamily: 'Assistant_500Medium',
    fontSize: 15,
    color: '#64748B',
    writingDirection: 'rtl',
  },
});
