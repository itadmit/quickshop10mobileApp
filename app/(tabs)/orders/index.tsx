import React, { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteOrders, useMarkOrderAsRead } from '@/hooks';
import {
  Text,
  EmptyState,
  SearchBar,
  FilterTabs,
  OrderSkeleton,
  ScreenHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatDateTimeShort } from '@/lib/utils/format';
import type { Order, OrderStatus, OrdersListResponse, OrdersStats } from '@/types';

type OrdersTabKey = 'all' | 'pendingPayment' | 'awaitingShipment' | 'paid';

const STATUS_TABS: { key: OrdersTabKey; label: string }[] = [
  { key: 'paid', label: 'שולמו' },
  { key: 'pendingPayment', label: 'ממתינות לתשלום' },
  { key: 'awaitingShipment', label: 'ממתינות למשלוח' },
  { key: 'all', label: 'הכל' },
];

const { colors, spacing, radii } = designTokens;
const monoFont = designTokens.typography.fontFamily.mono;

function tabFromRouteParam(raw: string | string[] | undefined): OrdersTabKey {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return 'paid';
  if (s === 'all' || s === 'paid' || s === 'pendingPayment' || s === 'awaitingShipment') {
    return s;
  }
  // Legacy deep-links from older builds / dashboard alerts
  if (s === 'pending') return 'pendingPayment';
  if (s === 'confirmed' || s === 'processing') return 'awaitingShipment';
  return 'paid';
}

function tabCountFor(stats: OrdersStats | undefined, key: OrdersTabKey): number | undefined {
  if (!stats || key === 'all') return undefined;
  if (key === 'pendingPayment') return stats.pendingPayment;
  if (key === 'awaitingShipment') return stats.awaitingShipment;
  if (key === 'paid') return stats.paidShipped ?? stats.paid;
  return undefined;
}

// Financial status badge config
const FINANCIAL_LABELS: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולמה',
  partially_paid: 'שולם חלקית',
  refunded: 'זוכה',
  partially_refunded: 'זיכוי חלקי',
};

function getFinancialBadgeColors(financialStatus: string) {
  switch (financialStatus) {
    case 'paid':
      return { bg: colors.semantic.success.light, text: colors.semantic.success.dark };
    case 'pending':
      return { bg: colors.semantic.warning.light, text: colors.semantic.warning.dark };
    case 'refunded':
    case 'partially_refunded':
      return { bg: colors.ink[100], text: colors.ink[600] };
    default:
      return { bg: colors.ink[100], text: colors.ink[600] };
  }
}

export default function OrdersListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string | string[]; customerId?: string }>();
  const [selectedStatus, setSelectedStatus] = useState<OrdersTabKey>(() =>
    tabFromRouteParam(params.status)
  );
  const customerId = typeof params.customerId === 'string' ? params.customerId : undefined;

  useEffect(() => {
    const raw = params.status;
    if (raw === undefined || raw === '') return;
    setSelectedStatus(tabFromRouteParam(raw));
  }, [params.status]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filterParams = (() => {
    switch (selectedStatus) {
      case 'pendingPayment':
        return { financialStatus: 'pending' as const };
      case 'awaitingShipment':
        return { financialStatus: 'paid' as const, fulfillmentStatus: 'unfulfilled' as const };
      case 'paid':
        return { financialStatus: 'paid' as const, fulfillmentStatus: 'fulfilled' as const };
      default:
        return {};
    }
  })();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteOrders({
    ...filterParams,
    search: debouncedSearch || undefined,
    customerId,
    limit: 20,
  });

  const markAsRead = useMarkOrderAsRead();

  const orders =
    data?.pages.flatMap((page: OrdersListResponse) => page.orders) ?? [];
  const stats = (data?.pages[0] as OrdersListResponse | undefined)?.stats;

  const filterTabs = STATUS_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: tabCountFor(stats, tab.key),
  }));

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

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
    <OrderCard order={order} onPress={() => handleOrderPress(order)} activeTab={selectedStatus} />
  ), [handleOrderPress, selectedStatus]);

  const showInitialLoading = isLoading && orders.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="הזמנות" onBack={null} />
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="חיפוש הזמנה..."
        isLoading={isFetching && !!searchQuery}
      />

      <FilterTabs
        tabs={filterTabs}
        activeTab={selectedStatus}
        onTabPress={(key) => setSelectedStatus(key as OrdersTabKey)}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
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
                <OrderSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={48} color={colors.brand[500]} />}
              title="אין הזמנות"
              description={searchQuery ? 'נסה חיפוש אחר' : 'הזמנות חדשות יופיעו כאן'}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage && orders.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingText}>טוען עוד...</Text>
            </View>
          ) : <View style={{ height: spacing[4] }} />
        }
      />
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress, activeTab }: { order: Order; onPress: () => void; activeTab: OrdersTabKey }) {
  const financialColors = getFinancialBadgeColors(order.financialStatus);
  const financialLabel = FINANCIAL_LABELS[order.financialStatus] || order.financialStatus;
  const orderNum = order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`;
  const statusColors = designTokens.colors.orderStatus[order.status as OrderStatus] || { bg: colors.ink[100], text: colors.ink[600] };
  const statusLabel = order.status === 'pending' ? 'ממתינה' : order.status === 'confirmed' ? 'אושרה' : order.status === 'processing' ? 'בטיפול' : order.status === 'shipped' ? 'נשלחה' : order.status === 'delivered' ? 'נמסרה' : order.status === 'cancelled' ? 'בוטלה' : 'זוכתה';

  const showFinancialBadge = activeTab === 'all' || activeTab === 'awaitingShipment';
  const showStatusBadge = true;
  const isPOS = order.utmSource === 'pos';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.orderCard}
      activeOpacity={0.7}
    >
      <View style={styles.orderTopRow}>
        <View style={styles.orderTitleRow}>
          <Text style={styles.orderTitle}>{orderNum}</Text>
          {!order.isRead && <View style={styles.unreadDot} />}
          {isPOS && (
            <View style={styles.posBadge}>
              <Text style={styles.posBadgeText}>קופה</Text>
            </View>
          )}
        </View>
        <View style={styles.orderAmountWrap}>
          <Text style={styles.orderAmount}>{formatCurrency(order.total)}</Text>
          <Ionicons name="chevron-back" size={14} color={colors.ink[300]} />
        </View>
      </View>

      <View style={styles.orderBottomRow}>
        <Text style={styles.orderSubtitle}>
          {order.customerName} {'\u00B7'} {formatDateTimeShort(order.createdAt)}
        </Text>
        <View style={styles.badgesRow}>
          {showFinancialBadge && (
            <View style={[styles.miniBadge, { backgroundColor: financialColors.bg }]}>
              <Text style={[styles.miniBadgeText, { color: financialColors.text }]}>
                {financialLabel}
              </Text>
            </View>
          )}
          {showStatusBadge && (
            <View style={[styles.miniBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.miniBadgeText, { color: statusColors.text }]}>
                {statusLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  listContent: {
    padding: spacing[4],
  },

  // Order Card
  orderCard: {
    marginBottom: spacing[2],
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand[500],
  },
  orderTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.ink[950],
    writingDirection: 'rtl',
  },
  orderAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.ink[950],
  },
  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink[400],
    writingDirection: 'rtl',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  miniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  miniBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },
  posBadge: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  posBadgeText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.brand[600],
    writingDirection: 'rtl',
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
