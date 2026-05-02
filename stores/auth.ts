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
  saveStores,
} from '@/lib/utils/storage';
import { getCurrentStore as fetchCurrentStore } from '@/lib/api/auth';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  stores: Store[];
  currentStore: Store | null;
  activePlugins: string[];

  // Actions
  initialize: () => Promise<void>;
  refreshCurrentStore: () => Promise<void>;
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
  activePlugins: [],

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

      // Fetch active plugins from the API right after auth init
      get().refreshCurrentStore();
    } catch {
      await clearAllAuth();
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  // Refresh store data from the API (to pick up name changes, plugin status, etc.)
  refreshCurrentStore: async () => {
    try {
      const response = await fetchCurrentStore();
      console.log('[AUTH] refreshCurrentStore response keys:', Object.keys(response || {}));
      console.log('[AUTH] activePlugins from API:', JSON.stringify(response?.activePlugins));
      if (response?.store) {
        const { stores } = get();
        const updatedStores = stores.map((s) =>
          s.id === response.store.id ? { ...s, ...response.store } : s
        );
        await saveStores(updatedStores);
        set({
          currentStore: { ...get().currentStore, ...response.store } as Store,
          stores: updatedStores,
          activePlugins: response.activePlugins ?? get().activePlugins,
        });
        console.log('[AUTH] activePlugins set to:', JSON.stringify(response.activePlugins ?? get().activePlugins));
      }
    } catch (err) {
      console.log('[AUTH] Failed to refresh store data:', err);
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
      activePlugins: [],
    });
  },
}));

