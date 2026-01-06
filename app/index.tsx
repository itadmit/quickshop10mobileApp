import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { LoadingScreen } from '@/components/ui';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const currentStore = useAuthStore((s) => s.currentStore);
  const stores = useAuthStore((s) => s.stores);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (!currentStore && stores.length > 1) {
      router.replace('/(auth)/store-select');
    } else {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, currentStore, stores, router]);

  return <LoadingScreen />;
}

