import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Network
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Notifications badge
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;

  // Refresh triggers
  ordersRefreshKey: number;
  productsRefreshKey: number;
  customersRefreshKey: number;
  triggerOrdersRefresh: () => void;
  triggerProductsRefresh: () => void;
  triggerCustomersRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  // Network
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),

  // Loading
  globalLoading: false,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),

  // Notifications
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  incrementNotifications: () => set((state) => ({ 
    unreadNotifications: state.unreadNotifications + 1 
  })),
  clearNotifications: () => set({ unreadNotifications: 0 }),

  // Refresh triggers
  ordersRefreshKey: 0,
  productsRefreshKey: 0,
  customersRefreshKey: 0,
  triggerOrdersRefresh: () => set((state) => ({ 
    ordersRefreshKey: state.ordersRefreshKey + 1 
  })),
  triggerProductsRefresh: () => set((state) => ({ 
    productsRefreshKey: state.productsRefreshKey + 1 
  })),
  triggerCustomersRefresh: () => set((state) => ({ 
    customersRefreshKey: state.customersRefreshKey + 1 
  })),
}));

