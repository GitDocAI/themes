/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./content/**/*.{js,ts,jsx,tsx}', '*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  important: '#__next',
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        nova: {
          50: '#fafbfc',
          100: '#f4f5f7',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        accent: {
          primary: '#5d5dff',   // Nova Purple - mantener como elemento de Nova
          secondary: '#10b981', // Emerald for success
          tertiary: '#3b82f6',  // Blue for links
          warning: '#f59e0b',   // Amber
          danger: '#ef4444',    // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'SF Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 4s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 16px rgba(22, 163, 74, 0.3)' },
          '100%': { boxShadow: '0 0 24px rgba(22, 163, 74, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGreen: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'glass': '0 4px 24px 0 rgba(31, 38, 135, 0.2)',
        'nova': '0 2px 16px 0 rgba(0, 0, 0, 0.06)',
        'glow': '0 0 16px rgba(22, 163, 74, 0.3)',
        'glow-lg': '0 0 24px rgba(22, 163, 74, 0.4)',
        'code': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
    gridTemplateAreas: {
      'layout': [
        'header header',
        'sidebar content',
        'footer footer',
      ],
    },
  },
  plugins: [],
}
