import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { spacing, borderRadius, shadows, designTokens } from './theme';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardRadius = keyof typeof designTokens.radii;

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  shadow?: keyof typeof shadows;
  variant?: CardVariant;
  /** Override the default border radius. Defaults to "lg" for variants and "md" for unstyled cards. */
  radius?: CardRadius;
}

const variantStyleMap: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: designTokens.colors.surface.card,
    ...shadows.sm,
  },
  outlined: {
    backgroundColor: designTokens.colors.surface.card,
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  filled: {
    backgroundColor: designTokens.colors.ink[100],
  },
};

// מינימליסטי - כרטיסים נקיים בלי צללים כבדים
export function Card({
  children,
  onPress,
  style,
  padding = 4,
  shadow = 'none',
  variant,
  radius,
}: CardProps) {
  const appliedShadow = variant ? {} : shadows[shadow];
  const appliedVariant = variant ? variantStyleMap[variant] : {};
  // Default to radii.lg for variant cards (matches the rest of the app),
  // borderRadius.md for plain ones (back-compat).
  const appliedRadius = radius
    ? designTokens.radii[radius]
    : variant
      ? designTokens.radii.lg
      : borderRadius.md;

  const content = (
    <View
      style={[
        styles.card,
        appliedShadow,
        appliedVariant,
        { padding: spacing[padding], borderRadius: appliedRadius },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Card Header
export function CardHeader({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.header, style]}>{children}</View>;
}

// Card Content
export function CardContent({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.content, style]}>{children}</View>;
}

// Card Footer
export function CardFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: borderRadius.md,
  },
  header: {
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
    marginBottom: spacing[3],
  },
  content: {
    // Default styles for content
  },
  footer: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.ink[200],
    marginTop: spacing[3],
  },
});
