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
import { useDashboardSummary, useInfiniteProducts } from '@/hooks';
import {
  Text,
  ScreenHeader,
  Card,
  SectionHeader,
  StatCard,
  EmptyState,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow } from '@/components/ui/Skeleton';

const dt = designTokens;

export default function InventoryReportScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'lowStock' | 'outOfStock'>('lowStock');

  const { data: summary, refetch: refetchSummary } = useDashboardSummary('month');
  const { data: productsData, isLoading, refetch: refetchProducts } = useInfiniteProducts({
    [filter === 'lowStock' ? 'lowStock' : 'outOfStock']: true,
    limit: 30,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([refetchSummary(), refetchProducts()]); } finally { setRefreshing(false); }
  }, [refetchSummary, refetchProducts]);

  const products = productsData?.pages.flatMap((p) => p.products) ?? [];
  const lowStockCount = summary?.products?.lowStock ?? 0;
  const outOfStockCount = summary?.products?.outOfStock ?? 0;
  const totalStockProducts = summary?.products?.active ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוח מלאי" />
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
              label="מוצרים פעילים"
              value={String(totalStockProducts)}
              icon={<Ionicons name="cube-outline" size={18} color={dt.colors.brand[500]} />}
              accentColor={dt.colors.brand[500]}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="מלאי נמוך"
              value={String(lowStockCount)}
              icon={<Ionicons name="alert-circle-outline" size={18} color={dt.colors.semantic.warning.DEFAULT} />}
              accentColor={dt.colors.semantic.warning.DEFAULT}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="אזל מהמלאי"
              value={String(outOfStockCount)}
              icon={<Ionicons name="close-circle-outline" size={18} color={dt.colors.semantic.danger.DEFAULT} />}
              accentColor={dt.colors.semantic.danger.DEFAULT}
            />
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'lowStock' && styles.filterPillActive]}
            onPress={() => setFilter('lowStock')}
          >
            <Text style={[styles.filterText, filter === 'lowStock' && styles.filterTextActive]}>
              מלאי נמוך ({lowStockCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'outOfStock' && styles.filterPillActive]}
            onPress={() => setFilter('outOfStock')}
          >
            <Text style={[styles.filterText, filter === 'outOfStock' && styles.filterTextActive]}>
              אזל ({outOfStockCount})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <SectionHeader title={filter === 'lowStock' ? 'מוצרים במלאי נמוך' : 'מוצרים שאזלו'} />
          <Card variant="outlined" padding={0}>
            {isLoading ? (
              <View style={{ padding: dt.spacing[4], gap: dt.spacing[3] }}>
                {[0, 1, 2].map((i) => <SkeletonRow key={i} width="100%" height={20} />)}
              </View>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Ionicons name="checkmark-circle-outline" size={48} color={dt.colors.semantic.success.DEFAULT} />}
                title={filter === 'lowStock' ? 'אין מוצרים במלאי נמוך' : 'אין מוצרים שאזלו'}
                description="הכל מסודר!"
              />
            ) : (
              products.map((product, idx) => {
                const inv = product.hasVariants ? product.variantTotalInventory ?? 0 : product.inventory ?? 0;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.row, idx < products.length - 1 && styles.rowBorder]}
                    onPress={() => router.push(`/(tabs)/products/${product.id}`)}
                  >
                    <Text
                      style={[
                        styles.invValue,
                        inv === 0 && { color: dt.colors.semantic.danger.dark },
                      ]}
                    >
                      {inv === 0 ? 'אזל' : `${inv} במלאי`}
                    </Text>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      {product.sku ? <Text style={styles.productSku}>SKU: {product.sku}</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              })
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
  filterRow: { flexDirection: 'row', gap: dt.spacing[2] },
  filterPill: { flex: 1, paddingVertical: dt.spacing[2], borderRadius: dt.radii.full, backgroundColor: dt.colors.ink[50], alignItems: 'center' },
  filterPillActive: { backgroundColor: dt.colors.brand[500] },
  filterText: { fontSize: 13, fontFamily: fonts.medium, color: dt.colors.ink[600] },
  filterTextActive: { color: dt.colors.surface.onBrand },
  section: { gap: dt.spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: dt.spacing[3] },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: dt.colors.ink[100] },
  productInfo: { flex: 1, alignItems: 'flex-end', gap: 2 },
  productName: { fontSize: 14, fontFamily: fonts.medium, color: dt.colors.ink[950], textAlign: 'right' },
  productSku: { fontSize: 11, color: dt.colors.ink[500] },
  invValue: { fontSize: 13, fontFamily: fonts.semiBold, color: dt.colors.semantic.warning.dark },
});
