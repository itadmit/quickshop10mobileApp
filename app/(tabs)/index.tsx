import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
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
  Subtitle,
  Card,
  OrderStatusBadge,
  LoadingScreen,
  colors,
  spacing,
  borderRadius,
  shadows,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 18) return 'צהריים טובים';
    return 'ערב טוב';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {currentStore?.name?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.greetingText}>
                <Text style={styles.greetingLabel}>{getGreeting()},</Text>
                <Text style={styles.userName}>{currentStore?.name || 'החנות שלי'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color={colors.gray600} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
            style={{ direction: 'rtl' }}
          >
            <FilterButton label="היום" active />
            <FilterButton label="אתמול" />
            <FilterButton label="השבוע" />
            <FilterButton label="החודש" />
          </ScrollView>
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Subtitle style={styles.sectionTitle}>סקירה כללית</Subtitle>
            </View>
            <TouchableOpacity>
              <Text style={styles.fullReportLink}>
                דוח מלא <Ionicons name="chevron-back" size={12} />
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
            snapToInterval={280}
            snapToAlignment="start"
            decelerationRate="fast"
            style={{ direction: 'rtl' }}
          >
            <StatCard
              label="סה״כ מכירות"
              value={formatCurrency(summary?.revenue?.total || 0)}
              change={summary?.revenue?.change}
              icon="cash-outline"
              iconColor="#00785C"
              iconBg="#E4F8F0"
              accentColor="#00785C"
            />
            <StatCard
              label="הזמנות"
              value={String(summary?.revenue?.orders || 0)}
              change={summary?.orders?.change}
              icon="bag-outline"
              iconColor="#0066CC"
              iconBg="#E6F2FF"
              accentColor="#0066CC"
            />
            <StatCard
              label="מבקרים"
              value="340"
              change={-2}
              icon="people-outline"
              iconColor="#8B5CF6"
              iconBg="#F3F0FF"
              accentColor="#8B5CF6"
            />
          </ScrollView>
        </View>

        {/* Action Required */}
        {(summary?.orders?.pending || summary?.products?.lowStock || summary?.products?.outOfStock) ? (
          <View style={styles.section}>
            <Card style={styles.alertCard} padding={4}>
              <View style={styles.alertContent}>
                <View style={styles.alertIconContainer}>
                  <Ionicons name="warning" size={24} color="#F59E0B" />
                </View>
                <View style={styles.alertTextContainer}>
                  <Text weight="bold" style={styles.alertTitle}>דורש טיפול</Text>
                  <Text style={styles.alertDescription}>
                    {summary?.products?.lowStock || 0} מוצרים במלאי נמוך • {summary?.orders?.pending || 0} הזמנות להכנה
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.alertButton}
                  onPress={() => router.push('/(tabs)/orders?status=pending')}
                >
                  <Text style={styles.alertButtonText}>טפל כעת</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Subtitle style={styles.sectionTitle}>פעולות מהירות</Subtitle>
          </View>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="add-circle-outline"
              label="הוסף מוצר"
              onPress={() => router.push('/(tabs)/products')}
              primary
            />
            <QuickActionButton
              icon="document-text-outline"
              label="צור הזמנה"
              onPress={() => router.push('/(tabs)/orders')}
              primary
            />
            <QuickActionButton
              icon="pricetag-outline"
              label="הנחות"
              onPress={() => router.push('/(tabs)/more')}
            />
            <QuickActionButton
              icon="color-palette-outline"
              label="עיצוב חנות"
              onPress={() => router.push('/(tabs)/more')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Subtitle style={styles.sectionTitle}>פעילות אחרונה</Subtitle>
          </View>
          {summary?.recentOrders && summary.recentOrders.length > 0 ? (
            <View style={styles.activityList}>
              {summary.recentOrders.slice(0, 5).map((order) => (
                <ActivityItem
                  key={order.id}
                  order={order}
                  onPress={() => router.push(`/(tabs)/orders/${order.id}`)}
                />
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard} padding={6}>
              <Text color="secondary" center>
                אין פעילות אחרונה
              </Text>
            </Card>
          )}
        </View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Filter Button
function FilterButton({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <TouchableOpacity 
      style={[styles.filterButton, active && styles.filterButtonActive]}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Decorative Wave Background
function WaveBackground({ color }: { color: string }) {
  return (
    <View style={styles.waveContainer}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 260 140"
        preserveAspectRatio="none"
        style={styles.waveSvg}
      >
        <Path
          d="M0,40 C60,20 100,60 160,40 C220,20 260,40 260,40 L260,140 L0,140 Z"
          fill={color}
          opacity="0.1"
        />
      </Svg>
    </View>
  );
}

// Stat Card
function StatCard({
  label,
  value,
  change,
  icon,
  iconColor,
  iconBg,
  accentColor,
}: {
  label: string;
  value: string;
  change?: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  accentColor: string;
}) {
  return (
    <Card style={styles.statCard} padding={5}>
      {/* Decorative Wave Background */}
      <WaveBackground color={accentColor} />
      
      <View style={styles.statCardHeader}>
        <View style={styles.statCardText}>
          <Text style={styles.statCardLabel}>{label}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
        </View>
        <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      </View>
      {change !== undefined && (
        <View style={styles.statChangeContainer}>
          <View style={[
            styles.changeBadge,
            change >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative
          ]}>
            <Ionicons 
              name={change >= 0 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={change >= 0 ? '#059669' : '#DC2626'} 
            />
            <Text style={[
              styles.changeText,
              change >= 0 ? styles.changeTextPositive : styles.changeTextNegative
            ]}>
              {Math.abs(change)}%
            </Text>
          </View>
          <Text style={styles.changeLabel}>בהשוואה לאתמול</Text>
        </View>
      )}
    </Card>
  );
}

// Quick Action Button
function QuickActionButton({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.quickActionIcon,
        primary ? styles.quickActionIconPrimary : styles.quickActionIconSecondary
      ]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={primary ? '#00785C' : colors.gray600} 
        />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Activity Item
function ActivityItem({
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'confirmed': return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'delivered': return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  const statusColors = getStatusColor(order.status);
  const statusLabels: Record<string, string> = {
    pending: 'ממתינה',
    confirmed: 'אושרה',
    processing: 'בטיפול',
    shipped: 'נשלחה',
    delivered: 'הושלם',
    cancelled: 'בוטלה',
  };

  return (
    <TouchableOpacity 
      style={styles.activityItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.activityIcon}>
        <Ionicons name="bag-outline" size={20} color={colors.gray500} />
      </View>
      <View style={styles.activityContent}>
        <Text weight="semiBold" style={[styles.activityTitle, { textAlign: 'right' }]}>
          הזמנה #{order.orderNumber}
        </Text>
        <Text style={[styles.activitySubtitle, { textAlign: 'right' }]}>
          {order.customerName} • {formatRelativeDate(order.createdAt)}
        </Text>
      </View>
      <View style={styles.activityRight}>
        <Text weight="bold" style={styles.activityAmount}>
          {formatCurrency(order.total)}
        </Text>
        <View style={[
          styles.activityStatusBadge,
          { backgroundColor: statusColors.bg, borderColor: statusColors.border }
        ]}>
          <Text style={[styles.activityStatusText, { color: statusColors.text }]}>
            {statusLabels[order.status] || order.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white, // לבן מעל ההדר
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F6F6F7', // רקע אפור מתחת להדר
  },
  scrollContent: {
    paddingBottom: spacing[10],
    backgroundColor: '#F6F6F7',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
    marginTop: spacing[0],
  },
  headerContent: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (פרופיל מימין, טקסט משמאל)
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E1E3E5',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00785C',
    borderWidth: 2,
    borderColor: colors.white,
  },
  greetingText: {
    alignItems: 'flex-start',
  },
  greetingLabel: {
    fontSize: 12,
    color: '#6D7175',
    fontFamily: 'Assistant_500Medium',
    textAlign: 'right',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202223',
    marginTop: 2,
    textAlign: 'right',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: colors.white,
  },
  filtersContainer: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  filtersScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterButton: {
    height: 32,
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#00785C',
    borderColor: '#00785C',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Assistant_500Medium',
    color: '#6D7175',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: colors.white,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitleContainer: {
    alignItems: 'flex-start',

    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202223',
    letterSpacing: -0.2,
    textAlign: 'right',
  },
  fullReportLink: {
    fontSize: 12,
    color: '#00785C',
    fontFamily: 'Assistant_500Medium',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  statsScroll: {
    gap: spacing[4],
    paddingRight: spacing[4],
  },
  statCard: {
    width: 260,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    backgroundColor: colors.white,
    ...shadows.base,
    overflow: 'hidden',
    position: 'relative',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 0,
  },
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  statCardHeader: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (טקסט מימין, אייקון משמאל)
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    zIndex: 1,
    position: 'relative',
  },
  statCardText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statCardLabel: {
    fontSize: 14,
    fontFamily: 'Assistant_500Medium',
    color: '#6D7175',
    marginBottom: spacing[1],
    textAlign: 'left',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202223',
    letterSpacing: -0.5,
    textAlign: 'right',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3], // ב-RTL, marginRight = שמאל המסך
  },
  statChangeContainer: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    zIndex: 1,
    position: 'relative',
  },
  changeBadge: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (אייקון מימין, טקסט משמאל)
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.base,
    borderWidth: 1,
  },
  changeBadgePositive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  changeBadgeNegative: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2, // ב-RTL, marginLeft = רווח מימין
  },
  changeTextPositive: {
    color: '#059669',
  },
  changeTextNegative: {
    color: '#DC2626',
  },
  changeLabel: {
    fontSize: 12,
    color: '#6D7175',
    textAlign: 'right',
  },
  alertCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  alertContent: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (אייקון מימין, טקסט משמאל)
    alignItems: 'center',
    gap: spacing[4],
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  alertTitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
    textAlign: 'right',
  },
  alertDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  alertButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  alertButtonText: {
    fontSize: 12,
    fontFamily: 'Assistant_500Medium',
    color: '#374151',
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  quickActionButton: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (אייקון מימין, טקסט משמאל)
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconPrimary: {
    backgroundColor: '#E4F8F0',
  },
  quickActionIconSecondary: {
    backgroundColor: '#F6F6F7',
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Assistant_500Medium',
    color: '#202223',
    textAlign: 'left',
    flexDirection: 'row-reverse',
  },
  activityList: {
    gap: spacing[3],
  },
  activityItem: {
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (אייקון מימין, תוכן במרכז, סכום משמאל)
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  activityTitle: {
    fontSize: 14,
    color: '#202223',
    marginBottom: 2,
    textAlign: 'right',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6D7175',
    textAlign: 'right',
  },
  activityRight: {
    alignItems: 'flex-start', // ב-RTL עם row, flex-start = שמאל המסך (ימין מבחינת RTL)
    gap: spacing[1],
  },
  activityAmount: {
    fontSize: 14,
    color: '#202223',
    textAlign: 'right',
  },
  activityStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  activityStatusText: {
    fontSize: 10,
    fontFamily: 'Assistant_500Medium',
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing[6],
    alignItems: 'center',
    borderStyle: 'dashed',
    borderColor: colors.gray300,
    backgroundColor: 'transparent',
  },
});