import React from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, type ToastType } from '@/lib/utils/toast';
import { Text } from './Text';
import { fonts, spacing, designTokens } from './theme';

const dt = designTokens;

const TYPE_CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
  success: { icon: 'checkmark-circle', bg: dt.colors.semantic.success.DEFAULT, color: '#FFFFFF' },
  error: { icon: 'alert-circle', bg: dt.colors.semantic.danger.DEFAULT, color: '#FFFFFF' },
  info: { icon: 'information-circle', bg: dt.colors.ink[800], color: '#FFFFFF' },
};

function ToastItem({ id, message, type }: { id: number; message: string; type: ToastType }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const config = TYPE_CONFIG[type];

  const slideAnim = React.useRef(new Animated.Value(80)).current;
  React.useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }, [slideAnim]);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.toastInner} onPress={() => dismiss(id)} activeOpacity={0.8}>
        <Text style={[styles.toastText, { color: config.color }]} numberOfLines={2}>{message}</Text>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 60 }]} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 9999,
    gap: spacing[2],
  },
  toast: {
    borderRadius: dt.radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    textAlign: 'right',
  },
});
