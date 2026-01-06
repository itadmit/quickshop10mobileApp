import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteOrders, useMarkOrderAsRead } from '@/hooks';
import {
  Text,
  Card,
  Badge,
  OrderStatusBadge,
  LoadingScreen,
  EmptyState,
  colors,
  spacing,
  fonts,
  borderRadius,
} from '@/components/ui';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import type { Order, OrderStatus } from '@/types';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'pending', label: 'ממתינות' },
  { key: 'processing', label: 'בטיפול' },
  { key: 'shipped', label: 'נשלחו' },
  { key: 'delivered', label: 'נמסרו' },
];

export default function OrdersListScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteOrders({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    search: searchQuery || undefined,
    limit: 20,
  });

  const markAsRead = useMarkOrderAsRead();

  const orders = data?.pages.flatMap((page) => page.orders) || [];
  const stats = data?.pages[0]?.stats;

  const handleOrderPress = useCallback((order: Order) => {
    if (!order.isRead) {
      markAsRead.mutate(order.id);
    }
    router.push(`/(tabs)/orders/${order.id}`);
  }, [router, markAsRead]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderOrder = useCallback(({ item: order }: { item: Order }) => (
    <OrderCard order={order} onPress={() => handleOrderPress(order)} />
  ), [handleOrderPress]);

  if (isLoading) {
    return <LoadingScreen message="טוען הזמנות..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חפש לפי מספר הזמנה, שם או אימייל..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          inverted // RTL
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                selectedStatus === item.key && styles.tabActive,
              ]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text
                weight={selectedStatus === item.key ? 'semiBold' : 'regular'}
                style={[
                  styles.tabText,
                  selectedStatus === item.key && styles.tabTextActive,
                ]}
              >
                {item.label}
                {stats && item.key !== 'all' && stats[item.key as keyof typeof stats] > 0 && (
                  <Text style={styles.tabCount}>
                    {' '}({stats[item.key as keyof typeof stats]})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={{ fontSize: 48 }}>📦</Text>}
            title="אין הזמנות"
            description={searchQuery ? 'נסה חיפוש אחר' : 'הזמנות חדשות יופיעו כאן'}
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

// Order Card Component
function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={[styles.orderCard, !order.isRead && styles.unreadOrder]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          {!order.isRead && <View style={styles.unreadDot} />}
          <Text weight="semiBold" size="lg">
            #{order.orderNumber}
          </Text>
        </View>
        <Text color="muted" size="sm">
          {formatRelativeDate(order.createdAt)}
        </Text>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.customerInfo}>
          <Text numberOfLines={1}>{order.customerName}</Text>
          <Text color="secondary" size="sm">
            {order.items?.length || 0} פריטים
          </Text>
        </View>
        <View style={styles.orderRight}>
          <Text weight="bold" size="lg">
            {formatCurrency(order.total)}
          </Text>
          <OrderStatusBadge status={order.status} />
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabsContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabCount: {
    opacity: 0.8,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  orderCard: {
    marginBottom: spacing[3],
  },
  unreadOrder: {
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  orderHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  orderInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[2],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  orderBody: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  customerInfo: {
    flex: 1,
  },
  orderRight: {
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
});

