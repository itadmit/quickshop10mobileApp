import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage keys (for sensitive data)
const SECURE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Regular storage keys (for non-sensitive data)
const STORAGE_KEYS = {
  STORE_ID: 'current_store_id',
  STORE_SLUG: 'current_store_slug',
  USER: 'user_data',
  STORES: 'stores_data',
  THEME: 'app_theme',
  ONBOARDED: 'has_onboarded',
} as const;

// ============ Secure Storage (for tokens) ============
export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.AUTH_TOKEN);
}

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
}

export async function clearSecureAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
  ]);
}

// ============ Regular Storage (for app data) ============
export async function saveStoreId(storeId: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.STORE_ID, storeId);
}

export async function getStoreId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.STORE_ID);
}

export async function saveStoreSlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.STORE_SLUG, slug);
}

export async function getStoreSlug(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.STORE_SLUG);
}

export async function saveUser(user: object): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUser<T>(): Promise<T | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function saveStores(stores: object[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
}

export async function getStores<T>(): Promise<T[] | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.STORES);
  if (!data) return null;
  try {
    return JSON.parse(data) as T[];
  } catch {
    return null;
  }
}

export async function setHasOnboarded(value: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, JSON.stringify(value));
}

export async function getHasOnboarded(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED);
  return value === 'true';
}

// ============ Clear All Auth Data ============
export async function clearAllAuth(): Promise<void> {
  await Promise.all([
    clearSecureAuth(),
    AsyncStorage.removeItem(STORAGE_KEYS.STORE_ID),
    AsyncStorage.removeItem(STORAGE_KEYS.STORE_SLUG),
    AsyncStorage.removeItem(STORAGE_KEYS.USER),
    AsyncStorage.removeItem(STORAGE_KEYS.STORES),
  ]);
}

