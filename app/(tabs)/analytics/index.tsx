import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFullAnalytics, useTopProducts } from '@/hooks';
import {
  Text,
  LoadingScreen,
  ScreenHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';

const { width } = Dimensions.get('window');
const dt = designTokens;
const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

type Period = 'today' | 'week' | 'month' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: '\u05D4\u05D9\u05D5\u05DD' },
  { key: 'week', label: '\u05E9\u05D1\u05D5\u05E2' },
  { key: 'month', label: '\u05D7\u05D5\u05D3\u05E9' },
  { key: 'year', label: '\u05E9\u05E0\u05D4' },
];

function getDateRange(period: Period): { dateFrom: string; dateTo: string; label: string } {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtShort = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

  const dateTo = fmt(now);

  switch (period) {
    case 'today': {
      return { dateFrom: dateTo, dateTo, label: fmtShort(now) };
    }
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { dateFrom: fmt(weekAgo), dateTo, label: `${fmtShort(weekAgo)} - ${fmtShort(now)}` };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: fmt(startOfMonth), dateTo, label: `${fmtShort(startOfMonth)} - ${fmtShort(now)}` };
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { dateFrom: fmt(startOfYear), dateTo, label: `${fmtShort(startOfYear)} - ${fmtShort(now)}` };
    }
  }
}

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dateRange = getDateRange(selectedPeriod);

  const { data: analytics, isLoading, refetch } = useFullAnalytics({
    period: selectedPeriod,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });
  const { data: topProducts, refetch: refetchTopProducts } = useTopProducts({ period: selectedPeriod, limit: 5 });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTopProducts()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, refetchTopProducts]);

  if (isLoading) {
    return <LoadingScreen message="\u05D8\u05D5\u05E2\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD..." />;
  }

  const summary = analytics?.summary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוחות ואנליטיקס" />
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
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key && styles.periodTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Range Label */}
        <Text style={styles.dateRangeLabel}>{dateRange.label}</Text>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueIconBox}>
              <Ionicons name="trending-up" size={20} color={dt.colors.semantic.success.DEFAULT} />
            </View>
            <Text style={styles.revenueLabel}>{'\u05E1\u05DA \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA'}</Text>
          </View>
          <Text style={styles.revenueValue}>
            {formatCurrency(summary?.revenue || 0)}
          </Text>
          {summary?.revenueChange !== undefined && (
            <View style={styles.changeRow}>
              <Ionicons
                name={summary.revenueChange >= 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={summary.revenueChange >= 0 ? dt.colors.semantic.success.DEFAULT : dt.colors.semantic.danger.DEFAULT}
              />
              <Text style={[
                styles.changeText,
                { color: summary.revenueChange >= 0 ? dt.colors.semantic.success.DEFAULT : dt.colors.semantic.danger.DEFAULT }
              ]}>
                {Math.abs(summary.revenueChange)}% {'\u05DE\u05D4\u05EA\u05E7\u05D5\u05E4\u05D4 \u05D4\u05E7\u05D5\u05D3\u05DE\u05EA'}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="cart-outline"
            label={'\u05D4\u05D6\u05DE\u05E0\u05D5\u05EA'}
            value={String(summary?.orders || 0)}
            change={summary?.ordersChange}
            color={dt.colors.brand[500]}
          />
          <StatCard
            icon="people-outline"
            label={'\u05DC\u05E7\u05D5\u05D7\u05D5\u05EA'}
            value={String(summary?.customers || 0)}
            change={summary?.customersChange}
            color={dt.colors.semantic.info.DEFAULT}
          />
          <StatCard
            icon="cash-outline"
            label={'\u05DE\u05DE\u05D5\u05E6\u05E2 \u05DC\u05D4\u05D6\u05DE\u05E0\u05D4'}
            value={formatCurrency(summary?.avgOrderValue || 0)}
            change={summary?.avgOrderValueChange}
            color={dt.colors.accent[500]}
          />
          <StatCard
            icon="analytics-outline"
            label={'\u05D4\u05DE\u05E8\u05D4'}
            value={`${summary?.conversionRate || 0}%`}
            change={summary?.conversionRateChange}
            color={dt.colors.semantic.warning.DEFAULT}
          />
        </View>

        {/* Customer Segments */}
        {analytics?.customerSegments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05E4\u05D9\u05DC\u05D5\u05D7 \u05DC\u05E7\u05D5\u05D7\u05D5\u05EA'}</Text>
            <View style={styles.segmentsCard}>
              <SegmentBar
                label={'\u05DC\u05E7\u05D5\u05D7\u05D5\u05EA \u05D7\u05D3\u05E9\u05D9\u05DD'}
                value={analytics.customerSegments.new}
                total={
                  analytics.customerSegments.new +
                  analytics.customerSegments.returning +
                  analytics.customerSegments.inactive
                }
                color={dt.colors.semantic.success.DEFAULT}
              />
              <SegmentBar
                label={'\u05DC\u05E7\u05D5\u05D7\u05D5\u05EA \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD'}
                value={analytics.customerSegments.returning}
                total={
                  analytics.customerSegments.new +
                  analytics.customerSegments.returning +
                  analytics.customerSegments.inactive
                }
                color={dt.colors.brand[500]}
              />
              <SegmentBar
                label={'\u05DC\u05E7\u05D5\u05D7\u05D5\u05EA \u05DC\u05D0 \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD'}
                value={analytics.customerSegments.inactive}
                total={
                  analytics.customerSegments.new +
                  analytics.customerSegments.returning +
                  analytics.customerSegments.inactive
                }
                color={dt.colors.ink[300]}
              />
            </View>
          </View>
        )}

        {/* Top Products */}
        {topProducts && topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05DE\u05D5\u05E6\u05E8\u05D9\u05DD \u05DE\u05D5\u05D1\u05D9\u05DC\u05D9\u05DD'}</Text>
            <View style={styles.topProductsCard}>
              {topProducts.map((product, index) => (
                <View
                  key={product.id}
                  style={[
                    styles.productRow,
                    index < topProducts.length - 1 && styles.productRowBorder
                  ]}
                >
                  <Text style={styles.productRevenue}>
                    {formatCurrency(product.revenue)}
                  </Text>
                  <View style={styles.productInfo}>
                    <View style={styles.productRank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.productStats}>
                        {product.quantity} {'\u05D9\u05D7\u05D9\u05D3\u05D5\u05EA'} {'\u2022'} {product.ordersCount} {'\u05D4\u05D6\u05DE\u05E0\u05D5\u05EA'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Categories */}
        {analytics?.topCategories && analytics.topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D5\u05EA \u05DE\u05D5\u05D1\u05D9\u05DC\u05D5\u05EA'}</Text>
            <View style={styles.categoriesCard}>
              {analytics.topCategories.slice(0, 5).map((category, index) => (
                <View
                  key={category.id}
                  style={[
                    styles.categoryRow,
                    index < Math.min(analytics.topCategories.length - 1, 4) && styles.categoryRowBorder
                  ]}
                >
                  <Text style={styles.categoryRevenue}>
                    {formatCurrency(category.revenue)}
                  </Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryOrders}>
                      {category.ordersCount} {'\u05D4\u05D6\u05DE\u05E0\u05D5\u05EA'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: dt.spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  change,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  change?: number;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {change !== undefined && (
        <View style={styles.statChange}>
          <Ionicons
            name={change >= 0 ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={change >= 0 ? dt.colors.semantic.success.DEFAULT : dt.colors.semantic.danger.DEFAULT}
          />
          <Text style={[
            styles.statChangeText,
            { color: change >= 0 ? dt.colors.semantic.success.DEFAULT : dt.colors.semantic.danger.DEFAULT }
          ]}>
            {Math.abs(change)}%
          </Text>
        </View>
      )}
    </View>
  );
}

// Segment Bar Component
function SegmentBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <View style={styles.segmentRow}>
      <Text style={styles.segmentValue}>{value}</Text>
      <View style={styles.segmentBarContainer}>
        <View style={styles.segmentInfo}>
          <Text style={styles.segmentLabel}>{label}</Text>
          <Text style={styles.segmentPercent}>{percentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.segmentBarBg}>
          <View
            style={[
              styles.segmentBarFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: dt.spacing[4],
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: 4,
    marginBottom: dt.spacing[4],
  },
  periodButton: {
    flex: 1,
    paddingVertical: dt.spacing[2],
    alignItems: 'center',
    borderRadius: dt.radii.sm,
  },
  periodButtonActive: {
    backgroundColor: dt.colors.brand[500],
  },
  periodText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[400],
  },
  periodTextActive: {
    color: dt.colors.surface.onBrand,
    fontFamily: fonts.semiBold,
  },

  // Date Range Label
  dateRangeLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.medium,
    color: dt.colors.ink[400],
    marginBottom: dt.spacing[3],
    marginTop: -dt.spacing[2],
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[5],
    marginBottom: dt.spacing[4],
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dt.spacing[3],
  },
  revenueLabel: {
    fontSize: 14,
    color: dt.colors.ink[500],
    fontFamily: fonts.medium,
  },
  revenueIconBox: {
    width: 36,
    height: 36,
    borderRadius: dt.radii.sm,
    backgroundColor: dt.colors.semantic.success.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueValue: {
    fontSize: 36,
    fontFamily: mono,
    fontWeight: '700',
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: dt.spacing[1],
    marginTop: dt.spacing[2],
  },
  changeText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dt.spacing[3],
    marginBottom: dt.spacing[4],
  },
  statCard: {
    width: (width - dt.spacing[4] * 2 - dt.spacing[3]) / 2,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[4],
    alignItems: 'flex-end',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: dt.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dt.spacing[2],
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
  },
  statLabel: {
    fontSize: 12,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
    marginTop: dt.spacing[1],
    textAlign: 'right',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: dt.spacing[1],
  },
  statChangeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },

  // Section
  section: {
    marginBottom: dt.spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
    marginBottom: dt.spacing[3],
  },

  // Segments
  segmentsCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[4],
    gap: dt.spacing[4],
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
  },
  segmentBarContainer: {
    flex: 1,
  },
  segmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dt.spacing[1],
  },
  segmentLabel: {
    fontSize: 13,
    color: dt.colors.ink[500],
    fontFamily: fonts.medium,
    textAlign: 'right',
  },
  segmentPercent: {
    fontSize: 13,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
  },
  segmentBarBg: {
    height: 8,
    backgroundColor: dt.colors.ink[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  segmentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  segmentValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    width: 40,
    textAlign: 'center',
  },

  // Top Products
  topProductsCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[4],
    gap: dt.spacing[3],
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[200],
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: dt.radii.sm,
    backgroundColor: dt.colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: dt.colors.ink[500],
  },
  productDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  productStats: {
    fontSize: 12,
    color: dt.colors.ink[400],
    marginTop: 2,
    textAlign: 'right',
  },
  productRevenue: {
    fontSize: 14,
    fontFamily: mono,
    fontWeight: '700',
    color: dt.colors.brand[500],
  },

  // Categories
  categoriesCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: dt.spacing[4],
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[200],
  },
  categoryInfo: {
    alignItems: 'flex-end',
  },
  categoryName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  categoryOrders: {
    fontSize: 12,
    color: dt.colors.ink[400],
    marginTop: 2,
    textAlign: 'right',
  },
  categoryRevenue: {
    fontSize: 14,
    fontFamily: mono,
    fontWeight: '700',
    color: dt.colors.brand[500],
  },
});
