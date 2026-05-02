import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFullAnalytics, useTopProducts, useDashboardSummary } from '@/hooks';
import {
  Text,
  ScreenHeader,
  Card,
  SectionHeader,
  Sparkline,
  StatCard,
  EmptyState,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/format';

const dt = designTokens;

type Period = 'today' | 'week' | 'month' | 'year';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'שבוע' },
  { key: 'month', label: 'חודש' },
  { key: 'year', label: 'שנה' },
];

function HeroSkeleton() {
  return (
    <Card variant="outlined" style={{ gap: dt.spacing[2] }}>
      <SkeletonRow width="40%" height={14} />
      <SkeletonRow width="70%" height={32} />
      <View style={{ height: 56, marginTop: dt.spacing[2] }} />
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <View style={{ flex: 1, height: 110, padding: dt.spacing[3], backgroundColor: dt.colors.surface.card, borderRadius: dt.radii.lg, gap: 8, justifyContent: 'space-between' }}>
      <SkeletonRow width={32} height={32} />
      <SkeletonRow width="60%" height={22} />
      <SkeletonRow width="50%" height={12} />
    </View>
  );
}

function ProductSkeletonRow() {
  return (
    <View style={{ padding: dt.spacing[3], flexDirection: 'row', alignItems: 'center', gap: dt.spacing[3] }}>
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonRow width="80%" height={14} />
        <SkeletonRow width="40%" height={11} />
      </View>
      <SkeletonRow width={60} height={16} />
    </View>
  );
}

export default function SalesReportScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [refreshing, setRefreshing] = useState(false);

  const { data: analytics, isLoading: aLoading, refetch } = useFullAnalytics({ period });
  const { data: dashboardSummary, refetch: refetchSummary } = useDashboardSummary(period);
  const { data: topProducts, isLoading: tpLoading, refetch: refetchTop } = useTopProducts({ period, limit: 10 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([refetch(), refetchSummary(), refetchTop()]); } finally { setRefreshing(false); }
  }, [refetch, refetchSummary, refetchTop]);

  const summary = analytics?.summary;
  const revenueChart = dashboardSummary?.revenueChart ?? [];
  const revenueSeries = revenueChart.map((d) => d.revenue);
  const ordersSeries = revenueChart.map((d) => d.orders);
  const isLoading = aLoading;
  const hasNoSales = !isLoading && (summary?.revenue ?? 0) === 0 && (summary?.orders ?? 0) === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוח מכירות" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dt.colors.brand[500]} />
        }
      >
        {/* Period */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodPill, active && styles.periodPillActive]}
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero */}
        {isLoading ? (
          <HeroSkeleton />
        ) : (
          <Card variant="outlined" style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>סך הכנסות</Text>
              {typeof summary?.revenueChange === 'number' && summary.revenueChange !== 0 && (
                <View
                  style={[
                    styles.deltaChip,
                    summary.revenueChange >= 0 ? styles.deltaChipUp : styles.deltaChipDown,
                  ]}
                >
                  <Text
                    style={[
                      styles.deltaText,
                      {
                        color:
                          summary.revenueChange >= 0
                            ? dt.colors.semantic.success.dark
                            : dt.colors.semantic.danger.dark,
                      },
                    ]}
                  >
                    {summary.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(summary.revenueChange)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.heroValue}>{formatCurrency(summary?.revenue ?? 0)}</Text>
            {revenueSeries.length > 1 ? (
              <View style={styles.heroChart}>
                <Sparkline
                  data={revenueSeries}
                  width={300}
                  height={56}
                  color={
                    (summary?.revenueChange ?? 0) >= 0
                      ? dt.colors.semantic.success.DEFAULT
                      : dt.colors.semantic.danger.DEFAULT
                  }
                />
              </View>
            ) : null}
          </Card>
        )}

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          {isLoading ? (
            <>
              <KpiSkeleton />
              <KpiSkeleton />
            </>
          ) : (
            <>
              <View style={styles.kpiTile}>
                <StatCard
                  label="הזמנות"
                  value={String(summary?.orders ?? 0)}
                  icon={<Ionicons name="cart-outline" size={18} color={dt.colors.brand[500]} />}
                  accentColor={dt.colors.brand[500]}
                  series={ordersSeries.length > 1 ? ordersSeries : undefined}
                />
              </View>
              <View style={styles.kpiTile}>
                <StatCard
                  label="ממוצע להזמנה"
                  value={formatCurrency(summary?.avgOrderValue ?? 0)}
                  icon={<Ionicons name="analytics-outline" size={18} color={dt.colors.accent[500]} />}
                  accentColor={dt.colors.accent[500]}
                  series={revenueSeries.length > 1 ? revenueSeries : undefined}
                />
              </View>
            </>
          )}
        </View>

        {/* Top products */}
        <View style={styles.section}>
          <SectionHeader title="מוצרים מובילים" />
          <Card variant="outlined" padding={0}>
            {tpLoading ? (
              <View>
                <ProductSkeletonRow />
                <ProductSkeletonRow />
                <ProductSkeletonRow />
              </View>
            ) : !topProducts || topProducts.length === 0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon={<Ionicons name="trending-up-outline" size={48} color={dt.colors.brand[500]} />}
                  title={hasNoSales ? 'אין מכירות בתקופה זו' : 'אין מוצרים שנמכרו'}
                  description={hasNoSales ? 'נסה תקופה אחרת או חזור מאוחר יותר' : 'מוצרים שיימכרו יופיעו כאן'}
                />
              </View>
            ) : (
              topProducts.map((p, idx) => (
                <View key={p.id} style={[styles.productRow, idx < topProducts.length - 1 && styles.productRowBorder]}>
                  <Text style={styles.productRevenue}>{formatCurrency(p.revenue)}</Text>
                  <View style={styles.productInfo}>
                    <View style={styles.rank}><Text style={styles.rankText}>{idx + 1}</Text></View>
                    <View style={styles.productText}>
                      <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.productMeta}>{p.quantity} יחידות</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={{ height: dt.spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dt.colors.surface.background },
  scroll: { padding: dt.spacing[4], gap: dt.spacing[4] },
  periodRow: { flexDirection: 'row', gap: dt.spacing[2] },
  periodPill: { flex: 1, paddingVertical: dt.spacing[2], borderRadius: dt.radii.full, backgroundColor: dt.colors.ink[50], alignItems: 'center' },
  periodPillActive: { backgroundColor: dt.colors.brand[500] },
  periodText: { fontSize: 13, fontFamily: fonts.medium, color: dt.colors.ink[600] },
  periodTextActive: { color: dt.colors.surface.onBrand },
  heroCard: { gap: dt.spacing[2] },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 13, color: dt.colors.ink[500], textAlign: 'right', writingDirection: 'rtl' },
  heroValue: { fontSize: 32, fontFamily: fonts.bold, color: dt.colors.ink[950], textAlign: 'right', writingDirection: 'rtl' },
  heroChart: { marginTop: dt.spacing[2] },
  deltaChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: dt.radii.sm },
  deltaChipUp: { backgroundColor: dt.colors.semantic.success.light },
  deltaChipDown: { backgroundColor: dt.colors.semantic.danger.light },
  deltaText: { fontSize: 12, fontFamily: fonts.semiBold },
  kpiGrid: { flexDirection: 'row', gap: dt.spacing[3] },
  kpiTile: { flex: 1 },
  section: { gap: dt.spacing[2] },
  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: dt.spacing[3], gap: dt.spacing[3] },
  productRowBorder: { borderBottomWidth: 1, borderBottomColor: dt.colors.ink[100] },
  productInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: dt.spacing[3] },
  productText: { flex: 1, gap: 2 },
  rank: { width: 26, height: 26, borderRadius: 13, backgroundColor: dt.colors.ink[100], alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontFamily: fonts.bold, color: dt.colors.ink[700] },
  productName: { fontSize: 14, fontFamily: fonts.medium, color: dt.colors.ink[950], textAlign: 'right', writingDirection: 'rtl' },
  productMeta: { fontSize: 12, color: dt.colors.ink[500], textAlign: 'right', writingDirection: 'rtl' },
  productRevenue: { fontSize: 14, fontFamily: fonts.bold, color: dt.colors.brand[500] },
  emptyWrap: { padding: dt.spacing[6] },
});
