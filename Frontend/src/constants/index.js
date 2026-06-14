// ──────────────────────────────────────────────
//  TicketMandu Design Tokens & App Constants
// ──────────────────────────────────────────────

export const APP_NAME = 'TicketMandu';
export const API_BASE_URL = '/api';

// ── Colors ──────────────────────────────────────
export const colors = {
  primary: '#0d1b4b',
  primaryLight: '#1565c0',
  primaryGradient: 'linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)',
  accent: '#7c3aed',
  accentLight: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  bg: '#f4f6fb',
  surface: '#ffffff',
  surfaceAlt: '#f8faff',
  border: '#e0e6ed',
  borderLight: '#f0f4ff',
  textPrimary: '#1a1a2e',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',
};

// ── Spacing (4px base) ──────────────────────────
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

// ── Typography ───────────────────────────────────
export const font = {
  family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  xs: '11px',
  sm: '13px',
  base: '15px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// ── Border Radius ────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ── Shadows ──────────────────────────────────────
export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.10)',
  lg: '0 8px 24px rgba(0,0,0,0.14)',
  xl: '0 20px 60px rgba(0,0,0,0.25)',
};

// ── Category Colors ──────────────────────────────
export const categoryColors = {
  Music:   { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
  Sports:  { bg: '#fff7ed', text: '#ea580c', border: '#fdba74' },
  Arts:    { bg: '#fdf4ff', text: '#a21caf', border: '#e879f9' },
  Comedy:  { bg: '#fefce8', text: '#ca8a04', border: '#fde047' },
  Family:  { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  Theater: { bg: '#fff1f2', text: '#e11d48', border: '#fda4af' },
};

// ── Categories Array ─────────────────────────────
export const CATEGORIES = [
  { id: 'music',   label: 'Music',   icon: '🎵', color: categoryColors.Music   },
  { id: 'sports',  label: 'Sports',  icon: '⚽', color: categoryColors.Sports  },
  { id: 'arts',    label: 'Arts',    icon: '🎨', color: categoryColors.Arts    },
  { id: 'comedy',  label: 'Comedy',  icon: '😂', color: categoryColors.Comedy  },
  { id: 'family',  label: 'Family',  icon: '👨‍👩‍👧', color: categoryColors.Family  },
  { id: 'theater', label: 'Theater', icon: '🎭', color: categoryColors.Theater },
];
