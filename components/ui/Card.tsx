import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from './theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  shadow?: keyof typeof shadows;
}

export function Card({
  children,
  onPress,
  style,
  padding = 4,
  shadow = 'sm',
}: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        shadows[shadow],
        { padding: spacing[padding] },
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing[3],
  },
  content: {
    // Default styles for content
  },
  footer: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing[3],
  },
});

