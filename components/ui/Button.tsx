import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from './Text';
import { colors, spacing, borderRadius, fonts, fontSizes } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.white },
  secondary: { bg: colors.secondary, text: colors.white },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.textPrimary },
  danger: { bg: colors.error, text: colors.white },
};

const sizeStyles: Record<ButtonSize, { padding: number; fontSize: number; iconSize: number }> = {
  sm: { padding: spacing[2], fontSize: fontSizes.sm, iconSize: 16 },
  md: { padding: spacing[3], fontSize: fontSizes.base, iconSize: 20 },
  lg: { padding: spacing[4], fontSize: fontSizes.lg, iconSize: 24 },
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'right',
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: variantStyle.bg,
          paddingVertical: sizeStyle.padding,
          paddingHorizontal: sizeStyle.padding * 1.5,
          borderColor: variantStyle.border || 'transparent',
          borderWidth: variantStyle.border ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'right' && (
            <Text style={{ marginLeft: spacing[2], color: variantStyle.text }}>
              {icon}
            </Text>
          )}
          <Text
            weight="semiBold"
            style={[
              {
                color: variantStyle.text,
                fontSize: sizeStyle.fontSize,
                fontFamily: fonts.semiBold,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === 'left' && (
            <Text style={{ marginRight: spacing[2], color: variantStyle.text }}>
              {icon}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

