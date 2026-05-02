import React, { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFullAnalytics } from '@/hooks';
import {
  Text,
  ScreenHeader,
  StatCard,
  designTokens,
  fonts,
} from '@/components/ui';
import { SkeletonRow, SkeletonCard } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/format';
import { showToast } from '@/lib/utils/toast';

const { width } = Dimensions.get('window');
const dt = designTokens;
const tileWidth = (width - dt.spacing[4] * 2 - dt.spacing[3]) / 2;

type Period = 'today' | 'week' | 'month' | 'year';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'שבוע' },
  { key: 'month', label: 'חודש' },
  { key: 'year', label: 'שנה' },
];

interface ReportLink {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** If null, the card is shown as "בקרוב" (coming soon). */
  href: string | null;
  badge?: string;
}

function getReportLinks(): ReportLink[] {
  return [
    {
      key: 'sales',
      title: 'מכירות',
      description: 'הכנסות, הזמנות, מוצרים מובילים',
      icon: 'trending-up-outline',
      color: dt.colors.brand[500],
      href: '/(tabs)/analytics/sales',
    },
    {
      key: 'products',
      title: 'מוצרים',
      description: 'דוח מכירות לפי מוצר',
      icon: 'cube-outline',
      color: dt.colors.semantic.success.DEFAULT,
      href: '/(tabs)/analytics/products',
      badge: 'חדש',
    },
    {
      key: 'customers',
      title: 'לקוחות',
      description: 'פילוח, VIP, חוזרים',
      icon: 'people-outline',
      color: dt.colors.semantic.info.DEFAULT,
      href: '/(tabs)/analytics/customers',
    },
    {
      key: 'inventory',
      title: 'מלאי',
      description: 'מלאי נמוך, אזל, צילום מלאי',
      icon: 'archive-outline',
      color: dt.colors.semantic.warning.DEFAULT,
      href: '/(tabs)/analytics/inventory',
    },
    {
      key: 'coupons',
      title: 'קופונים',
      description: 'שימוש, הנחות, ביצועים',
      icon: 'pricetag-outline',
      color: dt.colors.accent[500],
      href: '/(tabs)/analytics/coupons',
    },
    {
      key: 'shipping',
      title: 'משלוחים',
      description: 'משלוח חינם, ממוצע, ספקים',
      icon: 'car-outline',
      color: dt.colors.semantic.info.dark,
      href: null,
    },
    {
      key: 'financial',
      title: 'דוח פיננסי',
      description: 'החזרים, גיפט קארדים, זיכויים',
      icon: 'cash-outline',
      color: dt.colors.semantic.success.dark,
      href: null,
    },
    {
      key: 'gift-cards',
      title: 'גיפט קארדים',
      description: 'יתרה, שימוש, תנועות',
      icon: 'gift-outline',
      color: '#9333EA',
      href: null,
    },
    {
      key: 'traffic',
      title: 'תנועה',
      description: 'מקורות, מכשירים, דפי נחיתה',
      icon: 'globe-outline',
      color: '#0891B2',
      href: null,
    },
    {
      key: 'utm',
      title: 'UTM מפורט',
      description: 'קמפיינים, מקורות, מילות מפתח',
      icon: 'link-outline',
      color: '#DB2777',
      href: null,
    },
    {
      key: 'behavior',
      title: 'התנהגות',
      description: 'משפך המרה, חיפושים, נטישות',
      icon: 'compass-outline',
      color: '#65A30D',
      href: null,
    },
    {
      key: 'realtime',
      title: 'זמן אמת',
      description: 'מבקרים פעילים, מכירות חיות',
      icon: 'flash-outline',
      color: dt.colors.semantic.warning.DEFAULT,
      href: null,
    },
    {
      key: 'addons',
      title: 'תוספות',
      description: 'הכנסות מתוספות מוצר',
      icon: 'add-circle-outline',
      color: dt.colors.brand[700],
      href: null,
    },
  ];
}

export default function AnalyticsHubScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: analytics, isLoading, refetch } = useFullAnalytics({
    period: selectedPeriod,
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refetch(); } finally { setIsRefreshing(false); }
  }, [refetch]);

  const summary = analytics?.summary;
  const links = getReportLinks();

  const handleCardPress = (link: ReportLink) => {
    if (!link.href) {
      showToast('הדוח יזמין בקרוב', 'info');
      return;
    }
    router.push(link.href as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="דוחות ואנליטיקס" onBack={null} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={dt.colors.brand[500]}
          />
        }
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => {
            const active = selectedPeriod === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodPill, active && styles.periodPillActive]}
                onPress={() => setSelectedPeriod(p.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero KPIs */}
        {isLoading ? (
          <SkeletonCard style={styles.heroSkeleton}>
            <SkeletonRow width="40%" height={16} />
            <SkeletonRow width="80%" height={32} />
            <SkeletonRow width="50%" height={14} />
          </SkeletonCard>
        ) : (
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>סך הכנסות</Text>
            <Text style={styles.heroValue}>{formatCurrency(summary?.revenue ?? 0)}</Text>
            {typeof summary?.revenueChange === 'number' && summary.revenueChange !== 0 && (
              <View style={styles.heroChangeRow}>
                <Ionicons
                  name={summary.revenueChange >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={
                    summary.revenueChange >= 0
                      ? dt.colors.semantic.success.DEFAULT
                      : dt.colors.semantic.danger.DEFAULT
                  }
                />
                <Text
                  style={[
                    styles.heroChange,
                    {
                      color:
                        summary.revenueChange >= 0
                          ? dt.colors.semantic.success.DEFAULT
                          : dt.colors.semantic.danger.DEFAULT,
                    },
                  ]}
                >
                  {Math.abs(summary.revenueChange)}% מהתקופה הקודמת
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick KPI tiles */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiTile}>
            <StatCard
              label="הזמנות"
              value={String(summary?.orders ?? 0)}
              icon={<Ionicons name="cart-outline" size={18} color={dt.colors.brand[500]} />}
              accentColor={dt.colors.brand[500]}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="לקוחות חדשים"
              value={String(summary?.customers ?? 0)}
              icon={<Ionicons name="people-outline" size={18} color={dt.colors.semantic.info.DEFAULT} />}
              accentColor={dt.colors.semantic.info.DEFAULT}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="ממוצע להזמנה"
              value={formatCurrency(summary?.avgOrderValue ?? 0)}
              icon={<Ionicons name="analytics-outline" size={18} color={dt.colors.accent[500]} />}
              accentColor={dt.colors.accent[500]}
            />
          </View>
          <View style={styles.kpiTile}>
            <StatCard
              label="המרה"
              value={`${(summary?.conversionRate ?? 0).toFixed(1)}%`}
              icon={<Ionicons name="trending-up-outline" size={18} color={dt.colors.semantic.warning.DEFAULT} />}
              accentColor={dt.colors.semantic.warning.DEFAULT}
            />
          </View>
        </View>

        {/* Reports grid */}
        <Text style={styles.sectionTitle}>כל הדוחות</Text>
        <View style={styles.reportsGrid}>
          {links.map((link) => (
            <TouchableOpacity
              key={link.key}
              style={[styles.reportCard, { width: tileWidth }]}
              onPress={() => handleCardPress(link)}
              activeOpacity={0.75}
            >
              <View style={[styles.reportIconBox, { backgroundColor: `${link.color}14` }]}>
                <Ionicons name={link.icon} size={22} color={link.color} />
              </View>
              <View style={styles.reportTextWrap}>
                <View style={styles.reportTitleRow}>
                  <Text style={styles.reportTitle}>{link.title}</Text>
                  {link.badge ? (
                    <View style={styles.reportBadge}>
                      <Text style={styles.reportBadgeText}>{link.badge}</Text>
                    </View>
                  ) : null}
                  {!link.href ? (
                    <View style={[styles.reportBadge, styles.reportBadgeMuted]}>
                      <Text style={[styles.reportBadgeText, styles.reportBadgeTextMuted]}>בקרוב</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.reportDescription} numberOfLines={2}>
                  {link.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: dt.spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dt.colors.surface.background },
  scrollContent: {
    padding: dt.spacing[4],
    gap: dt.spacing[4],
  },
  periodRow: {
    flexDirection: 'row',
    gap: dt.spacing[2],
  },
  periodPill: {
    flex: 1,
    paddingVertical: dt.spacing[2],
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.ink[50],
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: dt.colors.brand[500],
  },
  periodText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[600],
  },
  periodTextActive: {
    color: dt.colors.surface.onBrand,
  },
  heroCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[5],
    alignItems: 'flex-start',
    gap: dt.spacing[1],
  },
  heroSkeleton: {
    gap: dt.spacing[2],
    padding: dt.spacing[5],
  },
  heroLabel: {
    fontSize: 13,
    color: dt.colors.ink[500],
    textAlign: 'right',
  },
  heroValue: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  heroChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: dt.spacing[1],
  },
  heroChange: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dt.spacing[3],
  },
  kpiTile: {
    width: tileWidth,
    height: 116,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
    marginTop: dt.spacing[2],
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dt.spacing[3],
  },
  reportCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[3],
    gap: dt.spacing[2],
  },
  reportIconBox: {
    width: 40,
    height: 40,
    borderRadius: dt.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTextWrap: {
    gap: 2,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  reportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: dt.radii.sm,
    backgroundColor: dt.colors.brand[50],
  },
  reportBadgeMuted: {
    backgroundColor: dt.colors.ink[100],
  },
  reportBadgeText: {
    fontSize: 9,
    fontFamily: fonts.medium,
    color: dt.colors.brand[700],
  },
  reportBadgeTextMuted: {
    color: dt.colors.ink[500],
  },
  reportDescription: {
    fontSize: 11,
    color: dt.colors.ink[500],
    lineHeight: 14,
    textAlign: 'right',
  },
});
