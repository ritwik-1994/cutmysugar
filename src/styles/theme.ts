import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Brand Colors (Blood & Sugar)
  primary: '#BE123C', // Rose 700 - Deep Blood Red
  secondary: '#881337', // Rose 900 - Coagulated/Dark Blood
  accent: '#F43F5E', // Rose 500 - Bright Arterial Blood (CTA)

  // Semantic
  success: '#10B981', // Emerald 500
  warning: '#F59E0B', // Amber 500
  danger: '#E11D48', // Rose 600 - Alert
  info: '#3B82F6', // Blue 500

  // Backgrounds (Sugar White)
  background: '#FFFFFF', // Pure Sugar White
  surface: '#FFFFFF', // White
  surfaceLight: '#FFF1F2', // Rose 50 (Very faint pink tint)
  divider: '#FECDD3', // Rose 200 (Subtle red divider)

  // Text
  text: '#881337', // Rose 900 - Dark Red Text (High contrast)
  textSecondary: '#9F1239', // Rose 800
  textTertiary: '#FB7185', // Rose 400 - Darker for better visibility
  textDisabled: '#E2E8F0', // Slate 200

  // Glass
  glass: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(190, 18, 60, 0.2)', // Red tint border

  // CutMySugar Specific
  brand: {
    primary: '#BE123C',
    secondary: '#881337',
    accent: '#F43F5E',
  },

  // Sugar Score Colors (Red Scale)
  sugarScore: {
    safe: '#ECFDF5',
    safeText: '#047857',
    safeBorder: '#D1FAE5',

    warning: '#FFFBEB',
    warningText: '#B45309',
    warningBorder: '#FEF3C7',

    danger: '#FFF1F2', // Rose 50
    criticalText: '#881337', // Rose 900
    dangerBorder: '#FECDD3', // Rose 200
  },

  // Legacy mappings
  gl: {
    safe: '#ECFDF5',
    safeText: '#047857',
    warning: '#FFFBEB',
    warningText: '#B45309',
    critical: '#FFF1F2',
    criticalText: '#881337',
  },
  spike: {
    slow: '#F0F9FF',
    moderate: '#FAF5FF',
    fast: '#FFF1F2',
  },
  actions: {
    replaceBg: '#ECFDF5',
    replaceText: '#047857',
    addBg: '#FFF1F2',
    addText: '#BE123C',
  },

  // Metallic Finishes
  metallic: {
    silver: ['#F8FAFC', '#E2E8F0', '#CBD5E1'], // White -> Slate 200 -> Slate 300
    roseGold: ['#FFF1F2', '#FECDD3', '#FDA4AF'], // Rose 50 -> Rose 200 -> Rose 300
    whiteGold: ['#FFFFFF', '#F9FAFB', '#F3F4F6'], // Pure White -> Gray 50 -> Gray 100
    textGradient: ['#881337', '#BE123C'], // Dark Blood -> Bright Blood
    borderHighlight: 'rgba(255, 255, 255, 0.8)',
    borderShadow: 'rgba(190, 18, 60, 0.15)',

    // Hyper-Metallic (Chrome/Gloss)
    chrome: ['#FFFFFF', '#E2E8F0', '#94A3B8', '#E2E8F0', '#FFFFFF'], // Multi-stop reflective silver
    goldChrome: ['#FFF1F2', '#FECDD3', '#F43F5E', '#FECDD3', '#FFF1F2'], // Multi-stop reflective rose gold
    glassOverlay: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.1)', 'transparent'], // Top-down shine
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
    s: 12,
    m: 20,
    l: 28,
    xl: 36,
  },
};

export const SHADOWS = {
  light: {
    shadowColor: '#BE123C', // Red shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: '#881337', // Darker red shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
};
