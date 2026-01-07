import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteCustomers } from '@/hooks';
import {
  Text,
  Card,
  Badge,
  LoadingScreen,
  EmptyState,
  colors,
  spacing,
  fonts,
  borderRadius,
  shadows,
} from '@/components/ui';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import type { Customer } from '@/types';

export default function CustomersListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteCustomers({
    search: searchQuery || undefined,
    limit: 20,
    sortBy: 'totalSpent',
    sortOrder: 'desc',
  });

  const customers = data?.pages.flatMap((page) => page.customers) || [];

  const handleCustomerPress = useCallback((customer: Customer) => {
    router.push(`/(tabs)/customers/${customer.id}`);
  }, [router]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderCustomer = useCallback(({ item: customer }: { item: Customer }) => (
    <CustomerCard customer={customer} onPress={() => handleCustomerPress(customer)} />
  ), [handleCustomerPress]);

  if (isLoading) {
    return <LoadingScreen message="טוען לקוחות..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חפש לפי שם, אימייל או טלפון..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Customers List */}
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />}
            title="אין לקוחות"
            description={searchQuery ? 'נסה חיפוש אחר' : 'לקוחות שיזמינו יופיעו כאן'}
          />
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage && customers.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text color="secondary">טוען עוד...</Text>
            </View>
          ) : <View style={{ height: spacing[4] }} />
        }
      />
    </SafeAreaView>
  );
}

// Customer Card Component
function CustomerCard({ customer, onPress }: { customer: Customer; onPress: () => void }) {
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'לקוח ללא שם';

  return (
    <Card onPress={onPress} style={styles.customerCard}>
      <View style={styles.customerContent}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={20} color={colors.gray500} />
        </View>

        {/* Info */}
        <View style={styles.customerInfo}>
          <Text weight="semiBold" style={styles.customerName}>{fullName}</Text>
          <Text color="secondary" size="sm" numberOfLines={1} style={styles.customerEmail}>
            {customer.email}
          </Text>
          <View style={styles.customerMeta}>
            <Text color="muted" size="xs" style={styles.metaText}>
              {formatCurrency(customer.totalSpent)} סה"כ
            </Text>
            <Text color="muted" size="xs">•</Text>
            <Text color="muted" size="xs" style={styles.metaText}>
              {customer.totalOrders} הזמנות
            </Text>
          </View>
        </View>

        {/* Right Side */}
        <View style={styles.customerLeft}>
          {customer.creditBalance > 0 && (
            <Badge variant="success" size="sm">
              קרדיט {formatCurrency(customer.creditBalance)}
            </Badge>
          )}
          {customer.lastOrderAt && (
            <Text color="muted" size="xs" style={styles.lastOrderText}>
              {formatRelativeDate(customer.lastOrderAt)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F7',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  listContent: {
    padding: spacing[4],
  },
  customerCard: {
    marginBottom: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    backgroundColor: colors.white,
    ...shadows.sm,
    padding: spacing[3],
  },
  customerContent: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
    alignItems: 'flex-start', // יישור לימין
  },
  customerMeta: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  customerLeft: {
    alignItems: 'flex-start', // ב-RTL עם row, flex-start = שמאל המסך
  },
  customerName: {
    textAlign: 'right',
    fontSize: 14,
    color: '#202223',
  },
  customerEmail: {
    textAlign: 'right',
  },
  metaText: {
    textAlign: 'right',
  },
  lastOrderText: {
    marginTop: spacing[1],
    textAlign: 'left',
  },
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
});

