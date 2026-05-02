// ============================================
// QuickShop Mobile - Theme Configuration
// עיצוב מינימליסטי בהשראת Apple/Shopify
// RTL Hebrew Support
// ============================================

import { Platform } from 'react-native';

export const colors = {
  // Brand - ירוק כהה מינימליסטי (Shopify inspired)
  primary: '#008060',
  primaryDark: '#006E52',
  primaryLight: '#F0FDF4',

  // Status - צבעים עדינים
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#0284C7',
  infoLight: '#F0F9FF',

  // Order status colors - מינימליסטי
  orderPending: '#D97706',
  orderConfirmed: '#008060',
  orderProcessing: '#0284C7',
  orderShipped: '#6366F1',
  orderDelivered: '#059669',
  orderCancelled: '#DC2626',
  orderRefunded: '#6B7280',

  // Neutrals - מינימליסטי
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#27272A',
  gray900: '#18181B',
  black: '#000000',

  // Background - נקי ופשוט
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F4F5',

  // Text - קריא ונקי
  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textMuted: '#A1A1AA',
  textInverse: '#FFFFFF',

  // Border - עדין
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  borderDark: '#D4D4D8',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const darkColors = {
  ...colors,
  // Override for dark mode
  background: '#18181B',
  surface: '#27272A',
  surfaceSecondary: '#3F3F46',
  
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#18181B',
  
  border: '#3F3F46',
  borderLight: '#27272A',
  borderDark: '#52525B',
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
  24: 96,
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

// צללים מינימליסטיים - עדינים מאוד
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
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// Order status config - מינימליסטי
export const orderStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'ממתינה', color: colors.orderPending, bgColor: colors.warningLight },
  confirmed: { label: 'אושרה', color: colors.orderConfirmed, bgColor: colors.primaryLight },
  processing: { label: 'בטיפול', color: colors.orderProcessing, bgColor: colors.infoLight },
  shipped: { label: 'נשלחה', color: colors.orderShipped, bgColor: '#EEF2FF' },
  delivered: { label: 'נמסרה', color: colors.orderDelivered, bgColor: colors.successLight },
  cancelled: { label: 'בוטלה', color: colors.orderCancelled, bgColor: colors.errorLight },
  refunded: { label: 'זוכתה', color: colors.orderRefunded, bgColor: colors.gray100 },
};

// Fulfillment status config
export const fulfillmentStatusConfig: Record<string, { label: string; color: string }> = {
  unfulfilled: { label: 'לא נשלח', color: colors.warning },
  partial: { label: 'נשלח חלקית', color: colors.info },
  fulfilled: { label: 'נשלח', color: colors.success },
};

// ============================================
// New Design Tokens (v2)
// Added alongside existing theme exports
// ============================================

export const designTokens = {
  colors: {
    brand: {
      50: '#E8EDFB',
      100: '#C5D1F6',
      200: '#9FB2F0',
      300: '#7A93EA',
      400: '#5A78E5',
      500: '#4F63D2',
      600: '#4254B8',
      700: '#35459E',
      800: '#283684',
      900: '#1B276A',
    },
    accent: {
      50: '#FFF3E0',
      100: '#FFE0B2',
      200: '#FFCC80',
      300: '#FFB74D',
      400: '#FFA726',
      500: '#F76707',
      600: '#E65100',
    },
    ink: {
      950: '#09090B',
      900: '#18181B',
      800: '#27272A',
      700: '#3F3F46',
      600: '#52525B',
      500: '#5B5E68',
      400: '#8B8F99',
      300: '#B0B3BC',
      200: '#E5E7EB',
      100: '#F3F4F6',
      50: '#FAFAFA',
    },
    surface: {
      background: '#F8FAFC',
      card: '#FFFFFF',
      elevated: '#FFFFFF',
      sunken: '#F3F4F6',
      onBrand: '#FFFFFF', // Text/icons placed on top of a brand-color surface
    },
    semantic: {
      success: { light: '#ECFDF5', DEFAULT: '#059669', dark: '#047857' },
      warning: { light: '#FFFBEB', DEFAULT: '#D97706', dark: '#B45309' },
      danger: { light: '#FEF2F2', DEFAULT: '#DC2626', dark: '#B91C1C' },
      info: { light: '#EFF6FF', DEFAULT: '#3B82F6', dark: '#1D4ED8' },
      // Return / refund accent — used to mark exchange flow elements.
      return: { light: '#FFF7ED', DEFAULT: '#EA580C', dark: '#9A3412' },
    },
    overlay: {
      light: 'rgba(15, 23, 42, 0.32)',
      scrim: 'rgba(15, 23, 42, 0.45)',
      heavy: 'rgba(15, 23, 42, 0.6)',
    },
    avatar: [
      '#4F63D2',
      '#059669',
      '#D97706',
      '#DC2626',
      '#9333EA',
      '#0891B2',
      '#DB2777',
      '#65A30D',
    ],
    orderStatus: {
      pending: { bg: '#FFFBEB', text: '#B45309', dot: '#D97706' },
      confirmed: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
      processing: { bg: '#E8EDFB', text: '#4254B8', dot: '#4F63D2' },
      shipped: { bg: '#F0FDF4', text: '#047857', dot: '#059669' },
      delivered: { bg: '#ECFDF5', text: '#065F46', dot: '#047857' },
      cancelled: { bg: '#FEF2F2', text: '#B91C1C', dot: '#DC2626' },
      refunded: { bg: '#F3F4F6', text: '#52525B', dot: '#8B8F99' },
    },
  },
  typography: {
    fontFamily: {
      regular: fonts.regular,
      medium: fonts.medium,
      semibold: fonts.semiBold,
      bold: fonts.bold,
      extrabold: fonts.extraBold,
      mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    scale: {
      'body/sm': { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
      'body/md': { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
      'body/lg': { fontSize: 17, lineHeight: 26, fontWeight: '400' as const },
      'heading/sm': { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
      'heading/md': { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
      'heading/lg': { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
      'display/sm': { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
      'display/md': { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
      'display/lg': { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
      'display/2xl': { fontSize: 48, lineHeight: 52, fontWeight: '800' as const },
      'numeric/sm': { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
      'numeric/md': { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
      'numeric/lg': { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
      'numeric/xl': { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
      'numeric/2xl': { fontSize: 36, lineHeight: 42, fontWeight: '800' as const },
    },
  },
  spacing: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
  },
  radii: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    '2xl': 28,
    full: 9999,
  },
  shadows: {
    none: {},
    subtle: {
      shadowColor: '#09090B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#09090B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    floating: {
      shadowColor: '#09090B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;
