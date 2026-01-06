import React, { useState, useCallback } from 'react';
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
            icon={<Text style={{ fontSize: 48 }}>👥</Text>}
            title="אין לקוחות"
            description={searchQuery ? 'נסה חיפוש אחר' : 'לקוחות שיזמינו יופיעו כאן'}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <Text color="secondary">טוען עוד...</Text>
            </View>
          ) : null
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
          <Text style={{ fontSize: 20 }}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.customerInfo}>
          <Text weight="semiBold">{fullName}</Text>
          <Text color="secondary" size="sm" numberOfLines={1}>
            {customer.email}
          </Text>
          <View style={styles.customerMeta}>
            <Text color="muted" size="xs">
              {customer.totalOrders} הזמנות
            </Text>
            <Text color="muted" size="xs">•</Text>
            <Text color="muted" size="xs">
              {formatCurrency(customer.totalSpent)} סה"כ
            </Text>
          </View>
        </View>

        {/* Right Side */}
        <View style={styles.customerRight}>
          {customer.creditBalance > 0 && (
            <Badge variant="success" size="sm">
              קרדיט {formatCurrency(customer.creditBalance)}
            </Badge>
          )}
          {customer.lastOrderAt && (
            <Text color="muted" size="xs" style={{ marginTop: spacing[1] }}>
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
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  customerCard: {
    marginBottom: spacing[3],
  },
  customerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  customerMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  customerRight: {
    alignItems: 'flex-start',
  },
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
});

