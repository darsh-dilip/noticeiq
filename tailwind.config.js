/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        gold: {
          50: '#FFF9E6',
          100: '#FFF0C0',
          200: '#FFE07A',
          300: '#F4C542',
          400: '#D4A853',
          500: '#B8860B',
          600: '#9A6E00',
          700: '#7A5500',
        },
        slate: {
          850: '#151928',
          900: '#0D0F18',
          950: '#080A12',
        },
        parchment: {
          50: '#FDFCF8',
          100: '#F7F4EC',
          200: '#EDE8D8',
          300: '#DDD5BC',
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(212, 168, 83, 0.15)',
        'glow-sm': '0 0 10px rgba(212, 168, 83, 0.1)',
        'card': '0 2px 20px rgba(0,0,0,0.06)',
        'card-dark': '0 2px 20px rgba(0,0,0,0.4)',
        'modal': '0 25px 60px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,168,83,0)' }, '50%': { boxShadow: '0 0 0 6px rgba(212,168,83,0.15)' } },
      }
    },
  },
  plugins: [],
}
