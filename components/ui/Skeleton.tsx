import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { spacing, designTokens } from './theme';

const dt = designTokens;

function SkeletonPulse({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

export function SkeletonRow({ height = 14, width = '100%' }: { height?: number; width?: number | string }) {
  return <SkeletonPulse style={{ height, width: width as number, borderRadius: 6 }} />;
}

export function SkeletonCircle({ size = 44 }: { size?: number }) {
  return <SkeletonPulse style={{ width: size, height: size, borderRadius: size / 2 }} />;
}

export function SkeletonCard({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Product list item skeleton */
export function ProductSkeleton() {
  return (
    <SkeletonCard style={styles.productCard}>
      <View style={styles.productRow}>
        <SkeletonPulse style={styles.productImage} />
        <View style={styles.productInfo}>
          <SkeletonRow width="70%" />
          <SkeletonRow width="40%" height={12} />
        </View>
        <View style={styles.productRight}>
          <SkeletonRow width={60} />
          <SkeletonRow width={50} height={10} />
        </View>
      </View>
    </SkeletonCard>
  );
}

/** Order list item skeleton */
export function OrderSkeleton() {
  return (
    <SkeletonCard style={styles.orderCard}>
      <View style={styles.orderRow}>
        <View style={styles.orderInfo}>
          <SkeletonRow width="50%" />
          <SkeletonRow width="70%" height={12} />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <SkeletonRow width={60} />
          <SkeletonRow width={45} height={18} />
        </View>
      </View>
    </SkeletonCard>
  );
}

/** Customer list item skeleton */
export function CustomerSkeleton() {
  return (
    <SkeletonCard style={styles.customerCard}>
      <View style={styles.customerRow}>
        <SkeletonCircle />
        <View style={styles.customerInfo}>
          <SkeletonRow width="60%" />
          <SkeletonRow width="80%" height={12} />
          <SkeletonRow width="40%" height={10} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <SkeletonRow width={55} />
        </View>
      </View>
    </SkeletonCard>
  );
}

/** POS product grid skeleton — matches the tile grid layout in pos/index.tsx */
export function POSGridSkeleton({
  tileWidth = 105,
  columns = 3,
  rows = 4,
}: { tileWidth?: number; columns?: number; rows?: number }) {
  return (
    <View style={styles.posGridWrap}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.posGridRow}>
          {Array.from({ length: columns }).map((_, c) => (
            <View
              key={c}
              style={[styles.posGridTile, { width: tileWidth }]}
            >
              <SkeletonPulse
                style={{ width: '100%', aspectRatio: 1, borderRadius: dt.radii.sm }}
              />
              <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <SkeletonRow width="80%" height={10} />
                <SkeletonRow width="50%" height={11} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Full dashboard skeleton matching actual layout */
export function DashboardSkeleton() {
  const screenWidth = Dimensions.get('window').width;
  const actionWidth = (screenWidth - spacing[4] * 2 - spacing[3]) / 2;

  return (
    <View style={styles.dashboardWrap}>
      {/* Revenue Hero */}
      <View style={styles.revenueHero}>
        <SkeletonPulse style={{ width: 180, height: 42, borderRadius: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <SkeletonRow width={100} height={14} />
          <SkeletonPulse style={{ width: 48, height: 22, borderRadius: dt.radii.sm }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing[4] }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonPulse
              key={i}
              style={{ width: 60, height: 32, borderRadius: dt.radii.full }}
            />
          ))}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.skeletonStatsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonStatCard}>
            <SkeletonPulse style={{ width: 36, height: 36, borderRadius: dt.radii.md }} />
            <SkeletonRow width={50} height={20} />
            <SkeletonRow width={60} height={11} />
          </View>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.skeletonSection}>
        <SkeletonRow width={140} height={16} />
        <View style={styles.skeletonChartCard}>
          <View style={styles.skeletonChartBars}>
            {[45, 70, 30, 80, 55, 40, 65, 50].map((h, i) => (
              <SkeletonPulse
                key={i}
                style={{ flex: 1, height: h, borderRadius: 3 }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.skeletonSection}>
        <SkeletonRow width={100} height={16} />
        <View style={styles.skeletonActionsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonPulse
              key={i}
              style={{
                width: actionWidth,
                height: 64,
                borderRadius: dt.radii.lg,
              }}
            />
          ))}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.skeletonSection}>
        <SkeletonRow width={110} height={16} />
        <View style={styles.skeletonOrdersCard}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonOrderRow,
                i < 4 && { borderBottomWidth: 1, borderBottomColor: dt.colors.ink[100] },
              ]}
            >
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <SkeletonRow width={80} height={14} />
                  <SkeletonPulse style={{ width: 50, height: 20, borderRadius: dt.radii.sm }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <SkeletonRow width={100} height={12} />
                  <SkeletonRow width={60} height={14} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: dt.colors.ink[200],
  },
  card: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  // Product - matches productCard in products/index.tsx
  productCard: {
    minHeight: 72,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: dt.radii.md,
  },
  productInfo: {
    flex: 1,
    gap: 6,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  // Order - matches orderCard in orders/index.tsx
  orderCard: {
    gap: spacing[2],
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderInfo: {
    flex: 1,
    gap: 8,
  },
  // Customer - matches customerCard in customers/index.tsx
  customerCard: {},
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  customerInfo: {
    flex: 1,
    gap: 6,
  },
  // POS grid
  posGridWrap: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[3],
    gap: spacing[2],
  },
  posGridRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  posGridTile: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: spacing[1],
    alignItems: 'center',
  },
  // Dashboard
  dashboardWrap: {
    gap: 0,
  },
  revenueHero: {
    backgroundColor: dt.colors.surface.card,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
    gap: spacing[3],
  },
  skeletonStatCard: {
    flex: 1,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: spacing[3],
    alignItems: 'center',
    gap: spacing[2],
  },
  skeletonSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
    gap: spacing[3],
  },
  skeletonChartCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: spacing[3],
    height: 160,
  },
  skeletonChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    flex: 1,
  },
  skeletonActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  skeletonOrdersCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  skeletonOrderRow: {
    padding: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: dt.colors.surface.card,
    borderRadius: 16,
    padding: spacing[4],
    gap: spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },

});
