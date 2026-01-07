import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
  shadows,
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
    <SafeAreaView style={styles.container} edges={[]}>
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
            icon={<Ionicons name="cube-outline" size={48} color={colors.gray400} />}
            title="אין הזמנות"
            description={searchQuery ? 'נסה חיפוש אחר' : 'הזמנות חדשות יופיעו כאן'}
          />
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage && orders.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text color="secondary">טוען עוד...</Text>
            </View>
          ) : <View style={{ height: spacing[4] }} />
        }
      />
    </SafeAreaView>
  );
}

// Order Card Component
function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'confirmed': return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'processing': return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
      case 'shipped': return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' };
      case 'delivered': return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  const statusColors = getStatusColor(order.status);
  const statusLabels: Record<string, string> = {
    pending: 'ממתינה',
    confirmed: 'אושרה',
    processing: 'בטיפול',
    shipped: 'נשלחה',
    delivered: 'הושלם',
    cancelled: 'בוטלה',
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.orderCard, !order.isRead && styles.unreadOrder]}
      activeOpacity={0.7}
    >
      <View style={styles.orderContent}>
        {/* Icon */}
        <View style={styles.orderIcon}>
          <Ionicons name="bag-outline" size={20} color={colors.gray500} />
        </View>

        {/* Content */}
        <View style={styles.orderInfo}>
          <View style={styles.orderTitleRow}>
            <Text style={styles.orderTitle}>
              הזמנה #{order.orderNumber}
            </Text>
            {!order.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.orderSubtitle}>
            {order.customerName} • {formatRelativeDate(order.createdAt)}
          </Text>
        </View>

        {/* Right Side - Amount & Status */}
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>
            {formatCurrency(order.total)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusColors.bg, borderColor: statusColors.border }
          ]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {statusLabels[order.status] || order.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  tabActive: {
    backgroundColor: '#00785C',
    borderColor: '#00785C',
  },
  tabText: {
    color: '#6D7175',
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.white,
    textAlign: 'center',
  },
  tabCount: {
    opacity: 0.8,
  },
  listContent: {
    padding: spacing[4],
  },
  orderCard: {
    marginBottom: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    backgroundColor: colors.white,
    ...shadows.sm,
    padding: spacing[4],
    minHeight: 80,
  },
  unreadOrder: {
    borderLeftWidth: 3,
    borderLeftColor: '#00785C',
  },
  orderContent: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (אייקון מימין, תוכן במרכז, סכום משמאל)
    alignItems: 'center',
    gap: spacing[3],
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    alignItems: 'flex-end', // יישור לימין
  },
  orderTitleRow: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (נקודה מימין, טקסט משמאל)
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00785C',
  },
  orderTitle: {
    fontSize: 14,
    color: '#202223',
    textAlign: 'right',
    fontFamily: fonts.semiBold,
  },
  orderSubtitle: {
    fontSize: 12,
    color: '#6D7175',
    textAlign: 'right',
  },
  orderRight: {
    alignItems: 'flex-start', // ב-RTL עם row, flex-start = שמאל המסך
    gap: spacing[1],
  },
  orderAmount: {
    fontSize: 14,
    color: '#202223',
    textAlign: 'left',
    fontFamily: fonts.bold,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.base,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
});

