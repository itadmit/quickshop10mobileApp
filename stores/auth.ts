import { create } from 'zustand';
import type { User, Store } from '@/types';
import {
  getAuthToken,
  getUser,
  getStores,
  getStoreId,
  getStoreSlug,
  clearAllAuth,
  saveStoreId,
  saveStoreSlug,
} from '@/lib/utils/storage';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  stores: Store[];
  currentStore: Store | null;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  setStores: (stores: Store[]) => void;
  selectStore: (store: Store) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  stores: [],
  currentStore: null,

  // Initialize auth state from storage
  initialize: async () => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      const [user, stores, storeId] = await Promise.all([
        getUser<User>(),
        getStores<Store>(),
        getStoreId(),
      ]);

      if (!user || !stores) {
        await clearAllAuth();
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      // Find current store
      const currentStore = storeId 
        ? stores.find(s => s.id === storeId) || stores[0]
        : stores[0];

      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        stores,
        currentStore,
      });
    } catch {
      await clearAllAuth();
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  setStores: (stores) => {
    const { currentStore } = get();
    
    // Update current store if it still exists
    const updatedCurrentStore = currentStore 
      ? stores.find(s => s.id === currentStore.id) 
      : stores[0];

    set({ 
      stores, 
      currentStore: updatedCurrentStore || stores[0] || null 
    });
  },

  selectStore: async (store) => {
    await Promise.all([
      saveStoreId(store.id),
      saveStoreSlug(store.slug),
    ]);
    set({ currentStore: store });
  },

  logout: async () => {
    await clearAllAuth();
    set({
      isAuthenticated: false,
      user: null,
      stores: [],
      currentStore: null,
    });
  },
}));

