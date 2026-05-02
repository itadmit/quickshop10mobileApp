import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, spacing, borderRadius, fonts, designTokens } from './theme';

interface LoadingScreenProps {
  message?: string;
}

// מינימליסטי - מסך טעינה נקי
export function LoadingScreen({ message = 'טוען...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={designTokens.colors.brand[500]} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function LoadingOverlay({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={designTokens.colors.brand[500]} />
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
    backgroundColor: designTokens.colors.surface.card,
  },
  message: {
    marginTop: spacing[3],
    fontSize: 14,
    color: designTokens.colors.ink[400],
    fontFamily: fonts.regular,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: designTokens.colors.surface.card,
    padding: spacing[6],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 140,
  },
  overlayMessage: {
    marginTop: spacing[3],
    fontSize: 14,
    color: designTokens.colors.ink[500],
    fontFamily: fonts.regular,
  },
});
