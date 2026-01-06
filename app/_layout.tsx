import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
} from '@expo-google-fonts/assistant';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores';
import { LoadingScreen } from '@/components/ui';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Force RTL
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Assistant_400Regular,
    Assistant_500Medium,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
  });

  // Initialize auth
  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, [initialize]);

  // Hide splash when ready
  useEffect(() => {
    if (fontsLoaded && appReady && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady, isLoading]);

  // Show loading while fonts load
  if (!fontsLoaded || !appReady || isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingScreen message="טוען..." />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_left', // RTL animation
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

