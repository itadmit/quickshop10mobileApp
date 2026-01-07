import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from './theme';

type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
type FontSize = keyof typeof fontSizes;
type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'error' | 'success' | 'warning';

interface TextProps extends RNTextProps {
  weight?: FontWeight;
  size?: FontSize;
  color?: TextColor;
  center?: boolean;
  children: React.ReactNode;
}

const colorMap: Record<TextColor, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  inverse: colors.textInverse,
  error: colors.error,
  success: colors.success,
  warning: colors.warning,
};

export function Text({
  weight = 'regular',
  size = 'base',
  color = 'primary',
  center = false,
  style,
  children,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        { fontFamily: fonts[weight] },
        { fontSize: fontSizes[size] },
        { color: colorMap[color] },
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Convenience components
export function Title({ children, ...props }: Omit<TextProps, 'size' | 'weight'>) {
  return (
    <Text size="2xl" weight="bold" {...props}>
      {children}
    </Text>
  );
}

export function Subtitle({ children, ...props }: Omit<TextProps, 'size' | 'weight'>) {
  return (
    <Text size="lg" weight="semiBold" {...props}>
      {children}
    </Text>
  );
}

export function Body({ children, ...props }: Omit<TextProps, 'size'>) {
  return (
    <Text size="base" {...props}>
      {children}
    </Text>
  );
}

export function Caption({ children, ...props }: Omit<TextProps, 'size' | 'color'>) {
  return (
    <Text size="sm" color="secondary" {...props}>
      {children}
    </Text>
  );
}

export function Label({ children, style, ...props }: Omit<TextProps, 'size' | 'weight'>) {
  return (
    <Text size="sm" weight="medium" style={[{ textAlign: 'right' }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  center: {
    textAlign: 'center',
  },
});

