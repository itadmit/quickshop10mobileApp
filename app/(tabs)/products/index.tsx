import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteProducts } from '@/hooks';
import {
  Text,
  Card,
  StockBadge,
  LoadingScreen,
  EmptyState,
  colors,
  spacing,
  fonts,
  borderRadius,
  shadows,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import type { Product } from '@/types';

const FILTER_TABS = [
  { key: 'all', label: 'הכל' },
  { key: 'active', label: 'פעילים' },
  { key: 'draft', label: 'טיוטה' },
  { key: 'lowStock', label: 'מלאי נמוך' },
  { key: 'outOfStock', label: 'אזל' },
];

export default function ProductsListScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteProducts({
    status: selectedFilter === 'all' || selectedFilter === 'lowStock' || selectedFilter === 'outOfStock'
      ? undefined
      : selectedFilter as 'active' | 'draft',
    lowStock: selectedFilter === 'lowStock',
    outOfStock: selectedFilter === 'outOfStock',
    search: searchQuery || undefined,
    limit: 20,
  });

  const products = data?.pages.flatMap((page) => page.products) || [];
  const stats = data?.pages[0]?.stats;

  const handleProductPress = useCallback((product: Product) => {
    router.push(`/(tabs)/products/${product.id}`);
  }, [router]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScannerPress = () => {
    router.push('/(tabs)/products/scanner');
  };

  const renderProduct = useCallback(({ item: product }: { item: Product }) => (
    <ProductCard product={product} onPress={() => handleProductPress(product)} />
  ), [handleProductPress]);

  if (isLoading) {
    return <LoadingScreen message="טוען מוצרים..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="חפש מוצר..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={handleScannerPress}>
          <Ionicons name="camera-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                selectedFilter === item.key && styles.tabActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                weight={selectedFilter === item.key ? 'semiBold' : 'regular'}
                style={[
                  styles.tabText,
                  selectedFilter === item.key && styles.tabTextActive,
                ]}
              >
                {item.label}
                {stats && getFilterCount(item.key, stats) > 0 && (
                  <Text style={[
                    styles.tabCount,
                    selectedFilter === item.key && styles.tabCountActive
                  ]}>
                    {' '}({getFilterCount(item.key, stats)})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="bag-outline" size={48} color={colors.textMuted} />}
            title="אין מוצרים"
            description={searchQuery ? 'נסה חיפוש אחר' : 'הוסף מוצרים לחנות שלך'}
          />
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage && products.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text color="secondary">טוען עוד...</Text>
            </View>
          ) : <View style={{ height: spacing[4] }} />
        }
      />
    </SafeAreaView>
  );
}

function getFilterCount(key: string, stats: { total: number; active: number; draft: number; lowStock: number; outOfStock: number }): number {
  switch (key) {
    case 'all': return stats.total;
    case 'active': return stats.active;
    case 'draft': return stats.draft;
    case 'lowStock': return stats.lowStock;
    case 'outOfStock': return stats.outOfStock;
    default: return 0;
  }
}

// Product Card Component
function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={styles.productCard}>
      <View style={styles.productContent}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text weight="semiBold" numberOfLines={2} style={styles.productName}>
            {product.name}
          </Text>
          <Text weight="bold" style={styles.productPrice}>
            {product.price ? formatCurrency(product.price) : 'ללא מחיר'}
          </Text>
          {product.category && (
            <Text color="muted" size="xs" style={styles.productCategory}>
              {product.category.name}
            </Text>
          )}
        </View>
        <View style={styles.productRight}>
          <StockBadge inventory={product.inventory} size="sm" />
        </View>
        {!product.isActive && (
          <View style={styles.draftBadge}>
            <Text size="xs" style={{ color: colors.white }}>
              טיוטה
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F7',
  },
  headerActions: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: '#00785C',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabsContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  tabActive: {
    backgroundColor: '#00785C',
    borderColor: '#00785C',
  },
  tabText: {
    color: '#6D7175',
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.white,
    textAlign: 'center',
  },
  tabCount: {
    opacity: 0.8,
  },
  tabCountActive: {
    color: colors.white,
    opacity: 1,
  },
  listContent: {
    padding: spacing[4],
  },
  productCard: {
    marginBottom: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    backgroundColor: colors.white,
    ...shadows.sm,
    padding: spacing[3],
  },
  productContent: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  productImagePlaceholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing[3], // ב-RTL, marginLeft = ימין (רווח מהתמונה)
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  productName: {
    textAlign: 'right',
    fontSize: 14,
    color: '#202223',
  },
  productPrice: {
    textAlign: 'right',
    color: '#00785C',
  },
  productCategory: {
    textAlign: 'right',
  },
  productRight: {
    alignItems: 'flex-start', // ב-RTL עם row, flex-start = שמאל המסך
  },
  draftBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.gray500,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderBottomRightRadius: borderRadius.md,
    borderTopLeftRadius: borderRadius.md,
  },
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
});

