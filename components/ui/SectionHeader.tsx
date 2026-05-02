import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { designTokens, fonts } from './theme';

interface SectionHeaderProps {
  title: string;
  onShowAll?: () => void;
  showAllLabel?: string;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  onShowAll,
  showAllLabel = 'הצג הכל',
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text
        style={styles.title}
        weight="semiBold"
        size="base"
      >
        {title}
      </Text>
      {onShowAll && (
        <TouchableOpacity onPress={onShowAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.link}>{showAllLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing[4],
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  link: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: designTokens.colors.brand[500],
    writingDirection: 'rtl',
  },
});
