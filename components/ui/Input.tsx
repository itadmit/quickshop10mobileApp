import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text, Label } from './Text';
import { colors, spacing, borderRadius, fonts, fontSizes } from './theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: object;
  inputStyle?: object;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Label style={styles.label}>{label}</Label>
        )}
        <View
          style={[
            styles.inputWrapper,
            hasError && styles.inputError,
            props.editable === false && styles.inputDisabled,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              inputStyle,
            ]}
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              style={styles.iconRight}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text size="sm" color="error" style={styles.errorText}>
            {error}
          </Text>
        )}
        {hint && !error && (
          <Text size="sm" color="muted" style={styles.hintText}>
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    marginBottom: spacing[2],
  },
  inputWrapper: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },
  inputWithRightIcon: {
    paddingRight: spacing[2],
  },
  iconLeft: {
    paddingLeft: spacing[3],
  },
  iconRight: {
    paddingRight: spacing[3],
  },
  errorText: {
    marginTop: spacing[1],
  },
  hintText: {
    marginTop: spacing[1],
  },
});

