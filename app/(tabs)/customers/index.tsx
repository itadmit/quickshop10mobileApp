import React, { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteCustomers } from '@/hooks';
import {
  Text,
  EmptyState,
  SearchBar,
  CustomerSkeleton,
  ScreenHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import { avatarColor } from '@/lib/utils/avatar';
import type { Customer } from '@/types';

const { colors, spacing, radii } = designTokens;
// removed monoFont - using fonts.bold for consistency

export default function CustomersListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteCustomers({
    search: debouncedSearch || undefined,
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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleCreatePress = () => {
    router.push('/(tabs)/customers/create');
  };

  const renderCustomer = useCallback(({ item: customer }: { item: Customer }) => (
    <CustomerCard customer={customer} onPress={() => handleCustomerPress(customer)} />
  ), [handleCustomerPress]);

  const showInitialLoading = isLoading && customers.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="לקוחות" onBack={null} />
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="חיפוש לפי שם, אימייל או טלפון..."
        isLoading={isFetching && !!searchQuery}
        actions={
          <TouchableOpacity style={styles.addButton} onPress={handleCreatePress}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand[500]}
            colors={[colors.brand[500]]}

          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          showInitialLoading ? (
            <View>
              {Array.from({ length: 6 }).map((_, i) => (
                <CustomerSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Ionicons name="people-outline" size={48} color={colors.brand[500]} />}
              title="אין לקוחות"
              description={searchQuery ? 'נסה חיפוש אחר' : 'לקוחות שיזמינו יופיעו כאן'}
              actionLabel={searchQuery ? undefined : 'הוסף לקוח'}
              onAction={searchQuery ? undefined : handleCreatePress}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage && customers.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingText}>טוען עוד...</Text>
            </View>
          ) : <View style={{ height: spacing[4] }} />
        }
      />
    </SafeAreaView>
  );
}

function CustomerCard({ customer, onPress }: { customer: Customer; onPress: () => void }) {
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'לקוח ללא שם';

  return (
    <TouchableOpacity onPress={onPress} style={styles.customerCard} activeOpacity={0.7}>
      <View style={styles.customerContent}>
        {/* Avatar — RTL start (physical right) */}
        <View style={[styles.avatar, { backgroundColor: avatarColor(fullName) }]}>
          <Text style={styles.avatarText}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Customer info */}
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{fullName}</Text>
          <Text style={styles.customerEmail} numberOfLines={1}>{customer.email}</Text>
          <Text style={styles.customerMeta}>
            {customer.totalOrders} הזמנות
            {customer.lastOrderAt && ` ${'\u00B7'} ${formatRelativeDate(customer.lastOrderAt)}`}
          </Text>
        </View>

        {/* Spending + credit */}
        <View style={styles.customerRight}>
          <Text style={styles.customerTotalSpent}>{formatCurrency(customer.totalSpent)}</Text>
          {customer.creditBalance > 0 && (
            <View style={styles.creditBadge}>
              <Text style={styles.creditText}>קרדיט {formatCurrency(customer.creditBalance)}</Text>
            </View>
          )}
        </View>

        {/* Chevron — RTL end (physical left) */}
        <Ionicons name="chevron-back" size={16} color={colors.ink[300]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },

  // Add button
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    padding: spacing[4],
  },

  // Customer Card
  customerCard: {
    marginBottom: spacing[2],
    borderRadius: radii.lg,
    backgroundColor: colors.surface.card,
    padding: spacing[4],
  },
  customerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: designTokens.colors.surface.onBrand,
  },
  customerInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.ink[950],
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  customerEmail: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink[500],
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  customerMeta: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink[400],
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  customerRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  customerTotalSpent: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink[950],
  },
  creditBadge: {
    backgroundColor: colors.semantic.success.light,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  creditText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.semantic.success.dark,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Loading
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.ink[400],
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
