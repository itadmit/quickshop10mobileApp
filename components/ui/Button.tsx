import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Text } from './Text';
import { spacing, fonts, fontSizes, designTokens } from './theme';

const dt = designTokens;

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
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
  /** Where the icon sits relative to the text. RTL-aware. */
  iconPosition?: 'leading' | 'trailing';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: dt.colors.brand[500], text: '#FFFFFF' },
  secondary: { bg: dt.colors.ink[100], text: dt.colors.ink[950] },
  outline: { bg: 'transparent', text: dt.colors.ink[950], border: dt.colors.ink[200] },
  ghost: { bg: 'transparent', text: dt.colors.ink[950] },
  danger: { bg: dt.colors.semantic.danger.DEFAULT, text: '#FFFFFF' },
  accent: { bg: dt.colors.accent[500], text: '#FFFFFF' },
};

const sizeStyles: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number; minHeight: number }> = {
  sm: { paddingV: spacing[2], paddingH: spacing[3], fontSize: fontSizes.sm, minHeight: 44 },
  md: { paddingV: spacing[2.5], paddingH: spacing[4], fontSize: fontSizes.base, minHeight: 44 },
  lg: { paddingV: spacing[3.5], paddingH: spacing[5], fontSize: fontSizes.base, minHeight: 48 },
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
  iconPosition = 'leading',
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.base,
          {
            backgroundColor: variantStyle.bg,
            paddingVertical: sizeStyle.paddingV,
            paddingHorizontal: sizeStyle.paddingH,
            borderColor: variantStyle.border || 'transparent',
            borderWidth: variantStyle.border ? 1 : 0,
            minHeight: sizeStyle.minHeight,
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
            {icon && iconPosition === 'leading' && (
              <Text style={{ marginEnd: spacing[2], color: variantStyle.text }}>
                {icon}
              </Text>
            )}
            <Text
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
            {icon && iconPosition === 'trailing' && (
              <Text style={{ marginStart: spacing[2], color: variantStyle.text }}>
                {icon}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dt.radii.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
