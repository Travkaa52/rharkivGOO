/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens for Kharkiv GO
        forest: {
          DEFAULT: '#0E5A3C', // темно-зелений — primary brand (з мокапу)
          light: '#12513D',
          dark: '#0B3B29'
        },
        gold: {
          DEFAULT: '#C6A552', // золотий — accent (з мокапу)
          light: '#E0C179',
          dark: '#A8842F'
        },
        mint: {
          DEFAULT: '#A8D5BA', // світло-зелений — secondary accent
          light: '#CFE9DA'
        },
        accentBlue: {
          DEFAULT: '#2C7BE5' // синя лінія метро / акцент інтерфейсу (з мокапу)
        },
        graphite: {
          DEFAULT: '#2B2F31', // графітовий — text / dark surfaces
          light: '#3E4346',
          dark: '#1A1D1E'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F5F7F6'
        },
        // Темна тема застосунку (основний вигляд з нового мокапу) —
        // майже чорний зелено-графітовий фон + прозорі темні "скляні" поверхні.
        ink: {
          DEFAULT: '#0A0F0D', // базовий фон застосунку
          soft: '#0F1613', // трохи світліша підкладка (картки, панелі)
          surface: '#141C19', // поверхня картки
          border: 'rgba(255,255,255,0.08)'
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
        'glass-lg': '0 12px 48px 0 rgba(11, 61, 46, 0.22)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)'
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
