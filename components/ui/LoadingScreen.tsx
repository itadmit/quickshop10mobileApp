import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from './theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'טוען...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text color="secondary" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

export function LoadingOverlay({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <Text style={styles.overlayMessage}>{message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  message: {
    marginTop: spacing[4],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: colors.surface,
    padding: spacing[6],
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayMessage: {
    marginTop: spacing[3],
  },
});

