import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { spacing, borderRadius, fonts, designTokens } from './theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// מינימליסטי - מצב ריק נקי
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="outline" style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  iconContainer: {
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: designTokens.colors.brand[50],
    borderRadius: borderRadius.full,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontSize: 14,
    color: designTokens.colors.ink[400],
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  button: {
    marginTop: spacing[4],
  },
});
