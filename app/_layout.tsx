import 'react-native-gesture-handler';
import React, { useEffect, useState, useLayoutEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator, StyleSheet } from 'react-native';
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

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync().catch(() => {});

// Force RTL for Hebrew - Must be called before any components render
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Ensure RTL is set correctly
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

  // Hide splash when ready
  useEffect(() => {
    if (fontsLoaded && appReady && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, appReady, isLoading]);

  if (!fontsLoaded || !appReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Slot />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
