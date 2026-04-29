import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Image } from 'expo-image';
import { useDashboardSummary, useFullAnalytics, useOrdersStats, useProducts, useCustomers } from '@/hooks';
import { useAuthStore, useAppStore } from '@/stores';
import {
  Text,
  SectionHeader,
  StatCard,
  DashboardSkeleton,
  fonts,
  designTokens,
} from '@/components/ui';
import { formatCurrency, formatDateTimeShort } from '@/lib/utils/format';
import type { OrderStatus } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PeriodKey = 'today' | 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'השבוע' },
  { key: 'month', label: 'החודש' },
  { key: 'year', label: 'השנה' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');


const dt = designTokens;

export default function DashboardScreen() {
  const router = useRouter();
  const currentStore = useAuthStore((s) => s.currentStore);
  const refreshCurrentStore = useAuthStore((s) => s.refreshCurrentStore);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshCurrentStore();
  }, [refreshCurrentStore]);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('today');

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary(selectedPeriod);

  const {
    data: analytics,
    refetch: refetchAnalytics,
  } = useFullAnalytics({ period: selectedPeriod });

  const { data: ordersStats, refetch: refetchOrdersStats } = useOrdersStats();
  const { data: productsData, refetch: refetchProducts } = useProducts({ limit: 1 });
  const { data: customersData, refetch: refetchCustomers } = useCustomers({ limit: 1 });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchSummary(),
        refetchAnalytics(),
        refetchOrdersStats(),
        refetchProducts(),
        refetchCustomers(),
        refreshCurrentStore(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchSummary, refetchAnalytics, refetchOrdersStats, refetchProducts, refetchCustomers, refreshCurrentStore]);

  const handlePeriodSelect = useCallback((period: PeriodKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPeriod(period);
  }, []);

  const showSkeleton = summaryLoading && !summary && !summaryError;

  const analyticsData = analytics?.summary;

  const pendingCount = summary?.orders?.pending || 0;
  const lowStockCount = summary?.products?.lowStock || 0;

  const statsTodayRevenue = ordersStats?.today?.revenue;
  const apiRevenue = analyticsData?.revenue ?? summary?.revenue?.total ?? 0;

  const totalRevenue =
    selectedPeriod === 'today' &&
    typeof statsTodayRevenue === 'number' &&
    statsTodayRevenue > 0
      ? statsTodayRevenue
      : apiRevenue;
  const revenueChange = analyticsData?.revenueChange ?? summary?.revenue?.change;

  const totalOrdersFromStats = (ordersStats?.today?.orders ?? 0) + (ordersStats?.pending ?? 0) + (ordersStats?.processing ?? 0);
  const ordersCount =
    summary?.orders?.total ??
    summary?.revenue?.orders ??
    analyticsData?.orders ??
    totalOrdersFromStats ??
    0;
  const productsCount = productsData?.stats?.active ?? summary?.products?.active ?? 0;
  const customersCount = customersData?.stats?.total ?? summary?.customers?.total ?? 0;
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  const todayFormatted = format(new Date(), "EEEE, d MMMM yyyy", { locale: he });

  const outOfStockCount = summary?.products?.outOfStock || 0;
  const waitingForShipmentCount = summary?.waitingForShipment || 0;
  const hasAlerts = pendingCount > 0 || lowStockCount > 0 || outOfStockCount > 0 || waitingForShipmentCount > 0;
  const topProducts = summary?.topProducts || [];
  const revenueChart = summary?.revenueChart || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={dt.colors.brand[500]}
            colors={[dt.colors.brand[500]]}

          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.storeName}>{currentStore?.name || 'החנות שלי'}</Text>
            <Text style={styles.dateText}>{todayFormatted}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/more')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={dt.colors.ink[600]} />
          </TouchableOpacity>
        </View>

        {showSkeleton ? (
          <DashboardSkeleton />
        ) : (
        <>
        {/* Revenue Hero */}
        <View style={styles.revenueHero}>
          <Text style={styles.revenueValue}>
            {formatCurrency(totalRevenue)}
          </Text>
          <View style={styles.revenueLabelRow}>
            <Text style={styles.revenueLabel}>הכנסות {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}</Text>
            {revenueChange !== undefined && (
              <View
                style={[
                  styles.trendContainer,
                  {
                    backgroundColor: revenueChange >= 0
                      ? dt.colors.semantic.success.light
                      : dt.colors.semantic.danger.light,
                  },
                ]}
              >
                <Ionicons
                  name={revenueChange >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={revenueChange >= 0 ? dt.colors.semantic.success.DEFAULT : dt.colors.semantic.danger.DEFAULT}
                />
                <Text
                  style={[
                    styles.trendText,
                    {
                      color: revenueChange >= 0
                        ? dt.colors.semantic.success.DEFAULT
                        : dt.colors.semantic.danger.DEFAULT,
                    },
                  ]}
                >
                  {Math.abs(revenueChange)}%
                </Text>
              </View>
            )}
          </View>

          {/* Period Pills */}
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((option) => {
              const isActive = selectedPeriod === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.periodPill,
                    isActive ? styles.periodPillActive : styles.periodPillInactive,
                  ]}
                  onPress={() => handlePeriodSelect(option.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      isActive ? styles.periodPillTextActive : styles.periodPillTextInactive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
          style={styles.statsScrollView}
        >
          <StatCard
            label="הזמנות"
            value={String(ordersCount)}
            icon={<Ionicons name="cart-outline" size={18} color={dt.colors.brand[500]} />}
            accentColor={dt.colors.brand[500]}
            onPress={() => router.push('/(tabs)/orders')}
          />
          <StatCard
            label="ממוצע להזמנה"
            value={formatCurrency(avgOrderValue)}
            icon={<Ionicons name="analytics-outline" size={18} color={dt.colors.accent[500]} />}
            accentColor={dt.colors.accent[500]}
          />
          <StatCard
            label="מוצרים פעילים"
            value={String(productsCount)}
            icon={<Ionicons name="cube-outline" size={18} color={dt.colors.semantic.success.DEFAULT} />}
            accentColor={dt.colors.semantic.success.DEFAULT}
            onPress={() => router.push('/(tabs)/products')}
          />
          <StatCard
            label="לקוחות"
            value={String(customersCount)}
            icon={<Ionicons name="people-outline" size={18} color={dt.colors.semantic.info.DEFAULT} />}
            accentColor={dt.colors.semantic.info.DEFAULT}
            onPress={() => router.push('/(tabs)/customers')}
          />
          {pendingCount > 0 && (
            <StatCard
              label="ממתינות לתשלום"
              value={String(pendingCount)}
              icon={<Ionicons name="time-outline" size={18} color={dt.colors.semantic.warning.DEFAULT} />}
              accentColor={dt.colors.semantic.warning.DEFAULT}
              onPress={() => router.push('/(tabs)/orders?status=pendingPayment')}
            />
          )}
          {lowStockCount > 0 && (
            <StatCard
              label="מלאי נמוך"
              value={String(lowStockCount)}
              icon={<Ionicons name="alert-circle-outline" size={18} color={dt.colors.semantic.danger.DEFAULT} />}
              accentColor={dt.colors.semantic.danger.DEFAULT}
              onPress={() => router.push('/(tabs)/products')}
            />
          )}
        </ScrollView>

        {/* Sales Chart */}
        {revenueChart.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="מכירות - החודש" />
            <SalesChart data={revenueChart} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="פעולות מהירות" />
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="add-circle-outline"
              label="הוסף מוצר"
              onPress={() => router.push('/(tabs)/products/create')}
              color={dt.colors.brand[500]}
              primary
            />
            <QuickAction
              icon="receipt-outline"
              label="הזמנה חדשה"
              onPress={() => router.push('/(tabs)/orders')}
              color={dt.colors.brand[400]}
            />
            <QuickAction
              icon="person-add-outline"
              label="הוסף לקוח"
              onPress={() => router.push('/(tabs)/customers/create')}
              color={dt.colors.brand[300]}
            />
            <QuickAction
              icon="ellipsis-horizontal-outline"
              label="כל הפעולות"
              onPress={() => router.push('/(tabs)/more')}
              color={dt.colors.ink[600]}
            />
          </View>
        </View>

        {/* Needs Attention */}
        {hasAlerts && (
          <View style={styles.section}>
            <SectionHeader title="דורש תשומת לב" />
            <View style={styles.alertsContainer}>
              {pendingCount > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push('/(tabs)/orders?status=pendingPayment')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertDot, { backgroundColor: dt.colors.semantic.warning.DEFAULT }]} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertLabel}>ממתינות לתשלום</Text>
                    <Text style={styles.alertCount}>{pendingCount}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={dt.colors.ink[300]} />
                </TouchableOpacity>
              )}
              {waitingForShipmentCount > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push('/(tabs)/orders?status=awaitingShipment')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertDot, { backgroundColor: dt.colors.semantic.info.DEFAULT }]} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertLabel}>ממתינות למשלוח</Text>
                    <Text style={styles.alertCount}>{waitingForShipmentCount}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={dt.colors.ink[300]} />
                </TouchableOpacity>
              )}
              {outOfStockCount > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push('/(tabs)/products')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertDot, { backgroundColor: dt.colors.semantic.danger.DEFAULT }]} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertLabel}>מוצרים שאזלו</Text>
                    <Text style={styles.alertCount}>{outOfStockCount}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={dt.colors.ink[300]} />
                </TouchableOpacity>
              )}
              {lowStockCount > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push('/(tabs)/products')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertDot, { backgroundColor: dt.colors.semantic.warning.DEFAULT }]} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertLabel}>מוצרים במלאי נמוך</Text>
                    <Text style={styles.alertCount}>{lowStockCount}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color={dt.colors.ink[300]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="מוצרים מובילים"
              onShowAll={() => router.push('/(tabs)/products')}
            />
            <View style={styles.topProductsCard}>
              {topProducts.slice(0, 5).map((product, index) => (
                <TopProductRow
                  key={product.id || index}
                  product={product}
                  rank={index + 1}
                  isLast={index === Math.min(topProducts.length - 1, 4)}
                  onPress={() => product.id ? router.push(`/(tabs)/products/${product.id}`) : undefined}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <SectionHeader
            title="הזמנות אחרונות"
            onShowAll={() => router.push('/(tabs)/orders')}
          />
          {summary?.recentOrders && summary.recentOrders.length > 0 ? (
            <View style={styles.ordersCard}>
              {summary.recentOrders.slice(0, 5).map((order, index) => (
                <RecentOrderRow
                  key={order.id}
                  order={order}
                  isLast={index === Math.min(summary.recentOrders.length - 1, 4)}
                  onPress={() => router.push(`/(tabs)/orders/${order.id}`)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={36} color={dt.colors.ink[300]} />
              <Text style={styles.emptyTitle}>אין הזמנות עדיין</Text>
              <Text style={styles.emptySubtitle}>הזמנות חדשות יופיעו כאן</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Sub-components ---

function QuickAction({
  icon,
  label,
  onPress,
  color,
  primary = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.quickActionInner,
          primary && styles.quickActionInnerPrimary,
        ]}
      >
        <Text
          style={[
            styles.quickActionLabel,
            primary && styles.quickActionLabelPrimary,
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.quickActionIcon,
            { backgroundColor: primary ? 'rgba(255,255,255,0.2)' : `${color}18` },
          ]}
        >
          <Ionicons name={icon} size={22} color={primary ? '#FFFFFF' : color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RecentOrderRow({
  order,
  isLast,
  onPress,
}: {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  };
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.orderRow, !isLast && styles.orderRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.orderTopRow}>
        <Text style={styles.orderNumber}>
          {order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
        </Text>
        <View style={styles.orderAmountRow}>
          <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
          <Ionicons name="chevron-back" size={14} color={dt.colors.ink[300]} />
        </View>
      </View>
      <View style={styles.orderBottomRow}>
        <Text style={styles.orderMeta}>
          {order.customerName} {'\u00B7'} {formatDateTimeShort(order.createdAt)}
        </Text>
        <View style={[styles.orderMiniBadge, { backgroundColor: dt.colors.orderStatus[order.status]?.bg || dt.colors.ink[100] }]}>
          <Text style={[styles.orderMiniBadgeText, { color: dt.colors.orderStatus[order.status]?.text || dt.colors.ink[600] }]}>
            {order.status === 'pending' ? 'ממתינה' : order.status === 'confirmed' ? 'אושרה' : order.status === 'processing' ? 'בטיפול' : order.status === 'shipped' ? 'נשלחה' : order.status === 'delivered' ? 'נמסרה' : order.status === 'cancelled' ? 'בוטלה' : 'זוכתה'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SalesChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  const maxRevenue = useMemo(() => Math.max(...data.map(d => d.revenue), 1), [data]);
  const totalRevenue = useMemo(() => data.reduce((sum, d) => sum + d.revenue, 0), [data]);
  const totalOrders = useMemo(() => data.reduce((sum, d) => sum + d.orders, 0), [data]);
  const barHeight = 100;

  const labelIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i);
    return [0, Math.floor(data.length / 3), Math.floor(2 * data.length / 3), data.length - 1];
  }, [data]);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartBarsContainer}>
        {data.map((d, i) => {
          const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) : 0;
          const h = Math.max(pct * barHeight, d.revenue > 0 ? 4 : 1);
          const isLabel = labelIndices.includes(i);
          const dateObj = new Date(d.date);
          return (
            <View key={d.date} style={styles.chartBarCol}>
              <View style={styles.chartBarArea}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: h,
                      backgroundColor: d.revenue > 0 ? dt.colors.brand[500] : dt.colors.ink[100],
                      opacity: d.revenue > 0 ? (0.4 + pct * 0.6) : 0.5,
                    },
                  ]}
                />
              </View>
              {isLabel && (
                <Text style={styles.chartBarLabel}>
                  {`${dateObj.getDate()}/${dateObj.getMonth() + 1}`}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.chartSummary}>
        <View style={styles.chartSummaryItem}>
          <Text style={styles.chartSummaryValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.chartSummaryLabel}>סה"כ מכירות</Text>
        </View>
        <View style={styles.chartSummaryItem}>
          <Text style={styles.chartSummaryValue}>{totalOrders}</Text>
          <Text style={styles.chartSummaryLabel}>הזמנות</Text>
        </View>
      </View>
    </View>
  );
}

function TopProductRow({
  product,
  rank,
  isLast,
  onPress,
}: {
  product: { id: string; name: string; revenue: number; quantity: number; imageUrl?: string | null };
  rank: number;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.topProductRow, !isLast && styles.topProductRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topProductInfo}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.topProductImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.topProductImage, styles.topProductImagePlaceholder]}>
            <Ionicons name="cube-outline" size={18} color={dt.colors.ink[300]} />
          </View>
        )}
        <View style={styles.topProductDetails}>
          <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.topProductQuantity}>{product.quantity} נמכרו</Text>
        </View>
      </View>
      <View style={styles.topProductRevenueCol}>
        <Text style={styles.topProductRevenue}>{formatCurrency(product.revenue)}</Text>
        <Ionicons name="chevron-back" size={14} color={dt.colors.ink[300]} />
      </View>
    </TouchableOpacity>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dt.spacing[4],
    paddingTop: dt.spacing[2],
    paddingBottom: dt.spacing[3],
    backgroundColor: dt.colors.surface.card,
  },
  headerInfo: {
    alignItems: 'flex-start',
    flex: 1,
  },
  storeName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: dt.colors.ink[900],
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  dateText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: dt.colors.ink[600],
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Revenue Hero
  revenueHero: {
    backgroundColor: dt.colors.surface.card,
    paddingHorizontal: dt.spacing[4],
    paddingTop: dt.spacing[4],
    paddingBottom: dt.spacing[4],
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
  },
  revenueValue: {
    fontSize: 42,
    lineHeight: 50,
    fontFamily: fonts.extraBold,
    color: dt.colors.ink[950],
    letterSpacing: 0.5,
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  revenueLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  revenueLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: dt.colors.ink[600],
    writingDirection: 'rtl',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: dt.radii.sm,
  },
  trendText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  // Period Pills
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: dt.spacing[4],
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: dt.radii.full,
  },
  periodPillActive: {
    backgroundColor: dt.colors.brand[500],
  },
  periodPillInactive: {
    backgroundColor: dt.colors.ink[50],
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
  },
  periodPillText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
  },
  periodPillTextInactive: {
    color: dt.colors.ink[600],
  },

  // Stats Row
  statsScrollView: {
    marginTop: dt.spacing[4],
  },
  statsRow: {
    paddingHorizontal: dt.spacing[4],
    gap: dt.spacing[3],
    flexDirection: 'row',
  },

  // Section
  section: {
    paddingHorizontal: dt.spacing[4],
    marginTop: dt.spacing[6],
  },

  // Alerts
  alertsContainer: {
    gap: dt.spacing[2],
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    paddingHorizontal: dt.spacing[4],
    paddingVertical: dt.spacing[3],
    gap: dt.spacing[3],
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  alertContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  alertLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    writingDirection: 'rtl',
  },
  alertCount: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    marginTop: 2,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dt.spacing[3],
  },
  quickAction: {
    width: (SCREEN_WIDTH - dt.spacing[4] * 2 - dt.spacing[3]) / 2,
  },
  quickActionInner: {
    backgroundColor: dt.colors.surface.card,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    borderRadius: dt.radii.lg,
    padding: dt.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: dt.spacing[3],
    minHeight: 64,
  },
  quickActionInnerPrimary: {
    backgroundColor: dt.colors.brand[500],
    borderColor: dt.colors.brand[500],
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: dt.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[900],
    writingDirection: 'rtl',
    flex: 1,
    textAlign: 'right',
  },
  quickActionLabelPrimary: {
    color: '#FFFFFF',
  },

  // Orders
  ordersCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  orderRow: {
    padding: dt.spacing[4],
    gap: dt.spacing[2],
  },
  orderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderNumber: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    writingDirection: 'rtl',
  },
  orderMeta: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    writingDirection: 'rtl',
  },
  orderMiniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: dt.radii.sm,
  },
  orderMiniBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },
  orderTotal: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: dt.colors.ink[900],
  },

  // Chart
  chartCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[3],
    overflow: 'hidden',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 120,
    paddingBottom: 18,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  chartBar: {
    width: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    fontFamily: fonts.regular,
    color: dt.colors.ink[400],
    marginTop: 4,
    position: 'absolute',
    bottom: -16,
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: dt.spacing[3],
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[100],
    marginTop: dt.spacing[2],
  },
  chartSummaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  chartSummaryValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
  },
  chartSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    writingDirection: 'rtl',
  },

  // Top Products
  topProductsCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dt.spacing[4],
    paddingVertical: dt.spacing[3],
  },
  topProductRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
  },
  topProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
    flex: 1,
  },
  topProductImage: {
    width: 40,
    height: 40,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[50],
  },
  topProductImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProductDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  topProductName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[900],
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  topProductQuantity: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    writingDirection: 'rtl',
    marginTop: 1,
  },
  topProductRevenueCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topProductRevenue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: dt.colors.ink[900],
  },

  // Empty
  emptyCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[800],
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    writingDirection: 'rtl',
  },
});
