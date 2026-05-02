import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text, Label } from './Text';
import { spacing, fonts, fontSizes, designTokens } from './theme';

const dt = designTokens;

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

// מינימליסטי - שדות קלט נקיים
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
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              inputStyle,
            ]}
            placeholderTextColor={dt.colors.ink[400]}
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
    marginBottom: spacing[1.5],
    textAlign: 'right',
    alignSelf: 'flex-start',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dt.colors.surface.card,
    borderWidth: 1.5,
    borderColor: dt.colors.ink[200],
    borderRadius: dt.radii.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: dt.colors.semantic.danger.DEFAULT,
  },
  inputDisabled: {
    backgroundColor: dt.colors.ink[100],
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  inputWithLeftIcon: {
    paddingStart: spacing[2],
  },
  inputWithRightIcon: {
    paddingEnd: spacing[2],
  },
  iconLeft: {
    paddingStart: spacing[3],
  },
  iconRight: {
    paddingEnd: spacing[3],
  },
  errorText: {
    marginTop: spacing[1],
    textAlign: 'right',
  },
  hintText: {
    marginTop: spacing[1],
    textAlign: 'right',
  },
});
