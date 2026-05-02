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
import { useTopProducts } from '@/hooks';
import {
  Text,
  ScreenHeader,
  Card,
  EmptyState,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow, SkeletonCard } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/format';

const dt = designTokens;

type Period = 'today' | 'week' | 'month' | 'year';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'שבוע' },
  { key: 'month', label: 'חודש' },
  { key: 'year', label: 'שנה' },
];

export default function ProductsReportScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);

  const { data: topProducts, isLoading, refetch } = useTopProducts({ period, limit: 50 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const totalRevenue = (topProducts ?? []).reduce((s, p) => s + p.revenue, 0);
  const totalUnits = (topProducts ?? []).reduce((s, p) => s + p.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוח מוצרים" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dt.colors.brand[500]} />
        }
      >
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

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Card variant="outlined" style={styles.totalCard}>
            <Text style={styles.totalLabel}>סה"כ הכנסות</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalRevenue)}</Text>
          </Card>
          <Card variant="outlined" style={styles.totalCard}>
            <Text style={styles.totalLabel}>יחידות שנמכרו</Text>
            <Text style={styles.totalValue}>{totalUnits}</Text>
          </Card>
        </View>

        {/* Products list */}
        <Card variant="outlined" padding={0} style={styles.listCard}>
          {isLoading ? (
            <View style={{ padding: dt.spacing[4], gap: dt.spacing[3] }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} width="100%" height={20} />
              ))}
            </View>
          ) : !topProducts || topProducts.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="cube-outline" size={48} color={dt.colors.brand[500]} />}
              title="אין מוצרים שנמכרו"
              description="בתקופה זו לא נרשמו מכירות"
            />
          ) : (
            topProducts.map((p, idx) => (
              <View
                key={p.id}
                style={[styles.row, idx < topProducts.length - 1 && styles.rowBorder]}
              >
                <View style={styles.revenueCol}>
                  <Text style={styles.revenue}>{formatCurrency(p.revenue)}</Text>
                  <Text style={styles.qty}>{p.quantity} יח'</Text>
                </View>
                <View style={styles.nameCol}>
                  <View style={styles.rank}><Text style={styles.rankText}>{idx + 1}</Text></View>
                  <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

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
  totalsRow: { flexDirection: 'row', gap: dt.spacing[3] },
  totalCard: { flex: 1, alignItems: 'flex-end' },
  totalLabel: { fontSize: 12, color: dt.colors.ink[500] },
  totalValue: { fontSize: 22, fontFamily: fonts.bold, color: dt.colors.ink[950], marginTop: 4 },
  listCard: { },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: dt.spacing[3], gap: dt.spacing[3] },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: dt.colors.ink[100] },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: dt.spacing[3] },
  rank: { width: 26, height: 26, borderRadius: 13, backgroundColor: dt.colors.ink[100], alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontFamily: fonts.bold, color: dt.colors.ink[700] },
  name: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: dt.colors.ink[950], textAlign: 'right' },
  revenueCol: { alignItems: 'flex-end', gap: 2 },
  revenue: { fontSize: 14, fontFamily: fonts.bold, color: dt.colors.brand[500] },
  qty: { fontSize: 11, color: dt.colors.ink[500] },
});
