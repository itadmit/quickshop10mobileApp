import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { designTokens, fonts } from './theme';

const { colors, spacing, radii } = designTokens;

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger' | 'return';

interface BannerVariantStyle {
  bg: string;
  border: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const VARIANTS: Record<BannerVariant, BannerVariantStyle> = {
  info: {
    bg: colors.semantic.info.light,
    border: '#BFDBFE',
    fg: colors.semantic.info.dark,
    icon: 'information-circle',
  },
  success: {
    bg: colors.semantic.success.light,
    border: '#BBF7D0',
    fg: colors.semantic.success.dark,
    icon: 'checkmark-circle',
  },
  warning: {
    bg: colors.semantic.warning.light,
    border: '#FED7AA',
    fg: colors.semantic.warning.dark,
    icon: 'warning',
  },
  danger: {
    bg: colors.semantic.danger.light,
    border: '#FECACA',
    fg: colors.semantic.danger.dark,
    icon: 'alert-circle',
  },
  return: {
    bg: colors.semantic.return.light,
    border: '#FED7AA',
    fg: colors.semantic.return.dark,
    icon: 'return-down-back',
  },
};

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onClose?: () => void;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Banner({
  variant = 'info',
  title,
  message,
  icon,
  onClose,
  action,
  style,
  children,
}: BannerProps) {
  const v = VARIANTS[variant];
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <Ionicons name={icon ?? v.icon} size={20} color={v.fg} style={styles.icon} />
      <View style={styles.body}>
        {title ? (
          <Text style={[styles.title, { color: v.fg }]}>{title}</Text>
        ) : null}
        {message ? (
          <Text style={[styles.message, { color: v.fg }]}>{message}</Text>
        ) : null}
        {children}
        {action ? (
          <TouchableOpacity onPress={action.onPress} hitSlop={8} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: v.fg }]}>{action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onClose ? (
        <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={v.fg} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionBtn: {
    marginTop: spacing[1],
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    textDecorationLine: 'underline',
  },
  closeBtn: {
    padding: 2,
    marginTop: -2,
  },
});
