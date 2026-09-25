import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: 'hsl(var(--slate-50) / <alpha-value>)',
          100: 'hsl(var(--slate-100) / <alpha-value>)',
          200: 'hsl(var(--slate-200) / <alpha-value>)',
          300: 'hsl(var(--slate-300) / <alpha-value>)',
          400: 'hsl(var(--slate-400) / <alpha-value>)',
          500: 'hsl(var(--slate-500) / <alpha-value>)',
          600: 'hsl(var(--slate-600) / <alpha-value>)',
          700: 'hsl(var(--slate-700) / <alpha-value>)',
          750: 'hsl(var(--slate-750) / <alpha-value>)',
          800: 'hsl(var(--slate-800) / <alpha-value>)',
          850: 'hsl(var(--slate-850) / <alpha-value>)',
          900: 'hsl(var(--slate-900) / <alpha-value>)',
          950: 'hsl(var(--slate-950) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
          fg: 'hsl(var(--brand-fg) / <alpha-value>)',
          bg: 'hsl(var(--brand-bg) / <alpha-value>)',
          border: 'hsl(var(--brand-border) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          fg: 'hsl(var(--success-fg) / <alpha-value>)',
          bg: 'hsl(var(--success-bg) / <alpha-value>)',
          border: 'hsl(var(--success-border) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          fg: 'hsl(var(--warning-fg) / <alpha-value>)',
          bg: 'hsl(var(--warning-bg) / <alpha-value>)',
          border: 'hsl(var(--warning-border) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          fg: 'hsl(var(--danger-fg) / <alpha-value>)',
          bg: 'hsl(var(--danger-bg) / <alpha-value>)',
          border: 'hsl(var(--danger-border) / <alpha-value>)',
        },
        critical: {
          DEFAULT: 'hsl(var(--critical) / <alpha-value>)',
          fg: 'hsl(var(--critical-fg) / <alpha-value>)',
          bg: 'hsl(var(--critical-bg) / <alpha-value>)',
          border: 'hsl(var(--critical-border) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          fg: 'hsl(var(--info-fg) / <alpha-value>)',
          bg: 'hsl(var(--info-bg) / <alpha-value>)',
          border: 'hsl(var(--info-border) / <alpha-value>)',
        },
        neutral: {
          DEFAULT: 'hsl(var(--neutral) / <alpha-value>)',
          fg: 'hsl(var(--neutral-fg) / <alpha-value>)',
          bg: 'hsl(var(--neutral-bg) / <alpha-value>)',
          border: 'hsl(var(--neutral-border) / <alpha-value>)',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
