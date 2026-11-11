import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Map existing ClubPulse design tokens to Tailwind names
      colors: {
        // Base backgrounds
        'cp-bg':        '#10111f',
        'cp-sidebar':   '#141526',
        'cp-panel':     '#1a1b2f',
        'cp-panel2':    '#202139',
        'cp-line':      '#2d2e49',
        // Text
        'cp-text':      '#f3f4fc',
        'cp-muted':     '#9b9db9',
        'cp-muted2':    '#777a9b',
        // Brand accents
        'cp-violet':    '#a097ff',
        'cp-lime':      '#c6ff3d',
        'cp-mint':      '#75dba5',
        'cp-amber':     '#ffcb7a',
        'cp-ember':     '#ff9a5c',
        'cp-pink':      '#f2a0bc',
        // Landing page tokens
        'land-bg':      '#0d0f1b',
        'land-panel':   '#15182a',
        'land-line':    '#2c3048',
        'land-violet':  '#a99dff',
        'land-mint':    '#83e3c3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'eyebrow': ['9px',  { letterSpacing: '1.8px', fontWeight: '850' }],
        '2xs':     ['8px',  { lineHeight: '1.5' }],
        'xs':      ['10px', { lineHeight: '1.6' }],
        'sm':      ['11px', { lineHeight: '1.7' }],
        'base':    ['13px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '9px',
        'lg':  '12px',
        'xl':  '14px',
        '2xl': '17px',
      },
      boxShadow: {
        'panel':  '0 4px 20px rgba(0,0,0,0.3)',
        'card':   '0 8px 32px rgba(0,0,0,0.4)',
        'violet': '0 10px 30px rgba(120,104,237,0.23)',
        'glow':   '0 0 12px rgba(160,151,255,0.4)',
        'mint':   '0 0 8px rgba(131,227,195,0.5)',
      },
      backgroundImage: {
        'gradient-violet': 'linear-gradient(130deg, #9a8cff, #7465e8)',
        'gradient-panel':  'linear-gradient(145deg, var(--n-panel), color-mix(in srgb, var(--n-panel) 92%, var(--n-violet) 8%))',
        'gradient-hero':   'radial-gradient(ellipse at 83% 30%, #8376f62f, transparent 38%), linear-gradient(120deg, #262344, #1a1b30 76%)',
      },
      screens: {
        'xs':  '380px',
        'sm':  '560px',
        'md':  '850px',
        'lg':  '1200px',
        'xl':  '1440px',
      },
      spacing: {
        '13': '52px',
        '15': '60px',
        '18': '72px',
      },
      animation: {
        'up':    'next-up 0.28s ease both',
        'spin':  'nextspin 0.7s linear infinite',
        'float': 'cp-float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
  // Let existing globals.css classes coexist — Tailwind adds on top
  corePlugins: {
    preflight: false,  // Don't reset base styles — globals.css already handles this
  },
};

export default config;
