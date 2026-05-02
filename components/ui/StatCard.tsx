import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Sparkline } from './Sparkline';
import { designTokens, fonts } from './theme';

const dt = designTokens;

interface StatCardTrend {
  value: number;
  isPositive: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: StatCardTrend;
  series?: number[];
  isCurrency?: boolean;
  onPress?: () => void;
  accentColor?: string;
  /** Optional fixed width — used for horizontal scroll lists where flex:1 doesn't size. Defaults to flex:1. */
  width?: number;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  series,
  isCurrency = false,
  onPress,
  accentColor = dt.colors.brand[500],
  width,
}: StatCardProps) {
  const trendColor = trend
    ? trend.isPositive
      ? dt.colors.semantic.success.DEFAULT
      : dt.colors.semantic.danger.DEFAULT
    : accentColor;

  const content = (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${accentColor}14` }]}>
          {icon}
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trend.isPositive
                  ? dt.colors.semantic.success.light
                  : dt.colors.semantic.danger.light,
              },
            ]}
          >
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>

      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {series && series.length > 1 ? (
          <Sparkline data={series} width={56} height={20} color={trendColor} />
        ) : null}
      </View>
    </View>
  );

  const wrapStyle = width != null ? { width, height: 116 } : styles.touchable;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={wrapStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={wrapStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[3],
    justifyContent: 'space-between',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: dt.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    writingDirection: 'ltr',
    textAlign: 'right',
    alignSelf: 'stretch',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    writingDirection: 'rtl',
    textAlign: 'right',
    flexShrink: 1,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: dt.radii.sm,
  },
  trendText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
});
