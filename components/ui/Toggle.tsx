import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { designTokens } from './theme';

const { colors } = designTokens;

type ToggleSize = 'sm' | 'md';

interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  size?: ToggleSize;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const SIZES: Record<ToggleSize, { trackW: number; trackH: number; thumb: number; pad: number }> = {
  sm: { trackW: 38, trackH: 22, thumb: 18, pad: 2 },
  md: { trackW: 48, trackH: 28, thumb: 24, pad: 2 },
};

export function Toggle({
  value,
  onValueChange,
  size = 'md',
  disabled,
  accessibilityLabel,
  style,
}: ToggleProps) {
  const dims = SIZES[size];
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.ink[200], colors.brand[500]],
  });

  const thumbTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [dims.pad, dims.trackW - dims.thumb - dims.pad],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => !disabled && onValueChange(!value)}
      hitSlop={8}
      style={[
        { width: dims.trackW, height: dims.trackH, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: dims.trackW,
            height: dims.trackH,
            borderRadius: dims.trackH / 2,
            backgroundColor: trackColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: dims.thumb,
              height: dims.thumb,
              borderRadius: dims.thumb / 2,
              transform: [{ translateX: thumbTranslate }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
