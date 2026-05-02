import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { designTokens, fonts } from './theme';
import type { OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'ממתינה',
  confirmed: 'אושרה',
  processing: 'בטיפול',
  shipped: 'נשלחה',
  delivered: 'נמסרה',
  cancelled: 'בוטלה',
  refunded: 'זוכתה',
};

type StatusBadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: StatusBadgeSize;
  style?: ViewStyle;
}

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const statusColors = designTokens.colors.orderStatus[status] || designTokens.colors.orderStatus.pending;
  const label = STATUS_LABELS[status] || status;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: statusColors.bg,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 10 : 12,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: statusColors.dot,
            width: isSmall ? 7 : 8,
            height: isSmall ? 7 : 8,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color: statusColors.text,
            fontSize: isSmall ? 12 : 13,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: designTokens.radii.full,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    borderRadius: designTokens.radii.full,
  },
  label: {
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },
});
