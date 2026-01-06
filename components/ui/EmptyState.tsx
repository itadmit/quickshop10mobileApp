import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title } from './Text';
import { Button } from './Button';
import { colors, spacing } from './theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

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
      <Title style={styles.title} center>
        {title}
      </Title>
      {description && (
        <Text color="secondary" center style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} style={styles.button}>
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
    padding: spacing[6],
  },
  iconContainer: {
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.gray100,
    borderRadius: 100,
  },
  title: {
    marginBottom: spacing[2],
  },
  description: {
    marginBottom: spacing[4],
    maxWidth: 280,
  },
  button: {
    marginTop: spacing[2],
  },
});

