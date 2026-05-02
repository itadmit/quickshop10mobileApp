import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { Text, designTokens, fonts } from '@/components/ui';
import type { Store } from '@/types';

const dt = designTokens;

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
      {store.logoUrl ? (
        <Image source={{ uri: store.logoUrl }} style={styles.storeLogo} />
      ) : (
        <View style={styles.storeLogoPlaceholder}>
          <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeUrl}>{store.slug}.quickshop.co.il</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleText}>{getRoleLabel(store.role)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-back" size={18} color={dt.colors.ink[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'\u05D1\u05D7\u05E8 \u05D7\u05E0\u05D5\u05EA'}</Text>
        <Text style={styles.subtitle}>{'\u05D1\u05D7\u05E8 \u05D0\u05EA \u05D4\u05D7\u05E0\u05D5\u05EA \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05E0\u05D4\u05DC'}</Text>
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
          <Text style={styles.logoutText}>{'\u05D4\u05EA\u05E0\u05EA\u05E7'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getRoleLabel(role: Store['role']): string {
  const labels: Record<Store['role'], string> = {
    owner: '\u05D1\u05E2\u05DC\u05D9\u05DD',
    manager: '\u05DE\u05E0\u05D4\u05DC',
    marketing: '\u05E9\u05D9\u05D5\u05D5\u05E7',
    developer: '\u05DE\u05E4\u05EA\u05D7',
  };
  return labels[role] || role;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  header: {
    padding: dt.spacing[5],
    paddingBottom: dt.spacing[4],
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: dt.colors.ink[400],
    marginTop: dt.spacing[1],
    textAlign: 'right',
  },
  list: {
    paddingHorizontal: dt.spacing[4],
  },
  storeCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    marginBottom: dt.spacing[3],
    padding: dt.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
  },
  storeLogo: {
    width: 52,
    height: 52,
    borderRadius: dt.radii.md,
  },
  storeLogoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  storeInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  storeName: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  storeUrl: {
    fontSize: 13,
    color: dt.colors.ink[400],
    marginTop: 2,
    textAlign: 'right',
  },
  roleContainer: {
    marginTop: dt.spacing[2],
    backgroundColor: dt.colors.ink[100],
    paddingVertical: 2,
    paddingHorizontal: dt.spacing[2],
    borderRadius: dt.radii.full,
  },
  roleText: {
    fontSize: 11,
    color: dt.colors.ink[500],
    fontFamily: fonts.medium,
    textAlign: 'right',
  },
  footer: {
    padding: dt.spacing[6],
    alignItems: 'center',
  },
  logoutButton: {
    padding: dt.spacing[3],
  },
  logoutText: {
    fontSize: 15,
    color: dt.colors.semantic.danger.DEFAULT,
    fontFamily: fonts.medium,
  },
});
