// ============================================
// QuickShop Mobile - Theme Configuration
// פונט: Assistant לעברית
// ============================================

export const colors = {
  // Brand - ירוק כהה (דומה לשופיפיי אבל שונה)
  primary: '#00785C',
  primaryDark: '#005A45',
  primaryLight: '#E6F4F0',

  // Secondary - ירוק בהיר יותר
  secondary: '#00A67E',
  secondaryDark: '#007A5E',
  secondaryLight: '#CCF0E3',

  // Status
  success: '#22c55e',
  successLight: '#bbf7d0',
  warning: '#f59e0b',
  warningLight: '#fde68a',
  error: '#ef4444',
  errorLight: '#fecaca',
  info: '#06b6d4',
  infoLight: '#a5f3fc',

  // Order status colors
  orderPending: '#f59e0b',
  orderConfirmed: '#00785C',
  orderProcessing: '#00A67E',
  orderShipped: '#06b6d4',
  orderDelivered: '#22c55e',
  orderCancelled: '#ef4444',
  orderRefunded: '#6b7280',

  // Neutrals - Light
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',

  // Background
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceSecondary: '#f3f4f6',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',

  // Border
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const darkColors = {
  ...colors,
  // Override for dark mode
  background: '#111827',
  surface: '#1f2937',
  surfaceSecondary: '#374151',
  
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textInverse: '#111827',
  
  border: '#374151',
  borderLight: '#1f2937',
  borderDark: '#4b5563',
} as const;

export const fonts = {
  // Assistant font family
  regular: 'Assistant_400Regular',
  medium: 'Assistant_500Medium',
  semiBold: 'Assistant_600SemiBold',
  bold: 'Assistant_700Bold',
  extraBold: 'Assistant_800ExtraBold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// Order status config
export const orderStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'ממתינה', color: colors.orderPending, bgColor: colors.warningLight },
  confirmed: { label: 'אושרה', color: colors.orderConfirmed, bgColor: '#E6F4F0' },
  processing: { label: 'בטיפול', color: colors.orderProcessing, bgColor: '#CCF0E3' },
  shipped: { label: 'נשלחה', color: colors.orderShipped, bgColor: colors.infoLight },
  delivered: { label: 'נמסרה', color: colors.orderDelivered, bgColor: colors.successLight },
  cancelled: { label: 'בוטלה', color: colors.orderCancelled, bgColor: colors.errorLight },
  refunded: { label: 'זוכתה', color: colors.orderRefunded, bgColor: colors.gray200 },
};

// Fulfillment status config
export const fulfillmentStatusConfig: Record<string, { label: string; color: string }> = {
  unfulfilled: { label: 'לא נשלח', color: colors.warning },
  partial: { label: 'נשלח חלקית', color: colors.info },
  fulfilled: { label: 'נשלח', color: colors.success },
};

