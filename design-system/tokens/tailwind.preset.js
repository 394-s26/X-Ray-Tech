/**
 * X-Ray Tech Design System — Tailwind preset
 *
 * Use in your project:
 *
 *   // tailwind.config.js
 *   const brand = require('./design-system/tokens/tailwind.preset.js')
 *   module.exports = {
 *     presets: [brand],
 *     content: ['./src/**\/*.{ts,tsx,mdx}'],
 *   }
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F4F0FE',
          100: '#E5DDFC',
          200: '#C9B8F8',
          300: '#A78EF3',
          400: '#8366ED',
          500: '#6E50E9',
          600: '#5B3FE4',
          700: '#4A2FCC',
          800: '#3A23A8',
          900: '#1C0F5C',
        },
        'ink-purple': '#4E2A84',
        ink: {
          100: '#F4F3F7',
          200: '#E5E3EC',
          300: '#C9C5D2',
          400: '#9A95A6',
          500: '#6C677A',
          600: '#4A4659',
          700: '#2D2A3D',
          900: '#0E0B1F',
        },
        paper:   '#FFFFFF',
        surface: '#FAFAFC',
        line: {
          DEFAULT: '#E5E3EC',
          soft:    '#F0EEF5',
        },
        success: { 100: '#E2F5EC', 600: '#1F9D6B' },
        warn:    { 100: '#FBF2DC', 600: '#C08415' },
        danger:  { 100: '#FAE4E2', 600: '#C8382F' },
        info:    { 100: '#E5DDFC', 600: '#5B3FE4' },
      },
      fontFamily: {
        display: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        serif:   ['ui-serif', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '80px', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '64px', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'h1':         ['40px', { lineHeight: '48px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h2':         ['32px', { lineHeight: '40px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h3':         ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h4':         ['20px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg':    ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md':    ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm':    ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption':    ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'overline':   ['11px', { lineHeight: '16px', letterSpacing: '0.06em', fontWeight: '600' }],
        'mono-xl':    ['48px', { lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'mono-lg':    ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'mono-md':    ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'mono-sm':    ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: {
        'none': '0px',
        'xs':   '4px',
        'sm':   '6px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '20px',
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(14, 11, 31, 0.04)',
        'sm': '0 1px 3px rgba(14, 11, 31, 0.06), 0 1px 2px rgba(14, 11, 31, 0.04)',
        'md': '0 4px 12px rgba(14, 11, 31, 0.06), 0 2px 4px rgba(14, 11, 31, 0.04)',
        'lg': '0 12px 32px rgba(14, 11, 31, 0.08), 0 4px 8px rgba(14, 11, 31, 0.04)',
        'xl': '0 24px 48px rgba(14, 11, 31, 0.10), 0 8px 16px rgba(14, 11, 31, 0.06)',
      },
      transitionDuration: {
        'xs': '80ms',
        'sm': '160ms',
        'md': '240ms',
        'lg': '480ms',
        'xl': '720ms',
      },
      transitionTimingFunction: {
        'out':      'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        'container':     '1200px',
        'reading':       '680px',
        'hero-subcopy':  '520px',
      },
      screens: {
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },
    },
  },
}
