import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
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
import { usePendingInventory, useActOnPendingItem } from '@/hooks';
import { showToast } from '@/lib/utils/toast';
import { formatDateTimeShort } from '@/lib/utils/format';
import type { PendingInventoryItem } from '@/lib/api/returns';

const dt = designTokens;

const STATUS_TABS: { key: 'pending' | 'received' | 'discarded'; label: string }[] = [
  { key: 'pending', label: 'ממתינים' },
  { key: 'received', label: 'נקלטו' },
  { key: 'discarded', label: 'נמחקו' },
];

export default function PendingInventoryScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'received' | 'discarded'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = usePendingInventory({ status });
  const action = useActOnPendingItem();

  const items = data?.items ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const handleConfirm = (item: PendingInventoryItem) => {
    Alert.alert(
      'החזר למלאי',
      `להחזיר ${item.quantity} יח׳ של ${item.productName} למלאי?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אישור',
          onPress: async () => {
            try {
              const r = await action.mutateAsync({ id: item.id, action: 'confirm' });
              if (r.success) showToast('הוחזר למלאי', 'success');
              else showToast(r.error || 'אירעה שגיאה', 'error');
            } catch (e: any) {
              showToast(e?.message || 'אירעה שגיאה', 'error');
            }
          },
        },
      ],
    );
  };

  const handleDiscard = (item: PendingInventoryItem) => {
    Alert.alert(
      'מחיקת פריט',
      `למחוק את ${item.productName} ללא החזרה למלאי?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              const r = await action.mutateAsync({ id: item.id, action: 'discard' });
              if (r.success) showToast('הפריט נמחק', 'success');
              else showToast(r.error || 'אירעה שגיאה', 'error');
            } catch (e: any) {
              showToast(e?.message || 'אירעה שגיאה', 'error');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="מלאי ממתין לקליטה" />

      <FilterTabs
        tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={status}
        onTabPress={(k) => setStatus(k as 'pending' | 'received' | 'discarded')}
      />

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <PendingRow
            item={item}
            onConfirm={status === 'pending' ? () => handleConfirm(item) : undefined}
            onDiscard={status === 'pending' ? () => handleDiscard(item) : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dt.colors.brand[500]} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} style={styles.skeletonCard}>
                  <View style={{ gap: 8 }}>
                    <SkeletonRow width="60%" />
                    <SkeletonRow width="40%" height={12} />
                  </View>
                </SkeletonCard>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Ionicons name="archive-outline" size={48} color={dt.colors.brand[500]} />}
              title={status === 'pending' ? 'אין פריטים ממתינים' : 'אין פריטים בסטטוס הזה'}
              description={status === 'pending' ? 'פריטים שיאושרו בהחזרה יופיעו כאן' : undefined}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function PendingRow({
  item,
  onConfirm,
  onDiscard,
}: {
  item: PendingInventoryItem;
  onConfirm?: () => void;
  onDiscard?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
            <Ionicons name="cube-outline" size={20} color={dt.colors.ink[400]} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
          {item.variantTitle ? <Text style={styles.itemVariant}>{item.variantTitle}</Text> : null}
          <Text style={styles.itemMeta}>
            כמות: {item.quantity}
            {item.orderNumber ? ` · הזמנה #${item.orderNumber}` : ''}
          </Text>
          <Text style={styles.itemDate}>{formatDateTimeShort(item.createdAt)}</Text>
        </View>
      </View>
      {(onConfirm || onDiscard) && (
        <View style={styles.actions}>
          {onDiscard && (
            <TouchableOpacity style={[styles.actionBtn, styles.discardBtn]} onPress={onDiscard}>
              <Ionicons name="close-outline" size={18} color={dt.colors.semantic.danger.dark} />
              <Text style={[styles.actionText, { color: dt.colors.semantic.danger.dark }]}>מחק</Text>
            </TouchableOpacity>
          )}
          {onConfirm && (
            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={onConfirm}>
              <Ionicons name="checkmark-outline" size={18} color={dt.colors.surface.onBrand} />
              <Text style={[styles.actionText, { color: dt.colors.surface.onBrand }]}>החזר למלאי</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
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
    padding: dt.spacing[3],
    marginBottom: dt.spacing[2],
    gap: dt.spacing[3],
  },
  rowMain: {
    flexDirection: 'row',
    gap: dt.spacing[3],
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[100],
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  itemVariant: {
    fontSize: 12,
    color: dt.colors.ink[500],
  },
  itemMeta: {
    fontSize: 12,
    color: dt.colors.ink[500],
  },
  itemDate: {
    fontSize: 11,
    color: dt.colors.ink[400],
  },
  actions: {
    flexDirection: 'row',
    gap: dt.spacing[2],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: dt.radii.md,
  },
  confirmBtn: {
    backgroundColor: dt.colors.brand[500],
  },
  discardBtn: {
    backgroundColor: dt.colors.semantic.danger.light,
  },
  actionText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
