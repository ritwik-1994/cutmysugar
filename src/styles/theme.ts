import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Brand Colors (Teal/Ocean)
  primary: '#0F766E', // Teal 700 - Main Brand
  secondary: '#134E4A', // Teal 900 - Darker Accent
  accent: '#2DD4BF', // Teal 400 - Bright Accent

  // Semantic
  success: '#10B981', // Emerald 500
  warning: '#F59E0B', // Amber 500
  danger: '#EF4444', // Red 500
  info: '#3B82F6', // Blue 500

  // Backgrounds (Cream/Off-White)
  background: '#FFFBEB', // Amber 50 (Warm Cream)
  surface: '#FFFFFF', // White
  surfaceLight: '#FEF3C7', // Amber 100 (Light Cream)
  divider: '#E5E7EB', // Gray 200

  // Text (Slate)
  text: '#1E293B', // Slate 800
  textSecondary: '#475569', // Slate 600
  textTertiary: '#94A3B8', // Slate 400
  textDisabled: '#CBD5E1', // Slate 300

  // Glass
  glass: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.6)',

  // CutMySugar Specific
  brand: {
    primary: '#0F766E',
    secondary: '#134E4A',
    accent: '#2DD4BF',
  },

  // Sugar Score Colors
  sugarScore: {
    safe: '#D1FAE5', // Emerald 100
    safeText: '#065F46', // Emerald 800
    warning: '#FEF3C7', // Amber 100
    warningText: '#92400E', // Amber 800
    danger: '#FEE2E2', // Red 100
    criticalText: '#991B1B', // Red 800
  },

  // Legacy mappings for compatibility (will refactor later)
  gl: {
    safe: '#D1FAE5',
    safeText: '#065F46',
    warning: '#FEF3C7',
    warningText: '#92400E',
    critical: '#FEE2E2',
    criticalText: '#991B1B',
  },
  spike: {
    slow: '#E0F2FE', // Sky 100
    moderate: '#F3E8FF', // Purple 100
    fast: '#FFE4E6', // Rose 100
  },
  actions: {
    replaceBg: '#ECFDF5',
    replaceText: '#047857',
    addBg: '#EFF6FF',
    addText: '#1D4ED8',
  },
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FONTS = {
  // We will load these in App.tsx
  heading: 'Outfit_700Bold',
  subheading: 'Outfit_600SemiBold',
  body: 'Outfit_400Regular',
  bodyBold: 'Outfit_700Bold',
  medium: 'Outfit_500Medium',
};

export const SIZES = {
  width,
  height,
  borderRadius: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
};
