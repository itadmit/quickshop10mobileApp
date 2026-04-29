import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { designTokens, fonts } from './theme';

interface FilterTab {
  key: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

// Use ScrollView with flexDirection: 'row' so RTL auto-flips child order
// (FlatList horizontal does NOT auto-flip in RTL, which is why an earlier
// FlatList-based version rendered tabs[0] on the left instead of the right).
export function FilterTabs({ tabs, activeTab, onTabPress }: FilterTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tabs.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabPress(item.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {item.label}
                {item.count != null && item.count > 0 ? ` (${item.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const { colors, spacing, radii } = designTokens;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.ink[50],
    borderWidth: 1,
    borderColor: colors.ink[200],
  },
  tabActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.ink[700],
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
