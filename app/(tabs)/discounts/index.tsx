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
import { useDiscounts, useToggleDiscountStatus } from '@/hooks';
import {
  Text,
  LoadingScreen,
  EmptyState,
  Badge,
  FilterTabs,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { Discount } from '@/lib/api/analytics';

const dt = designTokens;

const FILTER_TABS = [
  { key: 'all', label: '\u05D4\u05DB\u05DC' },
  { key: 'active', label: '\u05E4\u05E2\u05D9\u05DC\u05D9\u05DD' },
  { key: 'inactive', label: '\u05DC\u05D0 \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD' },
  { key: 'expired', label: '\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E3' },
];

export default function DiscountsListScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toggleStatus = useToggleDiscountStatus();

  const {
    data,
    isLoading,
    refetch,
  } = useDiscounts({
    status: selectedFilter === 'all' ? undefined : selectedFilter,
    limit: 50,
  });

  const discounts = data?.discounts || [];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleDiscountPress = useCallback((discount: Discount) => {
    router.push(`/(tabs)/discounts/${discount.id}`);
  }, [router]);

  const handleCreatePress = () => {
    router.push('/(tabs)/discounts/create');
  };

  const handleToggleStatus = async (discount: Discount) => {
    try {
      await toggleStatus.mutateAsync({
        discountId: discount.id,
        isActive: !discount.isActive,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const renderDiscount = useCallback(({ item: discount }: { item: Discount }) => (
    <DiscountCard
      discount={discount}
      onPress={() => handleDiscountPress(discount)}
      onToggle={() => handleToggleStatus(discount)}
    />
  ), [handleDiscountPress]);

  if (isLoading) {
    return <LoadingScreen message={'\u05D8\u05D5\u05E2\u05DF \u05E7\u05D5\u05E4\u05D5\u05E0\u05D9\u05DD...'} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.addButton} onPress={handleCreatePress}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View style={styles.tabsWrapper}>
          <FilterTabs
            tabs={FILTER_TABS}
            activeTab={selectedFilter}
            onTabPress={(key) => setSelectedFilter(key as typeof selectedFilter)}
          />
        </View>
      </View>

      {/* Discounts List */}
      <FlatList
        data={discounts}
        keyExtractor={(item) => item.id}
        renderItem={renderDiscount}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={dt.colors.brand[500]}
            colors={[dt.colors.brand[500]]}

          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="pricetag-outline" size={48} color={dt.colors.brand[500]} />}
            title={'\u05D0\u05D9\u05DF \u05E7\u05D5\u05E4\u05D5\u05E0\u05D9\u05DD'}
            description={'\u05E6\u05D5\u05E8 \u05E7\u05D5\u05E4\u05D5\u05DF \u05D7\u05D3\u05E9 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC'}
            actionLabel={'\u05E6\u05D5\u05E8 \u05E7\u05D5\u05E4\u05D5\u05DF'}
            onAction={handleCreatePress}
          />
        }
      />
    </SafeAreaView>
  );
}

// ============ Discount Card Component ============
interface DiscountCardProps {
  discount: Discount;
  onPress: () => void;
  onToggle: () => void;
}

function DiscountCard({ discount, onPress, onToggle }: DiscountCardProps) {
  const getDiscountValue = () => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}%`;
      case 'fixed_amount':
        return formatCurrency(discount.value);
      case 'free_shipping':
        return '\u05DE\u05E9\u05DC\u05D5\u05D7 \u05D7\u05D9\u05E0\u05DD';
      case 'buy_x_get_y':
        return '\u05E7\u05E0\u05D4 X \u05E7\u05D1\u05DC Y';
      default:
        return `${discount.value}`;
    }
  };

  const getStatusBadge = () => {
    if (!discount.isActive) {
      return <Badge variant="default" size="sm">{'\u05DC\u05D0 \u05E4\u05E2\u05D9\u05DC'}</Badge>;
    }
    if (discount.endsAt && new Date(discount.endsAt) < new Date()) {
      return <Badge variant="warning" size="sm">{'\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E3'}</Badge>;
    }
    return <Badge variant="success" size="sm">{'\u05E4\u05E2\u05D9\u05DC'}</Badge>;
  };

  const isExpired = discount.endsAt && new Date(discount.endsAt) < new Date();

  return (
    <TouchableOpacity
      style={[styles.discountCard, !discount.isActive && styles.discountCardInactive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top Row: badge + value on the leading (right) side, toggle trailing (left) */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeading}>
          {getStatusBadge()}
          <View style={styles.discountValueRow}>
            <Text style={styles.discountValue}>{getDiscountValue()}</Text>
            {discount.type === 'percentage' && (
              <Text style={styles.discountLabel}>{'\u05D4\u05E0\u05D7\u05D4'}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.toggle, discount.isActive && styles.toggleActive]}>
            <View style={[styles.toggleThumb, discount.isActive && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Code / Title */}
      <View style={styles.cardMiddle}>
        {discount.code && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{discount.code}</Text>
          </View>
        )}
        {discount.title && (
          <Text style={styles.discountTitle} numberOfLines={1}>{discount.title}</Text>
        )}
        {discount.isAutomatic && (
          <View style={styles.automaticTag}>
            <Ionicons name="flash" size={12} color={dt.colors.brand[500]} />
            <Text style={styles.automaticText}>{'\u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9'}</Text>
          </View>
        )}
      </View>

      {/* Bottom Row: meta on leading (right) side, drill-down chevron trailing (left) */}
      <View style={styles.cardBottomRow}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {'\u05E9\u05D9\u05DE\u05D5\u05E9\u05D9\u05DD'}: {discount.usageCount}
            {discount.usageLimit ? ` / ${discount.usageLimit}` : ''}
          </Text>
          {discount.endsAt && (
            <Text style={[styles.metaText, isExpired && { color: dt.colors.semantic.danger.DEFAULT }]}>
              {isExpired ? '\u05E4\u05D2 \u05D1-' : '\u05E2\u05D3 '}{formatDate(discount.endsAt)}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-back" size={14} color={dt.colors.ink[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },

  // Header
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dt.spacing[4],
    paddingVertical: dt.spacing[3],
    gap: dt.spacing[3],
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    flex: 1,
  },

  // List
  listContent: {
    padding: dt.spacing[4],
    paddingTop: 0,
    gap: dt.spacing[3],
  },

  // Discount Card
  discountCard: {
    marginBottom: dt.spacing[2],
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[4],
    gap: dt.spacing[3],
  },
  discountCardInactive: {
    opacity: 0.65,
  },

  // Card Top Row
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTopLeading: {
    alignItems: 'flex-start',
    gap: dt.spacing[1],
  },
  discountValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: dt.spacing[1],
  },
  discountValue: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: dt.colors.brand[500],
  },
  discountLabel: {
    fontSize: 14,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
    textAlign: 'right',
  },

  // Card Middle
  cardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: dt.spacing[2],
  },
  codeContainer: {
    backgroundColor: dt.colors.ink[50],
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[1],
    borderRadius: dt.radii.sm,
    borderWidth: 1,
    borderColor: dt.colors.ink[300],
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  discountTitle: {
    fontSize: 14,
    color: dt.colors.ink[500],
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  automaticTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: dt.colors.brand[50],
    paddingHorizontal: dt.spacing[2],
    paddingVertical: 2,
    borderRadius: dt.radii.full,
  },
  automaticText: {
    fontSize: 11,
    color: dt.colors.brand[500],
    fontFamily: fonts.medium,
    textAlign: 'right',
  },

  // Card Bottom
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
    textAlign: 'right',
  },

  // Toggle
  toggleButton: {
    padding: dt.spacing[1],
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    backgroundColor: dt.colors.ink[200],
  },
  toggleActive: {
    backgroundColor: dt.colors.brand[100],
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: dt.colors.surface.onBrand,
    alignSelf: 'flex-end',
  },
  toggleThumbActive: {
    alignSelf: 'flex-start',
    backgroundColor: dt.colors.brand[500],
  },
});
