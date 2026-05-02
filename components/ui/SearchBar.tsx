import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designTokens, fonts } from './theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  isLoading?: boolean;
  actions?: React.ReactNode;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'חיפוש...',
  onSubmitEditing,
  isLoading = false,
  actions,
  style,
}: SearchBarProps) {
  const { colors, spacing, radii } = designTokens;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputWrapper}>
        <Ionicons
          name={isLoading ? 'sync-outline' : 'search-outline'}
          size={18}
          color={isLoading ? colors.brand[500] : colors.ink[400]}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.ink[400]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
        />
      </View>
      {actions && <View style={styles.actionsSlot}>{actions}</View>}
    </View>
  );
}

const { colors, spacing, radii } = designTokens;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  actionsSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    height: 44,
  },
  icon: {
    marginEnd: spacing[2],
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'right',
    color: colors.ink[950],
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
});
