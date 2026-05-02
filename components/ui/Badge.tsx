import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { spacing, borderRadius, fontSizes, fonts, designTokens } from './theme';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

// מינימליסטי - צבעים עדינים
const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: designTokens.colors.ink[100], text: designTokens.colors.ink[500] },
  primary: { bg: designTokens.colors.brand[50], text: designTokens.colors.brand[500] },
  secondary: { bg: designTokens.colors.ink[100], text: designTokens.colors.ink[500] },
  success: { bg: designTokens.colors.semantic.success.light, text: designTokens.colors.semantic.success.DEFAULT },
  warning: { bg: designTokens.colors.semantic.warning.light, text: designTokens.colors.semantic.warning.DEFAULT },
  error: { bg: designTokens.colors.semantic.danger.light, text: designTokens.colors.semantic.danger.DEFAULT },
  info: { bg: designTokens.colors.semantic.info.light, text: designTokens.colors.semantic.info.DEFAULT },
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.bg,
          paddingVertical: isSmall ? spacing[0.5] : spacing[1],
          paddingHorizontal: isSmall ? spacing[2] : spacing[2.5],
        },
        style,
      ]}
    >
      <Text
        style={{
          color: variantStyle.text,
          fontSize: isSmall ? fontSizes.xs : fontSizes.sm,
          fontFamily: fonts.medium,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// Order Status Badge - מינימליסטי
export function OrderStatusBadge({
  status,
  size = 'md',
}: {
  status: string;
  size?: BadgeSize;
}) {
  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'ממתינה', variant: 'warning' },
    confirmed: { label: 'אושרה', variant: 'primary' },
    processing: { label: 'בטיפול', variant: 'info' },
    shipped: { label: 'נשלחה', variant: 'info' },
    delivered: { label: 'נמסרה', variant: 'success' },
    cancelled: { label: 'בוטלה', variant: 'error' },
    refunded: { label: 'זוכתה', variant: 'default' },
  };

  const config = statusMap[status] || { label: status, variant: 'default' as BadgeVariant };

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}

// Stock Badge - מינימליסטי
export function StockBadge({
  inventory,
  size = 'md',
}: {
  inventory: number | null;
  size?: BadgeSize;
}) {
  if (inventory === null) {
    return (
      <Badge variant="default" size={size}>
        ללא מעקב
      </Badge>
    );
  }

  if (inventory === 0) {
    return (
      <Badge variant="error" size={size}>
        אזל
      </Badge>
    );
  }

  if (inventory <= 5) {
    return (
      <Badge variant="warning" size={size}>
        {inventory} במלאי
      </Badge>
    );
  }

  return (
    <Badge variant="success" size={size}>
      {inventory} במלאי
    </Badge>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
});
