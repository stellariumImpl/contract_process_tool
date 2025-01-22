/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    {
      pattern: /handsontable.*/,
    },
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#121212',
          darkgray: '#282828',
          lightgray: '#B3B3B3',
        },
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        'slide-out': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' }
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' }
        },
        'glow': {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-4px)',
          },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'bounce': 'bounce 1s infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            p: {
              marginTop: '1em',
              marginBottom: '1em',
            },
          },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-purple': '0 0 15px rgba(147, 51, 234, 0.5)',
        'glow-gray': '0 0 15px rgba(75, 85, 99, 0.5)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}