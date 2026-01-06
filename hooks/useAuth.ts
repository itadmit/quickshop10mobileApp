import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores';
import * as authApi from '@/lib/api/auth';
import type { Store } from '@/types';

// ============ Hook ============
export function useAuth() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    stores, 
    currentStore,
    initialize,
    setUser,
    setStores,
    selectStore: selectStoreInStore,
    logout: logoutFromStore,
  } = useAuthStore();

  const [loginError, setLoginError] = useState<string | null>(null);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; pushToken?: string }) => {
      const deviceId = Device.deviceName || 'unknown-device';
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      
      return authApi.login({
        email: credentials.email,
        password: credentials.password,
        deviceId,
        pushToken: credentials.pushToken,
        platform: Platform.OS as 'ios' | 'android',
        appVersion,
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        setUser(response.user);
        setStores(response.stores);
        setLoginError(null);
      } else {
        setLoginError('שגיאה בהתחברות');
      }
    },
    onError: (error: Error) => {
      setLoginError(error.message || 'שגיאה בהתחברות');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logoutFromStore();
    },
  });

  // Select store
  const selectStore = useCallback(async (store: Store) => {
    await authApi.selectStore(store);
    selectStoreInStore(store);
  }, [selectStoreInStore]);

  // Login function
  const login = useCallback(
    (email: string, password: string, pushToken?: string) => {
      setLoginError(null);
      return loginMutation.mutateAsync({ email, password, pushToken });
    },
    [loginMutation]
  );

  // Logout function
  const logout = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    stores,
    currentStore,
    loginError,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Actions
    initialize,
    login,
    logout,
    selectStore,
    clearError: () => setLoginError(null),
  };
}

