import { api } from './client';
import type { LoginRequest, LoginResponse, User, Store } from '@/types';
import {
  saveAuthToken,
  saveRefreshToken,
  saveUser,
  saveStores,
  saveStoreId,
  saveStoreSlug,
  clearAllAuth,
} from '../utils/storage';

// ============ Auth API ============
// Base: /api/mobile/auth/*

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    '/mobile/auth/login',
    data,
    { skipAuth: true }
  );

  if (response.success && response.token) {
    // Save auth data
    await saveAuthToken(response.token);
    if (response.refreshToken) {
      await saveRefreshToken(response.refreshToken);
    }
    await saveUser(response.user);
    await saveStores(response.stores);

    // Auto-select store if only one
    if (response.stores.length === 1) {
      await saveStoreId(response.stores[0].id);
      await saveStoreSlug(response.stores[0].slug);
    }
  }

  return response;
}

export async function refreshToken(token: string): Promise<{ 
  success: boolean; 
  token: string; 
  refreshToken: string;
  expiresAt: string;
}> {
  const response = await api.post<{ 
    success: boolean; 
    token: string; 
    refreshToken: string;
    expiresAt: string;
  }>(
    '/mobile/auth/refresh',
    { refreshToken: token },
    { skipAuth: true }
  );

  if (response.token) {
    await saveAuthToken(response.token);
    if (response.refreshToken) {
      await saveRefreshToken(response.refreshToken);
    }
  }

  return response;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/mobile/auth/logout');
  } catch {
    // Ignore logout API errors
  } finally {
    await clearAllAuth();
  }
}

export async function selectStore(store: Store): Promise<void> {
  await saveStoreId(store.id);
  await saveStoreSlug(store.slug);
}

// ============ Store API ============
export async function getCurrentStore(): Promise<{ 
  store: Store; 
  user: User;
}> {
  return api.get('/mobile/store');
}

export async function switchStore(storeId: string): Promise<{ 
  success: boolean;
  store: Store;
}> {
  const response = await api.post<{ success: boolean; store: Store }>(
    '/mobile/store/switch',
    { storeId }
  );
  
  if (response.success) {
    await saveStoreId(response.store.id);
    await saveStoreSlug(response.store.slug);
  }
  
  return response;
}

// ============ Push Notifications ============
export async function registerPushToken(pushToken: string): Promise<void> {
  await api.post('/mobile/notifications', { pushToken });
}

export async function unregisterPushToken(): Promise<void> {
  await api.delete('/mobile/notifications');
}
