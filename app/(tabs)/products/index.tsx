import React, { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteProducts } from '@/hooks';
import {
  Text,
  EmptyState,
  SearchBar,
  FilterTabs,
  ProductSkeleton,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatProductPrice } from '@/lib/utils/format';
import type { Product } from '@/types';

const FILTER_TABS = [
  { key: 'all', label: 'הכל' },
  { key: 'active', label: 'פעילים' },
  { key: 'lowStock', label: 'מלאי נמוך' },
  { key: 'outOfStock', label: 'אזל' },
];

const { colors, spacing, radii } = designTokens;
const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function getStockInfo(product: Product) {
  // Products without inventory tracking shouldn't show stock status
  // (a missing inventory count is not the same as "out of stock").
  if (!product.hasVariants && !product.trackInventory) {
    return null;
  }
  const inventory = product.hasVariants
    ? product.variantTotalInventory ?? null
    : product.inventory ?? null;
  if (inventory === null) {
    return null;
  }
  if (inventory === 0) {
    return {
      label: 'אזל מהמלאי',
      color: colors.semantic.danger.DEFAULT,
    };
  }
  if (inventory <= 5) {
    return {
      label: `${inventory} במלאי`,
      color: colors.semantic.warning.DEFAULT,
    };
  }
  return {
    label: `${inventory} במלאי`,
    color: colors.semantic.success.DEFAULT,
  };
}

export default function ProductsListScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = useCallback(() => {
    setDebouncedSearch(searchQuery);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts({
    status: selectedFilter === 'all' || selectedFilter === 'lowStock' || selectedFilter === 'outOfStock'
      ? undefined
      : selectedFilter as 'active' | 'draft',
    lowStock: selectedFilter === 'lowStock',
    outOfStock: selectedFilter === 'outOfStock',
    search: debouncedSearch || undefined,
    limit: 20,
  });

  const products = data?.pages.flatMap((page) => page.products) || [];
  const stats = data?.pages[0]?.stats;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

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

  const handleCreatePress = () => {
    router.push('/(tabs)/products/create');
  };

  const renderProduct = useCallback(({ item: product }: { item: Product }) => (
    <ProductCard product={product} onPress={() => handleProductPress(product)} />
  ), [handleProductPress]);

  const showInitialLoading = isLoading && products.length === 0;

  const getFilterCount = (key: string) => {
    if (!stats) return undefined;
    switch (key) {
      case 'all': return stats.total;
      case 'active': return stats.active;
      case 'lowStock': return stats.lowStock;
      case 'outOfStock': return stats.outOfStock;
      default: return 0;
    }
  };

  const filterTabs = FILTER_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: getFilterCount(tab.key),
  }));

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearchSubmit}
        placeholder="חיפוש מוצר..."
        isLoading={isFetching && !!searchQuery}
        actions={
          <>
            <TouchableOpacity style={styles.addButton} onPress={handleCreatePress}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanButton} onPress={handleScannerPress}>
              <Ionicons name="barcode-outline" size={20} color={colors.ink[700]} />
            </TouchableOpacity>
          </>
        }
      />

      <FilterTabs
        tabs={filterTabs}
        activeTab={selectedFilter}
        onTabPress={setSelectedFilter}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand[500]}
            colors={[colors.brand[500]]}

          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          showInitialLoading ? (
            <View>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Ionicons name="cube-outline" size={48} color={colors.brand[500]} />}
              title="אין מוצרים"
              description={searchQuery ? 'נסה חיפוש אחר' : 'הוסף מוצר ראשון לחנות שלך'}
              actionLabel={searchQuery ? undefined : 'הוסף מוצר'}
              onAction={searchQuery ? undefined : handleCreatePress}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage && products.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingText}>טוען עוד...</Text>
            </View>
          ) : <View style={{ height: spacing[4] }} />
        }
      />
    </SafeAreaView>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const stockInfo = getStockInfo(product);

  return (
    <TouchableOpacity onPress={onPress} style={styles.productCard} activeOpacity={0.7}>
      {!product.isActive && (
        <View style={styles.draftBadge}>
          <Text style={styles.draftText}>טיוטה</Text>
        </View>
      )}

      <View style={styles.productContent}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={22} color={colors.ink[400]} />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {(() => {
            const priceText = formatProductPrice(product);
            return priceText ? (
              <Text style={styles.productPrice}>{priceText}</Text>
            ) : product.hasVariants ? (
              <Text style={styles.productVariantHint}>מחיר לפי וריאציה</Text>
            ) : null;
          })()}
          {stockInfo && (
            <Text style={[styles.stockText, { color: stockInfo.color }]}>
              {stockInfo.label}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-back" size={16} color={colors.ink[300]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },

  // Action buttons
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    padding: spacing[4],
  },

  // Product Card
  productCard: {
    marginBottom: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.ink[200],
    padding: spacing[4],
    minHeight: 72,
    position: 'relative',
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
  },
  productImagePlaceholder: {
    backgroundColor: colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  productName: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.ink[950],
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  productPrice: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.ink[800],
  },
  productVariantHint: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.ink[400],
    writingDirection: 'rtl',
  },
  stockText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  draftBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.ink[700],
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderBottomLeftRadius: radii.sm,
    borderTopRightRadius: radii.lg,
    zIndex: 1,
  },
  draftText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Loading
  loadingMore: {
    padding: spacing[4],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.ink[400],
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
