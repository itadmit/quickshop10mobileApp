import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiscounts } from '@/hooks';
import {
  Text,
  ScreenHeader,
  Card,
  SectionHeader,
  EmptyState,
  StatCard,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/format';

const dt = designTokens;

export default function CouponsReportScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, refetch } = useDiscounts({ limit: 50 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const discounts = data?.discounts ?? [];
  const activeCount = discounts.filter((d) => d.isActive).length;
  const totalUsage = discounts.reduce((s, d) => s + (d.usageCount ?? 0), 0);
  const avgValue =
    discounts.length > 0
      ? discounts.reduce((s, d) => s + (d.value ?? 0), 0) / discounts.length
      : 0;

  // Sort by usage descending
  const sorted = [...discounts].sort(
    (a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוח קופונים" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dt.colors.brand[500]} />
        }
      >
        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiTile}>
            <StatCard
              label="קופונים פעילים"
              value={String(activeCount)}
              icon={<Ionicons name="pricetag-outline" size={18} color={dt.colors.brand[500]} />}
              accentColor={dt.colors.brand[500]}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="שימושים"
              value={String(totalUsage)}
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={dt.colors.semantic.success.DEFAULT} />}
              accentColor={dt.colors.semantic.success.DEFAULT}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="ערך ממוצע"
              value={String(Math.round(avgValue))}
              icon={<Ionicons name="cash-outline" size={18} color={dt.colors.accent[500]} />}
              accentColor={dt.colors.accent[500]}
            />
          </View>
        </View>

        {/* Top coupons */}
        <View style={styles.section}>
          <SectionHeader title="קופונים מובילים" />
          <Card variant="outlined" padding={0}>
            {isLoading ? (
              <View style={{ padding: dt.spacing[4], gap: dt.spacing[3] }}>
                {[0, 1, 2].map((i) => <SkeletonRow key={i} width="100%" height={20} />)}
              </View>
            ) : sorted.length === 0 ? (
              <EmptyState
                icon={<Ionicons name="pricetag-outline" size={48} color={dt.colors.brand[500]} />}
                title="אין קופונים"
                description="צור קופון ראשון כדי להציג ביצועים"
              />
            ) : (
              sorted.slice(0, 20).map((d, idx) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.row, idx < Math.min(sorted.length, 20) - 1 && styles.rowBorder]}
                  onPress={() => router.push(`/(tabs)/discounts/${d.id}`)}
                >
                  <View style={styles.usageCol}>
                    <Text style={styles.usageValue}>{d.usageCount ?? 0}</Text>
                    <Text style={styles.usageLabel}>שימושים</Text>
                  </View>
                  <View style={styles.couponInfo}>
                    <Text style={styles.couponCode} numberOfLines={1}>
                      {d.code || d.name || '—'}
                    </Text>
                    <View style={styles.couponMetaRow}>
                      <View
                        style={[
                          styles.statusDot,
                          d.isActive
                            ? { backgroundColor: dt.colors.semantic.success.DEFAULT }
                            : { backgroundColor: dt.colors.ink[300] },
                        ]}
                      />
                      <Text style={styles.couponMeta}>
                        {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)} ·{' '}
                        {d.isActive ? 'פעיל' : 'לא פעיל'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
  kpiGrid: { flexDirection: 'row', gap: dt.spacing[3] },
  kpiTile: { flex: 1, height: 116 },
  section: { gap: dt.spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: dt.spacing[3] },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: dt.colors.ink[100] },
  couponInfo: { flex: 1, gap: 2 },
  couponCode: { fontSize: 14, fontFamily: fonts.semiBold, color: dt.colors.ink[950], textAlign: 'right', writingDirection: 'rtl' },
  couponMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-start' },
  couponMeta: { fontSize: 12, color: dt.colors.ink[500], textAlign: 'right', writingDirection: 'rtl' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  usageCol: { minWidth: 60 },
  usageValue: { fontSize: 18, fontFamily: fonts.bold, color: dt.colors.brand[500] },
  usageLabel: { fontSize: 11, color: dt.colors.ink[500] },
});
