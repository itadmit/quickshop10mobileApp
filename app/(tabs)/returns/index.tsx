import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  EmptyState,
  FilterTabs,
  ScreenHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow, SkeletonCard } from '@/components/ui/Skeleton';
import { useReturnRequests, usePendingInventory } from '@/hooks';
import type { ReturnRequestStatus, ReturnRequestSummary } from '@/lib/api/returns';
import { formatDateTimeShort } from '@/lib/utils/format';

const dt = designTokens;

const STATUS_TABS: { key: ReturnRequestStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'pending', label: 'ממתינות' },
  { key: 'approved', label: 'אושרו' },
  { key: 'completed', label: 'הסתיימו' },
  { key: 'rejected', label: 'נדחו' },
];

const STATUS_LABEL: Record<ReturnRequestStatus, string> = {
  pending: 'ממתינה',
  under_review: 'בבדיקה',
  approved: 'אושרה',
  awaiting_shipment: 'ממתין למשלוח',
  item_received: 'התקבל',
  completed: 'הסתיימה',
  rejected: 'נדחתה',
  cancelled: 'בוטלה',
};

const STATUS_COLOR: Record<ReturnRequestStatus, { bg: string; text: string }> = {
  pending: { bg: dt.colors.semantic.warning.light, text: dt.colors.semantic.warning.dark },
  under_review: { bg: dt.colors.semantic.info.light, text: dt.colors.semantic.info.dark },
  approved: { bg: dt.colors.semantic.info.light, text: dt.colors.semantic.info.dark },
  awaiting_shipment: { bg: dt.colors.semantic.info.light, text: dt.colors.semantic.info.dark },
  item_received: { bg: dt.colors.semantic.success.light, text: dt.colors.semantic.success.dark },
  completed: { bg: dt.colors.semantic.success.light, text: dt.colors.semantic.success.dark },
  rejected: { bg: dt.colors.semantic.danger.light, text: dt.colors.semantic.danger.dark },
  cancelled: { bg: dt.colors.ink[100], text: dt.colors.ink[600] },
};

export default function ReturnsListScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<ReturnRequestStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useReturnRequests({ status });
  const { data: pending } = usePendingInventory({ status: 'pending' });

  const requests = data?.requests ?? [];
  const stats = data?.stats;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="החזרות והחלפות" />

      {/* Pending inventory pill */}
      {pending && pending.pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push('/(tabs)/returns/pending')}
          activeOpacity={0.7}
        >
          <Ionicons name="archive-outline" size={20} color={dt.colors.semantic.warning.dark} />
          <Text style={styles.pendingBannerText}>
            {pending.pendingCount} פריטים ממתינים לקליטה למלאי
          </Text>
          <Ionicons name="chevron-back" size={16} color={dt.colors.semantic.warning.dark} />
        </TouchableOpacity>
      )}

      <FilterTabs
        tabs={STATUS_TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: t.key === 'all' ? stats?.total : stats?.[t.key as ReturnRequestStatus],
        }))}
        activeTab={status}
        onTabPress={(k) => setStatus(k as ReturnRequestStatus | 'all')}
      />

      <FlatList
        data={requests}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <RequestRow item={item} onPress={() => router.push(`/(tabs)/returns/${item.id}`)} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dt.colors.brand[500]} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} style={styles.skeletonCard}>
                  <View style={{ gap: 8 }}>
                    <SkeletonRow width="40%" />
                    <SkeletonRow width="80%" height={12} />
                    <SkeletonRow width="60%" height={12} />
                  </View>
                </SkeletonCard>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Ionicons name="swap-horizontal-outline" size={48} color={dt.colors.brand[500]} />}
              title="אין בקשות החזרה"
              description={status === 'all' ? 'בקשות חדשות יופיעו כאן' : 'אין בקשות בסטטוס הזה'}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function RequestRow({ item, onPress }: { item: ReturnRequestSummary; onPress: () => void }) {
  const sc = STATUS_COLOR[item.status];
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <Text style={styles.requestNumber}>#{item.requestNumber}</Text>
          <View style={[styles.typeChip, item.type === 'exchange' && styles.typeChipExchange]}>
            <Text style={[styles.typeChipText, item.type === 'exchange' && styles.typeChipTextExchange]}>
              {item.type === 'exchange' ? 'החלפה' : 'החזרה'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sc.text }]}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowMetaText}>
          {item.customerName || 'לקוח אנונימי'} · הזמנה {item.orderNumber ? `#${item.orderNumber}` : '-'}
        </Text>
        <Text style={styles.rowDate}>{formatDateTimeShort(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    margin: dt.spacing[4],
    marginBottom: dt.spacing[2],
    padding: dt.spacing[3],
    backgroundColor: dt.colors.semantic.warning.light,
    borderRadius: dt.radii.lg,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.semantic.warning.dark,
    textAlign: 'right',
  },
  listContent: {
    padding: dt.spacing[4],
    flexGrow: 1,
  },
  skeletonCard: {
    marginBottom: dt.spacing[2],
  },
  row: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[4],
    marginBottom: dt.spacing[2],
    gap: dt.spacing[2],
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
  },
  requestNumber: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: dt.radii.sm,
    backgroundColor: dt.colors.brand[50],
  },
  typeChipExchange: {
    backgroundColor: dt.colors.semantic.return.light,
  },
  typeChipText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: dt.colors.brand[600],
  },
  typeChipTextExchange: {
    color: dt.colors.semantic.return.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: dt.radii.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  rowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowMetaText: {
    fontSize: 13,
    color: dt.colors.ink[500],
    flex: 1,
  },
  rowDate: {
    fontSize: 12,
    color: dt.colors.ink[400],
  },
});
