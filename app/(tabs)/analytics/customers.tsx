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
import { useFullAnalytics, useCustomersStats } from '@/hooks';
import {
  Text,
  ScreenHeader,
  Card,
  SectionHeader,
  StatCard,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow } from '@/components/ui/Skeleton';

const dt = designTokens;

type Period = 'today' | 'week' | 'month' | 'year';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'שבוע' },
  { key: 'month', label: 'חודש' },
  { key: 'year', label: 'שנה' },
];

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
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.segmentRow}>
      <View style={styles.segmentHeader}>
        <Text style={styles.segmentLabel}>{label}</Text>
        <Text style={[styles.segmentValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.segmentTrack}>
        <View
          style={[
            styles.segmentFill,
            { width: `${Math.min(pct, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export default function CustomersReportScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);

  const { data: analytics, isLoading, refetch } = useFullAnalytics({ period });
  const { data: stats, refetch: refetchStats } = useCustomersStats();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([refetch(), refetchStats()]); } finally { setRefreshing(false); }
  }, [refetch, refetchStats]);

  const segments = analytics?.customerSegments;
  const total = (segments?.new ?? 0) + (segments?.returning ?? 0) + (segments?.inactive ?? 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוח לקוחות" />
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

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiTile}>
            <StatCard
              label="סה״כ לקוחות"
              value={String(stats?.total ?? 0)}
              icon={<Ionicons name="people-outline" size={18} color={dt.colors.brand[500]} />}
              accentColor={dt.colors.brand[500]}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="חדשים"
              value={String(stats?.new ?? 0)}
              icon={<Ionicons name="person-add-outline" size={18} color={dt.colors.semantic.success.DEFAULT} />}
              accentColor={dt.colors.semantic.success.DEFAULT}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="חוזרים"
              value={String(stats?.returning ?? 0)}
              icon={<Ionicons name="repeat-outline" size={18} color={dt.colors.semantic.info.DEFAULT} />}
              accentColor={dt.colors.semantic.info.DEFAULT}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="הוצאה ממוצעת"
              value={String(Math.round(stats?.avgSpent ?? 0))}
              icon={<Ionicons name="wallet-outline" size={18} color={dt.colors.accent[500]} />}
              accentColor={dt.colors.accent[500]}
            />
          </View>
        </View>

        {/* Segments */}
        {segments && total > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="פילוח לקוחות" />
            <Card variant="outlined" style={styles.segmentsCard}>
              <SegmentBar
                label="לקוחות חדשים"
                value={segments.new}
                total={total}
                color={dt.colors.semantic.success.DEFAULT}
              />
              <SegmentBar
                label="לקוחות חוזרים"
                value={segments.returning}
                total={total}
                color={dt.colors.brand[500]}
              />
              <SegmentBar
                label="לקוחות לא פעילים"
                value={segments.inactive}
                total={total}
                color={dt.colors.ink[300]}
              />
            </Card>
          </View>
        ) : isLoading ? (
          <SkeletonRow width="100%" height={120} />
        ) : null}

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
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: dt.spacing[3] },
  kpiTile: { width: '48%', height: 116 },
  section: { gap: dt.spacing[2] },
  segmentsCard: { gap: dt.spacing[3] },
  segmentRow: { gap: 6 },
  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segmentLabel: { fontSize: 13, color: dt.colors.ink[600] },
  segmentValue: { fontSize: 14, fontFamily: fonts.bold },
  segmentTrack: { height: 6, borderRadius: 3, backgroundColor: dt.colors.ink[100], overflow: 'hidden' },
  segmentFill: { height: '100%', borderRadius: 3 },
});
