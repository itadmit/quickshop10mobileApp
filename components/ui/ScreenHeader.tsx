import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from './Text';
import { designTokens, fonts } from './theme';

const dt = designTokens;

interface ScreenHeaderProps {
  title: string;
  /** Defaults to router.back(). Pass null to omit the back button. */
  onBack?: (() => void) | null;
  /** Optional trailing element (e.g. action button). */
  trailing?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Shared, RTL-aware screen header used by every native screen so the title
 * placement, weight, and underline match the Tabs root header.
 */
export function ScreenHeader({ title, onBack, trailing, style }: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack === undefined ? () => router.back() : onBack;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {handleBack ? (
          <TouchableOpacity onPress={handleBack} hitSlop={10} accessibilityLabel="חזור">
            <Ionicons name="chevron-forward" size={24} color={dt.colors.ink[800]} />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideEnd]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dt.spacing[4],
    paddingTop: dt.spacing[3],
    paddingBottom: dt.spacing[3],
    backgroundColor: dt.colors.surface.card,
  },
  side: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    textAlign: 'center',
  },
});
