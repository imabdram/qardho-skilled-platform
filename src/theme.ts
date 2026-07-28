/**
 * Suuqa Xirfadaha (Qardho Skilled Platform)
 * Central Theme & Brand Palette Configuration
 * 
 * ==============================================================================
 * BLUE COLOR THEME CONFIGURATION
 * ==============================================================================
 * All brand colors are defined here in blue.
 * 
 * 1. Modify the hex codes below in THEME_COLORS (Primary, Hover, Accent, etc.)
 * 2. Update the corresponding CSS variables in `src/index.css` (:root & @theme)
 * 3. Use BRAND_CLASSES helpers across components for consistent button & card styles
 * ==============================================================================
 */

export const THEME_COLORS = {
  // Primary Brand Colors (Vibrant Royal Blue Palette)
  primary: {
    DEFAULT: '#2563eb', // Main brand color (Primary Buttons, Card Hover Border, Active Nav)
    hover: '#1d4ed8',   // Hover state for primary buttons & cards
    active: '#1e40af',  // Active / Pressed state
    light: '#3b82f6',   // Lighter shade for accents
  },

  // Secondary Accent Colors
  accent: {
    DEFAULT: '#3b82f6', // Focus rings, secondary highlights
    hover: '#1d4ed8',
  },

  // Blue Soft Tints (Pills, Badges, Status Tags)
  blue: {
    50: '#eff6ff',      // Very light blue tint for badge backgrounds
    100: '#dbeafe',     // Soft badge border
    600: '#2563eb',     // Blue icons & status dots
    700: '#1d4ed8',     // Darker blue text
    800: '#1e40af',     // Heavy badge text
  },

  // Page Backgrounds & Neutral Surfaces
  neutral: {
    pageBg: '#f8fafc',   // Main page background
    pageDeep: '#f1f5f9', // Deeper section background
    cardBg: '#ffffff',   // Card surface background
    border: '#e2e8f0',   // Border color for cards & inputs
    textDark: '#0f172a', // Primary heading text
    textMuted: '#64748b',// Subtitle & body text
  },
} as const;

/**
 * Reusable Tailwind Class Mappings for Component Styling
 */
export const BRAND_CLASSES = {
  // Primary Action Button (Royal Blue)
  buttonPrimary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] active:bg-[#1e40af] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]',

  // Secondary Action Button (Outline / Soft Fill)
  buttonSecondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]',

  // Active Navigation Link
  navActive: 'bg-[#2563eb] text-white',

  // Card Container with Brand Hover Border
  cardContainer: 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#2563eb] hover:shadow-md',
};
