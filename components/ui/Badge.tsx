import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSizes } from './theme';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.gray200, text: colors.gray700 },
  primary: { bg: colors.primaryLight, text: colors.primaryDark },
  secondary: { bg: colors.secondaryLight, text: colors.secondaryDark },
  success: { bg: colors.successLight, text: '#15803d' },
  warning: { bg: colors.warningLight, text: '#b45309' },
  error: { bg: colors.errorLight, text: '#b91c1c' },
  info: { bg: colors.infoLight, text: '#0e7490' },
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
          paddingHorizontal: isSmall ? spacing[2] : spacing[3],
        },
        style,
      ]}
    >
      <Text
        weight="medium"
        style={{
          color: variantStyle.text,
          fontSize: isSmall ? fontSizes.xs : fontSizes.sm,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// Order Status Badge
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
    processing: { label: 'בטיפול', variant: 'secondary' },
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

// Stock Badge
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

