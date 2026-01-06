import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardSummary } from '@/hooks';
import { useAuthStore } from '@/stores';
import {
  Text,
  Title,
  Subtitle,
  Card,
  Badge,
  OrderStatusBadge,
  LoadingScreen,
  EmptyState,
  colors,
  spacing,
  borderRadius,
} from '@/components/ui';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const currentStore = useAuthStore((s) => s.currentStore);
  const {
    data: summary,
    isLoading,
    refetch,
    isRefetching,
  } = useDashboardSummary('today');

  if (isLoading) {
    return <LoadingScreen message="טוען נתונים..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text color="secondary">שלום 👋</Text>
            <Title>{currentStore?.name || 'החנות שלי'}</Title>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            label="מכירות היום"
            value={formatCurrency(summary?.revenue.total || 0)}
            change={summary?.revenue.change}
            onPress={() => router.push('/(tabs)/orders')}
          />
          <StatCard
            label="הזמנות"
            value={String(summary?.revenue.orders || 0)}
            change={summary?.orders.change}
            onPress={() => router.push('/(tabs)/orders')}
          />
          <StatCard
            label="ממוצע"
            value={formatCurrency(summary?.revenue.avgOrderValue || 0)}
            onPress={() => router.push('/(tabs)/orders')}
          />
        </View>

        {/* Alerts Section */}
        {(summary?.orders.pending || summary?.products.lowStock || summary?.products.outOfStock) ? (
          <Card style={styles.alertsCard}>
            <Subtitle style={styles.sectionTitle}>דורש טיפול 🔔</Subtitle>
            
            {summary.orders.pending > 0 && (
              <AlertRow
                icon="📦"
                text={`${summary.orders.pending} הזמנות ממתינות`}
                onPress={() => router.push('/(tabs)/orders?status=pending')}
              />
            )}
            
            {summary.products.lowStock > 0 && (
              <AlertRow
                icon="📉"
                text={`${summary.products.lowStock} מוצרים במלאי נמוך`}
                onPress={() => router.push('/(tabs)/products?filter=lowStock')}
              />
            )}
            
            {summary.products.outOfStock > 0 && (
              <AlertRow
                icon="🚫"
                text={`${summary.products.outOfStock} מוצרים אזלו`}
                onPress={() => router.push('/(tabs)/products?filter=outOfStock')}
              />
            )}
          </Card>
        ) : null}

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Subtitle>הזמנות אחרונות</Subtitle>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text color="secondary" size="sm">
                הכל ←
              </Text>
            </TouchableOpacity>
          </View>

          {summary?.recentOrders && summary.recentOrders.length > 0 ? (
            summary.recentOrders.slice(0, 5).map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onPress={() => router.push(`/(tabs)/orders/${order.id}`)}
              />
            ))
          ) : (
            <Card>
              <Text color="secondary" center>
                אין הזמנות אחרונות
              </Text>
            </Card>
          )}
        </View>

        {/* Top Products */}
        {summary?.topProducts && summary.topProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Subtitle>מוצרים מובילים</Subtitle>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text color="secondary" size="sm">
                  הכל ←
                </Text>
              </TouchableOpacity>
            </View>

            {summary.topProducts.slice(0, 3).map((product, index) => (
              <Card key={product.id} style={styles.productRow}>
                <View style={styles.productContent}>
                  <View style={styles.productRank}>
                    <Text weight="bold" color="secondary">
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text weight="medium" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text color="secondary" size="sm">
                      {product.quantity} נמכרו
                    </Text>
                  </View>
                  <Text weight="semiBold" style={{ color: colors.success }}>
                    {formatCurrency(product.revenue)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Spacer for bottom */}
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  change,
  onPress,
}: {
  label: string;
  value: string;
  change?: number;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.statCard}>
      <Text color="secondary" size="sm">
        {label}
      </Text>
      <Text size="xl" weight="bold" style={styles.statValue}>
        {value}
      </Text>
      {change !== undefined && (
        <Text
          size="xs"
          style={{ color: change >= 0 ? colors.success : colors.error }}
        >
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
        </Text>
      )}
    </Card>
  );
}

// Alert Row Component
function AlertRow({
  icon,
  text,
  onPress,
}: {
  icon: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.alertRow} onPress={onPress}>
      <Text style={styles.alertIcon}>{icon}</Text>
      <Text style={styles.alertText}>{text}</Text>
      <Text color="muted">←</Text>
    </TouchableOpacity>
  );
}

// Order Row Component
function OrderRow({
  order,
  onPress,
}: {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  };
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.orderRow}>
      <View style={styles.orderContent}>
        <View style={styles.orderMain}>
          <Text weight="semiBold">#{order.orderNumber}</Text>
          <Text color="secondary" size="sm" numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <View style={styles.orderRight}>
          <Text weight="medium">{formatCurrency(order.total)}</Text>
          <View style={styles.orderMeta}>
            <OrderStatusBadge status={order.status} size="sm" />
            <Text color="muted" size="xs" style={styles.orderTime}>
              {formatRelativeDate(order.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    marginVertical: spacing[1],
  },
  alertsCard: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  alertRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  alertIcon: {
    fontSize: 20,
    marginLeft: spacing[3],
  },
  alertText: {
    flex: 1,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  orderRow: {
    marginBottom: spacing[2],
  },
  orderContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  orderMain: {
    flex: 1,
  },
  orderRight: {
    alignItems: 'flex-start',
  },
  orderMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: spacing[1],
    gap: spacing[2],
  },
  orderTime: {
    marginRight: spacing[2],
  },
  productRow: {
    marginBottom: spacing[2],
  },
  productContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  productRank: {
    width: 32,
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
});

