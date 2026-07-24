/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens for Kharkiv GO
        forest: {
          DEFAULT: '#0B3D2E', // темно-зелений — primary brand
          light: '#12513D',
          dark: '#072B20'
        },
        gold: {
          DEFAULT: '#C9A24B', // золотий — accent
          light: '#E0C179',
          dark: '#A8842F'
        },
        mint: {
          DEFAULT: '#A8D5BA', // світло-зелений — secondary accent
          light: '#CFE9DA'
        },
        graphite: {
          DEFAULT: '#2B2F31', // графітовий — text / dark surfaces
          light: '#3E4346',
          dark: '#1A1D1E'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F5F7F6'
        }
      },
      fontFamily: {
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xl2: '1.5rem',
        xl3: '2rem'
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(11, 61, 46, 0.15)',
        'glass-lg': '0 12px 48px 0 rgba(11, 61, 46, 0.22)'
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        'slide-up': {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.25s ease-out',
        marquee: 'marquee 4s linear infinite'
      }
    }
  },
  plugins: []
};
