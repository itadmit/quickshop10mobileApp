import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores';
import { useAuth } from '@/hooks';
import { Text, Title, Card, colors, spacing, borderRadius } from '@/components/ui';
import type { Store } from '@/types';

export default function StoreSelectScreen() {
  const router = useRouter();
  const { stores, selectStore, logout } = useAuth();

  const handleSelectStore = async (store: Store) => {
    await selectStore(store);
    router.replace('/(tabs)');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const renderStore = ({ item: store }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleSelectStore(store)}
      activeOpacity={0.7}
    >
      <View style={styles.storeContent}>
        {store.logoUrl ? (
          <Image source={{ uri: store.logoUrl }} style={styles.storeLogo} />
        ) : (
          <View style={styles.storeLogoPlaceholder}>
            <Text size="xl" weight="bold" style={{ color: colors.white }}>
              {store.name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.storeInfo}>
          <Text weight="semiBold" size="lg">
            {store.name}
          </Text>
          <Text color="secondary" size="sm">
            {store.slug}.quickshop.co.il
          </Text>
          <View style={styles.roleContainer}>
            <Text size="xs" style={styles.roleText}>
              {getRoleLabel(store.role)}
            </Text>
          </View>
        </View>
        <View style={styles.arrow}>
          <Text color="muted" size="lg">
            ←
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>בחר חנות</Title>
        <Text color="secondary" style={styles.subtitle}>
          בחר את החנות שברצונך לנהל
        </Text>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={renderStore}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text color="error" weight="medium">
            התנתק
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getRoleLabel(role: Store['role']): string {
  const labels: Record<Store['role'], string> = {
    owner: 'בעלים',
    manager: 'מנהל',
    marketing: 'שיווק',
    developer: 'מפתח',
  };
  return labels[role] || role;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing[6],
    paddingBottom: spacing[4],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  list: {
    paddingHorizontal: spacing[4],
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  storeContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing[4],
  },
  storeLogo: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  storeLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  roleContainer: {
    marginTop: spacing[1],
    backgroundColor: colors.gray100,
    paddingVertical: spacing[0.5],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: colors.gray600,
  },
  arrow: {
    paddingLeft: spacing[2],
  },
  footer: {
    padding: spacing[6],
    alignItems: 'center',
  },
  logoutButton: {
    padding: spacing[3],
  },
});

